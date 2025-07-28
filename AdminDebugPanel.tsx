import React, { useState } from 'react';
import SystemHealthPanel from './admin-debug/SystemHealthPanel';
import ApiErrorLogsPanel from './admin-debug/ApiErrorLogsPanel';
import UserSyncStatusPanel from './admin-debug/UserSyncStatusPanel';
import ManualToolsPanel from './admin-debug/ManualToolsPanel';
import FrontendStatusPanel from './admin-debug/FrontendStatusPanel';
import BackendStatusPanel from './admin-debug/BackendStatusPanel';

const panels = {
  'admin-debug-health': <SystemHealthPanel />,
  'admin-debug-errors': <ApiErrorLogsPanel />,
  'admin-debug-sync': <UserSyncStatusPanel />,
  'admin-debug-tools': <ManualToolsPanel />,
  'admin-debug-frontend': <FrontendStatusPanel />,
  'admin-debug-backend': <BackendStatusPanel />,
};

const AdminDebugPanel = ({ activeKey }: { activeKey: string }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'Not set';
  const isLoggedIn = !!localStorage.getItem('token') || document.cookie.includes('session');
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Panel</h1>
      <div className="mb-4 p-2 bg-slate-100 rounded">
        <div><b>API Base URL:</b> {apiBaseUrl}</div>
        <div><b>Session/Token Present:</b> {isLoggedIn ? 'Yes' : 'No'}</div>
      </div>
      {activeKey === 'admin-debug-frontend' && <FrontendStatusPanel />}
      {activeKey === 'admin-debug-backend' && <BackendStatusPanel />}
      {panels[activeKey] ? (
        panels[activeKey]
      ) : (
        <div className="p-4 bg-yellow-100 rounded">
          <strong>No panel found for key:</strong> "{activeKey}"
          <br />
          <strong>Available keys:</strong> {Object.keys(panels).join(', ')}
        </div>
      )}
    </div>
  );
};

export default AdminDebugPanel; 