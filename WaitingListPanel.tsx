import { useCallback, useEffect, useState } from 'react';
import type { StudentClass } from './types';
import './WaitingListPanel.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface User {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  studentCode?: string;
  classIds?: string[];
  createdAt: string;
  updatedAt: string;
}

const WaitingListPanel = ({
  classes,
  onDataRefresh,
}: {
  classes: StudentClass[];
  onDataRefresh?: () => void;
}) => {
  const [waitingStudents, setWaitingStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const fetchWaitingStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('skillup_token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      // Fetch users with status 'studying'
      const response = await fetch(`${API_BASE_URL}/users?status=studying`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch waiting students');
      }

      const data = await response.json();
      setWaitingStudents(data || []);
    } catch (error) {
      console.error('Fetch waiting students error:', error);
      setError('Failed to load waiting students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitingStudents();
  }, [fetchWaitingStudents]);

  // Individual select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Select all
  const selectAll = () => setSelectedIds(waitingStudents.map((s) => s._id));
  const clearAll = () => setSelectedIds([]);

  // Bulk assign to class
  const handleBulkAssignToClass = async () => {
    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            classIds: [bulkClassId],
            status: 'active', // Change status to active when assigned to class
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to assign user ${id} to class`);
        }
      }
      setSelectedIds([]);
      setBulkClassId('');
      setShowBulkAssign(false);
      fetchWaitingStudents();
      onDataRefresh?.();
      alert('Students assigned to class successfully!');
    } catch (error) {
      console.error('Bulk assign error:', error);
      alert('Failed to assign students to class. Please try again.');
    }
  };

  // Individual assign to class
  const handleAssignToClass = async (studentId: string, classId: string) => {
    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classIds: [classId],
          status: 'active', // Change status to active when assigned to class
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign student to class');
      }

      alert('Student assigned to class successfully!');
      fetchWaitingStudents();
      onDataRefresh?.();
    } catch (error) {
      console.error('Assign to class error:', error);
      alert('Failed to assign student to class. Please try again.');
    }
  };

  // Update status (for moving to Records)
  const handleStatusChange = async (studentId: string, newStatus: string) => {
    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      fetchWaitingStudents();
      onDataRefresh?.();
    } catch (error) {
      console.error('Status change error:', error);
      alert('Failed to update student status. Please try again.');
    }
  };

  // Filtered students
  const filteredStudents = waitingStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.englishName?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-loading">
          <div className="waiting-list-spinner"></div>
          <p>Loading waiting students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-error">
          <h3>Error Loading Waiting Students</h3>
          <p>{error}</p>
          <button type="button" className="waiting-list-retry-btn" onClick={fetchWaitingStudents}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-list-panel">
      <div className="waiting-list-header">
        <h2 className="waiting-list-title">Waiting List</h2>
        <p className="waiting-list-subtitle">Students ready for class assignment</p>
      </div>

      <div className="waiting-list-search">
        <div className="search-controls">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search by name, phone, or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).focus();
                }
              }}
            />
            <button type="button" className="search-bar-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Search">
                <title>Search</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="waiting-list-table-container">
        <table className="waiting-list-table">
          <thead>
            <tr>
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === waitingStudents.length && waitingStudents.length > 0
                  }
                  onChange={selectedIds.length === waitingStudents.length ? clearAll : selectAll}
                  className="select-all-checkbox"
                />
              </th>
              <th>Name</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <p>No students in waiting list.</p>
                    <p className="empty-subtitle">
                      Students with "studying" status will appear here for class assignment.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredStudents.map((student) => (
              <tr
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                className="clickable-row"
              >
                <td 
                  onClick={(e) => e.stopPropagation()} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="checkbox-cell"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student._id)}
                    onChange={() => toggleSelect(student._id)}
                    className="row-checkbox"
                  />
                </td>
                <td className="name-cell">
                  <div className="student-name">{student.name}</div>
                  {student.englishName && (
                    <div className="english-name">({student.englishName})</div>
                  )}
                </td>
                <td className="gender-cell">{student.gender || 'N/A'}</td>
                <td className="status-cell">
                  <select
                    value={student.status}
                    onChange={(e) => handleStatusChange(student._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="status-select"
                  >
                    <option value="studying">Studying</option>
                    <option value="postponed">Postponed</option>
                    <option value="off">Off</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </td>
                <td className="assign-cell">
                  <select
                    onChange={(e) => handleAssignToClass(student._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="assign-select"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal/Panel */}
      {selectedStudent && (
        <div className="student-details-modal">
          <div className="modal-content">
            <button type="button" className="close-btn" onClick={() => setSelectedStudent(null)}>
              ×
            </button>
            <h3>Student Details</h3>
            <div className="student-details-grid">
              <div className="detail-item">
                <strong>Name:</strong>
                <span>{selectedStudent.name}</span>
              </div>
              <div className="detail-item">
                <strong>English Name:</strong>
                <span>{selectedStudent.englishName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Email:</strong>
                <span>{selectedStudent.email}</span>
              </div>
              <div className="detail-item">
                <strong>Phone:</strong>
                <span>{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Gender:</strong>
                <span>{selectedStudent.gender || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className={`status-badge status-${selectedStudent.status}`}>
                  {selectedStudent.status}
                </span>
              </div>
              <div className="detail-item">
                <strong>Parent Name:</strong>
                <span>{selectedStudent.parentName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Parent Phone:</strong>
                <span>{selectedStudent.parentPhone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Student Code:</strong>
                <span>{selectedStudent.studentCode || 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <strong>Notes:</strong>
                <span>{selectedStudent.notes || 'No notes'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="waiting-list-actions">
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="waiting-list-btn waiting-list-btn-secondary"
            onClick={() => setShowBulkAssign(true)}
          >
            Bulk Assign to Class
          </button>
        )}
        <button
          type="button"
          className="waiting-list-btn waiting-list-btn-neutral"
          onClick={selectAll}
          disabled={selectedIds.length === waitingStudents.length}
        >
          Select All
        </button>
        <button
          type="button"
          className="waiting-list-btn waiting-list-btn-neutral"
          onClick={clearAll}
          disabled={selectedIds.length === 0}
        >
          Clear
        </button>
      </div>

      {showBulkAssign && (
        <div className="waiting-list-bulk-section">
          <select
            className="waiting-list-select"
            value={bulkClassId}
            onChange={(e) => setBulkClassId(e.target.value)}
          >
            <option value="">Select class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <div className="waiting-list-confirm-buttons">
            <button
              type="button"
              className="waiting-list-confirm-btn waiting-list-confirm-btn-success"
              onClick={handleBulkAssignToClass}
              disabled={!bulkClassId}
            >
              Confirm Assignment
            </button>
            <button
              type="button"
              className="waiting-list-confirm-btn waiting-list-confirm-btn-cancel"
              onClick={() => {
                setShowBulkAssign(false);
                setBulkClassId('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingListPanel;
