// AddStudentPanel.tsx
// Professional panel to add new students, with Hybrid Auth (Firebase + MongoDB) integration
// [NOTE] Updated for hybrid authentication system
import React, { useState, useEffect } from 'react';
import { userRegistrationService, NewUserData } from './services/userRegistrationService';
import { safeTrim, isEmpty, isNotEmpty } from './utils/stringUtils';
import './AddStudentPanel.css';

const AddStudentPanel = ({ onStudentAdded }: { onStudentAdded?: () => void }) => {
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
    if (isNotEmpty(form.fullname)) {
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
    if (isNotEmpty(form.username)) {
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

    const fullname = safeTrim(form.fullname);
    if (isEmpty(fullname)) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }
    if (isEmpty(form.username)) {
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
        role: form.role as 'admin' | 'teacher' | 'student' | 'staff',
        phone: form.phone || undefined,
        englishName: form.englishName || undefined,
        dob: form.dob || undefined,
        gender: form.gender as 'male' | 'female' | 'other',
        note: form.note || undefined,
        username: form.username, // pass username
      };

      const result = await userRegistrationService.registerNewUser(userData);

      if (result.success && result.user) {
        const roleDisplay = form.role.charAt(0).toUpperCase() + form.role.slice(1);
        const successMessage = form.role === 'student' 
          ? `${roleDisplay} registered successfully and added to potential students list!\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nPassword: ${result.user.password}`
          : `${roleDisplay} registered successfully!\nUsername: ${result.user.username}\nEmail: ${result.user.email}\nPassword: ${result.user.password}`;
        
        setSuccess(successMessage);
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
        if (onStudentAdded) onStudentAdded();
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
    <div className="content-center">
      <div className="form-container">
        <h2 className="form-title">Add New Member</h2>
        {error && <div className="form-alert error">{error}</div>}
        {success && <div className="form-alert success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="form-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter email address"
              />
              <div className="form-hint">Leave empty to auto-generate</div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">English Name (Optional)</label>
              <input
                type="text"
                name="englishName"
                value={form.englishName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter English name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth (Optional)</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender (Optional)</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="form-btn primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
            <button type="button" className="form-btn secondary" onClick={handleReset}>
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentPanel; 