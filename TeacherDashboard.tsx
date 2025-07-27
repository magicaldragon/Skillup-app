// TeacherDashboard.tsx
// Professional dashboard layout for teachers/admins with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState } from 'react';
import type { Assignment, Student, StudentClass } from './types';
import ClassesPanel from './ClassesPanel';
import AddStudentPanel from './AddStudentPanel';
import LevelsPanel from './LevelsPanel';
import WaitingListPanel from './WaitingListPanel';
import SettingsPanel from './SettingsPanel';

const TeacherDashboard = ({ user, students, assignments, classes, activeKey, onLogout }: {
  user: Student,
  students: Student[],
  assignments: Assignment[],
  classes: StudentClass[],
  activeKey: string,
  onLogout: () => void
}) => {
  // Example summary metrics (IELTS focus)
  const totalStudents = students.length;
  const activeAssignments = assignments.filter(a => a.level === 'IELTS').length;
  const [classList, setClassList] = useState(classes);
  const handleAddClass = (code: string) => {
    // Add new class to state (in real app, also add to Firestore)
    setClassList(prev => [...prev, { id: code, name: code, levelId: null }]);
  };

  return (
    <main className="flex-1 p-8 min-h-screen bg-slate-50">
        {activeKey === 'add-student' ? (
          <AddStudentPanel />
        ) : activeKey === 'classes' ? (
          <ClassesPanel students={students} classes={classList} onAddClass={handleAddClass} />
        ) : activeKey === 'waiting-list' ? (
          <WaitingListPanel students={students} classes={classList} currentUser={user} />
        ) : activeKey === 'potential-students' ? (
          <WaitingListPanel students={students} classes={classList} currentUser={user} />
        ) : activeKey === 'levels' ? (
          <LevelsPanel />
        ) : activeKey === 'settings' ? (
          <SettingsPanel user={user} isAdmin={user.role === 'admin'} onLogout={onLogout} classes={classList} />
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <div className="text-slate-600 mb-8">Welcome back! Here's a summary of your class.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-slate-500 text-lg mb-2">Total Students</div>
                <div className="text-5xl font-bold text-[#307637]">{totalStudents}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-slate-500 text-lg mb-2">Active Assignments</div>
                <div className="text-5xl font-bold text-[#307637]">{activeAssignments}</div>
              </div>
            </div>
            {/* Additional IELTS-focused analytics, assignment/class management, etc. can be added here */}
          </>
        )}
    </main>
  );
};

export default TeacherDashboard; 