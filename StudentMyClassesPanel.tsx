import React, { useEffect, useState } from 'react';
import { db } from './services/firebase';
import type { Student, StudentClass, Submission } from './types';

const StudentMyClassesPanel = ({ user }: { user: Student }) => {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [classRes, studentRes, subRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/users'),
        fetch('/api/submissions'),
      ]);
      const classData = await classRes.json();
      const userClasses = classData.classes || [];
      setClasses(userClasses.filter((c: any) => (user.classIds || []).includes(c.id)));
      const studentData = await studentRes.json();
      setStudents(studentData.users || []);
      const subData = await subRes.json();
      setSubmissions(subData.submissions || []);
    };
    fetchData();
  }, [user.classIds]);

  if (loading) return <div className="p-8 text-center text-lg">Loading your classes...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">My Classes</h2>
      {classes.length === 0 ? (
        <div className="text-slate-400 text-center">You are not assigned to any class.</div>
      ) : (
        classes.map(cls => {
          const classmates = students.filter(s => (s.classIds || []).includes(cls.id));
          return (
            <div key={cls.id} className="mb-8 p-4 bg-slate-50 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2">{cls.name}</h3>
              <div className="mb-2 text-slate-500">Classmates:</div>
              <ul className="flex flex-wrap gap-4 mb-2">
                {classmates.map(s => {
                  const totalAssignments = submissions.filter(sub => sub.studentId === s.id).length;
                  // For demo, treat totalAssignments as progress (real logic may differ)
                  return (
                    <li key={s.id} className="flex flex-col items-center">
                      <img src={s.avatarUrl || '/anon-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full bg-slate-200" />
                      <span className="text-sm font-semibold">{s.displayName || s.name}</span>
                      <span className="text-xs text-slate-500">Assignments: {totalAssignments}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="text-xs text-slate-400">See your friends' progress and complete your assignments!</div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default StudentMyClassesPanel; 