// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const getNextClassCode = (classes: StudentClass[]) => {
  const codes = classes.map(c => parseInt(c.name.replace('SU-', ''), 10)).filter(n => !isNaN(n));
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return `SU-${next.toString().padStart(3, '0')}`;
};

const ClassesPanel = ({ students, classes, onAddClass, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
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
      onDataRefresh?.();
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  // Delete class from backend
  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  // Assign student to class
  const handleAssignStudent = async (studentId: string, classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onDataRefresh?.();
    } catch (error) {
      console.error('Error assigning student:', error);
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) return;
    try {
      const res = await fetch(`/api/classes/${selectedClassId}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      onDataRefresh?.();
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  // Report student
  const handleReportStudent = (studentId: string) => {
    setReportingStudentId(studentId);
    setReportNote('');
  };

  // Send report
  const handleSendReport = async (studentId: string) => {
    setReportSending(true);
    try {
      const res = await fetch('/api/studentRecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          action: 'report',
          note: reportNote,
          relatedClassId: selectedClassId,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setReportingStudentId(null);
      setReportNote('');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error sending report:', error);
    } finally {
      setReportSending(false);
    }
  };

  // Filter classes based on search
  const filteredClasses = classes.filter(c => {
    const levelName = levels.find(l => l.id === c.levelId)?.name || '';
    return c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      levelName.toLowerCase().includes(classSearch.toLowerCase());
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
            value={classSearch}
            onChange={e => setClassSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={classLevels[selectedClassId || ''] || ''} onChange={e => setClassLevels(prev => ({ ...prev, [selectedClassId!]: e.target.value }))}
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredClasses.length} of {classes.length} classes
          {classSearch && ` matching "${classSearch}"`}
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
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-4">
                  {classes.length === 0 ? 'No classes found.' : 'No classes match your search criteria.'}
                </td>
              </tr>
            )}
            {filteredClasses.map(cls => (
              <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold">{cls.name}</td>
                <td className="p-2">{levels.find(l => l.id === cls.levelId)?.name || 'N/A'}</td>
                <td className="p-2">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setSelectedClassId(cls.id)}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => setEditId(cls.id)} 
                    aria-label={`Edit class ${cls.name}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleDeleteClass(cls.id)} 
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

      {/* Add Class Button */}
      <div className="mt-6 text-center">
        <button 
          onClick={handleAddClass} 
          disabled={adding}
          className="form-btn primary"
        >
          {adding ? 'Adding...' : `Add New Class (${nextCode})`}
        </button>
      </div>

      {/* Class Details Modal */}
      {selectedClassId && selectedClass && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedClass.name} - Student Details</h3>
              <button onClick={() => setSelectedClassId(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Students in this class:</h4>
              {classStudents.length === 0 ? (
                <p className="text-gray-500">No students assigned to this class.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{student.displayName || student.name}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRemoveStudent(student.id)}
                          className="form-btn bg-red-600 text-white text-xs"
                        >
                          Remove
                        </button>
                        <button 
                          onClick={() => handleReportStudent(student.id)}
                          className="form-btn bg-yellow-600 text-white text-xs"
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Assign new student:</h4>
              <select 
                className="form-select"
                onChange={e => {
                  if (e.target.value) {
                    handleAssignStudent(e.target.value, selectedClassId);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select a student...</option>
                {students
                  .filter(s => !classStudents.find(cs => cs.id === s.id))
                  .map(student => (
                    <option key={student.id} value={student.id}>
                      {student.displayName || student.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Class</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Class Name
                <input 
                  className="form-input" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                />
              </label>
              <label className="block text-sm font-medium">Level
                <select 
                  className="form-select"
                  value={classLevels[editId] || ''} 
                  onChange={e => setClassLevels(prev => ({ ...prev, [editId]: e.target.value }))}
                >
                  <option value="">No Level</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                className="form-btn primary" 
                onClick={() => {
                  handleEditClass(editId, editName, classLevels[editId] || null);
                  setEditId(null);
                  setEditName('');
                }}
              >
                Save
              </button>
              <button 
                className="form-btn secondary" 
                onClick={() => {
                  setEditId(null);
                  setEditName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Student Modal */}
      {reportingStudentId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Report Student</h3>
            <textarea 
              className="form-textarea"
              placeholder="Enter report details..."
              value={reportNote}
              onChange={e => setReportNote(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 mt-4">
              <button 
                className="form-btn primary" 
                onClick={() => handleSendReport(reportingStudentId)}
                disabled={reportSending}
              >
                {reportSending ? 'Sending...' : 'Send Report'}
              </button>
              <button 
                className="form-btn secondary" 
                onClick={() => setReportingStudentId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPanel;