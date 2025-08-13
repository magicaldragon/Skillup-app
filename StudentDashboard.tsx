// StudentDashboard.tsx
// Professional dashboard layout for students with sidebar, summary cards, and IELTS focus
// [NOTE] Created as part of 2024-05-XX dashboard refactor

import SettingsPanel from './SettingsPanel';
import type { Student, StudentClass } from './types';

const StudentDashboard = ({
  user,
  classes,
  activeKey,
}: {
  user: Student;
  classes: StudentClass[];
  activeKey: string;
}) => {
  return (
    <div className="teacher-dashboard">
      {activeKey === 'settings' ? (
        <SettingsPanel currentUser={user} classes={classes || []} onDataRefresh={() => {}} />
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <div className="text-slate-600 mb-8">
            Welcome back! This section will be rebuilt later.
          </div>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
            <p className="text-slate-600">
              Assignment and submission features will be available here in the future.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
