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
  console.log('AdminDebugPanel rendered with activeKey:', activeKey);
  console.log('Available panels:', Object.keys(panels));
  console.log('Selected panel:', panels[activeKey]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Panel</h1>
      <div className="mb-4 p-4 bg-blue-100 rounded">
        <strong>Debug Info:</strong> activeKey = "{activeKey}"
      </div>
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