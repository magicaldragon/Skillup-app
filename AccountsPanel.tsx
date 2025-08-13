import { useState, useEffect } from 'react';
import { usersAPI } from './services/apiService';
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
      setLoading(true);
      setError(null);
      
      console.log('🔍 DEBUG: Fetching users via API service...');
      const data = await usersAPI.getUsers();
      
      console.log('🔍 DEBUG: Users response data:', data);
      console.log('🔍 DEBUG: Data type:', typeof data);
      console.log('🔍 DEBUG: Is array:', Array.isArray(data));
      
      // Accept both array and { users: [...] }
      if (Array.isArray(data)) {
        console.log('🔍 DEBUG: Setting accounts from array, count:', data.length);
        setAccounts(data);
      } else if (data && typeof data === 'object' && 'users' in data && Array.isArray((data as any).users)) {
        console.log('🔍 DEBUG: Setting accounts from users object, count:', (data as any).users.length);
        setAccounts((data as any).users);
      } else {
        console.log('🔍 DEBUG: No valid data found, setting empty array');
        setAccounts([]);
      }
    } catch (err: any) {
      console.error('🔍 DEBUG: Error fetching accounts:', err);
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
      await usersAPI.updateUser(editingId, editForm);
      
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
      await usersAPI.deleteUser(id);
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
    
    // Only apply status filtering when "Students" role is selected
    const matchesStatus = filterRole === 'student' 
      ? (filterStatus === 'all' || account.status === filterStatus)
      : true; // Don't filter by status for non-student roles
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="accounts-panel-container">
      <h2 className="accounts-title">USER ACCOUNTS</h2>
      
      {loading ? (
        <div className="accounts-loading">Loading accounts...</div>
      ) : error ? (
        <div className="accounts-error">
          <strong>Error:</strong> {error}
          <br/>
          <button onClick={fetchAccounts} style={{ marginTop: '10px', padding: '5px 10px' }}>
            Retry
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="accounts-empty">No users found.</div>
      ) : (
        <div className="accounts-table-wrapper">
          <div className="table-container">
            <h2 className="panel-title" style={{marginBottom: '1.5rem'}}>USER ACCOUNTS</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="filters-section">
              <div className="search-box">
                <div className="search-bar-container">
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Search by name, email, or student code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-bar-button">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
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
                
                {/* Only show status filter when "Students" role is selected */}
                {filterRole === 'student' && (
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
                )}
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
                    {/* Only show status column when filtering by students */}
                    {filterRole === 'student' && <th>Status</th>}
                    {/* Only show student code column when filtering by students */}
                    {filterRole === 'student' && <th>Student Code</th>}
                    <th>Phone</th>
                    {/* Only show parent's name column when filtering by students */}
                    {filterRole === 'student' && <th>Parent's Name</th>}
                    {/* Only show parent's phone column when filtering by students */}
                    {filterRole === 'student' && <th>Parent's Phone</th>}
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
                      {/* Only show status cell when filtering by students */}
                      {filterRole === 'student' && (
                        <td>
                          {/* Only show status field for students */}
                          {account.role === 'student' ? (
                            editingId === account._id ? (
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
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      {/* Only show student code cell when filtering by students */}
                      {filterRole === 'student' && (
                        <td>
                          {/* Only show student code field for students */}
                          {account.role === 'student' ? (
                            editingId === account._id ? (
                              <input
                                type="text"
                                value={editForm.studentCode || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, studentCode: e.target.value }))}
                                className="edit-input"
                                placeholder="SU-001"
                              />
                            ) : (
                              account.studentCode || '—'
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
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
                      {/* Only show parent's name cell when filtering by students */}
                      {filterRole === 'student' && (
                        <td>
                          {/* Only show parent's name field for students */}
                          {account.role === 'student' ? (
                            editingId === account._id ? (
                              <input
                                type="text"
                                value={editForm.parentName || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, parentName: e.target.value }))}
                                className="edit-input"
                              />
                            ) : (
                              account.parentName || '—'
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      {/* Only show parent's phone cell when filtering by students */}
                      {filterRole === 'student' && (
                        <td>
                          {/* Only show parent's phone field for students */}
                          {account.role === 'student' ? (
                            editingId === account._id ? (
                              <input
                                type="tel"
                                value={editForm.parentPhone || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                                className="edit-input"
                              />
                            ) : (
                              account.parentPhone || '—'
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
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