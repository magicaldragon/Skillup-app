import { describe, expect, it } from 'vitest';
import { computeSummary, getDaysOfMonth, normalizeMonth } from '../services/attendanceService';
import type { AttendanceStudentMonthFile } from '../types';

describe('attendanceService helpers', () => {
  it('normalizeMonth enforces YYYY-MM', () => {
    expect(normalizeMonth('2025-11-12')).toBe('2025-11');
    expect(() => normalizeMonth('2025-1')).toThrow();
  });

  it('getDaysOfMonth returns correct days', () => {
    expect(getDaysOfMonth('2024-02').length).toBe(29); // leap year
    expect(getDaysOfMonth('2025-11')[0]).toBe('2025-11-01');
  });

  it('computeSummary counts statuses', () => {
    const file: AttendanceStudentMonthFile = {
      classId: 'c1',
      studentId: 's1',
      month: '2025-11',
      days: {
        '2025-11-01': { status: 'present', meta: { editedAt: 'x', editedBy: 'u' } },
        '2025-11-02': { status: 'late', meta: { editedAt: 'x', editedBy: 'u' } },
        '2025-11-03': { status: 'absent', meta: { editedAt: 'x', editedBy: 'u' } },
        '2025-11-04': { status: 'present', meta: { editedAt: 'x', editedBy: 'u' } },
      },
    };
    expect(computeSummary(file)).toEqual({ present: 2, absent: 1, late: 1 });
  });
});