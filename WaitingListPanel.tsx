import React, { useState } from 'react';
import type { Student, StudentClass } from './types';
import { db } from './services/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { deleteAccountCompletely } from './services/firebase';

const WaitingListPanel = ({ students, classes, currentUser }: { students: Student[], classes: StudentClass[], currentUser: Student }) => {
  console.log('🔍 [DEBUG] WaitingListPanel received students:', students);
  console.log('🔍 [DEBUG] Students count:', students.length);
  console.log('🔍 [DEBUG] All students details:', students.map(s => ({ id: s.id, name: s.name, role: s.role, classIds: s.classIds })));
  
  // Students not assigned to any class and are students only
  const waitingStudents = students.filter(s => s.role === 'student' && (!s.classIds || s.classIds.length === 0));

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
    for (const id of selectedIds) {
      await updateDoc(doc(db, 'users', id), { classIds: [bulkClassId] });
    }
    setSelectedIds([]);
    setBulkClassId('');
    setBulkAction(null);
  };

  // Bulk move to records (simulate by setting a status, e.g., status: 'record')
  const handleBulkMoveToRecords = async () => {
    setConfirmingBulk(false);
    for (const id of selectedIds) {
      await updateDoc(doc(db, 'users', id), { status: 'record' });
    }
    setSelectedIds([]);
    setBulkAction(null);
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
    await updateDoc(doc(db, 'users', studentId), { classIds: [classId] });
    setLoading(prev => ({ ...prev, [studentId]: false }));
    setPendingAssignments(prev => { const copy = { ...prev }; delete copy[studentId]; return copy; });
    // Optionally, refresh students list in parent
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
    const res = await deleteAccountCompletely(deleteTarget.id, deleteTarget.email || '', deleteTarget.role === 'admin');
    if (!res.success) {
      setDeleteError(res.message);
      setDeleting(false);
      return;
    }
    setDeleteTarget(null);
    setDeleting(false);
    // Optionally refresh list
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Potential Students</h2>
      {waitingStudents.length === 0 ? (
        <div className="text-slate-400 text-center">No students in waiting list.</div>
      ) : (
        <>
          <div className="flex justify-center gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded font-semibold ${bulkAction === 'assign' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              onClick={() => { setBulkAction('assign'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Assign to Class</button>
            <button
              className={`px-4 py-2 rounded font-semibold ${bulkAction === 'records' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
              onClick={() => { setBulkAction('records'); setConfirmingBulk(false); }}
              disabled={selectedIds.length === 0}
            >Move to Records</button>
            <button
              className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              onClick={selectAll}
              disabled={selectedIds.length === waitingStudents.length}
            >Select All</button>
            <button
              className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              onClick={clearAll}
              disabled={selectedIds.length === 0}
            >Clear</button>
          </div>
          {bulkAction && (
            <div className="flex flex-col items-center mb-4">
              {bulkAction === 'assign' && (
                <select
                  className="p-2 border rounded mb-2"
                  value={bulkClassId}
                  onChange={e => setBulkClassId(e.target.value)}
                >
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                  onClick={() => { setConfirmingBulk(true); }}
                  disabled={bulkAction === 'assign' && !bulkClassId}
                >Confirm</button>
                <button
                  className="px-4 py-2 rounded bg-slate-300 text-slate-800 font-semibold hover:bg-slate-400"
                  onClick={() => { setBulkAction(null); setBulkClassId(''); setConfirmingBulk(false); }}
                >Cancel</button>
              </div>
            </div>
          )}
          {confirmingBulk && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
                <div className="text-lg font-bold mb-4">Confirm Bulk Action</div>
                <div className="mb-4 text-slate-600">Are you sure to {bulkAction === 'assign' ? 'assign selected students to class' : 'move selected students to records'}?</div>
                <div className="flex gap-4 justify-end">
                  <button
                    className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 font-semibold"
                    onClick={() => setConfirmingBulk(false)}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-semibold"
                    onClick={bulkAction === 'assign' ? handleBulkAssign : handleBulkMoveToRecords}
                  >Confirm</button>
                </div>
              </div>
            </div>
          )}
          <ul className="space-y-4">
            {waitingStudents.map(s => (
              <li
                key={s.id}
                className={`flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md transition-shadow hover:shadow-xl border border-green-100 ${selectedIds.includes(s.id) ? 'ring-2 ring-green-400' : ''}`}
                style={{ alignItems: 'center' }}
              >
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="accent-green-600 w-5 h-5" />
                <div className="flex items-center gap-3 min-w-[180px]">
                  <img
                    src={getAvatar(s)}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border-2 border-green-200 shadow-sm object-cover bg-slate-100"
                    style={{ boxShadow: '0 2px 8px 0 rgba(48,118,55,0.08)' }}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg text-green-900">{getDisplayName(s)}</span>
                    <span className="text-xs text-slate-500">{getDateTime(s)}</span>
                  </div>
                </div>
                <select
                  className="ml-auto p-2 border rounded-lg bg-green-50 text-green-900 font-medium shadow-sm hover:border-green-400 focus:border-green-600 transition-colors"
                  value={pendingAssignments[s.id] || ''}
                  onChange={e => handleSelectClass(s.id, e.target.value)}
                  style={{ minWidth: 140 }}
                >
                  <option value="">Assign to class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {pendingAssignments[s.id] && (
                  <button
                    className="ml-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow font-semibold hover:from-green-700 hover:to-green-600 transition-colors"
                    onClick={() => handleConfirm(s.id)}
                    disabled={loading[s.id]}
                  >
                    {loading[s.id] ? 'Assigning...' : 'Confirm'}
                  </button>
                )}
                {canDelete(s) && (
                  <button
                    className="ml-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg shadow font-semibold hover:from-red-600 hover:to-red-500 transition-colors"
                    onClick={() => setDeleteTarget(s)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <div className="text-lg font-bold mb-4">Are you sure to delete this account?</div>
            <div className="mb-4 text-slate-600">This action cannot be undone.</div>
            {deleteError && <div className="text-red-600 font-semibold mb-2">{deleteError}</div>}
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 font-semibold"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
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