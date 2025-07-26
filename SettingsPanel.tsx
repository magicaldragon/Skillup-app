import React, { useState } from 'react';
import { db } from './services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Student } from './types';

const SettingsPanel = ({ user, isAdmin, onLogout }: { user: Student, isAdmin: boolean, onLogout: () => void }) => {
  const [form, setForm] = useState({
    name: user.name,
    displayName: user.displayName || '',
    dob: user.dob || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...(isAdmin ? { name: form.name } : {}),
        displayName: form.displayName,
        dob: form.dob,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError('Failed to update profile: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">English Name</label>
          <input
            type="text"
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
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
        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            type="text"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Paste image URL..."
          />
        </div>
        {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-[#307637] text-white rounded shadow hover:bg-[#245929] w-full"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      
      {/* Logout Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Account Actions</h3>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 w-full transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel; 