import { useCallback, useEffect, useState } from 'react';
import './RecordsPanel.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface StudentRecord {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  studentName: string;
  action: string;
  category: string;
  details: string | Record<string, unknown>;
  relatedClass?: {
    _id: string;
    name: string;
  };
  relatedAssignment?: {
    _id: string;
    title: string;
  };
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  performedByName: string;
  timestamp: string;
  isActive: boolean;
}

interface Student {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  studentCode?: string;
  classIds?: string[];
  createdAt: string;
  updatedAt: string;
}

const RecordsPanel = () => {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'all' | 'academic' | 'administrative' | 'financial' | 'attendance' | 'assessment' | 'students'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'off' | 'alumni'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('skillup_token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter !== 'all') {
        params.append('category', filter);
      }

      const response = await fetch(`${API_BASE_URL}/student-records?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }

      const data = await response.json();
      if (data.success) {
        setRecords(data.records || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Fetch records error:', error);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter]);

  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem('skillup_token');
    if (!token) return;

    try {
      // Fetch students with 'off' or 'alumni' status
      const response = await fetch(`${API_BASE_URL}/users?status=off,alumni`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    }
  }, []);

  // Helper functions for records display
  const getActionColor = (action: string): string => {
    const actionColors: { [key: string]: string } = {
      'user_created': 'success',
      'user_updated': 'info',
      'user_deleted': 'danger',
      'role_changed': 'warning',
      'status_changed': 'warning',
      'class_assigned': 'success',
      'class_removed': 'danger',
      'assignment_submitted': 'info',
      'assignment_graded': 'success',
    };
    return actionColors[action] || 'default';
  };

  const getActionDisplayName = (action: string): string => {
    const actionNames: { [key: string]: string } = {
      'user_created': 'User Created',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'role_changed': 'Role Changed',
      'status_changed': 'Status Changed',
      'class_assigned': 'Class Assigned',
      'class_removed': 'Class Removed',
      'assignment_submitted': 'Assignment Submitted',
      'assignment_graded': 'Assignment Graded',
    };
    return actionNames[action] || action;
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: { [key: string]: string } = {
      'academic': 'Academic',
      'administrative': 'Administrative',
      'financial': 'Financial',
      'attendance': 'Attendance',
      'assessment': 'Assessment',
    };
    return categoryNames[category] || category;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchRecords();
    fetchStudents();
  }, [fetchRecords, fetchStudents]);

  const filteredRecords = records.filter((record) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.studentName.toLowerCase().includes(searchLower) ||
        record.action.toLowerCase().includes(searchLower) ||
        record.category.toLowerCase().includes(searchLower) ||
        record.details.toString().toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredStudents = students.filter((student) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.englishName?.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.studentCode?.toLowerCase().includes(searchLower)
      );
    }
    if (statusFilter !== 'all') {
      return student.status === statusFilter;
    }
    return true;
  });

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="records-panel">
        <div className="records-loading">
          <div className="records-spinner"></div>
          <p>Loading records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="records-panel">
        <div className="records-error">
          <h3>Error Loading Records</h3>
          <p>{error}</p>
          <button type="button" className="form-btn" onClick={fetchRecords}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="records-panel">
      <div className="records-header">
        <h2 className="records-title">Student Records Management</h2>
        <p className="records-subtitle">Track all student-related activities and changes</p>
      </div>

      <div className="records-controls">
        <div className="records-search">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Search is already live, just focus the input
                  (e.target as HTMLInputElement).focus();
                }
              }}
              aria-label="Search records"
              title="Search records by any field"
            />
            <button type="button" className="search-bar-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Search">
                <title>Search</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="administrative">Administrative</option>
              <option value="financial">Financial</option>
              <option value="attendance">Attendance</option>
              <option value="assessment">Assessment</option>
              <option value="students">Students</option>
            </select>
            
            {/* Show status filter only when students category is selected */}
            {filter === 'students' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'off' | 'alumni')}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="off">Off</option>
                <option value="alumni">Alumni</option>
              </select>
            )}
          </div>
      </div>

      <div className="records-stats">
        <div className="records-stat">
          <span className="records-stat-label">Total Records</span>
          <span className="records-stat-value">{pagination.total}</span>
        </div>
        <div className="records-stat">
          <span className="records-stat-label">Filtered</span>
          <span className="records-stat-value">{filteredRecords.length}</span>
        </div>
        <div className="records-stat">
          <span className="records-stat-label">Current Page</span>
          <span className="records-stat-value">
            {pagination.page} / {pagination.pages}
          </span>
        </div>
      </div>

      {filter === 'students' ? (
        // Students Table
        <div className="table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>English Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Student Code</th>
                <th>Phone</th>
                <th>Parent Name</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <p>No students found with the selected criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.englishName || '—'}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`status-badge status-${student.status}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>{student.studentCode || '—'}</td>
                    <td>{student.phone || '—'}</td>
                    <td>{student.parentName || '—'}</td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Records Table
        <div className="table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Category</th>
                <th>Date</th>
                <th>Student</th>
                <th>Details</th>
                <th>Performed By</th>
                <th>Related Class</th>
                <th>Related Assignment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <p>No records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <span className={`records-action ${getActionColor(record.action)}`}>
                        {getActionDisplayName(record.action)}
                      </span>
                    </td>
                    <td>{getCategoryDisplayName(record.category)}</td>
                    <td>{formatDate(record.timestamp)}</td>
                    <td>{record.studentName}</td>
                    <td>
                      {record.details ? JSON.stringify(record.details) : 'No details available'}
                    </td>
                    <td>{record.performedByName}</td>
                    <td>{record.relatedClass?.name || '—'}</td>
                    <td>{record.relatedAssignment?.title || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="records-pagination">
          <button
            type="button"
            className="form-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="form-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      <div className="records-footer">
        <button type="button" className="form-btn" onClick={fetchRecords}>
          Refresh Records
        </button>
      </div>
    </div>
  );
};

export default RecordsPanel;
