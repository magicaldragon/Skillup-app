// AddNewMembers.tsx
// Professional panel to add new members (students, teachers, staff, admins), with Firebase-only architecture
// Enhanced with Vietnamese name handling and real-time username preview
import React, { useState, useEffect, useCallback } from 'react';
import { userRegistrationService } from './frontend/services/userRegistrationService';
import { generateVietnameseUsername, debounce } from './utils/stringUtils';
import './AddNewMembers.css';

const AddNewMembers = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '', // Add username field
    role: 'student' as 'student' | 'teacher' | 'admin' | 'staff',
    gender: 'male' as 'male' | 'female' | 'other',
    englishName: '',
    dob: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    notes: '',
    status: 'potential',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedStudentCode, setGeneratedStudentCode] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [previewUsername, setPreviewUsername] = useState<string>('');
  const [previewEmail, setPreviewEmail] = useState<string>('');

  // Debounced username generation for performance
  const debouncedUsernameGeneration = useCallback(
    debounce((fullName: string, role: string) => {
      if (fullName.trim()) {
        const username = generateVietnameseUsername(fullName);
        const email = `${username}@${role}.skillup`;
        setPreviewUsername(username);
        setPreviewEmail(email);
      } else {
        setPreviewUsername('');
        setPreviewEmail('');
      }
    }, 300),
    []
  );

  // Update preview when name or role changes
  useEffect(() => {
    debouncedUsernameGeneration(form.name, form.role);
  }, [form.name, form.role, debouncedUsernameGeneration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
    setCreatedUser(null);
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      username: '', // Add username field
      role: 'student',
      gender: 'male',
      englishName: '',
      dob: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      notes: '',
      status: 'potential',
      password: ''
    });
    setError(null);
    setSuccess(null);
    setGeneratedStudentCode(null);
    setCreatedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCreatedUser(null);

    try {
      // Validate username is not empty
      if (!form.username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      // Set appropriate status based on role
      const userStatus = form.role === 'student' ? 'potential' : 'active';
      
      const result = await userRegistrationService.registerNewUser({
        ...form,
        status: userStatus,
        password: form.password || (form.role === 'student' ? 'Skillup123' : 'Skillup@123')
      });
      setSuccess(`User registered successfully! ${result.user.studentCode ? `Student Code: ${result.user.studentCode}` : ''}`);
      setGeneratedStudentCode(result.user.studentCode || null);
      setCreatedUser(result.user);
      handleReset();
    } catch (err: any) {
      // Improved error handling for Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered in Firebase Authentication.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get student ID format
  const getStudentId = (user: any) => {
    if (user.role === 'student' && user.studentCode) {
      return user.studentCode;
    }
    return 'N/A';
  };

  // Helper function to get password based on role
  const getPassword = (user: any) => {
    if (user.role === 'student') {
      return 'Skillup123';
    }
    return 'Skillup@123';
  };

  return (
    <div className="panel-container">
      <div className="panel-content">
        <div className="registration-form-section">
          <div className="panel-card">
            <h2 className="panel-title">REGISTRATION FORM</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            {generatedStudentCode && (
              <div className="student-code-display">
                <strong>Generated Student Code: {generatedStudentCode}</strong>
              </div>
            )}

            <form onSubmit={handleSubmit} className="registration-form">
              {/* Left Column */}
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="Enter Vietnamese full name (e.g., Nguyễn Văn A)"
                />
                {/* Real-time username preview */}
                {previewUsername && (
                  <div className="username-preview">
                    <small className="preview-label">Generated Username:</small>
                    <span className="preview-username">{previewUsername}</span>
                    <small className="preview-email">{previewEmail}</small>
                  </div>
                )}
              </div>

              {/* Right Column */}
              {/* Role */}
              <div className="form-group">
                <label className="form-label">
                  Role <span className="required">*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                {/* Password preview based on role */}
                <div className="password-preview">
                  <small className="preview-label">Default Password:</small>
                  <span className="preview-password">
                    {form.role === 'student' ? 'Skillup123' : 'Skillup@123'}
                  </span>
                </div>
              </div>

              {/* Left Column */}
              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  Gender <span className="required">*</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Right Column */}
              {/* English Name */}
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

              {/* Left Column */}
              {/* Date of Birth */}
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

              {/* Right Column */}
              {/* Phone Number */}
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

              {/* Left Column */}
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Right Column */}
              {/* Status - Only for students */}
              {form.role === 'student' && (
                <div className="form-group">
                  <label className="form-label">
                    Status <span className="required">*</span>
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="potential">Potential</option>
                    <option value="contacted">Contacted</option>
                    <option value="studying">Studying</option>
                    <option value="postponed">Postponed</option>
                    <option value="off">Off</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
              )}

              {/* Parent's Name - Only for students */}
              {form.role === 'student' && (
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
              )}

              {/* Parent's Phone - Only for students */}
              {form.role === 'student' && (
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
              )}

              {/* Notes - Full Width at the end */}
              <div className="form-group full-width">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={3}
                  placeholder="Any additional notes or information..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Success Info Box - appears when account is created successfully */}
        {createdUser && (
          <div className="success-info-section">
            <div className="success-info-box">
              <h3 className="success-title">✅ THE ACCOUNT HAS BEEN CREATED SUCCESSFULLY!</h3>
              <div className="account-details">
                <div className="account-detail">
                  <span className="detail-label">{createdUser.role === 'student' ? 'STUDENT ID' : 'MEMBER ID'}:</span>
                  <span className="detail-value">{getStudentId(createdUser)}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">FULL NAME:</span>
                  <span className="detail-value">{createdUser.name || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">ENGLISH NAME:</span>
                  <span className="detail-value">{createdUser.englishName || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">ROLE:</span>
                  <span className="detail-value">{createdUser.role?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">USERNAME:</span>
                  <span className="detail-value">{createdUser.username || createdUser.email || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-value">{createdUser.email || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">PASSWORD:</span>
                  <span className="detail-value password-display">
                    {createdUser.generatedPassword || getPassword(createdUser)}
                  </span>
                </div>
                {createdUser.role === 'student' && createdUser.studentCode && (
                  <div className="account-detail">
                    <span className="detail-label">STUDENT CODE:</span>
                    <span className="detail-value student-code">{createdUser.studentCode}</span>
                  </div>
                )}
              </div>
              <div className="success-instructions">
                <p>📋 Please copy or take a screenshot of this information and send it to the new member.</p>
                <p>🔐 They can use these credentials to log in to their account.</p>
                <p>💡 The username is automatically generated from their Vietnamese name for easy memorization.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddNewMembers; 