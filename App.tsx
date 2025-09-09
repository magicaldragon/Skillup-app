import type React from 'react';
import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { authService } from './frontend/services/authService';
import { safeTrim } from './utils/stringUtils';
import { markLoadingStage, trackApiCall, logPerformanceReport } from './utils/performanceMonitor';
import './App.css';
import './DateInput.css'; // Enhanced date input styling

// Lazy load heavy dashboard components to reduce initial bundle size
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const DebugAPIPanel = lazy(() => import('./DebugAPIPanel'));

// Import lightweight components directly for immediate availability
import Login from './Login';
import Sidebar from './Sidebar';

import type { Assignment, Student, StudentClass, Submission, UserProfile, ExamLevel } from './types';

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

  // Memoize API URL to avoid recalculation and ensure consistency
  const apiUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    return baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // Reduced timeout for faster feedback
      const timeoutId = setTimeout(() => {
        console.warn('Authentication initialization timeout, showing login screen');
        setLoading(false);
        setUser(null);
        setAuthError(null);
      }, 8000); // Reduced from 10 seconds

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

        // Try to use cached user data first for immediate UI response
        try {
          const cachedUser = JSON.parse(storedUser);
          if (cachedUser && cachedUser.email && cachedUser.role) {
            console.log('Using cached user data for immediate display');
            const safeProfile: Student = {
              id: cachedUser.id || cachedUser._id || '',
              _id: cachedUser._id || cachedUser.id || '',
              name: safeTrim(cachedUser.name || cachedUser.fullname),
              email: safeTrim(cachedUser.email),
              role: cachedUser.role || 'student',
              username: safeTrim(cachedUser.username || cachedUser.email),
              englishName: safeTrim(cachedUser.englishName || cachedUser.name || cachedUser.fullname),
              gender: safeTrim(cachedUser.gender),
              dob: safeTrim(cachedUser.dob),
              phone: safeTrim(cachedUser.phone),
              parentName: safeTrim(cachedUser.parentName),
              parentPhone: safeTrim(cachedUser.parentPhone),
              notes: safeTrim(cachedUser.notes),
              status: safeTrim(cachedUser.status),
              studentCode: safeTrim(cachedUser.studentCode),
              avatarUrl: safeTrim(cachedUser.avatarUrl),
              diceBearStyle: safeTrim(cachedUser.diceBearStyle),
              diceBearSeed: safeTrim(cachedUser.diceBearSeed),
              classIds: Array.isArray(cachedUser.classIds) ? cachedUser.classIds : [],
              createdAt: safeTrim(cachedUser.createdAt),
              updatedAt: safeTrim(cachedUser.updatedAt),
            };
            setUser(safeProfile);
            setLoading(false); // Set loading to false immediately for better UX
            clearTimeout(timeoutId);
            
            // Mark authentication complete for performance tracking
            markLoadingStage('authComplete');
            
            // Verify token in background without blocking UI
            authService.getProfile().then(profile => {
              if (!profile) {
                console.log('Token verification failed, logging out');
                handleLogout();
              }
            }).catch(error => {
              console.warn('Background token verification failed:', error);
              // Don't logout immediately, user might be offline
            });
            
            return;
          }
        } catch (parseError) {
          console.warn('Failed to parse cached user data:', parseError);
        }

        // If cached data is invalid, verify the token
        const profileCall = trackApiCall('/auth/profile');
        const profile = await authService.getProfile();
        profileCall.end(!!profile);
        
        console.log('Auth profile received:', profile);

        if (profile && typeof profile === 'object' && profile.email && profile.role) {
          // Convert UserProfile to Student type - only map essential fields
          const safeProfile: Student = {
            id: profile.id || profile._id || '',
            _id: profile._id || profile.id || '',
            name: safeTrim(profile.name || profile.fullname),
            email: safeTrim(profile.email),
            role: profile.role || 'student',
            username: safeTrim(profile.username || profile.email),
            englishName: safeTrim((profile as Student).englishName || profile.name || profile.fullname),
            gender: safeTrim((profile as Student).gender),
            dob: safeTrim((profile as Student).dob),
            phone: safeTrim((profile as Student).phone),
            parentName: safeTrim((profile as Student).parentName),
            parentPhone: safeTrim((profile as Student).parentPhone),
            notes: safeTrim((profile as Student).notes),
            status: safeTrim((profile as Student).status),
            studentCode: safeTrim((profile as Student).studentCode),
            avatarUrl: safeTrim((profile as Student).avatarUrl),
            diceBearStyle: safeTrim((profile as Student).diceBearStyle),
            diceBearSeed: safeTrim((profile as Student).diceBearSeed),
            classIds: Array.isArray((profile as Student).classIds)
              ? (profile as Student).classIds
              : [],
            createdAt: safeTrim((profile as Student).createdAt),
            updatedAt: safeTrim((profile as Student).updatedAt),
          };
          console.log('User authenticated successfully:', safeProfile);
          setUser(safeProfile);
          setAuthError(null);
          markLoadingStage('authComplete');
        } else {
          console.log('Invalid profile, logging out');
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
        name: safeTrim(userData.name || userData.fullname),
        email: safeTrim(userData.email),
        role: userData.role || 'student',
        username: safeTrim(userData.username || userData.email),
        englishName: safeTrim((userData as Student).englishName || userData.name || userData.fullname),
        gender: safeTrim((userData as Student).gender),
        dob: safeTrim((userData as Student).dob),
        phone: safeTrim((userData as Student).phone),
        parentName: safeTrim((userData as Student).parentName),
        parentPhone: safeTrim((userData as Student).parentPhone),
        notes: safeTrim((userData as Student).notes),
        status: safeTrim((userData as Student).status),
        studentCode: safeTrim((userData as Student).studentCode),
        avatarUrl: safeTrim((userData as Student).avatarUrl),
        diceBearStyle: safeTrim((userData as Student).diceBearStyle),
        diceBearSeed: safeTrim((userData as Student).diceBearSeed),
        classIds: Array.isArray((userData as Student).classIds)
          ? (userData as Student).classIds
          : [],
        createdAt: safeTrim((userData as Student).createdAt),
        updatedAt: safeTrim((userData as Student).updatedAt),
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
    const apiCall = trackApiCall('/users');
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
      apiCall.end(response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        // Validate and sanitize student data to prevent trim() errors
        const sanitizedStudents = data.users.map(
          (student: Partial<Student> & { fullname?: string }) => ({
            id: student.id || student._id || '',
            _id: student._id || student.id || '',
            name: safeTrim(student.name || student.fullname || student.displayName),
            email: safeTrim(student.email),
            role: student.role || 'student',
            username: safeTrim(student.username || student.email),
            englishName: safeTrim(student.englishName || student.name || student.fullname),
            gender: safeTrim(student.gender),
            dob: safeTrim(student.dob),
            phone: safeTrim(student.phone),
            parentName: safeTrim(student.parentName),
            parentPhone: safeTrim(student.parentPhone),
            notes: safeTrim(student.notes),
            status: safeTrim(student.status),
            studentCode: safeTrim(student.studentCode),
            avatarUrl: safeTrim(student.avatarUrl),
            diceBearStyle: safeTrim(student.diceBearStyle),
            diceBearSeed: safeTrim(student.diceBearSeed),
            classIds: Array.isArray(student.classIds) ? student.classIds : [],
            createdAt: safeTrim(student.createdAt),
            updatedAt: safeTrim(student.updatedAt),
          })
        );
        setStudents(sanitizedStudents);
        console.log('Students fetched and sanitized successfully:', sanitizedStudents.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedStudents = data.map(
          (student: Partial<Student> & { fullname?: string }) => ({
            id: student.id || student._id || '',
            _id: student._id || student.id || '',
            name: safeTrim(student.name || student.fullname || student.displayName),
            email: safeTrim(student.email),
            role: student.role || 'student',
            username: safeTrim(student.username || student.email),
            englishName: safeTrim(student.englishName || student.name || student.fullname),
            gender: safeTrim(student.gender),
            dob: safeTrim(student.dob),
            phone: safeTrim(student.phone),
            parentName: safeTrim(student.parentName),
            parentPhone: safeTrim(student.parentPhone),
            notes: safeTrim(student.notes),
            status: safeTrim(student.status),
            studentCode: safeTrim(student.studentCode),
            avatarUrl: safeTrim(student.avatarUrl),
            diceBearStyle: safeTrim(student.diceBearStyle),
            diceBearSeed: safeTrim(student.diceBearSeed),
            classIds: Array.isArray(student.classIds) ? student.classIds : [],
            createdAt: safeTrim(student.createdAt),
            updatedAt: safeTrim(student.updatedAt),
          })
        );
        setStudents(sanitizedStudents);
        console.log('Students fetched and sanitized successfully (direct array):', sanitizedStudents.length);
      } else {
        console.log('No students data or empty array returned:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      apiCall.end(false);
      setDataError('Failed to fetch students');
    }
  }, [user, apiUrl]);

  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    const apiCall = trackApiCall('/assignments');
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
      apiCall.end(response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.assignments)) {
        // Validate and sanitize assignment data to prevent trim() errors
        const sanitizedAssignments = data.assignments.map(
          (assignment: Partial<Assignment> & { _id?: string }) => ({
            id: assignment.id || assignment._id || '',
            title: safeTrim(assignment.title),
            level: (assignment.level && typeof assignment.level === 'string' ? assignment.level : (assignment.level as any)?.name || 'IELTS') as ExamLevel,
            skill: assignment.skill || 'Reading',
            description: safeTrim(assignment.description),
            questions: Array.isArray(assignment.questions) ? assignment.questions : [],
            answerKey: assignment.answerKey || {},
            audioUrl: safeTrim(assignment.audioUrl),
            pdfUrl: safeTrim(assignment.pdfUrl),
            publishDate: safeTrim(assignment.publishDate),
            dueDate: safeTrim(assignment.dueDate),
            classIds: Array.isArray(assignment.classIds) ? assignment.classIds : [],
            createdBy: safeTrim(assignment.createdBy),
            createdAt: safeTrim(assignment.createdAt),
            templateId: safeTrim(assignment.templateId),
          })
        );
        setAssignments(sanitizedAssignments);
        console.log('Assignments fetched and sanitized successfully:', sanitizedAssignments.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedAssignments = data.map(
          (assignment: Partial<Assignment> & { _id?: string }) => ({
            id: assignment.id || assignment._id || '',
            title: safeTrim(assignment.title),
            level: (assignment.level && typeof assignment.level === 'string' ? assignment.level : (assignment.level as any)?.name || 'IELTS') as ExamLevel,
            skill: assignment.skill || 'Reading',
            description: safeTrim(assignment.description),
            questions: Array.isArray(assignment.questions) ? assignment.questions : [],
            answerKey: assignment.answerKey || {},
            audioUrl: safeTrim(assignment.audioUrl),
            pdfUrl: safeTrim(assignment.pdfUrl),
            publishDate: safeTrim(assignment.publishDate),
            dueDate: safeTrim(assignment.dueDate),
            classIds: Array.isArray(assignment.classIds) ? assignment.classIds : [],
            createdBy: safeTrim(assignment.createdBy),
            createdAt: safeTrim(assignment.createdAt),
            templateId: safeTrim(assignment.templateId),
          })
        );
        setAssignments(sanitizedAssignments);
        console.log('Assignments fetched and sanitized successfully (direct array):', sanitizedAssignments.length);
      } else {
        console.log('No assignments data or empty array returned:', data);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      apiCall.end(false);
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
        const sanitizedSubmissions = data.submissions.map(
          (submission: Partial<Submission> & { _id?: string }) => ({
            id: submission.id || submission._id || '',
            studentId: safeTrim(submission.studentId),
            assignmentId: safeTrim(submission.assignmentId),
            submittedAt: safeTrim(submission.submittedAt),
            content: safeTrim(submission.content),
            score: submission.score || null,
            feedback: safeTrim(submission.feedback),
          })
        );
        setSubmissions(sanitizedSubmissions);
        console.log('Submissions fetched and sanitized successfully:', sanitizedSubmissions.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedSubmissions = data.map(
          (submission: Partial<Submission> & { _id?: string }) => ({
            id: submission.id || submission._id || '',
            studentId: safeTrim(submission.studentId),
            assignmentId: safeTrim(submission.assignmentId),
            submittedAt: safeTrim(submission.submittedAt),
            content: safeTrim(submission.content),
            score: submission.score || null,
            feedback: safeTrim(submission.feedback),
          })
        );
        setSubmissions(sanitizedSubmissions);
        console.log('Submissions fetched and sanitized successfully (direct array):', sanitizedSubmissions.length);
      } else {
        console.log('No submissions data or empty array returned:', data);
        setSubmissions([]);
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
        const sanitizedClasses = data.classes.map(
          (cls: Partial<StudentClass> & { _id?: string }) => ({
            _id: cls._id || cls.id || '',
            id: cls.id || cls._id || '',
            name: safeTrim(cls.name),
            classCode: safeTrim(cls.classCode),
            levelId: cls.levelId || null,
            studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
            teacherId: safeTrim(cls.teacherId),
            description: safeTrim(cls.description),
            isActive: cls.isActive !== undefined ? cls.isActive : true,
            createdAt: safeTrim(cls.createdAt),
            updatedAt: safeTrim(cls.updatedAt),
          })
        );
        setClasses(sanitizedClasses);
        console.log('Classes fetched and sanitized successfully:', sanitizedClasses.length);
      } else if (data && Array.isArray(data)) {
        // Handle case where data is directly an array
        const sanitizedClasses = data.map(
          (cls: Partial<StudentClass> & { _id?: string }) => ({
            _id: cls._id || cls.id || '',
            id: cls.id || cls._id || '',
            name: safeTrim(cls.name),
            classCode: safeTrim(cls.classCode),
            levelId: cls.levelId || null,
            studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : [],
            teacherId: safeTrim(cls.teacherId),
            description: safeTrim(cls.description),
            isActive: cls.isActive !== undefined ? cls.isActive : true,
            createdAt: safeTrim(cls.createdAt),
            updatedAt: safeTrim(cls.updatedAt),
          })
        );
        setClasses(sanitizedClasses);
        console.log('Classes fetched and sanitized successfully (direct array):', sanitizedClasses.length);
      } else {
        console.log('No classes data or empty array returned:', data);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setDataError('Failed to fetch classes');
    }
  }, [user, apiUrl]);

  // Optimized data fetching with reduced timeouts and better error handling
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);
      
      // Mark dashboard as ready for performance tracking
      markLoadingStage('dashboardReady');

      try {
        console.log('Starting optimized parallel data fetch...');

        // Execute all fetches in parallel with reduced timeout
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Data fetch timeout')), 10000) // Reduced from 15s
        );

        await Promise.race([
          Promise.allSettled([
            fetchStudents(),
            fetchAssignments(),
            fetchSubmissions(),
            fetchClasses()
          ]).then(results => {
            // Log any failures but don't block the UI
            results.forEach((result, index) => {
              const operations = ['students', 'assignments', 'submissions', 'classes'];
              if (result.status === 'rejected') {
                console.warn(`Failed to fetch ${operations[index]}:`, result.reason);
              }
            });
          }),
          timeoutPromise,
        ]);

        console.log('Data fetch completed');
        // Mark data loading complete for performance tracking
        markLoadingStage('dataLoaded');
        
        // Log performance report after initial load
        setTimeout(() => {
          logPerformanceReport();
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show error immediately, as partial data might be available
        setTimeout(() => {
          setDataError('Some data may not be up to date. Please refresh if needed.');
        }, 1000);
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
      // Use Promise.allSettled to prevent one failure from blocking others
      const results = await Promise.allSettled([
        fetchStudents(),
        fetchAssignments(),
        fetchSubmissions(),
        fetchClasses()
      ]);
      
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some data refresh operations failed:', failures);
        setDataError(`${failures.length} operations failed. Some data may not be current.`);
      } else {
        console.log('Data refreshed successfully');
      }
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
      return <Login onLoginSuccess={handleLoginSuccess} />;
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
      'Dashboard selection - Selected component:',
      DashboardComponent === StudentDashboard
        ? 'StudentDashboard'
        : DashboardComponent === AdminDashboard
          ? 'AdminDashboard'
          : 'TeacherDashboard'
    );

    try {
      return (
        <div className="app-container">
          <Sidebar
            role={user.role}
            activeKey={navKey}
            onNavigate={setNavKey}
            onLogout={handleLogout}
            user={user}
          />
          <main className="main-content">
            <Suspense fallback={<LoadingSpinner />}>
              {/* Debug Panel - Development Only */}
              {import.meta.env.DEV && navKey === 'debug' && (
                <DebugAPIPanel />
              )}
              
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
    } catch (dashboardError) {
      console.error('Dashboard loading error:', dashboardError);
      return (
        <div className="error-container">
          <h2>Dashboard Loading Error</h2>
          <p>Failed to load the dashboard. Please refresh the page.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
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
