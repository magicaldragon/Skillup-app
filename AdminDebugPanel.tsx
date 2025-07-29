import React, { useState, useEffect } from 'react';
import SystemHealthPanel from './admin-debug/SystemHealthPanel';
import ApiErrorLogsPanel from './admin-debug/ApiErrorLogsPanel';
import UserSyncStatusPanel from './admin-debug/UserSyncStatusPanel';
import ManualToolsPanel from './admin-debug/ManualToolsPanel';
import FrontendStatusPanel from './admin-debug/FrontendStatusPanel';
import BackendStatusPanel from './admin-debug/BackendStatusPanel';
import type { Student } from './types';
import './Sidebar.css';

const panels = {
  'admin-debug-health': <SystemHealthPanel />,
  'admin-debug-errors': <ApiErrorLogsPanel />,
  'admin-debug-sync': <UserSyncStatusPanel />,
  'admin-debug-tools': <ManualToolsPanel />,
  'admin-debug-frontend': <FrontendStatusPanel />,
  'admin-debug-backend': <BackendStatusPanel />,
};

const API_BASE_URL = 'https://skillup-backend-v6vm.onrender.com/api';

interface ApiUsage {
  geminiRequests: number;
  lastReset: string;
  estimatedCost: string;
}

const AdminDebugPanel = ({ activeKey }: { activeKey: string }) => {
  const [apiUsage, setApiUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeKey === 'admin-debug-api-usage') {
      fetchApiUsage();
    }
  }, [activeKey]);

  const fetchApiUsage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (activeKey === 'admin-debug-api-usage') {
    return (
      <div className="admin-debug-panel">
        <h2>API Usage Monitoring</h2>
        <div className="admin-debug-section">
          <h3>Cost Tracking</h3>
          {loading ? (
            <p>Loading usage data...</p>
          ) : apiUsage ? (
            <div className="usage-stats">
              <div className="usage-stat">
                <strong>Gemini API Requests:</strong> {apiUsage.geminiRequests}
              </div>
              <div className="usage-stat">
                <strong>Estimated Cost:</strong> {apiUsage.estimatedCost}
              </div>
              <div className="usage-stat">
                <strong>Last Reset:</strong> {new Date(apiUsage.lastReset).toLocaleString()}
              </div>
              <div className="usage-warning">
                <strong>⚠️ Free Tier Limits:</strong>
                <ul>
                  <li>Gemini: 15 requests/minute, 1,500 requests/day</li>
                  <li>MongoDB: 512MB storage</li>
                  <li>Render: 750 hours/month</li>
                </ul>
              </div>
            </div>
          ) : (
            <p>Failed to load usage data</p>
          )}
          <button onClick={fetchApiUsage} disabled={loading} className="form-btn">
            Refresh Usage Data
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminDebugPanel; 