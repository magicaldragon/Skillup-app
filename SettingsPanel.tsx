import React, { useState, useMemo } from 'react';
import type { Student, StudentClass } from './types';
import DiceBearAvatar from './DiceBearAvatar';
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
    dob: currentUser.dob || '',
    phone: currentUser.phone || '',
    englishName: currentUser.englishName || '',
    parentName: currentUser.parentName || '',
    parentPhone: currentUser.parentPhone || '',
    notes: currentUser.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState(currentUser.diceBearStyle || 'avataaars');
  const [avatarSeed, setAvatarSeed] = useState(currentUser.diceBearSeed || currentUser.name || currentUser.email || currentUser.id || 'User');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const currentClasses = useMemo(() => {
    if (!currentUser.classIds || !classes.length) return [];
    return classes.filter(c => {
      const classId = c._id || c.id;
      return classId && currentUser.classIds?.includes(classId);
    }).map(c => c.classCode || c.name || 'Unnamed Class');
  }, [currentUser.classIds, classes]);

  // Check if user can edit their information
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'teacher' || currentUser.role === 'staff';

  const handleRandomize = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 10));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/users/${currentUser.id}/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.avatarUrl) throw new Error(data.message || 'Upload failed');
      setAvatarUrl(data.avatarUrl);
      setSuccess('Avatar updated!');
      onDataRefresh?.();
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const res = await fetch(`${apiUrl}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skillup_token')}`,
        },
        body: JSON.stringify({ 
          dob: form.dob, 
          phone: form.phone,
          englishName: form.englishName,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          notes: form.notes,
          diceBearStyle: avatarStyle, 
          diceBearSeed: avatarSeed 
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      onDataRefresh?.();
    } catch (err: any) {
      setError('Failed to update profile: ' + (err.message || ''));
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
            {currentUser.englishName && <div className="user-english-name">{currentUser.englishName}</div>}
            {currentUser.studentCode && <div className="user-student-code">Student Code: {currentUser.studentCode}</div>}
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
              <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            )}
          </div>
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
                onChange={e => { setAvatarStyle(e.target.value); }}
                className="avatar-select"
                disabled={!!avatarUrl}
              >
                {DICEBEAR_STYLES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { handleRandomize(); }}
                className="btn-randomize"
                disabled={!!avatarUrl}
              >
                Randomize
              </button>
            </div>
            
            {/* Upload Section */}
            <div className="upload-section">
              <label className="upload-label">Upload your own avatar:</label>
              <input 
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
              <label className="form-label">English Name</label>
              <input
                type="text"
                name="englishName"
                value={form.englishName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
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
                  <label className="form-label">Parent's Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={form.parentName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Parent's Phone</label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={form.parentPhone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setEditMode(false); setError(null); setSuccess(null); }}
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