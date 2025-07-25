// StudentDashboard.tsx
// Professional dashboard layout for students with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React from 'react';
import Sidebar from './Sidebar';
import type { Assignment, Submission, Student, StudentClass } from './types';

const StudentDashboard = ({ user, assignments, submissions, classes, onNavigate, activeKey }: {
  user: Student,
  assignments: Assignment[],
  submissions: Submission[],
  classes: StudentClass[],
  onNavigate: (key: string) => void,
  activeKey: string
}) => {
  // Only show assignments assigned to the student's classes
  const myAssignments = assignments.filter(a => !a.classIds.length || (user.classIds || []).some(cid => a.classIds.includes(cid)));
  // Only show submissions by this student
  const mySubmissions = submissions.filter(s => s.studentId === user.id);
  // Map assignmentId to submission for quick lookup
  const submissionMap = Object.fromEntries(mySubmissions.map(s => [s.assignmentId, s]));

  return (
    <main className="flex-1 p-8 min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <div className="text-slate-600 mb-8">Welcome back! Here's a summary of your progress.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-slate-500 text-lg mb-2">Total Assignments</div>
          <div className="text-5xl font-bold text-[#307637]">{myAssignments.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-slate-500 text-lg mb-2">Submitted</div>
          <div className="text-5xl font-bold text-[#307637]">{mySubmissions.length}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">Your Assignments & Feedback</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Skill</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Score</th>
                <th className="p-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {myAssignments.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400">No assignments assigned.</td></tr>}
              {myAssignments.map(a => {
                const sub = submissionMap[a.id];
                return (
                  <tr key={a.id}>
                    <td className="p-2 font-semibold">{a.title}</td>
                    <td className="p-2">{a.skill}</td>
                    <td className="p-2">{a.dueDate}</td>
                    <td className="p-2">{sub ? (sub.score !== null && sub.score !== undefined ? sub.score : 'Ungraded') : 'Not submitted'}</td>
                    <td className="p-2">{sub && sub.feedback ? sub.feedback : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default StudentDashboard; 