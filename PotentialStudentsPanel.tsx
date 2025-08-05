import { useState, useEffect } from 'react';
import type { Student, StudentClass } from './types';
import { deleteAccountCompletely } from './services/firebase';
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

const PotentialStudentsPanel = ({ classes, currentUser, onDataRefresh }: { classes: StudentClass[], currentUser: Student, onDataRefresh?: () => void }) => {
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
  const getDisplayName = (student: PotentialStudent) => {
    const fullName = student.englishName || student.name;
    return fullName || 'Unknown Name';
  };

  // Helper for phone number
  const getPhoneNumber = (student: PotentialStudent) => {
    return student.phone || student.parentPhone || 'No phone';
  };

  // Helper for date/time
  const getDateTime = (student: PotentialStudent) => {
    if (!student.createdAt) return 'Unknown date';
    return new Date(student.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper for notes
  const getNotes = (student: PotentialStudent) => {
    return student.notes || 'No notes';
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

  // Move to Records (when student doesn't confirm interest)
  const handleMoveToRecords = async (studentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    if (!window.confirm('Move this student to Records? This will archive their information for future reference.')) {
      return;
    }

    try {
      // First, create a record entry
      const student = potentialStudents.find(s => s._id === studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const recordData = {
        studentId: null, // Potential students don't have User records yet
        studentName: student.name,
        action: 'moved_to_records',
        category: 'administrative',
        details: {
          reason: 'Student did not confirm interest in courses',
          originalStatus: student.status,
          movedBy: currentUser.name,
          movedAt: new Date().toISOString(),
          potentialStudentId: studentId, // Store the potential student ID for reference
          email: student.email,
          phone: student.phone
        },
        performedBy: currentUser.id,
        performedByName: currentUser.name
      };

      const recordResponse = await fetch(`${API_BASE_URL}/student-records`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData),
      });

      if (!recordResponse.ok) {
        throw new Error('Failed to create record entry');
      }

      // Then delete from potential students
      const deleteResponse = await fetch(`${API_BASE_URL}/potential-students/${studentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to remove from potential students');
      }

      alert('Student moved to Records successfully');
      fetchPotentialStudents();
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Move to records error:', error);
      alert('Failed to move student to Records. Please try again.');
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
      <h2 className="potential-students-title">Potential Students</h2>
      <p className="potential-students-subtitle">Students who need evaluation - move to Waiting List or Records</p>
      {potentialStudents.length === 0 ? (
        <div className="potential-students-empty">No potential students found.</div>
      ) : (
        <>
          <div className="potential-students-actions">
            <button
              className={`potential-students-btn potential-students-btn-primary ${bulkAction === 'convert' ? 'active' : ''}`}
              onClick={() => { setBulkAction('convert'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Convert to User</button>
            <button
              className={`potential-students-btn potential-students-btn-secondary ${bulkAction === 'update_status' ? 'active' : ''}`}
              onClick={() => { setBulkAction('update_status'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Update Status</button>
            <button
              className="potential-students-btn potential-students-btn-neutral"
              onClick={selectAll}
              disabled={selectedIds.length === potentialStudents.length}
            >Select All</button>
            <button
              className="potential-students-btn potential-students-btn-neutral"
              onClick={clearAll}
              disabled={selectedIds.length === 0}
            >Clear</button>
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
                >Confirm</button>
                <button
                  className="potential-students-confirm-btn potential-students-confirm-btn-cancel"
                  onClick={() => { setBulkAction(null); setBulkStatus(''); setConfirmingBulk(false); }}
                >Cancel</button>
              </div>
            </div>
          )}
          {confirmingBulk && (
            <div className="potential-students-modal">
              <div className="potential-students-modal-content">
                <div className="potential-students-modal-title">Confirm Bulk Action</div>
                <div className="potential-students-modal-message">Are you sure to {bulkAction === 'convert' ? 'convert selected potential students to regular users' : 'update status of selected potential students'}?</div>
                <div className="potential-students-modal-buttons">
                  <button
                    className="potential-students-modal-btn potential-students-modal-btn-cancel"
                    onClick={() => setConfirmingBulk(false)}
                  >Cancel</button>
                  <button
                    className="potential-students-modal-btn potential-students-modal-btn-confirm"
                    onClick={bulkAction === 'convert' ? handleBulkConvert : handleBulkUpdateStatus}
                  >Confirm</button>
                </div>
              </div>
            </div>
          )}
          <div className="potential-students-students">
            {potentialStudents.map(student => (
              <div
                key={student._id}
                className={`potential-students-student-item ${selectedIds.includes(student._id) ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(student._id)} 
                  onChange={() => toggleSelect(student._id)} 
                  className="potential-students-checkbox" 
                />
                <div className="potential-students-student-info">
                  <img
                    src={getAvatar(student)}
                    alt="avatar"
                    className="potential-students-avatar"
                  />
                  <div className="potential-students-student-details">
                    <div className="potential-students-student-main-info">
                      <span className="potential-students-student-name">{getDisplayName(student)}</span>
                      <span className="potential-students-student-phone">📞 {getPhoneNumber(student)}</span>
                    </div>
                    <div className="potential-students-student-secondary-info">
                      <span className="potential-students-student-email">📧 {student.email}</span>
                      <span className="potential-students-student-date">📅 Added: {getDateTime(student)}</span>
                    </div>
                    <div className="potential-students-student-notes">
                      <span className="potential-students-student-notes-label">📝 Notes:</span>
                      <span className="potential-students-student-notes-text">{getNotes(student)}</span>
                    </div>
                    <span className="potential-students-student-status">Status: {student.status}</span>
                  </div>
                </div>
                <div className="potential-students-student-actions">
                  <select
                    className="potential-students-assign-select"
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
                      className="potential-students-confirm-assign-btn"
                      onClick={() => handleConfirmStatusUpdate(student._id)}
                      disabled={loadingStates[student._id]}
                    >
                      {loadingStates[student._id] ? 'Updating...' : 'Update'}
                    </button>
                  )}
                  <button
                    className="potential-students-confirm-assign-btn"
                    onClick={() => handleConvertToUser(student._id)}
                  >
                    Convert to User
                  </button>
                  <button
                    className="potential-students-confirm-assign-btn"
                    onClick={() => handleMoveToWaitingList(student._id)}
                  >
                    Move to Waiting List
                  </button>
                  <button
                    className="potential-students-confirm-assign-btn"
                    onClick={() => handleMoveToRecords(student._id)}
                  >
                    Move to Records
                  </button>
                  <button
                    className="potential-students-delete-btn"
                    onClick={() => handleDelete(student._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PotentialStudentsPanel;