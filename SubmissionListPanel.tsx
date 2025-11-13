// SubmissionListPanel.tsx
// Props:
// - assignment: Assignment
// - submissions: Submission[]
// - students: Student[]
// - onSelectSubmission: (submission: Submission, student: Student) => void
// - loading?: boolean
// - error?: string | null
import type React from "react";
import type { Assignment, Student, Submission } from "./types";
import { formatDateTimeDDMMYYYY } from "./utils/stringUtils";

interface SubmissionListPanelProps {
  assignment: Assignment;
  submissions: Submission[];
  students: Student[];
  onSelectSubmission: (submission: Submission, student: Student) => void;
  loading?: boolean;
  error?: string | null;
}

const SubmissionListPanel: React.FC<SubmissionListPanelProps> = ({
  assignment,
  submissions,
  students,
  onSelectSubmission,
  loading,
  error,
}) => {
  const getStudent = (id: string) => students.find((s) => s.id === id);
  const filtered = submissions.filter((s) => s.assignmentId === assignment.id);

  if (loading) return <div className="p-8 text-center text-lg">Loading submissions...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-xl font-bold mb-4">Submissions for: {assignment.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Student</th>
              <th className="p-2">Submitted At</th>
              <th className="p-2">Score</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400">
                  No submissions yet.
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const student = getStudent(s.studentId);
              return (
                <tr key={s.id}>
                  <td className="p-2">{student ? student.name : s.studentId}</td>
                  <td className="p-2">
                    {s.submittedAt ? formatDateTimeDDMMYYYY(s.submittedAt) : "-"}
                  </td>
                  <td className="p-2">
                    {s.score !== null && s.score !== undefined ? s.score : "-"}
                  </td>
                  <td className="p-2">
                    {student && (
                      <button
                        type="button"
                        onClick={() => onSelectSubmission(s, student)}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Grade
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionListPanel;
