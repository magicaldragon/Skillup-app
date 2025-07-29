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
import RecordsPanel from './RecordsPanel';
import './TeacherDashboard.css';

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
    <main className="teacher-dashboard">
      <div className="teacher-dashboard-main">
        {/* Show avatar at the top of the dashboard */}
        {activeKey === undefined || activeKey === '' ? (
          <div className="teacher-dashboard-header">
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
          <RecordsPanel />
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
            <div className="teacher-dashboard-content">
              <p>No submission selected for grading.</p>
            </div>
          ))
        ) : activeKey === 'my-classes' ? (
          <div className="teacher-dashboard-content">
            <h2>My Classes</h2>
            <p>View classes assigned to you.</p>
            {/* TODO: Implement TeacherMyClassesPanel component */}
            <div className="teacher-dashboard-placeholder">
              <p>My classes functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'my-progress' ? (
          <div className="teacher-dashboard-content">
            <h2>My Progress</h2>
            <p>Track your teaching progress and performance.</p>
            {/* TODO: Implement TeacherProgressPanel component */}
            <div className="teacher-dashboard-placeholder">
              <p>Progress tracking functionality coming soon...</p>
            </div>
          </div>
        ) : activeKey === 'my-scores' ? (
          <div className="teacher-dashboard-content">
            <h2>My Scores & Feedback</h2>
            <p>View your performance scores and feedback.</p>
            {/* TODO: Implement TeacherMyScoresPanel component */}
            <div className="teacher-dashboard-placeholder">
              <p>My scores functionality coming soon...</p>
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
            <h1 className="teacher-dashboard-title">Dashboard</h1>
            <div className="teacher-dashboard-subtitle">Welcome back! Here's a summary of your class.</div>
            <div className="teacher-dashboard-grid">
              <div className="teacher-dashboard-card">
                <div className="teacher-dashboard-card-label">Total Students</div>
                <div className="teacher-dashboard-card-value">{totalStudents}</div>
              </div>
              <div className="teacher-dashboard-card">
                <div className="teacher-dashboard-card-label">Active Assignments</div>
                <div className="teacher-dashboard-card-value">{activeAssignments}</div>
              </div>
            </div>
            {/* Additional IELTS-focused analytics, assignment/class management, etc. can be added here */}
          </>
        )}
      </div>
    </main>
  );
};

export default TeacherDashboard; 