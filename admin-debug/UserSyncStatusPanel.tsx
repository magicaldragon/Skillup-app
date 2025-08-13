import { useEffect, useState } from 'react';

interface SyncStatus {
  mongoCount: number;
  firebaseCount: number;
  discrepancies: Array<{
    userId: string;
    issue: string;
  }>;
}

const UserSyncStatusPanel = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/admin/user-sync-status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStatus(data);
        else setError('Failed to fetch sync status');
        setLoading(false);
      })
      .catch(() => {
        // If admin endpoint fails, show a message that sync status is not available
        setError('Sync status not available - check backend console for details');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">User Sync Status</h2>
      {loading && <div>Loading sync status...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {status && (
        <div>
          <div>
            MongoDB Users: <span className="font-bold">{status.mongoCount}</span>
          </div>
          <div>
            Firebase Users: <span className="font-bold">{status.firebaseCount}</span>
          </div>
          <div>
            Discrepancies:{' '}
            <span className="font-bold text-red-600">{status.discrepancies.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSyncStatusPanel;
