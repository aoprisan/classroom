interface HeaderProps {
  totalStudents: number;
  completedRounds: number;
  totalRounds: number;
}

export function Header({ totalStudents, completedRounds, totalRounds }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Classroom Shuffle</h1>
        <div className="text-sm text-gray-500">
          {totalStudents} students &middot; Round {completedRounds}/{totalRounds}
        </div>
      </div>
    </header>
  );
}
