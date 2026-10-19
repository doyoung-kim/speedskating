import { FilterChip } from "@/components/records/filter-chip";
import { ResultsTable } from "@/components/records/results-table";
import { bestTimes } from "@/lib/records/catalog";
import { DIVISIONS, type Division, type Gender } from "@/lib/records/types";

const genders = [
  { id: "all", label: "전체" },
  { id: "F", label: "여자" },
  { id: "M", label: "남자" },
] as const;

export function RankingsExplorer({
  distances,
  division,
  gender,
  distance,
}: {
  distances: number[];
  division: Division | null;
  gender: Gender | "all";
  distance: number | "all";
}) {
  const grouped = new Map<string, number>();
  const rows = division
    ? bestTimes({ division, gender, distance }).map((row) => {
        const key = `${row.gender}:${row.distance}`;
        const next = (grouped.get(key) ?? 0) + 1;
        grouped.set(key, next);
        return { ...row, divisionRank: next, rank: null };
      })
    : [];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <FilterGroup label="부문">
        {DIVISIONS.map((option) => (
          <FilterChip
            key={option.id}
            href={rankingsHref(option.id, gender, distance)}
            selected={division === option.id}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="성별">
        {genders.map((option) => (
          <FilterChip
            key={option.id}
            href={rankingsHref(division, option.id, distance)}
            selected={gender === option.id}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="거리">
        <FilterChip href={rankingsHref(division, gender, "all")} selected={distance === "all"}>
          전체
        </FilterChip>
        {distances.map((value) => (
          <FilterChip
            key={value}
            href={rankingsHref(division, gender, value)}
            selected={distance === value}
          >
            {value}m
          </FilterChip>
        ))}
      </FilterGroup>
      {division ? (
        <ResultsTable rows={rows} showEvent />
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          부문을 선택하면 그 부문의 최고 기록이 표시됩니다.
        </p>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function rankingsHref(
  division: Division | null,
  gender: Gender | "all",
  distance: number | "all",
) {
  const params = new URLSearchParams();
  if (division) params.set("division", division);
  if (gender !== "all") params.set("gender", gender);
  if (distance !== "all") params.set("distance", String(distance));
  const query = params.toString();
  return query ? `/rankings?${query}` : "/rankings";
}
