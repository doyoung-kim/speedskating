import type { LapSplit } from "@/lib/records/types";

export function speedKmh(meters: number, timeMs: number) {
  if (meters <= 0 || timeMs <= 0) return null;
  return (meters / timeMs) * 3600;
}

export function formatSpeed(kmh: number | null) {
  if (kmh == null || !Number.isFinite(kmh)) return null;
  return `${kmh.toFixed(1)} km/h`;
}

export function averageSpeedLabel(distance: number, timeMs: number | null) {
  if (timeMs == null) return null;
  return formatSpeed(speedKmh(distance, timeMs));
}

function parseDisplayMs(display: string) {
  const match = display.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  const fraction = Number(match[3].padEnd(3, "0").slice(0, 3));
  return minutes * 60_000 + seconds * 1_000 + fraction;
}

export function segmentSpeedLabel(laps: LapSplit[], index: number) {
  const lap = laps[index];
  if (!lap) return null;
  const previous = index === 0 ? 0 : laps[index - 1]?.atMeters ?? 0;
  const meters = lap.atMeters - previous;
  const timeMs = parseDisplayMs(lap.lapDisplay);
  if (timeMs == null) return null;
  return formatSpeed(speedKmh(meters, timeMs));
}
