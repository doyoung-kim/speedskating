import { Suspense } from "react";

import { PublishedMeet } from "@/components/records/published-meet";

export default function PublishedMeetPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">올린 대회를 불러오는 중…</p>}>
      <PublishedMeet params={params} />
    </Suspense>
  );
}
