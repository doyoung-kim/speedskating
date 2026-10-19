"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readPublished, removePublished } from "@/lib/records/published";
import { formatDateRange } from "@/lib/records/labels";
import type { RecordsFile } from "@/lib/records/types";

export function PublishedMeets() {
  const [files, setFiles] = useState<RecordsFile[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setFiles(readPublished());
  }, []);

  async function confirmDelete(id: string) {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/confirm-delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("비밀번호가 올바르지 않습니다.");
        return;
      }
      setFiles(removePublished(id));
      setPendingId(null);
      setPassword("");
    } catch {
      setError("서버에 연결하지 못했습니다.");
    } finally {
      setChecking(false);
    }
  }

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => {
        const open = pendingId === file.competition.id;
        return (
          <Card key={file.competition.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>
                  <Link href={`/published/${file.competition.id}`} className="hover:underline">
                    {file.competition.name}
                  </Link>
                </CardTitle>
                <Badge variant="secondary">이 브라우저</Badge>
              </div>
              <CardDescription>
                {formatDateRange(file.competition.startDate, file.competition.endDate)} ·{" "}
                {file.competition.venue}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                종목 {file.events.length} · 선수 {file.athletes.length} · 기록 {file.results.length}
              </p>
              <button
                type="button"
                className="inline-flex h-11 w-fit cursor-pointer touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground"
                onClick={() => {
                  setPendingId(open ? null : file.competition.id);
                  setPassword("");
                  setError(null);
                }}
              >
                삭제
              </button>
              {open ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void confirmDelete(file.competition.id);
                  }}
                >
                  <label className="flex flex-col gap-1 text-sm text-foreground">
                    비밀번호
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      className="h-11"
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={checking || password.length === 0}
                    className="inline-flex h-11 w-fit cursor-pointer touch-manipulation items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {checking ? "확인 중…" : "삭제 확인"}
                  </button>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </form>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
