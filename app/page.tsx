import Link from "next/link";

import { SearchForm } from "@/components/records/search-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMeetSummaries } from "@/lib/records/catalog";
import { formatDateRange } from "@/lib/records/labels";

export default function Home() {
  const meets = listMeetSummaries();

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <Badge variant="outline" className="w-fit">
          공인기록 검색
        </Badge>
        <h1 className="font-heading max-w-2xl text-4xl font-medium tracking-tight">
          선수 이름과 부문으로 기록을 찾습니다
        </h1>
        <p className="max-w-xl text-muted-foreground">
          일반, 대학생, 고등학생, 중학생, 초등학생을 나눠 보고, 대회 결과는 종목별로 다시 열 수
          있습니다.
        </p>
        <SearchForm autoFocus />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {meets.map((meet) => (
          <Card key={meet.competition.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/meets/${meet.competition.id}`} className="hover:underline">
                  {meet.competition.name}
                </Link>
              </CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>다음 대회 결과</CardTitle>
            <CardDescription>PDF가 나오면 업로드 메뉴에서 같은 형식으로 쌓습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upload" className="text-sm font-medium hover:underline">
              결과 PDF 올리기
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
