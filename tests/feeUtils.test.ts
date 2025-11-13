import { beforeEach, describe, expect, it } from "vitest";

type FeeRow = {
  baseAmount: number;
  extras: number;
  total: number;
  overridden?: boolean;
};
function computeFee(baseAmount: number, extras: number, baseFromLevel: number): FeeRow | null {
  if (Number.isNaN(baseAmount) || Number.isNaN(extras) || baseAmount < 0 || extras < 0) return null;
  const total = Number(baseAmount) + Number(extras);
  const overridden = baseAmount !== baseFromLevel;
  return { baseAmount, extras, total, overridden };
}

describe("SchoolFee compute + validation", () => {
  beforeEach(() => localStorage.clear());

  it("validates non-negative numeric amounts", () => {
    expect(computeFee(100, 20, 100)).toMatchObject({ total: 120 });
    expect(computeFee(-1, 0, 0)).toBeNull();
    expect(computeFee(0, -1, 0)).toBeNull();
    expect(computeFee(Number.NaN, 0, 0)).toBeNull();
  });

  it("flags overridden when base differs from level", () => {
    const res1 = computeFee(100, 0, 100);
    expect(res1?.overridden).toBe(false);
    const res2 = computeFee(120, 0, 100);
    expect(res2?.overridden).toBe(true);
  });
});
