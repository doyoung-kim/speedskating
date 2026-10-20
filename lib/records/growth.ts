import { divisionLabel } from "@/lib/records/labels";
import { averageSpeedLabel } from "@/lib/records/speed";
import type { Division, Gender, ResultRow } from "@/lib/records/types";

export type GrowthPoint = {
  year: number;
  date: string;
  timeMs: number;
  timeDisplay: string;
  speedLabel: string | null;
  affiliationName: string;
  division: Division;
  deltaMs: number | null;
  deltaPercent: number | null;
  isPb: boolean;
  pbDeltaMs: number | null;
  pbDeltaPercent: number | null;
  fieldBestMs: number | null;
  fieldMedianMs: number | null;
  winnerRatio: number | null;
};

export type GrowthSeries = {
  name: string;
  gender: Gender;
  distance: number;
  points: GrowthPoint[];
};

export type DistanceProfile = {
  gender: Gender;
  distance: number;
  year: number;
  division: Division;
  ratio: number | null;
};

function fieldKey(year: string, gender: Gender, distance: number, division: Division) {
  return `${year}:${gender}:${distance}:${division}`;
}

function median(sorted: number[]) {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function formatSeconds(ms: number) {
  return `${Math.round((Math.abs(ms) / 1000) * 1000) / 1000}초`;
}

export function formatPercent(percent: number) {
  return `${(Math.round(Math.abs(percent) * 10) / 10).toFixed(1)}%`;
}

export function formatAxisTime(ms: number) {
  const total = ms / 1000;
  if (total >= 60) {
    const minutes = Math.floor(total / 60);
    const seconds = (total - minutes * 60).toFixed(1).padStart(4, "0");
    return `${minutes}:${seconds}`;
  }
  return total.toFixed(1);
}

export function growthSeriesFor(subjectRows: ResultRow[], fieldRows: ResultRow[]) {
  const buckets = new Map<string, number[]>();
  for (const row of fieldRows) {
    if (row.status !== "ok" || row.timeMs == null) continue;
    const key = fieldKey(row.eventDate.slice(0, 4), row.gender, row.distance, row.division);
    const list = buckets.get(key);
    if (list) list.push(row.timeMs);
    else buckets.set(key, [row.timeMs]);
  }

  const fields = new Map<string, { bestMs: number; medianMs: number }>();
  for (const [key, times] of buckets) {
    times.sort((a, b) => a - b);
    fields.set(key, { bestMs: times[0], medianMs: median(times) });
  }

  const groups = new Map<string, ResultRow[]>();
  for (const row of subjectRows) {
    if (row.status !== "ok" || row.timeMs == null || row.timeDisplay == null) continue;
    const key = `${row.athleteName}\0${row.gender}\0${row.distance}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const series: GrowthSeries[] = [];
  for (const [key, group] of groups) {
    const [name, gender, distanceText] = key.split("\0");
    const sorted = [...group].sort(
      (a, b) => a.eventDate.localeCompare(b.eventDate) || (a.timeMs ?? 0) - (b.timeMs ?? 0),
    );
    const bestMs = Math.min(...sorted.map((row) => row.timeMs ?? Infinity));
    const points = sorted.map((row, index) => {
      const timeMs = row.timeMs ?? 0;
      const previous = index > 0 ? sorted[index - 1] : null;
      const previousMs = previous?.timeMs ?? null;
      const earlier = sorted.slice(0, index).map((item) => item.timeMs ?? Infinity);
      const earlierBest = earlier.length > 0 ? Math.min(...earlier) : null;
      const field = fields.get(
        fieldKey(row.eventDate.slice(0, 4), row.gender, row.distance, row.division),
      );
      const deltaMs = previousMs == null ? null : timeMs - previousMs;
      const pbDeltaMs = earlierBest != null && timeMs < earlierBest ? timeMs - earlierBest : null;
      return {
        year: Number(row.eventDate.slice(0, 4)),
        date: row.eventDate,
        timeMs,
        timeDisplay: row.timeDisplay ?? "",
        speedLabel: averageSpeedLabel(row.distance, timeMs),
        affiliationName: row.affiliationName,
        division: row.division,
        deltaMs,
        deltaPercent: previousMs == null || deltaMs == null ? null : (deltaMs / previousMs) * 100,
        isPb: timeMs === bestMs,
        pbDeltaMs,
        pbDeltaPercent:
          earlierBest == null || pbDeltaMs == null ? null : (pbDeltaMs / earlierBest) * 100,
        fieldBestMs: field?.bestMs ?? null,
        fieldMedianMs: field?.medianMs ?? null,
        winnerRatio: field && field.bestMs > 0 ? timeMs / field.bestMs : null,
      } satisfies GrowthPoint;
    });
    series.push({
      name,
      gender: gender as Gender,
      distance: Number(distanceText),
      points,
    });
  }

  return series.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name, "ko");
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.gender.localeCompare(b.gender);
  });
}

export function latestProfiles(series: GrowthSeries[]): DistanceProfile[] {
  return series.map((item) => {
    const point = item.points[item.points.length - 1];
    return {
      gender: item.gender,
      distance: item.distance,
      year: point.year,
      division: point.division,
      ratio: point.winnerRatio,
    };
  });
}

export function ratioSentence(year: number, division: Division, ratio: number | null) {
  const name = divisionLabel(division);
  if (ratio == null) return "비교할 부문 기록이 없습니다.";
  if (ratio <= 1.0005) return `${year}년 ${name} 1위입니다.`;
  const slower = (Math.round((ratio - 1) * 1000) / 10).toFixed(1);
  return `${year}년 ${name} 1위보다 ${slower}% 느립니다.`;
}

export function profileReading(profiles: DistanceProfile[]) {
  const sprint = profiles.find((item) => item.distance === 500 && item.ratio != null);
  const longer = profiles.filter((item) => item.distance > 500 && item.ratio != null);
  if (!sprint?.ratio || longer.length === 0) return null;
  const furthest = longer.reduce((best, item) => (item.distance > best.distance ? item : best));
  if (furthest.ratio == null) return null;
  const gap = furthest.ratio - sprint.ratio;
  if (gap > 0.03) return "500m가 긴 거리보다 부문 1위에 가깝습니다.";
  if (gap < -0.03) return `${furthest.distance}m가 500m보다 부문 1위에 가깝습니다.`;
  return null;
}
