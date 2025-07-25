import React from 'react';
import type { Assignment, Submission, Student } from './types';

interface AnalyticsDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  students: Student[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ assignments, submissions, students }) => {
  // Average score per assignment
  const avgScore = (aid: string) => {
    const subs = submissions.filter(s => s.assignmentId === aid && s.score !== null && s.score !== undefined);
    if (!subs.length) return '-';
    return (subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length).toFixed(1);
  };
  // Completion rate per assignment
  const completionRate = (aid: string) => {
    const total = students.length;
    const completed = submissions.filter(s => s.assignmentId === aid).length;
    return total ? ((completed / total) * 100).toFixed(0) + '%' : '-';
  };
  // Overdue assignments
  const now = new Date();
  const overdue = assignments.filter(a => new Date(a.dueDate) < now && submissions.filter(s => s.assignmentId === a.id).length < students.length);
  // Top/bottom performers
  const studentScores = students.map(stu => {
    const stuSubs = submissions.filter(s => s.studentId === stu.id && s.score !== null && s.score !== undefined);
    const avg = stuSubs.length ? stuSubs.reduce((sum, s) => sum + (s.score || 0), 0) / stuSubs.length : null;
    return { student: stu, avg };
  }).filter(s => s.avg !== null);
  const top = [...studentScores].sort((a, b) => (b.avg! - a.avg!)).slice(0, 3);
  const bottom = [...studentScores].sort((a, b) => (a.avg! - b.avg!)).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-xl font-bold mb-4">Analytics Dashboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {assignments.map(a => (
          <div key={a.id} className="bg-slate-50 rounded p-4">
            <div className="font-semibold">{a.title}</div>
            <div>Avg Score: <b>{avgScore(a.id)}</b></div>
            <div>Completion: <b>{completionRate(a.id)}</b></div>
          </div>
        ))}
      </div>
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Overdue Assignments</h4>
        {overdue.length === 0 ? <div className="text-slate-400">None</div> : (
          <ul className="list-disc ml-6">
            {overdue.map(a => <li key={a.id}>{a.title} (Due: {a.dueDate})</li>)}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2">Top Performers</h4>
          <ul className="list-decimal ml-6">
            {top.map(({ student, avg }) => <li key={student.id}>{student.name} ({avg!.toFixed(1)})</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Bottom Performers</h4>
          <ul className="list-decimal ml-6">
            {bottom.map(({ student, avg }) => <li key={student.id}>{student.name} ({avg!.toFixed(1)})</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 