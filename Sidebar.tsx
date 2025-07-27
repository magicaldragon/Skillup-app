// Sidebar.tsx
// Professional, responsive sidebar navigation for all roles
// Shows all sections for teachers/admins, limited for students
// Modern design, clear icons, and role-based logic
import React, { useState } from 'react';
import { FaChalkboardTeacher, FaBook, FaUserGraduate, FaClipboardList, FaUsers, FaTasks, FaUserEdit, FaUserPlus, FaUserCheck, FaChartBar, FaHome, FaClipboardCheck, FaClipboard, FaUser, FaCheckCircle, FaTimesCircle, FaListAlt, FaMicrophone, FaPen, FaBookOpen, FaUserCog, FaFolderOpen, FaHourglassHalf, FaUserShield, FaUserTie, FaUserFriends, FaGem, FaArchive, FaSignOutAlt } from 'react-icons/fa';

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
  {
    label: 'ADMIN DEBUG PANEL',
    icon: <FaUserCog />,
    key: 'admin-debug',
    visible: role === 'admin',
    children: [
      {
        label: 'System Health',
        key: 'admin-debug-health',
        icon: <FaCheckCircle />,
        visible: true,
      },
      {
        label: 'API Error Logs',
        key: 'admin-debug-errors',
        icon: <FaTimesCircle />,
        visible: true,
      },
      {
        label: 'User Sync Status',
        key: 'admin-debug-sync',
        icon: <FaUserCheck />,
        visible: true,
      },
      {
        label: 'Manual Tools',
        key: 'admin-debug-tools',
        icon: <FaTasks />,
        visible: true,
      },
      // Add more debug features here as needed
    ],
  },
];

const Sidebar = ({ role, activeKey, onNavigate, onLogout }: { role: string, activeKey: string, onNavigate: (key: string) => void, onLogout?: () => void }) => {
  const menu = menuConfig(role);
  // By default, open the section containing the activeKey
  const getDefaultOpen = () => {
    for (const item of menu) {
      if (item.children && item.children.some(child => child.key === activeKey)) {
        return item.key;
      }
    }
    return null;
  };
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(getDefaultOpen());

  const handleMenuClick = (itemKey: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenSubmenu(openSubmenu === itemKey ? null : itemKey);
    } else {
      onNavigate(itemKey);
    }
  };

  return (
    <aside className="w-60 min-h-screen bg-white border-r flex flex-col transition-all duration-500">
      <div className="flex flex-col items-center justify-center pt-6 pb-4">
        <img src="/logo-skillup.png" alt="Skillup Center Logo" className="h-16 w-auto object-contain drop-shadow-lg" style={{ aspectRatio: '1/1' }} />
      </div>
      <nav className="flex-1 px-0.5 space-y-0.5 text-[11px] md:text-[12px] lg:text-[13px]">
        {menu.map(item => {
          const hasChildren = !!item.children && item.children.some(child => child.visible);
          const isOpen = openSubmenu === item.key;
          if (!item.visible) return null;
          return (
            <div key={item.key}>
              <button
                className={`flex items-center gap-2 w-full px-2 py-1 rounded-lg text-left font-semibold text-[11px] md:text-[12px] lg:text-[13px] transition-all duration-300 transform ${activeKey === item.key ? 'bg-green-100 text-[#307637] scale-[1.03]' : 'hover:bg-slate-100'}`}
                onClick={() => handleMenuClick(item.key, hasChildren)}
              >
                {item.icon} {item.label}
                {hasChildren && (
                  <span className={`ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                )}
              </button>
              {hasChildren && isOpen && (
                <div className="ml-2 space-y-0.5">
                  {item.children.filter(child => child.visible).map(child => (
                    <button
                      key={child.key}
                      className={`flex items-center gap-2 w-full px-1 py-0.5 rounded text-left font-medium text-[10px] md:text-[11px] lg:text-[12px] transition-colors ${activeKey === child.key ? 'bg-green-50 text-[#307637]' : 'hover:bg-slate-100'}`}
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
      {/* Settings and Logout at the bottom */}
      <div className="mt-auto px-1 pb-2 space-y-1 text-[11px] md:text-[12px] lg:text-[13px]">
        <button
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left font-semibold transition-all duration-300 ${activeKey === 'settings' ? 'bg-green-100 text-[#307637] scale-[1.03]' : 'hover:bg-slate-100'}`}
          onClick={() => onNavigate('settings')}
        >
          <FaUserCog /> Settings
        </button>
        {onLogout && (
          <button
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left font-semibold text-red-600 hover:bg-red-50 transition-all duration-300"
            onClick={onLogout}
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
// [NOTE] Sidebar updated: 'Add New Members' replaces 'ADD', 2024-05-XX 