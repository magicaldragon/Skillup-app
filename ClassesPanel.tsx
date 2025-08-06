// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

const ClassesPanel = ({ students, classes, onAddClass, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onAddClass?: (code: string) => void, 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const [classLevels, setClassLevels] = useState<{ [id: string]: string | null }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [reportingStudentId, setReportingStudentId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportSending, setReportSending] = useState(false);

  // Add new class with level selection
  const [newClassLevelId, setNewClassLevelId] = useState<string>('');

  // Fetch levels from backend
  const fetchLevels = async () => {
    try {
      console.log('Fetching levels from: /api/levels');
      const res = await fetch('/api/levels', { 
        credentials: 'include' 
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Levels response:', data);
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
    if (classes && Array.isArray(classes)) {
      classes.forEach((c: any) => { levelsMap[c.id] = c.levelId || ''; });
    }
    setClassLevels(levelsMap);
  }, [classes]);

  // Add new class with level selection
  const handleAddClass = async () => {
    setAdding(true);
    try {
      if (!newClassLevelId) {
        alert('Please select a level for the new class.');
        setAdding(false);
        return;
      }

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ levelId: newClassLevelId }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      alert(`Class created successfully! Class ID: ${result.class.name}`);
      onAddClass && onAddClass('');
      onDataRefresh?.();
      setNewClassLevelId('');
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to create class. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  // Edit class name/level in backend
  const handleEditClass = async (classId: string, newName: string, newLevelId: string | null) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
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
        credentials: 'include'
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
        headers: { 
          'Content-Type': 'application/json'
        },
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
        credentials: 'include'
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
        headers: { 
          'Content-Type': 'application/json'
        },
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

  // Filter classes based on search and level filter
  const filteredClasses = (classes && Array.isArray(classes) ? classes : []).filter(c => {
    const levelName = levels.find(l => l.id === c.levelId)?.name || '';
    const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      levelName.toLowerCase().includes(classSearch.toLowerCase());
    const matchesLevel = !levelFilter || c.levelId === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const selectedClass = selectedClassId && classes && Array.isArray(classes) ? classes.find(c => c.id === selectedClassId) : null;
  const classStudents = selectedClass ? (students && Array.isArray(students) ? students.filter(s => (s.classIds || []).includes(selectedClass.id)) : []) : [];

  return (
    <div className="classes-panel">
      <div className="classes-header">
        <h2 className="classes-title">Classes Management</h2>
        <p className="classes-subtitle">Manage all classes and student assignments</p>
      </div>
      
      <div className="classes-search">
        <div className="search-controls">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search classes..."
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
            />
            <button className="search-bar-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <select 
            className="status-filter-select"
            value={levelFilter} 
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {levels && Array.isArray(levels) && levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="classes-info">
        Showing {filteredClasses.length} of {(classes && Array.isArray(classes) ? classes.length : 0)} classes
        {(classSearch || levelFilter) && (
          <span className="filter-info">
            {classSearch && ` matching "${classSearch}"`}
            {levelFilter && ` in ${levels.find(l => l.id === levelFilter)?.name}`}
          </span>
        )}
      </div>
      
      <div className="classes-table-container">
        <table className="classes-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Level</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <p>No classes found.</p>
                                         <p className="empty-subtitle">
                       {(!classes || !Array.isArray(classes) || classes.length === 0)
                         ? "Create your first class by selecting a level below."
                         : "No classes match your current search criteria."
                       }
                     </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredClasses.map(cls => (
              <tr key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="clickable-row">
                <td className="class-name-cell">
                  <div className="class-name">{cls.name}</div>
                </td>
                <td className="level-cell">
                  <span className="level-badge">
                    {levels.find(l => l.id === cls.levelId)?.name || 'N/A'}
                  </span>
                </td>
                <td className="students-cell">
                  {cls.studentIds?.length || 0} students
                  {cls.studentIds?.length > 0 && (
                    <button 
                      className="view-details-btn"
                      onClick={(e) => { e.stopPropagation(); setSelectedClassId(cls.id); }}
                    >
                      View Details
                    </button>
                  )}
                </td>
                <td className="actions-cell">
                  <button 
                    className="action-btn edit-btn"
                    onClick={(e) => { e.stopPropagation(); setEditId(cls.id); }}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Class Form */}
      <div className="add-class-section">
        <div className="add-class-form">
          <select 
            value={newClassLevelId} 
            onChange={e => setNewClassLevelId(e.target.value)}
            className="level-select"
          >
            <option value="">Select Level</option>
            {levels && Array.isArray(levels) && levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddClass} 
            disabled={adding || !newClassLevelId} 
            className="add-class-btn"
          >
            {adding ? 'Creating...' : 'Add Class'}
          </button>
        </div>
      </div>

      {/* Class Details Modal */}
      {selectedClassId && selectedClass && (
        <div className="class-details-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedClassId(null)}>×</button>
            <h3>{selectedClass.name} - Student Details</h3>
            
            <div className="students-section">
              <h4>Students in this class:</h4>
              {classStudents.length === 0 ? (
                <p className="no-students">No students assigned to this class.</p>
              ) : (
                <div className="students-list">
                  {classStudents.map(student => (
                    <div key={student.id} className="student-item">
                      <span className="student-name">{student.displayName || student.name}</span>
                      <div className="student-actions">
                        <button 
                          onClick={() => handleRemoveStudent(student.id)}
                          className="action-btn remove-btn"
                        >
                          Remove
                        </button>
                        <button 
                          onClick={() => handleReportStudent(student.id)}
                          className="action-btn report-btn"
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="assign-section">
              <h4>Assign new student:</h4>
              <select 
                className="student-select"
                onChange={e => {
                  if (e.target.value) {
                    handleAssignStudent(e.target.value, selectedClassId);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select a student...</option>
                {students && Array.isArray(students) && students
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
        <div className="edit-class-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setEditId(null); setEditName(''); }}>×</button>
            <h3>Edit Class</h3>
            <div className="edit-form">
              <div className="form-group">
                <label>Class Name</label>
                <input 
                  className="form-input" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select 
                  className="form-select"
                  value={classLevels[editId] || ''} 
                  onChange={e => setClassLevels(prev => ({ ...prev, [editId]: e.target.value }))}
                >
                  <option value="">No Level</option>
                  {levels && Array.isArray(levels) && levels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="action-btn save-btn" 
                onClick={() => {
                  handleEditClass(editId, editName, classLevels[editId] || null);
                  setEditId(null);
                  setEditName('');
                }}
              >
                Save
              </button>
              <button 
                className="action-btn cancel-btn" 
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
        <div className="report-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setReportingStudentId(null)}>×</button>
            <h3>Report Student</h3>
            <textarea 
              className="form-textarea"
              placeholder="Enter report details..."
              value={reportNote}
              onChange={e => setReportNote(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button 
                className="action-btn save-btn" 
                onClick={() => handleSendReport(reportingStudentId)}
                disabled={reportSending}
              >
                {reportSending ? 'Sending...' : 'Send Report'}
              </button>
              <button 
                className="action-btn cancel-btn" 
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