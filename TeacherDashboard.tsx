// TeacherDashboard.tsx
// Professional dashboard layout for teachers/admins with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import AddNewMembers from './AddNewMembers';
import PotentialStudentsPanel from './PotentialStudentsPanel';
import WaitingListPanel from './WaitingListPanel';
import ClassesPanel from './ClassesPanel';
import TeacherScoresFeedbackPanel from './TeacherScoresFeedbackPanel';
import ReportsPanel from './ReportsPanel';
import LevelsPanel from './LevelsPanel';
import RecordsPanel from './RecordsPanel';
import AccountsPanel from './AccountsPanel';
import SettingsPanel from './SettingsPanel';
import ChangeLogPanel from './ChangeLogPanel';
import './TeacherDashboard.css';

const TeacherDashboard = ({ user, students, assignments, classes, activeKey, onDataRefresh }: {
  user: any,
  students: any[],
  assignments: any[],
  classes: any[],
  activeKey: string,
  onDataRefresh?: () => void
}) => {
  const totalStudents = students.filter(s => s.role === 'student').length;
  const activeAssignments = assignments.filter(a => a.status === 'active').length;
  const totalClasses = classes.length;
  // userRole variable removed as it's not used
  
  return (
    <div className="teacher-dashboard">
      {/* Show avatar at the top of the dashboard */}
      {activeKey === undefined || activeKey === '' ? (
        <div className="teacher-dashboard-header">
          <div className="teacher-dashboard-user-info">
            <div className="teacher-dashboard-avatar">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
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
        <ClassesPanel students={students} classes={classes} onDataRefresh={onDataRefresh} />
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
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Assignments</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'assignment-create' ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Create Assignment</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'submission-grading' ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Submission Grading</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'submissions' ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Submissions</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'settings' ? (
        <SettingsPanel currentUser={user} classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'admin-debug' ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Admin Debug</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'changelog' ? (
        <ChangeLogPanel />
      ) : (
        // Default dashboard view
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">
              Welcome back, {user.englishName || user.name}!
            </h1>
            <p className="teacher-dashboard-subtitle">
              {user.role === 'teacher' ? 'Here\'s your IELTS teaching dashboard overview' : 
               user.role === 'staff' ? 'Here\'s your staff management dashboard overview' : 
               'Here\'s your dashboard overview'}
            </p>
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
              <div className="teacher-dashboard-card-icon">📚</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">Total Classes</h3>
                <p className="teacher-dashboard-card-value">{totalClasses}</p>
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
              <div className="teacher-dashboard-card-icon">📊</div>
              <div className="teacher-dashboard-card-content">
                <h3 className="teacher-dashboard-card-title">Performance</h3>
                <p className="teacher-dashboard-card-value">Excellent</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard; 