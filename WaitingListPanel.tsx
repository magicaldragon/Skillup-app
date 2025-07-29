import { useState, useEffect } from 'react';
import type { StudentClass } from './types';
import './WaitingListPanel.css';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

interface WaitingStudent {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  interestedPrograms?: string[];
  preferredLevel?: string;
  notes?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const WaitingListPanel = ({ classes, onDataRefresh }: { classes: StudentClass[], onDataRefresh?: () => void }) => {
  const [waitingStudents, setWaitingStudents] = useState<WaitingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchWaitingStudents();
  }, []);

  const fetchWaitingStudents = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      // Fetch students with status 'waiting_for_class'
      const response = await fetch(`${API_BASE_URL}/potential-students?status=waiting_for_class`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch waiting students');
      }

      const data = await response.json();
      if (data.success) {
        setWaitingStudents(data.potentialStudents || []);
      } else {
        throw new Error(data.message || 'Failed to fetch waiting students');
      }
    } catch (error) {
      console.error('Fetch waiting students error:', error);
      setError('Failed to load waiting students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for avatar by gender
  const getAvatar = (student: WaitingStudent) => {
    if (student.gender === 'male') return '/avatar-male.png';
    if (student.gender === 'female') return '/avatar-female.png';
    return '/anon-avatar.png';
  };

  // Helper for display name
  const getDisplayName = (student: WaitingStudent) => {
    const fullName = student.englishName || student.name;
    return fullName || 'Unknown Name';
  };

  // Helper for phone number
  const getPhoneNumber = (student: WaitingStudent) => {
    return student.phone || 'No phone';
  };

  // Helper for date/time
  const getDateTime = (student: WaitingStudent) => {
    if (!student.createdAt) return 'Unknown date';
    return new Date(student.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper for notes
  const getNotes = (student: WaitingStudent) => {
    return student.notes || 'No notes';
  };

  // Helper for interested programs
  const getInterestedPrograms = (student: WaitingStudent) => {
    return student.interestedPrograms?.join(', ') || 'No programs specified';
  };

  // Filter students based on search and status
  const filteredStudents = waitingStudents.filter(student => {
    const matchesSearch = searchTerm === '' || 
      getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPhoneNumber(student).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAssignToClass = async (studentId: string, classId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}/assign-class`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign student to class');
      }

      alert('Student assigned to class successfully!');
      fetchWaitingStudents();
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Assign to class error:', error);
      alert('Failed to assign student to class. Please try again.');
    }
  };

  const handleMoveBackToPotential = async (studentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    if (!window.confirm('Move this student back to Potential Students?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to move student back to potential students');
      }

      alert('Student moved back to Potential Students successfully');
      fetchWaitingStudents();
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Move back error:', error);
      alert('Failed to move student back to Potential Students. Please try again.');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this waiting student? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/potential-students/${studentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete waiting student');
      }
      
      alert('Waiting student deleted successfully!');
      fetchWaitingStudents();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete waiting student. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-loading">
          <div className="waiting-list-spinner"></div>
          <p>Loading waiting students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waiting-list-panel">
        <div className="waiting-list-error">
          <h3>Error Loading Waiting Students</h3>
          <p>{error}</p>
          <button 
            className="waiting-list-retry-btn"
            onClick={fetchWaitingStudents}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-list-panel">
      <h2 className="waiting-list-title">Waiting List</h2>
      <p className="waiting-list-subtitle">Students interested in courses, waiting for class assignment</p>
      
      {/* Search and Filter Controls */}
      <div className="waiting-list-controls">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="waiting-list-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="waiting-list-status-filter"
        >
          <option value="">All Status</option>
          <option value="waiting_for_class">Waiting for Class</option>
          <option value="approved">Approved</option>
          <option value="contacted">Contacted</option>
        </select>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="waiting-list-empty">
          {waitingStudents.length === 0 ? 'No waiting students found.' : 'No students match your search criteria.'}
        </div>
      ) : (
        <div className="waiting-list-students">
          {filteredStudents.map(student => (
            <div
              key={student._id}
              className="waiting-list-student-item"
            >
              <div className="waiting-list-student-info">
                <img
                  src={getAvatar(student)}
                  alt="avatar"
                  className="waiting-list-avatar"
                />
                <div className="waiting-list-student-details">
                  <div className="waiting-list-student-main-info">
                    <span className="waiting-list-student-name">{getDisplayName(student)}</span>
                    <span className="waiting-list-student-phone">📞 {getPhoneNumber(student)}</span>
              </div>
                  <div className="waiting-list-student-secondary-info">
                    <span className="waiting-list-student-email">📧 {student.email}</span>
                    <span className="waiting-list-student-date">📅 Added: {getDateTime(student)}</span>
            </div>
                  <div className="waiting-list-student-programs">
                    <span className="waiting-list-student-programs-label">🎯 Interested Programs:</span>
                    <span className="waiting-list-student-programs-text">{getInterestedPrograms(student)}</span>
                </div>
                  {student.preferredLevel && (
                    <div className="waiting-list-student-level">
                      <span className="waiting-list-student-level-label">📚 Preferred Level:</span>
                      <span className="waiting-list-student-level-text">{student.preferredLevel}</span>
            </div>
          )}
                  <div className="waiting-list-student-notes">
                    <span className="waiting-list-student-notes-label">📝 Notes:</span>
                    <span className="waiting-list-student-notes-text">{getNotes(student)}</span>
                  </div>
                  <span className="waiting-list-student-status">Status: {student.status}</span>
                </div>
              </div>
              <div className="waiting-list-student-actions">
                <select
                  className="waiting-list-class-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignToClass(student._id, e.target.value);
                    }
                  }}
                >
                  <option value="">Assign to Class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                  <button
                  className="waiting-list-action-btn waiting-list-action-btn-secondary"
                  onClick={() => handleMoveBackToPotential(student._id)}
                  >
                  Move to Potential
                  </button>
                  <button
                  className="waiting-list-action-btn waiting-list-action-btn-danger"
                  onClick={() => handleDelete(student._id)}
                  >
                    Delete
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaitingListPanel; 