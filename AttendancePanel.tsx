import { useEffect, useMemo, useState } from "react";
import type { AttendanceStatus, Student, StudentClass, AttendanceMonthSnapshot } from "./types";
import "./ManagementTableStyles.css";
import {
  buildDayStatusMap,
  getDaysOfMonth,
  loadClassMonth,
  setDayStatus,
} from "./services/attendanceService";

export default function AttendancePanel({
  students,
  classes,
  onDataRefresh,
}: {
  students: Student[];
  classes: StudentClass[];
  onDataRefresh?: () => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [dayMap, setDayMap] = useState<Record<string, AttendanceStatus | undefined>>({});
  const [snapshot, setSnapshot] = useState<AttendanceMonthSnapshot | null>(null);

  // Resolve selected class for exports
  const selectedClass = useMemo(
    () => classes.find((c) => (c._id || c.id) === selectedClassId),
    [classes, selectedClassId],
  );

  // Initialize defaults and persist across sessions
  useEffect(() => {
    const lastClass = localStorage.getItem("attendance:lastClassId");
    const lastDate = localStorage.getItem("attendance:lastDate");
    const date = lastDate || new Date().toISOString().slice(0, 10);
    setSelectedClassId(lastClass || "");
    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 7));
  }, []);

  useEffect(() => {
    if (selectedClassId) localStorage.setItem("attendance:lastClassId", selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("attendance:lastDate", selectedDate);
      setSelectedMonth(selectedDate.slice(0, 7));
    }
  }, [selectedDate]);

  // Load monthly snapshot and derive day status map
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedClassId || !selectedMonth) return;
      try {
        setStatusMessage("Refreshing attendance...");
        setStatusType("");
        const snap = await loadClassMonth(selectedClassId, selectedMonth);
        const map = buildDayStatusMap(snap, selectedDate);
        if (!cancelled) {
          setSnapshot(snap);
          setDayMap(map);
          setStatusMessage("");
          setStatusType("");
        }
      } catch (err) {
        console.error("AttendancePanel: failed to load month", err);
        if (!cancelled) {
          setStatusMessage("Failed to load attendance data for the selected class and month.");
          setStatusType("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedMonth, selectedDate]);

  // Selection helpers
  const selectAll = (ids: string[]) => setSelectedIds(new Set(ids));
  const clearAll = () => setSelectedIds(new Set());

  // Save helper with access control
  async function applyStatusFor(ids: string[], status: AttendanceStatus) {
    const userStr = localStorage.getItem("skillup_user");
    const editorId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id || "" : "";
    const userRole = userStr ? JSON.parse(userStr).role || "" : "";
    if (!["admin", "teacher"].includes(userRole)) {
      setStatusMessage("Access denied: only teacher/admin can edit attendance.");
      setStatusType("error");
      return;
    }
    try {
      await Promise.all(
        ids.map((id) =>
          setDayStatus(
            {
              classId: selectedClassId,
              studentId: id,
              dateISO: selectedDate,
              status,
            },
            editorId,
          ),
        ),
      );
      const snap = await loadClassMonth(selectedClassId, selectedMonth);
      setSnapshot(snap);
      setDayMap(buildDayStatusMap(snap, selectedDate));
      setStatusMessage(`Updated ${ids.length} students to "${status}" on ${selectedDate}.`);
      setStatusType("success");
      onDataRefresh?.();
    } catch (err) {
      console.error("AttendancePanel: applyStatusFor error", err);
      setStatusMessage("Failed to update attendance. Please try again.");
      setStatusType("error");
    }
  }

  async function applyStatusForDate(studentId: string, dateISO: string, status: AttendanceStatus) {
    const userStr = localStorage.getItem("skillup_user");
    const editorId = userStr ? JSON.parse(userStr).id || JSON.parse(userStr)._id || "" : "";
    const userRole = userStr ? JSON.parse(userStr).role || "" : "";
    if (!["admin", "teacher"].includes(userRole)) {
      setStatusMessage("Access denied: only teacher/admin can edit attendance.");
      setStatusType("error");
      return;
    }
    try {
      await setDayStatus(
        {
          classId: selectedClassId,
          studentId,
          dateISO,
          status,
        },
        editorId,
      );
      const snap = await loadClassMonth(selectedClassId, selectedMonth);
      setSnapshot(snap);
      setStatusMessage(`Updated ${studentId} on ${dateISO}.`);
      setStatusType("success");
      onDataRefresh?.();
    } catch (err) {
      console.error("AttendancePanel: applyStatusForDate error", err);
      setStatusMessage("Failed to update attendance. Please try again.");
      setStatusType("error");
    }
  }

  const markSelectedPresent = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setStatusMessage("No students selected.");
      setStatusType("error");
      return;
    }
    applyStatusFor(ids, "present");
  };
  const markSelectedAbsent = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setStatusMessage("No students selected.");
      setStatusType("error");
      return;
    }
    applyStatusFor(ids, "absent");
  };
  const markSelectedLate = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setStatusMessage("No students selected.");
      setStatusType("error");
      return;
    }
    applyStatusFor(ids, "late");
  };

  // Export CSV (Phase 1)
  const classStudents = useMemo(
    (): Student[] => students.filter((s: Student) => (s.classIds || []).includes(selectedClassId)),
    [students, selectedClassId],
  );
  const exportCSV = () => {
    const cls = selectedClass;
    const classCode = cls?.classCode || cls?.name || "";
    const rows = classStudents.map((s: Student) => [
      s.studentCode || s.id,
      s.name || "",
      dayMap[s.id] ?? "present",
      selectedDate,
      classCode,
    ]);
    const header = ["Student ID", "Name", "Status", "Date", "Class"];
    const csv = [header, ...rows]
      .map((r: (string | number | undefined)[]) =>
        r.map((v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${classCode}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // NOTE: XLSX export removed due to security advisory (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)

  return (
    <div className="attendance-panel">
      <div className="filters">
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c: StudentClass) => {
            const id = c._id || c.id;
            return id ? (
              <option key={id} value={id}>
                {c.classCode || c.name}
              </option>
            ) : null;
          })}
        </select>
        <div className="controls">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Filter by month"
          />
          <button className="btn-export" type="button" onClick={exportCSV}>
            Export CSV
          </button>
          <button
            className="btn-save"
            type="button"
            onClick={() => {
              window.print();
            }}
          >
            Print Monthly Report
          </button>
          <button
            className="btn-save"
            type="button"
            onClick={async () => {
              if (!selectedClassId || !selectedMonth) return;
              try {
                setStatusMessage("Refreshing attendance...");
                setStatusType("");
                const snap = await loadClassMonth(selectedClassId, selectedMonth);
                setSnapshot(snap);
                setDayMap(buildDayStatusMap(snap, selectedDate));
                setStatusMessage("Attendance refreshed");
                setStatusType("success");
              } catch (_e) {
                setStatusMessage("Failed to refresh attendance");
                setStatusType("error");
              }
            }}
          >
            Refresh
          </button>
        </div>

        {/* Removed duplicate action-buttons here to keep single source */}
        {/* <div className="action-buttons" style={{ marginTop: 8 }}>
          <button
            className="btn-edit"
            type="button"
            onClick={() => selectAll(classStudents.map((s: Student) => s.id))}
          >
            Select All
          </button>
          <button className="btn-edit" type="button" onClick={clearAll}>
            Clear All
          </button>
          <button className="btn-save" type="button" onClick={markSelectedPresent}>
            Mark all present
          </button>
          <button className="btn-delete" type="button" onClick={markSelectedAbsent}>
            Mark all absent
          </button>
          <button className="btn-edit" type="button" onClick={markSelectedLate}>
            Mark all late
          </button>
        </div> */}
      </div>

      {statusMessage && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 6,
            background: statusType === "success" ? "#e7f7e7" : "#fdeaea",
            color: statusType === "success" ? "#095f09" : "#7a0b0b",
          }}
        >
          {statusMessage}
        </div>
      )}

      <div className="action-buttons" style={{ marginTop: 8 }}>
        <button
          className="btn-edit"
          type="button"
          onClick={() => selectAll(classStudents.map((s) => s.id))}
        >
          Select All
        </button>
        <button className="btn-edit" type="button" onClick={clearAll}>
          Clear All
        </button>
        <button className="btn-save" type="button" onClick={markSelectedPresent}>
          Mark all present
        </button>
        <button className="btn-delete" type="button" onClick={markSelectedAbsent}>
          Mark all absent
        </button>
        <button className="btn-edit" type="button" onClick={markSelectedLate}>
          Mark all late
        </button>
      </div>

      <table className="attendance-table print-monthly-report">
        <thead>
          <tr>
            <th>#</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Toggle</th>
          </tr>
        </thead>
        <tbody>
          {classStudents.map((s: Student, idx: number) => (
            <tr key={s.id}>
              <td>{idx + 1}</td>
              <td>{s.studentCode || s.id}</td>
              <td>{s.name}</td>
              <td>{dayMap[s.id] || "present"}</td>
              <td>
                <button
                  className="btn-edit"
                  type="button"
                  onClick={() => applyStatusFor([s.id], "present")}
                >
                  Present
                </button>
                <button
                  className="btn-delete"
                  type="button"
                  onClick={() => applyStatusFor([s.id], "absent")}
                >
                  Absent
                </button>
                <button
                  className="btn-edit"
                  type="button"
                  onClick={() => applyStatusFor([s.id], "late")}
                >
                  Late
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {snapshot && (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                {getDaysOfMonth(selectedMonth).map((d: string) => (
                  <th key={`head-${d}`}>{d.slice(-2)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s: Student) => (
                <tr key={`grid-${s.id}`}>
                  <td>{s.name}</td>
                  {getDaysOfMonth(selectedMonth).map((d: string) => {
                    const file = snapshot.students[s.id];
                    const current = file?.days?.[d]?.status as AttendanceStatus | undefined;
                    return (
                      <td key={`cell-${s.id}-${d}`}>
                        <select
                          value={current || "present"}
                          onChange={(e) =>
                            applyStatusForDate(s.id, d, e.target.value as AttendanceStatus)
                          }
                        >
                          <option value="present">P</option>
                          <option value="absent">A</option>
                          <option value="late">L</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable monthly grid with summary */}
      <div className="print-only a4-landscape">
        <h2 className="report-title">School SKILLUP — Attendance Report — {selectedMonth}</h2>
        <p className="report-subtitle">
          Class: {selectedClass?.classCode || selectedClass?.name || selectedClassId}
        </p>
        <table className="report-grid">
          <thead>
            <tr>
              <th>Student</th>
              {getDaysOfMonth(selectedMonth).map((d: string) => (
                <th key={d}>{d.slice(-2)}</th>
              ))}
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s: Student) => {
              const id = s.id;
              return (
                <tr key={`report-${id}`}>
                  <td>{s.name}</td>
                  {getDaysOfMonth(selectedMonth).map((d: string) => (
                    <td key={`${id}-${d}`}>{dayMap[id] && d === selectedDate ? dayMap[id] : ""}</td>
                  ))}
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
