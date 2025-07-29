import React, { useState, useMemo } from 'react';
import type { Student, StudentClass } from './types';
import DiceBearAvatar from './DiceBearAvatar';
import { useDarkMode } from './App';

const DICEBEAR_STYLES = [
  { label: 'Cartoon', value: 'avataaars' },
  { label: 'Initials', value: 'initials' },
  { label: 'Bottts', value: 'bottts' },
  { label: 'Identicon', value: 'identicon' },
  { label: 'Pixel Art', value: 'pixel-art' },
  { label: 'Fun Emoji', value: 'fun-emoji' },
];

const SettingsPanel = ({ user, classes, onDataRefresh }: { user: Student, classes: StudentClass[], onDataRefresh?: () => void }) => {
  const [form, setForm] = useState({
    dob: user.dob || '',
    phone: user.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState(user.diceBearStyle || 'avataaars');
  const [avatarSeed, setAvatarSeed] = useState(user.diceBearSeed || user.name || user.email || user.id || 'User');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const { darkMode, toggleDarkMode } = useDarkMode();

  const currentClasses = useMemo(() => {
    if (!user.classIds || !classes.length) return [];
    return classes.filter(c => user.classIds?.includes(c.id)).map(c => c.name);
  }, [user.classIds, classes]);

  const handleRandomize = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 10));
    setEdited(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setEdited(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
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

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove avatar');
      setAvatarUrl('');
      setSuccess('Avatar removed!');
      onDataRefresh?.();
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to remove avatar');
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
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: form.dob, phone: form.phone, diceBearStyle: avatarStyle, diceBearSeed: avatarSeed }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setSuccess('Profile updated successfully!');
      setEdited(false);
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
      <div className="content-center">
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
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-green-700 text-white text-xs font-bold shadow-md border-2 border-white uppercase tracking-widest" style={{ letterSpacing: 2 }}>{user.role}</span>
          </div>
          <div className="text-3xl font-extrabold tracking-wide text-green-900 drop-shadow mb-1">{user.name}</div>
          {user.displayName && <div className="text-lg text-green-700 font-semibold mb-4">{user.displayName}</div>}
          <div className="flex flex-col gap-2 w-full max-w-md mt-4">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{form.phone || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth:</span>
              <span className="info-value">{form.dob || '—'}</span>
            </div>
            {currentClasses.length > 0 && (
              <div className="info-row">
                <span className="info-label">Current Classes:</span>
                <span className="info-value">{currentClasses.join(', ')}</span>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-6 justify-center">
            <button className="px-6 py-2 bg-[#307637] text-white rounded-xl shadow-lg hover:bg-[#245929] text-lg font-bold tracking-wide" onClick={() => setEditMode(true)}>Edit</button>
            <label className="flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="accent-green-600 w-5 h-5" />
              <span className="text-base font-semibold">Dark Mode</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // --- Edit Mode ---
  return (
    <div className="content-center">
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
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-green-700 text-white text-xs font-bold shadow-md border-2 border-white uppercase tracking-widest" style={{ letterSpacing: 2 }}>{user.role}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <select
              value={avatarStyle}
              onChange={e => { setAvatarStyle(e.target.value); setEdited(true); }}
              className="border rounded px-2 py-1 text-sm"
              disabled={!!avatarUrl}
            >
              {DICEBEAR_STYLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { handleRandomize(); setEdited(true); }}
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
              onClick={() => { setEditMode(false); setEdited(false); setError(null); setSuccess(null); }}
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