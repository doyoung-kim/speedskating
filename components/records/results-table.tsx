import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { divisionLabel, formatDate, genderLabel, statusLabel } from "@/lib/records/labels";
import type { ResultRow } from "@/lib/records/types";

export function ResultsTable({
  rows,
  showEvent = false,
}: {
  rows: ResultRow[];
  showEvent?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        조건에 맞는 기록이 없습니다.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">순위</TableHead>
          <TableHead className="w-16">부문</TableHead>
          <TableHead>기록</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>소속</TableHead>
          <TableHead className="hidden sm:table-cell">지역</TableHead>
          <TableHead className="hidden md:table-cell">레인</TableHead>
          {showEvent ? <TableHead>종목</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.resultId}>
            <TableCell className="font-medium tabular-nums">
              {row.status === "ok" ? (row.divisionRank ?? row.rank ?? "-") : "-"}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {row.rank ? `전체 ${row.rank}` : statusLabel(row.status)}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{divisionLabel(row.division)}</Badge>
            </TableCell>
            <TableCell className="tabular-nums">
              {row.timeDisplay ?? statusLabel(row.status)}
              {row.recordFlag ? (
                <Badge variant="outline" className="ml-2">
                  {row.recordFlag}
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>
              <Link href={`/athletes/${row.athleteId}`} className="font-medium hover:underline">
                {row.athleteName}
              </Link>
            </TableCell>
            <TableCell className="max-w-40 truncate">{row.affiliationName}</TableCell>
            <TableCell className="hidden sm:table-cell">{row.region}</TableCell>
            <TableCell className="hidden md:table-cell">{row.lane}</TableCell>
            {showEvent ? (
              <TableCell>
                <Link href={`/meets/${row.competitionId}?event=${row.eventId}`} className="hover:underline">
                  {genderLabel(row.gender)} {row.distance}m
                </Link>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatDate(row.eventDate)}
                </span>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
