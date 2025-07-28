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
        const profile = await authService.getProfile();
        if (profile && profile.email && profile.role) {
          setUser(profile);
          setAuthError(null);
        } else {
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const studentsResponse = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setStudents(studentsData.users || []);
        } else {
          setStudents([]);
        }
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  };

  const fetchAssignments = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
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

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ margin: '0 auto 1rem', width: 48, height: 48, borderRadius: '50%', borderBottom: '4px solid #307637', animation: 'spin 1s linear infinite' }} /><p style={{ fontSize: '1.1rem', color: '#475569' }}>Loading...</p></div>}>
        {!user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
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
        )}
      </Suspense>
    </DarkModeContext.Provider>
  );
};

export default App;