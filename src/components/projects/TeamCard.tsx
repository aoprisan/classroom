interface TeamCardProps {
  teamIndex: number;
  members: number[];
  getDisplayName?: (num: number) => string | undefined;
}

export function TeamCard({ teamIndex, members, getDisplayName }: TeamCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="text-xs text-gray-400 mb-2">Team {teamIndex + 1}</div>
      <div className="flex flex-wrap gap-1.5">
        {members.map((student) => {
          const name = getDisplayName?.(student);
          return (
            <span
              key={student}
              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm"
              title={name ? `${student}: ${name}` : undefined}
            >
              {name || `#${student}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
