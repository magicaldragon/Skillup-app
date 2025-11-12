import { useEffect, useMemo, useState } from 'react';
import type { Student, StudentClass } from './types';
import './ManagementTableStyles.css';

export default function AttendancePanel({
  students,
  classes,
  onDataRefresh,
}: {
  students: Student[];
  classes: StudentClass[];
  onDataRefresh?: () => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');

  // Resolve selected class for exports
  const selectedClass = useMemo(
    () => classes.find((c) => (c._id || c.id) === selectedClassId),
    [classes, selectedClassId]
  );

  // Initialize defaults and persist across sessions
  useEffect(() => {
    const lastClass = localStorage.getItem('attendance:lastClassId');
    const lastDate = localStorage.getItem('attendance:lastDate');
    setSelectedClassId(lastClass || '');
    setSelectedDate(lastDate || new Date().toISOString().slice(0, 10)); // default today
  }, []);

  useEffect(() => {
    if (selectedClassId) localStorage.setItem('attendance:lastClassId', selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedDate) localStorage.setItem('attendance:lastDate', selectedDate);
  }, [selectedDate]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = (ids: string[]) => setSelectedIds(new Set(ids));
  const clearAll = () => setSelectedIds(new Set());

  const markSelectedPresent = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setStatusMessage('No students selected.');
      setStatusType('error');
      return;
    }
    try {
      setAttendance((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = 'present';
        });
        return next;
      });
      setStatusMessage(`Marked ${ids.length} students present for ${selectedDate}.`);
      setStatusType('success');
      onDataRefresh?.();
    } catch {
      setStatusMessage('Failed to mark selected students present.');
      setStatusType('error');
    }
  };
  // Export CSV (Phase 1)
  const classStudents = useMemo(
    () => students.filter((s) => (s.classIds || []).includes(selectedClassId)),
    [students, selectedClassId]
  );
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});

  // Removed unused toggle to comply with linting rules

  const exportCSV = () => {
    const cls = selectedClass;
    const classCode = cls?.classCode || cls?.name || '';
    const rows = classStudents.map((s) => [
      s.studentCode || s.id,
      s.name || '',
      attendance[s.id] || 'present',
      selectedDate,
      classCode,
    ]);
    const header = ['Student ID', 'Name', 'Status', 'Date', 'Class'];
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
          {classes.map((c) => {
            const id = c._id || c.id;
            return id ? (
              <option key={id} value={id}>
                {c.classCode || c.name}
              </option>
            ) : null;
          })}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button className="btn-export" onClick={exportCSV}>
          Export CSV
        </button>
        {/* XLSX export button removed */}
      </div>

      {statusMessage && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background: statusType === 'success' ? '#e7f7e7' : '#fdeaea',
            color: statusType === 'success' ? '#095f09' : '#7a0b0b',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div className="action-buttons" style={{ marginTop: 8 }}>
        <button className="btn-edit" onClick={() => selectAll(classStudents.map((s) => s.id))}>
          Select All
        </button>
        <button className="btn-edit" onClick={clearAll}>
          Clear All
        </button>
        <button className="btn-save" onClick={markSelectedPresent}>
          Mark all present
        </button>
      </div>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>{/* selection header is handled by buttons above */}#</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Toggle</th>
          </tr>
        </thead>
        <tbody>
          {classStudents.map((s) => (
            <tr key={s.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleSelect(s.id)}
                  aria-label={`select ${s.name}`}
                />
              </td>
              <td>{s.studentCode || s.id}</td>
              <td>{s.name}</td>
              <td>{attendance[s.id] || 'present'}</td>
              <td>
                <button
                  className="btn-edit"
                  onClick={() =>
                    setAttendance((prev: Record<string, 'present' | 'absent'>) => ({
                      ...prev,
                      [s.id]: 'present',
                    }))
                  }
                >
                  Present
                </button>
                <button
                  className="btn-delete"
                  onClick={() =>
                    setAttendance((prev: Record<string, 'present' | 'absent'>) => ({
                      ...prev,
                      [s.id]: 'absent',
                    }))
                  }
                >
                  Absent
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
