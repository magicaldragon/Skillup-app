import React, { useEffect, useState } from 'react';
import type { Student } from './types';

const AccountsPanel = ({ onDataRefresh }: { onDataRefresh?: () => void }) => {
  const [accounts, setAccounts] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('[DEBUG] AccountsPanel fetched users:', data.users);
      setAccounts((data.users || []) as Student[]);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = accounts.filter(a =>
    (!roleFilter || a.role === roleFilter) &&
    (
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.username && a.username.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.displayName && a.displayName.toLowerCase().includes(search.toLowerCase())) ||
      (a.phone && a.phone.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const handleEdit = (acc: Student) => {
    setEditing(acc);
    setEditForm({ ...acc });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditSave = async () => {
    setLoading(true);
    try {
      await fetch(`/api/users/${editing!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: editForm.displayName,
          dob: editForm.dob,
          phone: editForm.phone,
          avatarUrl: editForm.avatarUrl,
          note: editForm.note,
          // Only admin can change name
          ...(editForm.role === 'admin' ? { name: editForm.name } : {}),
        }),
      });
      setEditing(null);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error updating account:', error);
    } finally {
      setLoading(false);
      await fetchAccounts();
    }
  };

  const handleRemove = async (acc: Student) => {
    setLoading(true);
    try {
      await fetch(`/api/users/${acc.id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      // Optionally, also remove from Firebase Auth and VStorage
      onDataRefresh?.();
    } catch (error) {
      console.error('Error removing account:', error);
    } finally {
      setLoading(false);
      await fetchAccounts();
    }
  };

  const handleResetPassword = async (acc: Student) => {
    setResetting(acc.id);
    // Optionally, use Firebase Auth to send reset email or set password
    // For demo, just simulate
    setTimeout(() => setResetting(null), 1000);
    // In production, use: sendPasswordResetEmail(auth, acc.email)
    onDataRefresh?.();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Accounts</h2>
      <div className="flex gap-2 mb-4">
        {accounts.length === 0 && <div className="text-slate-400">No accounts found.</div>}
        <input
          className="p-2 border rounded flex-1"
          placeholder="Search by name, username, email, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="p-2 border rounded" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-2">Role</th>
            <th className="p-2">Username</th>
            <th className="p-2">Email</th>
            <th className="p-2">Display Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400">No accounts found.</td></tr>}
          {filtered.map(acc => (
            <tr key={acc.id}>
              <td className="p-2 font-semibold capitalize">{acc.role}</td>
              <td className="p-2">{acc.username}</td>
              <td className="p-2">{acc.email}</td>
              <td className="p-2">{acc.displayName}</td>
              <td className="p-2">{acc.phone}</td>
              <td className="p-2 flex gap-2 items-center">
                <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => handleEdit(acc)}>Edit</button>
                <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleRemove(acc)}>Remove</button>
                <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleResetPassword(acc)} disabled={resetting === acc.id}>
                  {resetting === acc.id ? 'Resetting...' : 'Reset Password'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Account</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Display Name
                <input className="w-full p-2 border rounded" name="displayName" value={editForm.displayName || ''} onChange={handleEditChange} />
              </label>
              <label className="block text-sm font-medium">Date of Birth
                <input className="w-full p-2 border rounded" name="dob" value={editForm.dob || ''} onChange={handleEditChange} type="date" />
              </label>
              <label className="block text-sm font-medium">Phone
                <input className="w-full p-2 border rounded" name="phone" value={editForm.phone || ''} onChange={handleEditChange} />
              </label>
              <label className="block text-sm font-medium">Avatar URL
                <input className="w-full p-2 border rounded" name="avatarUrl" value={editForm.avatarUrl || ''} onChange={handleEditChange} />
              </label>
              <label className="block text-sm font-medium">Note
                <input className="w-full p-2 border rounded" name="note" value={editForm.note || ''} onChange={handleEditChange} />
              </label>
              {/* Only admin can change name */}
              {editForm.role === 'admin' && (
                <label className="block text-sm font-medium">Full Name
                  <input className="w-full p-2 border rounded" name="name" value={editForm.name || ''} onChange={handleEditChange} />
                </label>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleEditSave} disabled={loading}>Save</button>
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setEditing(null)} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPanel; 