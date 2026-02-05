import type { StudentMeta, StudentMetaMap } from '../../types';

interface StudentsPanelProps {
  totalStudents: number;
  metaMap: StudentMetaMap;
  onUpdateStudent: (num: number, meta: StudentMeta) => void;
}

export function StudentsPanel({ totalStudents, metaMap, onUpdateStudent }: StudentsPanelProps) {
  const students = Array.from({ length: totalStudents }, (_, i) => i + 1);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Students</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-2 text-left text-gray-500 font-medium w-12">#</th>
              <th className="py-2 px-2 text-left text-gray-500 font-medium">Last Name</th>
              <th className="py-2 px-2 text-left text-gray-500 font-medium">First Name</th>
              <th className="py-2 px-2 text-left text-gray-500 font-medium w-20">Gender</th>
              <th className="py-2 px-2 text-left text-gray-500 font-medium w-28">Height (cm)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((num) => {
              const meta = metaMap[num] ?? { lastName: '', firstName: '', heightCm: null, gender: '' as const };
              return (
                <tr key={num} className="border-b border-gray-100">
                  <td className="py-1.5 px-2 text-gray-500 font-medium">{num}</td>
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={meta.lastName}
                      onChange={(e) =>
                        onUpdateStudent(num, { ...meta, lastName: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Last name"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={meta.firstName}
                      onChange={(e) =>
                        onUpdateStudent(num, { ...meta, firstName: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="First name"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <select
                      value={meta.gender}
                      onChange={(e) =>
                        onUpdateStudent(num, { ...meta, gender: e.target.value as 'M' | 'F' | '' })
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="">—</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={meta.heightCm ?? ''}
                      onChange={(e) =>
                        onUpdateStudent(num, {
                          ...meta,
                          heightCm: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="cm"
                      min={50}
                      max={250}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
