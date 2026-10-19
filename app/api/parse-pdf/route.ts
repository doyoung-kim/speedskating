import { extractPdfLines } from "@/lib/records/extract-pdf";
import { parseKsuLines } from "@/lib/records/parse-ksu";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "PDF 파일이 필요합니다." }, { status: 400 });
  }
  const pdfName = file.name.toLowerCase().endsWith(".pdf");
  const pdfType =
    !file.type ||
    file.type === "application/pdf" ||
    file.type === "application/x-pdf" ||
    file.type === "application/octet-stream";
  if (!pdfName && !pdfType) {
    return Response.json({ error: "PDF 파일만 올릴 수 있습니다." }, { status: 400 });
  }

  try {
    const lines = await extractPdfLines(new Uint8Array(await file.arrayBuffer()));
    const parsed = parseKsuLines(lines);
    if (parsed.file.results.length === 0) {
      return Response.json(
        {
          error: "결과 행을 찾지 못했습니다. KSU 공식 결과 PDF인지 확인해 주세요.",
          unmatched: parsed.unmatched.slice(0, 12),
        },
        { status: 422 },
      );
    }
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "PDF를 읽지 못했습니다." }, { status: 400 });
  }
}
