import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MeetExplorer } from "@/components/records/meet-explorer";
import { Badge } from "@/components/ui/badge";
import { competition, listEvents, rows } from "@/lib/records/catalog";
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
  if (decodeRouteId(id) !== competition.id) notFound();
  const { event, division } = await searchParams;
  const events = listEvents();
  const eventId = events.some((item) => item.id === event) ? event : events[0]?.id;

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/meets" className="text-sm text-muted-foreground hover:underline">
          대회
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-medium">{competition.name}</h1>
          <Badge variant="outline">공인</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(competition.startDate, competition.endDate)} · {competition.venue}
        </p>
      </div>
      <MeetExplorer
        events={events}
        rows={rows}
        eventId={eventId}
        division={parseDivision(division)}
        syncToUrl
      />
    </main>
  );
}
