// TeacherDashboard.tsx
// Professional dashboard layout for teachers/admins with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState } from 'react';
import type { Assignment, Student, StudentClass } from './types';
import ClassesPanel from './ClassesPanel';
import AddNewMembers from './AddNewMembers';
import LevelsPanel from './LevelsPanel';
import WaitingListPanel from './WaitingListPanel';
import PotentialStudentsPanel from './PotentialStudentsPanel';
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
    <>
      {/* Show avatar at the top of the dashboard */}
      {activeKey === undefined || activeKey === '' ? (
        <div className="teacher-dashboard-header">
          <DiceBearAvatar seed={user.name || user.email || user.id} size={96} style="avataaars" />
        </div>
      ) : null}
      
      {/* Management Submenu Items */}
      {activeKey === 'add-student' ? (
        <AddNewMembers />
      ) : activeKey === 'potential-students' ? (
        <PotentialStudentsPanel classes={classes} currentUser={user} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'waiting-list' ? (
        <WaitingListPanel classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'classes' ? (
        <ClassesPanel students={students} classes={classes} onAddClass={() => onDataRefresh?.()} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'scores' ? (
        <TeacherScoresFeedbackPanel />
      ) : activeKey === 'reports' ? (
        <ReportsPanel isAdmin={user.role === 'admin'} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'levels' ? (
        <LevelsPanel onDataRefresh={onDataRefresh} />
      ) : activeKey === 'records' ? (
        <RecordsPanel />
      ) : activeKey === 'accounts' ? (
        <AccountsPanel />
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
      ) : activeKey === 'submissions' ? (
        selectedAssignment ? (
          <SubmissionListPanel 
            assignment={selectedAssignment} 
            submissions={[]} 
            students={students} 
            onSelectSubmission={handleSelectSubmission} 
          />
        ) : (
          <div className="teacher-dashboard-content">
            <p>Please select an assignment first.</p>
          </div>
        )
      ) : activeKey === 'settings' ? (
        <SettingsPanel user={user} classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'admin-debug' ? (
        <AdminDebugPanel activeKey={activeKey} />
      ) : activeKey === 'changelog' ? (
        <ChangeLogPanel />
      ) : (
        // Default dashboard view
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Welcome back, {user.displayName || user.name}!</h1>
            <p className="teacher-dashboard-subtitle">Here's your IELTS teaching dashboard overview</p>
          </div>
          
          {/* Summary Cards */}
          <div className="teacher-dashboard-summary">
            <div className="teacher-dashboard-card">
              <div className="teacher-dashboard-card-icon">👥</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">Total Students</h3>
                <p className="teacher-dashboard-card-value">{totalStudents}</p>
              </div>
            </div>
            
            <div className="teacher-dashboard-card">
              <div className="teacher-dashboard-card-icon">📝</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">Active Assignments</h3>
                <p className="teacher-dashboard-card-value">{activeAssignments}</p>
              </div>
            </div>
            
            <div className="teacher-dashboard-card">
              <div className="teacher-dashboard-card-icon">🎯</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">IELTS Focus</h3>
                <p className="teacher-dashboard-card-value">Primary</p>
              </div>
            </div>
            
            <div className="teacher-dashboard-card">
              <div className="teacher-dashboard-card-icon">📊</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">Performance</h3>
                <p className="teacher-dashboard-card-value">Excellent</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherDashboard; 