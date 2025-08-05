import React, { useState, useMemo } from 'react';
import type { Student, StudentClass } from './types';
import DiceBearAvatar from './DiceBearAvatar';

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
    return classes.filter(c => currentUser.classIds?.includes(c.id)).map(c => c.name);
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
          <div className="relative mb-4">
            <div className="flex justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-32 h-32 rounded-full border-4 border-green-400 shadow-xl object-cover bg-slate-100" />
              ) : (
                <DiceBearAvatar seed={avatarSeed} size={128} style={avatarStyle} />
              )}
            </div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-green-700 text-white text-xs font-bold shadow-md border-2 border-white uppercase tracking-widest" style={{ letterSpacing: 2 }}>{currentUser.role}</span>
          </div>
          <div className="text-3xl font-extrabold tracking-wide text-green-900 drop-shadow mb-1">{currentUser.name}</div>
          {currentUser.englishName && <div className="text-lg text-green-700 font-semibold mb-4">{currentUser.englishName}</div>}
          {currentUser.studentCode && <div className="text-lg text-blue-600 font-semibold mb-4">Student Code: {currentUser.studentCode}</div>}
          
          <div className="flex flex-col gap-2 w-full max-w-md mt-4">
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
          <div className="flex gap-4 mt-6 justify-center">
            {canEdit && (
              <button className="px-6 py-2 bg-[#307637] text-white rounded-xl shadow-lg hover:bg-[#245929] text-lg font-bold tracking-wide" onClick={() => setEditMode(true)}>Edit</button>
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
          <div className="text-center text-red-600 font-semibold">
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
        <form onSubmit={handleSave} className="flex flex-col items-center gap-4">
          <div className="relative mb-4">
            <div className="flex justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-32 h-32 rounded-full border-4 border-green-400 shadow-xl object-cover bg-slate-100" />
              ) : (
                <DiceBearAvatar seed={avatarSeed} size={128} style={avatarStyle} />
              )}
            </div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-green-700 text-white text-xs font-bold shadow-md border-2 border-white uppercase tracking-widest" style={{ letterSpacing: 2 }}>{currentUser.role}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <select
              value={avatarStyle}
              onChange={e => { setAvatarStyle(e.target.value); }}
              className="border rounded px-2 py-1 text-sm"
              disabled={!!avatarUrl}
            >
              {DICEBEAR_STYLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { handleRandomize(); }}
              className="px-2 py-1 bg-green-200 rounded text-xs font-semibold hover:bg-green-300"
              disabled={!!avatarUrl}
            >
              Randomize
            </button>
          </div>
          <div className="mt-2 flex flex-col items-center">
            <label className="block text-xs font-medium mb-1">Upload your own avatar:</label>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} className="text-xs" />
            {avatarUploading && <span className="text-xs text-slate-500">Uploading...</span>}
            {avatarError && <span className="text-xs text-red-600">{avatarError}</span>}
          </div>
          <div className="flex flex-col gap-2 w-full max-w-md mt-4">
            <label className="text-base font-medium text-slate-700">English Name</label>
            <input
              type="text"
              name="englishName"
              value={form.englishName}
              onChange={handleChange}
              className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
            />
            <label className="text-base font-medium text-slate-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
            />
            <label className="text-base font-medium text-slate-700">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
            />
            {currentUser.role === 'student' && (
              <>
                <label className="text-base font-medium text-slate-700">Parent's Name</label>
                <input
                  type="text"
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
                />
                <label className="text-base font-medium text-slate-700">Parent's Phone</label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={form.parentPhone}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
                />
                <label className="text-base font-medium text-slate-700">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
                  rows={3}
                />
              </>
            )}
          </div>
          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
          {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              type="submit"
              className="px-6 py-2 bg-[#307637] text-white rounded-xl shadow-lg hover:bg-[#245929] text-lg font-bold tracking-wide"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl shadow hover:bg-gray-300 text-lg font-bold tracking-wide"
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