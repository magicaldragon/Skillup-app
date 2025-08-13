import { useEffect, useState, useCallback } from 'react';
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
  details: any;
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

const RecordsPanel = () => {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'all' | 'academic' | 'administrative' | 'financial' | 'attendance' | 'assessment'
  >('all');
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

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.details &&
        typeof record.details === 'string' &&
        record.details.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('withdrawal')) return 'records-action-delete';
    if (action.includes('enrollment') || action.includes('assign')) return 'records-action-assign';
    if (action.includes('update') || action.includes('grade')) return 'records-action-update';
    return 'records-action-default';
  };

  const getActionDisplayName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      enrollment: 'Enrollment',
      class_assignment: 'Class Assignment',
      class_removal: 'Class Removal',
      grade_update: 'Grade Update',
      attendance: 'Attendance',
      payment: 'Payment',
      withdrawal: 'Withdrawal',
      re_enrollment: 'Re-enrollment',
      profile_update: 'Profile Update',
      status_change: 'Status Change',
      note_added: 'Note Added',
      test_result: 'Test Result',
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      academic: 'Academic',
      administrative: 'Administrative',
      financial: 'Financial',
      attendance: 'Attendance',
      assessment: 'Assessment',
    };
    return categoryMap[category] || category;
  };

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
          <button className="form-btn" onClick={fetchRecords}>
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
                  (e.target as HTMLInputElement).focus();
                }
              }}
            />
            <button className="search-bar-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="records-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="form-select"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="administrative">Administrative</option>
            <option value="financial">Financial</option>
            <option value="attendance">Attendance</option>
            <option value="assessment">Assessment</option>
          </select>
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

      {filteredRecords.length === 0 ? (
        <div className="records-empty">
          <p>No records found matching your criteria.</p>
        </div>
      ) : (
        <div className="records-list">
          {filteredRecords.map((record) => (
            <div key={record._id} className="records-item">
              <div className="records-item-header">
                <span className={`records-action ${getActionColor(record.action)}`}>
                  {getActionDisplayName(record.action)}
                </span>
                <span className="records-category">{getCategoryDisplayName(record.category)}</span>
                <span className="records-date">{formatDate(record.timestamp)}</span>
              </div>

              <div className="records-item-content">
                <div className="records-student-info">
                  <strong>Student:</strong> {record.studentName}
                </div>
                <div className="records-details">
                  <strong>Details:</strong>{' '}
                  {record.details ? JSON.stringify(record.details) : 'No details available'}
                </div>
                <div className="records-performed-by">
                  <strong>Performed by:</strong> {record.performedByName}
                </div>
                {record.relatedClass && (
                  <div className="records-related-class">
                    <strong>Related Class:</strong> {record.relatedClass.name}
                  </div>
                )}
                {record.relatedAssignment && (
                  <div className="records-related-assignment">
                    <strong>Related Assignment:</strong> {record.relatedAssignment.title}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="records-pagination">
          <button
            className="form-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </button>
          <span className="records-page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="form-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      <div className="records-footer">
        <button className="form-btn" onClick={fetchRecords}>
          Refresh Records
        </button>
      </div>
    </div>
  );
};

export default RecordsPanel;
