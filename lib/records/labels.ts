import { DIVISIONS, type Division, type Gender, type ResultStatus } from "@/lib/records/types";

export function divisionLabel(division: Division) {
  return DIVISIONS.find((item) => item.id === division)?.label ?? division;
}

export function parseDivision(value: string | null | undefined): Division | "all" {
  if (value && DIVISIONS.some((item) => item.id === value)) return value as Division;
  return "all";
}

export function genderLabel(gender: Gender) {
  return gender === "M" ? "남자" : "여자";
}

export function statusLabel(status: ResultStatus) {
  if (status === "ok") return "완주";
  if (status === "dq") return "실격";
  if (status === "dns") return "출발실패";
  return "기권";
}

export function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function decodeRouteId(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
