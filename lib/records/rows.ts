import type { RecordsFile, ResultRow } from "@/lib/records/types";

export function fileToRows(file: RecordsFile): ResultRow[] {
  const affiliationById = new Map(file.affiliations.map((item) => [item.id, item]));
  const athleteById = new Map(file.athletes.map((item) => [item.id, item]));
  const eventById = new Map(file.events.map((item) => [item.id, item]));

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
      },
    ];
  });
}
