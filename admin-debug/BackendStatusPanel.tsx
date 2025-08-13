import React, { useCallback, useState } from 'react';

const BackendStatusPanel: React.FC = () => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/backend-logs');
      const data = await response.json();
      if (data.success) setLogs(data.logs);
      else setError(data.message || 'Failed to fetch backend logs');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch backend logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Backend Logs</h2>
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
        onClick={fetchLogs}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <pre
        className="bg-slate-100 p-4 rounded text-xs overflow-x-auto max-h-96"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {logs}
      </pre>
    </div>
  );
};

export default BackendStatusPanel;
