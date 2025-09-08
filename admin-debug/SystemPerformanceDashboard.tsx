import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { format } from 'date-fns';

interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    iops: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
    bandwidth: number;
  };
  response: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    errorsPerSecond: number;
    successRate: number;
  };
}

interface DatabasePerformance {
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  queries: {
    executing: number;
    queuedTime: number;
    averageTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    maxSize: number;
  };
  locks: {
    waiting: number;
    deadlocks: number;
  };
}

// interface AlertThreshold {
//   metric: string;
//   warning: number;
//   critical: number;
//   unit: string;
// }

const SystemPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [dbPerformance, setDbPerformance] = useState<DatabasePerformance | null>(null);
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'critical'; message: string; timestamp: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Alert thresholds
  // Alert thresholds for system monitoring (will be used for alerts)
  // Alert thresholds for system monitoring (will be used for alerts)
  // const _alertThresholds: AlertThreshold[] = [
    // { metric: 'cpu', warning: 70, critical: 90, unit: '%' },
    // { metric: 'memory', warning: 80, critical: 95, unit: '%' },
    // { metric: 'disk', warning: 85, critical: 95, unit: '%' },
    // { metric: 'response', warning: 1000, critical: 2000, unit: 'ms' },
  // ];

  // Generate mock performance data
  const generateMockMetrics = useCallback((): PerformanceMetrics => {
    const now = Date.now();
    return {
      timestamp: now,
      cpu: {
        usage: 30 + Math.random() * 50,
        cores: 8,
        loadAverage: [1.2, 1.5, 1.8]
      },
      memory: {
        used: 4 + Math.random() * 4,
        total: 16,
        percentage: 25 + Math.random() * 50,
        heapUsed: 150 + Math.random() * 200,
        heapTotal: 512
      },
      disk: {
        used: 45 + Math.random() * 20,
        total: 100,
        percentage: 45 + Math.random() * 20,
        iops: 50 + Math.random() * 100
      },
      network: {
        inbound: Math.random() * 100,
        outbound: Math.random() * 50,
        connections: 20 + Math.random() * 30,
        bandwidth: 1000
      },
      response: {
        average: 80 + Math.random() * 120,
        p95: 150 + Math.random() * 200,
        p99: 300 + Math.random() * 500
      },
      throughput: {
        requestsPerSecond: 50 + Math.random() * 150,
        errorsPerSecond: Math.random() * 5,
        successRate: 95 + Math.random() * 5
      }
    };
  }, []);

  // Generate mock database performance
  const generateMockDbPerformance = useCallback((): DatabasePerformance => ({
    connections: {
      active: 15 + Math.floor(Math.random() * 20),
      idle: 5 + Math.floor(Math.random() * 10),
      max: 50
    },
    queries: {
      executing: Math.floor(Math.random() * 5),
      queuedTime: Math.random() * 50,
      averageTime: 20 + Math.random() * 30,
      slowQueries: Math.floor(Math.random() * 3)
    },
    cache: {
      hitRate: 85 + Math.random() * 10,
      missRate: 5 + Math.random() * 10,
      size: 250 + Math.random() * 100,
      maxSize: 512
    },
    locks: {
      waiting: Math.floor(Math.random() * 2),
      deadlocks: Math.floor(Math.random() * 1)
    }
  }), []);

  // Check for alerts
  const checkAlerts = useCallback((metric: PerformanceMetrics) => {
    const newAlerts: Array<{ type: 'warning' | 'critical'; message: string; timestamp: number }> = [];

    // CPU alerts
    if (metric.cpu.usage > 90) {
      newAlerts.push({ type: 'critical', message: `Critical CPU usage: ${metric.cpu.usage.toFixed(1)}%`, timestamp: Date.now() });
    } else if (metric.cpu.usage > 70) {
      newAlerts.push({ type: 'warning', message: `High CPU usage: ${metric.cpu.usage.toFixed(1)}%`, timestamp: Date.now() });
    }

    // Memory alerts
    if (metric.memory.percentage > 95) {
      newAlerts.push({ type: 'critical', message: `Critical memory usage: ${metric.memory.percentage.toFixed(1)}%`, timestamp: Date.now() });
    } else if (metric.memory.percentage > 80) {
      newAlerts.push({ type: 'warning', message: `High memory usage: ${metric.memory.percentage.toFixed(1)}%`, timestamp: Date.now() });
    }

    // Response time alerts
    if (metric.response.average > 2000) {
      newAlerts.push({ type: 'critical', message: `Critical response time: ${metric.response.average.toFixed(0)}ms`, timestamp: Date.now() });
    } else if (metric.response.average > 1000) {
      newAlerts.push({ type: 'warning', message: `High response time: ${metric.response.average.toFixed(0)}ms`, timestamp: Date.now() });
    }

    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep latest 10 alerts
  }, []);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      const token = localStorage.getItem('skillup_token');
      
      // Try to fetch real data first
      const response = await fetch(`${API_BASE_URL}/admin/performance-metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newMetric = data.metrics;
        setMetrics(prev => [...prev, newMetric].slice(-30)); // Keep last 30 data points
        checkAlerts(newMetric);
      } else {
        // Use mock data if real endpoint not available
        const newMetric = generateMockMetrics();
        setMetrics(prev => [...prev, newMetric].slice(-30));
        checkAlerts(newMetric);
      }

      // Fetch database performance
      const dbResponse = await fetch(`${API_BASE_URL}/admin/database-performance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        setDbPerformance(dbData.performance);
      } else {
        setDbPerformance(generateMockDbPerformance());
      }

    } catch (error) {
      console.error('Error fetching performance data:', error);
      // Fallback to mock data
      const newMetric = generateMockMetrics();
      setMetrics(prev => [...prev, newMetric].slice(-30));
      setDbPerformance(generateMockDbPerformance());
      checkAlerts(newMetric);
    }
  }, [generateMockMetrics, generateMockDbPerformance, checkAlerts]);

  // Initialize data and real-time updates
  useEffect(() => {
    // Generate initial data
    const initialData: PerformanceMetrics[] = [];
    for (let i = 29; i >= 0; i--) {
      const timestamp = Date.now() - (i * 10000); // 10 second intervals
      initialData.push({
        ...generateMockMetrics(),
        timestamp
      });
    }
    setMetrics(initialData);
    setDbPerformance(generateMockDbPerformance());
    setLoading(false);

    // Start real-time updates
    if (isRealtime) {
      intervalRef.current = setInterval(fetchPerformanceData, 5000); // Update every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealtime, fetchPerformanceData, generateMockMetrics, generateMockDbPerformance]);

  // Toggle real-time updates
  const toggleRealtime = () => {
    setIsRealtime(prev => !prev);
    if (!isRealtime && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Get current metrics (latest data point)
  const currentMetrics = metrics[metrics.length - 1];

  // Chart configurations
  const cpuMemoryChartData = {
    labels: metrics.map(m => format(new Date(m.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: metrics.map(m => m.cpu.usage),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Memory Usage (%)',
        data: metrics.map(m => m.memory.percentage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const responseTimeChartData = {
    labels: metrics.map(m => format(new Date(m.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Average Response Time',
        data: metrics.map(m => m.response.average),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: '95th Percentile',
        data: metrics.map(m => m.response.p95),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        tension: 0.4,
      }
    ]
  };

  const networkChartData = {
    labels: metrics.map(m => format(new Date(m.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Inbound (MB/s)',
        data: metrics.map(m => m.network.inbound),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
      },
      {
        label: 'Outbound (MB/s)',
        data: metrics.map(m => m.network.outbound),
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
      }
    ]
  };

  const systemOverviewChartData = currentMetrics ? {
    labels: ['CPU', 'Memory', 'Disk', 'Network', 'Response'],
    datasets: [
      {
        label: 'System Health',
        data: [
          currentMetrics.cpu.usage,
          currentMetrics.memory.percentage,
          currentMetrics.disk.percentage,
          (currentMetrics.network.inbound + currentMetrics.network.outbound) / 2,
          Math.min((currentMetrics.response.average / 10), 100) // Scale response time
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      }
    ]
  } : null;

  if (loading) {
    return (
      <div className="performance-loading">
        <div className="loading-spinner-large"></div>
        <h3>Loading Performance Metrics</h3>
        <p>Initializing system monitoring...</p>
      </div>
    );
  }

  return (
    <div className="system-performance-dashboard">
      {/* Header with Controls */}
      <div className="performance-header">
        <div className="performance-title">
          <h2>🚀 System Performance Dashboard</h2>
          <div className="performance-controls">
            <button 
              className={`realtime-toggle ${isRealtime ? 'active' : ''}`}
              onClick={toggleRealtime}
            >
              {isRealtime ? '🔴 Live' : '⏸️ Paused'}
            </button>
            <span className="last-update">
              Last update: {currentMetrics ? format(new Date(currentMetrics.timestamp), 'HH:mm:ss') : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Alerts */}
      {alerts.length > 0 && (
        <div className="performance-alerts">
          <h4>🚨 Active Performance Alerts</h4>
          <div className="alerts-scroll">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`alert alert-${alert.type}`}>
                <span className="alert-icon">
                  {alert.type === 'critical' ? '🔴' : '🟡'}
                </span>
                <span className="alert-message">{alert.message}</span>
                <span className="alert-time">
                  {format(new Date(alert.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <h4>🖥️ CPU Usage</h4>
            <span className={`kpi-status ${currentMetrics?.cpu.usage > 80 ? 'critical' : currentMetrics?.cpu.usage > 60 ? 'warning' : 'normal'}`}>
              {currentMetrics?.cpu.usage.toFixed(1)}%
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>Cores: {currentMetrics?.cpu.cores}</span>
            </div>
            <div className="kpi-detail">
              <span>Load Avg: {currentMetrics?.cpu.loadAverage[0].toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>🧠 Memory</h4>
            <span className={`kpi-status ${currentMetrics?.memory.percentage > 90 ? 'critical' : currentMetrics?.memory.percentage > 75 ? 'warning' : 'normal'}`}>
              {currentMetrics?.memory.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>Used: {currentMetrics?.memory.used.toFixed(1)}GB / {currentMetrics?.memory.total}GB</span>
            </div>
            <div className="kpi-detail">
              <span>Heap: {currentMetrics?.memory.heapUsed}MB / {currentMetrics?.memory.heapTotal}MB</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>💾 Disk I/O</h4>
            <span className={`kpi-status ${currentMetrics?.disk.percentage > 90 ? 'critical' : currentMetrics?.disk.percentage > 80 ? 'warning' : 'normal'}`}>
              {currentMetrics?.disk.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>IOPS: {currentMetrics?.disk.iops.toFixed(0)}</span>
            </div>
            <div className="kpi-detail">
              <span>Space: {currentMetrics?.disk.used.toFixed(1)}GB / {currentMetrics?.disk.total}GB</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>🌐 Network</h4>
            <span className="kpi-status normal">
              {currentMetrics?.network.connections} connections
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>In: {currentMetrics?.network.inbound.toFixed(1)} MB/s</span>
            </div>
            <div className="kpi-detail">
              <span>Out: {currentMetrics?.network.outbound.toFixed(1)} MB/s</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>⚡ Response Time</h4>
            <span className={`kpi-status ${currentMetrics?.response.average > 1000 ? 'critical' : currentMetrics?.response.average > 500 ? 'warning' : 'normal'}`}>
              {currentMetrics?.response.average.toFixed(0)}ms
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>P95: {currentMetrics?.response.p95.toFixed(0)}ms</span>
            </div>
            <div className="kpi-detail">
              <span>P99: {currentMetrics?.response.p99.toFixed(0)}ms</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <h4>📊 Throughput</h4>
            <span className="kpi-status normal">
              {currentMetrics?.throughput.requestsPerSecond.toFixed(0)} req/s
            </span>
          </div>
          <div className="kpi-details">
            <div className="kpi-detail">
              <span>Success: {currentMetrics?.throughput.successRate.toFixed(1)}%</span>
            </div>
            <div className="kpi-detail">
              <span>Errors: {currentMetrics?.throughput.errorsPerSecond.toFixed(1)}/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="performance-charts">
        <div className="chart-row">
          <div className="chart-container half">
            <h4>CPU & Memory Usage</h4>
            <Line data={cpuMemoryChartData} options={{
              responsive: true,
              interaction: { mode: 'index', intersect: false },
              plugins: { legend: { position: 'top' } },
              scales: { y: { min: 0, max: 100 } }
            }} />
          </div>
          <div className="chart-container half">
            <h4>Response Time</h4>
            <Line data={responseTimeChartData} options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }} />
          </div>
        </div>
        
        <div className="chart-row">
          <div className="chart-container half">
            <h4>Network Traffic</h4>
            <Bar data={networkChartData} options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }} />
          </div>
          <div className="chart-container half">
            <h4>System Overview</h4>
            {systemOverviewChartData && (
              <Radar data={systemOverviewChartData} options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { r: { min: 0, max: 100 } }
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Database Performance */}
      {dbPerformance && (
        <div className="database-performance">
          <h4>🗄️ Database Performance</h4>
          <div className="db-metrics-grid">
            <div className="db-metric-card">
              <h5>Connections</h5>
              <div className="db-stat">
                <span>Active: {dbPerformance.connections.active}</span>
                <span>Idle: {dbPerformance.connections.idle}</span>
                <span>Max: {dbPerformance.connections.max}</span>
              </div>
              <div className="db-progress">
                <div 
                  className="db-progress-bar"
                  style={{ width: `${(dbPerformance.connections.active / dbPerformance.connections.max) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="db-metric-card">
              <h5>Query Performance</h5>
              <div className="db-stat">
                <span>Executing: {dbPerformance.queries.executing}</span>
                <span>Avg Time: {dbPerformance.queries.averageTime.toFixed(1)}ms</span>
                <span>Slow Queries: {dbPerformance.queries.slowQueries}</span>
              </div>
            </div>

            <div className="db-metric-card">
              <h5>Cache Performance</h5>
              <div className="db-stat">
                <span>Hit Rate: {dbPerformance.cache.hitRate.toFixed(1)}%</span>
                <span>Size: {dbPerformance.cache.size}MB / {dbPerformance.cache.maxSize}MB</span>
              </div>
              <div className="db-progress">
                <div 
                  className="db-progress-bar success"
                  style={{ width: `${dbPerformance.cache.hitRate}%` }}
                ></div>
              </div>
            </div>

            <div className="db-metric-card">
              <h5>Locks & Deadlocks</h5>
              <div className="db-stat">
                <span>Waiting: {dbPerformance.locks.waiting}</span>
                <span>Deadlocks: {dbPerformance.locks.deadlocks}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPerformanceDashboard;