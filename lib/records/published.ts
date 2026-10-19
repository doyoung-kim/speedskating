import type { RecordsFile } from "@/lib/records/types";

const STORAGE_KEY = "speedskate.published";
const REMOVED_BAEKGOM_KEY = "speedskate.removed.baekgom";

export function readPublished(): RecordsFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecordsFile[]) : [];
    const files = Array.isArray(parsed) ? parsed : [];
    if (window.localStorage.getItem(REMOVED_BAEKGOM_KEY)) return files;
    const next = files.filter((item) => !item.competition.name.includes("백곰"));
    if (next.length !== files.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    window.localStorage.setItem(REMOVED_BAEKGOM_KEY, "1");
    return next;
  } catch {
    return [];
  }
}

export function savePublished(file: RecordsFile) {
  const next = [file, ...readPublished().filter((item) => item.competition.id !== file.competition.id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removePublished(id: string) {
  const next = readPublished().filter((item) => item.competition.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
