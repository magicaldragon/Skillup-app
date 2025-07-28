import React, { useEffect, useState, createContext, useContext } from "react";
import { hybridAuthService } from "./services/hybridAuthService";
import Login from "./Login";
import Dashboard from "./Dashboard";
import type { Assignment, Submission, Student, StudentClass } from "./types";
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import Sidebar from './Sidebar';

// Global Dark Mode Context
const DarkModeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
export const useDarkMode = () => useContext(DarkModeContext);

const App: React.FC = () => {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [navKey, setNavKey] = useState('dashboard'); // Track active sidebar key
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode((d) => !d);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const currentUser = await hybridAuthService.initializeAuth();
        if (currentUser) {
          setUser(currentUser as Student);
          setAuthError(null);
        } else {
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

  // Handle login success
  const handleLoginSuccess = (userData: any) => {
    setUser(userData as Student);
    setAuthError(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await hybridAuthService.logout();
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

  // Fetch all dashboard data after login
  const fetchStudents = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const studentsResponse = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
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

  // Fetch assignments from API
  const fetchAssignments = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
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

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
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

  // Fetch classes from API
  const fetchClasses = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
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
        // Only fetch students if user is admin or teacher
        if (user.role === 'admin' || user.role === 'teacher') {
          await fetchStudents();
        } else {
          // For students, set empty array
          setStudents([]);
        }

        // Fetch real data from API endpoints
        await Promise.all([
          fetchAssignments(),
          fetchSubmissions(),
          fetchClasses()
        ]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataError('Failed to load data. Please try again.');
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

  // Global reset utility
  const resetAndReload = async () => {
    try { 
      await hybridAuthService.logout(); 
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

  // Refresh data function
  const refreshData = async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    
    try {
      // Only fetch students if user is admin or teacher
      if (user.role === 'admin' || user.role === 'teacher') {
        await fetchStudents();
      } else {
        // For students, set empty array
        setStudents([]);
      }

      // Fetch real data from API endpoints
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#307637] mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Authentication Error</div>
          <p className="text-slate-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#307637] text-white rounded hover:bg-[#245929]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="flex">
          <Sidebar 
            role={user.role} 
            activeKey={navKey} 
            onNavigate={setNavKey}
            onLogout={handleLogout}
          />
          <div className="flex-1">
            {dataLoading && (
              <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading data...
                </div>
              </div>
            )}
            {dataError && (
              <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {dataError}
                  <button 
                    onClick={refreshData}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-500">
              {user.role === "student" ? (
                <div className="flex-1 overflow-auto">
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
                <div className="flex-1 overflow-auto">
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
                <div className="flex-1 overflow-auto">
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
    </DarkModeContext.Provider>
  );
};

export default App;