import React, { useState, useEffect } from 'react';
import type { Student } from './types';
import './RecordsPanel.css';

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

interface Record {
  id: string;
  studentId: string;
  studentName: string;
  action: string;
  details: string;
  date: string;
  performedBy: string;
}

const RecordsPanel = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'assignments' | 'deletions' | 'updates'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/change-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }

      const data = await response.json();
      if (data.success) {
        setRecords(data.logs || []);
      } else {
        throw new Error(data.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Fetch records error:', error);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || 
      (filter === 'assignments' && record.action.includes('assign')) ||
      (filter === 'deletions' && record.action.includes('delete')) ||
      (filter === 'updates' && record.action.includes('update'));
    
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'records-action-delete';
    if (action.includes('assign')) return 'records-action-assign';
    if (action.includes('update')) return 'records-action-update';
    return 'records-action-default';
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
          <button 
            className="records-retry-btn"
            onClick={fetchRecords}
          >
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
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="records-search-input"
          />
        </div>
        
        <div className="records-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="records-filter-select"
          >
            <option value="all">All Actions</option>
            <option value="assignments">Assignments</option>
            <option value="deletions">Deletions</option>
            <option value="updates">Updates</option>
          </select>
        </div>
      </div>

      <div className="records-stats">
        <div className="records-stat">
          <span className="records-stat-label">Total Records</span>
          <span className="records-stat-value">{records.length}</span>
        </div>
        <div className="records-stat">
          <span className="records-stat-label">Filtered</span>
          <span className="records-stat-value">{filteredRecords.length}</span>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="records-empty">
          <p>No records found matching your criteria.</p>
        </div>
      ) : (
        <div className="records-list">
          {filteredRecords.map((record) => (
            <div key={record.id} className="records-item">
              <div className="records-item-header">
                <span className={`records-action ${getActionColor(record.action)}`}>
                  {record.action}
                </span>
                <span className="records-date">{formatDate(record.date)}</span>
              </div>
              
              <div className="records-item-content">
                <div className="records-student-info">
                  <strong>Student:</strong> {record.studentName}
                </div>
                <div className="records-details">
                  <strong>Details:</strong> {record.details}
                </div>
                <div className="records-performed-by">
                  <strong>Performed by:</strong> {record.performedBy}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="records-footer">
        <button 
          className="records-refresh-btn"
          onClick={fetchRecords}
        >
          Refresh Records
        </button>
      </div>
    </div>
  );
};

export default RecordsPanel;