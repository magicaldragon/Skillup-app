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
  
  console.log('🔍 [DEBUG] Waiting students after filter:', waitingStudents);
  console.log('🔍 [DEBUG] Waiting students count:', waitingStudents.length);

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
    <div className="bg-white rounded-xl shadow p-6 max-w-xl mx-auto mt-8">
      {/* Debug Panel */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-800 mb-2">🔍 DEBUG INFO</h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <div>Total students received: {students.length}</div>
          <div>Students with role 'student': {students.filter(s => s.role === 'student').length}</div>
          <div>Students without classIds: {students.filter(s => !s.classIds || s.classIds.length === 0).length}</div>
          <div>Waiting students (final): {waitingStudents.length}</div>
          <div className="mt-2">
            <strong>All students:</strong>
            <ul className="ml-4 mt-1">
              {students.map(s => (
                <li key={s.id}>
                  {s.name} (role: {s.role}, classIds: {s.classIds ? s.classIds.length : 'none'})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Waiting List</h2>
      {waitingStudents.length === 0 ? (
        <div className="text-slate-400 text-center">No students in waiting list.</div>
      ) : (
        <ul className="space-y-4">
          {waitingStudents.map(s => (
            <li key={s.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg shadow-sm">
              <img src={s.avatarUrl || '/anon-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full bg-slate-200" />
              <span className="font-semibold text-lg">{s.displayName || s.name}</span>
              <select
                className="ml-auto p-2 border rounded"
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
                  className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                  onClick={() => handleConfirm(s.id)}
                  disabled={loading[s.id]}
                >
                  {loading[s.id] ? 'Assigning...' : 'Confirm'}
                </button>
              )}
              {canDelete(s) && (
                <button
                  className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  onClick={() => setDeleteTarget(s)}
                  disabled={deleting}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
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