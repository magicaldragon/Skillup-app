import React, { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import { deleteAccountCompletely } from './services/firebase';
import './WaitingListPanel.css';

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

const WaitingListPanel = ({ classes, currentUser, onDataRefresh }: { classes: StudentClass[], currentUser: Student, onDataRefresh?: () => void }) => {
  const [potentialStudents, setPotentialStudents] = useState<PotentialStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'convert' | 'update_status' | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [confirmingBulk, setConfirmingBulk] = useState(false);

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

  // Helper for avatar by gender
  const getAvatar = (student: PotentialStudent) => {
    if (student.gender === 'male') return '/avatar-male.png';
    if (student.gender === 'female') return '/avatar-female.png';
    return '/anon-avatar.png';
  };

  // Helper for display name
  const getDisplayName = (student: PotentialStudent) => student.englishName || student.name;

  // Helper for date/time
  const getDateTime = (student: PotentialStudent) => student.createdAt ? new Date(student.createdAt).toLocaleString() : '';

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

  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<{ [studentId: string]: string }>({});
  const [loadingStates, setLoadingStates] = useState<{ [studentId: string]: boolean }>({});

  const handleStatusChange = (studentId: string, status: string) => {
    setPendingStatusUpdates(prev => ({ ...prev, [studentId]: status }));
  };

  const handleConfirmStatusUpdate = async (studentId: string) => {
    const status = pendingStatusUpdates[studentId];
    if (!status) return;
    
    setLoadingStates(prev => ({ ...prev, [studentId]: true }));
    const token = localStorage.getItem('authToken');
    
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
      
      setLoadingStates(prev => ({ ...prev, [studentId]: false }));
      setPendingStatusUpdates(prev => { const copy = { ...prev }; delete copy[studentId]; return copy; });
      fetchPotentialStudents();
    } catch (error) {
      console.error('Update status error:', error);
      setLoadingStates(prev => ({ ...prev, [studentId]: false }));
      alert('Failed to update potential student status. Please try again.');
    }
  };

  const handleConvertToUser = async (studentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}/convert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to convert potential student to user');
      }
      
      alert('Potential student converted to regular user successfully!');
      fetchPotentialStudents();
      onDataRefresh?.();
    } catch (error) {
      console.error('Convert to user error:', error);
      alert('Failed to convert potential student to user. Please try again.');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this potential student? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete potential student');
      }
      
      alert('Potential student deleted successfully!');
      fetchPotentialStudents();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete potential student. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-loading">
          <div className="waiting-list-spinner"></div>
          <p>Loading potential students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-error">
          <h3>Error Loading Potential Students</h3>
          <p>{error}</p>
          <button 
            className="waiting-list-retry-btn"
            onClick={fetchPotentialStudents}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-list-panel">
      <h2 className="waiting-list-title">Potential Students</h2>
      {potentialStudents.length === 0 ? (
        <div className="waiting-list-empty">No potential students found.</div>
      ) : (
        <>
          <div className="waiting-list-actions">
            <button
              className={`waiting-list-btn waiting-list-btn-primary ${bulkAction === 'convert' ? 'active' : ''}`}
              onClick={() => { setBulkAction('convert'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Convert to User</button>
            <button
              className={`waiting-list-btn waiting-list-btn-secondary ${bulkAction === 'update_status' ? 'active' : ''}`}
              onClick={() => { setBulkAction('update_status'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Update Status</button>
            <button
              className="waiting-list-btn waiting-list-btn-neutral"
              onClick={selectAll}
              disabled={selectedIds.length === potentialStudents.length}
            >Select All</button>
            <button
              className="waiting-list-btn waiting-list-btn-neutral"
              onClick={clearAll}
              disabled={selectedIds.length === 0}
            >Clear</button>
          </div>
          {bulkAction && (
            <div className="waiting-list-bulk-section">
              {bulkAction === 'update_status' && (
                <select
                  className="waiting-list-select"
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
              <div className="waiting-list-confirm-buttons">
                <button
                  className="waiting-list-confirm-btn waiting-list-confirm-btn-success"
                  onClick={() => { setConfirmingBulk(true); }}
                  disabled={bulkAction === 'update_status' && !bulkStatus}
                >Confirm</button>
                <button
                  className="waiting-list-confirm-btn waiting-list-confirm-btn-cancel"
                  onClick={() => { setBulkAction(null); setBulkStatus(''); setConfirmingBulk(false); }}
                >Cancel</button>
              </div>
            </div>
          )}
          {confirmingBulk && (
            <div className="waiting-list-modal">
              <div className="waiting-list-modal-content">
                <div className="waiting-list-modal-title">Confirm Bulk Action</div>
                <div className="waiting-list-modal-message">Are you sure to {bulkAction === 'convert' ? 'convert selected potential students to regular users' : 'update status of selected potential students'}?</div>
                <div className="waiting-list-modal-buttons">
                  <button
                    className="waiting-list-modal-btn waiting-list-modal-btn-cancel"
                    onClick={() => setConfirmingBulk(false)}
                  >Cancel</button>
                  <button
                    className="waiting-list-modal-btn waiting-list-modal-btn-confirm"
                    onClick={bulkAction === 'convert' ? handleBulkConvert : handleBulkUpdateStatus}
                  >Confirm</button>
                </div>
              </div>
            </div>
          )}
          <div className="waiting-list-students">
            {potentialStudents.map(student => (
              <div
                key={student._id}
                className={`waiting-list-student-item ${selectedIds.includes(student._id) ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(student._id)} 
                  onChange={() => toggleSelect(student._id)} 
                  className="waiting-list-checkbox" 
                />
                <div className="waiting-list-student-info">
                  <img
                    src={getAvatar(student)}
                    alt="avatar"
                    className="waiting-list-avatar"
                  />
                  <div className="waiting-list-student-details">
                    <span className="waiting-list-student-name">{getDisplayName(student)}</span>
                    <span className="waiting-list-student-date">{getDateTime(student)}</span>
                    <span className="waiting-list-student-email">{student.email}</span>
                    <span className="waiting-list-student-status">Status: {student.status}</span>
                  </div>
                </div>
                <select
                  className="waiting-list-assign-select"
                  value={pendingStatusUpdates[student._id] || student.status}
                  onChange={e => handleStatusChange(student._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="enrolled">Enrolled</option>
                </select>
                {pendingStatusUpdates[student._id] && pendingStatusUpdates[student._id] !== student.status && (
                  <button
                    className="waiting-list-confirm-assign-btn"
                    onClick={() => handleConfirmStatusUpdate(student._id)}
                    disabled={loadingStates[student._id]}
                  >
                    {loadingStates[student._id] ? 'Updating...' : 'Update'}
                  </button>
                )}
                <button
                  className="waiting-list-confirm-assign-btn"
                  onClick={() => handleConvertToUser(student._id)}
                >
                  Convert to User
                </button>
                <button
                  className="waiting-list-delete-btn"
                  onClick={() => handleDelete(student._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WaitingListPanel; 