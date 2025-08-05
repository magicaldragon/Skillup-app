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
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<WaitingStudent | null>(null);
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
  const filteredStudents = waitingStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.includes(search))
  );

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
            className="form-btn waiting-list-retry-btn"
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
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select waiting-list-status-filter"
        >
          <option value="">All Status</option>
          <option value="waiting_for_class">Waiting for Class</option>
          <option value="approved">Approved</option>
          <option value="contacted">Contacted</option>
        </select>
      </div>

      <table className="waiting-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length === 0 && (
            <tr><td colSpan={5} className="empty-table">No students in waiting list.</td></tr>
          )}
          {filteredStudents.map(student => (
            <tr key={student._id} onClick={() => setSelectedStudent(student)} className="clickable-row">
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.phone}</td>
              <td>{student.status}</td>
              <td>
                <select
                  value={student.status}
                  onChange={e => handleStatusChange(student._id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="waiting_for_class">Waiting</option>
                  <option value="studying">Studying</option>
                  <option value="postponed">Postponed</option>
                  <option value="off">Off</option>
                  <option value="alumni">Alumni</option>
                </select>
                {student.status === 'studying' && (
                  <select
                    onChange={e => handleAssignToClass(student._id, e.target.value)}
                    className="assign-class-select"
                  >
                    <option value="">Assign to Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Details Modal/Panel */}
      {selectedStudent && (
        <div className="student-details-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedStudent(null)}>Close</button>
            <h3>Student Details</h3>
            <div><b>Name:</b> {selectedStudent.name}</div>
            <div><b>English Name:</b> {selectedStudent.englishName}</div>
            <div><b>Email:</b> {selectedStudent.email}</div>
            <div><b>Phone:</b> {selectedStudent.phone}</div>
            <div><b>Gender:</b> {selectedStudent.gender}</div>
            <div><b>Status:</b> {selectedStudent.status}</div>
            <div><b>Notes:</b> {selectedStudent.notes}</div>
            {/* Add more fields as needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingListPanel; 