import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "./services/firebase";
import Login from "./Login";
import Dashboard from "./Dashboard";
import type { Assignment, Submission, Student, StudentClass } from "./types";
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import Sidebar from './Sidebar';

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

  // Bulletproof auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userDoc.exists()) {
          setAuthError("No user profile found in Firestore.");
          await signOut(auth);
          setUser(null);
        } else {
          const userData = userDoc.data() as Student;
          if (!userData.role) {
            setAuthError("User profile missing role.");
            await signOut(auth);
            setUser(null);
          } else {
            setUser({ ...userData, uid: firebaseUser.uid, email: firebaseUser.email });
            setAuthError(null);
          }
        }
      } catch (e) {
        setAuthError("Error fetching user profile. Please try again.");
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all dashboard data after login
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    Promise.all([
      getDocs(collection(db, "assignments")),
      getDocs(collection(db, "submissions")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "classes")),
    ]).then(([aSnap, sSnap, uSnap, cSnap]) => {
      setAssignments(aSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Assignment[]);
      setSubmissions(sSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Submission[]);
      setStudents(uSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
      setClasses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentClass[]);
      setDataLoading(false);
    }).catch(e => {
      setDataError("Failed to load dashboard data. Please try again.");
      setDataLoading(false);
    });
  }, [user]);

  // Global reset utility
  const resetAndReload = async () => {
    try { await signOut(auth); } catch {}
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

  if (!user) return <Login />;

  if (dataLoading) return <div className="p-8 text-center text-lg">Loading dashboard...</div>;
  if (dataError) return <div className="p-8 text-center text-red-600 font-semibold">{dataError}</div>;

  // Role-based dashboard rendering
  if (user.role === "student") {
    return (
      <div className="flex">
        <Sidebar role={user.role} onNavigate={setNavKey} activeKey={navKey || ''} />
        <StudentDashboard user={user} assignments={assignments} submissions={submissions} classes={classes} onNavigate={setNavKey} activeKey={navKey || ''} />
      </div>
    );
  } else if (user.role === "teacher" || user.role === "admin") {
    return (
      <div className="flex">
        <Sidebar role={user.role} onNavigate={setNavKey} activeKey={navKey || ''} />
        <TeacherDashboard user={user} students={students} assignments={assignments} classes={classes} onNavigate={setNavKey} activeKey={navKey || ''} />
      </div>
    );
  } else {
    return <div>Unknown role. Please contact support.</div>;
  }
};

export default App;