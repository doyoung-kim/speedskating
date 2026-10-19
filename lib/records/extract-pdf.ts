type PdfTextItem = {
  str: string;
  transform: number[];
};

export async function extractPdfLines(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs
    .getDocument({
      data,
      disableWorker: true,
      isEvalSupported: false,
    } as Parameters<typeof pdfjs.getDocument>[0])
    .promise;

  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    let current = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const text = item as PdfTextItem;
      const y = Math.round(text.transform[5] ?? 0);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (current.trim()) lines.push(current.trim());
        current = "";
      }
      current += text.str;
      lastY = y;
    }
    if (current.trim()) lines.push(current.trim());
  }

  return lines;
}
