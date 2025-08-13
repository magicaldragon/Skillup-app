import { useEffect, useState } from 'react';

const ApiErrorLogsPanel = () => {
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/admin/error-logs', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.logs);
        else setError('Failed to fetch logs');
        setLoading(false);
      })
      .catch(() => {
        // If admin endpoint fails, show a message that logs are not available
        setError('Admin logs not available - check backend console for errors');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">API Error Logs</h2>
      {loading && <div>Loading logs...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {logs.length > 0 ? (
        <ul className="space-y-2">
          {logs.map((log, i) => (
            <li key={`${log.timestamp}_${i}`} className="bg-slate-100 rounded p-2 text-sm">
              <span className={log.level === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                [{log.level}]
              </span>{' '}
              {log.message}
              <div className="text-xs text-gray-500 mt-1">{log.timestamp}</div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <div>No logs found.</div>
      )}
    </div>
  );
};

export default ApiErrorLogsPanel;
