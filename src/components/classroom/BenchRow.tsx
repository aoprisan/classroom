import type { Pair } from '../../types';
import { Bench, AloneBench } from './Bench';

interface BenchRowProps {
  pairs: Pair[];
  aloneStudent?: number;
  getDisplayName?: (num: number) => string | undefined;
}

export function BenchRow({ pairs, aloneStudent, getDisplayName }: BenchRowProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {pairs.map((pair, i) => (
        <Bench key={i} pair={pair} getDisplayName={getDisplayName} />
      ))}
      {aloneStudent !== undefined && (
        <AloneBench student={aloneStudent} getDisplayName={getDisplayName} />
      )}
    </div>
  );
}
