import React, { useState } from 'react';
import type { Student, StudentClass } from './types';
import { deleteAccountCompletely } from './services/firebase';
import './WaitingListPanel.css';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

const WaitingListPanel = ({ students, classes, currentUser, onDataRefresh }: { students: Student[], classes: StudentClass[], currentUser: Student, onDataRefresh?: () => void }) => {
  
  // Students not assigned to any class and are students only
  const waitingStudents = students.filter(s => s.role === 'student' && (!Array.isArray(s.classIds) || s.classIds.length === 0));

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'assign' | 'records' | null>(null);
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  // Helper for avatar by gender
  const getAvatar = (s: Student) => {
    if (s.avatarUrl) return s.avatarUrl;
    if (s.gender === 'male') return '/avatar-male.png';
    if (s.gender === 'female') return '/avatar-female.png';
    return '/anon-avatar.png';
  };

  // Helper for display name
  const getDisplayName = (s: Student) => s.englishName || s.displayName || s.username || s.name;

  // Helper for date/time
  const getDateTime = (s: Student) => s.createdAt ? new Date(s.createdAt).toLocaleString() : '';

  // Bulk assign to class
  const handleBulkAssign = async () => {
    setConfirmingBulk(false);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ classIds: [bulkClassId] }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to assign student ${id} to class`);
        }
      }
      setSelectedIds([]);
      setBulkClassId('');
      setBulkAction(null);
      onDataRefresh?.();
    } catch (error) {
      console.error('Bulk assign error:', error);
      alert('Failed to assign students to class. Please try again.');
    }
  };

  // Bulk move to records (simulate by setting a status, e.g., status: 'record')
  const handleBulkMoveToRecords = async () => {
    setConfirmingBulk(false);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'record' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to move student ${id} to records`);
        }
      }
      setSelectedIds([]);
      setBulkAction(null);
      onDataRefresh?.();
    } catch (error) {
      console.error('Bulk move to records error:', error);
      alert('Failed to move students to records. Please try again.');
    }
  };

  // Individual select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Select all
  const selectAll = () => setSelectedIds(waitingStudents.map(s => s.id));
  const clearAll = () => setSelectedIds([]);

  const [pendingAssignments, setPendingAssignments] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState<{ [studentId: string]: boolean }>({});
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSelectClass = (studentId: string, classId: string) => {
    setPendingAssignments(prev => ({ ...prev, [studentId]: classId }));
  };

  const handleConfirm = async (studentId: string) => {
    const classId = pendingAssignments[studentId];
    if (!classId) return;
    
    setLoading(prev => ({ ...prev, [studentId]: true }));
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classIds: [classId] }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign student to class');
      }
      
      setLoading(prev => ({ ...prev, [studentId]: false }));
      setPendingAssignments(prev => { const copy = { ...prev }; delete copy[studentId]; return copy; });
      onDataRefresh?.();
    } catch (error) {
      console.error('Assign student error:', error);
      setLoading(prev => ({ ...prev, [studentId]: false }));
      alert('Failed to assign student to class. Please try again.');
    }
  };

  const canDelete = (s: Student) => {
    if (currentUser.id === s.id && currentUser.role === 'admin') return false;
    if (currentUser.role === 'student') return false;
    return true;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    
    try {
      const res = await deleteAccountCompletely(deleteTarget.id, deleteTarget.email || '', deleteTarget.role === 'admin');
      if (!res.success) {
        setDeleteError(res.message);
        setDeleting(false);
        return;
      }
      setDeleteTarget(null);
      setDeleting(false);
      onDataRefresh?.();
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="waiting-list-panel">
      <h2 className="waiting-list-title">Potential Students</h2>
      {waitingStudents.length === 0 ? (
        <div className="waiting-list-empty">No students in waiting list.</div>
      ) : (
        <>
          <div className="waiting-list-actions">
            <button
              className={`waiting-list-btn waiting-list-btn-primary ${bulkAction === 'assign' ? 'active' : ''}`}
              onClick={() => { setBulkAction('assign'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Assign to Class</button>
            <button
              className={`waiting-list-btn waiting-list-btn-secondary ${bulkAction === 'records' ? 'active' : ''}`}
              onClick={() => { setBulkAction('records'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Move to Records</button>
            <button
              className="waiting-list-btn waiting-list-btn-neutral"
              onClick={selectAll}
              disabled={selectedIds.length === waitingStudents.length}
            >Select All</button>
            <button
              className="waiting-list-btn waiting-list-btn-neutral"
              onClick={clearAll}
              disabled={selectedIds.length === 0}
            >Clear</button>
          </div>
          {bulkAction && (
            <div className="waiting-list-bulk-section">
              {bulkAction === 'assign' && (
                <select
                  className="waiting-list-select"
                  value={bulkClassId}
                  onChange={e => setBulkClassId(e.target.value)}
                >
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <div className="waiting-list-confirm-buttons">
                <button
                  className="waiting-list-confirm-btn waiting-list-confirm-btn-success"
                  onClick={() => { setConfirmingBulk(true); }}
                  disabled={bulkAction === 'assign' && !bulkClassId}
                >Confirm</button>
                <button
                  className="waiting-list-confirm-btn waiting-list-confirm-btn-cancel"
                  onClick={() => { setBulkAction(null); setBulkClassId(''); setConfirmingBulk(false); }}
                >Cancel</button>
              </div>
            </div>
          )}
          {confirmingBulk && (
            <div className="waiting-list-modal">
              <div className="waiting-list-modal-content">
                <div className="waiting-list-modal-title">Confirm Bulk Action</div>
                <div className="waiting-list-modal-message">Are you sure to {bulkAction === 'assign' ? 'assign selected students to class' : 'move selected students to records'}?</div>
                <div className="waiting-list-modal-buttons">
                  <button
                    className="waiting-list-modal-btn waiting-list-modal-btn-cancel"
                    onClick={() => setConfirmingBulk(false)}
                  >Cancel</button>
                  <button
                    className="waiting-list-modal-btn waiting-list-modal-btn-confirm"
                    onClick={bulkAction === 'assign' ? handleBulkAssign : handleBulkMoveToRecords}
                  >Confirm</button>
                </div>
              </div>
            </div>
          )}
          <div className="waiting-list-students">
            {waitingStudents.map(s => (
              <div
                key={s.id}
                className={`waiting-list-student-item ${selectedIds.includes(s.id) ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(s.id)} 
                  onChange={() => toggleSelect(s.id)} 
                  className="waiting-list-checkbox" 
                />
                <div className="waiting-list-student-info">
                  <img
                    src={getAvatar(s)}
                    alt="avatar"
                    className="waiting-list-avatar"
                  />
                  <div className="waiting-list-student-details">
                    <span className="waiting-list-student-name">{getDisplayName(s)}</span>
                    <span className="waiting-list-student-date">{getDateTime(s)}</span>
                  </div>
                </div>
                <select
                  className="waiting-list-assign-select"
                  value={pendingAssignments[s.id] || ''}
                  onChange={e => handleSelectClass(s.id, e.target.value)}
                >
                  <option value="">Assign to class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {pendingAssignments[s.id] && (
                  <button
                    className="waiting-list-confirm-assign-btn"
                    onClick={() => handleConfirm(s.id)}
                    disabled={loading[s.id]}
                  >
                    {loading[s.id] ? 'Assigning...' : 'Confirm'}
                  </button>
                )}
                {canDelete(s) && (
                  <button
                    className="waiting-list-delete-btn"
                    onClick={() => setDeleteTarget(s)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {deleteTarget && (
        <div className="waiting-list-modal">
          <div className="waiting-list-modal-content">
            <div className="waiting-list-modal-title">Are you sure to delete this account?</div>
            <div className="waiting-list-modal-message">This action cannot be undone.</div>
            {deleteError && <div className="waiting-list-modal-error">{deleteError}</div>}
            <div className="waiting-list-modal-buttons">
              <button
                className="waiting-list-modal-btn waiting-list-modal-btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="waiting-list-modal-btn waiting-list-modal-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >{deleting ? 'Deleting...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingListPanel; 