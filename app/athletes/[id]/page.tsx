import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ResultsTable } from "@/components/records/results-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAthlete } from "@/lib/records/catalog";
import { decodeRouteId, divisionLabel, genderLabel } from "@/lib/records/labels";

export default function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">선수 기록을 불러오는 중…</p>}>
      <AthleteContent params={params} />
    </Suspense>
  );
}

async function AthleteContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getAthlete(decodeRouteId(id));
  if (!profile) notFound();

  const { athlete, affiliation, results } = profile;
  const bests = new Map<string, (typeof results)[number]>();
  for (const row of results) {
    if (row.status !== "ok" || row.timeMs == null) continue;
    const key = `${row.gender}:${row.distance}`;
    const current = bests.get(key);
    if (!current || row.timeMs < (current.timeMs ?? Infinity)) bests.set(key, row);
  }

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/search" className="text-sm text-muted-foreground hover:underline">
          검색
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-medium">{athlete.name}</h1>
          <Badge variant="secondary">{divisionLabel(affiliation.division)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {affiliation.name} · {affiliation.region}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...bests.values()]
          .sort((a, b) => a.distance - b.distance)
          .map((row) => (
            <Card key={`${row.gender}-${row.distance}`}>
              <CardHeader>
                <CardTitle>
                  {genderLabel(row.gender)} {row.distance}m
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-medium tabular-nums">{row.timeDisplay}</CardContent>
            </Card>
          ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">대회 기록</h2>
        <ResultsTable rows={results} showEvent />
      </section>
    </main>
  );
}
