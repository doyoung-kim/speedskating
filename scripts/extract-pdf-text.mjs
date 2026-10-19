import { readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const input = process.argv[2];
const output = process.argv[3] ?? "scripts/pdf-text.txt";

const data = new Uint8Array(await readFile(input));
const doc = await getDocument({ data, disableWorker: true, isEvalSupported: false }).promise;

const pages = [];
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const lines = [];
  let current = "";
  let lastY = null;
  for (const item of content.items) {
    if (!("str" in item)) continue;
    const y = Math.round(item.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(current.trim());
      current = "";
    }
    current += item.str;
    lastY = y;
  }
  if (current.trim()) lines.push(current.trim());
  pages.push(`--- page ${i} ---\n${lines.join("\n")}`);
}

await writeFile(output, pages.join("\n\n"));
console.log(`pages=${doc.numPages} -> ${output}`);
