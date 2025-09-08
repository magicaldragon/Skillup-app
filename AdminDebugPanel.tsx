import { useState } from 'react';
import './Sidebar.css';
import { formatDateDDMMYYYY } from './utils/stringUtils';
import './admin-debug/DebugPanelStyles.css';
import './admin-debug/RealtimeMonitoringDashboard.css';
import AdminAccountCreator from './AdminAccountCreator';
import FrontendStatusPanel from './admin-debug/FrontendStatusPanel';
import BackendStatusPanel from './admin-debug/BackendStatusPanel';
import ManualToolsPanel from './admin-debug/ManualToolsPanel';
import RealtimeMonitoringDashboard from './admin-debug/RealtimeMonitoringDashboard';
import AdvancedErrorTracking from './admin-debug/AdvancedErrorTracking';
import SystemPerformanceDashboard from './admin-debug/SystemPerformanceDashboard';



const AdminDebugPanel = ({ activeKey }: { activeKey: string }) => {
  const [serviceUsage] = useState({
    firebaseRequests: 12847,
    vstorageRequests: 8291,
    lastReset: new Date().toISOString(),
    estimatedCost: '$8.42'
  });
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceUsage = () => {
    // Mock function for service usage fetching
    console.log('Fetching service usage data...');
  };

  // Main real-time monitoring dashboard
  if (activeKey === 'admin-debug-health') {
    return <RealtimeMonitoringDashboard />;
  }

  // Advanced error tracking and analysis
  if (activeKey === 'admin-debug-errors') {
    return <AdvancedErrorTracking />;
  }

  // System performance metrics
  if (activeKey === 'admin-debug-performance' || activeKey === 'admin-debug-sync') {
    return <SystemPerformanceDashboard />;
  }

  // Manual debugging tools
  if (activeKey === 'admin-debug-tools') {
    return <ManualToolsPanel />;
  }

  // Frontend status monitoring
  if (activeKey === 'admin-debug-frontend') {
    return <FrontendStatusPanel />;
  }

  // Backend status monitoring
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
                     {formatDateDDMMYYYY(serviceUsage.lastReset)}
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
