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
import DiceBearAvatar from './DiceBearAvatar';
import AdminDebugPanel from './AdminDebugPanel';
import ReportsPanel from './ReportsPanel';
import AccountsPanel from './AccountsPanel';
import TeacherScoresFeedbackPanel from './TeacherScoresFeedbackPanel';
import AssignmentListPanel from './AssignmentListPanel';
import SubmissionListPanel from './SubmissionListPanel';
import AssignmentCreationForm from './AssignmentCreationForm';
import SubmissionGradingPanel from './SubmissionGradingPanel';
import ChangeLogPanel from './ChangeLogPanel';

const TeacherDashboard = ({ user, students, assignments, classes, activeKey, onLogout, onStudentAdded, onDataRefresh }: {
  user: Student,
  students: Student[],
  assignments: Assignment[],
  classes: StudentClass[],
  activeKey: string,
  onLogout: () => void,
  onStudentAdded?: () => void,
  onDataRefresh?: () => void
}) => {
  // Example summary metrics (IELTS focus)
  const totalStudents = students.length;
  const activeAssignments = assignments.filter(a => a.level === 'IELTS').length;
  
  const handleAddClass = (code: string) => {
    // This will be handled by the parent component through API calls
    onDataRefresh?.();
  };

  const handleAssignLevel = (classId: string, levelId: string) => {
    // This will be handled by the parent component through API calls
    onDataRefresh?.();
  };

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    // Optionally, set navKey to 'assignment-detail' or similar
  };
  const handleSelectSubmission = (submission: any, student: any) => {
    setSelectedSubmission(submission);
    setSelectedStudent(student);
    // Optionally, set navKey to 'submission-grading'
  };

  return (
    <main className="flex-1 p-8 min-h-screen bg-slate-50">
        {/* Show avatar at the top of the dashboard */}
        {activeKey === undefined || activeKey === '' ? (
          <div className="flex flex-col items-center mb-6">
            <DiceBearAvatar seed={user.name || user.email || user.id} size={96} style="avataaars" />
          </div>
        ) : null}
        
        {/* Management Submenu Items */}
        {activeKey === 'add-student' ? (
          <AddStudentPanel onStudentAdded={onStudentAdded} />
        ) : activeKey === 'potential-students' ? (
          <WaitingListPanel students={students} classes={classes} currentUser={user} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'waiting-list' ? (
          <WaitingListPanel students={students} classes={classes} currentUser={user} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'classes' ? (
          <ClassesPanel students={students} classes={classes} onAddClass={handleAddClass} onAssignLevel={handleAssignLevel} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'scores' ? (
          <TeacherScoresFeedbackPanel />
        ) : activeKey === 'reports' ? (
          <ReportsPanel isAdmin={user.role === 'admin'} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'levels' ? (
          <LevelsPanel onDataRefresh={onDataRefresh} />
        ) : activeKey === 'records' ? (
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4">Records Management</h2>
            <p className="text-slate-600">Student records and historical data management.</p>
            {/* TODO: Implement RecordsPanel component */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">Records management functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'accounts' ? (
          <AccountsPanel onDataRefresh={onDataRefresh} />
        ) : activeKey === 'assignments' ? (
          <AssignmentListPanel assignments={assignments} classes={classes} onSelectAssignment={handleSelectAssignment} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'assignment-create' ? (
          <AssignmentCreationForm classes={classes} currentUser={user} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'submission-grading' ? (
          (selectedAssignment !== null && selectedSubmission !== null && selectedStudent !== null ? (
            <SubmissionGradingPanel assignment={selectedAssignment} submission={selectedSubmission} student={selectedStudent} onDataRefresh={onDataRefresh} />
          ) : (
            <div className="p-8 text-center text-slate-400">No submission selected for grading.</div>
          ))
        ) : activeKey === 'my-classes' ? (
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4">My Classes</h2>
            <p className="text-slate-600">View classes assigned to you.</p>
            {/* TODO: Implement TeacherMyClassesPanel component */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">My classes functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'my-progress' ? (
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4">My Progress</h2>
            <p className="text-slate-600">Track your teaching progress and performance.</p>
            {/* TODO: Implement TeacherProgressPanel component */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">Progress tracking functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'my-scores' ? (
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4">My Scores & Feedback</h2>
            <p className="text-slate-600">View your performance scores and feedback.</p>
            {/* TODO: Implement TeacherMyScoresPanel component */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">My scores functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'settings' ? (
          <SettingsPanel user={user} isAdmin={user.role === 'admin'} onLogout={onLogout} classes={classes} onDataRefresh={onDataRefresh} />
        ) : activeKey === 'change-log' ? (
          <ChangeLogPanel />
        ) : activeKey.startsWith('admin-debug') ? (
          <div>
            <AdminDebugPanel activeKey={activeKey} />
          </div>
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