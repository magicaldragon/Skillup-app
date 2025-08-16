import type React from 'react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from './frontend/services/authService';
import './App.css';

// Lazy load components for better performance
const Login = lazy(() => import('./Login'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const Sidebar = lazy(() => import('./Sidebar'));
const AdminDashboard = lazy(() => import('./AdminDashboard')); // Added AdminDashboard

import type { Assignment, Student, StudentClass, Submission, UserProfile } from './types';

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const App: React.FC = () => {
  console.log('App component loaded - version:', new Date().toISOString());

  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [_submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [_dataLoading, setDataLoading] = useState(false);
  const [_dataError, setDataError] = useState<string | null>(null);
  const [navKey, setNavKey] = useState('dashboard');

  // Memoize API URL to avoid recalculation
  const apiUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || '/api', []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Authentication initialization timeout, showing login screen');
        setLoading(false);
        setUser(null);
        setAuthError(null);
      }, 10000); // 10 second timeout

      try {
        console.log('Initializing authentication...');

        // Check if we have both token and user data in localStorage
        const token = localStorage.getItem('skillup_token');
        const storedUser = localStorage.getItem('skillup_user');

        console.log('Stored token exists:', !!token);
        console.log('Stored user exists:', !!storedUser);

        if (!token || !storedUser) {
          console.log('No stored authentication data, user not authenticated');
          setUser(null);
          setAuthError(null);
          clearTimeout(timeoutId);
          return;
        }

        // Verify the token is still valid by getting profile
        const profile = await authService.getProfile();
        console.log('Auth profile received:', profile);

        if (profile && typeof profile === 'object' && profile.email && profile.role) {
          // Convert UserProfile to Student type - only map essential fields
          const safeProfile: Student = {
            id: profile.id || profile._id || '',
            _id: profile._id || profile.id || '',
            name: profile.name || profile.fullname || '',
            email: profile.email || '',
            role: profile.role || 'student',
            username: profile.username || profile.email || '',
            englishName: (profile as any).englishName || profile.name || profile.fullname || '',
            gender: (profile as any).gender || '',
            dob: (profile as any).dob || '',
            phone: (profile as any).phone || '',
            parentName: (profile as any).parentName || '',
            parentPhone: (profile as any).parentPhone || '',
            notes: (profile as any).notes || '',
            status: (profile as any).status || '',
            studentCode: (profile as any).studentCode || '',
            avatarUrl: (profile as any).avatarUrl || '',
            diceBearStyle: (profile as any).diceBearStyle || '',
            diceBearSeed: (profile as any).diceBearSeed || '',
            classIds: Array.isArray((profile as any).classIds) ? (profile as any).classIds : [],
            createdAt: (profile as any).createdAt || '',
            updatedAt: (profile as any).updatedAt || '',
          };
          console.log('Original profile role:', profile.role);
          console.log('Safe profile role:', safeProfile.role);
          console.log('Profile received:', profile);
          console.log('Safe profile:', safeProfile);
          console.log('User role in profile:', safeProfile.role);
          setUser(safeProfile);
          setAuthError(null);
          console.log('User authenticated successfully:', safeProfile);
        } else {
          console.log('Invalid profile, logging out');
          console.log('Profile validation failed:', {
            profile,
            hasEmail: !!profile?.email,
            hasRole: !!profile?.role,
          });
          await authService.logout();
          setUser(null);
          setAuthError('Authentication expired. Please log in again.');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Error initializing authentication. Please try again.');
        setUser(null);
        // Clear invalid authentication data
        localStorage.removeItem('skillup_token');
        localStorage.removeItem('skillup_user');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleLoginSuccess = useCallback((userData: UserProfile) => {
    console.log('Login successful, userData:', userData);
    // Ensure userData is safe before setting
    if (userData && typeof userData === 'object') {
      const safeUserData: Student = {
        id: userData.id || userData._id || '',
        _id: userData._id || userData.id || '',
        name: userData.name || userData.fullname || '',
        email: userData.email || '',
        role: userData.role || 'student',
        username: userData.username || userData.email || '',
        englishName: (userData as any).englishName || userData.name || userData.fullname || '',
        gender: (userData as any).gender || '',
        dob: (userData as any).dob || '',
        phone: (userData as any).phone || '',
        parentName: (userData as any).parentName || '',
        parentPhone: (userData as any).parentPhone || '',
        notes: (userData as any).notes || '',
        status: (userData as any).status || '',
        studentCode: (userData as any).studentCode || '',
        avatarUrl: (userData as any).avatarUrl || '',
        diceBearStyle: (userData as any).diceBearStyle || '',
        diceBearSeed: (userData as any).diceBearSeed || '',
        classIds: Array.isArray((userData as any).classIds) ? (userData as any).classIds : [],
        createdAt: (userData as any).createdAt || '',
        updatedAt: (userData as any).updatedAt || '',
      };
      setUser(safeUserData);
      setAuthError(null);
    } else {
      console.error('Invalid user data received:', userData);
      setAuthError('Invalid user data received');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAssignments([]);
      setSubmissions([]);
      setStudents([]);
      setClasses([]);
      setNavKey('dashboard');
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching students...');
      const token = localStorage.getItem('skillup_token');
      console.log('Token for students request:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('Token preview for students:', `${token.substring(0, 20)}...`);
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      console.log('Request headers for students:', headers);

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
        const sanitizedStudents = data.users.map((student: any) => ({
          id: student.id || student._id || '',
          _id: student._id || student.id || '',
          name: student.name || student.fullname || student.displayName || '',
          email: student.email || '',
          role: student.role || 'student',
          username: student.username || student.email || '',
          englishName: student.englishName || student.name || student.fullname || '',
          gender: student.gender || '',
          dob: student.dob || '',
          phone: student.phone || '',
          parentName: student.parentName || '',
          parentPhone: student.parentPhone || '',
          notes: student.notes || '',
          status: student.status || '',
          studentCode: student.studentCode || '',
          avatarUrl: student.avatarUrl || '',
          diceBearStyle: student.diceBearStyle || '',
          diceBearSeed: student.diceBearSeed || '',
          classIds: Array.isArray(student.classIds) ? student.classIds : [],
          createdAt: student.createdAt || '',
          updatedAt: student.updatedAt || '',
        }));
        setStudents(sanitizedStudents);
        console.log('Students fetched and sanitized successfully:', sanitizedStudents.length);
      } else {
        console.error('Invalid students data:', data);
        setDataError('Failed to fetch students data');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setDataError('Failed to fetch students');
    }
  }, [user, apiUrl]);

  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching assignments...');
      const token = localStorage.getItem('skillup_token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.assignments)) {
        // Validate and sanitize assignment data to prevent trim() errors
        const sanitizedAssignments = data.assignments.map((assignment: any) => ({
          id: assignment.id || assignment._id || '',
          title: assignment.title || '',
          level: assignment.level || { name: '', code: '' },
          skill: assignment.skill || 'Reading',
          description: assignment.description || '',
          questions: Array.isArray(assignment.questions) ? assignment.questions : [],
          answerKey: assignment.answerKey || {},
          audioUrl: assignment.audioUrl || '',
          pdfUrl: assignment.pdfUrl || '',
          publishDate: assignment.publishDate || '',
          dueDate: assignment.dueDate || '',
          classIds: Array.isArray(assignment.classIds) ? assignment.classIds : [],
          createdBy: assignment.createdBy || '',
          createdAt: assignment.createdAt || '',
          templateId: assignment.templateId || '',
        }));
        setAssignments(sanitizedAssignments);
        console.log('Assignments fetched and sanitized successfully:', sanitizedAssignments.length);
      } else {
        console.error('Invalid assignments data:', data);
        setDataError('Failed to fetch assignments data');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setDataError('Failed to fetch assignments');
    }
  }, [user, apiUrl]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching submissions...');
      const token = localStorage.getItem('skillup_token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          'Content-Type': 'application/json',
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
        const sanitizedSubmissions = data.submissions.map((submission: any) => ({
          id: submission.id || submission._id || '',
          studentId: submission.studentId || '',
          assignmentId: submission.assignmentId || '',
          submittedAt: submission.submittedAt || '',
          content: submission.content || '',
          score: submission.score || null,
          feedback: submission.feedback || '',
        }));
        setSubmissions(sanitizedSubmissions);
        console.log('Submissions fetched and sanitized successfully:', sanitizedSubmissions.length);
      } else {
        console.error('Invalid submissions data:', data);
        setDataError('Failed to fetch submissions data');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setDataError('Failed to fetch submissions');
    }
  }, [user, apiUrl]);

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching classes...');
      const token = localStorage.getItem('skillup_token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          'Content-Type': 'application/json',
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
        const sanitizedClasses = data.classes.map((cls: any) => ({
          _id: cls._id || cls.id || '',
          id: cls.id || cls._id || '',
          name: cls.name || '',
          classCode: cls.classCode || '',
          levelId: cls.levelId || null,
          studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
          teacherId: cls.teacherId || '',
          description: cls.description || '',
          isActive: cls.isActive !== undefined ? cls.isActive : true,
          createdAt: cls.createdAt || '',
          updatedAt: cls.updatedAt || '',
        }));
        setClasses(sanitizedClasses);
        console.log('Classes fetched and sanitized successfully:', sanitizedClasses.length);
      } else {
        console.error('Invalid classes data:', data);
        setDataError('Failed to fetch classes data');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setDataError('Failed to fetch classes');
    }
  }, [user, apiUrl]);

  // Optimized data fetching with parallel execution
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        console.log('Starting parallel data fetch...');

        // Execute all fetches in parallel with timeout
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
        );

        await Promise.race([
          Promise.all([fetchStudents(), fetchAssignments(), fetchSubmissions(), fetchClasses()]),
          timeoutPromise,
        ]);

        console.log('All data fetched successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataError('Failed to fetch data. Please try again.');
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
      await Promise.all([fetchStudents(), fetchAssignments(), fetchSubmissions(), fetchClasses()]);
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setDataError('Failed to refresh data');
    } finally {
      setDataLoading(false);
    }
  }, [user, fetchStudents, fetchAssignments, fetchSubmissions, fetchClasses]);

  // Memoize the main content to avoid unnecessary re-renders
  const mainContent = useMemo(() => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (authError) {
      return (
        <div className="error-container">
          <h2>Authentication Error</h2>
          <p>{authError}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
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
    console.log('Dashboard selection - User role:', user.role);
    console.log('Dashboard selection - User object:', user);
    console.log('Dashboard selection - Role comparison:', user.role === 'student');

    let DashboardComponent: React.ComponentType<{
      user: Student;
      students: Student[];
      assignments: Assignment[];
      classes: StudentClass[];
      activeKey: string;
      onDataRefresh?: () => void;
      isAdmin?: boolean;
    }>;
    if (user.role === 'student') {
      DashboardComponent = StudentDashboard;
    } else if (user.role === 'admin') {
      DashboardComponent = AdminDashboard; // Admin gets dedicated dashboard
    } else {
      // For now, use type assertion to handle the TeacherDashboard props mismatch
      // This is a temporary solution until we can properly align the types
      DashboardComponent = TeacherDashboard as any; // Teachers and staff get teacher dashboard
    }

    console.log(
      'Dashboard selection - Selected component:',
      DashboardComponent === StudentDashboard
        ? 'StudentDashboard'
        : DashboardComponent === AdminDashboard
          ? 'AdminDashboard'
          : 'TeacherDashboard'
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
        </Suspense>
        <main className="main-content">
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardComponent
              user={user}
              students={students}
              assignments={assignments}
              classes={classes}
              activeKey={navKey}
              onDataRefresh={refreshData}
              isAdmin={user.role === 'admin'}
            />
          </Suspense>
        </main>
      </div>
    );
  }, [
    loading,
    authError,
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
