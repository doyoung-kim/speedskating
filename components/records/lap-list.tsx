import { segmentSpeedLabel } from "@/lib/records/speed";
import type { LapSplit } from "@/lib/records/types";

export function LapList({ laps }: { laps: LapSplit[] }) {
  return (
    <div className="grid w-fit grid-cols-[4.5rem_5.5rem_4.5rem_5.5rem] gap-x-3 gap-y-1 text-sm tabular-nums">
      <span className="text-muted-foreground">지점</span>
      <span className="text-muted-foreground">통과</span>
      <span className="text-muted-foreground">랩</span>
      <span className="text-muted-foreground">속도</span>
      {laps.map((lap, index) => (
        <span key={lap.atMeters} className="contents">
          <span>{lap.atMeters}m</span>
          <span>{lap.splitDisplay}</span>
          <span>{lap.lapDisplay}</span>
          <span>{segmentSpeedLabel(laps, index)}</span>
        </span>
      ))}
    </div>
  );
}
