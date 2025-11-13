import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface ChangeLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  timestamp: string;
  ip?: string;
}

const ACTION_LABELS: Record<string, string> = {
  add: "Added",
  edit: "Edited",
  delete: "Deleted",
  assign: "Assigned",
};

const ChangeLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ entityType: "", userId: "", action: "" });
  const [selectedLog, setSelectedLog] = useState<ChangeLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.entityType) params.append("entityType", filter.entityType);
      if (filter.userId) params.append("userId", filter.userId);
      if (filter.action) params.append("action", filter.action);
      const res = await fetch(`/api/change-logs?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
      else setError(data.message || "Failed to fetch logs");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch logs";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-5xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Change Log / History</h2>
      <div className="flex gap-4 mb-4">
        <select
          className="p-2 border rounded"
          value={filter.entityType}
          onChange={(e) => setFilter((f) => ({ ...f, entityType: e.target.value }))}
        >
          <option value="">All Entities</option>
          <option value="class">Class</option>
          <option value="level">Level</option>
          <option value="user">User</option>
          <option value="assignment">Assignment</option>
          <option value="submission">Submission</option>
        </select>
        <select
          className="p-2 border rounded"
          value={filter.action}
          onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
        >
          <option value="">All Actions</option>
          <option value="add">Add</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
          <option value="assign">Assign</option>
        </select>
        <input
          className="p-2 border rounded"
          placeholder="Filter by User ID..."
          value={filter.userId}
          onChange={(e) => setFilter((f) => ({ ...f, userId: e.target.value }))}
        />
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={fetchLogs}
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="p-8 text-center text-lg">Loading logs...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-slate-400 text-center">No change logs found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">User</th>
                <th className="p-2">Role</th>
                <th className="p-2">Action</th>
                <th className="p-2">Entity</th>
                <th className="p-2">Entity ID</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-2">
                    {log.userName} ({log.userId})
                  </td>
                  <td className="p-2">{log.userRole}</td>
                  <td className="p-2">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="p-2">{log.entityType}</td>
                  <td className="p-2">{log.entityId}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      onClick={() => setSelectedLog(log)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Change Log Details</h3>
            <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto max-h-96">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeLogPanel;
