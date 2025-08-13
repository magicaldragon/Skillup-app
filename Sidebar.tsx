// Sidebar.tsx
// Professional, responsive sidebar navigation for all roles
// Shows all sections for teachers/admins, limited for students
// Modern design, clear icons, and role-based logic
import { useState } from 'react';
import './Sidebar.css';
import {
  FaArchive,
  FaBookOpen,
  FaChalkboardTeacher,
  FaChartBar,
  FaCheckCircle,
  FaClipboard,
  FaClipboardCheck,
  FaClipboardList,
  FaFolderOpen,
  FaGem,
  FaHome,
  FaHourglassHalf,
  FaListAlt,
  FaMicrophone,
  FaPen,
  FaSignOutAlt,
  FaTasks,
  FaTimesCircle,
  FaUser,
  FaUserCheck,
  FaUserCog,
  FaUserFriends,
  FaUserPlus,
  FaUserShield,
  FaUsers,
  FaUserTie,
} from 'react-icons/fa';
import DiceBearAvatar from './DiceBearAvatar';
import NotificationBell from './NotificationBell';

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
      {
        label: 'Add New Members',
        icon: <FaUserPlus />,
        key: 'add-student',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Potential Students',
        icon: <FaGem />,
        key: 'potential-students',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Waiting List',
        icon: <FaHourglassHalf />,
        key: 'waiting-list',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Classes',
        icon: <FaUsers />,
        key: 'classes',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Scores & Feedback',
        icon: <FaChartBar />,
        key: 'scores',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Reports',
        icon: <FaClipboard />,
        key: 'reports',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Levels',
        icon: <FaListAlt />,
        key: 'levels',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Change Log',
        icon: <FaClipboardList />,
        key: 'changelog',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Records',
        icon: <FaArchive />,
        key: 'records',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      // Add Accounts submenu for admin, staff, and teachers
      {
        label: 'Accounts',
        icon: <FaUserCog />,
        key: 'accounts',
        visible: role === 'admin' || role === 'staff' || role === 'teacher',
      },
      // Student-specific management submenu
      { label: 'My classes', icon: <FaUsers />, key: 'my-classes', visible: role === 'student' },
      {
        label: 'My progress',
        icon: <FaChartBar />,
        key: 'my-progress',
        visible: role === 'student',
      },
      {
        label: 'Scores and feedback',
        icon: <FaClipboardList />,
        key: 'my-scores',
        visible: role === 'student',
      },
    ],
  },
  {
    label: 'Assignments',
    icon: <FaClipboardList />,
    key: 'assignments',
    visible: true,
    children: [
      {
        label: 'Full Practice Tests',
        icon: <FaClipboardCheck />,
        key: 'full-practice',
        visible: true,
      },
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
      {
        label: 'Create',
        icon: <FaUserTie />,
        key: 'teacher-create',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Edit',
        icon: <FaUserShield />,
        key: 'teacher-edit',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
      {
        label: 'Assign',
        icon: <FaUserFriends />,
        key: 'teacher-assign',
        visible: role === 'staff' || role === 'teacher' || role === 'admin',
      },
    ],
  },
  {
    label: 'Debug Panel',
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
        label: 'Create Admin Account',
        key: 'admin-debug-account-creator',
        icon: <FaUserShield />,
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
  {
    label: 'Settings',
    icon: <FaUserCog />,
    key: 'settings',
    visible: true,
  },
  {
    label: 'Logout',
    icon: <FaSignOutAlt />,
    key: 'logout',
    visible: true,
  },
];

const Sidebar = ({
  role,
  activeKey,
  onNavigate,
  onLogout,
  user,
  className,
}: {
  role: string;
  activeKey: string;
  onNavigate: (key: string) => void;
  onLogout?: () => void;
  user?: {
    name: string;
    avatarSeed?: string;
    avatarUrl?: string;
    diceBearSeed?: string;
    diceBearStyle?: string;
  };
  className?: string;
}) => {
  const menu = menuConfig(role);
  // By default, open the section containing the activeKey
  const getDefaultOpen = () => {
    for (const item of menu) {
      if (item.children?.some((child) => child.key === activeKey)) {
        return item.key;
      }
    }
    return null;
  };
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(
    new Set([getDefaultOpen()].filter(Boolean) as string[])
  );

  const handleMenuClick = (itemKey: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenSubmenus((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemKey)) {
          newSet.delete(itemKey);
        } else {
          newSet.add(itemKey);
        }
        return newSet;
      });
    } else if (itemKey === 'logout' && onLogout) {
      onLogout();
    } else {
      onNavigate(itemKey);
    }
  };

  return (
    <aside className={`sidebar${className ? ` ${className}` : ''}`}>
      {/* Logo section */}
      <div className="sidebar-logo">{/* You can place your logo image or text here */}</div>
      
      {/* Notification Bell */}
      <div className="sidebar-notifications">
        <NotificationBell />
      </div>
      
      {/* User profile section */}
      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User Avatar" className="sidebar-profile-img" />
          ) : (
            <DiceBearAvatar
              seed={user?.diceBearSeed || user?.name || 'User'}
              size={56}
              style={user?.diceBearStyle || 'avataaars'}
            />
          )}
        </div>
        <div className="sidebar-profile-name">{user?.name || 'User'}</div>
        <div className="sidebar-profile-role">
          {role === 'admin'
            ? 'Administrator'
            : role === 'teacher'
              ? 'Teacher'
              : role === 'staff'
                ? 'Staff'
                : role === 'student'
                  ? 'Student'
                  : role}
        </div>
      </div>
      {/* Main menu */}
      <div className="sidebar-menu">
        {menu.map((item) => {
          const hasChildren = !!item.children && item.children.some((child) => child.visible);
          const isOpen = openSubmenus.has(item.key);
          if (!item.visible) return null;
          return (
            <div key={item.key}>
              <button
                type="button"
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
                  {item.children
                    .filter((child) => child.visible)
                    .map((child) => {
                      const hasGrandChildren =
                        !!child.children && child.children.some((grandChild) => grandChild.visible);
                      const isChildOpen = openSubmenus.has(child.key);
                      return (
                        <div key={child.key}>
                          <button
                            type="button"
                            className={`sidebar-submenu-btn${activeKey === child.key ? ' active' : ''}`}
                            onClick={() => onNavigate(child.key)}
                          >
                            <span className="sidebar-menu-icon">{child.icon}</span> {child.label}
                            {hasGrandChildren && (
                              <span
                                className={`sidebar-submenu-arrow${isChildOpen ? ' open' : ''}`}
                              >
                                ▶
                              </span>
                            )}
                          </button>
                          {hasGrandChildren && isChildOpen && (
                            <div className="sidebar-submenu">
                              {child.children
                                .filter((grandChild) => grandChild.visible)
                                .map((grandChild) => (
                                  <button
                                    type="button"
                                    key={grandChild.key}
                                    className={`sidebar-submenu-btn${activeKey === grandChild.key ? ' active' : ''}`}
                                    onClick={() => onNavigate(grandChild.key)}
                                  >
                                    <span className="sidebar-menu-icon">{grandChild.icon}</span>{' '}
                                    {grandChild.label}
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
        {/* Settings and Logout moved to main menu for better organization */}
      </div>
    </aside>
  );
};

export default Sidebar;
// [NOTE] Sidebar updated: vivid profile, icons, and color, 2024-06-XX
