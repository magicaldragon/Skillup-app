import { useEffect, useState } from 'react';

interface SystemStatus {
  cors: string;
  version: string;
  users: string;
  corsData: string;
  versionData: string;
}

const SystemHealthPanel = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try multiple endpoints to check system health
    Promise.all([
      fetch('/api/cors-test').catch(() => null),
      fetch('/api/users/admin/version').catch(() => null),
      fetch('/api/users').catch(() => null),
    ])
      .then(([corsRes, versionRes, usersRes]) => {
        const healthStatus = {
          cors: corsRes ? 'Online' : 'Offline',
          version: versionRes ? 'Online' : 'Offline',
          users: usersRes ? 'Online' : 'Offline',
          corsData: corsRes ? 'Available' : 'Unavailable',
          versionData: versionRes ? 'Available' : 'Unavailable',
        };
        setStatus(healthStatus);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to check system health');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">System Health</h2>
      {loading && <div>Loading system status...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {status && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="font-semibold">CORS Test</div>
              <div className={status.cors === 'Online' ? 'text-green-700' : 'text-red-600'}>
                {status.cors}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="font-semibold">Version API</div>
              <div className={status.version === 'Online' ? 'text-green-700' : 'text-red-600'}>
                {status.version}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="font-semibold">Users API</div>
              <div className={status.users === 'Online' ? 'text-green-700' : 'text-red-600'}>
                {status.users}
              </div>
            </div>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <div className="font-semibold mb-2">System Status:</div>
            <div className="text-sm space-y-1">
              <div>• CORS Configuration: {status.corsData}</div>
              <div>• Version Information: {status.versionData}</div>
              <div>
                • Overall Status:{' '}
                <span
                  className={
                    status.cors === 'Online' && status.version === 'Online'
                      ? 'text-green-700'
                      : 'text-red-600'
                  }
                >
                  {status.cors === 'Online' && status.version === 'Online'
                    ? 'Healthy'
                    : 'Issues Detected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPanel;
