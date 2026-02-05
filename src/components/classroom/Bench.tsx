import type { Pair } from '../../types';

interface BenchProps {
  pair: Pair;
  getDisplayName?: (num: number) => string | undefined;
  getHeight?: (num: number) => number | null | undefined;
}

function StudentSeat({ num, getDisplayName, getHeight }: { num: number; getDisplayName?: (num: number) => string | undefined; getHeight?: (num: number) => number | null | undefined }) {
  const name = getDisplayName?.(num);
  const height = getHeight?.(num);
  return (
    <div className="w-12 h-16 rounded-md bg-blue-500 text-white flex flex-col items-center justify-center">
      <span className="font-bold text-sm leading-tight">{num}</span>
      {name && <span className="text-[9px] leading-tight truncate max-w-[44px]">{name}</span>}
      {height != null && <span className="text-[8px] leading-tight opacity-75">{height}cm</span>}
    </div>
  );
}

export function Bench({ pair, getDisplayName, getHeight }: BenchProps) {
  const h0 = getHeight?.(pair[0]);
  const h1 = getHeight?.(pair[1]);
  const knownHeights = [h0, h1].filter((h): h is number => h != null);
  const avg = knownHeights.length > 0
    ? Math.round(knownHeights.reduce((a, b) => a + b, 0) / knownHeights.length)
    : null;

  return (
    <div className="flex items-center gap-0 bg-amber-800 rounded-lg px-1 py-2 shadow-md relative">
      <StudentSeat num={pair[0]} getDisplayName={getDisplayName} getHeight={getHeight} />
      <div className="w-3" />
      <StudentSeat num={pair[1]} getDisplayName={getDisplayName} getHeight={getHeight} />
      {avg != null && (
        <span className="absolute -right-1 -top-1 bg-amber-600 text-amber-100 text-[8px] leading-none px-1 py-0.5 rounded-full shadow">
          avg {avg}
        </span>
      )}
    </div>
  );
}

interface AloneBenchProps {
  student: number;
  getDisplayName?: (num: number) => string | undefined;
  getHeight?: (num: number) => number | null | undefined;
}

export function AloneBench({ student, getDisplayName, getHeight }: AloneBenchProps) {
  const name = getDisplayName?.(student);
  const height = getHeight?.(student);
  return (
    <div className="flex items-center bg-amber-800 rounded-lg px-1 py-2 shadow-md opacity-70">
      <div className="w-12 h-16 rounded-md bg-yellow-500 text-white flex flex-col items-center justify-center">
        <span className="font-bold text-sm leading-tight">{student}</span>
        {name && <span className="text-[9px] leading-tight truncate max-w-[44px]">{name}</span>}
        {height != null && <span className="text-[8px] leading-tight opacity-75">{height}cm</span>}
      </div>
      <div className="w-3" />
      <div className="w-12 h-16 rounded-md bg-gray-300 flex items-center justify-center text-gray-400 text-xs">
        —
      </div>
    </div>
  );
}
