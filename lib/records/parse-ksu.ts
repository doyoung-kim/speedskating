import type {
  Affiliation,
  Athlete,
  Division,
  Gender,
  Lane,
  MeetEvent,
  RecordsFile,
  Result,
  ResultStatus,
} from "@/lib/records/types";

const REGIONS =
  "서울|경기|강원|인천|충남|충북|경북|경남|전북|전남|세종|부산|대전|광주|울산|제주|대구";

const LANE = "IN|OUT|흰|파|빨|노|보|검|주|\\d{1,2}";
const FLAGS = "(?:\\s*(?:\\(\\d+\\)|대회신|대회타이|MT))*";
const RESULT_RE = new RegExp(
  `^(?:(\\d+)\\s+)?(.+?)\\s+((?:\\d{1,2}:)?\\d{1,2}\\.\\d{2,3}|DQ|DNS|DNF)(${FLAGS})\\s*(${REGIONS})(${LANE})(.+)$`,
);
const EVENT_RE =
  /(\d+)\.\s*(남자|여자)(일반부|실업부|대학부|고등부|중학부|초등\d학년(?:\([^)]*\))?|부)?\s*(\d+)M/;
const DATE_RE = /^(.*?)OFFICIAL RESULTS:\s*(\d{4})\.(\d{2})\.(\d{2})/;
const TITLE_RE = /^(\d{4}\s+.+)$/;

export type ParsedMeet = {
  file: RecordsFile;
  unmatched: string[];
};

function inferDivision(name: string): Division {
  if (name.includes("초등학교") || name.includes("초등")) return "elementary";
  if (name.includes("중학교")) return "middle";
  if (name.includes("고등학교") || name.includes("여고")) return "high";
  if (name.includes("대학교") || name.includes("대학")) return "univ";
  return "general";
}

function parseTimeMs(display: string) {
  const match = display.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  const fraction = Number(match[3].padEnd(3, "0").slice(0, 3));
  return minutes * 60_000 + seconds * 1_000 + fraction;
}

function slug(value: string) {
  return value.trim().replace(/\s+/g, "-").toLowerCase();
}

function shouldSkip(line: string) {
  return (
    line.startsWith("---") ||
    line.startsWith("순위") ||
    line.startsWith("Page ") ||
    line === "이름" ||
    line === "결승" ||
    line.includes("Starter") ||
    line.includes("Data processing")
  );
}

export function parseKsuLines(lines: string[]): ParsedMeet {
  const events: MeetEvent[] = [];
  const affiliations = new Map<string, Affiliation>();
  const athletes = new Map<string, Athlete>();
  const results: Result[] = [];
  const unmatched: string[] = [];

  let title = "스피드스케이팅 기록회";
  let venue = "장소 미상";
  let date: string | null = null;
  let event: MeetEvent | null = null;
  let skipEvent = false;
  const round = "결승";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || shouldSkip(line)) continue;

    const dateMatch = line.match(DATE_RE);
    if (dateMatch) {
      const place = dateMatch[1].trim();
      if (place) venue = place;
      date = `${dateMatch[2]}-${dateMatch[3]}-${dateMatch[4]}`;
      continue;
    }

    if (line.includes("스피드") && !line.includes("OFFICIAL") && !/\d+\.\d{2}/.test(line)) {
      title = line.match(TITLE_RE)?.[1]?.trim() || line;
      continue;
    }

    const eventMatch = line.match(EVENT_RE);
    if (eventMatch) {
      if (!date) {
        unmatched.push(line);
        continue;
      }
      const genderWord = eventMatch[2];
      const gender: Gender = genderWord === "남자" ? "M" : "F";
      const category = `${genderWord}${eventMatch[3] ?? ""}`;
      if (category.includes("(B조)")) {
        event = null;
        skipEvent = true;
        continue;
      }
      skipEvent = false;
      const distance = Number(eventMatch[4]);
      const id = `${date}-${category}-${distance}`;
      const existing = events.find((item) => item.id === id);
      if (existing) {
        event = existing;
      } else {
        event = {
          id,
          competitionId: "",
          date,
          gender,
          distance,
          round,
          label: `${category} ${distance}m`,
        };
        events.push(event);
      }
      continue;
    }

    if (skipEvent) continue;

    const resultMatch = line.match(RESULT_RE);
    if (!resultMatch || !event) {
      unmatched.push(line);
      continue;
    }

    const rank = resultMatch[1] ? Number(resultMatch[1]) : null;
    const affiliationName = resultMatch[2].trim();
    const token = resultMatch[3];
    const recordFlag =
      [...resultMatch[4].matchAll(/\(\d+\)|대회신|대회타이|MT/g)].map((item) => item[0]).join(" ") ||
      null;
    const region = resultMatch[5];
    const lane = resultMatch[6] as Lane;
    const athleteName = resultMatch[7].trim();
    const status: ResultStatus =
      token === "DQ" ? "dq" : token === "DNS" ? "dns" : token === "DNF" ? "dnf" : "ok";
    const timeDisplay = status === "ok" ? token : null;
    const timeMs = timeDisplay ? parseTimeMs(timeDisplay) : null;
    const division = inferDivision(affiliationName);

    const affiliationId = `aff-${slug(affiliationName)}-${region}`;
    if (!affiliations.has(affiliationId)) {
      affiliations.set(affiliationId, {
        id: affiliationId,
        name: affiliationName,
        region,
        division,
      });
    }

    const athleteId = `ath-${slug(athleteName)}-${affiliationId}`;
    if (!athletes.has(athleteId)) {
      athletes.set(athleteId, {
        id: athleteId,
        name: athleteName,
        nameNormalized: athleteName.replace(/\s+/g, "").toLowerCase(),
        affiliationId,
      });
    }

    results.push({
      id: `${event.id}-${rank ?? status}-${athleteId}`,
      eventId: event.id,
      athleteId,
      affiliationId,
      division,
      rank,
      divisionRank: null,
      timeMs,
      timeDisplay,
      lane,
      recordFlag,
      status,
      reason: null,
    });
  }

  for (const current of events) {
    const finished = results.filter(
      (row) => row.eventId === current.id && row.status === "ok" && row.timeMs != null,
    );
    const byDivision = new Map<Division, Result[]>();
    for (const row of finished) {
      const list = byDivision.get(row.division) ?? [];
      list.push(row);
      byDivision.set(row.division, list);
    }
    for (const list of byDivision.values()) {
      list.sort((a, b) => (a.timeMs ?? 0) - (b.timeMs ?? 0) || (a.rank ?? 0) - (b.rank ?? 0));
      list.forEach((row, index) => {
        row.divisionRank = index + 1;
      });
    }
  }

  const dates = events.map((item) => item.date).sort();
  const startDate = dates[0] ?? "날짜 미상";
  const endDate = dates[dates.length - 1] ?? startDate;
  const competitionId = `upload-${slug(startDate)}-${slug(title)}`;

  for (const item of events) item.competitionId = competitionId;
  for (const item of events) {
    const localId = item.id;
    item.id = `${competitionId}__${localId}`;
  }
  for (const result of results) {
    result.eventId = `${competitionId}__${result.eventId}`;
    result.id = `${competitionId}__${result.id}`;
  }

  return {
    file: {
      competition: {
        id: competitionId,
        name: title,
        venue,
        startDate,
        endDate,
        certified: title.includes("공인"),
        organizer: "KSU",
      },
      events,
      affiliations: [...affiliations.values()],
      athletes: [...athletes.values()],
      results,
    },
    unmatched,
  };
}

const ROSTER_RESULT_RE = new RegExp(
  `^(-|\\d+)\\s+\\d+\\s+(\\S+(?:\\s+[A-Z]\\.)?)\\s+(.+?)\\s+(?:\\d\\s+)?(${REGIONS})\\s+\\d+조\\s+(\\d*[IO])\\s+(-|(?:\\d{1,2}:)?\\d+\\.\\d{2,3}|DQ|DNS|DNF)(?:\\s+(DQ|DNS|DNF))?$`,
);
const ROSTER_RANGE_RE =
  /^(?:(.+?)\s+)?OFFICIAL RESULTS:\s*(\d{4})\.(\d{2})\.(\d{2})(?:\s*~\s*(?:(\d{4})\.)?(\d{2})\.(\d{2}))?\s*\|?\s*(.*)$/;
const ROSTER_SINGLE_EVENT_RE = /^(\d+)\.\s*(남자|여자)부\s+(\d+)M(?!\s*[\/&])/;
const ROSTER_SINGLE_DATE_RE = /\((\d{4})\.(\d{2})\.(\d{2})\)/;
const ROSTER_GENDER_RE = /^(남자|여자)부$/;
const ROSTER_DISTANCE_RE = /^(\d+)M$/;

function normalizeRosterLane(token: string): Lane {
  if (token.endsWith("I")) return "IN";
  if (token.endsWith("O")) return "OUT";
  return token;
}

function skipRosterLine(line: string) {
  return (
    shouldSkip(line) ||
    line.startsWith("순위") ||
    line.startsWith("종목") ||
    line.includes("Official Results Page")
  );
}

export function parseKsuRosterLines(lines: string[], competitionId: string): ParsedMeet {
  const events: MeetEvent[] = [];
  const affiliations = new Map<string, Affiliation>();
  const athletes = new Map<string, Athlete>();
  const results: Result[] = [];
  const unmatched: string[] = [];

  let title = "스피드스케이팅 공인기록회";
  let venue = "장소 미상";
  let startDate: string | null = null;
  let endDate: string | null = null;
  let event: MeetEvent | null = null;
  let pendingGender: Gender | null = null;
  let sectionDate: string | null = null;
  let pendingResult = "";

  function openEvent(gender: Gender, distance: number, date: string) {
    const id = `${date}-${gender}-${distance}`;
    const existing = events.find((item) => item.id === id);
    if (existing) {
      event = existing;
      return;
    }
    event = {
      id,
      competitionId,
      date,
      gender,
      distance,
      round: "결승",
      label: `${gender === "M" ? "남자부" : "여자부"} ${distance}m`,
    };
    events.push(event);
  }

  function addResult(line: string) {
    const resultMatch = line.match(ROSTER_RESULT_RE);
    if (!resultMatch || !event) return false;
    const rank = resultMatch[1] === "-" ? null : Number(resultMatch[1]);
    const athleteName = resultMatch[2].trim();
    const affiliationName = resultMatch[3].trim();
    const region = resultMatch[4];
    const lane = normalizeRosterLane(resultMatch[5]);
    const token = resultMatch[6];
    const note = resultMatch[7];
    const status: ResultStatus =
      note === "DQ" || token === "DQ"
        ? "dq"
        : note === "DNF" || token === "DNF"
          ? "dnf"
          : note === "DNS" || token === "DNS" || token === "-"
            ? "dns"
            : "ok";
    const timeDisplay = status === "ok" ? token : null;
    const timeMs = timeDisplay ? parseTimeMs(timeDisplay) : null;
    const division = inferDivision(affiliationName);
    const affiliationId = `aff-${slug(affiliationName)}-${region}`;
    if (!affiliations.has(affiliationId)) {
      affiliations.set(affiliationId, {
        id: affiliationId,
        name: affiliationName,
        region,
        division,
      });
    }
    const athleteId = `ath-${slug(athleteName)}-${affiliationId}`;
    if (!athletes.has(athleteId)) {
      athletes.set(athleteId, {
        id: athleteId,
        name: athleteName,
        nameNormalized: athleteName.replace(/\s+/g, "").toLowerCase(),
        affiliationId,
      });
    }
    const rankKey = rank == null ? status : String(rank);
    results.push({
      id: `${event.id}-${rankKey}-${athleteId}`,
      eventId: event.id,
      athleteId,
      affiliationId,
      division,
      rank,
      divisionRank: null,
      timeMs,
      timeDisplay,
      lane,
      recordFlag: null,
      status,
      reason: null,
    });
    return true;
  }

  function takePending() {
    if (!pendingResult) return;
    if (!addResult(pendingResult)) unmatched.push(pendingResult);
    pendingResult = "";
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || skipRosterLine(line)) continue;

    const rangeMatch = line.match(ROSTER_RANGE_RE);
    if (rangeMatch) {
      takePending();
      if (rangeMatch[1]?.includes("스피드")) title = rangeMatch[1].trim();
      startDate = `${rangeMatch[2]}-${rangeMatch[3]}-${rangeMatch[4]}`;
      endDate =
        rangeMatch[6] && rangeMatch[7]
          ? `${rangeMatch[5] ?? rangeMatch[2]}-${rangeMatch[6]}-${rangeMatch[7]}`
          : startDate;
      const place = rangeMatch[8]?.replace(/^\|\s*/, "").trim();
      if (place) venue = place;
      sectionDate = startDate;
      continue;
    }

    if (line.includes("스피드") && !line.includes("OFFICIAL") && !/\d+\.\d{2}/.test(line)) {
      takePending();
      title = line.match(TITLE_RE)?.[1]?.trim() || line;
      continue;
    }

    const genderMatch = line.match(ROSTER_GENDER_RE);
    if (genderMatch) {
      takePending();
      pendingGender = genderMatch[1] === "남자" ? "M" : "F";
      continue;
    }

    const distanceMatch = line.match(ROSTER_DISTANCE_RE);
    if (distanceMatch && pendingGender && startDate) {
      takePending();
      openEvent(pendingGender, Number(distanceMatch[1]), sectionDate ?? startDate);
      continue;
    }

    if (/^\d+\.\s*.+[\/&]/.test(line)) {
      takePending();
      sectionDate = startDate;
      continue;
    }

    const eventMatch = line.match(ROSTER_SINGLE_EVENT_RE);
    if (eventMatch) {
      takePending();
      if (!startDate) {
        unmatched.push(line);
        continue;
      }
      const dateMatch = line.match(ROSTER_SINGLE_DATE_RE);
      sectionDate = dateMatch
        ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
        : startDate;
      pendingGender = eventMatch[2] === "남자" ? "M" : "F";
      openEvent(pendingGender, Number(eventMatch[3]), sectionDate);
      continue;
    }

    if (pendingResult) {
      const joined = `${pendingResult} ${line}`;
      if (addResult(joined)) {
        pendingResult = "";
        continue;
      }
      if (/^(-|\d+)\s+\d+\s+\S/.test(line)) {
        unmatched.push(pendingResult);
        pendingResult = "";
      } else {
        pendingResult = joined;
        continue;
      }
    }

    if (addResult(line)) continue;
    if (/^(-|\d+)\s+\d+$/.test(line)) {
      pendingResult = line;
      continue;
    }
    unmatched.push(line);
  }
  takePending();

  for (const current of events) {
    const finished = results.filter(
      (row) => row.eventId === current.id && row.status === "ok" && row.timeMs != null,
    );
    const byDivision = new Map<Division, Result[]>();
    for (const row of finished) {
      const list = byDivision.get(row.division) ?? [];
      list.push(row);
      byDivision.set(row.division, list);
    }
    for (const list of byDivision.values()) {
      list.sort((a, b) => (a.timeMs ?? 0) - (b.timeMs ?? 0) || (a.rank ?? 0) - (b.rank ?? 0));
      list.forEach((row, index) => {
        row.divisionRank = index + 1;
      });
    }
  }

  return {
    file: {
      competition: {
        id: competitionId,
        name: title,
        venue,
        startDate: startDate ?? "날짜 미상",
        endDate: endDate ?? startDate ?? "날짜 미상",
        certified: title.includes("공인"),
        organizer: "KSU",
      },
      events,
      affiliations: [...affiliations.values()],
      athletes: [...athletes.values()],
      results,
    },
    unmatched,
  };
}
