import React, { useEffect, useState } from 'react';
import { db } from './services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Student, StudentClass, Submission, Assignment } from './types';

const CATEGORIES = [
  { key: 'Speaking', code: 'S', label: 'Speaking' },
  { key: 'Writing', code: 'W', label: 'Writing' },
  { key: 'Reading', code: 'R', label: 'Reading' },
  { key: 'Listening', code: 'L', label: 'Listening' },
  { key: 'Full Practice Tests', code: 'FT', label: 'Full Test' },
  { key: 'Mini Tests', code: 'MT', label: 'Mini Test' },
];

const TeacherScoresFeedbackPanel = () => {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const classSnap = await getDocs(collection(db, 'classes'));
      setClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentClass[]);
      const studentSnap = await getDocs(collection(db, 'users'));
      setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
      const assignSnap = await getDocs(collection(db, 'assignments'));
      setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Assignment[]);
      const subSnap = await getDocs(collection(db, 'submissions'));
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Submission[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const classStudents = students.filter(s => (s.classIds || []).includes(selectedClassId));

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Scores & Feedback</h2>
      <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
        <select
          className="p-2 border rounded"
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
        >
          <option value="">Select class...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedClassId && classStudents.length === 0 && (
        <div className="text-slate-400 text-center">No students in this class.</div>
      )}
      {selectedClassId && classStudents.length > 0 && (
        <div className="space-y-4">
          {classStudents.map(stu => (
            <div key={stu.id} className="bg-slate-50 rounded-lg shadow-sm">
              <button
                className="w-full flex items-center justify-between px-4 py-3 font-semibold text-lg text-left focus:outline-none"
                onClick={() => setExpandedStudent(expandedStudent === stu.id ? null : stu.id)}
              >
                <span className="flex items-center gap-2">
                  <img src={stu.avatarUrl || '/anon-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />
                  {stu.displayName || stu.name}
                </span>
                <span>{expandedStudent === stu.id ? '▲' : '▼'}</span>
              </button>
              {expandedStudent === stu.id && (
                <div className="px-4 pb-4">
                  {CATEGORIES.map(cat => {
                    const catAssignments = assignments.filter(a =>
                      (a.skill === cat.key || a.category === cat.key) &&
                      (a.classIds || []).includes(selectedClassId)
                    );
                    const stuSubs = submissions.filter(s => s.studentId === stu.id);
                    return (
                      <div key={cat.key} className="mb-4">
                        <h4 className="font-bold text-base mb-2 mt-4">{cat.label}</h4>
                        {catAssignments.length === 0 ? (
                          <div className="text-slate-400 text-sm">No assignments.</div>
                        ) : (
                          <table className="w-full text-left mb-2">
                            <thead>
                              <tr>
                                <th className="p-2">Code</th>
                                <th className="p-2">Score</th>
                                <th className="p-2">Feedback</th>
                                {['Reading', 'Listening'].includes(cat.key) && <th className="p-2">Answer Key</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {catAssignments.map(a => {
                                const sub = stuSubs.find(s => s.assignmentId === a.id);
                                const code = a.code || (cat.code + '-' + a.id.slice(-3).toUpperCase());
                                return (
                                  <tr key={a.id} className="hover:bg-slate-100 transition">
                                    <td className="p-2 font-semibold">{code}</td>
                                    <td className="p-2">{typeof sub?.score === 'number' ? sub.score : '-'}</td>
                                    <td className="p-2">{sub?.feedback || '-'}</td>
                                    {['Reading', 'Listening'].includes(cat.key) && <td className="p-2">{a.answerKey ? JSON.stringify(a.answerKey) : '-'}</td>}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherScoresFeedbackPanel; 