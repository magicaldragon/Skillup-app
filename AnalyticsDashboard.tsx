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
    <div className="dashboard-card">
      <h3 className="dashboard-title">Analytics Dashboard</h3>
      <div className="dashboard-row">
        {assignments.map(a => (
          <div key={a.id} className="dashboard-section">
            <div className="dashboard-section-title">{a.title}</div>
            <div className="dashboard-text">Avg Score: <b>{avgScore(a.id)}</b></div>
            <div className="dashboard-text">Completion: <b>{completionRate(a.id)}</b></div>
          </div>
        ))}
      </div>
      <div className="dashboard-section">
        <h4 className="dashboard-section-title">Overdue Assignments</h4>
        {overdue.length === 0 ? <div className="dashboard-text dashboard-muted">None</div> : (
          <ul className="dashboard-list">
            {overdue.map(a => <li key={a.id}>{a.title} (Due: {a.dueDate})</li>)}
          </ul>
        )}
      </div>
      <div className="dashboard-row">
        <div className="dashboard-section">
          <h4 className="dashboard-section-title">Top Performers</h4>
          <ul className="dashboard-list">
            {top.map(({ student, avg }) => <li key={student.id}>{student.name} ({avg!.toFixed(1)})</li>)}
          </ul>
        </div>
        <div className="dashboard-section">
          <h4 className="dashboard-section-title">Bottom Performers</h4>
          <ul className="dashboard-list">
            {bottom.map(({ student, avg }) => <li key={student.id}>{student.name} ({avg!.toFixed(1)})</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 