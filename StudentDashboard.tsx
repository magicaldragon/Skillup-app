// StudentDashboard.tsx
// Professional dashboard layout for students with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React from 'react';
import Sidebar from './Sidebar';
import type { Assignment, Submission, Student, StudentClass } from './types';
import SettingsPanel from './SettingsPanel';

const StudentDashboard = ({ user, assignments, submissions, classes, onNavigate, activeKey, onLogout }: {
  user: Student,
  assignments: Assignment[],
  submissions: Submission[],
  classes: StudentClass[],
  onNavigate: (key: string) => void,
  activeKey: string,
  onLogout: () => void
}) => {
  return (
    <div className="teacher-dashboard">
      {activeKey === 'settings' ? (
        <SettingsPanel user={user} isAdmin={false} onLogout={onLogout} classes={classes} />
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <div className="text-slate-600 mb-8">Welcome back! This section will be rebuilt later.</div>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
            <p className="text-slate-600">Assignment and submission features will be available here in the future.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard; 