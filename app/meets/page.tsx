import Link from "next/link";

import { PublishedMeets } from "@/components/records/published-meets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMeetSummaries } from "@/lib/records/catalog";
import { formatDateRange } from "@/lib/records/labels";

export default function MeetsPage() {
  const meets = listMeetSummaries();

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">대회</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          기본으로 들어 있는 대회와, 이 브라우저에 게시한 PDF 결과가 함께 보입니다.
        </p>
      </div>
      <PublishedMeets />
      {meets.map((meet) => (
        <Card key={meet.competition.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>
                <Link href={`/meets/${meet.competition.id}`} className="hover:underline">
                  {meet.competition.name}
                </Link>
              </CardTitle>
              {meet.competition.certified ? <Badge variant="outline">공인</Badge> : null}
            </div>
            <CardDescription>
              {formatDateRange(meet.competition.startDate, meet.competition.endDate)} ·{" "}
              {meet.competition.venue}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            종목 {meet.eventCount} · 선수 {meet.athleteCount} · 기록 {meet.resultCount}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
