import { fovScoreToColor } from '../../lib/field-of-view';

const STEPS = 10;

export function FovLegend() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>Blocked</span>
      <div className="flex h-4">
        {Array.from({ length: STEPS + 1 }, (_, i) => {
          const score = i / STEPS;
          return (
            <div
              key={i}
              className="w-3 h-full"
              style={{ backgroundColor: fovScoreToColor(score) }}
            />
          );
        })}
      </div>
      <span>Clear</span>
    </div>
  );
}
