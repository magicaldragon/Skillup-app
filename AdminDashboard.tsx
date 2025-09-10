// AdminDashboard.tsx
// Professional admin dashboard with system overview, user management, and administrative controls

import AccountsPanel from './AccountsPanel';
import AddNewMembers from './AddNewMembers';
import ChangeLogPanel from './ChangeLogPanel';
import ClassesPanel from './ClassesPanel';
import LevelsPanel from './LevelsPanel';
import PotentialStudentsPanel from './PotentialStudentsPanel';

import RecordsPanel from './RecordsPanel';
import SettingsPanel from './SettingsPanel';
import type { Assignment, Student, StudentClass } from './types';
import WaitingListPanel from './WaitingListPanel';
import './AdminDashboard.css';

// Define proper props interface
interface AdminDashboardProps {
  user: Student;
  students: Student[];
  assignments: Assignment[];
  classes: StudentClass[];
  activeKey: string;
  onDataRefresh?: () => void;
  isAdmin?: boolean; // Add isAdmin prop
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  students,
  assignments,
  classes,
  activeKey,
  onDataRefresh,
  isAdmin = true, // Default to true for AdminDashboard
}: AdminDashboardProps) => {
  // Use isAdmin to conditionally render admin-specific features
  // Use isAdmin to conditionally render admin-specific features
  const totalStudents = students.filter((s) => s && s.role === 'student').length;
  const totalTeachers = students.filter((s) => s && s.role === 'teacher').length;
  const totalStaff = students.filter((s) => s && s.role === 'staff').length;
  const totalAssignments = assignments.filter((a) => a?.id).length; // Count valid assignments
  const totalClasses = classes.filter((c) => c?.id).length; // Count valid classes

  // Only show admin-specific features if user is admin
  const showAdminFeatures = isAdmin;

  return (
    <div className="admin-dashboard">
      {/* Show avatar at the top of the dashboard */}
      {activeKey === undefined || activeKey === '' ? (
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-user-info">
            <div className="admin-dashboard-avatar">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Admin-specific features */}
      {showAdminFeatures && (
        <div className="admin-dashboard-admin-features">
          {/* Future admin-specific features will be added here */}
        </div>
      )}

      {/* Management Submenu Items */}
      {activeKey === 'add-student' ? (
        <AddNewMembers />
      ) : activeKey === 'potential-students' ? (
        <PotentialStudentsPanel
          classes={classes}
          currentUser={user}
          onDataRefresh={onDataRefresh}
        />
      ) : activeKey === 'waiting-list' ? (
        <WaitingListPanel classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'classes' ? (
        <ClassesPanel students={students} classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'levels' ? (
        <LevelsPanel onDataRefresh={onDataRefresh} />
      ) : activeKey === 'records' ? (
        <RecordsPanel />
      ) : activeKey === 'accounts' ? (
        <AccountsPanel />
      ) : activeKey === 'assignments' ? (
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h1 className="admin-dashboard-title">Assignments</h1>
            <p className="admin-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'assignment-create' ? (
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h1 className="admin-dashboard-title">Create Assignment</h1>
            <p className="admin-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'submission-grading' ? (
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h1 className="admin-dashboard-title">Submission Grading</h1>
            <p className="admin-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'submissions' ? (
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h1 className="admin-dashboard-title">Submissions</h1>
            <p className="admin-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === 'settings' ? (
        <SettingsPanel currentUser={user} classes={classes} onDataRefresh={onDataRefresh} />
      ) : activeKey === 'changelog' ? (
        <ChangeLogPanel />
      ) : (
        // Default admin dashboard view
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h1 className="admin-dashboard-title">
              Welcome back, {user.englishName || user.name || 'Admin'}!
            </h1>
            <p className="admin-dashboard-subtitle">
              Here's your system administration dashboard overview
            </p>
          </div>

          {/* Summary Cards */}
          <div className="admin-dashboard-summary">
            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">👥</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">Total Students</h3>
                <p className="admin-dashboard-card-value">{totalStudents}</p>
              </div>
            </div>

            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">👨‍🏫</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">Total Teachers</h3>
                <p className="admin-dashboard-card-value">{totalTeachers}</p>
              </div>
            </div>

            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">👨‍💼</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">Total Staff</h3>
                <p className="admin-dashboard-card-value">{totalStaff}</p>
              </div>
            </div>

            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">📚</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">Total Classes</h3>
                <p className="admin-dashboard-card-value">{totalClasses}</p>
              </div>
            </div>

            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">📝</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">Active Assignments</h3>
                <p className="admin-dashboard-card-value">{totalAssignments}</p>
              </div>
            </div>

            <div className="admin-dashboard-card">
              <div className="admin-dashboard-card-icon">⚙️</div>
              <div className="admin-dashboard-card-content">
                <h3 className="admin-dashboard-card-title">System Status</h3>
                <p className="admin-dashboard-card-value">Operational</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
