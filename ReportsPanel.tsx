import { useCallback, useEffect, useState } from 'react';
import './ReportsPanel.css';
import './ManagementTableStyles.css';
import { formatDateMMDDYYYY } from './utils/stringUtils';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

interface StudentReport {
  _id: string;
  caseNo: string;
  date: string;
  reporterId: string;
  reporterName: string;
  reporterEnglishName?: string;
  studentId: string;
  studentName: string;
  studentEnglishName?: string;
  classId: string;
  className: string;
  levelName?: string;
  problems: string;
  solution?: string;
  status: 'pending' | 'observing' | 'solved';
  createdAt: string;
  updatedAt: string;
}

const ReportsPanel = () => {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'observing' | 'solved'>(
    'all'
  );
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudentReport>>({});

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('skillup_token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/student-reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusChange = async (reportId: string, newStatus: 'observing' | 'solved') => {
    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/student-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      // Update local state
      setReports((prev) =>
        prev.map((report) => (report._id === reportId ? { ...report, status: newStatus } : report))
      );

      alert(`Report status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update report status. Please try again.');
    }
  };

  const handleEditSolution = async () => {
    if (!editingReportId || !editForm.solution?.trim()) return;

    const token = localStorage.getItem('skillup_token');
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/student-reports/${editingReportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ solution: editForm.solution }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report solution');
      }

      // Update local state
      setReports((prev) =>
        prev.map((report) =>
          report._id === editingReportId ? { ...report, solution: editForm.solution } : report
        )
      );

      setEditingReportId(null);
      setEditForm({});
      alert('Report solution updated successfully');
    } catch (error) {
      console.error('Solution update error:', error);
      alert('Failed to update report solution. Please try again.');
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.caseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.studentEnglishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterEnglishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.problems.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.solution?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'observing':
        return 'status-observing';
      case 'solved':
        return 'status-solved';
      default:
        return 'status-pending';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'observing':
        return 'Observing';
      case 'solved':
        return 'Solved';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="management-panel">
        <div className="management-loading">
          <div className="management-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-panel">
        <div className="management-error">
          <h3>Error Loading Reports</h3>
          <p>{error}</p>
          <button type="button" className="management-retry-btn" onClick={fetchReports}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-panel">
      <div className="management-header">
        <h2 className="management-title">Student Reports</h2>
        <p className="management-subtitle">Track and manage student behavior reports</p>
      </div>

      <div className="reports-controls">
        <div className="search-section">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search by case number, student name, reporter, problems, or solution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search reports"
              title="Search by case number, student name, reporter, problems, or solution"
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

        <div className="filter-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="status-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="observing">Observing</option>
            <option value="solved">Solved</option>
          </select>
        </div>
      </div>

      <div className="management-table-container table-container theme-purple">
        <table className="management-table">
          <thead>
            <tr>
              <th>Case No.</th>
              <th>Date</th>
              <th>Reporter</th>
              <th>Student ID</th>
              <th>English Name</th>
              <th>Class</th>
              <th>Level</th>
              <th>Problems</th>
              <th>Solution</th>
              <th>Report Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No reports found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report._id}>
                  <td className="case-no-cell">
                    <strong>{report.caseNo}</strong>
                  </td>
                  <td>{formatDateMMDDYYYY(report.date)}</td>
                  <td className="reporter-cell">
                    <div className="reporter-name">{report.reporterName}</div>
                    {report.reporterEnglishName && (
                      <div className="english-name">({report.reporterEnglishName})</div>
                    )}
                  </td>
                  <td className="student-id-cell">
                    <strong>{report.studentId}</strong>
                  </td>
                  <td className="english-name-cell">{report.studentEnglishName || 'N/A'}</td>
                  <td className="class-cell">{report.className}</td>
                  <td className="level-cell">{report.levelName || 'Unknown'}</td>
                  <td className="problems-cell">
                    <div className="problems-text">{report.problems}</div>
                  </td>
                  <td className="solution-cell">
                    {editingReportId === report._id ? (
                      <div className="edit-solution">
                        <textarea
                          value={editForm.solution || ''}
                          onChange={(e) => setEditForm({ solution: e.target.value })}
                          className="solution-textarea"
                          placeholder="Enter solution..."
                          rows={3}
                        />
                        <div className="solution-actions">
                          <button
                            type="button"
                            onClick={handleEditSolution}
                            className="save-solution-btn"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReportId(null);
                              setEditForm({});
                            }}
                            className="cancel-solution-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="solution-display">
                        {report.solution ? (
                          <div className="solution-text">{report.solution}</div>
                        ) : (
                          <span className="no-solution">No solution yet</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReportId(report._id);
                            setEditForm({ solution: report.solution || '' });
                          }}
                          className="edit-solution-btn"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(report.status)}`}>
                      {getStatusDisplayName(report.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="status-actions">
                      {report.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(report._id, 'observing')}
                            className="status-btn observing-btn"
                            title="Mark as Observing"
                          >
                            Observing
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(report._id, 'solved')}
                            className="status-btn solved-btn"
                            title="Mark as Solved"
                          >
                            Solved
                          </button>
                        </>
                      )}
                      {report.status === 'observing' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(report._id, 'solved')}
                          className="status-btn solved-btn"
                          title="Mark as Solved"
                        >
                          Solved
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredReports.length > 0 && (
        <div className="reports-summary">
          <p>
            Showing {filteredReports.length} of {reports.length} reports
            {statusFilter !== 'all' && ` (${statusFilter} status)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;
