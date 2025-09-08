import { useCallback, useEffect, useState } from 'react';
import './Sidebar.css';
import './AdminDebugPanel.css';
import AdminAccountCreator from './AdminAccountCreator';
import ApiErrorLogsPanel from './admin-debug/ApiErrorLogsPanel';
import FrontendStatusPanel from './admin-debug/FrontendStatusPanel';
import BackendStatusPanel from './admin-debug/BackendStatusPanel';
import ManualToolsPanel from './admin-debug/ManualToolsPanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ServiceUsage {
  firebaseRequests: number;
  vstorageRequests: number;
  lastReset: string;
  estimatedCost: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  dbConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
}

interface UserSyncStatus {
  totalUsers: number;
  syncedUsers: number;
  pendingSync: number;
  lastSyncTime: string;
  syncErrors: Array<{
    userId: string;
    error: string;
    timestamp: string;
  }>;
}

const AdminDebugPanel = ({ activeKey }: { activeKey: string }) => {
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [userSyncStatus, setUserSyncStatus] = useState<UserSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServiceUsage(data.usage || {
          firebaseRequests: 0,
          vstorageRequests: 0,
          lastReset: new Date().toISOString(),
          estimatedCost: '$0.00'
        });
      } else {
        setError('Failed to fetch service usage data');
      }
    } catch (error) {
      console.error('Error fetching service usage:', error);
      setError('Network error while fetching usage data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/health`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.health || {
          status: 'warning',
          uptime: '0 minutes',
          memoryUsage: 0,
          cpuUsage: 0,
          dbConnections: 0,
          activeUsers: 0,
          responseTime: 0,
          errorRate: 0
        });
      } else {
        setError('Failed to fetch system health data');
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      setError('Network error while fetching health data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserSyncStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/user-sync`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserSyncStatus(data.syncStatus || {
          totalUsers: 0,
          syncedUsers: 0,
          pendingSync: 0,
          lastSyncTime: new Date().toISOString(),
          syncErrors: []
        });
      } else {
        setError('Failed to fetch user sync status');
      }
    } catch (error) {
      console.error('Error fetching user sync status:', error);
      setError('Network error while fetching sync status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch appropriate data based on active panel
    if (activeKey === 'admin-debug-health') {
      fetchSystemHealth();
    } else if (activeKey === 'admin-debug-sync') {
      fetchUserSyncStatus();
    } else if (activeKey === 'admin-debug-api-usage') {
      fetchServiceUsage();
    }
  }, [activeKey, fetchSystemHealth, fetchUserSyncStatus, fetchServiceUsage]);

  // Render different panels based on activeKey
  if (activeKey === 'admin-debug-health') {
    return (
      <div className="admin-debug-panel">
        <div className="debug-panel-header">
          <h2 className="debug-panel-title">System Health Monitor</h2>
          <p className="debug-panel-subtitle">Real-time system performance and health metrics</p>
        </div>
        
        {error && (
          <div className="debug-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              className="error-dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="debug-loading">
            <div className="loading-spinner"></div>
            <p>Loading system health data...</p>
          </div>
        ) : systemHealth ? (
          <div className="health-dashboard">
            <div className="health-status-card">
              <div className={`status-indicator status-${systemHealth.status}`}>
                <div className="status-dot"></div>
                <span className="status-text">
                  {systemHealth.status === 'healthy' ? '🟢 System Healthy' : 
                   systemHealth.status === 'warning' ? '🟡 Warning' : '🔴 Critical'}
                </span>
              </div>
            </div>
            
            <div className="health-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">⏱️</div>
                <div className="metric-content">
                  <h4>Uptime</h4>
                  <span className="metric-value">{systemHealth.uptime}</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">🧠</div>
                <div className="metric-content">
                  <h4>Memory Usage</h4>
                  <span className="metric-value">{systemHealth.memoryUsage}%</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${systemHealth.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <h4>CPU Usage</h4>
                  <span className="metric-value">{systemHealth.cpuUsage}%</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${systemHealth.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">🔗</div>
                <div className="metric-content">
                  <h4>DB Connections</h4>
                  <span className="metric-value">{systemHealth.dbConnections}</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h4>Active Users</h4>
                  <span className="metric-value">{systemHealth.activeUsers}</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">🚀</div>
                <div className="metric-content">
                  <h4>Response Time</h4>
                  <span className="metric-value">{systemHealth.responseTime}ms</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <h4>Error Rate</h4>
                  <span className="metric-value">{systemHealth.errorRate}%</span>
                </div>
              </div>
            </div>
            
            <div className="health-actions">
              <button 
                type="button" 
                onClick={fetchSystemHealth} 
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? '🔄 Refreshing...' : '🔄 Refresh Health Data'}
              </button>
            </div>
          </div>
        ) : (
          <div className="debug-empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Health Data Available</h3>
            <p>System health monitoring is not currently active</p>
            <button 
              type="button" 
              onClick={fetchSystemHealth}
              className="retry-btn"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeKey === 'admin-debug-errors') {
    return <ApiErrorLogsPanel />;
  }

  if (activeKey === 'admin-debug-sync') {
    return (
      <div className="admin-debug-panel">
        <div className="debug-panel-header">
          <h2 className="debug-panel-title">User Sync Status</h2>
          <p className="debug-panel-subtitle">Monitor user synchronization between systems</p>
        </div>
        
        {error && (
          <div className="debug-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              className="error-dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="debug-loading">
            <div className="loading-spinner"></div>
            <p>Loading user sync status...</p>
          </div>
        ) : userSyncStatus ? (
          <div className="sync-dashboard">
            <div className="sync-overview">
              <div className="sync-stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h4>Total Users</h4>
                  <span className="stat-value">{userSyncStatus.totalUsers}</span>
                </div>
              </div>
              
              <div className="sync-stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <h4>Synced Users</h4>
                  <span className="stat-value">{userSyncStatus.syncedUsers}</span>
                </div>
              </div>
              
              <div className="sync-stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h4>Pending Sync</h4>
                  <span className="stat-value">{userSyncStatus.pendingSync}</span>
                </div>
              </div>
            </div>
            
            <div className="sync-progress">
              <h4>Sync Progress</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(userSyncStatus.syncedUsers / userSyncStatus.totalUsers) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round((userSyncStatus.syncedUsers / userSyncStatus.totalUsers) * 100)}% Complete
              </span>
            </div>
            
            <div className="sync-details">
              <h4>Last Sync: {new Date(userSyncStatus.lastSyncTime).toLocaleString()}</h4>
              
              {userSyncStatus.syncErrors.length > 0 && (
                <div className="sync-errors">
                  <h4>⚠️ Sync Errors ({userSyncStatus.syncErrors.length})</h4>
                  <div className="error-list">
                    {userSyncStatus.syncErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="error-item">
                        <div className="error-user">User: {error.userId}</div>
                        <div className="error-message">{error.error}</div>
                        <div className="error-time">{new Date(error.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="sync-actions">
              <button 
                type="button" 
                onClick={fetchUserSyncStatus} 
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? '🔄 Refreshing...' : '🔄 Refresh Sync Status'}
              </button>
            </div>
          </div>
        ) : (
          <div className="debug-empty-state">
            <div className="empty-icon">🔄</div>
            <h3>No Sync Data Available</h3>
            <p>User synchronization monitoring is not currently active</p>
            <button 
              type="button" 
              onClick={fetchUserSyncStatus}
              className="retry-btn"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeKey === 'admin-debug-tools') {
    return <ManualToolsPanel />;
  }

  if (activeKey === 'admin-debug-frontend') {
    return <FrontendStatusPanel />;
  }

  if (activeKey === 'admin-debug-backend') {
    return <BackendStatusPanel />;
  }
  if (activeKey === 'admin-debug-api-usage') {
    return (
      <div className="admin-debug-panel">
        <div className="debug-panel-header">
          <h2 className="debug-panel-title">Service Usage Monitoring</h2>
          <p className="debug-panel-subtitle">Track API usage and associated costs</p>
        </div>
        
        {error && (
          <div className="debug-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => setError(null)}
              className="error-dismiss"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="admin-debug-section">
          {loading ? (
            <div className="debug-loading">
              <div className="loading-spinner"></div>
              <p>Loading usage data...</p>
            </div>
          ) : serviceUsage ? (
            <div className="usage-dashboard">
              <div className="usage-stats">
                <div className="usage-stat">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-content">
                    <h4>Firebase Requests</h4>
                    <span className="stat-value">{serviceUsage.firebaseRequests.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="usage-stat">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h4>VNG vStorage Requests</h4>
                    <span className="stat-value">{serviceUsage.vstorageRequests.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="usage-stat">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h4>Estimated Cost</h4>
                    <span className="stat-value">{serviceUsage.estimatedCost}</span>
                  </div>
                </div>
                
                <div className="usage-stat">
                  <div className="stat-icon">🔄</div>
                  <div className="stat-content">
                    <h4>Last Reset</h4>
                    <span className="stat-value">
                      {new Date(serviceUsage.lastReset).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="usage-warning">
                <h4>⚠️ Free Tier Limits</h4>
                <ul className="limits-list">
                  <li>🔥 Firebase: 50,000 reads/day, 20,000 writes/day</li>
                  <li>📊 VNG vStorage: 5GB storage, 20,000 requests/month</li>
                  <li>💾 MongoDB: 512MB storage</li>
                </ul>
              </div>
              
              <div className="usage-actions">
                <button 
                  type="button" 
                  onClick={fetchServiceUsage} 
                  disabled={loading} 
                  className="refresh-btn"
                >
                  {loading ? '🔄 Refreshing...' : '🔄 Refresh Usage Data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="debug-empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Usage Data Available</h3>
              <p>API usage monitoring is not currently active</p>
              <button 
                type="button" 
                onClick={fetchServiceUsage}
                className="retry-btn"
              >
                🔄 Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeKey === 'admin-debug-account-creator') {
    return (
      <div className="admin-debug-panel">
        <div className="debug-panel-header">
          <h2 className="debug-panel-title">Admin Account Creator</h2>
          <p className="debug-panel-subtitle">Create new administrator accounts for system access</p>
        </div>
        <AdminAccountCreator />
      </div>
    );
  }

  // Default debug panel view
  return (
    <div className="admin-debug-panel">
      <div className="debug-panel-header">
        <h2 className="debug-panel-title">Admin Debug Panel</h2>
        <p className="debug-panel-subtitle">Comprehensive system monitoring and debugging tools</p>
      </div>
      
      <div className="debug-overview">
        <div className="debug-feature-cards">
          <div className="feature-card" onClick={() => window.location.hash = 'admin-debug-health'}>
            <div className="feature-icon">🟢</div>
            <h3>System Health</h3>
            <p>Monitor real-time system performance metrics</p>
          </div>
          
          <div className="feature-card" onClick={() => window.location.hash = 'admin-debug-errors'}>
            <div className="feature-icon">⚠️</div>
            <h3>Error Logs</h3>
            <p>View and analyze API error logs</p>
          </div>
          
          <div className="feature-card" onClick={() => window.location.hash = 'admin-debug-sync'}>
            <div className="feature-icon">🔄</div>
            <h3>User Sync</h3>
            <p>Track user synchronization status</p>
          </div>
          
          <div className="feature-card" onClick={() => window.location.hash = 'admin-debug-tools'}>
            <div className="feature-icon">🔧</div>
            <h3>Manual Tools</h3>
            <p>Access debugging and maintenance tools</p>
          </div>
        </div>
        
        <div className="debug-quick-stats">
          <h3>Quick System Overview</h3>
          <div className="quick-stat">
            <span className="stat-label">System Status:</span>
            <span className="stat-value status-healthy">🟢 Operational</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Debug Panel Version:</span>
            <span className="stat-value">v2.0.0</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebugPanel;
