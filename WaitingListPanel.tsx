import { useState, useEffect, useRef, useCallback } from 'react';
import type { StudentClass } from './types';
import { formatDateMMDDYYYY } from './utils/stringUtils';
import './WaitingListPanel.css';
import './ManagementTableStyles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

interface User {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
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
  classes: propClasses,
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
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  // Bulk status update state
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [showBulkStatusUpdate, setShowBulkStatusUpdate] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchWaitingStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('skillup_token');
    if (!token) {
      setError('No authentication token found. Please log in again.');
      setLoading(false);
      return;
    }

    // Validate token format - support both JWT tokens (with dots) and base64 session tokens
    if (token.length < 50) {
      setError('Invalid authentication token. Please log in again.');
      setLoading(false);
      return;
    }

    const apiUrl = `${API_BASE_URL}/users?status=studying`;
    console.log('🔍 [WaitingStudents] API Call Details:', {
      url: apiUrl,
      baseUrl: API_BASE_URL,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none',
      fullToken: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'none'
    });

    try {
      // Fetch users with status 'studying'
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [WaitingStudents] Response Status:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WaitingStudents] Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Optionally clear the invalid token
          localStorage.removeItem('skillup_token');
        } else if (response.status === 403) {
          setError('Access denied. You do not have permission to view waiting list.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('✅ [WaitingStudents] Success Response:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'none'
      });
      
      if (!Array.isArray(data)) {
        console.warn('Received non-array data:', data);
        setWaitingStudents([]);
      } else {
        setWaitingStudents(data);
      }
    } catch (error) {
      console.error('💥 [WaitingStudents] Fetch Error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        apiUrl
      });
      setError(`Failed to load waiting students: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Bulk status update
  const handleBulkUpdateStatus = async () => {
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
          body: JSON.stringify({ status: bulkStatus }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update user ${id} status`);
        }
      }
      setSelectedIds([]);
      setBulkStatus('');
      setShowBulkStatusUpdate(false);
      fetchWaitingStudents();
      onDataRefresh?.();
      alert('Student status updated successfully!');
    } catch (error) {
      console.error('Bulk status update error:', error);
      alert('Failed to update student status. Please try again.');
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

  // Handle status change
  const handleStatusChange = async (studentId: string, newStatus: string) => {
    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      // Update local state
      setWaitingStudents((prev) =>
        prev.map((student) =>
          student._id === studentId ? { ...student, status: newStatus } : student
        )
      );

      // If status is 'off' or 'alumni', remove from waiting list (they go to Records tab)
      if (newStatus === 'off' || newStatus === 'alumni') {
        setWaitingStudents((prev) => prev.filter((student) => student._id !== studentId));
        alert(`Student status changed to ${newStatus}. They have been moved to the Records tab.`);
      } else if (newStatus === 'postponed') {
        alert('Student status changed to Postponed. They will remain in the waiting list.');
      } else {
        alert(`Student status changed to ${newStatus}.`);
      }

      // Refresh data if callback provided
      if (onDataRefresh) {
        onDataRefresh();
      }
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
      <div className="management-panel">
        <div className="management-loading">
          <div className="management-spinner"></div>
          <p>Loading waiting students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-panel">
        <div className="management-error">
          <h3>Error Loading Waiting Students</h3>
          <p>{error}</p>
          <button type="button" className="management-retry-btn" onClick={fetchWaitingStudents}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-panel">
      <div className="management-header">
        <h2 className="management-title">Waiting List</h2>
        <p className="management-subtitle">
          Students with "Studying" status ready for class assignment. Change status to "Postponed" to keep them here, or "Off"/"Alumni" to move them to Records.
        </p>
      </div>

      <div className="management-search">
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
                  // Search is already live, just focus the input
                  (e.target as HTMLInputElement).focus();
                }
              }}
              aria-label="Search waiting list students"
              title="Search by name, phone, or student ID"
              ref={searchInputRef}
            />
            <button 
              type="button" 
              className="search-bar-button"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Focus search input"
            >
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

      <div className="management-table-container table-container theme-green">
        <table className="management-table">
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
              <th>Student ID</th>
              <th>Name</th>
              <th>English Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-table">
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
                <td className="student-id-cell">
                  {student.studentCode ? (
                    <span className={`student-id-badge ${student.gender?.toLowerCase() || 'other'}`}>
                      {student.studentCode}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="name-cell">
                  <div className="student-name">{student.name}</div>
                </td>
                <td className="english-name-cell">
                  {student.englishName || 'N/A'}
                </td>
                <td className="gender-cell">{student.gender || 'N/A'}</td>
                <td className="dob-cell">
                  {student.dob ? formatDateMMDDYYYY(student.dob) : 'N/A'}
                </td>
                <td className="status-cell">
                  {student.status === 'studying' ? (
                    <span className="status-badge status-studying">STUDYING</span>
                  ) : (
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
                  )}
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
            <button type="button" className="close-btn" onClick={() => {
              setSelectedStudent(null);
              setIsEditing(false);
              setEditForm({});
            }}>
              ×
            </button>
            <h3>Student Details</h3>
            <div className="student-details-grid">
              <div className="detail-item">
                <strong>Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || selectedStudent.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.name}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>English Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.englishName || selectedStudent.englishName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, englishName: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.englishName || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Email:</strong>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || selectedStudent.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.email}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Phone:</strong>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || selectedStudent.phone || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.phone || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Gender:</strong>
                {isEditing ? (
                  <select
                    value={editForm.gender || selectedStudent.gender || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="edit-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <span>{selectedStudent.gender || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Date of Birth:</strong>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.dob || selectedStudent.dob || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.dob ? formatDateMMDDYYYY(selectedStudent.dob) : 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                {isEditing ? (
                  <select
                    value={editForm.status || selectedStudent.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="edit-select"
                  >
                    <option value="studying">Studying</option>
                    <option value="postponed">Postponed</option>
                    <option value="off">Off</option>
                    <option value="alumni">Alumni</option>
                  </select>
                ) : (
                  <span className={`status-badge status-${selectedStudent.status}`}>
                    {selectedStudent.status}
                  </span>
                )}
              </div>
              <div className="detail-item">
                <strong>Parent Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.parentName || selectedStudent.parentName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, parentName: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.parentName || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Parent Phone:</strong>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.parentPhone || selectedStudent.parentPhone || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.parentPhone || 'N/A'}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Student ID:</strong>
                <span className="locked-field">{selectedStudent.studentCode || 'N/A'} (Locked)</span>
              </div>
              <div className="detail-item full-width">
                <strong>Notes:</strong>
                {isEditing ? (
                  <textarea
                    value={editForm.notes || selectedStudent.notes || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="edit-textarea"
                    rows={3}
                  />
                ) : (
                  <span>{selectedStudent.notes || 'No notes'}</span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('skillup_token');
                        const response = await fetch(`${API_BASE_URL}/users/${selectedStudent._id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(editForm),
                        });
                        
                        if (response.ok) {
                          await response.json();
                          setWaitingStudents(prev => 
                            prev.map(student => 
                              student._id === selectedStudent._id ? { ...student, ...editForm } : student
                            )
                          );
                          setSelectedStudent({ ...selectedStudent, ...editForm });
                          alert('Student details updated successfully!');
                          setIsEditing(false);
                          setEditForm({});
                          onDataRefresh?.();
                        } else {
                          alert('Failed to update student details.');
                        }
                      } catch (error) {
                        console.error('Error updating student:', error);
                        alert('Error updating student details.');
                      }
                    }}
                    className="btn-save"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({});
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm(selectedStudent);
                  }}
                  className="btn-edit"
                >
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contextual Action Bar - Only shows when students are selected */}
      {selectedIds.length > 0 && (
        <div className="contextual-action-bar">
          <div className="selection-info">
            <span className="selection-count">{selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="action-buttons-group">
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setShowBulkAssign(true)}
              title="Assign selected students to a class"
            >
              Bulk Assign to Class
            </button>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setShowBulkStatusUpdate(true)}
              title={selectedIds.length < 2 ? "Select at least 2 students with the same status to update" : "Update status of selected students"}
              disabled={selectedIds.length < 2}
            >
              Update Status
            </button>
            <button
              type="button"
              className="btn-neutral-action"
              onClick={clearAll}
              title="Clear current selection"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {showBulkAssign && (
        <div className="waiting-list-bulk-section">
          <select
            className="waiting-list-select"
            value={bulkClassId}
            onChange={(e) => setBulkClassId(e.target.value)}
          >
            <option value="">Select class...</option>
            {propClasses.map((cls) => (
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

      {showBulkStatusUpdate && (
        <div className="waiting-list-bulk-section">
          <select
            className="waiting-list-select"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Select status...</option>
            <option value="studying">Studying</option>
            <option value="postponed">Postponed</option>
            <option value="off">Off</option>
            <option value="alumni">Alumni</option>
          </select>
          <div className="waiting-list-confirm-buttons">
            <button
              type="button"
              className="waiting-list-confirm-btn waiting-list-confirm-btn-success"
              onClick={handleBulkUpdateStatus}
              disabled={!bulkStatus}
            >
              Confirm Status Update
            </button>
            <button
              type="button"
              className="waiting-list-confirm-btn waiting-list-confirm-btn-cancel"
              onClick={() => {
                setShowBulkStatusUpdate(false);
                setBulkStatus('');
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
