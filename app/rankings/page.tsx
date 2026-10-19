import { Suspense } from "react";

import { RankingsExplorer } from "@/components/records/rankings-explorer";
import { distances } from "@/lib/records/catalog";
import { parseDivision } from "@/lib/records/labels";
import { DIVISIONS, type Gender } from "@/lib/records/types";

export default function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string; gender?: string; distance?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">랭킹을 불러오는 중…</p>}>
      <RankingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RankingsContent({
  searchParams,
}: {
  searchParams: Promise<{ division?: string; gender?: string; distance?: string }>;
}) {
  const params = await searchParams;
  const division = params.division && DIVISIONS.some((item) => item.id === params.division)
    ? parseDivision(params.division)
    : null;
  const gender: Gender | "all" = params.gender === "M" || params.gender === "F" ? params.gender : "all";
  const availableDistances = distances();
  const distanceNumber = Number(params.distance);
  const distance = availableDistances.includes(distanceNumber) ? distanceNumber : "all";

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">랭킹</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          부문을 고르면 그 부문 안의 최고 기록만 모읍니다. 초등 기록은 일반·대학 순위에 섞이지
          않습니다.
        </p>
      </div>
      <RankingsExplorer
        distances={availableDistances}
        division={division === "all" ? null : division}
        gender={gender}
        distance={distance}
      />
    </main>
  );
}
