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
    email: '', // This is now separate from the generated Firebase email
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [, setCreatedUser] = useState<CreatedUser | null>(null);
  const [previewUsername, setPreviewUsername] = useState<string>('');
  const [previewEmail, setPreviewEmail] = useState<string>('');


  // Debounced username generation for performance
  const debouncedUsernameGeneration = useCallback(
    debounce((fullName: string, role: string) => {
      if (fullName && fullName.trim()) {
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
      previewEmail,
    });
  }, [form.name, form.role, form.status, previewUsername, previewEmail]);

  // Handle general form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply phone number formatting
    if (name === 'phone' || name === 'parentPhone') {
      const formattedValue = formatPhoneNumber(value);
      setForm(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setError(null);
    setCreatedUser(null);
  };

  // Real-time field validation
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return null;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      case 'phone':
      case 'parentPhone':
        if (value && value.replace(/\D/g, '').length < 10) {
          return 'Phone number must be at least 10 digits';
        }
        return null;
      default:
        return null;
    }
  };

  // Handle field blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    
    if (fieldError) {
      setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  };

  // Phone number formatting function - now returns plain text
  const formatPhoneNumber = (value: string) => {
    // Return the value as-is for plain text input
    return value;
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '', // Reset to empty, don't auto-fill
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
    setCreatedUser(null);
    setPreviewUsername('');
    setPreviewEmail('');

  };

  const validateForm = (): string | null => {
    if (!form.name || !form.name.trim()) {
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
    if (form.phone && typeof form.phone === 'string' && (form.phone || '').trim().length < 10) {
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
      console.log('Checking result structure:', {
        hasResult: !!result,
        hasUser: !!result?.user,
        resultKeys: result ? Object.keys(result) : [],
        userKeys: result?.user ? Object.keys(result.user) : []
      });
      
      if (result?.user) {
        console.log('Setting created user:', result.user);
        setCreatedUser(result.user);
        handleReset();
      } else if (result) {
        // Sometimes the response might have a different structure
        console.log('Result exists but no user property, trying to use result directly');
        setCreatedUser(result as any);
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





  return (
    <div className="add-student-container">
      <div className="add-student-content">
        <div className="registration-form-section">
          <div className="form-container">
            <h2 className="form-title">Registration Form</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="registration-form">
              {/* Row 1: Full Name, Role, Gender, English Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  FULL NAME <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                  required
                  placeholder="Enter Vietnamese full name (e.g.)"
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  ROLE <span className="required">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-select"
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  GENDER <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-select"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="englishName" className="form-label">
                  ENGLISH NAME <span className="optional">(OPTIONAL)</span>
                </label>
                <input
                  id="englishName"
                  type="text"
                  name="englishName"
                  value={form.englishName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="Enter English name"
                />
              </div>

              {/* Row 2: Date of Birth, Phone Number, Email, Status */}
              <div className="form-group">
                <label htmlFor="dob" className="form-label">
                  DATE OF BIRTH <span className="optional">(OPTIONAL)</span>
                </label>
                <input
                  id="dob"
                  type="text"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="mm/dd/yyyy"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  PHONE NUMBER <span className="optional">(OPTIONAL)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                  placeholder="Enter phone number"
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  EMAIL <span className="optional">(OPTIONAL)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="Enter email address"
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  STATUS <span className="required">*</span>
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

              {/* Row 3: Parent's Name, Parent's Phone */}
              <div className="form-group">
                <label htmlFor="parentName" className="form-label">
                  PARENT'S NAME
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

              <div className="form-group">
                <label htmlFor="parentPhone" className="form-label">
                  PARENT'S PHONE
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

              {/* Empty cells to maintain grid structure */}
              <div className="form-group empty-cell"></div>
              <div className="form-group empty-cell"></div>

              {/* Row 4: Notes - Full Width */}
              <div className="form-group notes-section">
                <label htmlFor="notes" className="form-label">
                  NOTES
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={3}
                  placeholder="Any additional notes or information..."
                />
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button type="submit" className="register-btn" disabled={loading}>
                  {loading ? 'REGISTERING...' : 'REGISTER'}
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleReset}
                  disabled={loading}
                >
                  RESET
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewMembers;
