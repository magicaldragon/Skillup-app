import { useState, useEffect } from 'react';
import './AccountsPanel.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  englishName?: string;
  dob?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  status?: string;
  studentCode?: string;
  createdAt: string;
}

const AccountsPanel = () => {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        setError('No authentication token found');
        setAccounts([]);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      console.log('Fetching from:', `${apiUrl}/users`);
      
      const res = await fetch(`${apiUrl}/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to fetch accounts: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('Response data:', data);
      
      // Accept both array and { users: [...] }
      if (Array.isArray(data)) {
        setAccounts(data);
      } else if (data && Array.isArray(data.users)) {
        setAccounts(data.users);
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEdit = (user: User) => {
    setEditingId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      englishName: user.englishName,
      dob: user.dob,
      phone: user.phone,
      parentName: user.parentName,
      parentPhone: user.parentPhone,
      notes: user.notes,
      status: user.status,
      studentCode: user.studentCode
    });
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/users/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      setAccounts(prev => prev.map(acc => 
        acc._id === editingId ? { ...acc, ...editForm } : acc
      ));
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      setAccounts(prev => prev.filter(acc => acc._id !== id));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.studentCode && account.studentCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || account.role === filterRole;
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="accounts-panel-container">
      <h2 className="accounts-title">Accounts</h2>
      {loading ? (
        <div className="accounts-loading">Loading accounts...</div>
      ) : error ? (
        <div className="accounts-error">{error}</div>
      ) : accounts.length === 0 ? (
        <div className="accounts-empty">No users found.</div>
      ) : (
        <div className="accounts-table-wrapper">
          <div className="table-container">
            <h2 className="panel-title">User Accounts</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="filters-section">
              <div className="search-box">
        <input
                  type="text"
                  placeholder="Search by name, email, or student code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-controls">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
          <option value="student">Student</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="potential">Potential</option>
                  <option value="contacted">Contacted</option>
                  <option value="studying">Studying</option>
                  <option value="postponed">Postponed</option>
                  <option value="off">Off</option>
                  <option value="alumni">Alumni</option>
        </select>
      </div>
            </div>

            <div className="table-wrapper">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>English Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Student Code</th>
                    <th>Phone</th>
                    <th>Parent's Name</th>
                    <th>Parent's Phone</th>
                    <th>Actions</th>
          </tr>
        </thead>
        <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account._id}>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.name
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="text"
                            value={editForm.englishName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, englishName: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.englishName || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.email
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <select
                            value={editForm.role || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="edit-select"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          account.role
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <select
                            value={editForm.gender || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="edit-select"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          account.gender || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <select
                            value={editForm.status || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                            className="edit-select"
                          >
                            <option value="potential">Potential</option>
                            <option value="contacted">Contacted</option>
                            <option value="studying">Studying</option>
                            <option value="postponed">Postponed</option>
                            <option value="off">Off</option>
                            <option value="alumni">Alumni</option>
                          </select>
                        ) : (
                          account.status || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="text"
                            value={editForm.studentCode || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, studentCode: e.target.value }))}
                            className="edit-input"
                            placeholder="SU-001"
                          />
                        ) : (
                          account.studentCode || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="tel"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.phone || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="text"
                            value={editForm.parentName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, parentName: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.parentName || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="tel"
                            value={editForm.parentPhone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                            className="edit-input"
                          />
                        ) : (
                          account.parentPhone || '—'
                        )}
                      </td>
                      <td>
                        {editingId === account._id ? (
                          <div className="action-buttons">
                            <button onClick={handleEditSave} className="save-btn">Save</button>
                            <button onClick={() => setEditingId(null)} className="cancel-btn">Cancel</button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button onClick={() => handleEdit(account)} className="edit-btn">Edit</button>
                            <button onClick={() => handleRemove(account._id)} className="delete-btn">Delete</button>
                          </div>
                        )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
            </div>

            {filteredAccounts.length === 0 && (
              <div className="no-data">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'No accounts match your search criteria.' 
                  : 'No accounts found.'}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPanel; 