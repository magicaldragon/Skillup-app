// Sidebar.tsx
// Professional, responsive sidebar navigation for all roles
// Shows all sections for teachers/admins, limited for students
// Modern design, clear icons, and role-based logic
import React from 'react';
import { FaChalkboardTeacher, FaBook, FaUserGraduate, FaClipboardList, FaUsers, FaTasks, FaUserEdit, FaUserPlus, FaUserCheck, FaChartBar, FaHome, FaClipboardCheck, FaClipboard, FaUser, FaCheckCircle, FaTimesCircle, FaListAlt, FaMicrophone, FaPen, FaBookOpen, FaUserCog, FaFolderOpen, FaHourglassHalf, FaUserShield, FaUserTie, FaUserFriends, FaGem, FaArchive } from 'react-icons/fa';

const menuConfig = (role: string) => [
  {
    label: 'Dashboard',
    icon: <FaHome />,
    key: 'dashboard',
    visible: true,
  },
  {
    label: 'Management',
    icon: <FaFolderOpen />,
    key: 'management',
    visible: true,
    children: [
      { label: 'Add New Members', icon: <FaUserPlus />, key: 'add-student', visible: role !== 'student' },
      { label: 'Potential Students', icon: <FaGem />, key: 'potential-students', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Waiting List', icon: <FaHourglassHalf />, key: 'waiting-list', visible: role !== 'student' },
      { label: 'Classes', icon: <FaUsers />, key: 'classes', visible: true },
      { label: 'Scores & Feedback', icon: <FaChartBar />, key: 'scores', visible: true },
      { label: 'Reports', icon: <FaClipboard />, key: 'reports', visible: role !== 'student' },
      { label: 'Levels', icon: <FaListAlt />, key: 'levels', visible: true },
      { label: 'Records', icon: <FaArchive />, key: 'records', visible: role === 'admin' || role === 'teacher' },
      // Add Accounts submenu for admin
      { label: 'Accounts', icon: <FaUserCog />, key: 'accounts', visible: role === 'admin' },
      // Student-specific management submenu
      { label: 'My classes', icon: <FaUsers />, key: 'my-classes', visible: role === 'student' },
      { label: 'My progress', icon: <FaChartBar />, key: 'my-progress', visible: role === 'student' },
      { label: 'Scores and feedback', icon: <FaClipboardList />, key: 'my-scores', visible: role === 'student' },
    ],
  },
  {
    label: 'Assignments',
    icon: <FaClipboardList />,
    key: 'assignments',
    visible: true,
    children: [
      { label: 'Full Practice Tests', icon: <FaClipboardCheck />, key: 'full-practice', visible: true },
      { label: 'Mini Tests', icon: <FaClipboard />, key: 'mini-tests', visible: true },
      { label: 'Reading', icon: <FaBookOpen />, key: 'reading', visible: true },
      { label: 'Listening', icon: <FaMicrophone />, key: 'listening', visible: true },
      { label: 'Writing', icon: <FaPen />, key: 'writing', visible: true },
      { label: 'Speaking', icon: <FaUser />, key: 'speaking', visible: true },
    ],
  },
  {
    label: 'Teachers',
    icon: <FaChalkboardTeacher />,
    key: 'teachers',
    visible: role !== 'student',
    children: [
      { label: 'Create', icon: <FaUserTie />, key: 'teacher-create', visible: role !== 'student' },
      { label: 'Edit', icon: <FaUserShield />, key: 'teacher-edit', visible: role !== 'student' },
      { label: 'Assign', icon: <FaUserFriends />, key: 'teacher-assign', visible: role !== 'student' },
    ],
  },
];

const Sidebar = ({ role, activeKey, onNavigate }: { role: string, activeKey: string, onNavigate: (key: string) => void }) => {
  const menu = menuConfig(role);
  return (
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col transition-all duration-500">
      <div className="flex flex-col items-center justify-center pt-10 pb-8">
        <img src="/logo-skillup.png" alt="Skillup Center Logo" className="h-24 w-auto object-contain drop-shadow-lg" style={{ aspectRatio: '1/1' }} />
      </div>
      <nav className="flex-1 px-2 space-y-2">
        {menu.map(item => {
          if (item.key === 'add-student' && !(role === 'teacher' || role === 'admin' || role === 'staff')) return null;
          if (item.key === 'potential-students' && !(role === 'teacher' || role === 'admin' || role === 'staff')) return null;
          if ((item.key === 'assignments' || item.key === 'teachers') && role === 'staff') return null;
          return item.visible && (
            <div key={item.key}>
              <button
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-left font-semibold text-lg transition-all duration-300 transform ${activeKey === item.key ? 'bg-green-100 text-[#307637] scale-[1.03]' : 'hover:bg-slate-100'}`}
                onClick={() => onNavigate(item.key)}
              >
                {item.icon} {item.label}
              </button>
              {item.children && (
                <div className="ml-6 space-y-1">
                  {item.children.filter(child => child.visible).map(child => (
                    <button
                      key={child.key}
                      className={`flex items-center gap-2 w-full px-3 py-1 rounded text-left font-medium text-base transition-colors ${activeKey === child.key ? 'bg-green-50 text-[#307637]' : 'hover:bg-slate-100'}`}
                      onClick={() => onNavigate(child.key)}
                    >
                      {child.icon} {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Settings at the bottom */}
      <div className="mt-auto px-2 pb-4">
        <button
          className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-left font-semibold transition-all duration-300 ${activeKey === 'settings' ? 'bg-green-100 text-[#307637] scale-[1.03]' : 'hover:bg-slate-100'}`}
          onClick={() => onNavigate('settings')}
        >
          <FaUserCog /> Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
// [NOTE] Sidebar updated: 'Add New Members' replaces 'ADD', 2024-05-XX 