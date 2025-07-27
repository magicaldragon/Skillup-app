import React, { useEffect, useState } from 'react';

const BackendStatusPanel = () => {
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [version, setVersion] = useState('');
  const [uptime, setUptime] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/admin/version')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVersion(data.version);
          setUptime(data.uptime);
          setStatus('online');
        } else {
          setStatus('offline');
        }
      })
      .catch(() => setStatus('offline'));
  }, []);

  const handleRedeploy = async () => {
    setDeploying(true);
    setMessage(null);
    fetch('/api/users/admin/deploy-backend', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Failed to trigger redeploy.'))
      .finally(() => setDeploying(false));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
      <div className="mb-2">Status: <span className={status === 'online' ? 'text-green-700' : 'text-red-600'}>{status}</span></div>
      <div className="mb-2">Version: <span className="font-mono">{version}</span></div>
      <div className="mb-2">Uptime: <span className="font-mono">{Math.floor(uptime)}s</span></div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold mt-2"
        onClick={handleRedeploy}
        disabled={deploying}
      >
        {deploying ? 'Redeploying...' : 'Redeploy Backend'}
      </button>
      {message && <div className="mt-2 text-green-700">{message}</div>}
    </div>
  );
};

export default BackendStatusPanel; 