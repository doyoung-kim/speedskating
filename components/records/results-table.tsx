"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { LapList } from "@/components/records/lap-list";
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
import { averageSpeedLabel } from "@/lib/records/speed";
import type { ResultRow } from "@/lib/records/types";

export function ResultsTable({
  rows,
  showEvent = false,
}: {
  rows: ResultRow[];
  showEvent?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const ignoreClickUntil = useRef(0);
  const columnCount = showEvent ? 9 : 8;
  const toggleLap = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      const node = event.target;
      const element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
      const button = element?.closest("[data-lap]");
      if (!(button instanceof HTMLButtonElement)) return;
      const id = button.dataset.lap;
      if (!id) return;
      event.preventDefault();
      ignoreClickUntil.current = Date.now() + 700;
      button.addEventListener(
        "click",
        (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        },
        { capture: true, once: true },
      );
      toggleLap(id);
    };
    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: false });
    return () => document.removeEventListener("touchstart", onTouchStart, { capture: true });
  }, [toggleLap]);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        조건에 맞는 기록이 없습니다.
      </p>
    );
  }

  const openRow = rows.find((row) => row.resultId === openId) ?? null;

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">순위</TableHead>
          <TableHead className="w-16">부문</TableHead>
          <TableHead>기록</TableHead>
          <TableHead>속도</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>소속</TableHead>
          <TableHead className="hidden sm:table-cell">지역</TableHead>
          <TableHead className="hidden md:table-cell">레인</TableHead>
          {showEvent ? <TableHead>종목</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const open = openId === row.resultId;
          const laps = row.laps ?? [];
          const averageSpeed = row.status === "ok" ? averageSpeedLabel(row.distance, row.timeMs) : null;
          return (
          <Fragment key={row.resultId}>
          <TableRow>
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
              {laps.length > 0 ? (
                <button
                  type="button"
                  data-lap={row.resultId}
                  aria-expanded={open}
                  className="ml-2 inline-flex h-11 cursor-pointer touch-manipulation items-center rounded-lg border border-border px-3 text-sm font-medium"
                  onClick={() => {
                    if (Date.now() < ignoreClickUntil.current) return;
                    toggleLap(row.resultId);
                  }}
                >
                  랩
                </button>
              ) : null}
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{averageSpeed ?? "-"}</TableCell>
            <TableCell>
              <Link
                href={`/search?q=${encodeURIComponent(row.athleteName)}`}
                className="font-medium hover:underline"
              >
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
                  {row.competitionName} · {formatDate(row.eventDate)}
                </span>
              </TableCell>
            ) : null}
          </TableRow>
          {open ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="whitespace-normal bg-muted/30">
                <LapList laps={laps} />
              </TableCell>
            </TableRow>
          ) : null}
          </Fragment>
          );
        })}
      </TableBody>
    </Table>
    {mounted && openRow
      ? createPortal(
          <div className="fixed inset-x-0 bottom-16 z-50 max-h-[45vh] overflow-auto border-t bg-background p-4 shadow-2xl md:bottom-0">
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {openRow.athleteName} · {openRow.timeDisplay}
                </p>
                <p className="text-sm text-muted-foreground">{openRow.affiliationName}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-sm font-medium"
                onClick={() => setOpenId(null)}
              >
                닫기
              </button>
            </div>
            <div className="mx-auto mt-3 max-w-6xl">
              <LapList laps={openRow.laps ?? []} />
            </div>
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
