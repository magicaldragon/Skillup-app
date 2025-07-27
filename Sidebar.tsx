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
    label: 'Admin Debug Panel',
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
      {
        label: 'Frontend/Backend',
        key: 'admin-debug-fb',
        icon: <FaClipboardList />,
        visible: true,
        children: [
          {
            label: 'Frontend Status',
            key: 'admin-debug-frontend',
            icon: <FaCheckCircle />,
            visible: true,
          },
          {
            label: 'Backend Status',
            key: 'admin-debug-backend',
            icon: <FaCheckCircle />,
            visible: true,
          },
        ],
      },
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
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set([getDefaultOpen()].filter(Boolean) as string[]));

  const handleMenuClick = (itemKey: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenSubmenus(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemKey)) {
          newSet.delete(itemKey);
        } else {
          newSet.add(itemKey);
        }
        return newSet;
      });
    } else {
      onNavigate(itemKey);
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 border-r shadow-xl flex flex-col transition-all duration-500">
      <div className="flex flex-col items-center justify-center pt-8 pb-6">
        <img src="/logo-skillup.png" alt="Skillup Center Logo" className="h-20 w-auto object-contain drop-shadow-lg" style={{ aspectRatio: '1/1' }} />
      </div>
      <nav className="flex-1 px-2 space-y-2 text-[16px] md:text-[17px] lg:text-[18px] font-medium">
        {menu.map(item => {
          const hasChildren = !!item.children && item.children.some(child => child.visible);
          const isOpen = openSubmenus.has(item.key);
          if (!item.visible) return null;
          return (
            <div key={item.key}>
              <button
                className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-left font-semibold text-[16px] md:text-[17px] lg:text-[18px] transition-all duration-300 transform shadow-sm bg-white/80
              ${activeKey === item.key ? 'bg-green-200 text-[#307637] scale-[1.03] shadow-lg' : ''}
              hover:bg-[#307637] hover:text-[#ffe9ca] hover:shadow-lg`}
                onClick={() => handleMenuClick(item.key, hasChildren)}
                style={{ boxShadow: activeKey === item.key ? '0 4px 16px 0 rgba(48,118,55,0.10)' : undefined }}
              >
                {item.icon} {item.label}
                {hasChildren && (
                  <span className={`ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} style={{ color: '#14532d', fontWeight: 700, fontSize: 20 }}>▶</span>
                )}
              </button>
              {hasChildren && isOpen && (
                <div className="ml-8 space-y-1 border-l-2 border-green-200 pl-4">
                  {item.children.filter(child => child.visible).map(child => {
                    const hasGrandChildren = !!child.children && child.children.some(grandChild => grandChild.visible);
                    const isChildOpen = openSubmenus.has(child.key);
                    
                    return (
                      <div key={child.key}>
                        <button
                          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-left font-medium text-[15px] md:text-[16px] lg:text-[17px] transition-colors bg-white/70
                        hover:bg-[#307637] hover:text-[#ffe9ca] hover:shadow
                        ${activeKey === child.key ? 'bg-green-100 text-[#307637] font-bold shadow' : ''}`}
                          onClick={() => hasGrandChildren ? handleMenuClick(child.key, true) : onNavigate(child.key)}
                          style={{ marginLeft: 8 }}
                        >
                          {child.icon} {child.label}
                          {hasGrandChildren && (
                            <span className={`ml-auto transition-transform ${isChildOpen ? 'rotate-90' : ''}`} style={{ color: '#14532d', fontWeight: 700, fontSize: 16 }}>▶</span>
                          )}
                        </button>
                        {hasGrandChildren && isChildOpen && (
                          <div className="ml-8 space-y-1 border-l-2 border-green-100 pl-4 mt-1">
                            {child.children.filter(grandChild => grandChild.visible).map(grandChild => (
                              <button
                                key={grandChild.key}
                                className={`flex items-center gap-2 w-full px-2 py-1 rounded text-left font-medium text-[14px] md:text-[15px] lg:text-[16px] transition-colors bg-white/60
                              hover:bg-[#307637] hover:text-[#ffe9ca] hover:shadow
                              ${activeKey === grandChild.key ? 'bg-green-100 text-[#307637] font-bold shadow' : ''}`}
                                onClick={() => onNavigate(grandChild.key)}
                                style={{ marginLeft: 8 }}
                              >
                                {grandChild.icon} {grandChild.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Settings and Logout at the bottom */}
      <div className="mt-auto px-2 pb-4 space-y-2 text-[16px] md:text-[17px] lg:text-[18px]">
        <button
          className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-left font-semibold transition-all duration-300 shadow-sm bg-white/80
        hover:bg-[#307637] hover:text-[#ffe9ca] hover:shadow-lg
        ${activeKey === 'settings' ? 'bg-green-200 text-[#307637] scale-[1.03] shadow-lg' : ''}`}
          onClick={() => onNavigate('settings')}
          style={{ boxShadow: activeKey === 'settings' ? '0 4px 16px 0 rgba(48,118,55,0.10)' : undefined }}
        >
          <FaUserCog /> Settings
        </button>
        {onLogout && (
          <button
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-left font-semibold text-red-600 hover:bg-red-50 transition-all duration-300 shadow-sm bg-white/80 hover:shadow-lg"
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