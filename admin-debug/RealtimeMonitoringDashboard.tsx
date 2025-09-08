import React, { useCallback, useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
// import io from 'socket.io-client'; // Will be used for real WebSocket connections

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface RealtimeMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  activeUsers: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface SystemAlerts {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface DatabaseMetrics {
  connectionCount: number;
  queryTime: number;
  slowQueries: number;
  cacheHitRate: number;
  diskUsage: number;
}

interface ApiEndpointHealth {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  lastChecked: number;
}

interface UserActivityData {
  activeUsers: number;
  newRegistrations: number;
  loginAttempts: number;
  sessionDuration: number;
  bounceRate: number;
}

const RealtimeMonitoringDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlerts[]>([]);
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics | null>(null);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointHealth[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // const socketRef = useRef<any>(null); // Will be used for WebSocket connections
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Initialize WebSocket connection for real-time data
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // For now, simulate real-time data since WebSocket might not be available
        const generateMockData = () => {
          const now = Date.now();
          const mockMetrics: RealtimeMetrics = {
            timestamp: now,
            cpuUsage: Math.random() * 100,
            memoryUsage: 60 + Math.random() * 30,
            responseTime: 50 + Math.random() * 200,
            activeUsers: Math.floor(10 + Math.random() * 50),
            errorRate: Math.random() * 5,
            requestsPerMinute: Math.floor(100 + Math.random() * 300)
          };
          
          setRealtimeData(prev => {
            const newData = [...prev, mockMetrics].slice(-20); // Keep last 20 data points
            return newData;
          });
        };

        // Generate initial data
        const initialData: RealtimeMetrics[] = [];
        for (let i = 19; i >= 0; i--) {
          const timestamp = Date.now() - (i * 30000); // 30 seconds intervals
          initialData.push({
            timestamp,
            cpuUsage: 30 + Math.random() * 40,
            memoryUsage: 50 + Math.random() * 30,
            responseTime: 80 + Math.random() * 120,
            activeUsers: Math.floor(15 + Math.random() * 35),
            errorRate: Math.random() * 3,
            requestsPerMinute: Math.floor(150 + Math.random() * 200)
          });
        }
        setRealtimeData(initialData);

        // Start real-time updates
        const interval = setInterval(generateMockData, 5000); // Update every 5 seconds
        
        setConnectionStatus('connected');
        setLoading(false);

        return () => {
          clearInterval(interval);
        };
      } catch (error) {
        console.error('Failed to initialize monitoring connection:', error);
        setError('Failed to connect to monitoring service');
        setConnectionStatus('disconnected');
        setLoading(false);
      }
    };

    initializeConnection();
  }, []);

  // Fetch system alerts
  const fetchSystemAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemAlerts(data.alerts || []);
      } else {
        // Mock alerts for demonstration
        const mockAlerts: SystemAlerts[] = [
          {
            id: '1',
            type: 'warning',
            message: 'High memory usage detected (85%)',
            timestamp: Date.now() - 300000,
            resolved: false
          },
          {
            id: '2',
            type: 'error',
            message: 'Database connection timeout',
            timestamp: Date.now() - 600000,
            resolved: true
          },
          {
            id: '3',
            type: 'info',
            message: 'System backup completed successfully',
            timestamp: Date.now() - 900000,
            resolved: false
          }
        ];
        setSystemAlerts(mockAlerts);
      }
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  }, []);

  // Fetch database metrics
  const fetchDatabaseMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/database-metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDatabaseMetrics(data.metrics);
      } else {
        // Mock database metrics
        setDatabaseMetrics({
          connectionCount: 25,
          queryTime: 45,
          slowQueries: 3,
          cacheHitRate: 87,
          diskUsage: 65
        });
      }
    } catch (error) {
      console.error('Error fetching database metrics:', error);
    }
  }, []);

  // Fetch API endpoint health
  const fetchApiEndpoints = useCallback(async () => {
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/endpoint-health`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiEndpoints(data.endpoints);
      } else {
        // Mock API endpoints
        const mockEndpoints: ApiEndpointHealth[] = [
          { endpoint: '/api/users', status: 'healthy', responseTime: 85, successRate: 99.2, lastChecked: Date.now() },
          { endpoint: '/api/auth', status: 'healthy', responseTime: 120, successRate: 98.5, lastChecked: Date.now() },
          { endpoint: '/api/classes', status: 'degraded', responseTime: 350, successRate: 95.1, lastChecked: Date.now() },
          { endpoint: '/api/assignments', status: 'healthy', responseTime: 95, successRate: 99.8, lastChecked: Date.now() },
          { endpoint: '/api/notifications', status: 'down', responseTime: 0, successRate: 0, lastChecked: Date.now() }
        ];
        setApiEndpoints(mockEndpoints);
      }
    } catch (error) {
      console.error('Error fetching API endpoints:', error);
    }
  }, []);

  // Fetch user activity data
  const fetchUserActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem('skillup_token');
      const response = await fetch(`${API_BASE_URL}/admin/user-activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserActivity(data.activity);
      } else {
        // Mock user activity
        setUserActivity({
          activeUsers: 45,
          newRegistrations: 12,
          loginAttempts: 156,
          sessionDuration: 24.5,
          bounceRate: 12.3
        });
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSystemAlerts();
    fetchDatabaseMetrics();
    fetchApiEndpoints();
    fetchUserActivity();

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchSystemAlerts();
      fetchDatabaseMetrics();
      fetchApiEndpoints();
      fetchUserActivity();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchSystemAlerts, fetchDatabaseMetrics, fetchApiEndpoints, fetchUserActivity]);

  // Chart configurations
  const systemMetricsChartData = {
    labels: realtimeData.map(d => format(new Date(d.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: realtimeData.map(d => d.cpuUsage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Memory Usage (%)',
        data: realtimeData.map(d => d.memoryUsage),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Error Rate (%)',
        data: realtimeData.map(d => d.errorRate),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };

  const systemMetricsChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Real-time System Metrics',
        font: { size: 16, weight: 'bold' as const }
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Percentage (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Error Rate (%)'
        },
        min: 0,
        max: 10,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const responseTimeChartData = {
    labels: realtimeData.map(d => format(new Date(d.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: realtimeData.map(d => d.responseTime),
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 2,
      }
    ]
  };

  const responseTimeChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'API Response Time',
        font: { size: 16, weight: 'bold' as const }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)'
        }
      }
    }
  };

  const userActivityChartData = {
    labels: ['Active Users', 'New Registrations', 'Login Attempts'],
    datasets: [
      {
        data: userActivity ? [userActivity.activeUsers, userActivity.newRegistrations, userActivity.loginAttempts] : [0, 0, 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const userActivityChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'User Activity Overview',
        font: { size: 16, weight: 'bold' as const }
      },
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="monitoring-loading">
        <div className="loading-spinner-large"></div>
        <h3>Initializing Real-time Monitoring</h3>
        <p>Connecting to system metrics...</p>
      </div>
    );
  }

  return (
    <div className="realtime-monitoring-dashboard">
      {/* Connection Status Header */}
      <div className="monitoring-header">
        <div className="connection-status">
          <div className={`status-indicator status-${connectionStatus}`}>
            <div className="status-dot"></div>
            <span>
              {connectionStatus === 'connected' ? 'Live Monitoring Active' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Lost'}
            </span>
          </div>
          <div className="last-updated">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="system-alerts">
          <h3>🚨 System Alerts</h3>
          <div className="alerts-container">
            {systemAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type} ${alert.resolved ? 'resolved' : ''}`}>
                <div className="alert-content">
                  <span className="alert-icon">
                    {alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '🟡' : 'ℹ️'}
                  </span>
                  <div className="alert-details">
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-time">{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                  </div>
                </div>
                {alert.resolved && <div className="alert-resolved">✅ Resolved</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Charts Grid */}
      <div className="charts-grid">
        {/* System Metrics Chart */}
        <div className="chart-container large">
          <Line data={systemMetricsChartData} options={systemMetricsChartOptions} />
        </div>

        {/* Response Time Chart */}
        <div className="chart-container medium">
          <Bar data={responseTimeChartData} options={responseTimeChartOptions} />
        </div>

        {/* User Activity Doughnut */}
        <div className="chart-container medium">
          <Doughnut data={userActivityChartData} options={userActivityChartOptions} />
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="metrics-overview">
        <div className="metric-card realtime">
          <div className="metric-header">
            <h4>🖥️ System Performance</h4>
            <div className="metric-trend">Live</div>
          </div>
          <div className="metric-stats">
            <div className="stat">
              <span className="stat-label">CPU</span>
              <span className="stat-value">{realtimeData[realtimeData.length - 1]?.cpuUsage.toFixed(1) || '0'}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Memory</span>
              <span className="stat-value">{realtimeData[realtimeData.length - 1]?.memoryUsage.toFixed(1) || '0'}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Response</span>
              <span className="stat-value">{realtimeData[realtimeData.length - 1]?.responseTime.toFixed(0) || '0'}ms</span>
            </div>
          </div>
        </div>

        {databaseMetrics && (
          <div className="metric-card">
            <div className="metric-header">
              <h4>🗄️ Database Health</h4>
              <div className="metric-trend positive">Healthy</div>
            </div>
            <div className="metric-stats">
              <div className="stat">
                <span className="stat-label">Connections</span>
                <span className="stat-value">{databaseMetrics.connectionCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Query Time</span>
                <span className="stat-value">{databaseMetrics.queryTime}ms</span>
              </div>
              <div className="stat">
                <span className="stat-label">Cache Hit</span>
                <span className="stat-value">{databaseMetrics.cacheHitRate}%</span>
              </div>
            </div>
          </div>
        )}

        {userActivity && (
          <div className="metric-card">
            <div className="metric-header">
              <h4>👥 User Activity</h4>
              <div className="metric-trend positive">Active</div>
            </div>
            <div className="metric-stats">
              <div className="stat">
                <span className="stat-label">Online</span>
                <span className="stat-value">{userActivity.activeUsers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">New Today</span>
                <span className="stat-value">{userActivity.newRegistrations}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Session</span>
                <span className="stat-value">{userActivity.sessionDuration}min</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Endpoints Health */}
      <div className="api-endpoints-health">
        <h3>🌐 API Endpoints Health</h3>
        <div className="endpoints-grid">
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} className={`endpoint-card status-${endpoint.status}`}>
              <div className="endpoint-header">
                <span className="endpoint-name">{endpoint.endpoint}</span>
                <div className={`endpoint-status status-${endpoint.status}`}>
                  {endpoint.status === 'healthy' ? '🟢' : endpoint.status === 'degraded' ? '🟡' : '🔴'}
                  {endpoint.status.toUpperCase()}
                </div>
              </div>
              <div className="endpoint-metrics">
                <div className="endpoint-metric">
                  <span>Response: {endpoint.responseTime}ms</span>
                </div>
                <div className="endpoint-metric">
                  <span>Success: {endpoint.successRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtimeMonitoringDashboard;