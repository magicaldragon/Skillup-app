import React, { useEffect, useState } from 'react';
import type { Student, StudentClass } from './types';

const ReportsPanel = ({ isAdmin }: { isAdmin: boolean }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data.reports || []);
      const studentSnap = await fetch('/api/users').then(r => r.json());
      setStudents(studentSnap.users || []);
      const classSnap = await fetch('/api/classes').then(r => r.json());
      setClasses(classSnap.classes || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Group reports by class, then by student
  const grouped = reports.reduce((acc, r) => {
    acc[r.classId] = acc[r.classId] || {};
    acc[r.classId][r.studentId] = acc[r.classId][r.studentId] || [];
    acc[r.classId][r.studentId].push(r);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  const handleDeleteReport = async (reportId: string) => {
    await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    await fetchReports();
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading reports...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      {Object.keys(grouped).length === 0 && <div className="text-slate-400 text-center">No reports found.</div>}
      {Object.entries(grouped).map(([classId, studentsMap]) => {
        const classObj = classes.find(c => c.id === classId);
        return (
          <div key={classId} className="mb-8">
            <h3 className="text-lg font-bold mb-2">Class: {classObj?.name || classId}</h3>
            {Object.entries(studentsMap).map(([studentId, reportsArr]) => {
              const student = students.find(s => s.id === studentId);
              return (
                <div key={studentId} className="mb-4 p-4 bg-slate-50 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={student?.avatarUrl || '/anon-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />
                    <span className="font-semibold text-base">{student?.displayName || student?.name || studentId}</span>
                  </div>
                  <ul className="space-y-2">
                    {reportsArr.map((r: any) => (
                      <li key={r.id} className="flex flex-col md:flex-row md:items-center md:gap-4 bg-white rounded p-3 border border-slate-200">
                        <div className="flex-1">
                          <div className="text-slate-700 mb-1">{r.note}</div>
                          <div className="text-xs text-slate-500">By: {r.teacherId} &bull; {r.timestamp?.toDate ? r.timestamp.toDate().toLocaleString() : ''}</div>
                        </div>
                        {isAdmin && (
                          <button className="px-3 py-1 bg-red-600 text-white rounded mt-2 md:mt-0" onClick={() => handleDeleteReport(r.id)}>Delete</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ReportsPanel; 