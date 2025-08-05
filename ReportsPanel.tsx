import { useEffect, useState } from 'react';
import type { Student } from './types';

const ReportsPanel = ({ isAdmin, onDataRefresh }: { isAdmin: boolean, onDataRefresh?: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://skillup-backend-v6vm.onrender.com/api';
        const response = await fetch(`${apiUrl}/reports`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        
        const data = await response.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div className="p-8 text-center text-lg">Loading reports...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!reports) return <div className="p-8 text-center text-gray-600">No reports available</div>;

  return (
    <div className="reports-panel">
      <h2 className="text-2xl font-bold mb-6">Reports Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(reports as Record<string, any[]>).map(([studentId, reportsArr]) => {
          return (
            <div key={studentId} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Student {studentId}</h3>
              <div className="space-y-2">
                {(reportsArr as any[]).map((r: any) => (
                  <div key={r.id} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-gray-600">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsPanel; 