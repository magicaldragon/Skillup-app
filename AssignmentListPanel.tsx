// AssignmentListPanel.tsx
// Props:
// - assignments: Assignment[]
// - classes: StudentClass[]
// - onSelectAssignment: (assignment: Assignment) => void
// - loading?: boolean
// - error?: string | null
import type React from 'react';
import { useState } from 'react';
import type { Assignment, StudentClass } from './types';

interface AssignmentListPanelProps {
  assignments: Assignment[];
  classes: StudentClass[];
  onSelectAssignment: (assignment: Assignment) => void;
  loading?: boolean;
  error?: string | null;
}

const AssignmentListPanel: React.FC<AssignmentListPanelProps> = ({
  assignments,
  classes,
  onSelectAssignment,
  loading,
  error,
}) => {
  const [classFilter, setClassFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [search, setSearch] = useState('');

  if (loading) return <div className="p-8 text-center text-lg">Loading assignments...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  const filtered = assignments.filter(
    (a) =>
      (!classFilter || a.classIds?.includes(classFilter)) &&
      (!skillFilter || a.skill === skillFilter) &&
      (!search || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Skills</option>
          <option value="Listening">Listening</option>
          <option value="Reading">Reading</option>
          <option value="Writing">Writing</option>
          <option value="Speaking">Speaking</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title..."
          className="p-2 border rounded flex-1"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Skill</th>
              <th className="p-2">Level</th>
              <th className="p-2">Due Date</th>
              <th className="p-2">Classes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400">
                  No assignments found.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="p-2 font-semibold">{a.title}</td>
                <td className="p-2">{a.skill}</td>
                <td className="p-2">{a.level}</td>
                <td className="p-2">{a.dueDate}</td>
                <td className="p-2">
                  {(a.classIds || [])
                    .map((cid) => classes.find((c) => c.id === cid)?.name)
                    .join(', ')}
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => onSelectAssignment(a)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    View Submissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentListPanel;
