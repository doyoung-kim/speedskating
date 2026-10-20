export const DIVISIONS = [
  { id: "general", label: "일반" },
  { id: "univ", label: "대학생" },
  { id: "high", label: "고등학생" },
  { id: "middle", label: "중학생" },
  { id: "elementary", label: "초등학생" },
] as const;

export type Division = (typeof DIVISIONS)[number]["id"];
export type Gender = "M" | "F";
export type ResultStatus = "ok" | "dq" | "dns" | "dnf";
export type Lane = string;

export type Competition = {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  certified: boolean;
  organizer: string;
};

export type MeetEvent = {
  id: string;
  competitionId: string;
  date: string;
  gender: Gender;
  distance: number;
  round: string;
  label: string;
};

export type Affiliation = {
  id: string;
  name: string;
  region: string;
  division: Division;
};

export type Athlete = {
  id: string;
  name: string;
  nameNormalized: string;
  affiliationId: string;
};

export type LapSplit = {
  atMeters: number;
  splitDisplay: string;
  lapDisplay: string;
};

export type Result = {
  id: string;
  eventId: string;
  athleteId: string;
  affiliationId: string;
  division: Division;
  rank: number | null;
  divisionRank: number | null;
  timeMs: number | null;
  timeDisplay: string | null;
  lane: Lane | null;
  recordFlag: string | null;
  status: ResultStatus;
  reason: string | null;
};

export type RecordsFile = {
  competition: Competition;
  events: MeetEvent[];
  affiliations: Affiliation[];
  athletes: Athlete[];
  results: Result[];
};

export type ResultRow = {
  resultId: string;
  rank: number | null;
  divisionRank: number | null;
  division: Division;
  timeDisplay: string | null;
  timeMs: number | null;
  status: ResultStatus;
  lane: Lane | null;
  recordFlag: string | null;
  athleteId: string;
  athleteName: string;
  affiliationName: string;
  region: string;
  eventId: string;
  eventLabel: string;
  eventDate: string;
  gender: Gender;
  distance: number;
  round: string;
  competitionId: string;
  competitionName: string;
  laps?: LapSplit[];
};
