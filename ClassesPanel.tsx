// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState } from 'react';
import type { Student, StudentClass } from './types';
import { useEffect } from 'react';
import { getLevels } from './services/firebase';
import type { Level } from './types';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students }: { students: Student[], classes?: StudentClass[], onAddClass?: (code: string) => void, onAssignLevel?: (classId: string, level: string) => void }) => {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [pendingLevel, setPendingLevel] = useState<{ classId: string, level: string } | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classSearch, setClassSearch] = useState('');
  // Add state and handlers for managing students
  const [managing, setManaging] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [reportingStudentId, setReportingStudentId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportSending, setReportSending] = useState(false);

  // Fetch all classes from backend
  const fetchClasses = async () => {
    setLoading(true);
    const res = await fetch('/api/classes');
    const data = await res.json();
    let allClasses = data.classes || [];
    // Sort: unassigned classes on top, then alphabetically by name
    allClasses = [
      ...allClasses.filter((c: any) => !c.levelId || c.levelId === ''),
      ...allClasses.filter((c: any) => c.levelId && c.levelId !== '').sort((a: any, b: any) => a.name.localeCompare(b.name))
    ];
    setClasses(allClasses);
    // Sync classLevels state with Firestore data
    const levelsMap: { [id: string]: string | null } = {};
    allClasses.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
    setLoading(false);
  };

  // Fetch levels from Firestore
  const fetchLevels = async () => {
    const fetched = await getLevels();
    setLevels(fetched);
  };

  useEffect(() => {
    fetchClasses();
    fetchLevels();
  }, []);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    const newClass = { name: nextCode, levelId: null };
    await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    });
    await fetchClasses();
    setAdding(false);
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    await fetch(`/api/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, levelId: newLevelId }),
    });
    setEditId(null);
    setEditName('');
    await fetchClasses();
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
    await fetchClasses();
  };

  // Assign student to class
  const handleAssignStudent = async (studentId: string, classId: string) => {
    // Find student
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const newClassIds = Array.from(new Set([...(student.classIds || []), classId]));
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: newClassIds }),
    });
    // Optionally, refresh students list in parent
  };

  const handleEditStudent = async (studentId: string, newName: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: newName }),
    });
    setEditStudentId(null);
    setEditStudentName('');
    await fetchClasses();
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
    await fetchClasses();
  };
  const handleReportStudent = (studentId: string) => {
    setReportingStudentId(studentId);
    setReportNote('');
  };
  const handleSendReport = async (studentId: string) => {
    setReportSending(true);
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        classId: selectedClassId,
        note: reportNote,
        teacherId: 'currentTeacherId', // Replace with actual logged-in teacher/admin id
        timestamp: new Date().toISOString(),
      }),
    });
    setReportSending(false);
    setReportingStudentId(null);
    setReportNote('');
  };

  const filteredClasses = classes.filter(c => {
    const levelName = levels.find(l => l.id === c.levelId)?.name || '';
    return (
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(classSearch.toLowerCase()) ||
      levelName.toLowerCase().includes(classSearch.toLowerCase())
    );
  });
  const selectedClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;
  const classStudents = selectedClass ? students.filter(s => (s.classIds || []).includes(selectedClass.id)) : [];

  if (loading) return <div className="p-8 text-center text-lg">Loading classes...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Classes</h2>
        <input
          className="p-2 border rounded mr-2"
          placeholder="Search classes by name, code, or level..."
          value={classSearch}
          onChange={e => setClassSearch(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-[#307637] text-white rounded shadow hover:bg-[#245929]"
          onClick={handleAddClass}
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add New Class'}
        </button>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-2">Code</th>
            <th className="p-2">Name</th>
            <th className="p-2">Level</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClasses.length === 0 && <tr><td colSpan={4} className="text-center text-slate-400">No classes found.</td></tr>}
          {filteredClasses.map(c => (
            <tr key={c.id} className={selectedClassId === c.id ? 'bg-green-100 border-2 border-green-500' : ''} onClick={() => setSelectedClassId(c.id)} style={{ cursor: 'pointer' }}>
              <td className="p-2 font-semibold select-none">{c.name}</td>
              <td className="p-2 select-none">{editId === c.id ? (
                <input value={editName} onChange={e => setEditName(e.target.value)} className="p-2 border rounded" autoFocus />
              ) : (
                <span className="select-none">{c.name}</span>
              )}</td>
              <td className="p-2 select-none">
                {editId === c.id ? (
                  <select
                    className="p-2 border rounded"
                    value={classLevels[c.id] || ''}
                    onChange={e => setClassLevels(prev => ({ ...prev, [c.id]: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                ) : (
                  <span className="select-none">{levels.find(l => l.id === classLevels[c.id])?.name || 'Unassigned'}</span>
                )}
              </td>
              <td className="p-2 flex gap-2 items-center">
                {selectedClassId === c.id && (
                  <>
                    {editId === c.id ? (
                      <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={e => { e.stopPropagation(); handleEditClass(c.id, editName, classLevels[c.id] || ''); }}>Confirm</button>
                    ) : (
                      <>
                        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={e => { e.stopPropagation(); setEditId(c.id); setEditName(c.name); }}>Edit</button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={e => { e.stopPropagation(); handleDeleteClass(c.id); }}>Delete</button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Class details block and global Edit/Delete buttons */}
      {selectedClass && (
        <div className="mt-8 p-6 bg-slate-100 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4">Class Details: {selectedClass.name}</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setManaging(true)}>Manage</button>
          </div>
          {managing && classStudents.length > 0 && (
            <table className="w-full text-left mb-4">
              <thead>
                <tr>
                  <th className="p-2">Student</th>
                  <th className="p-2">English Name</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map(s => (
                  <tr key={s.id}>
                    <td className="p-2 flex items-center gap-2">
                      <img src={s.avatarUrl || '/anon-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />
                      <span>{s.displayName || s.name}</span>
                    </td>
                    <td className="p-2">
                      {editStudentId === s.id ? (
                        <input value={editStudentName} onChange={e => setEditStudentName(e.target.value)} className="p-2 border rounded" autoFocus />
                      ) : (
                        <>{s.displayName || ''}</>
                      )}
                    </td>
                    <td className="p-2 flex gap-2 items-center">
                      {editStudentId === s.id ? (
                        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleEditStudent(s.id, editStudentName)}>Confirm</button>
                      ) : (
                        <>
                          <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => { setEditStudentId(s.id); setEditStudentName(s.displayName || ''); }}>Edit</button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => handleAssignStudent(s.id, selectedClass.id)}>Assign</button>
                          <button className="px-3 py-1 bg-pink-500 text-white rounded" onClick={() => handleReportStudent(s.id)}>Report</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!managing && classStudents.length === 0 && (
            <div className="text-slate-400">No students in this class.</div>
          )}
        </div>
      )}
      {reportingStudentId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Report Student</h3>
            <textarea
              className="w-full p-2 border rounded mb-4"
              rows={4}
              placeholder="Describe the issue or note..."
              value={reportNote}
              onChange={e => setReportNote(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setReportingStudentId(null)} disabled={reportSending}>Cancel</button>
              <button className="px-4 py-2 bg-pink-600 text-white rounded" onClick={() => handleSendReport(reportingStudentId)} disabled={reportSending || !reportNote.trim()}>{reportSending ? 'Sending...' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPanel; 