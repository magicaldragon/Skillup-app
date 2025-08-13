import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const FrontendStatusPanel: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<string[]>([]);

  useEffect(() => {
    // Capture window errors
    const handleError = (event: ErrorEvent) => {
      const msg = `[${new Date().toLocaleTimeString()}] ERROR: ${event.message} at ${event.filename}:${event.lineno}`;
      logsRef.current = [...logsRef.current, msg];
      setLogs([...logsRef.current]);
    };
    window.addEventListener('error', handleError);

    // Capture console errors
    const origConsoleError = console.error;
    console.error = (...args) => {
      const msg = `[${new Date().toLocaleTimeString()}] CONSOLE: ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
      logsRef.current = [...logsRef.current, msg];
      setLogs([...logsRef.current]);
      origConsoleError(...args);
    };

    return () => {
      window.removeEventListener('error', handleError);
      console.error = origConsoleError;
    };
  }, []);

  const handleClear = () => {
    logsRef.current = [];
    setLogs([]);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Frontend Logs</h2>
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
        onClick={handleClear}
      >
        Clear Logs
      </button>
      <pre
        className="bg-slate-100 p-4 rounded text-xs overflow-x-auto max-h-96"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {logs.join('\n')}
      </pre>
    </div>
  );
};

export default FrontendStatusPanel;
