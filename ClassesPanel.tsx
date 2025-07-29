// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:', error);
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName, levelId: newLevelId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setEditId(null);
      setEditName('');
      onAssignLevel?.(classId, newLevelId || '');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error editing class:', error);
    }
  };

  // Delete class in backend
  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAssignLevel?.(classId, ''); // Signal deletion
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
  };
  const handleRemoveStudent = async (studentId: string) => {
    await fetch(`/api/users/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds: [] }),
    });
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

  return (
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Classes Management</h2>
        <p className="text-gray-600 mb-4">Manage all classes and student assignments</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {classes.length} classes
          {search && ` matching "${search}"`}
          {levelFilter && ` with level "${levels.find(l => l.id === levelFilter)?.name}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Class Name</th>
              <th className="p-2">Level</th>
              <th className="p-2">Students</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{cls.levelName || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClass(cls)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(cls)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(cls)} 
                    aria-label={`Delete class ${cls.name}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</code_block_to_apply_changes_from>
</edit_instructions>


Assistant: <rewritten_file>
```
// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import { useState, useEffect } from 'react';
import { isEmpty } from './utils/stringUtils';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onAssignLevel, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onAssignLevel?: (classId: string, level: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const nextCode = getNextClassCode(classes);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    // Sync classLevels state with classes prop
    const levelsMap: { [id: string]: string | null } = {};
    classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    setClassLevels(levelsMap);
  }, [classes]);

  // Instantly create a new class in backend
  const handleAddClass = async () => {
    setAdding(true);
    try {
      const newClass = { name: nextCode, levelId: null };
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onAddClass?.(nextCode);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding class:',