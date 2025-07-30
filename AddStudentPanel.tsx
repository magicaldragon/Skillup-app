// AddStudentPanel.tsx
// Professional panel to add new students, with Hybrid Auth (Firebase + MongoDB) integration
// [NOTE] Updated for hybrid authentication system
import React, { useState } from 'react';
import { userRegistrationService } from './frontend/services/userRegistrationService';
import './AddStudentPanel.css';

const AddStudentPanel = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student',
    phone: '',
    dob: '',
    displayName: '',
    status: 'potential'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedStudentCode, setGeneratedStudentCode] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      role: 'student',
      phone: '',
      dob: '',
      displayName: '',
      status: 'potential'
    });
    setError(null);
    setSuccess(null);
    setGeneratedStudentCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await userRegistrationService.registerNewUser(form);
      setSuccess(`User registered successfully! ${result.user.studentCode ? `Student Code: ${result.user.studentCode}` : ''}`);
      setGeneratedStudentCode(result.user.studentCode || null);
      handleReset();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-center">
      <div className="form-container">
        <h2 className="form-title">Registration Form</h2>
        
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
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Role <span className="required">*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="form-group">
              <label className="form-label">
                Status <span className="required">*</span>
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="form-input"
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

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register User'}
            </button>
            <button
              type="button"
              className="reset-btn"
              onClick={handleReset}
              disabled={loading}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentPanel; 