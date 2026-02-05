interface MatrixCellProps {
  value: number; // -1 = not yet, >= 0 = round index
  isSelf: boolean;
}

export function MatrixCell({ value, isSelf }: MatrixCellProps) {
  if (isSelf) {
    return <div className="matrix-cell bg-gray-800 text-gray-800" />;
  }

  if (value >= 0) {
    return (
      <div className="matrix-cell bg-green-100 text-green-800 font-medium">
        {value + 1}
      </div>
    );
  }

  return <div className="matrix-cell bg-gray-50 text-gray-300" />;
}
