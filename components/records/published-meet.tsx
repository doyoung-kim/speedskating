"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

import { MeetExplorer } from "@/components/records/meet-explorer";
import { Badge } from "@/components/ui/badge";
import { decodeRouteId, formatDateRange, parseDivision } from "@/lib/records/labels";
import { readPublished } from "@/lib/records/published";
import { fileToRows } from "@/lib/records/rows";
import type { RecordsFile } from "@/lib/records/types";

export function PublishedMeet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [file, setFile] = useState<RecordsFile | null | undefined>(undefined);

  useEffect(() => {
    const decoded = decodeRouteId(id);
    setFile(readPublished().find((item) => item.competition.id === decoded) ?? null);
  }, [id]);

  if (file === undefined) {
    return <p className="text-sm text-muted-foreground">올린 대회를 불러오는 중…</p>;
  }

  if (!file) {
    return (
      <main className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-medium">올린 대회가 없습니다</h1>
        <p className="text-sm text-muted-foreground">이 브라우저에 게시한 결과만 여기서 볼 수 있습니다.</p>
        <Link href="/upload" className="text-sm underline">
          PDF 업로드
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/meets" className="text-sm text-muted-foreground hover:underline">
          대회
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-medium">{file.competition.name}</h1>
          <Badge variant="secondary">이 브라우저</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(file.competition.startDate, file.competition.endDate)} · {file.competition.venue}
        </p>
      </div>
      <MeetExplorer
        events={file.events}
        rows={fileToRows(file)}
        eventId={searchParams.get("event") ?? undefined}
        division={parseDivision(searchParams.get("division"))}
        syncToUrl
      />
    </main>
  );
}
