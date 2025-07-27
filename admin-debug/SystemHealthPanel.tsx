import React, { useEffect, useState } from 'react';

const SystemHealthPanel = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cors-test')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch backend status');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">System Health</h2>
      {loading && <div>Loading system status...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {status && (
        <div className="space-y-2">
          <div><strong>Backend:</strong> <span className="text-green-700">Online</span></div>
          <div><strong>CORS Allowed Origins:</strong> <code>{JSON.stringify(status.allowedOrigins)}</code></div>
          <div><strong>Request Origin:</strong> <code>{status.origin}</code></div>
          <div><strong>Message:</strong> {status.message}</div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPanel; 