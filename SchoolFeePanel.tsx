import { useEffect, useMemo, useState } from 'react';
import { levelsAPI } from './services/apiService';
import { authService } from './services/authService';
import type { Level, Student, StudentClass } from './types';
import './ManagementTableStyles.css';

type FeeRow = {
  studentId: string;
  baseAmount: number;
  extras: number;
  total: number;
  paid: boolean;
  paidDate?: string;
  staffId?: string;
  changedBy?: string;
  updatedAt?: string;
  overridden?: boolean;
};

export default function SchoolFeePanel({
  students,
  classes,
  onDataRefresh,
}: {
  students: Student[];
  classes: StudentClass[];
  onDataRefresh?: () => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [levelMonthly, setLevelMonthly] = useState<Record<string, number>>({});

  // Initialize defaults and persist
  useEffect(() => {
    const lastClass = localStorage.getItem('fees:lastClassId');
    const lastMonth = localStorage.getItem('fees:lastMonth');
    setSelectedClassId(lastClass || '');
    // default to current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelectedMonth(lastMonth || currentMonth);
  }, []);
  useEffect(() => {
    if (selectedClassId) localStorage.setItem('fees:lastClassId', selectedClassId);
  }, [selectedClassId]);
  useEffect(() => {
    if (selectedMonth) localStorage.setItem('fees:lastMonth', selectedMonth);
  }, [selectedMonth]);

  // Fetch levels (for monthlyFee)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await levelsAPI.getLevels();
        const data: any = res as any;
        const levelList: Level[] = (data?.levels ?? []) as Level[];
        const map: Record<string, number> = {};
        levelList.forEach((lvl) => {
          if (lvl._id) map[lvl._id] = typeof lvl.monthlyFee === 'number' ? lvl.monthlyFee : 0;
        });
        if (alive) setLevelMonthly(map);
      } catch (e) {
        setLevelMonthly({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectedClass = useMemo(
    () => classes.find((c) => (c._id || c.id) === selectedClassId),
    [classes, selectedClassId]
  );

  const baseFromLevel = useMemo(() => {
    const levelId =
      typeof selectedClass?.levelId === 'string'
        ? selectedClass?.levelId
        : (selectedClass?.levelId as any)?._id;
    return levelId ? (levelMonthly[levelId] ?? 0) : 0;
  }, [selectedClass, levelMonthly]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    const ids = new Set(selectedClass.studentIds || []);
    return students.filter((s) => ids.has(s.id));
  }, [students, selectedClass]);

  const profile = authService.getCurrentUser();
  const staffId = profile?.id || '';
  const staffName = (profile as any)?.name || (profile as any)?.email || 'Unknown';

  // FeeMap state and update with override hint + validation
  const [feeMap, setFeeMap] = useState<Record<string, FeeRow>>({});

  useEffect(() => {
    // Prefill fee rows when class changes
    if (!selectedClass) return;
    setFeeMap((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((s) => {
        const current = next[s.id];
        const base = baseFromLevel;
        next[s.id] = {
          studentId: s.id,
          baseAmount: typeof current?.baseAmount === 'number' ? current.baseAmount : base,
          extras: current?.extras || 0,
          total:
            Number(typeof current?.baseAmount === 'number' ? current.baseAmount : base) +
            Number(current?.extras || 0),
          paid: current?.paid || false,
          paidDate: current?.paidDate,
          staffId: current?.staffId || staffId,
          changedBy: current?.changedBy || staffName,
          updatedAt: current?.updatedAt || new Date().toISOString(),
          overridden: typeof current?.baseAmount === 'number' && current?.baseAmount !== base,
        };
      });
      return next;
    });
  }, [selectedClassId, baseFromLevel]);

  const updateFee = (id: string, patch: Partial<FeeRow>) => {
    setFeeMap((prev) => {
      const current = prev[id] || {
        studentId: id,
        baseAmount: baseFromLevel,
        extras: 0,
        total: 0,
        paid: false,
      };
      const next = { ...current, ...patch };
      // validation: amounts must be non-negative numbers
      const base = Number(next.baseAmount);
      const extras = Number(next.extras);
      if (Number.isNaN(base) || Number.isNaN(extras) || base < 0 || extras < 0) {
        // reject invalid and show message
        setStatusMessage('Invalid pricing: amounts must be non-negative numbers.');
        setStatusType('error');
        return prev;
      }
      next.total = base + extras;
      next.overridden = base !== baseFromLevel;
      next.updatedAt = new Date().toISOString();
      next.changedBy = staffName;
      next.staffId = next.staffId || staffId;
      return { ...prev, [id]: next };
    });
  };

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

  // Batch: Mark all paid (with date prompt)
  const markSelectedPaid = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setStatusMessage('No students selected.');
      setStatusType('error');
      return;
    }
    const date = prompt('Enter paid date (YYYY-MM-DD). Leave blank for today:', '');
    const paidDate = (date && date.trim()) || new Date().toISOString().slice(0, 10);
    const ok = window.confirm(`Mark ${ids.length} selected as Paid on ${paidDate}?`);
    if (!ok) return;

    try {
      setFeeMap((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          const current = next[id] || {
            studentId: id,
            baseAmount: baseFromLevel,
            extras: 0,
            total: baseFromLevel,
            paid: false,
          };
          next[id] = {
            ...current,
            paid: true,
            paidDate,
            updatedAt: new Date().toISOString(),
            changedBy: staffName,
            staffId,
          };
        });
        return next;
      });
      setStatusMessage(`Marked ${ids.length} students Paid.`);
      setStatusType('success');
      onDataRefresh?.();
    } catch (e) {
      setStatusMessage('Failed to mark selected students Paid.');
      setStatusType('error');
    }
  };

  // Export CSV (Phase 1)
  const exportCSV = () => {
    const hdr = [
      'Student',
      'Base',
      'Extras',
      'Total',
      'Paid',
      'PaidDate',
      'StaffId',
      'ChangedBy',
      'UpdatedAt',
      'Overridden',
    ];
    const rows = filteredStudents.map((s) => {
      const row = feeMap[s.id] || {
        studentId: s.id,
        baseAmount: baseFromLevel,
        extras: 0,
        total: baseFromLevel,
        paid: false,
      };
      return [
        s.name,
        row.baseAmount,
        row.extras,
        row.total,
        row.paid ? 'Yes' : 'No',
        row.paidDate || '',
        row.staffId || '',
        row.changedBy || '',
        row.updatedAt || '',
        row.overridden ? 'Yes' : 'No',
      ].join(',');
    });
    const blob = new Blob([hdr.join(',') + '\n' + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const className = selectedClass?.name || 'class';
    link.download = `school_fee_${className}_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('CSV exported successfully.');
    setStatusType('success');
  };

  // NOTE: XLSX export removed due to security advisory (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)

  // Printable A4 bills (two per page)
  const printBills = () => {
    try {
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) return;
      const className = selectedClass?.name || 'Class';
      const monthLabel = selectedMonth;
      const itemsHtml = filteredStudents
        .map((s) => {
          const row = feeMap[s.id] || {
            studentId: s.id,
            baseAmount: baseFromLevel,
            extras: 0,
            total: baseFromLevel,
            paid: false,
          };
          return `
            <div class="bill">
              <h3>${className} – ${monthLabel}</h3>
              <div><strong>Student:</strong> ${s.name}</div>
              <div><strong>Base:</strong> ${row.baseAmount.toFixed(2)}</div>
              <div><strong>Extras:</strong> ${row.extras.toFixed(2)}</div>
              <div><strong>Total:</strong> ${row.total.toFixed(2)}</div>
              <div><strong>Paid:</strong> ${row.paid ? 'Yes' : 'No'}</div>
              <div><strong>Paid Date:</strong> ${row.paidDate || ''}</div>
              <div><strong>Staff:</strong> ${row.changedBy || staffName} (${row.staffId || staffId})</div>
              <div><small>UpdatedAt: ${row.updatedAt || ''}</small></div>
            </div>
          `;
        })
        .join('');
      win.document.write(`
        <html>
          <head>
            <title>${className} – ${monthLabel} Bills</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              body { font-family: Arial, sans-serif; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; }
              .bill { border: 1px solid #ddd; padding: 10mm; break-inside: avoid; }
              h3 { margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="grid">
              ${itemsHtml}
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
      setStatusMessage('Opened print preview for bills.');
      setStatusType('success');
    } catch (e) {
      setStatusMessage('Failed to open print preview.');
      setStatusType('error');
    }
  };

  return (
    <div className="school-fee-panel">
      <div className="filters">
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          {/* ... existing code ... */}
        </select>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <button className="btn-export" onClick={exportCSV}>
          Export CSV
        </button>
        {/* XLSX export button removed */}
        <button className="btn-edit" onClick={printBills}>
          Print Bills
        </button>
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
        <button className="btn-edit" onClick={() => selectAll(filteredStudents.map((s) => s.id))}>
          Select All
        </button>
        <button className="btn-edit" onClick={clearAll}>
          Clear All
        </button>
        <button className="btn-save" onClick={markSelectedPaid}>
          Mark all paid
        </button>
      </div>

      <table className="fee-table">
        <thead>
          <tr>
            <th>#</th>
            {/* ... existing code ... */}
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s) => {
            const row = feeMap[s.id] || {
              studentId: s.id,
              baseAmount: baseFromLevel,
              extras: 0,
              total: baseFromLevel,
              paid: false,
            };
            return (
              <tr key={s.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    aria-label={`select ${s.name}`}
                  />
                </td>
                {/* Student name, etc. */}
                <td>{s.name}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.baseAmount}
                    onChange={(e) => updateFee(s.id, { baseAmount: Number(e.target.value) })}
                    style={{
                      borderColor: row.overridden ? '#FF8C00' : '#ccc',
                      borderWidth: row.overridden ? 2 : 1,
                    }}
                    aria-label="Base amount"
                  />
                  {row.overridden && (
                    <div style={{ fontSize: 12, color: '#FF8C00' }}>Overridden</div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.extras}
                    onChange={(e) => updateFee(s.id, { extras: Number(e.target.value) })}
                    aria-label="Extras"
                  />
                </td>
                <td>{row.total.toFixed(2)}</td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      checked={row.paid}
                      onChange={(e) =>
                        updateFee(s.id, {
                          paid: e.target.checked,
                          paidDate: e.target.checked
                            ? new Date().toISOString().slice(0, 10)
                            : undefined,
                        })
                      }
                    />
                    Paid
                  </label>
                </td>
                <td>{row.paidDate || ''}</td>
                <td>
                  {/* Audit */}
                  <div style={{ fontSize: 12 }}>
                    StaffId: {row.staffId || staffId}
                    <br />
                    ChangedBy: {row.changedBy || staffName}
                    <br />
                    UpdatedAt: {row.updatedAt || ''}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* ... existing code ... */}
    </div>
  );
}
