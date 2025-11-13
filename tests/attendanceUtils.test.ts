import { beforeEach, describe, expect, it } from "vitest";

function persistDefaults(classId: string, date: string) {
  localStorage.setItem("attendance:lastClassId", classId);
  localStorage.setItem("attendance:lastDate", date);
}
function restoreDefaults() {
  return {
    classId: localStorage.getItem("attendance:lastClassId") || "",
    date: localStorage.getItem("attendance:lastDate") || new Date().toISOString().slice(0, 10),
  };
}
function applyBatchPresent(ids: string[], map: Record<string, { status: "Present" | "Absent" }>) {
  const next = { ...map };
  ids.forEach((id) => {
    next[id] = { ...(next[id] || { status: "Absent" }), status: "Present" };
  });
  return next;
}

describe("Attendance defaults + batch", () => {
  beforeEach(() => localStorage.clear());

  it("restores today when no date stored", () => {
    const restored = restoreDefaults();
    expect(restored.classId).toBe("");
    expect(restored.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("persists and restores class/date", () => {
    persistDefaults("c1", "2025-11-01");
    const restored = restoreDefaults();
    expect(restored.classId).toBe("c1");
    expect(restored.date).toBe("2025-11-01");
  });

  it("marks selected students present", () => {
    const init: Record<string, { status: "Present" | "Absent" }> = {
      s1: { status: "Absent" },
      s2: { status: "Absent" },
      s3: { status: "Absent" },
    };
    const res = applyBatchPresent(["s1", "s3"], init);
    expect(res.s1.status).toBe("Present");
    expect(res.s2.status).toBe("Absent");
    expect(res.s3.status).toBe("Present");
  });
});
