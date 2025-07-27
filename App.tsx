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
      const apiUrl = 'https://skillup-backend-v6vm.onrender.com/api';
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

        // TODO: These routes don't exist on deployed backend yet
        // For now, use mock data until backend is updated
        console.log('Using mock data for assignments, submissions, and classes');
        setAssignments([
          {
            id: '1',
            title: 'IELTS Reading Practice - Academic',
            description: 'Practice reading comprehension with academic texts',
            skill: 'Reading',
            level: 'IELTS',
            dueDate: '2024-12-31',
            publishDate: new Date().toISOString(),
            classIds: ['class1', 'class2'],
            createdAt: new Date().toISOString(),
            createdBy: 'teacher1',
            answerKey: {},
            questions: []
          },
          {
            id: '2',
            title: 'IELTS Writing Task 2 - Opinion Essay',
            description: 'Write an opinion essay on environmental issues',
            skill: 'Writing',
            level: 'IELTS',
            dueDate: '2024-12-25',
            publishDate: new Date().toISOString(),
            classIds: ['class1'],
            createdAt: new Date().toISOString(),
            createdBy: 'teacher1',
            answerKey: {},
            questions: []
          }
        ]);
        
        setSubmissions([
          {
            id: '1',
            assignmentId: '1',
            studentId: 'student1',
            content: 'This is my reading comprehension response...',
            submittedAt: new Date().toISOString(),
            score: 85,
            feedback: 'Excellent comprehension of the main ideas. Good use of context clues.'
          },
          {
            id: '2',
            assignmentId: '2',
            studentId: 'student1',
            content: 'This is my opinion essay on environmental issues...',
            submittedAt: new Date().toISOString(),
            score: null,
            feedback: ''
          }
        ]);
        
        setClasses([
          {
            id: 'class1',
            name: 'IELTS Advanced - Reading & Writing',
            levelId: 'ielts_advanced',
          },
          {
            id: 'class2',
            name: 'IELTS Intermediate - Speaking & Listening',
            levelId: 'ielts_intermediate',
          }
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
    } catch {}
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#307637] mb-6"></div>
        <div className="text-slate-600 text-lg font-semibold mb-4">Checking authentication...</div>
        {authError && <div className="text-red-600 text-center font-semibold mb-4">{authError}</div>}
        <button
          onClick={resetAndReload}
          className="bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-orange-700 transition-colors mt-4"
        >
          Reset & Restart Login
        </button>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-500">
          {user.role === "student" ? (
            <div className="flex flex-1">
              <Sidebar role={user.role} onNavigate={setNavKey} activeKey={navKey || ''} onLogout={handleLogout} />
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
            </div>
          ) : user.role === "teacher" || user.role === "admin" ? (
            <div className="flex flex-1">
              <Sidebar role={user.role} onNavigate={setNavKey} activeKey={navKey || ''} onLogout={handleLogout} />
              <div className="flex-1 overflow-auto">
                <TeacherDashboard 
                  user={user}
                  students={students}
                  assignments={assignments}
                  classes={classes}
                  activeKey={navKey}
                  onLogout={handleLogout}
                  onStudentAdded={fetchStudents}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1">
              <Sidebar role={user.role} onNavigate={setNavKey} activeKey={navKey || ''} onLogout={handleLogout} />
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
            </div>
          )}
        </div>
      </div>
    </DarkModeContext.Provider>
  );
};

export default App;