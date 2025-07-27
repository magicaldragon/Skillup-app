// AddStudentPanel.tsx
// Professional panel to add new students, with Hybrid Auth (Firebase + MongoDB) integration
// [NOTE] Updated for hybrid authentication system
import React, { useState, useEffect } from 'react';
import { userRegistrationService, NewUserData } from 'services/userRegistrationService';

const AddStudentPanel = () => {
  const [form, setForm] = useState({
    fullname: '',
    username: '', // <-- add username field
    dob: '',
    englishName: '',
    phone: '',
    note: '',
    role: 'student',
    gender: 'male',
    status: 'potential',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Helper to clean and normalize username from full name
  const cleanUsername = (fullname: string) => {
    return fullname
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // Remove accents
      .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric
      .toLowerCase();
  };

  // Check username uniqueness and auto-increment if needed
  const generateUniqueUsername = async (base: string) => {
    setCheckingUsername(true);
    setUsernameError(null);
    let username = base;
    let count = 0;
    const role = form.role || 'student'; // Ensure role is defined
    let exists = await userRegistrationService.checkUsernameOrEmailExists(username, role);
    while (exists) {
      count += 1;
      username = `${base}${count}`;
      exists = await userRegistrationService.checkUsernameOrEmailExists(username, role);
    }
    setCheckingUsername(false);
    return username;
  };

  // Auto-generate username when fullname changes
  useEffect(() => {
    if (form.fullname.trim()) {
      const base = cleanUsername(form.fullname);
      generateUniqueUsername(base).then((unique) => {
        setForm(f => ({ ...f, username: unique }));
      });
    } else {
      setForm(f => ({ ...f, username: '' }));
    }
    // eslint-disable-next-line
  }, [form.fullname]);

  // Auto-generate credentials preview when username changes
  useEffect(() => {
    if (form.username.trim()) {
      const email = `${form.username}@student.skillup`;
      const password = 'Skillup123';
      setGeneratedCredentials({
        username: form.username,
        email,
        password,
      });
    } else {
      setGeneratedCredentials(null);
    }
  }, [form.username]);

  // Username field manual edit handler
  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    setForm(f => ({ ...f, username: value }));
    setCheckingUsername(true);
    setUsernameError(null);
    if (value) {
      const role = form.role || 'student'; // Ensure role is defined
      const exists = await userRegistrationService.checkUsernameOrEmailExists(value, role);
      if (exists) {
        setUsernameError('Username or email already taken');
      }
    }
    setCheckingUsername(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const fullname = form.fullname.trim();
    if (!fullname) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }
    if (!form.username.trim()) {
      setError('Username is required.');
      setLoading(false);
      return;
    }
    if (usernameError) {
      setError('Please choose a unique username.');
      setLoading(false);
      return;
    }

    try {
      const userData: NewUserData = {
        fullname,
        role: form.role as 'admin' | 'teacher' | 'student',
        phone: form.phone || undefined,
        englishName: form.englishName || undefined,
        dob: form.dob || undefined,
        gender: form.gender as 'male' | 'female' | 'other',
        note: form.note || undefined,
        username: form.username, // pass username
      };

      const result = await userRegistrationService.registerNewUser(userData);

      if (result.success && result.user) {
        setSuccess(`User registered successfully! \nUsername: ${result.user.username}\nEmail: ${result.user.email}\nPassword: ${result.user.password}`);
        setForm({
          fullname: '',
          username: '',
          dob: '',
          englishName: '',
          phone: '',
          note: '',
          role: 'student',
          gender: 'male',
          status: 'potential',
        });
        setGeneratedCredentials(null);
      } else {
        setError(result.message || 'Failed to register user');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Layout: Two columns ---
  return (
    <div className="flex flex-row gap-8">
      {/* Left: Form */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Member</h2>
          <div className="text-sm text-gray-500">
            {form.role === 'student' ? 'Student' : form.role === 'teacher' ? 'Teacher' : 'Admin'} Registration
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700 whitespace-pre-line">{success}</div>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Type *
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          {/* Username (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleUsernameChange}
              placeholder="Enter username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            {checkingUsername && <div className="text-xs text-green-500 mt-1">Checking username...</div>}
            {usernameError && <div className="text-xs text-red-500 mt-1">{usernameError}</div>}
          </div>
          {/* English Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Name (Optional)
            </label>
            <input
              type="text"
              name="englishName"
              value={form.englishName}
              onChange={handleChange}
              placeholder="Enter English name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender (Optional)
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Enter any additional notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !form.fullname.trim() || !form.username.trim() || !!usernameError}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      {/* Right: Credentials Preview */}
      <div className="w-96 flex items-center justify-center">
        {generatedCredentials && (
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold text-green-900 mb-4 text-center">Generated Credentials Preview:</h4>
            <div className="space-y-3 text-base text-green-800">
              <div className="flex justify-between items-center">
                <span className="font-medium">Username:</span>
                <span className="font-mono bg-green-200 px-2 py-1 rounded">{generatedCredentials.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <span className="font-mono bg-green-200 px-2 py-1 rounded text-sm">{generatedCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <span className="font-mono bg-green-200 px-2 py-1 rounded">{generatedCredentials.password}</span>
              </div>
            </div>
            <p className="text-sm text-green-700 mt-4 text-center italic">
              These credentials will be automatically generated and the user can log in immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStudentPanel; 