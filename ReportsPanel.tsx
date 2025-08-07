import { useState, useEffect } from 'react';
import './ReportsPanel.css';

interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  englishName?: string;
  level: string;
  className: string;
  problem: string;
  reportedBy: string;
  reportedAt: string;
  status: '!!!' | 'solved';
  solution?: string;
}

const ReportsPanel = ({ isAdmin: _isAdmin, onDataRefresh: _onDataRefresh }: { isAdmin: boolean, onDataRefresh?: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [solutionNote, setSolutionNote] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('skillup_token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/student-records/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data || []);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: '!!!' | 'solved', solution?: string) => {
    try {
      const token = localStorage.getItem('skillup_token');
      if (!token) {
        alert('No authentication token found');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
      const response = await fetch(`${apiUrl}/student-records/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, solution }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, solution: solution || report.solution }
          : report
      ));

      setSelectedReport(null);
      setSolutionNote('');
      alert('Report status updated successfully!');
    } catch (error) {
      console.error('Update report status error:', error);
      alert('Failed to update report status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="reports-panel">
        <div className="reports-loading">
          <div className="reports-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-panel">
        <div className="reports-error">
          <h3>Error Loading Reports</h3>
          <p>{error}</p>
          <button 
            className="reports-retry-btn"
            onClick={fetchReports}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-panel">
      <div className="reports-header">
        <h2 className="reports-title">Student Reports</h2>
        <p className="reports-subtitle">Manage student behavior and academic reports</p>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Reported By</th>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>English Name</th>
              <th>Level</th>
              <th>Class</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-table">
                  <p>No reports found.</p>
                </td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report.id} className="report-row">
                  <td>{new Date(report.reportedAt).toLocaleString()}</td>
                  <td>{report.reportedBy}</td>
                  <td>{report.studentId}</td>
                  <td>{report.studentName}</td>
                  <td>{report.englishName || 'N/A'}</td>
                  <td>{report.level}</td>
                  <td>{report.className}</td>
                  <td>
                    <span className={`status-badge ${report.status === '!!!' ? 'urgent' : 'solved'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn view-btn"
                      onClick={() => setSelectedReport(report)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="report-details-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setSelectedReport(null); setSolutionNote(''); }}>×</button>
            <h3>Report Details</h3>
            
            <div className="report-info">
              <div className="info-row">
                <strong>Student:</strong> {selectedReport.studentName} {selectedReport.englishName ? `(${selectedReport.englishName})` : ''}
              </div>
              <div className="info-row">
                <strong>Level:</strong> {selectedReport.level}
              </div>
              <div className="info-row">
                <strong>Class:</strong> {selectedReport.className}
              </div>
              <div className="info-row">
                <strong>Reported By:</strong> {selectedReport.reportedBy}
              </div>
              <div className="info-row">
                <strong>Date:</strong> {new Date(selectedReport.reportedAt).toLocaleString()}
              </div>
              <div className="info-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedReport.status === '!!!' ? 'urgent' : 'solved'}`}>
                  {selectedReport.status}
                </span>
              </div>
            </div>
            
            <div className="problem-section">
              <h4>Problem:</h4>
              <p>{selectedReport.problem}</p>
            </div>

            {selectedReport.solution && (
              <div className="solution-section">
                <h4>Solution:</h4>
                <p>{selectedReport.solution}</p>
              </div>
            )}

            {selectedReport.status === '!!!' && (
              <div className="solution-input-section">
                <h4>Add Solution:</h4>
                <textarea
                  value={solutionNote}
                  onChange={(e) => setSolutionNote(e.target.value)}
                  placeholder="Enter solution or resolution..."
                  rows={4}
                  className="solution-textarea"
                />
                <div className="modal-actions">
                  <button 
                    className="action-btn solve-btn"
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'solved', solutionNote)}
                  >
                    Mark as Solved
                  </button>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => { setSelectedReport(null); setSolutionNote(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPanel; 