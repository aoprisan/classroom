import type { Pair } from '../../types';

interface BenchProps {
  pair: Pair;
  getDisplayName?: (num: number) => string | undefined;
}

function StudentSeat({ num, getDisplayName }: { num: number; getDisplayName?: (num: number) => string | undefined }) {
  const name = getDisplayName?.(num);
  return (
    <div className="w-12 h-14 rounded-md bg-blue-500 text-white flex flex-col items-center justify-center">
      <span className="font-bold text-sm leading-tight">{num}</span>
      {name && <span className="text-[9px] leading-tight truncate max-w-[44px]">{name}</span>}
    </div>
  );
}

export function Bench({ pair, getDisplayName }: BenchProps) {
  return (
    <div className="flex items-center gap-0 bg-amber-800 rounded-lg px-1 py-2 shadow-md">
      <StudentSeat num={pair[0]} getDisplayName={getDisplayName} />
      <div className="w-3" />
      <StudentSeat num={pair[1]} getDisplayName={getDisplayName} />
    </div>
  );
}

interface AloneBenchProps {
  student: number;
  getDisplayName?: (num: number) => string | undefined;
}

export function AloneBench({ student, getDisplayName }: AloneBenchProps) {
  const name = getDisplayName?.(student);
  return (
    <div className="flex items-center bg-amber-800 rounded-lg px-1 py-2 shadow-md opacity-70">
      <div className="w-12 h-14 rounded-md bg-yellow-500 text-white flex flex-col items-center justify-center">
        <span className="font-bold text-sm leading-tight">{student}</span>
        {name && <span className="text-[9px] leading-tight truncate max-w-[44px]">{name}</span>}
      </div>
      <div className="w-3" />
      <div className="w-12 h-14 rounded-md bg-gray-300 flex items-center justify-center text-gray-400 text-xs">
        —
      </div>
    </div>
  );
}
