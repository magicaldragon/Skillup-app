import { useEffect, useState } from 'react';
import type { Assignment, Student, Submission } from './types';
import { formatDateMMDDYYYY } from './utils/stringUtils';

const StudentScoresFeedbackPanel = ({ user }: { user: Student }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [assignRes, subRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/submissions'),
      ]);
      const assignData = await assignRes.json();
      setAssignments(assignData.assignments || []);
      const subData = await subRes.json();
      setSubmissions(subData.submissions || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const mySubs = submissions.filter((s) => s.studentId === user.id);
  const rows = mySubs
    .map((sub) => {
      const a = assignments.find((a) => a.id === sub.assignmentId);
      return {
        ...sub,
        assignmentTitle: a?.title || '',
        assignmentType: a?.skill || '',
        date: a?.dueDate || '',
      };
    })
    .filter(
      (row) =>
        (!typeFilter || row.assignmentType === typeFilter) &&
        (!search || row.assignmentTitle.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sortOrder === 'newest'
        ? (b.date || '').localeCompare(a.date || '')
        : (a.date || '').localeCompare(b.date || '')
    );

  const uniqueTypes = Array.from(new Set(assignments.map((a) => a.skill)));

  if (loading) return <div className="p-8 text-center text-lg">Loading scores and feedback...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Scores and Feedback</h2>
      <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
        <input
          className="p-2 border rounded flex-1"
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-2 border rounded"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="p-2 border rounded"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
        >
          <option value="newest">Newest to Oldest</option>
          <option value="oldest">Oldest to Newest</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Assignment</th>
              <th className="p-2">Type</th>
              <th className="p-2">Score</th>
              <th className="p-2">Feedback</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400">
                  No results found.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-100 transition">
                <td className="p-2 font-semibold">{row.assignmentTitle}</td>
                <td className="p-2">{row.assignmentType}</td>
                <td className="p-2">{typeof row.score === 'number' ? row.score : '-'}</td>
                <td className="p-2">{row.feedback || '-'}</td>
                <td className="p-2">{row.date ? formatDateMMDDYYYY(row.date) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentScoresFeedbackPanel;
