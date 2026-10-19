import seed from "@/data/meets/2026-taereung-certified.json";

import { normalizeText } from "@/lib/records/labels";
import type {
  Affiliation,
  Athlete,
  Competition,
  Division,
  Gender,
  MeetEvent,
  RecordsFile,
  ResultRow,
} from "@/lib/records/types";

const data = seed as RecordsFile;

const affiliationById = new Map(data.affiliations.map((item) => [item.id, item]));
const athleteById = new Map(data.athletes.map((item) => [item.id, item]));
const eventById = new Map(data.events.map((item) => [item.id, item]));

export const competition: Competition = data.competition;

export const rows: ResultRow[] = data.results.flatMap((result) => {
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
      competitionId: data.competition.id,
      competitionName: data.competition.name,
    },
  ];
});

export function listEvents(competitionId = competition.id) {
  return data.events
    .filter((event) => event.competitionId === competitionId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.distance - b.distance);
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
  return data.athletes
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
}) {
  const pool = rows.filter((row) => {
    if (row.status !== "ok" || row.timeMs == null) return false;
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

export function meetSummary() {
  return {
    competition,
    eventCount: data.events.length,
    athleteCount: data.athletes.length,
    resultCount: data.results.length,
  };
}

export function distances() {
  return [...new Set(data.events.map((event) => event.distance))].sort((a, b) => a - b);
}

export type { MeetEvent };
