import type React from 'react';
import { useMemo, useState } from 'react';
import DiceBearAvatar from './DiceBearAvatar';
import type { Student, StudentClass } from './types';
import './SettingsPanel.css';

const DICEBEAR_STYLES = [
  { label: 'Cartoon', value: 'avataaars' },
  { label: 'Initials', value: 'initials' },
  { label: 'Bottts', value: 'bottts' },
  { label: 'Identicon', value: 'identicon' },
  { label: 'Pixel Art', value: 'pixel-art' },
  { label: 'Fun Emoji', value: 'fun-emoji' },
];

type SettingsPanelProps = {
  currentUser: Student;
  classes: StudentClass[];
  onDataRefresh?: () => void;
};

const SettingsPanel = ({ currentUser, classes, onDataRefresh }: SettingsPanelProps) => {
  const [form, setForm] = useState({
    name: currentUser.name || '',
    englishName: currentUser.englishName || '',
    username: currentUser.username || '',
    email: currentUser.email || '',
    gender: currentUser.gender || '',
    dob: currentUser.dob || '',
    phone: currentUser.phone || '',
    parentName: currentUser.parentName || '',
    parentPhone: currentUser.parentPhone || '',
    notes: currentUser.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState(currentUser.diceBearStyle || 'avataaars');
  const [avatarSeed, setAvatarSeed] = useState(
    currentUser.diceBearSeed || currentUser.name || currentUser.email || currentUser.id || 'User'
  );
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const currentClasses = useMemo(() => {
    if (!currentUser.classIds || !classes.length) return [];
    return classes
      .filter((c) => {
        const classId = c._id || c.id;
        return classId && currentUser.classIds?.includes(classId);
      })
      .map((c) => c.classCode || c.name || 'Unnamed Class');
  }, [currentUser.classIds, classes]);

  // Check if user can edit their information - allow all users to edit their own profile
  const canEdit = true; // Allow all users to edit their own information

  const handleRandomize = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 10));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    
    try {
      // For now, we'll create a data URL for the file
      // In a full implementation, this would upload to Firebase Storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        try {
          const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
          const res = await fetch(`${apiUrl}/users/${currentUser.id || currentUser._id}/avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('skillup_token')}`,
            },
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });
          
          const data = await res.json();
          if (!res.ok || !data.avatarUrl) throw new Error(data.message || 'Upload failed');
          
          setAvatarUrl(data.avatarUrl);
          setSuccess('Avatar updated!');
          
          // Trigger data refresh to update the sidebar avatar
          onDataRefresh?.();
          
          // Force a page reload to ensure all components update
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (err: unknown) {
          setAvatarError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
          setAvatarUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to process file');
      setAvatarUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiUrl}/users/${currentUser.id || currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('skillup_token')}`,
        },
        body: JSON.stringify({
          name: form.name,
          englishName: form.englishName,
          gender: form.gender,
          dob: form.dob,
          phone: form.phone,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          notes: form.notes,
          diceBearStyle: avatarStyle,
          diceBearSeed: avatarSeed,
        }),
      });
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Update failed:', res.status, errorData);
        throw new Error(`Failed to update user: ${res.status} - ${errorData}`);
      }

      const result = await res.json();
      console.log('Update successful:', result);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      
      // Trigger data refresh to update the sidebar avatar
      onDataRefresh?.();
      
      // Force a page reload to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      console.error('Update error:', err);
      setError(`Failed to update profile: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setLoading(false);
    }
  };

  // --- ID Card Display Mode ---
  if (!editMode) {
    return (
      <div className="settings-panel-wrapper">
        <div className="settings-id-card">
          <h2>User Profile</h2>

          {/* Avatar and badge */}
          <div className="avatar-section">
            <div className="avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="avatar-image" />
              ) : (
                <DiceBearAvatar seed={avatarSeed} size={128} style={avatarStyle} />
              )}
              <span className="role-badge">{currentUser.role}</span>
            </div>
          </div>

          {/* User Name Section */}
          <div className="user-name-section">
            <div className="user-name">{currentUser.name}</div>
            {currentUser.englishName && (
              <div className="user-english-name">{currentUser.englishName}</div>
            )}
            {!currentUser.englishName && (
              <div className="user-english-name">{currentUser.name}</div>
            )}
            {currentUser.studentCode && (
              <div className="user-student-code">Student Code: {currentUser.studentCode}</div>
            )}
          </div>

          {/* Information Grid */}
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{currentUser.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Gender:</span>
              <span className="info-value">{currentUser.gender || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{form.phone || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth:</span>
              <span className="info-value">{form.dob || '—'}</span>
            </div>
            {currentUser.role === 'student' && (
              <>
                <div className="info-row">
                  <span className="info-label">Parent's Name:</span>
                  <span className="info-value">{form.parentName || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Parent's Phone:</span>
                  <span className="info-value">{form.parentPhone || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{currentUser.status || '—'}</span>
                </div>
              </>
            )}
            {currentClasses.length > 0 && (
              <div className="info-row">
                <span className="info-label">Current Classes:</span>
                <span className="info-value">{currentClasses.join(', ')}</span>
              </div>
            )}
            {form.notes && (
              <div className="info-row">
                <span className="info-label">Notes:</span>
                <span className="info-value">{form.notes}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {canEdit && (
              <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {/* Debug Info (only show in development) */}
          {import.meta.env.DEV && (
            <div
              className="debug-info"
              style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px',
                fontSize: '12px',
              }}
            >
              <h4>Debug Info:</h4>
              <p>
                <strong>User ID:</strong> {currentUser.id || currentUser._id}
              </p>
              <p>
                <strong>Role:</strong> {currentUser.role}
              </p>
              <p>
                <strong>Can Edit:</strong> {canEdit ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL || ''}
              </p>
            </div>
          )}

          {/* Admin Email Change Notice */}
          {currentUser.role === 'admin' && currentUser.email?.includes('@teacher.skillup') && (
            <div
              className="admin-notice"
              style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '5px',
                color: '#856404',
              }}
            >
              <h4>⚠️ Important: Admin Email Update Needed</h4>
              <p>
                Your admin account is currently using <code>@teacher.skillup</code> domain, which
                may cause role confusion. To fix this, please change your email to{' '}
                <code>admin@admin.skillup</code> in the edit form above.
              </p>
              <p>
                <strong>Current email:</strong> {currentUser.email}
              </p>
              <p>
                <strong>Recommended:</strong> admin@admin.skillup
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Edit Mode (Admin/Teacher/Staff Only) ---
  if (!canEdit) {
    return (
      <div className="settings-panel-wrapper">
        <div className="settings-id-card">
          <div className="status-message status-error">
            You don't have permission to edit your profile. Please contact an administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel-wrapper">
      <div className="settings-id-card">
        <h2>Edit Profile</h2>

        <form onSubmit={handleSave} className="edit-form">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="avatar-image" />
              ) : (
                <DiceBearAvatar seed={avatarSeed} size={128} style={avatarStyle} />
              )}
              <span className="role-badge">{currentUser.role}</span>
            </div>

            {/* Avatar Controls */}
            <div className="avatar-controls">
              <select
                value={avatarStyle}
                onChange={(e) => {
                  setAvatarStyle(e.target.value);
                }}
                className="avatar-select"
                disabled={!!avatarUrl}
              >
                {DICEBEAR_STYLES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  handleRandomize();
                }}
                className="btn-randomize"
                disabled={!!avatarUrl}
              >
                Randomize
              </button>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
              <label htmlFor="avatarUpload" className="upload-label">
                Upload your own avatar:
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                className="upload-input"
              />
              {avatarUploading && <span className="status-message status-info">Uploading...</span>}
              {avatarError && <span className="status-message status-error">{avatarError}</span>}
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Username and Email fields removed - not editable by users */}

            <div className="form-group">
              <label htmlFor="englishName" className="form-label">
                English Name
              </label>
              <input
                id="englishName"
                type="text"
                name="englishName"
                value={form.englishName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dob" className="form-label">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {currentUser.role === 'student' && (
              <>
                <div className="form-group">
                  <label htmlFor="parentName" className="form-label">
                    Parent's Name
                  </label>
                  <input
                    id="parentName"
                    type="text"
                    name="parentName"
                    value={form.parentName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="parentPhone" className="form-label">
                    Parent's Phone
                  </label>
                  <input
                    id="parentPhone"
                    type="tel"
                    name="parentPhone"
                    value={form.parentPhone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          {/* Status Messages */}
          {error && <div className="status-message status-error">{error}</div>}
          {success && <div className="status-message status-success">{success}</div>}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditMode(false);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPanel;
