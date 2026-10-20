import meet2023 from "@/data/meets/2023-taereung-certified.json";
import meet2024 from "@/data/meets/2024-taereung-certified.json";
import meet2025 from "@/data/meets/2025-taereung-certified.json";
import lapFile from "@/data/meets/2026-taereung-laps.json";
import meet2026 from "@/data/meets/2026-taereung-certified.json";

import { normalizeText } from "@/lib/records/labels";
import type {
  Affiliation,
  Athlete,
  Competition,
  Division,
  Gender,
  LapSplit,
  MeetEvent,
  RecordsFile,
  ResultRow,
} from "@/lib/records/types";

const files = [meet2026, meet2025, meet2024, meet2023] as RecordsFile[];
const lapsByResult = lapFile as Record<string, LapSplit[]>;

const affiliationById = new Map<string, Affiliation>();
const athleteById = new Map<string, Athlete>();
const eventById = new Map<string, MeetEvent>();

for (const file of files) {
  for (const item of file.affiliations) affiliationById.set(item.id, item);
  for (const item of file.athletes) athleteById.set(item.id, item);
  for (const item of file.events) eventById.set(item.id, item);
}

const byStartDate = [...files].sort((a, b) =>
  b.competition.startDate.localeCompare(a.competition.startDate),
);

export const competition: Competition = byStartDate[0].competition;

function rowsFor(file: RecordsFile): ResultRow[] {
  return file.results.flatMap((result) => {
    const athlete = athleteById.get(result.athleteId);
    const affiliation = affiliationById.get(result.affiliationId);
    const event = eventById.get(result.eventId);
    if (!athlete || !affiliation || !event) return [];
    return [
      {
        resultId: result.id,
        rank: result.rank,
        divisionRank: result.divisionRank,
        division: result.division,
        timeDisplay: result.timeDisplay,
        timeMs: result.timeMs,
        status: result.status,
        lane: result.lane,
        recordFlag: result.recordFlag,
        athleteId: athlete.id,
        athleteName: athlete.name,
        affiliationName: affiliation.name,
        region: affiliation.region,
        eventId: event.id,
        eventLabel: event.label,
        eventDate: event.date,
        gender: event.gender,
        distance: event.distance,
        round: event.round,
        competitionId: file.competition.id,
        competitionName: file.competition.name,
        laps: lapsByResult[result.id],
      },
    ];
  });
}

export const rows: ResultRow[] = files.flatMap(rowsFor);

export function listEvents(competitionId = competition.id) {
  return [...eventById.values()]
    .filter((event) => event.competitionId === competitionId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.distance - b.distance);
}

export function getMeet(id: string) {
  const file = files.find((item) => item.competition.id === id);
  if (!file) return null;
  return {
    competition: file.competition,
    events: listEvents(id),
    rows: rows.filter((row) => row.competitionId === id),
  };
}

export function getAthlete(id: string) {
  const athlete = athleteById.get(id);
  if (!athlete) return null;
  const affiliation = affiliationById.get(athlete.affiliationId);
  if (!affiliation) return null;
  return { athlete, affiliation, results: rows.filter((row) => row.athleteId === id) };
}

export function searchAthletes(query: string) {
  const needle = normalizeText(query);
  if (!needle) return [];
  return [...athleteById.values()]
    .map((athlete) => {
      const affiliation = affiliationById.get(athlete.affiliationId);
      return affiliation ? { athlete, affiliation } : null;
    })
    .filter((item): item is { athlete: Athlete; affiliation: Affiliation } => {
      if (!item) return false;
      const haystack = normalizeText(
        `${item.athlete.name}${item.affiliation.name}${item.affiliation.region}`,
      );
      return haystack.includes(needle);
    })
    .sort((a, b) => a.athlete.name.localeCompare(b.athlete.name, "ko"));
}

export function bestTimes(filters: {
  division?: Division | "all";
  gender?: Gender | "all";
  distance?: number | "all";
  competitionId?: string;
}) {
  const pool = rows.filter((row) => {
    if (row.status !== "ok" || row.timeMs == null) return false;
    if (filters.competitionId && row.competitionId !== filters.competitionId) return false;
    if (filters.division && filters.division !== "all" && row.division !== filters.division) {
      return false;
    }
    if (filters.gender && filters.gender !== "all" && row.gender !== filters.gender) return false;
    if (filters.distance && filters.distance !== "all" && row.distance !== filters.distance) {
      return false;
    }
    return true;
  });

  const best = new Map<string, ResultRow>();
  for (const row of pool) {
    const key = `${row.athleteId}:${row.gender}:${row.distance}:${row.division}`;
    const current = best.get(key);
    if (!current || (row.timeMs ?? Infinity) < (current.timeMs ?? Infinity)) {
      best.set(key, row);
    }
  }

  return [...best.values()].sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
    return (a.timeMs ?? 0) - (b.timeMs ?? 0);
  });
}

function summarize(file: RecordsFile) {
  return {
    competition: file.competition,
    eventCount: file.events.length,
    athleteCount: file.athletes.length,
    resultCount: file.results.length,
  };
}

export function meetSummary() {
  return summarize(byStartDate[0]);
}

export function listMeetSummaries() {
  return byStartDate.map(summarize);
}

export function distances() {
  return [...new Set([...eventById.values()].map((event) => event.distance))].sort(
    (a, b) => a - b,
  );
}

export type { MeetEvent };
