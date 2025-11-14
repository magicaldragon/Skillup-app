// Sidebar.tsx
// Professional, responsive sidebar navigation for all roles
// Shows all sections for teachers/admins, limited for students
// Modern design, clear icons, and role-based logic
import { useState } from "react";
import "./Sidebar.css";
import {
  FaArchive,
  FaBookOpen,
  FaChalkboardTeacher,
  FaChartBar,
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
  FaUser,
  FaUserCog,
  FaUserFriends,
  FaUserPlus,
  FaUserShield,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";
import DiceBearAvatar from "./DiceBearAvatar";

export const menuConfig = (role: string) => {
  const r = (role || "").trim().toLowerCase();
  const normalized = r === "administrator" ? "admin" : r;
  const permRelax =
    typeof globalThis !== "undefined" &&
    !!globalThis.localStorage &&
    globalThis.localStorage.getItem("skillup_perm_relax") === "1";
  console.log("[Sidebar] role=", role, "normalized=", normalized, "permRelax=", permRelax);
  return [
    {
      label: "Dashboard",
      icon: <FaHome />,
      key: "dashboard",
      visible: true,
    },
    {
      label: "Management",
      icon: <FaFolderOpen />,
      key: "management",
      visible: true,
      children: [
        {
          label: "Add New Members",
          icon: <FaUserPlus />,
          key: "add-student",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Potential Students",
          icon: <FaGem />,
          key: "potential-students",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Waiting List",
          icon: <FaHourglassHalf />,
          key: "waiting-list",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Classes",
          icon: <FaUsers />,
          key: "classes",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Attendance",
          icon: <FaClipboardCheck />,
          key: "attendance",
          visible:
            permRelax || normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "School Fee",
          icon: <FaListAlt />,
          key: "school-fee",
          visible:
            permRelax || normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Levels",
          icon: <FaListAlt />,
          key: "levels",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        // Add Accounts submenu for admin, staff, and teachers
        {
          label: "Accounts",
          icon: <FaUserCog />,
          key: "accounts",
          visible: normalized === "admin" || normalized === "staff" || normalized === "teacher",
          children: [
            {
              label: "User Management",
              icon: <FaUsers />,
              key: "accounts",
              visible: normalized === "admin" || normalized === "staff" || normalized === "teacher",
            },
            {
              label: "Change Logs",
              icon: <FaClipboardList />,
              key: "changelog",
              visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
            },
          ],
        },
        {
          label: "Records",
          icon: <FaArchive />,
          key: "records",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        // Student-specific management submenu
        {
          label: "My Classes",
          icon: <FaUsers />,
          key: "my-classes",
          visible: normalized === "student",
        },
        {
          label: "My Progress",
          icon: <FaChartBar />,
          key: "my-progress",
          visible: normalized === "student",
        },
        {
          label: "Scores And Feedback",
          icon: <FaClipboardList />,
          key: "my-scores",
          visible: normalized === "student",
        },
      ],
    },
    {
      label: "Assignments",
      icon: <FaClipboardList />,
      key: "assignments",
      visible: true,
      children: [
        {
          label: "Full Practice Tests",
          icon: <FaClipboardCheck />,
          key: "full-practice",
          visible: true,
        },
        { label: "Mini Tests", icon: <FaClipboard />, key: "mini-tests", visible: true },
        { label: "Reading", icon: <FaBookOpen />, key: "reading", visible: true },
        { label: "Listening", icon: <FaMicrophone />, key: "listening", visible: true },
        { label: "Writing", icon: <FaPen />, key: "writing", visible: true },
        { label: "Speaking", icon: <FaUser />, key: "speaking", visible: true },
      ],
    },
    {
      label: "Teachers",
      icon: <FaChalkboardTeacher />,
      key: "teachers",
      visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
      children: [
        {
          label: "Create",
          icon: <FaUserTie />,
          key: "teacher-create",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Edit",
          icon: <FaUserShield />,
          key: "teacher-edit",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
        {
          label: "Assign",
          icon: <FaUserFriends />,
          key: "teacher-assign",
          visible: normalized === "staff" || normalized === "teacher" || normalized === "admin",
        },
      ],
    },

    {
      label: "Settings",
      icon: <FaUserCog />,
      key: "settings",
      visible: true,
    },
    {
      label: "Logout",
      icon: <FaSignOutAlt />,
      key: "logout",
      visible: true,
    },
  ];
};

function Sidebar({
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
}) {
  const normalizedRole = (() => {
    const r = (role || "").trim().toLowerCase();
    if (r === "administrator") return "admin";
    return r;
  })();
  const menu = menuConfig(normalizedRole);
  const managementItem = menu.find((i) => i.key === "management");
  if (managementItem && Array.isArray(managementItem.children)) {
    const permRelax =
      typeof globalThis !== "undefined" &&
      !!globalThis.localStorage &&
      globalThis.localStorage.getItem("skillup_perm_relax") === "1";
    const allowed =
      permRelax ||
      normalizedRole === "admin" || normalizedRole === "teacher" || normalizedRole === "staff";
    console.log(
      "[Sidebar] management before:",
      managementItem.children.map((c) => c.key),
      "allowed=",
      allowed,
    );
    if (allowed) {
      const childKeys = managementItem.children.map((c) => c.key);
      const idxLevels = managementItem.children.findIndex((c) => c.key === "levels");
      const idxClasses = managementItem.children.findIndex((c) => c.key === "classes");
      if (!childKeys.includes("attendance")) {
        const attendanceItem = {
          label: "Attendance",
          icon: <FaClipboardCheck />,
          key: "attendance",
          visible: true,
        };
        const insertIndex =
          idxLevels >= 0
            ? Math.max(0, idxLevels)
            : idxClasses >= 0
              ? idxClasses + 1
              : managementItem.children.length;
        managementItem.children.splice(insertIndex, 0, attendanceItem);
      }
      const childKeys2 = managementItem.children.map((c) => c.key);
      if (!childKeys2.includes("school-fee")) {
        const feeItem = {
          label: "School Fee",
          icon: <FaListAlt />,
          key: "school-fee",
          visible: true,
        };
        const idxLevels2 = managementItem.children.findIndex((c) => c.key === "levels");
        const insertIndex2 =
          idxLevels2 >= 0 ? Math.max(0, idxLevels2) : managementItem.children.length;
        managementItem.children.splice(insertIndex2, 0, feeItem);
      }
      console.log(
        "[Sidebar] management after:",
        managementItem.children.map((c) => c.key),
      );
    }
  }
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
    new Set([getDefaultOpen()].filter(Boolean) as string[]),
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
    } else if (itemKey === "logout" && onLogout) {
      onLogout();
    } else {
      onNavigate(itemKey);
    }
  };

  return (
    <aside className={`sidebar${className ? ` ${className}` : ""}`}>
      {/* User profile section */}
      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User Avatar" className="sidebar-profile-img" />
          ) : (
            <DiceBearAvatar
              seed={user?.diceBearSeed || user?.name || "User"}
              size={56}
              style={user?.diceBearStyle || "avataaars"}
            />
          )}
        </div>
        <div className="sidebar-profile-name">{user?.name || "User"}</div>
        <div className="sidebar-profile-role">
          {normalizedRole === "admin"
            ? "Administrator"
            : normalizedRole === "teacher"
              ? "Teacher"
              : normalizedRole === "staff"
                ? "Staff"
                : normalizedRole === "student"
                  ? "Student"
                  : role}
        </div>
      </div>
      {/* Notification Bell */}
      {/* removed notification bell section */}
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
                className={`sidebar-btn${activeKey === item.key ? " active" : ""}`}
                onClick={() => handleMenuClick(item.key, hasChildren)}
              >
                <span className="sidebar-menu-icon">{item.icon}</span> {item.label}
                {hasChildren && (
                  <span className={`sidebar-submenu-arrow${isOpen ? " open" : ""}`}>▶</span>
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
                            className={`sidebar-submenu-btn${activeKey === child.key ? " active" : ""}`}
                            onClick={() => onNavigate(child.key)}
                          >
                            <span className="sidebar-menu-icon">{child.icon}</span> {child.label}
                            {hasGrandChildren && (
                              <span
                                className={`sidebar-submenu-arrow${isChildOpen ? " open" : ""}`}
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
                                    className={`sidebar-submenu-btn${activeKey === grandChild.key ? " active" : ""}`}
                                    onClick={() => onNavigate(grandChild.key)}
                                  >
                                    <span className="sidebar-menu-icon">{grandChild.icon}</span>{" "}
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
}

export default Sidebar;
