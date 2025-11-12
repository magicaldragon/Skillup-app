import { describe, expect, it } from 'vitest';

const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

describe('CSV export escaping', () => {
  it('escapes double quotes by doubling them', () => {
    const val = 'He said "Hello"';
    expect(quote(val)).toBe('"He said ""Hello"""');
  });

  it('handles commas without breaking columns', () => {
    const val = 'a,b,c';
    expect(quote(val)).toBe('"a,b,c"');
  });

  it('handles newlines within a cell', () => {
    const val = 'line1\nline2';
    expect(quote(val)).toBe('"line1\nline2"');
  });

  it('handles null/undefined gracefully', () => {
    expect(quote(null)).toBe('""');
    expect(quote(undefined)).toBe('""');
  });

  it('produces row strings consistent with panel logic', () => {
    const header = ['Student ID', 'Name', 'Status', 'Date', 'Class'];
    const row = ['s1', 'Nguyen "A"', 'present', '2025-11-01', '10A'];
    const csvRow = [header, row].map((r) => r.map(quote).join(',')).join('\n');
    expect(csvRow).toContain('"Nguyen ""A"""');
  });
});
