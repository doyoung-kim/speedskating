import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col gap-3 py-16">
      <h1 className="font-heading text-3xl font-medium">찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">선수나 대회 주소가 바뀌었거나 아직 없습니다.</p>
      <Link href="/" className="text-sm font-medium underline">
        검색으로 돌아가기
      </Link>
    </main>
  );
}
