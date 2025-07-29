// Sidebar.tsx
// Professional, responsive sidebar navigation for all roles
// Shows all sections for teachers/admins, limited for students
// Modern design, clear icons, and role-based logic
import { useState } from 'react';
import { FaChalkboardTeacher, FaClipboardList, FaUsers, FaTasks, FaUserPlus, FaUserCheck, FaChartBar, FaHome, FaClipboardCheck, FaClipboard, FaUser, FaCheckCircle, FaTimesCircle, FaListAlt, FaMicrophone, FaPen, FaBookOpen, FaUserCog, FaFolderOpen, FaHourglassHalf, FaUserShield, FaUserTie, FaUserFriends, FaGem, FaArchive, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';
import DiceBearAvatar from './DiceBearAvatar';

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
      { label: 'Add New Members', icon: <FaUserPlus />, key: 'add-student', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Potential Students', icon: <FaGem />, key: 'potential-students', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Waiting List', icon: <FaHourglassHalf />, key: 'waiting-list', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Classes', icon: <FaUsers />, key: 'classes', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Scores & Feedback', icon: <FaChartBar />, key: 'scores', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Reports', icon: <FaClipboard />, key: 'reports', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Levels', icon: <FaListAlt />, key: 'levels', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Change Log', icon: <FaClipboardList />, key: 'change-log', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Records', icon: <FaArchive />, key: 'records', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      // Add Accounts submenu for admin and staff
      { label: 'Accounts', icon: <FaUserCog />, key: 'accounts', visible: role === 'admin' || role === 'staff' },
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
    visible: role === 'staff' || role === 'teacher' || role === 'admin',
    children: [
      { label: 'Create', icon: <FaUserTie />, key: 'teacher-create', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Edit', icon: <FaUserShield />, key: 'teacher-edit', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
      { label: 'Assign', icon: <FaUserFriends />, key: 'teacher-assign', visible: role === 'staff' || role === 'teacher' || role === 'admin' },
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

const Sidebar = ({ role, activeKey, onNavigate, onLogout, user }: { role: string, activeKey: string, onNavigate: (key: string) => void, onLogout?: () => void, user?: { name: string, avatarSeed?: string, avatarUrl?: string } }) => {
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
    <aside className="sidebar">
      {/* Logo section */}
      <div className="sidebar-logo">
        {/* You can place your logo image or text here */}
      </div>
      {/* User profile section */}
      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User Avatar" className="sidebar-profile-img" />
          ) : (
            <DiceBearAvatar seed={user?.avatarSeed || user?.name || 'User'} size={56} style="avataaars" />
          )}
        </div>
        <div className="sidebar-profile-name">{user?.name || 'User'}</div>
        <div className="sidebar-profile-role">{role}</div>
      </div>
      {/* Main menu */}
      <div className="sidebar-menu">
        {menu.map(item => {
          const hasChildren = !!item.children && item.children.some(child => child.visible);
          const isOpen = openSubmenus.has(item.key);
          if (!item.visible) return null;
          return (
            <div key={item.key}>
              <button
                className={`sidebar-btn${activeKey === item.key ? ' active' : ''}`}
                onClick={() => handleMenuClick(item.key, hasChildren)}
              >
                <span className="sidebar-menu-icon">{item.icon}</span> {item.label}
                {hasChildren && (
                  <span className={`sidebar-submenu-arrow${isOpen ? ' open' : ''}`}>▶</span>
                )}
              </button>
              {hasChildren && isOpen && (
                <div className="sidebar-submenu">
                  {item.children.filter(child => child.visible).map(child => {
                    const hasGrandChildren = !!child.children && child.children.some(grandChild => grandChild.visible);
                    const isChildOpen = openSubmenus.has(child.key);
                    return (
                      <div key={child.key}>
                        <button
                          className={`sidebar-btn${activeKey === child.key ? ' active' : ''}`}
                          onClick={() => hasGrandChildren ? handleMenuClick(child.key, true) : onNavigate(child.key)}
                          style={{ marginLeft: 16 }}
                        >
                          <span className="sidebar-menu-icon">{child.icon}</span> {child.label}
                          {hasGrandChildren && (
                            <span className={`sidebar-submenu-arrow${isChildOpen ? ' open' : ''}`}>▶</span>
                          )}
                        </button>
                        {hasGrandChildren && isChildOpen && (
                          <div className="sidebar-submenu">
                            {child.children.filter(grandChild => grandChild.visible).map(grandChild => (
                              <button
                                key={grandChild.key}
                                className={`sidebar-btn${activeKey === grandChild.key ? ' active' : ''}`}
                                onClick={() => onNavigate(grandChild.key)}
                                style={{ marginLeft: 32 }}
                              >
                                <span className="sidebar-menu-icon">{grandChild.icon}</span> {grandChild.label}
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
      </div>
      {/* Settings and Logout at the bottom, always visible */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-btn${activeKey === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span className="sidebar-menu-icon"><FaUserCog /></span> Settings
        </button>
        {onLogout && (
          <button
            className="sidebar-btn"
            onClick={onLogout}
          >
            <span className="sidebar-menu-icon"><FaSignOutAlt /></span> Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
// [NOTE] Sidebar updated: vivid profile, icons, and color, 2024-06-XX 