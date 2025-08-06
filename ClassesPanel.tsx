// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import type { Level } from './types';
import './ClassesPanel.css';

interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  englishName?: string;
  level: string;
  className: string;
  problem: string;
  reportedBy: string;
  reportedAt: string;
  status: '!!!' | 'solved';
  solution?: string;
}

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
  const [reportingStudentId, setReportingStudentId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [solutionNote, setSolutionNote] = useState('');

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
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/levels', { 
        credentials: 'include',
        headers
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && Array.isArray(data.levels)) {
        setLevels(data.levels);
      } else {
        setLevels([]);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
    } finally {
      setLevelsLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/studentRecords/reports', { 
        credentials: 'include',
        headers
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && Array.isArray(data.records)) {
        setReports(data.records.map((record: any) => ({
          id: record._id,
          studentId: record.studentId?._id || record.studentId || 'N/A',
          studentName: record.studentId?.name || record.studentName || 'N/A',
          englishName: record.studentId?.englishName || 'N/A',
          level: record.details?.level || 'N/A',
          className: record.relatedClass?.name || record.details?.className || 'N/A',
          problem: record.details?.problem || record.details?.note || '',
          reportedBy: record.performedByName || 'N/A',
          reportedAt: record.timestamp,
          status: record.details?.status || '!!!',
          solution: record.details?.solution || ''
        })));
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  useEffect(() => {
    fetchLevels();
    fetchReports();
  }, []);

  // Add new class
  const handleAddClass = async () => {
    if (!newClassLevelId) {
      alert('Please select a level');
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ levelId: newClassLevelId }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setNewClassLevelId('');
        onDataRefresh?.();
      } else {
        alert(data.message || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class. Please try again.');
    } finally {
      setAdding(false);
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

  // Report student
  const handleReportStudent = (studentId: string) => {
    setReportingStudentId(studentId);
    setReportNote('');
  };

  // Send report
  const handleSendReport = async (studentId: string) => {
    if (!reportNote.trim()) {
      alert('Please enter a report description');
      return;
    }

    setReportSending(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const selectedClass = classes.find(c => c.id === selectedClassId);
      
      const res = await fetch('/api/studentRecords', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          action: 'report',
          category: 'academic',
          details: {
            problem: reportNote,
            status: '!!!',
            className: selectedClass?.name || 'N/A',
            level: levels.find(l => l._id === selectedClass?.levelId)?.name || 'N/A'
          },
          relatedClass: selectedClassId,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setReportingStudentId(null);
      setReportNote('');
      fetchReports();
      onDataRefresh?.();
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report. Please try again.');
    } finally {
      setReportSending(false);
    }
  };

  // Update report status
  const handleUpdateReportStatus = async (reportId: string, status: '!!!' | 'solved', solution?: string) => {
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const res = await fetch(`/api/studentRecords/${reportId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({
          details: {
            status,
            solution: solution || ''
          }
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      fetchReports();
      setSelectedReport(null);
      setSolutionNote('');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
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
                          <button 
                            onClick={() => handleReportStudent(student.id)}
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

      {/* Report Student Modal */}
      {reportingStudentId && (
        <div className="report-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setReportingStudentId(null)}>×</button>
            <h3>Report Student</h3>
            <textarea 
              className="form-textarea"
              placeholder="Enter report details (e.g., naughty in class, did not finish homework, etc.)..."
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

      {/* Reports Section */}
      <div className="reports-section">
        <h3>Student Reports</h3>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reported By</th>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>English Name</th>
                <th>Level</th>
                <th>Class</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table">
                    <p>No reports found.</p>
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="report-row">
                    <td>{new Date(report.reportedAt).toLocaleString()}</td>
                    <td>{report.reportedBy}</td>
                    <td>{report.studentId}</td>
                    <td>{report.studentName}</td>
                    <td>{report.englishName || 'N/A'}</td>
                    <td>{report.level}</td>
                    <td>{report.className}</td>
                    <td>
                      <span className={`status-badge ${report.status === '!!!' ? 'urgent' : 'solved'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn view-btn"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="report-details-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setSelectedReport(null); setSolutionNote(''); }}>×</button>
            <h3>Report Details</h3>
            
            <div className="report-info">
              <div className="info-row">
                <strong>Student:</strong> {selectedReport.studentName} {selectedReport.englishName ? `(${selectedReport.englishName})` : ''}
              </div>
              <div className="info-row">
                <strong>Level:</strong> {selectedReport.level}
              </div>
              <div className="info-row">
                <strong>Class:</strong> {selectedReport.className}
              </div>
              <div className="info-row">
                <strong>Reported By:</strong> {selectedReport.reportedBy}
              </div>
              <div className="info-row">
                <strong>Date:</strong> {new Date(selectedReport.reportedAt).toLocaleString()}
              </div>
              <div className="info-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedReport.status === '!!!' ? 'urgent' : 'solved'}`}>
                  {selectedReport.status}
                </span>
              </div>
            </div>
            
            <div className="problem-section">
              <h4>Problem:</h4>
              <p>{selectedReport.problem}</p>
            </div>
            
            {selectedReport.solution && (
              <div className="solution-section">
                <h4>Solution:</h4>
                <p>{selectedReport.solution}</p>
              </div>
            )}
            
            {selectedReport.status === '!!!' && (
              <div className="solution-input-section">
                <h4>Add Solution:</h4>
                <textarea 
                  className="form-textarea"
                  placeholder="Enter your solution or recommendation..."
                  value={solutionNote}
                  onChange={e => setSolutionNote(e.target.value)}
                  rows={4}
                />
                <div className="modal-actions">
                  <button 
                    className="action-btn save-btn" 
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'solved', solutionNote)}
                  >
                    Mark as Solved
                  </button>
                  <button 
                    className="action-btn cancel-btn" 
                    onClick={() => { setSelectedReport(null); setSolutionNote(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPanel;