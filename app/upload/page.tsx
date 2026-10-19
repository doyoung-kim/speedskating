import Link from "next/link";

import { UploadPanel } from "@/components/records/upload-panel";
import { competition } from "@/lib/records/catalog";

export default function UploadPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">결과 업로드</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          KSU 공식 결과 PDF를 올리면 종목, 기록, 소속 부문을 바로 읽어 보여 줍니다. 확인 후 이
          브라우저에 게시할 수 있습니다.
        </p>
      </div>
      <UploadPanel />
      <p className="text-sm text-muted-foreground">
        이미 반영된 대회:{" "}
        <Link href={`/meets/${competition.id}`} className="underline">
          {competition.name}
        </Link>
      </p>
    </main>
  );
}
