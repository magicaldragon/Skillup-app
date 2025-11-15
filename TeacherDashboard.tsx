// TeacherDashboard.tsx
// Professional dashboard layout for teachers/admins with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor

import "./TeacherDashboard.css";
import AccountsPanel from "./AccountsPanel";
import AddNewMembers from "./AddNewMembers";
import AttendancePanel from "./AttendancePanel";
import ChangeLogPanel from "./ChangeLogPanel";
import ClassesPanel from "./ClassesPanel";
import LevelsPanel from "./LevelsPanel";
import PotentialStudentsPanel from "./PotentialStudentsPanel";
import RecordsPanel from "./RecordsPanel";
import SchoolFeePanel from "./SchoolFeePanel";
import SettingsPanel from "./SettingsPanel";
import type {
  FirestoreAssignment,
  FirestoreClass,
  FirestoreUser,
} from "./services/firestoreService";
import type { Student, StudentClass, UserProfile } from "./types";
import WaitingListPanel from "./WaitingListPanel";

function TeacherDashboard({
  user,
  students,
  assignments,
  classes,
  activeKey,
  onDataRefresh,
}: {
  user: UserProfile;
  students: FirestoreUser[];
  assignments: FirestoreAssignment[];
  classes: FirestoreClass[];
  activeKey: string;
  onDataRefresh?: () => void;
}) {
  const totalStudents = students.filter((s) => s.role === "student").length;
  const activeAssignments = assignments.filter((a) => a.isActive === true).length;
  const totalClasses = classes.length;
  // userRole variable removed as it's not used

  const studentsForPanels: Student[] = students
    .filter((s) => s.role === "student")
    .map((s) => ({
      id: s.id || s.firebaseUid || s.username,
      _id: s.id,
      name: s.name,
      englishName: s.englishName,
      email: s.email,
      role: s.role,
      gender: s.gender,
      dob: s.dob,
      phone: s.phone,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      notes: s.notes,
      status: s.status,
      studentCode: s.studentCode,
      avatarUrl: s.avatarUrl,
      diceBearStyle: s.diceBearStyle,
      diceBearSeed: s.diceBearSeed,
      classIds: s.classIds || [],
      createdAt: s.createdAt ? String(s.createdAt) : undefined,
      updatedAt: s.updatedAt ? String(s.updatedAt) : undefined,
    }));

  const classesForPanels: StudentClass[] = classes.map((c) => ({
    _id: c.id,
    id: c.id,
    name: c.name,
    classCode: c.classCode,
    levelId: c.levelId ?? null,
    studentIds: c.studentIds || [],
    teacherId: c.teacherId,
    description: c.description,
    isActive: c.isActive,
    createdAt: c.createdAt ? String(c.createdAt) : undefined,
    updatedAt: c.updatedAt ? String(c.updatedAt) : undefined,
  }));

  const currentStudent: Student = {
    id: user.id || user._id,
    _id: user._id,
    name: user.name || user.fullname,
    englishName: user.englishName,
    email: user.email,
    role: user.role,
    username: user.username,
    avatarUrl: user.avatarUrl,
    status: user.status,
    phone: user.phone,
    classIds: user.classIds || [],
  };

  return (
    <div className="teacher-dashboard">
      {/* Show avatar at the top of the dashboard */}
      {activeKey === undefined || activeKey === "" ? (
        <div className="teacher-dashboard-header">
          <div className="teacher-dashboard-user-info">
            <div className="teacher-dashboard-avatar">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Management Submenu Items */}
      {activeKey === "add-student" ? (
        <AddNewMembers />
      ) : activeKey === "potential-students" ? (
        <PotentialStudentsPanel classes={classesForPanels} currentUser={currentStudent} />
      ) : activeKey === "waiting-list" ? (
        <WaitingListPanel classes={classesForPanels} onDataRefresh={onDataRefresh} />
      ) : activeKey === "classes" ? (
        <ClassesPanel
          students={studentsForPanels}
          classes={classesForPanels}
          onDataRefresh={onDataRefresh}
        />
      ) : activeKey === "attendance" ? (
        <AttendancePanel
          students={studentsForPanels}
          classes={classesForPanels}
          onDataRefresh={onDataRefresh}
        />
      ) : activeKey === "school-fee" ? (
        <SchoolFeePanel
          students={studentsForPanels}
          classes={classesForPanels}
          onDataRefresh={onDataRefresh}
        />
      ) : activeKey === "levels" ? (
        <LevelsPanel onDataRefresh={onDataRefresh} />
      ) : activeKey === "records" ? (
        <RecordsPanel />
      ) : activeKey === "accounts" ? (
        <AccountsPanel />
      ) : activeKey === "assignments" ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Assignments</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === "assignment-create" ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Create Assignment</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === "submission-grading" ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Submission Grading</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === "submissions" ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Submissions</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === "settings" ? (
        <SettingsPanel
          currentUser={currentStudent}
          classes={classesForPanels}
          onDataRefresh={onDataRefresh}
        />
      ) : activeKey === "admin-debug" ? (
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">Admin Debug</h1>
            <p className="teacher-dashboard-subtitle">This section will be rebuilt later</p>
          </div>
        </div>
      ) : activeKey === "changelog" ? (
        <ChangeLogPanel />
      ) : (
        // Default dashboard view
        <div className="teacher-dashboard-content">
          <div className="teacher-dashboard-welcome">
            <h1 className="teacher-dashboard-title">
              Welcome back, {user.englishName || user.name}!
            </h1>
            <p className="teacher-dashboard-subtitle">
              {user.role === "teacher"
                ? "Here's your IELTS teaching dashboard overview"
                : user.role === "staff"
                  ? "Here's your staff management dashboard overview"
                  : "Here's your dashboard overview"}
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
}

export default TeacherDashboard;
