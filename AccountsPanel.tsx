import React, { useEffect, useState } from 'react';
import type { Student } from './types';
import { authService } from './services/authService';

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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      console.log('Fetching accounts from:', `${apiUrl}/users`);
      
      const token = authService.getToken();
      if (!token) {
        console.error('No authentication token available');
        setAccounts([]);
        return;
      }
      
      const res = await fetch(`${apiUrl}/users`, { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Fetched accounts data:', data);
      
      // Map _id to id for frontend compatibility
      const users = (data.users || []).map((u: any) => ({ ...u, id: u.id || u._id }));
      console.log('Processed users:', users);
      setAccounts(users as Student[]);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = accounts.filter(a => {
    // Role filter
    const matchesRole = !roleFilter || a.role === roleFilter;
    
    // Search filter - search across multiple fields
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      (a.name && a.name.toLowerCase().includes(searchLower)) ||
      (a.username && a.username.toLowerCase().includes(searchLower)) ||
      (a.email && a.email.toLowerCase().includes(searchLower)) ||
      (a.displayName && a.displayName.toLowerCase().includes(searchLower)) ||
      (a.phone && a.phone.toLowerCase().includes(searchLower)) ||
      (a.note && a.note.toLowerCase().includes(searchLower));
    
    return matchesRole && matchesSearch;
  });

  const handleEdit = (acc: Student) => {
    setEditing(acc);
    setEditForm({ ...acc });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEditSave = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const token = authService.getToken();
      
      await fetch(`${apiUrl}/users/${editing!.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    if (!window.confirm(`Are you sure you want to delete the account for ${acc.email}? This will remove the user from both SkillUp and Firebase Auth.`)) {
      return;
    }
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const token = authService.getToken();
      
      await fetch(`${apiUrl}/users/${acc.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
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
    <div className="content-center">
      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">Accounts Management</h2>
        <p className="text-gray-600 mb-4">Manage all registered users including students, teachers, and admins</p>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            className="p-2 border rounded flex-1 min-w-200"
            placeholder="Search by name, username, email, phone, notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="p-2 border rounded" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="records">Records (Archived)</option>
          </select>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {accounts.length} accounts
          {search && ` matching "${search}"`}
          {roleFilter && ` with role "${roleFilter}"`}
        </div>
        
        <table className="custom-table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2">Role</th>
              <th className="p-2">Username</th>
              <th className="p-2">Email</th>
              <th className="p-2">Display Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-4">
                  {accounts.length === 0 ? 'No accounts found.' : 'No accounts match your search criteria.'}
                </td>
              </tr>
            )}
            {filtered.map(acc => (
              <tr key={acc.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-semibold capitalize">
                  <span className={`px-2 py-1 rounded text-xs ${
                    acc.role === 'admin' ? 'bg-red-100 text-red-800' :
                    acc.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    acc.role === 'student' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {acc.role}
                  </span>
                </td>
                <td className="p-2 font-mono text-sm">{acc.username}</td>
                <td className="p-2">{acc.email}</td>
                <td className="p-2">{acc.displayName || acc.name}</td>
                <td className="p-2">{acc.phone || '-'}</td>
                <td className="p-2 max-w-xs truncate" title={acc.note}>
                  {acc.note || '-'}
                </td>
                <td className="p-2 flex gap-2 items-center">
                  <button 
                    className="form-btn bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors" 
                    onClick={() => handleEdit(acc)} 
                    aria-label={`Edit account for ${acc.email}`}
                  >
                    Edit
                  </button>
                  <button 
                    className="form-btn bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors" 
                    onClick={() => handleRemove(acc)} 
                    aria-label={`Delete account for ${acc.email}`}
                  >
                    Remove
                  </button>
                  <button 
                    className="form-btn bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors" 
                    onClick={() => handleResetPassword(acc)} 
                    disabled={resetting === acc.id}
                    aria-label={`Reset password for ${acc.email}`}
                  >
                    {resetting === acc.id ? 'Resetting...' : 'Reset Password'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md vivid-card">
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
                <textarea className="w-full p-2 border rounded" name="note" value={editForm.note || ''} onChange={handleEditChange} rows={3} />
              </label>
              {/* Only admin can change name */}
              {editForm.role === 'admin' && (
                <label className="block text-sm font-medium">Full Name
                  <input className="w-full p-2 border rounded" name="name" value={editForm.name || ''} onChange={handleEditChange} />
                </label>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="form-btn bg-green-600 text-white rounded hover:bg-green-700 transition-colors" onClick={handleEditSave} disabled={loading} aria-label="Save account changes">
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="form-btn bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors" onClick={() => setEditing(null)} disabled={loading} aria-label="Cancel editing account">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPanel; 