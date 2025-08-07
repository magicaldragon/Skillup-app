// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';



// Interface for class editing modal
interface ClassEditModal {
  isOpen: boolean;
  classId: string | null;
  className: string;
  levelName: string;
  students: Student[];
}

// Interface for report modal
interface ReportModal {
  isOpen: boolean;
  studentId: string | null;
  studentName: string;
  classId: string;
  className: string;
}

const ClassesPanel = ({ students, classes, onDataRefresh }: { 
  students: Student[], 
  classes: StudentClass[], 
  onDataRefresh?: () => void
}) => {
  const [adding, setAdding] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);

  const [classSearch, setClassSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  // Class editing modal state
  const [classEditModal, setClassEditModal] = useState<ClassEditModal>({
    isOpen: false,
    classId: null,
    className: '',
    levelName: '',
    students: []
  });

  // Report modal state
  const [reportModal, setReportModal] = useState<ReportModal>({
    isOpen: false,
    studentId: null,
    studentName: '',
    classId: '',
    className: ''
  });

  // Report form state
  const [reportProblem, setReportProblem] = useState('');
  const [reportSending, setReportSending] = useState(false);

  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Add new class with level selection
  const [newClassLevelId, setNewClassLevelId] = useState<string>('');



  // Fetch levels from backend
  const fetchLevels = async () => {
    setLevelsLoading(true);
    try {
      console.log('=== FETCHING LEVELS DEBUG ===');
      
      // Get token from localStorage
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      console.log('Token available:', !!token);
      
      if (!token) {
        console.error('No authentication token found');
        setLevels([]);
        setLevelsLoading(false);
        return;
      }
      
      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Making request to /api/levels with token');
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/levels`, { 
        credentials: 'include',
        headers
      });
      
      console.log('Levels response status:', res.status);
      console.log('Levels response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Levels response error text:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Levels response data:', data);
      
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
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/classes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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





  // Open class edit modal
  const handleEditClass = (classId: string) => {
    const classObj = classes.find(c => c.id === classId);
    if (!classObj) return;

    const levelName = levels.find(l => l._id === classObj.levelId)?.name || 'N/A';
    const classStudents = students.filter(s => (s.classIds || []).includes(classId));

    setClassEditModal({
      isOpen: true,
      classId,
      className: classObj.name,
      levelName,
      students: classStudents
    });
    setSelectedStudentIds([]);
  };

  // Close class edit modal
  const handleCloseClassEditModal = () => {
    setClassEditModal({
      isOpen: false,
      classId: null,
      className: '',
      levelName: '',
      students: []
    });
    setSelectedStudentIds([]);
  };

  // Toggle student selection for bulk actions
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    setSelectedStudentIds(classEditModal.students.map(s => s.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedStudentIds([]);
  };

  // Bulk assign students to another class
  const handleBulkAssign = async (targetClassId: string) => {
    if (selectedStudentIds.length === 0) {
      alert('Please select students to assign');
      return;
    }

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';

      for (const studentId of selectedStudentIds) {
        const res = await fetch(`${apiUrl}/classes/${targetClassId}/students`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ studentId }),
        });
        
        if (!res.ok) {
          throw new Error(`Failed to assign student ${studentId}`);
        }
      }

      alert('Students assigned successfully!');
      onDataRefresh?.();
      handleCloseClassEditModal();
    } catch (error) {
      console.error('Error bulk assigning students:', error);
      alert('Failed to assign students. Please try again.');
    }
  };

  // Bulk remove students to waiting list
  const handleBulkRemove = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select students to remove');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${selectedStudentIds.length} students to the waiting list?`)) return;

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';

      for (const studentId of selectedStudentIds) {
        // Remove from current class
        const removeRes = await fetch(`${apiUrl}/classes/${classEditModal.classId}/students/${studentId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!removeRes.ok) {
          throw new Error(`Failed to remove student ${studentId}`);
        }

        // Update student status to "studying" (waiting list)
        const updateRes = await fetch(`${apiUrl}/users/${studentId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'studying' }),
        });
        
        if (!updateRes.ok) {
          throw new Error(`Failed to update student ${studentId} status`);
        }
      }

      alert('Students removed to waiting list successfully!');
      onDataRefresh?.();
      handleCloseClassEditModal();
    } catch (error) {
      console.error('Error bulk removing students:', error);
      alert('Failed to remove students. Please try again.');
    }
  };

  // Open report modal
  const handleReportStudent = (studentId: string, studentName: string) => {
    setReportModal({
      isOpen: true,
      studentId,
      studentName,
      classId: classEditModal.classId || '',
      className: classEditModal.className
    });
    setReportProblem('');
  };

  // Close report modal
  const handleCloseReportModal = () => {
    setReportModal({
      isOpen: false,
      studentId: null,
      studentName: '',
      classId: '',
      className: ''
    });
    setReportProblem('');
  };

  // Send report
  const handleSendReport = async () => {
    if (!reportProblem.trim()) {
      alert('Please describe the problem');
      return;
    }

    setReportSending(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      
      const res = await fetch(`${apiUrl}/student-records`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: reportModal.studentId,
          action: 'report',
          category: 'behavior',
          details: {
            problem: reportProblem,
            classId: reportModal.classId,
            className: reportModal.className,
            reportedAt: new Date().toISOString()
          }
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send report');
      }
      
      alert('Report sent successfully!');
      handleCloseReportModal();
      onDataRefresh?.();
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report. Please try again.');
    } finally {
      setReportSending(false);
    }
  };

  // Edit class information
  const handleEditClassInfo = async (classId: string) => {
    // This would open a form to edit class details like name, level, etc.
    // For now, we'll just show an alert
    alert('Edit class information functionality will be implemented here');
  };

  // Delete class
  const handleDeleteClass = async (classId: string) => {
    const classObj = classes.find(c => c.id === classId);
    if (!classObj) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete class "${classObj.name}"? This action cannot be undone and will remove all students from this class.`
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      
      const res = await fetch(`${apiUrl}/classes/${classId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      alert('Class deleted successfully!');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (classEditModal.isOpen) {
          handleCloseClassEditModal();
        }
        if (reportModal.isOpen) {
          handleCloseReportModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [classEditModal.isOpen, reportModal.isOpen]);



  // Filter classes based on search and level filter
  const filteredClasses = (classes && Array.isArray(classes) ? classes : []).filter(c => {
    const levelName = levels.find(l => l._id === c.levelId)?.name || '';
    const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      levelName.toLowerCase().includes(classSearch.toLowerCase());
    const matchesLevel = !levelFilter || c.levelId === levelFilter;
    
    return matchesSearch && matchesLevel;
  });



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
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Search is already live, just focus the input
                  (e.target as HTMLInputElement).focus();
                }
              }}
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
              <tr key={cls.id} onClick={() => handleEditClass(cls.id)} className="clickable-row">
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
                  <div className="action-buttons">
                    <button 
                      className="action-btn edit-btn"
                      onClick={(e) => { e.stopPropagation(); handleEditClass(cls.id); }}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn edit-info-btn"
                      onClick={(e) => { e.stopPropagation(); handleEditClassInfo(cls.id); }}
                    >
                      Edit Info
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



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

      {/* Class Edit Modal */}
      {classEditModal.isOpen && (
        <div className="class-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>CLASS: {classEditModal.className} LEVEL: {classEditModal.levelName}</h3>
              <button className="close-btn" onClick={handleCloseClassEditModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="students-section">
                <div className="section-header">
                  <h4>List of Students ({classEditModal.students.length})</h4>
                  <div className="bulk-actions">
              <button 
                      className="bulk-btn select-all-btn"
                      onClick={selectAllStudents}
              >
                      Select All
              </button>
              <button 
                      className="bulk-btn clear-all-btn"
                      onClick={clearAllSelections}
              >
                      Clear All
              </button>
            </div>
          </div>
                
                {classEditModal.students.length === 0 ? (
                  <p className="no-students">No students assigned to this class.</p>
                ) : (
                  <div className="students-table-container">
                    <table className="students-table">
            <thead>
              <tr>
                          <th className="checkbox-header">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.length === classEditModal.students.length && classEditModal.students.length > 0}
                              onChange={selectedStudentIds.length === classEditModal.students.length ? clearAllSelections : selectAllStudents}
                              className="select-all-checkbox"
                            />
                          </th>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>English Name</th>
                          <th>DOB</th>
                          <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                        {classEditModal.students.map(student => (
                          <tr key={student.id} className="student-row">
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="row-checkbox"
                              />
                  </td>
                            <td>{student.studentCode || student.id}</td>
                            <td>{student.name}</td>
                            <td>{student.englishName || 'N/A'}</td>
                            <td>{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</td>
                            <td>{student.gender || 'N/A'}</td>
                            <td className="student-actions">
                      <button 
                                onClick={() => handleReportStudent(student.id, student.name)}
                                className="action-btn report-btn"
                      >
                                Report
                      </button>
                    </td>
                  </tr>
                        ))}
            </tbody>
          </table>
        </div>
                )}
              </div>
              
              {selectedStudentIds.length > 0 && (
                <div className="bulk-actions-section">
                  <h4>Bulk Actions for {selectedStudentIds.length} selected student(s):</h4>
                  <div className="bulk-actions-buttons">
                    <div className="bulk-action-group">
                      <label>Assign to another class:</label>
                      <select 
                        className="target-class-select"
                        onChange={e => {
                          if (e.target.value) {
                            handleBulkAssign(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Select target class...</option>
                        {classes && Array.isArray(classes) && classes
                          .filter(c => c.id !== classEditModal.classId)
                          .map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} ({levels.find(l => l._id === cls.levelId)?.name || 'N/A'})
                            </option>
                          ))}
                      </select>
              </div>
                    <button 
                      onClick={handleBulkRemove}
                      className="bulk-btn remove-btn"
                    >
                      Remove to Waiting List
                    </button>
              </div>
              </div>
              )}
              </div>
              </div>
            </div>
      )}

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="report-modal">
          <div className="report-modal-content">
            <div className="modal-header">
              <h3>Report Student: {reportModal.studentName}</h3>
              <button className="close-btn" onClick={handleCloseReportModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="report-info">
                <p><strong>Student:</strong> {reportModal.studentName}</p>
                <p><strong>Class:</strong> {reportModal.className}</p>
              </div>
            
              <div className="report-form">
                <label htmlFor="problem">Problem Description:</label>
                <textarea 
                  id="problem"
                  value={reportProblem}
                  onChange={e => setReportProblem(e.target.value)}
                  placeholder="Describe the problem or misbehavior..."
                  rows={4}
                  className="report-textarea"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={handleSendReport}
                  disabled={reportSending || !reportProblem.trim()}
                  className="save-btn"
                >
                  {reportSending ? 'Sending...' : 'Confirm'}
                </button>
                <button 
                  onClick={handleCloseReportModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassesPanel;