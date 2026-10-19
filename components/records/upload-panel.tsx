"use client";

import Link from "next/link";
import { useState } from "react";
import { FileUp } from "lucide-react";

import { MeetExplorer } from "@/components/records/meet-explorer";
import { savePublished } from "@/lib/records/published";
import type { ParsedMeet } from "@/lib/records/parse-ksu";
import { fileToRows } from "@/lib/records/rows";
import { DIVISIONS } from "@/lib/records/types";
import { divisionLabel, formatDateRange } from "@/lib/records/labels";

const steps = ["PDF 선택", "대회 정보", "결과 미리보기", "부문 확인", "게시"];

export function UploadPanel() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedMeet | null>(null);
  const [published, setPublished] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      setError("선택한 파일을 읽지 못했습니다. 다시 선택해 주세요.");
      return;
    }
    const stable = new File([bytes], file.name || "results.pdf", {
      type: file.type || "application/pdf",
    });
    setFileName(stable.name);
    setParsing(true);
    setError(null);
    setParsed(null);
    setPublished(false);
    try {
      const body = new FormData();
      body.set("file", stable);
      const response = await fetch("/api/parse-pdf", { method: "POST", body });
      const payload = (await response.json()) as ParsedMeet & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "PDF를 해석하지 못했습니다.");
        return;
      }
      setParsed(payload);
    } catch {
      setError("서버에 연결하지 못했습니다.");
    } finally {
      setParsing(false);
    }
  }

  const rows = parsed ? fileToRows(parsed.file) : [];
  const step = published ? 5 : parsed ? 4 : parsing ? 2 : fileName ? 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-lg border px-3 py-2 text-sm ${index < step ? "bg-muted" : "bg-card"}`}
          >
            <span className="text-muted-foreground">{index + 1}</span>
            <p className="font-medium">{label}</p>
          </li>
        ))}
      </ol>

      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
        <FileUp className="pointer-events-none size-6 text-muted-foreground" />
        <span className="pointer-events-none text-sm font-medium">
          {parsing ? "결과표를 읽는 중…" : "KSU 공식 결과 PDF를 선택하세요"}
        </span>
        <span className="pointer-events-none text-sm text-muted-foreground">
          올린 파일은 이 브라우저에만 저장됩니다.
        </span>
        <span className="pointer-events-none inline-flex h-11 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium">
          파일 선택
        </span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={parsing}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer text-base opacity-0 disabled:cursor-wait"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            void onFile(selected);
          }}
        />
      </label>

      {error ? <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      {parsed ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-2xl font-medium">{parsed.file.competition.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateRange(parsed.file.competition.startDate, parsed.file.competition.endDate)} ·{" "}
              {parsed.file.competition.venue}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              종목 {parsed.file.events.length} · 선수 {parsed.file.athletes.length} · 기록{" "}
              {parsed.file.results.length}
              {fileName ? ` · ${fileName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {DIVISIONS.map((division) => {
              const count = parsed.file.results.filter((row) => row.division === division.id).length;
              return (
                <span key={division.id} className="rounded-full border px-3 py-1">
                  {divisionLabel(division.id)} {count}
                </span>
              );
            })}
          </div>
          {parsed.unmatched.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              해석하지 못한 줄 {parsed.unmatched.length}개. 결과 행이 아니면 무시해도 됩니다.
            </p>
          ) : null}
          <MeetExplorer events={parsed.file.events} rows={rows} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer touch-manipulation items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => {
                savePublished(parsed.file);
                setPublished(true);
              }}
            >
              이 브라우저에 게시
            </button>
            {published ? (
              <Link href={`/published/${parsed.file.competition.id}`} className="text-sm underline">
                게시한 결과 보기
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                부문은 소속 이름으로 나눴습니다. 게시하면 대회 목록과 검색에 추가됩니다.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
