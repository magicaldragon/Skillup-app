import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { menuConfig } from "../Sidebar";

describe("Temporary permission relaxation", () => {
  const key = "skillup_perm_relax";

  beforeEach(() => {
    localStorage.setItem(key, "1");
  });
  afterEach(() => {
    localStorage.removeItem(key);
  });

  it("shows attendance and school-fee for student when relaxed", () => {
    const menu = menuConfig("student");
    const mgmt = menu.find((m) => m.key === "management");
    const children = (mgmt?.children || []).filter((c) => c.visible).map((c) => c.key);
    expect(children).toContain("attendance");
    expect(children).toContain("school-fee");
  });

  it("does not enable admin-only Accounts for student when relaxed", () => {
    const menu = menuConfig("student");
    const mgmt = menu.find((m) => m.key === "management");
    const accounts = (mgmt?.children || []).find((c) => c.key === "accounts");
    expect(accounts?.visible).not.toBe(true);
  });
});