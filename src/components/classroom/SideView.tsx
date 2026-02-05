import type { ColumnFov } from '../../lib/field-of-view';
import { fovScoreToColor } from '../../lib/field-of-view';

interface SideViewProps {
  fov: ColumnFov[];
  getDisplayName?: (num: number) => string | undefined;
}

const BENCH_WIDTH = 40;
const BENCH_GAP = 30;
const LEFT_MARGIN = 50;
const TOP_MARGIN = 20;
const BOTTOM_MARGIN = 30;
const COL_GAP = 30;
const HEIGHT_SCALE = 2; // px per cm

function columnWidth(benchCount: number): number {
  return benchCount * BENCH_WIDTH + (benchCount - 1) * BENCH_GAP;
}

export function SideView({ fov, getDisplayName }: SideViewProps) {
  if (fov.length === 0) return null;

  // Find global min/max heights for scaling
  let minH = Infinity;
  let maxH = -Infinity;
  for (const col of fov) {
    for (const bench of col.benches) {
      for (const s of bench) {
        if (s.height < minH) minH = s.height;
        if (s.height > maxH) maxH = s.height;
      }
    }
  }

  // Baseline: 20cm below the shortest student
  const baseline = Math.max(0, minH - 20);
  const colWidths = fov.map((c) => columnWidth(c.benches.length));
  const totalWidth = LEFT_MARGIN + colWidths.reduce((a, b) => a + b, 0) + COL_GAP * (fov.length - 1) + 20;
  const totalHeight = TOP_MARGIN + (maxH - baseline) * HEIGHT_SCALE + BOTTOM_MARGIN + 20;

  // Pre-compute column X offsets to avoid mutation during render
  const colXOffsets: number[] = [];
  let accX = LEFT_MARGIN;
  for (let i = 0; i < fov.length; i++) {
    colXOffsets.push(accX);
    accX += colWidths[i] + COL_GAP;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Side View (Column Cross-Section)</h3>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full"
        style={{ maxHeight: 300 }}
      >
        {/* Baseline */}
        <line
          x1={0}
          y1={totalHeight - BOTTOM_MARGIN}
          x2={totalWidth}
          y2={totalHeight - BOTTOM_MARGIN}
          stroke="#d1d5db"
          strokeWidth={1}
        />

        {fov.map((col, ci) => {
          const startX = colXOffsets[ci];
          const elements: React.ReactElement[] = [];

          // Column label
          elements.push(
            <text
              key={`label-${ci}`}
              x={startX + colWidths[ci] / 2}
              y={totalHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
            >
              Row {ci + 1}
            </text>,
          );

          // Draw students as rectangles
          col.benches.forEach((bench, bi) => {
            const benchX = startX + bi * (BENCH_WIDTH + BENCH_GAP);

            bench.forEach((student, si) => {
              const barHeight = (student.height - baseline) * HEIGHT_SCALE;
              const barY = totalHeight - BOTTOM_MARGIN - barHeight;
              const barW = BENCH_WIDTH / bench.length;
              const barX = benchX + si * barW;

              elements.push(
                <rect
                  key={`rect-${ci}-${bi}-${si}`}
                  x={barX}
                  y={barY}
                  width={barW - 2}
                  height={barHeight}
                  fill={fovScoreToColor(student.score)}
                  opacity={0.8}
                  rx={2}
                />,
              );

              // Student label
              const name = getDisplayName?.(student.studentNum);
              elements.push(
                <text
                  key={`text-${ci}-${bi}-${si}`}
                  x={barX + (barW - 2) / 2}
                  y={barY - 3}
                  textAnchor="middle"
                  className="text-[8px] fill-gray-600"
                >
                  {name ?? `#${student.studentNum}`}
                </text>,
              );
            });
          });

          // Draw sight lines from back students toward front
          for (let bi = 1; bi < col.benches.length; bi++) {
            for (const student of col.benches[bi]) {
              const eyeX = startX + bi * (BENCH_WIDTH + BENCH_GAP) + BENCH_WIDTH / 2;
              const eyeY = totalHeight - BOTTOM_MARGIN - (student.height - baseline) * HEIGHT_SCALE;

              // Line goes to front of column (x = startX, teacher side)
              const targetX = startX - 10;
              const targetY = eyeY; // horizontal sight line toward teacher

              const blocked = student.score < 1.0;
              elements.push(
                <line
                  key={`sight-${ci}-${bi}-${student.studentNum}`}
                  x1={eyeX}
                  y1={eyeY}
                  x2={targetX}
                  y2={targetY}
                  stroke={blocked ? '#ef4444' : '#22c55e'}
                  strokeWidth={1}
                  strokeDasharray={blocked ? '4 3' : '2 4'}
                  opacity={0.6}
                />,
              );
            }
          }

          return <g key={`col-${ci}`}>{elements}</g>;
        })}

        {/* Height scale markers */}
        {Array.from({ length: Math.ceil((maxH - baseline) / 10) + 1 }, (_, i) => {
          const h = baseline + i * 10;
          if (h > maxH + 5) return null;
          const y = totalHeight - BOTTOM_MARGIN - (h - baseline) * HEIGHT_SCALE;
          return (
            <g key={`scale-${i}`}>
              <line x1={0} y1={y} x2={LEFT_MARGIN - 5} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={LEFT_MARGIN - 8} y={y + 3} textAnchor="end" className="text-[8px] fill-gray-400">
                {h}
              </text>
            </g>
          );
        })}

        {/* Teacher label */}
        <text x={LEFT_MARGIN - 8} y={totalHeight - 8} textAnchor="end" className="text-[9px] fill-amber-700 font-medium">
          Front
        </text>
      </svg>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-dashed border-red-400" /> blocked sight line
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dashed border-green-400" /> clear sight line
        </span>
        <span>Heights in cm</span>
      </div>
    </div>
  );
}
