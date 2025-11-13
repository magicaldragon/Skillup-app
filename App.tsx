import type React from "react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "./frontend/services/authService";
import "./App.css";

// Lazy load components for better performance
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const StudentDashboard = lazy(() => import("./StudentDashboard"));
const TeacherDashboard = lazy(() => import("./TeacherDashboard"));
const Login = lazy(() => import("./Login"));
const Sidebar = lazy(() => import("./Sidebar"));

import type {
  Assignment,
  ExamLevel,
  Student,
  StudentClass,
  Submission,
  UserProfile,
} from "./types";

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const App: React.FC = () => {
  console.log("App component loaded - version:", new Date().toISOString());

  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [_submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [_dataLoading, setDataLoading] = useState(false);
  const [_dataError, setDataError] = useState<string | null>(null);
  const [navKey, setNavKey] = useState("dashboard");

  // Memoize API URL to avoid recalculation and ensure consistency
  const apiUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    return baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const profile = await authService.getProfile();
        if (profile) {
          setUser(profile as Student);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleLoginSuccess = useCallback((userData: UserProfile) => {
    setUser(userData as Student);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setAssignments([]);
      setSubmissions([]);
      setStudents([]);
      setClasses([]);
      setNavKey("dashboard");
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching students...");
      const token = localStorage.getItem("skillup_token");
      console.log("Token for students request:", token ? "Present" : "Missing");
      if (token) {
        console.log("Token preview for students:", `${token.substring(0, 20)}...`);
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      console.log("Request headers for students:", headers);

      const response = await fetch(`${apiUrl}/users`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        // Validate and sanitize student data to prevent trim() errors
        const sanitizedStudents = data.users.map(
          (student: Partial<Student> & { fullname?: string }) => ({
            id: student.id || student._id || "",
            _id: student._id || student.id || "",
            name: (student.name || student.fullname || student.displayName || "").toString(),
            email: (student.email || "").toString(),
            role: student.role || "student",
            username: (student.username || student.email || "").toString(),
            englishName: (student.englishName || student.name || student.fullname || "").toString(),
            gender: (student.gender || "").toString(),
            dob: (student.dob || "").toString(),
            phone: (student.phone || "").toString(),
            parentName: (student.parentName || "").toString(),
            parentPhone: (student.parentPhone || "").toString(),
            notes: (student.notes || "").toString(),
            status: (student.status || "").toString(),
            studentCode: (student.studentCode || "").toString(),
            avatarUrl: (student.avatarUrl || "").toString(),
            diceBearStyle: (student.diceBearStyle || "").toString(),
            diceBearSeed: (student.diceBearSeed || "").toString(),
            classIds: Array.isArray(student.classIds) ? student.classIds : [],
            createdAt: (student.createdAt || "").toString(),
            updatedAt: (student.updatedAt || "").toString(),
          }),
        );
        setStudents(sanitizedStudents);
        console.log("Students fetched and sanitized successfully:", sanitizedStudents.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedStudents = data.map((student: Partial<Student> & { fullname?: string }) => ({
          id: student.id || student._id || "",
          _id: student._id || student.id || "",
          name: (student.name || student.fullname || student.displayName || "").toString(),
          email: (student.email || "").toString(),
          role: student.role || "student",
          username: (student.username || student.email || "").toString(),
          englishName: (student.englishName || student.name || student.fullname || "").toString(),
          gender: (student.gender || "").toString(),
          dob: (student.dob || "").toString(),
          phone: (student.phone || "").toString(),
          parentName: (student.parentName || "").toString(),
          parentPhone: (student.parentPhone || "").toString(),
          notes: (student.notes || "").toString(),
          status: (student.status || "").toString(),
          studentCode: (student.studentCode || "").toString(),
          avatarUrl: (student.avatarUrl || "").toString(),
          diceBearStyle: (student.diceBearStyle || "").toString(),
          diceBearSeed: (student.diceBearSeed || "").toString(),
          classIds: Array.isArray(student.classIds) ? student.classIds : [],
          createdAt: (student.createdAt || "").toString(),
          updatedAt: (student.updatedAt || "").toString(),
        }));
        setStudents(sanitizedStudents);
        console.log(
          "Students fetched and sanitized successfully (direct array):",
          sanitizedStudents.length,
        );
      } else {
        console.log("No students data or empty array returned:", data);
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      // Error handling for student fetch
      setDataError("Failed to fetch students");
    }
  }, [user, apiUrl]);

  // Inside fetchAssignments useCallback
  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching assignments...");
      const token = localStorage.getItem("skillup_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      // Successfully fetched assignments

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.assignments)) {
        // Validate and sanitize assignment data to prevent trim() errors
        const sanitizedAssignments = data.assignments.map(
          (assignment: Partial<Assignment> & { _id?: string }) => ({
            id: assignment.id || assignment._id || "",
            title: (assignment.title || "").toString(),
            level: resolveLevel(assignment.level),
            skill: assignment.skill || "Reading",
            description: (assignment.description || "").toString(),
            questions: Array.isArray(assignment.questions) ? assignment.questions : [],
            answerKey: assignment.answerKey || {},
            audioUrl: (assignment.audioUrl || "").toString(),
            pdfUrl: (assignment.pdfUrl || "").toString(),
            publishDate: (assignment.publishDate || "").toString(),
            dueDate: (assignment.dueDate || "").toString(),
            classIds: Array.isArray(assignment.classIds) ? assignment.classIds : [],
            createdBy: (assignment.createdBy || "").toString(),
            createdAt: (assignment.createdAt || "").toString(),
            templateId: (assignment.templateId || "").toString(),
          }),
        );
        setAssignments(sanitizedAssignments);
        console.log("Assignments fetched and sanitized successfully:", sanitizedAssignments.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedAssignments = data.map(
          (assignment: Partial<Assignment> & { _id?: string }) => ({
            id: assignment.id || assignment._id || "",
            title: (assignment.title || "").toString(),
            level: resolveLevel(assignment.level),
            skill: assignment.skill || "Reading",
            description: (assignment.description || "").toString(),
            questions: Array.isArray(assignment.questions) ? assignment.questions : [],
            answerKey: assignment.answerKey || {},
            audioUrl: (assignment.audioUrl || "").toString(),
            pdfUrl: (assignment.pdfUrl || "").toString(),
            publishDate: (assignment.publishDate || "").toString(),
            dueDate: (assignment.dueDate || "").toString(),
            classIds: Array.isArray(assignment.classIds) ? assignment.classIds : [],
            createdBy: (assignment.createdBy || "").toString(),
            createdAt: (assignment.createdAt || "").toString(),
            templateId: (assignment.templateId || "").toString(),
          }),
        );
        setAssignments(sanitizedAssignments);
        console.log(
          "Assignments fetched and sanitized successfully (direct array):",
          sanitizedAssignments.length,
        );
      } else {
        console.log("No assignments data or empty array returned:", data);
        setAssignments([]);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      // Error handling for assignments fetch
      setDataError("Failed to fetch assignments");
    }
  }, [user, apiUrl]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching submissions...");
      const token = localStorage.getItem("skillup_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.submissions)) {
        // Validate and sanitize submission data to prevent trim() errors
        const sanitizedSubmissions = data.submissions.map(
          (submission: Partial<Submission> & { _id?: string }) => ({
            id: submission.id || submission._id || "",
            studentId: (submission.studentId || "").toString(),
            assignmentId: (submission.assignmentId || "").toString(),
            submittedAt: (submission.submittedAt || "").toString(),
            content: (submission.content || "").toString(),
            score: submission.score || 0,
            feedback: (submission.feedback || "").toString(),
          }),
        );
        setSubmissions(sanitizedSubmissions);
        console.log("Submissions fetched and sanitized successfully:", sanitizedSubmissions.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedSubmissions = data.map(
          (submission: Partial<Submission> & { _id?: string }) => ({
            id: submission.id || submission._id || "",
            studentId: (submission.studentId || "").toString(),
            assignmentId: (submission.assignmentId || "").toString(),
            submittedAt: (submission.submittedAt || "").toString(),
            content: (submission.content || "").toString(),
            score: submission.score || 0,
            feedback: (submission.feedback || "").toString(),
          }),
        );
        setSubmissions(sanitizedSubmissions);
        console.log(
          "Submissions fetched and sanitized successfully (direct array):",
          sanitizedSubmissions.length,
        );
      } else {
        console.log("No submissions data or empty array returned:", data);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setDataError("Failed to fetch submissions");
    }
  }, [user, apiUrl]);

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching classes...");
      const token = localStorage.getItem("skillup_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.classes)) {
        // Validate and sanitize class data to prevent trim() errors
        const sanitizedClasses = data.classes.map(
          (cls: Partial<StudentClass> & { _id?: string }) => ({
            _id: cls._id || cls.id || "",
            id: cls.id || cls._id || "",
            name: cls.name || "",
            classCode: cls.classCode || "",
            levelId: cls.levelId || null,
            studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
            teacherId: cls.teacherId || "",
            description: cls.description || "",
            isActive: cls.isActive !== undefined ? cls.isActive : true,
            createdAt: cls.createdAt || "",
            updatedAt: cls.updatedAt || "",
          }),
        );
        setClasses(sanitizedClasses);
        console.log("Classes fetched and sanitized successfully:", sanitizedClasses.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedClasses = data.map((cls: Partial<StudentClass> & { _id?: string }) => ({
          _id: cls._id || cls.id || "",
          id: cls.id || cls._id || "",
          name: cls.name || "",
          classCode: cls.classCode || "",
          levelId: cls.levelId || null,
          studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
          teacherId: cls.teacherId || "",
          description: cls.description || "",
          isActive: cls.isActive !== undefined ? cls.isActive : true,
          createdAt: cls.createdAt || "",
          updatedAt: cls.updatedAt || "",
        }));
        setClasses(sanitizedClasses);
        console.log(
          "Classes fetched and sanitized successfully (direct array):",
          sanitizedClasses.length,
        );
      } else {
        console.log("No classes data or empty array returned:", data);
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setDataError("Failed to fetch classes");
    }
  }, [user, apiUrl]);

  // Basic data fetching
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        console.log("Starting data fetch...");

        await fetchStudents();
        await fetchAssignments();
        await fetchSubmissions();
        await fetchClasses();

        console.log("Data fetch completed");
      } catch (error) {
        console.error("Error fetching data:", error);
        setDataError("Failed to fetch data. Please try again.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, fetchStudents, fetchAssignments, fetchSubmissions, fetchClasses]);

  const refreshData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setDataError(null);

    try {
      await fetchStudents();
      await fetchAssignments();
      await fetchSubmissions();
      await fetchClasses();
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      setDataError("Failed to refresh data");
    } finally {
      setDataLoading(false);
    }
  }, [user, fetchStudents, fetchAssignments, fetchSubmissions, fetchClasses]);

  // Memoize the main content to avoid unnecessary re-renders
  const mainContent = useMemo(() => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (!user) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <Login onLoginSuccess={handleLoginSuccess} />
        </Suspense>
      );
    }

    // Determine which dashboard to show based on user role
    // Show StudentDashboard only for explicit student role; admin gets AdminDashboard, others get TeacherDashboard
    console.log("Dashboard selection - User role:", user.role);
    console.log("Dashboard selection - User object:", user);
    console.log("Dashboard selection - Role comparison:", user.role === "student");

    let DashboardComponent: React.ComponentType<{
      user: Student;
      students: Student[];
      assignments: Assignment[];
      classes: StudentClass[];
      activeKey: string;
      onDataRefresh?: () => void;
      isAdmin?: boolean;
    }>;
    if (user.role === "student") {
      DashboardComponent = StudentDashboard;
    } else if (user.role === "admin") {
      DashboardComponent = AdminDashboard; // Admin gets dedicated dashboard
    } else {
      // For now, use type assertion to handle the TeacherDashboard props mismatch
      // This is a temporary solution until we can properly align the types
      DashboardComponent = TeacherDashboard as unknown as React.ComponentType<{
        user: Student;
        students: Student[];
        assignments: Assignment[];
        classes: StudentClass[];
        activeKey: string;
        onDataRefresh?: () => void;
        isAdmin?: boolean;
      }>; // Teachers and staff get teacher dashboard
    }

    console.log(
      "Dashboard selection - Selected component:",
      DashboardComponent === StudentDashboard
        ? "StudentDashboard"
        : DashboardComponent === AdminDashboard
          ? "AdminDashboard"
          : "TeacherDashboard",
    );

    return (
      <div className="app-container">
        <Suspense fallback={<LoadingSpinner />}>
          <Sidebar
            role={user.role}
            activeKey={navKey}
            onNavigate={setNavKey}
            onLogout={handleLogout}
            user={user}
          />
          <main className="main-content">
            <DashboardComponent
              user={user}
              students={students}
              assignments={assignments}
              classes={classes}
              activeKey={navKey}
              onDataRefresh={refreshData}
              isAdmin={user.role === "admin"}
            />
          </main>
        </Suspense>
      </div>
    );
  }, [
    loading,
    user,
    students,
    assignments,
    classes,
    navKey,
    handleLoginSuccess,
    handleLogout,
    refreshData,
  ]);

  return <div className="App">{mainContent}</div>;
};

export default App;

// Helper to resolve level from mixed API shapes without using any
const resolveLevel = (lvl: unknown): ExamLevel => {
  if (typeof lvl === "string") return lvl as ExamLevel;
  if (lvl && typeof (lvl as { name?: unknown }).name === "string") {
    return (lvl as { name: string }).name as ExamLevel;
  }
  return "IELTS";
};
