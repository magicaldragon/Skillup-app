import { useState } from 'react';

const ManualToolsPanel = () => {
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheMessage(null);

    // Clear browser cache
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        setCacheMessage('Browser cache cleared successfully');
      } catch (_error) {
        setCacheMessage('Failed to clear browser cache');
      }
    } else {
      setCacheMessage('Cache API not available');
    }

    setClearingCache(false);
  };

  const handleRefreshData = () => {
    window.location.reload();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manual Tools</h2>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Cache Management</h3>
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {clearingCache ? 'Clearing...' : 'Clear Browser Cache'}
            </button>
            {cacheMessage && (
              <div
                className={`text-sm ${cacheMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}
              >
                {cacheMessage}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Data Refresh</h3>
          <button
            onClick={handleRefreshData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh Page Data
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">System Information</h3>
          <div className="text-sm space-y-1">
            <div>• User Agent: {navigator.userAgent}</div>
            <div>• Platform: {navigator.platform}</div>
            <div>• Language: {navigator.language}</div>
            <div>• Online Status: {navigator.onLine ? 'Online' : 'Offline'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualToolsPanel;
