import { useCallback, useEffect, useState } from 'react';
import { APIError, usersAPI } from './services/apiService';
import { authService } from './services/authService';
import type { UserUpdateData } from './types';
import './AccountsPanel.css';
import './ManagementTableStyles.css';

interface User {
  _id: string;
  id?: string;
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
  updatedAt?: string;
}

const AccountsPanel = () => {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('admin');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [passwordChangeId, setPasswordChangeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<
    typeof authService.getCurrentUser
  > | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Get current user for permission checks
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Permission checking functions
  const canManageUser = (targetUser: User): boolean => {
    if (!currentUser) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    // Admin can manage all users
    if (currentUserRole === 'admin') return true;

    // Teacher can manage staff and students, but not admins or other teachers
    if (currentUserRole === 'teacher') {
      return targetUserRole === 'staff' || targetUserRole === 'student';
    }

    // Staff can only manage students
    if (currentUserRole === 'staff') {
      return targetUserRole === 'student';
    }

    // Students cannot manage any users
    return false;
  };

  const canChangeRole = (targetUser: User, newRole: string): boolean => {
    if (!currentUser) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    // Admin can change any role
    if (currentUserRole === 'admin') return true;

    // Teacher can only change staff and student roles
    if (currentUserRole === 'teacher') {
      return (
        (targetUserRole === 'staff' || targetUserRole === 'student') &&
        (newRole === 'staff' || newRole === 'student')
      );
    }

    // Staff can only change student roles
    if (currentUserRole === 'staff') {
      return targetUserRole === 'student' && newRole === 'student';
    }

    return false;
  };

  const canDeleteUser = (targetUser: User): boolean => {
    if (!currentUser) return false;

    const currentUserRole = currentUser.role;
    const targetUserRole = targetUser.role;

    // Admin can delete any user
    if (currentUserRole === 'admin') return true;

    // Teacher can delete staff and students
    if (currentUserRole === 'teacher') {
      return targetUserRole === 'staff' || targetUserRole === 'student';
    }

    // Staff can only delete students
    if (currentUserRole === 'staff') {
      return targetUserRole === 'student';
    }

    return false;
  };

  const canEditUser = (targetUser: User): boolean => {
    return canManageUser(targetUser);
  };

  const canChangePassword = (targetUser: User): boolean => {
    return canManageUser(targetUser);
  };

  // Enhanced fetch accounts with better error handling
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncStatus('Fetching accounts...');

      console.log('🔍 DEBUG: Fetching users via enhanced API service...');
      const data = await usersAPI.getUsers();

      console.log('🔍 DEBUG: Users response data:', data);
      console.log('🔍 DEBUG: Data type:', typeof data);
      console.log('🔍 DEBUG: Is array:', Array.isArray(data));

      // Normalize data structure - ensure consistent ID handling
      const normalizedAccounts = Array.isArray(data) ? data : [];
      const accountsWithConsistentIds = normalizedAccounts.map((account) => ({
        ...account,
        _id: account._id || account.id || '',
        id: account.id || account._id || '',
      }));

      console.log(
        '🔍 DEBUG: Setting normalized accounts, count:',
        accountsWithConsistentIds.length
      );
      setAccounts(accountsWithConsistentIds);
      setSyncStatus('Accounts fetched successfully');
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch accounts';

      if (err instanceof APIError) {
        errorMessage = `API Error (${err.status}): ${err.message}`;
        console.error('🔍 DEBUG: API Error fetching accounts:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('🔍 DEBUG: Error fetching accounts:', err);
      } else {
        console.error('🔍 DEBUG: Unknown error fetching accounts:', err);
      }

      setError(errorMessage);
      setAccounts([]);
      setSyncStatus('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleEdit = (user: User) => {
    if (!canEditUser(user)) {
      alert('You do not have permission to edit this user.');
      return;
    }

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

  // Enhanced edit save with data synchronization
  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      setSyncStatus('Updating user...');

      const updateData: UserUpdateData = {
        id: editingId,
        ...(editForm.name && { name: editForm.name }),
        ...(editForm.email && { email: editForm.email }),
        ...(editForm.role && { role: editForm.role as 'admin' | 'teacher' | 'staff' | 'student' }),
        ...(editForm.gender && { gender: editForm.gender }),
        ...(editForm.englishName && { englishName: editForm.englishName }),
        ...(editForm.dob && { dob: editForm.dob }),
        ...(editForm.phone && { phone: editForm.phone }),
        ...(editForm.notes && { note: editForm.notes }),
        ...(editForm.status && { status: editForm.status }),
        ...(editForm.studentCode && { studentCode: editForm.studentCode }),
        ...(editForm.parentName && { parentName: editForm.parentName }),
        ...(editForm.parentPhone && { parentPhone: editForm.parentPhone }),
      };

      // Check if role change is allowed
      const targetUser = accounts.find((acc) => acc._id === editingId);
      if (!targetUser) {
        throw new Error('User not found');
      }

      if (editForm.role && !canChangeRole(targetUser, editForm.role)) {
        alert("You do not have permission to change this user's role.");
        return;
      }

      // Use enhanced API service with retry and error handling
      // This will update both Firebase Auth and Firestore
      await usersAPI.updateUser(editingId, updateData);

      // Update local state with consistent ID handling
      setAccounts((prev) =>
        prev.map((acc) =>
          acc._id === editingId
            ? {
                ...acc,
                ...editForm,
                updatedAt: new Date().toISOString(),
              }
            : acc
        )
      );

      setEditingId(null);
      setEditForm({});
      setSyncStatus('User updated successfully in both Firebase Auth and Firestore');
    } catch (err: unknown) {
      let errorMessage = 'Failed to update user';

      if (err instanceof APIError) {
        errorMessage = `API Error (${err.status}): ${err.message}`;
        console.error('Error updating user:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Error updating user:', err);
      } else {
        console.error('Unknown error updating user:', err);
      }

      setError(errorMessage);
      setSyncStatus('Failed to update user');
    }
  };

  // Enhanced remove with data synchronization
  const handleRemove = async (id: string) => {
    const userToDelete = accounts.find((acc) => acc._id === id);
    if (!userToDelete) return;

    if (!canDeleteUser(userToDelete)) {
      alert('You do not have permission to delete this user.');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setSyncStatus('Deleting user...');

      // Use enhanced API service
      await usersAPI.deleteUser(id);

      // Update local state
      setAccounts((prev) => prev.filter((acc) => acc._id !== id));
      setSyncStatus('User deleted successfully');
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete user';

      if (err instanceof APIError) {
        errorMessage = `API Error (${err.status}): ${err.message}`;
        console.error('Error deleting user:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Error deleting user:', err);
      } else {
        console.error('Unknown error deleting user:', err);
      }

      setError(errorMessage);
      setSyncStatus('Failed to delete user');
    }
  };

  // Enhanced password change with data synchronization
  const handlePasswordChange = async () => {
    if (!passwordChangeId || !newPassword.trim()) return;

    const userToChangePassword = accounts.find((acc) => acc._id === passwordChangeId);
    if (!userToChangePassword) return;

    if (!canChangePassword(userToChangePassword)) {
      alert("You do not have permission to change this user's password.");
      return;
    }

    try {
      setPasswordChanging(true);
      setSyncStatus('Changing password...');

      // Use enhanced API service
      await usersAPI.changePassword(passwordChangeId, newPassword);

      setPasswordChangeId(null);
      setNewPassword('');
      setError(null);
      setSyncStatus('Password changed successfully');

      // Show success message
      alert('Password changed successfully!');
    } catch (err: unknown) {
      let errorMessage = 'Failed to change password';

      if (err instanceof APIError) {
        errorMessage = `API Error (${err.status}): ${err.message}`;
        console.error('Error changing password:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Error changing password:', err);
      } else {
        console.error('Unknown error changing password:', err);
      }

      setError(errorMessage);
      setSyncStatus('Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  // Enhanced filtered accounts with consistent ID handling
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = account.role === filterRole;

    // Only apply status filtering when "Students" role is selected
    const matchesStatus =
      filterRole === 'student' ? filterStatus === 'all' || account.status === filterStatus : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination derived data
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const visibleAccounts = filteredAccounts.slice(startIdx, startIdx + pageSize);

  useEffect(() => {
    // Reset to first page whenever filters/search change
    setCurrentPage(1);
  }, []);

  // Clear sync status after a delay
  useEffect(() => {
    if (
      syncStatus &&
      !syncStatus.includes('Fetching') &&
      !syncStatus.includes('Updating') &&
      !syncStatus.includes('Deleting') &&
      !syncStatus.includes('Changing')
    ) {
      const timer = setTimeout(() => {
        setSyncStatus('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  return (
    <div className="management-panel">
      {loading ? (
        <div className="management-loading">
          <div className="management-spinner"></div>
          <p>Loading accounts...</p>
        </div>
      ) : error ? (
        <div className="management-error">
          <h3>Error Loading Accounts</h3>
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchAccounts}
            className="management-retry-btn"
          >
            Retry
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="empty-table">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No users found.</p>
          </div>
        </div>
      ) : (
        <div className="accounts-table-wrapper">
          <div className="table-container">
            <div className="management-header">
              <h2 className="management-title">User Accounts</h2>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="filters-section">
              <div className="search-box">
                <div className="search-bar-container" style={{ position: 'relative' }}>
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
                  title="Filter by role"
                >
                  {currentUser?.role === 'admin' && (
                    <>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="student">Student</option>
                    </>
                  )}
                  {currentUser?.role === 'teacher' && (
                    <>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="student">Student</option>
                    </>
                  )}
                  {currentUser?.role === 'staff' && (
                    <>
                      <option value="staff">Staff</option>
                      <option value="student">Student</option>
                    </>
                  )}
                  {currentUser?.role === 'student' && <option value="student">Student</option>}
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
              {/* Permissions Summary */}
              {currentUser && (
                <div className="permissions-summary">
                  <div className="summary-item">
                    <span className="summary-label">Your Role:</span>
                    <span className="summary-value">{currentUser.role}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Can Manage:</span>
                    <span className="summary-value">
                      {currentUser.role === 'admin' && 'All users (Admin, Teacher, Staff, Student)'}
                      {currentUser.role === 'teacher' && 'Staff and Students only'}
                      {currentUser.role === 'staff' && 'Students only'}
                      {currentUser.role === 'student' && 'No users (Read-only)'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Can Delete:</span>
                    <span className="summary-value">
                      {currentUser.role === 'admin' && 'All users'}
                      {currentUser.role === 'teacher' && 'Staff and Students'}
                      {currentUser.role === 'staff' && 'Students only'}
                      {currentUser.role === 'student' && 'No users'}
                    </span>
                  </div>
                </div>
              )}

              <table className="management-table">
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
                  {visibleAccounts.map((account) => (
                    <tr
                      key={account._id}
                      className={!canManageUser(account) ? 'no-permission-row' : ''}
                    >
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
                            disabled={!canChangeRole(account, editForm.role || '')}
                          >
                            {currentUser?.role === 'admin' && (
                              <>
                                <option value="admin">Admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="staff">Staff</option>
                                <option value="student">Student</option>
                              </>
                            )}
                            {currentUser?.role === 'teacher' && (
                              <>
                                <option value="staff">Staff</option>
                                <option value="student">Student</option>
                              </>
                            )}
                            {currentUser?.role === 'staff' && (
                              <option value="student">Student</option>
                            )}
                            {currentUser?.role === 'student' && (
                              <option value="student">Student</option>
                            )}
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
                            {canEditUser(account) && (
                              <button
                                type="button"
                                onClick={() => handleEdit(account)}
                                className="edit-btn"
                              >
                                Edit
                              </button>
                            )}
                            {canChangePassword(account) && (
                              <button
                                type="button"
                                onClick={() => setPasswordChangeId(account._id)}
                                className="password-btn"
                              >
                                Password
                              </button>
                            )}
                            {canDeleteUser(account) && (
                              <button
                                type="button"
                                onClick={() => handleRemove(account._id)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            )}
                            {/* Removed deactivate button as requested */}
                            {!canEditUser(account) &&
                              !canChangePassword(account) &&
                              !canDeleteUser(account) && (
                                <span className="no-permission">No permissions</span>
                              )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              <div className="pagination-container">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
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
