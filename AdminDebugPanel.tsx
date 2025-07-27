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
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Panel</h1>
      {panels[activeKey] || <div>Select a debug feature from the sidebar.</div>}
    </div>
  );
};

export default AdminDebugPanel; 