"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { normalizeText, divisionLabel } from "@/lib/records/labels";
import { readPublished } from "@/lib/records/published";
import type { RecordsFile } from "@/lib/records/types";

export function PublishedSearch({ query }: { query: string }) {
  const [files, setFiles] = useState<RecordsFile[]>([]);

  useEffect(() => {
    setFiles(readPublished());
  }, []);

  const needle = normalizeText(query);
  if (!needle || files.length === 0) return null;

  const matches = files.flatMap((file) => {
    const affiliations = new Map(file.affiliations.map((item) => [item.id, item]));
    return file.athletes.flatMap((athlete) => {
      const affiliation = affiliations.get(athlete.affiliationId);
      if (!affiliation) return [];
      const haystack = normalizeText(`${athlete.name}${affiliation.name}${affiliation.region}`);
      if (!haystack.includes(needle)) return [];
      return [{ athlete, affiliation, competition: file.competition }];
    });
  });

  if (matches.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">이 브라우저에 올린 대회 {matches.length}</h2>
      <ul className="grid gap-2">
        {matches.map(({ athlete, affiliation, competition }) => (
          <li key={`${competition.id}-${athlete.id}`}>
            <Link
              href={`/published/${competition.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:bg-muted"
            >
              <span>
                <span className="font-medium">{athlete.name}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {affiliation.name} · {affiliation.region} · {competition.name}
                </span>
              </span>
              <Badge variant="secondary">{divisionLabel(affiliation.division)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
