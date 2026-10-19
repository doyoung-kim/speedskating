"use client";

import { useMemo, useState } from "react";

import { FilterButton, FilterChip } from "@/components/records/filter-chip";
import { ResultsTable } from "@/components/records/results-table";
import { DIVISIONS, type Division, type ResultRow } from "@/lib/records/types";

const divisionOptions = [{ id: "all", label: "전체" }, ...DIVISIONS] as const;

type GradeEvent = {
  id: string;
  label: string;
  date: string;
  gender: "M" | "F";
  genderLabel: string;
  grade: number;
  distance: number;
};

function describeGradeEvent(event: { id: string; label: string; date: string }): GradeEvent | null {
  const match = event.label.match(/^(남자|여자)초등(\d)학년\s+(\d+)m$/);
  if (!match || event.label.includes("(B조)")) return null;
  return {
    ...event,
    gender: match[1] === "남자" ? "M" : "F",
    genderLabel: match[1],
    grade: Number(match[2]),
    distance: Number(match[3]),
  };
}

export function MeetExplorer({
  events,
  rows,
  eventId,
  division = "all",
  syncToUrl = false,
}: {
  events: { id: string; label: string; date: string }[];
  rows: ResultRow[];
  eventId?: string;
  division?: Division | "all";
  syncToUrl?: boolean;
}) {
  const listedEvents = events.filter((event) => !event.label.includes("(B조)"));
  const gradeEvents = listedEvents.flatMap((event) => {
    const described = describeGradeEvent(event);
    return described ? [described] : [];
  });
  const graded = gradeEvents.length > 0 && gradeEvents.length === listedEvents.length;

  const fallbackEventId = listedEvents.some((event) => event.id === eventId)
    ? eventId!
    : listedEvents[0]?.id;
  const [localEventId, setLocalEventId] = useState(fallbackEventId);
  const [localDivision, setLocalDivision] = useState<(typeof divisionOptions)[number]["id"]>(division);

  const activeEventId = syncToUrl ? fallbackEventId : localEventId;
  const activeDivision = graded ? "all" : syncToUrl ? division : localDivision;
  const activeGradeEvent = gradeEvents.find((event) => event.id === activeEventId) ?? gradeEvents[0];

  const visible = useMemo(() => {
    return rows
      .filter((row) => row.eventId === activeEventId)
      .filter((row) => activeDivision === "all" || row.division === activeDivision)
      .sort((a, b) => {
        if (activeDivision === "all") return (a.rank ?? 999) - (b.rank ?? 999);
        const rankA = a.divisionRank ?? 999;
        const rankB = b.divisionRank ?? 999;
        if (a.status !== "ok" && b.status === "ok") return 1;
        if (a.status === "ok" && b.status !== "ok") return -1;
        return rankA - rankB;
      });
  }, [rows, activeEventId, activeDivision]);

  const distances = [...new Set(gradeEvents.map((event) => event.distance))].sort((a, b) => a - b);
  const genders = uniqueBy(
    gradeEvents.filter((event) => event.distance === activeGradeEvent?.distance),
    (event) => event.gender,
  );
  const grades = gradeEvents
    .filter(
      (event) =>
        event.distance === activeGradeEvent?.distance && event.gender === activeGradeEvent?.gender,
    )
    .sort((a, b) => a.grade - b.grade);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        {graded && activeGradeEvent ? (
          <>
            <FilterRow label="거리">
              {distances.map((distance) => {
                const next = gradeEvents.find(
                  (event) =>
                    event.distance === distance &&
                    event.gender === activeGradeEvent.gender &&
                    event.grade === activeGradeEvent.grade,
                ) ?? gradeEvents.find((event) => event.distance === distance);
                return (
                  <EventChoice
                    key={distance}
                    syncToUrl={syncToUrl}
                    selected={distance === activeGradeEvent.distance}
                    href={meetFilterHref(next?.id, "all")}
                    onSelect={() => next && setLocalEventId(next.id)}
                  >
                    {distance}m
                  </EventChoice>
                );
              })}
            </FilterRow>
            <FilterRow label="성별">
              {genders.map((event) => {
                const next = gradeEvents.find(
                  (item) =>
                    item.distance === activeGradeEvent.distance &&
                    item.gender === event.gender &&
                    item.grade === activeGradeEvent.grade,
                ) ??
                  gradeEvents.find(
                    (item) =>
                      item.distance === activeGradeEvent.distance && item.gender === event.gender,
                  );
                return (
                  <EventChoice
                    key={event.gender}
                    syncToUrl={syncToUrl}
                    selected={event.gender === activeGradeEvent.gender}
                    href={meetFilterHref(next?.id, "all")}
                    onSelect={() => next && setLocalEventId(next.id)}
                  >
                    {event.genderLabel}
                  </EventChoice>
                );
              })}
            </FilterRow>
            <FilterRow label="학년">
              {grades.map((event) => (
                <EventChoice
                  key={event.grade}
                  syncToUrl={syncToUrl}
                  selected={event.grade === activeGradeEvent.grade}
                  href={meetFilterHref(event.id, "all")}
                  onSelect={() => setLocalEventId(event.id)}
                >
                  {event.grade}학년
                </EventChoice>
              ))}
            </FilterRow>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {listedEvents.map((event) => (
              <EventChoice
                key={event.id}
                syncToUrl={syncToUrl}
                selected={event.id === activeEventId}
                href={meetFilterHref(event.id, activeDivision)}
                onSelect={() => setLocalEventId(event.id)}
              >
                {event.label}
              </EventChoice>
            ))}
          </div>
        )}
        {graded ? null : (
          <div className="flex flex-wrap gap-2">
            {divisionOptions.map((option) => (
              <EventChoice
                key={option.id}
                syncToUrl={syncToUrl}
                selected={option.id === activeDivision}
                href={meetFilterHref(activeEventId, option.id)}
                onSelect={() => setLocalDivision(option.id)}
              >
                {option.label}
              </EventChoice>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{visible.length}명</p>
      <ResultsTable rows={visible} />
    </div>
  );
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = key(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function EventChoice({
  syncToUrl,
  selected,
  href,
  onSelect,
  children,
}: {
  syncToUrl: boolean;
  selected: boolean;
  href: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  if (syncToUrl) {
    return (
      <FilterChip href={href} selected={selected}>
        {children}
      </FilterChip>
    );
  }
  return (
    <FilterButton selected={selected} onSelect={onSelect}>
      {children}
    </FilterButton>
  );
}

function meetFilterHref(eventId: string | undefined, division: Division | "all") {
  const params = new URLSearchParams();
  if (eventId) params.set("event", eventId);
  if (division !== "all") params.set("division", division);
  const query = params.toString();
  return query ? `?${query}` : "?";
}
