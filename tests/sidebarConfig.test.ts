import { describe, it, expect } from "vitest";
import { menuConfig } from "../Sidebar";

const findChild = (items: Array<any>, key: string) => {
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children) {
      const found = findChild(item.children, key);
      if (found) return found;
    }
  }
  return null;
};

describe("Sidebar menuConfig visibility for Attendance and School Fee", () => {
  it("shows Attendance and School Fee for admin", () => {
    const menu = menuConfig("admin");
    const attendance = findChild(menu, "attendance");
    const fee = findChild(menu, "school-fee");
    expect(attendance).toBeTruthy();
    expect(attendance?.label).toMatch(/attendance/i);
    expect(attendance?.visible).toBe(true);
    expect(fee).toBeTruthy();
    expect(fee?.label).toMatch(/school fee/i);
    expect(fee?.visible).toBe(true);
  });

  it("shows Attendance and School Fee for teacher", () => {
    const menu = menuConfig("teacher");
    expect(findChild(menu, "attendance")?.visible).toBe(true);
    expect(findChild(menu, "school-fee")?.visible).toBe(true);
  });

  it("shows Attendance and School Fee for staff", () => {
    const menu = menuConfig("staff");
    expect(findChild(menu, "attendance")?.visible).toBe(true);
    expect(findChild(menu, "school-fee")?.visible).toBe(true);
  });

  it("hides Attendance and School Fee for student", () => {
    const menu = menuConfig("student");
    expect(findChild(menu, "attendance")?.visible).toBe(false);
    expect(findChild(menu, "school-fee")?.visible).toBe(false);
  });

  it("shows tabs when role is 'Administrator' (normalized to admin)", () => {
    const menu = menuConfig("administrator");
    expect(findChild(menu, "attendance")?.visible).toBe(true);
    expect(findChild(menu, "school-fee")?.visible).toBe(true);
  });
});

describe("Sidebar Management submenu ordering and presence", () => {
  const getVisibleChildren = (menu: Array<any>, parentKey: string) => {
    const parent = findChild(menu, parentKey);
    const children = parent?.children?.filter((c: any) => c.visible) ?? [];
    return children;
  };

  it("renders Attendance and School Fee under Management for admin", () => {
    const menu = menuConfig("admin");
    const children = getVisibleChildren(menu, "management");
    const keys = children.map((c: any) => c.key);
    expect(keys).toContain("attendance");
    expect(keys).toContain("school-fee");
  });

  it("orders items between Classes and Levels: classes < attendance < school-fee < levels", () => {
    const menu = menuConfig("admin");
    const children = getVisibleChildren(menu, "management");
    const indexOf = (key: string) => children.findIndex((c: any) => c.key === key);
    const iClasses = indexOf("classes");
    const iAttendance = indexOf("attendance");
    const iFee = indexOf("school-fee");
    const iLevels = indexOf("levels");
    expect(iClasses).toBeGreaterThanOrEqual(0);
    expect(iAttendance).toBeGreaterThan(iClasses);
    expect(iFee).toBeGreaterThan(iAttendance);
    expect(iLevels).toBeGreaterThan(iFee);
  });

  it("provides icons and labels for Attendance and School Fee", () => {
    const menu = menuConfig("admin");
    const attendance = findChild(menu, "attendance");
    const fee = findChild(menu, "school-fee");
    expect(!!attendance?.icon).toBe(true);
    expect(!!fee?.icon).toBe(true);
    expect(String(attendance?.label)).toMatch(/attendance/i);
    expect(String(fee?.label)).toMatch(/school\s*fee/i);
  });
});
