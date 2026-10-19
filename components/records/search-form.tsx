import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({
  query = "",
  autoFocus = false,
}: {
  query?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/search" className="flex w-full gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={query}
          autoFocus={autoFocus}
          placeholder="선수, 소속, 지역 검색"
          className="h-10 pl-8"
          aria-label="기록 검색"
        />
      </div>
      <Button type="submit" className="h-10">
        검색
      </Button>
    </form>
  );
}
