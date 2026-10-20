import { FilterChip } from "@/components/records/filter-chip";
import { ResultsTable } from "@/components/records/results-table";
import { bestTimes } from "@/lib/records/catalog";
import { DIVISIONS, type Division, type Gender, type ResultRow } from "@/lib/records/types";

const genders = [
  { id: "all", label: "전체" },
  { id: "F", label: "여자" },
  { id: "M", label: "남자" },
] as const;

export function RankingsExplorer({
  meets,
  meet,
  distances,
  division,
  gender,
  distance,
}: {
  meets: { id: string; name: string }[];
  meet: string;
  distances: number[];
  division: Division | null;
  gender: Gender | "all";
  distance: number | "all";
}) {
  const selected = meets.filter((item) => item.id === meet);
  const sections = division
    ? selected.map((item) => ({
        id: item.id,
        name: item.name,
        rows: rankWithinGroups(bestTimes({ division, gender, distance, competitionId: item.id })),
      }))
    : [];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <FilterGroup label="대회">
        {meets.map((item) => (
          <FilterChip
            key={item.id}
            href={rankingsHref(item.id, division, gender, distance)}
            selected={meet === item.id}
          >
            {item.name}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="부문">
        {DIVISIONS.map((option) => (
          <FilterChip
            key={option.id}
            href={rankingsHref(meet, option.id, gender, distance)}
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
            href={rankingsHref(meet, division, option.id, distance)}
            selected={gender === option.id}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="거리">
        <FilterChip href={rankingsHref(meet, division, gender, "all")} selected={distance === "all"}>
          전체
        </FilterChip>
        {distances.map((value) => (
          <FilterChip
            key={value}
            href={rankingsHref(meet, division, gender, value)}
            selected={distance === value}
          >
            {value}m
          </FilterChip>
        ))}
      </FilterGroup>
      {division ? (
        sections.map((section) => (
          <section key={section.id} className="flex min-w-0 flex-col gap-3">
            <h2 className="text-lg font-medium">{section.name}</h2>
            <ResultsTable rows={section.rows} showEvent />
          </section>
        ))
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          부문을 선택하면 그 대회 안의 최고 기록이 표시됩니다.
        </p>
      )}
    </div>
  );
}

function rankWithinGroups(rows: ResultRow[]) {
  const grouped = new Map<string, number>();
  return rows.map((row) => {
    const key = `${row.gender}:${row.distance}`;
    const next = (grouped.get(key) ?? 0) + 1;
    grouped.set(key, next);
    return { ...row, divisionRank: next, rank: null };
  });
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
  meet: string,
  division: Division | null,
  gender: Gender | "all",
  distance: number | "all",
) {
  const params = new URLSearchParams();
  if (meet) params.set("meet", meet);
  if (division) params.set("division", division);
  if (gender !== "all") params.set("gender", gender);
  if (distance !== "all") params.set("distance", String(distance));
  const query = params.toString();
  return query ? `/rankings?${query}` : "/rankings";
}
