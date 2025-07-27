import React, { useState, useMemo } from 'react';
import type { Student, StudentClass } from './types';

const DEFAULT_AVATAR = '/anon-avatar.png';
const AVATAR_MALE = '/avatar-male.png';
const AVATAR_FEMALE = '/avatar-female.png';

function getAvatar(user: Student) {
  if (user.avatarUrl) return user.avatarUrl;
  if (user.gender === 'male') return AVATAR_MALE;
  if (user.gender === 'female') return AVATAR_FEMALE;
  return DEFAULT_AVATAR;
}

const SettingsPanel = ({ user, isAdmin, onLogout, classes = [] }: { user: Student, isAdmin: boolean, onLogout: () => void, classes?: StudentClass[] }) => {
  const [form, setForm] = useState({
    dob: user.dob || '',
    phone: user.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [edited, setEdited] = useState(false);

  // Only allow editing if fields are changed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setEdited(true);
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
        body: JSON.stringify({ dob: form.dob, phone: form.phone }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setSuccess('Profile updated successfully!');
      setEdited(false);
    } catch (err: any) {
      setError('Failed to update profile: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Modern card + dark mode
  return (
    <div className={`max-w-xl mx-auto mt-10 p-0 rounded-3xl shadow-2xl border border-green-200 bg-gradient-to-br ${darkMode ? 'from-slate-900 to-slate-800 text-slate-100' : 'from-green-50 to-white text-slate-900'} transition-colors duration-500`}>
      <div className="flex flex-row items-center gap-8 p-8">
        <img
          src={getAvatar(user)}
          alt="avatar"
          className="w-24 h-24 rounded-full border-4 border-green-300 shadow-lg object-cover bg-slate-100"
        />
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold tracking-wide">{user.name}</span>
            <span className="text-lg text-green-700 font-semibold">{user.displayName}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-500">Role:</span>
            <span className="text-sm font-semibold text-green-800 capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-500">Current Classes:</span>
            <span className="text-sm font-semibold text-green-800">{currentClasses.length ? currentClasses.join(', ') : 'None'}</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(d => !d)} className="accent-green-600 w-5 h-5" />
              <span className="text-sm font-semibold">Dark Mode</span>
            </label>
          </div>
        </div>
      </div>
      <form onSubmit={handleSave} className="px-8 pb-8 pt-0 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={user.name}
              disabled
              className="w-full p-2 border rounded bg-slate-100 cursor-not-allowed text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">English Name</label>
            <input
              type="text"
              name="displayName"
              value={user.displayName || ''}
              disabled
              className="w-full p-2 border rounded bg-slate-100 cursor-not-allowed text-slate-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
        {edited && (
          <button
            type="submit"
            className="px-4 py-2 bg-[#307637] text-white rounded shadow hover:bg-[#245929] w-full mt-2"
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