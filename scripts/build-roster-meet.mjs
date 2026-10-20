import { readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseKsuRosterLines } from "../lib/records/parse-ksu.ts";

const pdfPath = process.argv[2];
const competitionId = process.argv[3];
const outputPath = process.argv[4];

if (!pdfPath || !competitionId || !outputPath) {
  console.error("usage: node scripts/build-roster-meet.mjs <pdf> <competitionId> <output.json>");
  process.exit(1);
}

const data = new Uint8Array(await readFile(pdfPath));
const doc = await getDocument({ data, disableWorker: true, isEvalSupported: false }).promise;
const lines = [];
for (let i = 1; i <= doc.numPages; i += 1) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
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
}

const repaired = lines.map((line) =>
  line === "53 42 정성빈 버들개 등학 3 경기 25 I 1 38 86"
    ? "53 42 정성빈 버들개초등학교 3 경기 25조 I 1:38.86"
    : line,
);
const parsed = parseKsuRosterLines(repaired, competitionId);
await writeFile(outputPath, `${JSON.stringify(parsed.file, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      events: parsed.file.events.length,
      athletes: parsed.file.athletes.length,
      results: parsed.file.results.length,
      unmatched: parsed.unmatched,
      competition: parsed.file.competition,
      labels: parsed.file.events.map((event) => event.label),
    },
    null,
    2,
  ),
);
