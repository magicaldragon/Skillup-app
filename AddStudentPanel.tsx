// AddStudentPanel.tsx
// Professional panel to add new students, with Firestore and Firebase Auth integration
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const AddStudentPanel = () => {
  const [form, setForm] = useState({
    fullname: '',
    dob: '',
    englishName: '',
    phone: '',
    note: '',
    username: '',
    role: 'student',
    gender: 'male',
    status: 'potential',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const usernameManuallyEdited = useRef(false);

  // Fetch all usernames on mount
  useEffect(() => {
    import('./services/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, getDocs }) => {
        getDocs(collection(db, 'users')).then(snap => {
          setUsernames(snap.docs.map(d => (d.data().username || '').toLowerCase()));
        });
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'username') {
      usernameManuallyEdited.current = true;
    }
  };

  // Auto-generate username from fullname if not manually edited
  useEffect(() => {
    if (!form.fullname || usernameManuallyEdited.current) return;
    // Remove spaces, symbols, lowercase
    let base = form.fullname.normalize('NFD').replace(/[ -]/g, c => c).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!base) return;
    let candidate = base;
    let i = 1;
    while (usernames.includes(candidate)) {
      candidate = base + i;
      i++;
    }
    setForm(f => ({ ...f, username: candidate }));
  }, [form.fullname, usernames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fullname = (form.fullname || '').trim();
    const username = (form.username || '').trim().toLowerCase();
    if (!fullname) {
      setError('Fullname is required.');
      setLoading(false);
      return;
    }
    if (!username) {
      setError('Username is required.');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, dots, underscores, and hyphens.');
      setLoading(false);
      return;
    }
    const email = form.role === 'staff' ? `${username}-@staff.skillup` : `${username}@${form.role}.skillup`;
    const password = form.role === 'student' ? 'Skillup123' : 'Skillup@123';
    // Set avatar color based on gender
    let avatarColor = '#033495';
    if (form.gender === 'female') avatarColor = '#ff66c4';
    else if (form.gender === 'others') avatarColor = '#5e17eb';
    try {
      const functions = getFunctions();
      const createUserByAdmin = httpsCallable(functions, 'createUserByAdmin');
      const result = await createUserByAdmin({
        email,
        password,
        displayName: form.englishName || fullname,
        role: form.role,
        extraFields: {
          name: fullname,
          displayName: form.englishName,
          dob: form.dob,
          phone: form.phone,
          note: form.note,
          avatarUrl: '',
          avatarColor,
          classIds: [],
          active: true,
          username,
          status: form.status,
          gender: form.gender,
        }
      });
      if ((result.data as any)?.success) {
        setSuccess(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account added successfully!`);
        setForm({ fullname: '', dob: '', englishName: '', phone: '', note: '', username: '', role: 'student', gender: 'male', status: 'potential' });
      } else {
        setError('Failed to add account.');
      }
    } catch (err: any) {
      setError('Failed to add account: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Add New Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Role <span className="text-red-500">*</span></label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender <span className="text-red-500">*</span></label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="others">Others</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fullname <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="fullname"
            value={form.fullname}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="e.g., Nguyễn Văn A"
          />
          <p className="text-xs text-slate-500 mt-1">Vietnamese full name (with spaces and symbols, e.g., Nguyễn Văn A). This is for display and cannot be changed by teachers after creation.</p>
        </div>
        {form.role === 'student' && (
          <div>
            <label className="block text-sm font-medium mb-1">Status <span className="text-red-500">*</span></label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="potential">Potential Students</option>
              <option value="waiting">Waiting List</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Username <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            pattern="^[a-zA-Z0-9._-]+$"
            placeholder="e.g., nguyenvana"
          />
          <p className="text-xs text-slate-500 mt-1">Username for login. Use the Vietnamese fullname with no spaces or symbols (e.g., nguyenvana). Only letters, numbers, dots, underscores, and hyphens allowed. This will be generated automatically from fullname, but you can edit it if needed.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">English Name</label>
          <input
            type="text"
            name="englishName"
            value={form.englishName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="e.g., John"
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
            placeholder="e.g., 0123456789"
          />
        </div>
        {(form.role === 'teacher' || form.role === 'admin' || form.role === 'staff') && (
          <div>
            <label className="block text-sm font-medium mb-1">Status <span className="text-red-500">*</span></label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="potential">Potential Students</option>
              <option value="waiting">Waiting List</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Optional note..."
          />
        </div>
        {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-[#307637] text-white rounded shadow hover:bg-[#245929] w-full"
          disabled={loading}
        >
          {loading ? `Adding...` : `Add ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}
        </button>
      </form>
    </div>
  );
};

export default AddStudentPanel; 