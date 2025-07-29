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
        const roleDisplay = form.role === 'student' ? 'Student' : form.role === 'teacher' ? 'Teacher' : 'Admin';
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
    <div className="add-student-panel">
      {/* Left: Form */}
      <div className="add-student-card">
        <div className="add-student-header">
          <h2 className="add-student-title">Add New Member</h2>
          <div className="add-student-subtitle">
            {form.role === 'student' ? 'Student (Added to Accounts + Potential Students)' : form.role === 'teacher' ? 'Teacher (Added to Accounts)' : 'Admin (Added to Accounts)'} Registration
          </div>
        </div>
        {error && (
          <div className="add-student-alert add-student-alert-error">
            <div className="add-student-alert-title">Error</div>
            <div className="add-student-alert-message">{error}</div>
          </div>
        )}
        {success && (
          <div className="add-student-alert add-student-alert-success">
            <div className="add-student-alert-title">Success</div>
            <div className="add-student-alert-message">{success}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="add-student-form">
          {/* Role Selection */}
          <div>
            <label className="add-student-label">
              Member Type *
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="add-student-select"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Full Name */}
          <div>
            <label className="add-student-label">
              Full Name *
            </label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              placeholder="Enter full name"
              className="add-student-input"
              required
            />
          </div>
          {/* Username (editable) */}
          <div>
            <label className="add-student-label">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleUsernameChange}
              placeholder="Enter username"
              className="add-student-input"
              required
            />
            {checkingUsername && <div className="add-student-hint add-student-hint-checking">Checking username...</div>}
            {usernameError && <div className="add-student-hint add-student-hint-error">{usernameError}</div>}
          </div>
          {/* English Name */}
          <div>
            <label className="add-student-label">
              English Name (Optional)
            </label>
            <input
              type="text"
              name="englishName"
              value={form.englishName}
              onChange={handleChange}
              placeholder="Enter English name"
              className="add-student-input"
            />
          </div>
          {/* Phone */}
          <div>
            <label className="add-student-label">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="add-student-input"
            />
          </div>
          {/* Date of Birth */}
          <div>
            <label className="add-student-label">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="add-student-input"
            />
          </div>
          {/* Gender */}
          <div>
            <label className="add-student-label">
              Gender (Optional)
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="add-student-select"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Notes */}
          <div>
            <label className="add-student-label">
              Notes (Optional)
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Enter any additional notes"
              className="add-student-textarea"
            />
          </div>
          {/* Submit Button */}
          <div className="add-student-btn-row">
            <button
              type="submit"
              disabled={loading || isEmpty(form.fullname) || isEmpty(form.username) || !!usernameError}
              className="add-student-btn"
            >
              {loading ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      {/* Right: Credentials Preview */}
      <div className="add-student-preview">
        {generatedCredentials && (
          <div className="add-student-preview-card">
            <h4 className="add-student-preview-title">Generated Credentials Preview:</h4>
            <div className="add-student-preview-list">
              <div className="add-student-preview-row">
                <span className="add-student-preview-label">Username:</span>
                <span className="add-student-preview-value">{generatedCredentials.username}</span>
              </div>
              <div className="add-student-preview-row">
                <span className="add-student-preview-label">Email:</span>
                <span className="add-student-preview-value">{generatedCredentials.email}</span>
              </div>
              <div className="add-student-preview-row">
                <span className="add-student-preview-label">Password:</span>
                <span className="add-student-preview-value">{generatedCredentials.password}</span>
              </div>
            </div>
            <p className="add-student-preview-note">
              These credentials will be automatically generated and the user can log in immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStudentPanel; 