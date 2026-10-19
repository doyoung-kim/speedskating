import { readFile, writeFile, mkdir } from "node:fs/promises";

const REGIONS =
  "서울|경기|강원|인천|충남|충북|경북|경남|전북|전남|세종|부산|대전|광주|울산|제주|대구";

const RESULT_RE = new RegExp(
  `^(?:(\\d+)\\s+)?(.+?)\\s+((?:\\d{1,2}:)?\\d{1,2}\\.\\d{2,3}|DQ|DNS|DNF)\\s*(MT)?\\s*(${REGIONS})(IN|OUT)(.+)$`,
);

const EVENT_RE = /^(\d+)\.\s*(남자부|여자부)\s+(\d+)M$/;
const DATE_RE = /OFFICIAL RESULTS:\s*(\d{4})\.(\d{2})\.(\d{2})/;

function inferDivision(name) {
  if (name.includes("초등학교") || name.includes("초등")) return "elementary";
  if (name.includes("중학교")) return "middle";
  if (name.includes("고등학교") || name.includes("여고")) return "high";
  if (name.includes("대학교") || name.includes("대학")) return "univ";
  return "general";
}

function parseTimeMs(display) {
  const match = display.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  const fraction = Number(match[3].padEnd(3, "0").slice(0, 3));
  return minutes * 60_000 + seconds * 1_000 + fraction;
}

function slug(value) {
  return value.trim().replace(/\s+/g, "-").toLowerCase();
}

const text = await readFile("scripts/pdf-text.txt", "utf8");
const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

const competitionId = "2026-taereung-certified";
const events = [];
const affiliations = new Map();
const athletes = new Map();
const results = [];
const unmatched = [];

let date = null;
let event = null;
let round = "결승";

for (const line of lines) {
  if (
    line.startsWith("---") ||
    line.startsWith("순위") ||
    line.startsWith("2026 스피드") ||
    line.startsWith("Page ") ||
    line === "이름" ||
    line.includes("Starter") ||
    line.includes("Data processing")
  ) {
    continue;
  }

  const dateMatch = line.match(DATE_RE);
  if (dateMatch) {
    date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    continue;
  }

  if (line === "결승") {
    round = "결승";
    continue;
  }

  const eventMatch = line.match(EVENT_RE);
  if (eventMatch) {
    const gender = eventMatch[2] === "남자부" ? "M" : "F";
    const distance = Number(eventMatch[3]);
    const id = `${date}-${gender}-${distance}`;
    event = {
      id,
      competitionId,
      date,
      gender,
      distance,
      round,
      label: `${eventMatch[2]} ${distance}m`,
    };
    if (!events.some((item) => item.id === id)) events.push(event);
    else event = events.find((item) => item.id === id);
    continue;
  }

  const resultMatch = line.match(RESULT_RE);
  if (!resultMatch || !event) {
    unmatched.push(line);
    continue;
  }

  const rank = resultMatch[1] ? Number(resultMatch[1]) : null;
  const affiliationName = resultMatch[2].trim();
  const token = resultMatch[3];
  const recordFlag = resultMatch[4] ?? null;
  const region = resultMatch[5];
  const lane = resultMatch[6];
  const athleteName = resultMatch[7].trim();
  const status =
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
  const rows = results.filter((row) => row.eventId === current.id && row.status === "ok");
  const byDivision = new Map();
  for (const row of rows) {
    const list = byDivision.get(row.division) ?? [];
    list.push(row);
    byDivision.set(row.division, list);
  }
  for (const list of byDivision.values()) {
    list.sort((a, b) => a.timeMs - b.timeMs || (a.rank ?? 0) - (b.rank ?? 0));
    list.forEach((row, index) => {
      row.divisionRank = index + 1;
    });
  }
}

const dates = events.map((item) => item.date).sort();
const payload = {
  competition: {
    id: competitionId,
    name: "2026 스피드스케이팅 공인기록회",
    venue: "태릉국제스케이트장",
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    certified: true,
    organizer: "KSU",
  },
  events,
  affiliations: [...affiliations.values()],
  athletes: [...athletes.values()],
  results,
};

await mkdir("data/meets", { recursive: true });
await writeFile(
  "data/meets/2026-taereung-certified.json",
  `${JSON.stringify(payload, null, 2)}\n`,
);

const general = payload.affiliations.filter((item) => item.division === "general");
console.log({
  events: events.length,
  athletes: athletes.size,
  affiliations: affiliations.size,
  results: results.length,
  unmatched: unmatched.length,
});
console.log("general affiliations:", general.map((item) => item.name).join(" | "));
if (unmatched.length) console.log("unmatched:\n" + unmatched.join("\n"));
