import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MeetExplorer } from "@/components/records/meet-explorer";
import { Badge } from "@/components/ui/badge";
import { getMeet } from "@/lib/records/catalog";
import { decodeRouteId, formatDateRange, parseDivision } from "@/lib/records/labels";

export default function MeetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string; division?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">대회 결과를 불러오는 중…</p>}>
      <MeetContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MeetContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string; division?: string }>;
}) {
  const { id } = await params;
  const meet = getMeet(decodeRouteId(id));
  if (!meet) notFound();
  const { event, division } = await searchParams;
  const eventId = meet.events.some((item) => item.id === event) ? event : meet.events[0]?.id;

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/meets" className="text-sm text-muted-foreground hover:underline">
          대회
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-medium">{meet.competition.name}</h1>
          {meet.competition.certified ? <Badge variant="outline">공인</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(meet.competition.startDate, meet.competition.endDate)} ·{" "}
          {meet.competition.venue}
        </p>
      </div>
      <MeetExplorer
        events={meet.events}
        rows={meet.rows}
        eventId={eventId}
        division={parseDivision(division)}
        syncToUrl
      />
    </main>
  );
}
