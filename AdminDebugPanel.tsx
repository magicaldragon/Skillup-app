import { useState, useEffect } from 'react';
import './Sidebar.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ServiceUsage {
  firebaseRequests: number;
  vstorageRequests: number;
  lastReset: string;
  estimatedCost: string;
}

const AdminDebugPanel = ({ activeKey }: { activeKey: string }) => {
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeKey === 'admin-debug-api-usage') {
      fetchServiceUsage();
    }
  }, [activeKey]);

  const fetchServiceUsage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching service usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (activeKey === 'admin-debug-api-usage') {
    return (
      <div className="admin-debug-panel">
        <h2>Service Usage Monitoring</h2>
        <div className="admin-debug-section">
          <h3>Cost Tracking</h3>
          {loading ? (
            <p>Loading usage data...</p>
          ) : serviceUsage ? (
            <div className="usage-stats">
              <div className="usage-stat">
                <strong>Firebase Requests:</strong> {serviceUsage.firebaseRequests}
              </div>
              <div className="usage-stat">
                <strong>VNG vStorage Requests:</strong> {serviceUsage.vstorageRequests}
              </div>
              <div className="usage-stat">
                <strong>Estimated Cost:</strong> {serviceUsage.estimatedCost}
              </div>
              <div className="usage-stat">
                <strong>Last Reset:</strong> {new Date(serviceUsage.lastReset).toLocaleString()}
              </div>
              <div className="usage-warning">
                <strong>⚠️ Free Tier Limits:</strong>
                <ul>
                  <li>Firebase: 50,000 reads/day, 20,000 writes/day</li>
                  <li>VNG vStorage: 5GB storage, 20,000 requests/month</li>
                  <li>MongoDB: 512MB storage</li>
                </ul>
              </div>
            </div>
          ) : (
            <p>Failed to load usage data</p>
          )}
          <button onClick={fetchServiceUsage} disabled={loading} className="form-btn">
            Refresh Usage Data
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminDebugPanel; 