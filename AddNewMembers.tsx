// AddNewMembers.tsx
// Professional panel to add new members (students, teachers, staff, admins), with Firebase-only architecture
// Enhanced with Vietnamese name handling and real-time username preview
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { userRegistrationService } from './frontend/services/userRegistrationService';
import type { Student } from './types';
import { debounce, generateVietnameseUsername } from './utils/stringUtils';

// Extended interface for created user with generated password
interface CreatedUser extends Student {
  generatedPassword?: string;
}
import './AddNewMembers.css';

const AddNewMembers = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student' as 'student' | 'teacher' | 'admin' | 'staff',
    gender: 'male' as 'male' | 'female' | 'other',
    englishName: '',
    dob: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    notes: '',
    status: 'potential',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedStudentCode, setGeneratedStudentCode] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
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

  // Debug logging for form state changes
  useEffect(() => {
    console.log('Form state updated:', {
      name: form.name,
      role: form.role,
      status: form.status,
      previewUsername,
      previewEmail
    });
  }, [form.name, form.role, form.status, previewUsername, previewEmail]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
    setCreatedUser(null);
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      role: 'student',
      gender: 'male',
      englishName: '',
      dob: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      notes: '',
      status: 'potential',
    });
    setError(null);
    setSuccess(null);
    setGeneratedStudentCode(null);
    setCreatedUser(null);
    setPreviewUsername('');
    setPreviewEmail('');
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return 'Full name is required';
    }
    if (form.name.trim().length < 2) {
      return 'Full name must be at least 2 characters long';
    }
    if (form.role === 'student' && !form.status) {
      return 'Status is required for students';
    }
    if (form.role === 'student' && form.status === 'potential' && !form.parentName?.trim()) {
      return 'Parent name is recommended for potential students';
    }
    if (form.phone && form.phone.trim().length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCreatedUser(null);

    try {
      // Set appropriate status based on role
      const userStatus = form.role === 'student' ? form.status : 'active';

      console.log('Submitting registration with data:', {
        ...form,
        status: userStatus,
      });

      const result = await userRegistrationService.registerNewUser({
        ...form,
        status: userStatus,
      });
      
      console.log('Registration result:', result);
      
      // Ensure we have the user data
      if (result && result.user) {
        setSuccess(
          `User registered successfully! ${result.user.studentCode ? `Student Code: ${result.user.studentCode}` : ''}`
        );
        setGeneratedStudentCode(result.user.studentCode || null);
        setCreatedUser(result.user);
        handleReset();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      // Improved error handling for Firebase errors
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === 'auth/email-already-in-use') {
          setError('This email is already registered in Firebase Authentication.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak. Please use a stronger password.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get student ID format
  const getStudentId = (user: CreatedUser) => {
    if (user.role === 'student' && user.studentCode) {
      return user.studentCode;
    }
    return 'N/A';
  };

  // Helper function to get password based on role
  const getPassword = (user: CreatedUser) => {
    if (user.role === 'student') {
      return 'Skillup123';
    }
    return 'Skillup@123';
  };

  // Test function to verify registration flow (remove in production)
  const testRegistration = () => {
    console.log('Testing registration flow...');
    console.log('Current form state:', form);
    console.log('Preview username:', previewUsername);
    console.log('Preview email:', previewEmail);
    
    // Simulate a successful registration for testing
    const testUser: CreatedUser = {
      id: 'test-123',
      name: form.name || 'Test User',
      email: previewEmail || 'test@student.skillup',
      role: form.role,
      username: previewUsername || 'testuser',
      studentCode: form.role === 'student' ? 'STU-001' : undefined,
      generatedPassword: getPassword({ role: form.role } as CreatedUser),
      status: form.status,
      gender: form.gender,
      englishName: form.englishName,
      dob: form.dob,
      phone: form.phone,
      parentName: form.parentName,
      parentPhone: form.parentPhone,
      notes: form.notes,
    };
    
    setCreatedUser(testUser);
    setGeneratedStudentCode(testUser.studentCode || null);
    setSuccess('Test registration completed successfully!');
  };

  return (
    <div className="add-student-container">
      <div className="add-student-content">
        <div className="registration-form-section">
          <div className="form-container">
            <h2 className="form-title">
              REGISTRATION FORM
            </h2>
            <div className="title-decoration-line"></div>

            {error && <div className="error-message">{error}</div>}

            {success && <div className="success-message">{success}</div>}

            {generatedStudentCode && (
              <div className="student-code-display">
                <strong>Generated Student Code: {generatedStudentCode}</strong>
              </div>
            )}



            <form onSubmit={handleSubmit} className="registration-form">
              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="debug-info" style={{ gridColumn: '1 / -1', marginBottom: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                  <strong>Debug Info:</strong> Name: "{form.name}" | Role: {form.role} | Status: {form.status} | Username: {previewUsername} | Email: {previewEmail}
                </div>
              )}

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="Enter Vietnamese full name (e.g., Nguyễn Văn A)"
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  Role <span className="required">*</span>
                </label>
                <select
                  id="role"
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
              </div>

              {/* Gender */}
              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Gender <span className="required">*</span>
                </label>
                <select
                  id="gender"
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

              {/* English Name */}
              <div className="form-group">
                <label htmlFor="englishName" className="form-label">
                  English Name
                </label>
                <input
                  id="englishName"
                  type="text"
                  name="englishName"
                  value={form.englishName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter English name (optional)"
                />
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label htmlFor="dob" className="form-label">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={previewEmail || "Enter email address (optional)"}
                />

              </div>

              {/* Status - Only for students */}
              {form.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status <span className="required">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="potential">Potential</option>
                    <option value="contacted">Contacted</option>
                    <option value="studying">Studying</option>
                  </select>
                </div>
              )}

              {/* Parent's Name - Only for students */}
              {form.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="parentName" className="form-label">
                    Parent's Name
                  </label>
                  <input
                    id="parentName"
                    type="text"
                    name="parentName"
                    value={form.parentName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter parent's name"
                  />
                </div>
              )}

              {/* Parent's Phone - Only for students */}
              {form.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="parentPhone" className="form-label">
                    Parent's Phone
                  </label>
                  <input
                    id="parentPhone"
                    type="tel"
                    name="parentPhone"
                    value={form.parentPhone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter parent's phone number"
                  />
                </div>
              )}

              {/* Notes - Full Width at the end */}
              <div className="form-group full-width">
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={2}
                  placeholder="Any additional notes or information..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
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
                <button
                  type="button"
                  className="test-btn"
                  onClick={testRegistration}
                  disabled={loading}
                >
                  Test Registration
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Success Info Box - appears when account is created successfully */}
        {createdUser && (
          <div className="success-info-section">
            <div className="success-info-box">
              <h3 className="success-title">THE ACCOUNT HAS BEEN CREATED SUCCESSFULLY!</h3>
              <div className="account-details">
                <div className="account-detail">
                  <span className="detail-label">FULL NAME:</span>
                  <span className="detail-value">{createdUser.name || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">ROLE:</span>
                  <span className="detail-value">{createdUser.role?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">STUDENT ID:</span>
                  <span className="detail-value">{getStudentId(createdUser)}</span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">USERNAME:</span>
                  <span className="detail-value">
                    {createdUser.username || previewUsername || 'N/A'}
                  </span>
                </div>
                <div className="account-detail">
                  <span className="detail-label">PASSWORD:</span>
                  <span className="detail-value password-display">
                    {createdUser.generatedPassword || getPassword(createdUser)}
                  </span>
                </div>
              </div>
              <div className="success-instructions">
                <p>
                  Please copy or take a screenshot of this information and send it to the new member.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddNewMembers;
