import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { format, subHours, startOfHour } from 'date-fns';

interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'critical';
  message: string;
  source: 'frontend' | 'backend' | 'database' | 'api';
  userId?: string;
  endpoint?: string;
  stackTrace?: string;
  userAgent?: string;
  ip?: string;
  resolved: boolean;
  count: number;
}

interface ErrorAnalytics {
  totalErrors: number;
  errorsByHour: Array<{ hour: string; count: number }>;
  errorsBySource: Array<{ source: string; count: number }>;
  errorsByLevel: Array<{ level: string; count: number }>;
  topErrors: Array<{ message: string; count: number; level: string }>;
  resolution_rate: number;
}

interface LogFilter {
  level: string[];
  source: string[];
  timeRange: '1h' | '6h' | '24h' | '7d';
  searchQuery: string;
  onlyUnresolved: boolean;
}

const AdvancedErrorTracking: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [analytics, setAnalytics] = useState<ErrorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [filter, setFilter] = useState<LogFilter>({
    level: ['error', 'warning', 'critical'],
    source: ['frontend', 'backend', 'database', 'api'],
    timeRange: '24h',
    searchQuery: '',
    onlyUnresolved: false
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Fetch error logs
  const fetchErrorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/error-logs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter)
      });

      if (response.ok) {
        const data = await response.json();
        setErrorLogs(data.logs || []);
        setAnalytics(data.analytics || null);
      } else {
        // Generate mock data for demonstration
        generateMockData();
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const mockLogs: ErrorLog[] = [];
    const sources = ['frontend', 'backend', 'database', 'api'] as const;
    const levels = ['error', 'warning', 'critical'] as const;
    const messages = [
      'Database connection timeout',
      'User authentication failed',
      'API rate limit exceeded',
      'Memory allocation error',
      'Network request failed',
      'Invalid JSON response',
      'File upload failed',
      'Session expired',
      'Permission denied',
      'Server overload detected'
    ];

    // Generate logs for the past 24 hours
    for (let i = 0; i < 50; i++) {
      const timestamp = Date.now() - Math.random() * 24 * 60 * 60 * 1000;
      mockLogs.push({
        id: `error-${i}`,
        timestamp,
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        userId: Math.random() > 0.7 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
        endpoint: Math.random() > 0.5 ? `/api/endpoint-${Math.floor(Math.random() * 10)}` : undefined,
        resolved: Math.random() > 0.3,
        count: Math.floor(Math.random() * 10) + 1,
        stackTrace: Math.random() > 0.6 ? 'Error at line 123 in file.js\\n  at function()\\n  at handler()' : undefined
      });
    }

    // Sort by timestamp (newest first)
    mockLogs.sort((a, b) => b.timestamp - a.timestamp);
    setErrorLogs(mockLogs);

    // Generate analytics
    const analytics: ErrorAnalytics = {
      totalErrors: mockLogs.length,
      errorsByHour: generateHourlyData(mockLogs),
      errorsBySource: generateSourceData(mockLogs),
      errorsByLevel: generateLevelData(mockLogs),
      topErrors: generateTopErrors(mockLogs),
      resolution_rate: (mockLogs.filter(log => log.resolved).length / mockLogs.length) * 100
    };
    setAnalytics(analytics);
  };

  const generateHourlyData = (logs: ErrorLog[]) => {
    const hourly = new Map<string, number>();
    const now = new Date();
    
    // Initialize past 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = startOfHour(subHours(now, i));
      hourly.set(format(hour, 'HH:mm'), 0);
    }

    // Count errors by hour
    logs.forEach(log => {
      const hour = format(startOfHour(new Date(log.timestamp)), 'HH:mm');
      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    });

    return Array.from(hourly.entries()).map(([hour, count]) => ({ hour, count }));
  };

  const generateSourceData = (logs: ErrorLog[]) => {
    const sources = new Map<string, number>();
    logs.forEach(log => {
      sources.set(log.source, (sources.get(log.source) || 0) + 1);
    });
    return Array.from(sources.entries()).map(([source, count]) => ({ source, count }));
  };

  const generateLevelData = (logs: ErrorLog[]) => {
    const levels = new Map<string, number>();
    logs.forEach(log => {
      levels.set(log.level, (levels.get(log.level) || 0) + 1);
    });
    return Array.from(levels.entries()).map(([level, count]) => ({ level, count }));
  };

  const generateTopErrors = (logs: ErrorLog[]) => {
    const errors = new Map<string, { count: number; level: string }>();
    logs.forEach(log => {
      const existing = errors.get(log.message);
      if (existing) {
        existing.count += log.count;
      } else {
        errors.set(log.message, { count: log.count, level: log.level });
      }
    });
    return Array.from(errors.entries())
      .map(([message, data]) => ({ message, count: data.count, level: data.level }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Filter logs based on current filter settings
  const filteredLogs = useMemo(() => {
    return errorLogs.filter(log => {
      if (!filter.level.includes(log.level)) return false;
      if (!filter.source.includes(log.source)) return false;
      if (filter.onlyUnresolved && log.resolved) return false;
      if (filter.searchQuery && !log.message.toLowerCase().includes(filter.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [errorLogs, filter]);

  // Mark error as resolved
  const markResolved = async (errorId: string) => {
    try {
      const token = localStorage.getItem('skillup_token');
      await fetch(`${API_BASE_URL}/admin/error-logs/${errorId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Update local state
      setErrorLogs(prev => prev.map(log => 
        log.id === errorId ? { ...log, resolved: true } : log
      ));
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  // Chart configurations
  const errorTrendChartData = {
    labels: analytics?.errorsByHour.map(d => d.hour) || [],
    datasets: [
      {
        label: 'Errors per Hour',
        data: analytics?.errorsByHour.map(d => d.count) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const errorSourceChartData = {
    labels: analytics?.errorsBySource.map(d => d.source.toUpperCase()) || [],
    datasets: [
      {
        data: analytics?.errorsBySource.map(d => d.count) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const getErrorIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🔴';
      case 'error': return '🟠';
      case 'warning': return '🟡';
      default: return 'ℹ️';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'frontend': return '🖥️';
      case 'backend': return '⚙️';
      case 'database': return '🗄️';
      case 'api': return '🌐';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="error-tracking-loading">
        <div className="loading-spinner-large"></div>
        <h3>Loading Error Analytics</h3>
        <p>Analyzing system logs...</p>
      </div>
    );
  }

  return (
    <div className="advanced-error-tracking">
      {/* Header with Analytics Summary */}
      <div className="error-tracking-header">
        <div className="error-analytics-summary">
          <div className="analytics-card">
            <div className="analytics-icon">🚨</div>
            <div className="analytics-content">
              <h4>Total Errors</h4>
              <span className="analytics-value">{analytics?.totalErrors || 0}</span>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">✅</div>
            <div className="analytics-content">
              <h4>Resolution Rate</h4>
              <span className="analytics-value">{analytics?.resolution_rate.toFixed(1) || 0}%</span>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">⏱️</div>
            <div className="analytics-content">
              <h4>Last 24h</h4>
              <span className="analytics-value">{filteredLogs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="error-charts-section">
        <div className="error-chart-container">
          <h4>Error Trend (24 Hours)</h4>
          <Line data={errorTrendChartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }} />
        </div>
        <div className="error-chart-container">
          <h4>Errors by Source</h4>
          <Bar data={errorSourceChartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }} />
        </div>
      </div>

      {/* Top Errors Section */}
      {analytics?.topErrors && analytics.topErrors.length > 0 && (
        <div className="top-errors-section">
          <h4>🔥 Most Frequent Errors</h4>
          <div className="top-errors-list">
            {analytics.topErrors.map((error, index) => (
              <div key={index} className={`top-error-item level-${error.level}`}>
                <div className="error-rank">#{index + 1}</div>
                <div className="error-details">
                  <span className="error-message">{error.message}</span>
                  <span className="error-count">{error.count} occurrences</span>
                </div>
                <div className="error-level">{getErrorIcon(error.level)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="error-filters">
        <div className="filter-group">
          <label>Level:</label>
          <div className="filter-checkboxes">
            {['critical', 'error', 'warning'].map(level => (
              <label key={level} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filter.level.includes(level)}
                  onChange={(e) => {
                    const newLevels = e.target.checked
                      ? [...filter.level, level]
                      : filter.level.filter(l => l !== level);
                    setFilter(prev => ({ ...prev, level: newLevels }));
                  }}
                />
                {getErrorIcon(level)} {level.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Source:</label>
          <div className="filter-checkboxes">
            {['frontend', 'backend', 'database', 'api'].map(source => (
              <label key={source} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filter.source.includes(source)}
                  onChange={(e) => {
                    const newSources = e.target.checked
                      ? [...filter.source, source]
                      : filter.source.filter(s => s !== source);
                    setFilter(prev => ({ ...prev, source: newSources }));
                  }}
                />
                {getSourceIcon(source)} {source.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search error messages..."
            value={filter.searchQuery}
            onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filter.onlyUnresolved}
              onChange={(e) => setFilter(prev => ({ ...prev, onlyUnresolved: e.target.checked }))}
            />
            Show only unresolved
          </label>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="error-logs-table">
        <div className="error-logs-header">
          <h4>Error Logs ({filteredLogs.length})</h4>
        </div>
        <div className="error-logs-list">
          {filteredLogs.map(log => (
            <div 
              key={log.id} 
              className={`error-log-item level-${log.level} ${log.resolved ? 'resolved' : ''}`}
              onClick={() => setSelectedError(log)}
            >
              <div className="error-log-main">
                <div className="error-log-icon">
                  {getErrorIcon(log.level)}
                </div>
                <div className="error-log-content">
                  <div className="error-log-message">{log.message}</div>
                  <div className="error-log-meta">
                    <span className="error-source">{getSourceIcon(log.source)} {log.source}</span>
                    <span className="error-time">{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</span>
                    {log.count > 1 && <span className="error-count">×{log.count}</span>}
                    {log.endpoint && <span className="error-endpoint">{log.endpoint}</span>}
                  </div>
                </div>
                <div className="error-log-actions">
                  {!log.resolved && (
                    <button
                      className="resolve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markResolved(log.id);
                      }}
                    >
                      ✅ Resolve
                    </button>
                  )}
                  {log.resolved && <span className="resolved-badge">✅ Resolved</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="error-detail-modal" onClick={() => setSelectedError(null)}>
          <div className="error-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="error-detail-header">
              <h3>{getErrorIcon(selectedError.level)} Error Details</h3>
              <button onClick={() => setSelectedError(null)}>✕</button>
            </div>
            <div className="error-detail-body">
              <div className="error-detail-field">
                <label>Message:</label>
                <span>{selectedError.message}</span>
              </div>
              <div className="error-detail-field">
                <label>Level:</label>
                <span className={`level-badge level-${selectedError.level}`}>
                  {selectedError.level.toUpperCase()}
                </span>
              </div>
              <div className="error-detail-field">
                <label>Source:</label>
                <span>{getSourceIcon(selectedError.source)} {selectedError.source}</span>
              </div>
              <div className="error-detail-field">
                <label>Timestamp:</label>
                <span>{format(new Date(selectedError.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
              </div>
              {selectedError.userId && (
                <div className="error-detail-field">
                  <label>User ID:</label>
                  <span>{selectedError.userId}</span>
                </div>
              )}
              {selectedError.endpoint && (
                <div className="error-detail-field">
                  <label>Endpoint:</label>
                  <span className="endpoint-code">{selectedError.endpoint}</span>
                </div>
              )}
              {selectedError.stackTrace && (
                <div className="error-detail-field">
                  <label>Stack Trace:</label>
                  <pre className="stack-trace">{selectedError.stackTrace}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedErrorTracking;