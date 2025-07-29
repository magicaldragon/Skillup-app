import React, { useState, useMemo } from 'react';
import type { Student, StudentClass } from './types';
import DiceBearAvatar from './DiceBearAvatar';
import { useDarkMode } from './App';

const DEFAULT_AVATAR = '/anon-avatar.png';
const AVATAR_MALE = '/avatar-male.png';
const AVATAR_FEMALE = '/avatar-female.png';

function getAvatar(user: Student) {
  if (user.avatarUrl) return user.avatarUrl;
  if (user.gender === 'male') return AVATAR_MALE;
  if (user.gender === 'female') return AVATAR_FEMALE;
  return DEFAULT_AVATAR;
}

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

  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleRandomize = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 10));
    setEdited(true);
  };

  // Only allow editing if fields are changed
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

  // Get class names for current user
  const currentClasses = useMemo(() => {
    if (!user.classIds || !classes.length) return [];
    return classes.filter(c => user.classIds?.includes(c.id)).map(c => c.name);
  }, [user.classIds, classes]);

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
      onDataRefresh?.();
    } catch (err: any) {
      setError('Failed to update profile: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Modern card + dark mode
  return (
    <div className={`max-w-2xl mx-auto mt-12 p-0 rounded-3xl shadow-2xl border-4 border-green-500 bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-hidden idcard transition-colors duration-500`} style={{ minHeight: 420 }}>
      {/* Watermark or background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none" style={{ background: 'url(/logo-skillup.png) center/30% no-repeat' }} />
      <div className="flex flex-row items-center gap-12 p-10 z-10 relative">
        {/* Avatar and badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="w-32 h-32 rounded-2xl border-4 border-green-400 shadow-xl object-cover bg-slate-100" />
            ) : (
              <DiceBearAvatar seed={avatarSeed} size={128} style={avatarStyle} />
            )}
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow-md border-2 border-white uppercase tracking-widest" style={{ letterSpacing: 2 }}>{user.role}</span>
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
        </div>
        {/* Info section */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-extrabold tracking-wide text-green-900 drop-shadow">{user.name}</span>
            {user.displayName && <span className="text-xl text-green-700 font-semibold">{user.displayName}</span>}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-medium text-slate-500">Role:</span>
            <span className="text-base font-semibold text-green-800 capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-medium text-slate-500">Current Classes:</span>
            <span className="text-base font-semibold text-green-800">{currentClasses.length ? currentClasses.join(', ') : 'None'}</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="accent-green-600 w-5 h-5" />
              <span className="text-base font-semibold">Dark Mode</span>
            </label>
          </div>
        </div>
      </div>
      <form onSubmit={handleSave} className="px-10 pb-10 pt-0 space-y-6 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-base font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={user.name}
              disabled
              className="w-full p-3 border-2 border-green-200 rounded-lg bg-slate-100 cursor-not-allowed text-slate-400 text-lg"
            />
          </div>
          <div>
            <label className="block text-base font-medium mb-1">English Name</label>
            <input
              type="text"
              name="displayName"
              value={user.displayName || ''}
              disabled
              className="w-full p-3 border-2 border-green-200 rounded-lg bg-slate-100 cursor-not-allowed text-slate-400 text-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-base font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
            />
          </div>
          <div>
            <label className="block text-base font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 border-2 border-green-200 rounded-lg text-lg"
            />
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
        {edited && (
          <button
            type="submit"
            className="px-6 py-3 bg-[#307637] text-white rounded-xl shadow-lg hover:bg-[#245929] w-full mt-2 text-lg font-bold tracking-wide"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  );
};

export default SettingsPanel; 