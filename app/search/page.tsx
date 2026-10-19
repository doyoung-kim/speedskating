import Link from "next/link";
import { Suspense } from "react";

import { PublishedSearch } from "@/components/records/published-search";
import { ResultsTable } from "@/components/records/results-table";
import { SearchForm } from "@/components/records/search-form";
import { Badge } from "@/components/ui/badge";
import { competition, rows, searchAthletes } from "@/lib/records/catalog";
import { divisionLabel } from "@/lib/records/labels";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">검색 결과를 불러오는 중…</p>}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() ?? "";
  const athletes = query ? searchAthletes(query) : [];
  const athleteIds = new Set(athletes.map((item) => item.athlete.id));
  const matchedRows = rows.filter((row) => athleteIds.has(row.athleteId));

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-medium">검색</h1>
        <SearchForm query={query} />
      </div>
      {query ? (
        <>
          <PublishedSearch query={query} />
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">선수 {athletes.length}</h2>
            {athletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">일치하는 선수가 없습니다.</p>
            ) : (
              <ul className="grid gap-2">
                {athletes.map(({ athlete, affiliation }) => (
                  <li key={athlete.id}>
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:bg-muted"
                    >
                      <span>
                        <span className="font-medium">{athlete.name}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {affiliation.name} · {affiliation.region}
                        </span>
                      </span>
                      <Badge variant="secondary">{divisionLabel(affiliation.division)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">기록 {matchedRows.length}</h2>
            <ResultsTable rows={matchedRows} showEvent />
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          이름이나 소속을 입력하세요. 대회 전체 결과는{" "}
          <Link href={`/meets/${competition.id}`} className="underline">
            {competition.name}
          </Link>
          에서 볼 수 있습니다.
        </p>
      )}
    </main>
  );
}
