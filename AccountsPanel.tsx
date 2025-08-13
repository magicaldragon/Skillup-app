import { useCallback, useEffect, useState } from 'react';
import { usersAPI } from './services/apiService';
import { UserUpdateData } from './types';
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
  const [passwordChangeId, setPasswordChangeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  const fetchAccounts = useCallback(async () => {
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
      } else if (
        data &&
        typeof data === 'object' &&
        'users' in data &&
        Array.isArray((data as { users: User[] }).users)
      ) {
        console.log(
          '🔍 DEBUG: Setting accounts from users object, count:',
          (data as { users: User[] }).users.length
        );
        setAccounts((data as { users: User[] }).users);
      } else {
        console.log('🔍 DEBUG: No valid data found, setting empty array');
        setAccounts([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts';
      console.error('🔍 DEBUG: Error fetching accounts:', err);
      setError(errorMessage);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
      studentCode: user.studentCode,
    });
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      const updateData: UserUpdateData = {
        id: editingId,
        ...(editForm.name && { name: editForm.name }),
        ...(editForm.email && { email: editForm.email }),
        ...(editForm.role && { role: editForm.role as 'admin' | 'teacher' | 'student' }),
        ...(editForm.gender && { gender: editForm.gender }),
        ...(editForm.englishName && { englishName: editForm.englishName }),
        ...(editForm.dob && { dob: editForm.dob }),
        ...(editForm.phone && { phone: editForm.phone }),
        ...(editForm.notes && { note: editForm.notes }),
        ...(editForm.status && { status: editForm.status }),
      };
      await usersAPI.updateUser(editingId, updateData);

      setAccounts((prev) =>
        prev.map((acc) => (acc._id === editingId ? { ...acc, ...editForm } : acc))
      );
      setEditingId(null);
      setEditForm({});
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      console.error('Error updating user:', err);
      setError(errorMessage);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersAPI.deleteUser(id);
      setAccounts((prev) => prev.filter((acc) => acc._id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      console.error('Error deleting user:', err);
      setError(errorMessage);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordChangeId || !newPassword.trim()) return;

    try {
      setPasswordChanging(true);
      await usersAPI.changePassword(passwordChangeId, newPassword);

      setPasswordChangeId(null);
      setNewPassword('');
      setError(null);
      // Show success message
      alert('Password changed successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      console.error('Error changing password:', err);
      setError(errorMessage);
    } finally {
      setPasswordChanging(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || account.role === filterRole;

    // Only apply status filtering when "Students" role is selected
    const matchesStatus =
      filterRole === 'student' ? filterStatus === 'all' || account.status === filterStatus : true; // Don't filter by status for non-student roles

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
          <br />
          <button
            type="button"
            onClick={fetchAccounts}
            style={{ marginTop: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="accounts-empty">No users found.</div>
      ) : (
        <div className="accounts-table-wrapper">
          <div className="table-container">
            <h2 className="panel-title" style={{ marginBottom: '1.5rem' }}>
              USER ACCOUNTS
            </h2>

            {error && <div className="error-message">{error}</div>}

            <div className="filters-section">
              <div className="search-box">
                <div className="search-bar-container">
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Search by name, email, or student code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search accounts"
                    title="Search by name, email, or student code"
                  />
                  <button type="button" className="search-bar-button">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Search">
                      <title>Search</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
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
                  {filteredAccounts.map((account) => (
                    <tr key={account._id}>
                      <td>
                        {editingId === account._id ? (
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, name: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, englishName: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, email: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, role: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, gender: e.target.value }))
                            }
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
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, status: e.target.value }))
                                }
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
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, studentCode: e.target.value }))
                                }
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
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
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
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, parentName: e.target.value }))
                                }
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
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, parentPhone: e.target.value }))
                                }
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
                            <button type="button" onClick={handleEditSave} className="save-btn">
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              type="button"
                              onClick={() => handleEdit(account)}
                              className="edit-btn"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setPasswordChangeId(account._id)}
                              className="password-btn"
                            >
                              Password
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(account._id)}
                              className="delete-btn"
                            >
                              Delete
                            </button>
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

      {/* Password Change Modal */}
      {passwordChangeId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordChanging || !newPassword.trim()}
                className="save-btn"
              >
                {passwordChanging ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordChangeId(null);
                  setNewPassword('');
                }}
                className="cancel-btn"
              >
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
