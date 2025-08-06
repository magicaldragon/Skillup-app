import React, { useEffect, useState, Suspense, lazy } from "react";
import { authService } from './frontend/services/authService';
import './App.css';
const Login = lazy(() => import('./Login'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
import Sidebar from './Sidebar';
import type { Assignment, Submission, Student, StudentClass } from "./types";

const App: React.FC = () => {
  console.log('App component loaded - version:', new Date().toISOString());
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [navKey, setNavKey] = useState('dashboard');

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const studentsResponse = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Students response status:', studentsResponse.status);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log('Students data:', studentsData);
        // Handle both array format and { users: [...] } format
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else if (studentsData && Array.isArray(studentsData.users)) {
          setStudents(studentsData.users);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
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
        
        // Prepare all fetch promises
        const fetchPromises: Promise<void>[] = [];
        
        if (user.role === 'admin' || user.role === 'teacher') {
          fetchPromises.push(fetchStudents());
        } else {
          setStudents([]);
        }
        
        fetchPromises.push(fetchAssignments());
        fetchPromises.push(fetchSubmissions());
        fetchPromises.push(fetchClasses());
        
        // Execute all fetches in parallel with timeout
        const timeoutPromise = new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
        );
        
        await Promise.race([
          Promise.all(fetchPromises),
          timeoutPromise
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
      // Prepare all fetch promises
      const fetchPromises: Promise<void>[] = [];
      
      if (user.role === 'admin' || user.role === 'teacher') {
        fetchPromises.push(fetchStudents());
      } else {
        setStudents([]);
      }
      
      fetchPromises.push(fetchAssignments());
      fetchPromises.push(fetchSubmissions());
      fetchPromises.push(fetchClasses());
      
      // Execute all fetches in parallel with timeout
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
      );
      
      await Promise.race([
        Promise.all(fetchPromises),
        timeoutPromise
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
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="loading-text">Initializing...</p>
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
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          margin: 0,
          padding: 0
        }}>
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ margin: '0 auto 1rem', width: 48, height: 48, borderRadius: '50%', borderBottom: '4px solid #307637', animation: 'spin 1s linear infinite' }} /><p style={{ fontSize: '1.1rem', color: '#475569' }}>Loading...</p></div>}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}>
        <Sidebar
          role={user.role}
          activeKey={navKey}
          onNavigate={setNavKey}
          onLogout={handleLogout}
          user={user}
        />
        <div style={{
          flexGrow: 1,
          height: '100vh',
          background: '#f8fafc',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {dataLoading && (
            <div className="data-loading-indicator">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="data-loading-spinner" />
                Loading data...
              </div>
            </div>
          )}
          {user.role === "student" ? (
            <StudentDashboard 
              user={user}
              classes={classes}
              activeKey={navKey}
            />
          ) : user.role === "teacher" || user.role === "admin" || user.role === "staff" ? (
            <TeacherDashboard 
              user={user}
              students={students}
              assignments={assignments}
              classes={classes}
              activeKey={navKey}
              onDataRefresh={refreshData}
            />
          ) : (
            // Fallback for any unexpected roles - show TeacherDashboard as default
            <TeacherDashboard 
              user={user}
              students={students}
              assignments={assignments}
              classes={classes}
              activeKey={navKey}
              onDataRefresh={refreshData}
            />
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default App;