import React, { useEffect, useState, Suspense, lazy, createContext, useContext } from "react";
import { authService } from './frontend/services/authService';
const Login = lazy(() => import('./Login'));
const Dashboard = lazy(() => import('./Dashboard'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
import Sidebar from './Sidebar';
import type { Assignment, Submission, Student, StudentClass } from "./types";

// Global Dark Mode Context
const DarkModeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
export const useDarkMode = () => useContext(DarkModeContext);

const App: React.FC = () => {
  console.log('App component loaded - version:', new Date().toISOString());
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [navKey, setNavKey] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('skillup_dark_mode');
    return stored ? stored === 'true' : false;
  });
  const toggleDarkMode = () => {
    setDarkMode((d) => {
      localStorage.setItem('skillup_dark_mode', (!d).toString());
      return !d;
    });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Test backend connectivity first
        console.log('Testing backend connectivity...');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
        const testResponse = await fetch(`${apiUrl}/test`);
        console.log('Backend test response status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Backend test data:', testData);
        } else {
          console.error('Backend test failed:', testResponse.status);
        }

        console.log('Initializing authentication...');
        const profile = await authService.getProfile();
        console.log('Auth profile received:', profile);
        if (profile && profile.email && profile.role) {
          setUser(profile);
          setAuthError(null);
          console.log('User authenticated successfully:', profile);
        } else {
          console.log('Invalid profile, logging out');
          await authService.logout();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError("Error initializing authentication. Please try again.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    console.log('Login successful, userData:', userData);
    setUser(userData);
    setAuthError(null);
  };

  const handleLogout = async () => {
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
  };

  const fetchStudents = async () => {
    if (!user) return;
    try {
      console.log('Fetching students...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const studentsResponse = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Students response status:', studentsResponse.status);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log('Students data:', studentsData);
        if (studentsData.success) {
          setStudents(studentsData.users || []);
        } else {
          setStudents([]);
        }
      } else {
        console.error('Failed to fetch students:', studentsResponse.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchAssignments = async () => {
    if (!user) return;
    try {
      console.log('Fetching assignments...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Assignments response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Assignments data:', data);
        setAssignments(data.assignments || []);
      } else {
        console.error('Failed to fetch assignments:', response.status);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    try {
      console.log('Fetching submissions...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Submissions response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Submissions data:', data);
        setSubmissions(data.submissions || []);
      } else {
        console.error('Failed to fetch submissions:', response.status);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
  };

  const fetchClasses = async () => {
    if (!user) return;
    try {
      console.log('Fetching classes...');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Classes response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Classes data:', data);
        setClasses(data.classes || []);
      } else {
        console.error('Failed to fetch classes:', response.status);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    console.log('User changed, fetching data for:', user);
    setDataLoading(true);
    setDataError(null);
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data for user:', user);
        if (user.role === 'admin' || user.role === 'teacher') {
          await fetchStudents();
        } else {
          setStudents([]);
        }
        await Promise.all([
          fetchAssignments(),
          fetchSubmissions(),
          fetchClasses()
        ]);
        console.log('Data fetching completed');
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setDataError('Failed to load data. Please try again. ' + (error?.message || ''));
        setStudents([]);
        setAssignments([]);
        setSubmissions([]);
        setClasses([]);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      if (user.role === 'admin' || user.role === 'teacher') {
        await fetchStudents();
      } else {
        setStudents([]);
      }
      await Promise.all([
        fetchAssignments(),
        fetchSubmissions(),
        fetchClasses()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setDataError('Failed to refresh data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  // Debug logging
  console.log('App render state:', {
    loading,
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    dataLoading,
    dataError,
    navKey,
    studentsCount: students.length,
    assignmentsCount: assignments.length,
    submissionsCount: submissions.length,
    classesCount: classes.length
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: 48, height: 48, borderRadius: '50%', borderBottom: '4px solid #307637', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '1.1rem', color: '#475569' }}>Initializing...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#d32f2f', fontSize: '1.2rem', marginBottom: 16 }}>Authentication Error</div>
          <p style={{ color: '#475569', marginBottom: 16 }}>{authError}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', background: '#307637', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#d32f2f', fontSize: '1.2rem', marginBottom: 16 }}>Dashboard Error</div>
          <p style={{ color: '#475569', marginBottom: 16 }}>{dataError}</p>
          <button onClick={refreshData} style={{ padding: '8px 20px', background: '#307637', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  // Ensure we have a user before rendering the main app
  if (!user) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><div style={{ margin: '0 auto 1rem', width: 48, height: 48, borderRadius: '50%', borderBottom: '4px solid #307637', animation: 'spin 1s linear infinite' }} /><p style={{ fontSize: '1.1rem', color: '#475569' }}>Loading...</p></div>}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ margin: '0 auto 1rem', width: 48, height: 48, borderRadius: '50%', borderBottom: '4px solid #307637', animation: 'spin 1s linear infinite' }} /><p style={{ fontSize: '1.1rem', color: '#475569' }}>Loading...</p></div>}>
        <div style={{ minHeight: '100vh', background: darkMode ? '#181f1b' : '#f8fafc' }}>
          <div style={{ display: 'flex' }}>
            <Sidebar 
              role={user.role} 
              activeKey={navKey} 
              onNavigate={setNavKey}
              onLogout={handleLogout}
            />
            <div style={{ flex: 1 }}>
              {dataLoading && (
                <div style={{ position: 'fixed', top: 16, right: 16, background: '#307637', color: '#fff', padding: '8px 20px', borderRadius: 8, boxShadow: '0 2px 8px #30763722', zIndex: 50 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: 8, width: 16, height: 16, borderRadius: '50%', borderBottom: '2px solid #fff', animation: 'spin 1s linear infinite' }} />
                    Loading data...
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#181f1b' : '#f8fafc' }}>
                {user.role === "student" ? (
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <StudentDashboard 
                      user={user}
                      assignments={assignments}
                      submissions={submissions}
                      classes={classes}
                      onNavigate={setNavKey}
                      activeKey={navKey}
                      onLogout={handleLogout}
                    />
                  </div>
                ) : user.role === "teacher" || user.role === "admin" ? (
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <TeacherDashboard 
                      user={user}
                      students={students}
                      assignments={assignments}
                      classes={classes}
                      activeKey={navKey}
                      onLogout={handleLogout}
                      onStudentAdded={fetchStudents}
                      onDataRefresh={refreshData}
                    />
                  </div>
                ) : (
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <Dashboard 
                      assignments={assignments}
                      submissions={submissions}
                      students={students}
                      classes={classes}
                      loading={dataLoading}
                      error={dataError}
                      user={user}
                      activeKey={navKey}
                      onLogout={handleLogout}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </DarkModeContext.Provider>
  );
};

export default App;