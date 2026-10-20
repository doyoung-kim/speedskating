import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAxisTime,
  formatPercent,
  formatSeconds,
  latestProfiles,
  profileReading,
  ratioSentence,
  type DistanceProfile,
  type GrowthPoint,
  type GrowthSeries,
} from "@/lib/records/growth";
import { divisionLabel, genderLabel } from "@/lib/records/labels";

const width = 640;
const height = 248;
const padL = 56;
const padR = 64;
const padT = 28;
const padB = 36;

function pointLines(point: GrowthPoint) {
  const speed = point.speedLabel ? ` · ${point.speedLabel}` : "";
  const hasPbSentence = point.isPb && point.pbDeltaMs != null && point.pbDeltaPercent != null;
  const mark = point.isPb && !hasPbSentence ? " · PB" : "";
  const headline = `${point.year} ${point.timeDisplay}${speed} · ${point.affiliationName} · ${divisionLabel(point.division)}${mark}`;
  const details: string[] = [];
  if (hasPbSentence && point.pbDeltaMs != null && point.pbDeltaPercent != null) {
    details.push(
      `이전 최고보다 ${formatSeconds(point.pbDeltaMs)}, ${formatPercent(point.pbDeltaPercent)} 단축`,
    );
  }
  if (
    point.deltaMs != null &&
    point.deltaPercent != null &&
    !(point.isPb && point.deltaMs === point.pbDeltaMs)
  ) {
    if (point.deltaMs === 0) details.push("직전 기록과 같습니다.");
    else if (point.deltaMs < 0) {
      details.push(
        `직전보다 ${formatSeconds(point.deltaMs)}, ${formatPercent(point.deltaPercent)} 단축`,
      );
    } else {
      details.push(
        `직전보다 ${formatSeconds(point.deltaMs)}, ${formatPercent(point.deltaPercent)} 느려짐`,
      );
    }
  }
  return { headline, details };
}

const fontSize = 13;

type LabelBox = { x: number; y: number; w: number; h: number };

function labelWidth(text: string) {
  let size = 0;
  for (const char of text) size += char.charCodeAt(0) > 127 ? 13 : 7.2;
  return size;
}

function labelBox(text: string, anchorX: number, baseline: number, anchor: "middle" | "start" | "end"): LabelBox {
  const w = labelWidth(text);
  const x = anchor === "middle" ? anchorX - w / 2 : anchor === "end" ? anchorX - w : anchorX;
  return { x, y: baseline - fontSize, w, h: fontSize };
}

function boxesHit(a: LabelBox, b: LabelBox) {
  const gap = 4;
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function boxFits(box: LabelBox, taken: LabelBox[]) {
  if (box.y < 1 || box.y + box.h > height - 1 || box.x < 1 || box.x + box.w > width - 1) return false;
  return taken.every((item) => !boxesHit(box, item));
}

function placeText(
  taken: LabelBox[],
  text: string,
  anchorX: number,
  baselines: number[],
  anchor: "middle" | "start" | "end",
) {
  for (const baseline of baselines) {
    const box = labelBox(text, anchorX, baseline, anchor);
    if (boxFits(box, taken)) {
      taken.push(box);
      return { x: anchorX, y: baseline };
    }
  }
  const fallback = baselines[0] ?? fontSize;
  taken.push(labelBox(text, anchorX, fallback, anchor));
  return { x: anchorX, y: fallback };
}

function chartScale(series: GrowthSeries) {
  const values = series.points.flatMap((point) =>
    [point.timeMs, point.fieldBestMs, point.fieldMedianMs].filter((value): value is number => value != null),
  );
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = Math.max(high - low, 200);
  const pad = span * 0.12;
  return { min: low - pad, max: high + pad };
}

function GrowthChart({ series }: { series: GrowthSeries }) {
  const { min, max } = chartScale(series);
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const xAt = (index: number) =>
    series.points.length === 1 ? padL + innerW / 2 : padL + (index / (series.points.length - 1)) * innerW;
  const yAt = (timeMs: number) => padT + ((max - timeMs) / (max - min)) * innerH;

  const line = (pick: (point: GrowthPoint) => number | null) => {
    const points = series.points
      .map((point, index) => {
        const timeMs = pick(point);
        return timeMs == null ? null : `${xAt(index)},${yAt(timeMs)}`;
      })
      .filter((value): value is string => value != null);
    return points.length > 1 ? points.join(" ") : "";
  };

  const title = `${genderLabel(series.gender)} ${series.distance}m`;
  const last = series.points[series.points.length - 1];
  const taken: LabelBox[] = [];
  const axisLabels = [
    { text: formatAxisTime(max), y: padT + 4 },
    { text: formatAxisTime((max + min) / 2), y: padT + innerH / 2 + 4 },
    { text: formatAxisTime(min), y: height - padB },
  ];
  for (const axis of axisLabels) taken.push(labelBox(axis.text, padL - 8, axis.y, "end"));
  for (const [index, point] of series.points.entries()) {
    taken.push(labelBox(String(point.year), xAt(index), height - 12, "middle"));
    taken.push({ x: xAt(index) - 9, y: yAt(point.timeMs) - 9, w: 18, h: 18 });
  }
  const timeLabels = series.points.map((point, index) => {
    const text = point.timeDisplay;
    let anchorX = xAt(index);
    const earlierSameYear = series.points.slice(0, index).filter((item) => item.year === point.year).length;
    if (earlierSameYear > 0) {
      const half = labelWidth(text) / 2;
      anchorX = Math.min(width - padR - half, Math.max(padL + half, anchorX + 32 * earlierSameYear));
    }
    const cy = yAt(point.timeMs);
    const baselines = [cy - 16, cy + 28];
    for (let step = 1; step <= 6; step += 1) baselines.push(cy - 16 - step * 16);
    return { text, ...placeText(taken, text, anchorX, baselines, "middle") };
  });
  const referenceLabels = [
    last.fieldMedianMs == null ? null : { text: "중앙", timeMs: last.fieldMedianMs },
    last.fieldBestMs == null ? null : { text: "1위", timeMs: last.fieldBestMs },
  ]
    .filter((item): item is { text: string; timeMs: number } => item != null)
    .sort((a, b) => yAt(a.timeMs) - yAt(b.timeMs))
    .map((item) => {
      const y = yAt(item.timeMs) + 4;
      const baselines = [y];
      for (let step = 1; step <= 8; step += 1) baselines.push(y - step * 16, y + step * 16);
      return { text: item.text, ...placeText(taken, item.text, width - padR + 8, baselines, "start") };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${series.name} ${title} 연도별 기록`}
        >
          {[0, 0.5, 1].map((step) => {
            const y = padT + innerH * step;
            return (
              <line
                key={step}
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
              />
            );
          })}
          {axisLabels.map((axis) => (
            <text
              key={axis.y}
              x={padL - 8}
              y={axis.y}
              textAnchor="end"
              fontSize={fontSize}
              className="fill-muted-foreground"
            >
              {axis.text}
            </text>
          ))}
          {[
            { points: line((point) => point.fieldMedianMs), dash: "2 4" },
            { points: line((point) => point.fieldBestMs), dash: "6 4" },
          ].map((item) =>
            item.points ? (
              <polyline
                key={item.dash}
                points={item.points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray={item.dash}
                className="text-muted-foreground"
              />
            ) : null,
          )}
          {line((point) => point.timeMs) ? (
            <polyline
              points={line((point) => point.timeMs)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          ) : null}
          {series.points.length === 1 ? (
            <g className="text-muted-foreground">
              {series.points[0].fieldMedianMs != null ? (
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={yAt(series.points[0].fieldMedianMs)}
                  y2={yAt(series.points[0].fieldMedianMs)}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2 4"
                />
              ) : null}
              {series.points[0].fieldBestMs != null ? (
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={yAt(series.points[0].fieldBestMs)}
                  y2={yAt(series.points[0].fieldBestMs)}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              ) : null}
            </g>
          ) : null}
          {referenceLabels.map((label) => (
            <text
              key={label.text}
              x={label.x}
              y={label.y}
              fontSize={fontSize}
              className="fill-muted-foreground"
            >
              {label.text}
            </text>
          ))}
          {series.points.map((point, index) => {
            const lines = pointLines(point);
            const timeLabel = timeLabels[index];
            return (
              <g key={`${point.date}-${point.affiliationName}`}>
                <circle
                  cx={xAt(index)}
                  cy={yAt(point.timeMs)}
                  r={point.isPb ? 6 : 4}
                  className={point.isPb ? "fill-foreground" : "fill-background"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <title>{[lines.headline, ...lines.details].join(" ")}</title>
                </circle>
                <text
                  x={timeLabel.x}
                  y={timeLabel.y}
                  textAnchor="middle"
                  fontSize={fontSize}
                  className="fill-foreground"
                >
                  {timeLabel.text}
                </text>
                <text
                  x={xAt(index)}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize={fontSize}
                  className="fill-muted-foreground"
                >
                  {point.year}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>실선 기록</span>
          <span>긴 점선 부문 1위</span>
          <span>짧은 점선 부문 중앙값</span>
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {series.points.map((point) => {
            const lines = pointLines(point);
            return (
              <li key={`${point.date}-${point.affiliationName}-${point.timeMs}`} className="flex flex-col">
                <span className="tabular-nums">{lines.headline}</span>
                {lines.details.map((detail) => (
                  <span key={detail} className="text-muted-foreground">
                    {detail}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function ProfileBars({ profiles }: { profiles: DistanceProfile[] }) {
  const genders = [...new Set(profiles.map((item) => item.gender))];
  return (
    <div className="flex flex-col gap-3">
      {genders.map((gender) => {
        const items = profiles
          .filter((item) => item.gender === gender)
          .sort((a, b) => a.distance - b.distance);
        const note = profileReading(items);
        return (
          <div key={gender} className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">1위에 가까울수록 막대가 깁니다.</p>
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const widthPercent =
                  item.ratio == null ? 0 : Math.max(8, Math.min(100, (1 / item.ratio) * 100));
                return (
                  <li key={`${item.gender}-${item.distance}`} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm">
                    <span className="tabular-nums">
                      {genders.length > 1 ? `${genderLabel(gender)} ` : ""}
                      {item.distance}m
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="h-2 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-foreground" style={{ width: `${widthPercent}%` }} />
                      </span>
                      <span className="text-muted-foreground">
                        {ratioSentence(item.year, item.division, item.ratio)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function byName(series: GrowthSeries[]) {
  const groups = new Map<string, GrowthSeries[]>();
  for (const item of series) {
    const list = groups.get(item.name);
    if (list) list.push(item);
    else groups.set(item.name, [item]);
  }
  return [...groups.entries()];
}

export function GrowthCharts({ series }: { series: GrowthSeries[] }) {
  if (series.length === 0) return null;
  const names = byName(series);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-muted-foreground">성장</h2>
        <p className="text-sm text-muted-foreground">
          공인기록회 완주 기록입니다. 시간이 줄면 선이 아래로 내려갑니다. 기준선은 그해 같은 부문입니다.
        </p>
      </div>
      {names.map(([name, items]) => (
        <div key={name} className="flex flex-col gap-3">
          <h3 className="font-heading text-xl font-medium">{name}</h3>
          <ProfileBars profiles={latestProfiles(items)} />
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <GrowthChart key={`${item.gender}-${item.distance}`} series={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
