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
});

