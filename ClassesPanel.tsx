// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';



const ClassesPanel = ({ students, classes, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');


  // Add new class with level selection
  const [newClassLevelId, setNewClassLevelId] = useState<string>('');

  // Calculate age from birth year
  const calculateAge = (dob?: string) => {
    if (!dob) return 'N/A';
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear + 1;
  };

  // Fetch levels from backend
  const fetchLevels = async () => {
    setLevelsLoading(true);
    try {
      console.log('=== FETCHING LEVELS DEBUG ===');
      console.log('Fetching levels from: /api/levels');
      console.log('Current window location:', window.location.origin);
      
      // Get token from localStorage
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      console.log('Token available:', !!token);
      console.log('Token length:', token ? token.length : 0);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Request headers:', headers);
      
      const res = await fetch('/api/levels', { 
        credentials: 'include',
        headers
      });
      
      console.log('Levels response status:', res.status);
      console.log('Levels response ok:', res.ok);
      console.log('Levels response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Levels response error text:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Levels response data:', data);
      console.log('Levels array:', data.levels);
      console.log('Levels array length:', data.levels ? data.levels.length : 'undefined');
      console.log('Success field:', data.success);
      
      if (data.success && Array.isArray(data.levels)) {
        setLevels(data.levels);
        console.log('Successfully set levels:', data.levels.length, 'levels');
        console.log('Levels details:', data.levels.map((l: any) => ({ id: l._id, name: l.name, code: l.code })));
      } else {
        console.error('Invalid levels data structure:', data);
        setLevels([]);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    } finally {
      setLevelsLoading(false);
      console.log('=== END FETCHING LEVELS DEBUG ===');
    }
  };



  useEffect(() => {
    console.log('=== CLASSES PANEL MOUNTED ===');
    console.log('Component props:', { 
      studentsCount: students?.length || 0, 
      classesCount: classes?.length || 0,
      onDataRefresh: !!onDataRefresh 
    });
    fetchLevels();
  }, []);

  // Debug levels state changes
  useEffect(() => {
    console.log('=== LEVELS STATE CHANGED ===');
    console.log('Levels loading:', levelsLoading);
    console.log('Levels count:', levels.length);
    console.log('Levels data:', levels.map(l => ({ id: l._id, name: l.name, code: l.code })));
  }, [levels, levelsLoading]);

  // Add new class
  const handleAddClass = async () => {
    if (!newClassLevelId) {
      alert('Please select a level');
      return;
    }

    console.log('=== ADDING CLASS DEBUG ===');
    console.log('Selected level ID:', newClassLevelId);
    console.log('Selected level name:', levels.find(l => l._id === newClassLevelId)?.name);

    setAdding(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      console.log('Token available for class creation:', !!token);
      
      const requestBody = { levelId: newClassLevelId };
      console.log('Request body:', requestBody);
      
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('Class creation response status:', res.status);
      console.log('Class creation response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Class creation error text:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Class creation response data:', data);
      
      if (data.success) {
        console.log('Class created successfully:', data.class);
        setNewClassLevelId('');
        onDataRefresh?.();
      } else {
        console.error('Class creation failed:', data.message);
        alert(data.message || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class. Please try again.');
    } finally {
      setAdding(false);
      console.log('=== END ADDING CLASS DEBUG ===');
    }
  };

  // Handle class selection
  const handleClassClick = (classId: string) => {
    setSelectedClassId(selectedClassId === classId ? null : classId);
  };

  // Assign student to class
  const handleAssignStudent = async (studentId: string, classId: string) => {
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
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
      alert('Failed to assign student. Please try again.');
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) return;
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const res = await fetch(`/api/classes/${selectedClassId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      onDataRefresh?.();
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student. Please try again.');
    }
  };



  // Filter classes based on search and level filter
  const filteredClasses = (classes && Array.isArray(classes) ? classes : []).filter(c => {
    const levelName = levels.find(l => l._id === c.levelId)?.name || '';
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
              <option key={level._id} value={level._id}>{level.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="classes-info">
        Showing {filteredClasses.length} of {(classes && Array.isArray(classes) ? classes.length : 0)} classes
        {(classSearch || levelFilter) && (
          <span className="filter-info">
            {classSearch && ` matching "${classSearch}"`}
            {levelFilter && ` in ${levels.find(l => l._id === levelFilter)?.name}`}
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
              <tr key={cls.id} onClick={() => handleClassClick(cls.id)} className="clickable-row">
                <td className="class-name-cell">
                  <div className="class-name">{cls.name}</div>
                </td>
                <td className="level-cell">
                  <span className="level-badge">
                    {levels.find(l => l._id === cls.levelId)?.name || 'N/A'}
                  </span>
                </td>
                <td className="students-cell">
                  {cls.studentIds?.length || 0} students
                </td>
                <td className="actions-cell">
                  <button 
                    className="action-btn view-btn"
                    onClick={(e) => { e.stopPropagation(); handleClassClick(cls.id); }}
                  >
                    {selectedClassId === cls.id ? 'Hide Details' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Class Details Expansion */}
      {selectedClassId && selectedClass && (
        <div className="class-details-expansion">
          <div className="expansion-header">
            <h3>{selectedClass.name} - Student Details</h3>
            <button className="close-expansion-btn" onClick={() => setSelectedClassId(null)}>×</button>
          </div>
          
          <div className="students-section">
            <h4>Students in this class ({classStudents.length}):</h4>
            {classStudents.length === 0 ? (
              <p className="no-students">No students assigned to this class.</p>
            ) : (
              <div className="students-list">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>English Name</th>
                      <th>Age</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(student => (
                      <tr key={student.id} className="student-row">
                        <td>{student.studentCode || student.id}</td>
                        <td>{student.name}</td>
                        <td>{student.englishName || 'N/A'}</td>
                        <td>{calculateAge(student.dob)}</td>
                        <td className="student-actions">
                          <button 
                            onClick={() => handleRemoveStudent(student.id)}
                            className="action-btn remove-btn"
                          >
                            Remove
                          </button>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    {student.studentCode || student.id} - {student.name} {student.englishName ? `(${student.englishName})` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Add Class Form */}
      <div className="add-class-section">
        <div className="add-class-form">
          {levelsLoading ? (
            <div className="levels-loading-message">
              <div className="loading-spinner"></div>
              <p>Loading levels...</p>
            </div>
          ) : levels && Array.isArray(levels) && levels.length > 0 ? (
            <>
              <select 
                value={newClassLevelId} 
                onChange={e => setNewClassLevelId(e.target.value)}
                className="level-select"
              >
                <option value="">Select Level</option>
                {levels.map(level => (
                  <option key={level._id} value={level._id}>{level.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAddClass} 
                disabled={adding || !newClassLevelId} 
                className="add-class-btn"
              >
                {adding ? 'Creating...' : 'Create a new class'}
              </button>
            </>
          ) : (
            <div className="no-levels-message">
              <p>No levels available. Please create levels first in the Levels tab.</p>
              <button 
                onClick={() => window.location.hash = '#levels'}
                className="go-to-levels-btn"
              >
                Go to Levels
              </button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default ClassesPanel;