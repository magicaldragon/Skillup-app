import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import './PotentialStudentsPanel.css';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

interface PotentialStudent {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  source: string;
  currentSchool?: string;
  currentGrade?: string;
  englishLevel: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  interestedPrograms?: string[];
  notes?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PotentialStudentsPanelProps {
  classes: StudentClass[];
  currentUser: Student;
  onDataRefresh?: () => void;
}

const PotentialStudentsPanel = ({ classes: _classes, currentUser: _currentUser, onDataRefresh }: PotentialStudentsPanelProps) => {
  const [potentialStudents, setPotentialStudents] = useState<PotentialStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'convert' | 'update_status' | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  // Add search state
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<PotentialStudent | null>(null);

  useEffect(() => {
    fetchPotentialStudents();
  }, []);

  const fetchPotentialStudents = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch potential students');
      }

      const data = await response.json();
      if (data.success) {
        setPotentialStudents(data.potentialStudents || []);
      } else {
        throw new Error(data.message || 'Failed to fetch potential students');
      }
    } catch (error) {
      console.error('Fetch potential students error:', error);
      setError('Failed to load potential students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk convert to regular user
  const handleBulkConvert = async () => {
    setConfirmingBulk(false);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/potential-students/${id}/convert`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to convert potential student ${id}`);
        }
      }
      setSelectedIds([]);
      setBulkAction(null);
      fetchPotentialStudents();
      onDataRefresh?.();
    } catch (error) {
      console.error('Bulk convert error:', error);
      alert('Failed to convert potential students. Please try again.');
    }
  };

  // Bulk update status
  const handleBulkUpdateStatus = async () => {
    setConfirmingBulk(false);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/potential-students/${id}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: bulkStatus }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update potential student ${id} status`);
        }
      }
      setSelectedIds([]);
      setBulkStatus('');
      setBulkAction(null);
      fetchPotentialStudents();
    } catch (error) {
      console.error('Bulk status update error:', error);
      alert('Failed to update potential students status. Please try again.');
    }
  };

  // Individual select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Select all
  const selectAll = () => setSelectedIds(potentialStudents.map(s => s._id));
  const clearAll = () => setSelectedIds([]);

  const handleStatusChange = async (studentId: string, status: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update potential student status');
      }
      
      // Refresh the list after status update
      fetchPotentialStudents();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update potential student status. Please try again.');
    }
  };

  // Move to Waiting List (when student confirms interest)
  const handleMoveToWaitingList = async (studentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'waiting_for_class' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to move student to waiting list');
      }

      alert('Student moved to Waiting List successfully');
      fetchPotentialStudents();
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Move to waiting list error:', error);
      alert('Failed to move student to Waiting List. Please try again.');
    }
  };

  // Sync existing students with PotentialStudent records
  const handleSyncExistingStudents = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/sync-potential-students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync existing students');
      }

      const result = await response.json();
      alert(`Sync completed! ${result.created} new records created, ${result.skipped} skipped.`);
      
      // Refresh the potential students list
      fetchPotentialStudents();
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync existing students. Please try again.');
    }
  };

  // Filtered students
  const filteredStudents = potentialStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

  if (loading) {
    return (
      <div className="potential-students-panel">
        <div className="potential-students-loading">
          <div className="potential-students-spinner"></div>
          <p>Loading potential students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="potential-students-panel">
        <div className="potential-students-error">
          <h3>Error Loading Potential Students</h3>
          <p>{error}</p>
          <button 
            className="potential-students-retry-btn"
            onClick={fetchPotentialStudents}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="potential-students-panel">
      <div className="potential-students-header">
        <h2 className="potential-students-title">Potential Students</h2>
        <p className="potential-students-subtitle">Students who need evaluation - move to Waiting List or Records</p>
      </div>
      
      <div className="potential-students-search">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="potential-students-table-container">
        <table className="potential-students-table">
          <thead>
            <tr>
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={selectedIds.length === potentialStudents.length && potentialStudents.length > 0}
                  onChange={selectedIds.length === potentialStudents.length ? clearAll : selectAll}
                  className="select-all-checkbox"
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No potential students found.</p>
                    <p className="empty-subtitle">
                      Students created with "potential" status will appear here.
                      {potentialStudents.length === 0 && (
                        <span> If you have existing students with "potential" status, click "Sync Existing Students" below.</span>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredStudents.map(student => (
              <tr key={student._id} onClick={() => setSelectedStudent(student)} className="clickable-row">
                <td onClick={e => e.stopPropagation()} className="checkbox-cell">
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
                <td className="email-cell">{student.email}</td>
                <td className="phone-cell">{student.phone || 'N/A'}</td>
                <td className="status-cell">
                  <span className={`status-badge status-${student.status}`}>
                    {student.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <select
                    value={student.status}
                    onChange={e => handleStatusChange(student._id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="enrolled">Enrolled</option>
                  </select>
                  <button
                    onClick={e => { e.stopPropagation(); handleMoveToWaitingList(student._id); }}
                    className="move-btn"
                  >
                    Move to Waiting List
                  </button>
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
            <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
            <h3>Student Details</h3>
            <div className="student-details-grid">
              <div className="detail-item">
                <label>Name:</label>
                <span>{selectedStudent.name}</span>
              </div>
              <div className="detail-item">
                <label>English Name:</label>
                <span>{selectedStudent.englishName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{selectedStudent.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Gender:</label>
                <span>{selectedStudent.gender || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status-badge status-${selectedStudent.status}`}>
                  {selectedStudent.status}
                </span>
              </div>
              <div className="detail-item">
                <label>Parent Name:</label>
                <span>{selectedStudent.parentName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Parent Phone:</label>
                <span>{selectedStudent.parentPhone || 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <label>Notes:</label>
                <span>{selectedStudent.notes || 'No notes'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="potential-students-actions">
        <button
          className={`potential-students-btn potential-students-btn-primary ${bulkAction === 'convert' ? 'active' : ''}`}
          onClick={() => { setBulkAction('convert'); setConfirmingBulk(false); }}
          disabled={selectedIds.length === 0}
        >
          Convert to User
        </button>
        <button
          className={`potential-students-btn potential-students-btn-secondary ${bulkAction === 'update_status' ? 'active' : ''}`}
          onClick={() => { setBulkAction('update_status'); setConfirmingBulk(false); }}
          disabled={selectedIds.length === 0}
        >
          Update Status
        </button>
        <button
          className="potential-students-btn potential-students-btn-neutral"
          onClick={selectAll}
          disabled={selectedIds.length === potentialStudents.length}
        >
          Select All
        </button>
        <button
          className="potential-students-btn potential-students-btn-neutral"
          onClick={clearAll}
          disabled={selectedIds.length === 0}
        >
          Clear
        </button>
        <button
          className="potential-students-btn potential-students-btn-neutral"
          onClick={handleSyncExistingStudents}
        >
          Sync Existing Students
        </button>
      </div>
      
      {bulkAction && (
        <div className="potential-students-bulk-section">
          {bulkAction === 'update_status' && (
            <select
              className="potential-students-select"
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
            >
              <option value="">Select status...</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="interviewed">Interviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="enrolled">Enrolled</option>
            </select>
          )}
          <div className="potential-students-confirm-buttons">
            <button
              className="potential-students-confirm-btn potential-students-confirm-btn-success"
              onClick={() => { setConfirmingBulk(true); }}
              disabled={bulkAction === 'update_status' && !bulkStatus}
            >
              Confirm
            </button>
            <button
              className="potential-students-confirm-btn potential-students-confirm-btn-cancel"
              onClick={() => { setBulkAction(null); setBulkStatus(''); setConfirmingBulk(false); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {confirmingBulk && (
        <div className="potential-students-modal">
          <div className="potential-students-modal-content">
            <div className="potential-students-modal-title">Confirm Bulk Action</div>
            <div className="potential-students-modal-message">
              Are you sure to {bulkAction === 'convert' ? 'convert selected potential students to regular users' : 'update status of selected potential students'}?
            </div>
            <div className="potential-students-modal-buttons">
              <button
                className="potential-students-modal-btn potential-students-modal-btn-cancel"
                onClick={() => setConfirmingBulk(false)}
              >
                Cancel
              </button>
              <button
                className="potential-students-modal-btn potential-students-modal-btn-confirm"
                onClick={bulkAction === 'convert' ? handleBulkConvert : handleBulkUpdateStatus}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotentialStudentsPanel;