/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardData, PackerRecord, ShiftSummary } from '../types';

/**
 * Parses the custom multi-column Packer Productivity Google Sheet CSV data.
 * Structure has 15 parallel columns:
 * 0: Daily Packer Shift 1, 1: SO, 2: POINT
 * 3: Empty separator
 * 4: Daily Packer Shift 2, 5: SO, 6: POINT
 * 7: Empty separator
 * 8: Daily Packer Shift 3, 9: SO, 10: POINT
 * 11: Empty separator
 * 12: Monthly Packer, 13: SO, 14: POINT
 */
export function parsePackerCSV(csvContent: string): DashboardData {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV data is empty or invalid');
  }

  const s1Raw: { name: string; so: number; point: number }[] = [];
  const s2Raw: { name: string; so: number; point: number }[] = [];
  const s3Raw: { name: string; so: number; point: number }[] = [];
  const mRaw: { name: string; so: number; point: number }[] = [];

  // Iterate over lines, skipping the header line (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust comma-splitter
    // Note: Cells might be empty or contain whitespace
    const cells = line.split(',');

    const getCleanVal = (idx: number): string => {
      const val = cells[idx];
      return val !== undefined ? val.trim() : '';
    };

    // 1. Shift 1 (Cols 0, 1, 2)
    const s1Name = getCleanVal(0);
    const s1So = parseInt(getCleanVal(1), 10) || 0;
    const s1Point = parseInt(getCleanVal(2), 10) || 0;
    if (
      s1Name &&
      s1Name.toLowerCase() !== 'grand total' &&
      s1Name.toLowerCase() !== 'daily packer shift 1' &&
      s1Name.toLowerCase() !== 'so' &&
      s1Name.toLowerCase() !== 'point'
    ) {
      s1Raw.push({ name: s1Name, so: s1So, point: s1Point });
    }

    // 2. Shift 2 (Cols 4, 5, 6)
    const s2Name = getCleanVal(4);
    const s2So = parseInt(getCleanVal(5), 10) || 0;
    const s2Point = parseInt(getCleanVal(6), 10) || 0;
    if (
      s2Name &&
      s2Name.toLowerCase() !== 'grand total' &&
      s2Name.toLowerCase() !== 'daily packer shift 2' &&
      s2Name.toLowerCase() !== 'so' &&
      s2Name.toLowerCase() !== 'point'
    ) {
      s2Raw.push({ name: s2Name, so: s2So, point: s2Point });
    }

    // 3. Shift 3 (Cols 8, 9, 10)
    const s3Name = getCleanVal(8);
    const s3So = parseInt(getCleanVal(9), 10) || 0;
    const s3Point = parseInt(getCleanVal(10), 10) || 0;
    if (
      s3Name &&
      s3Name.toLowerCase() !== 'grand total' &&
      s3Name.toLowerCase() !== 'daily packer shift 3' &&
      s3Name.toLowerCase() !== 'so' &&
      s3Name.toLowerCase() !== 'point'
    ) {
      s3Raw.push({ name: s3Name, so: s3So, point: s3Point });
    }

    // 4. Monthly Packer (Cols 12, 13, 14)
    const mName = getCleanVal(12);
    const mSo = parseInt(getCleanVal(13), 10) || 0;
    const mPoint = parseInt(getCleanVal(14), 10) || 0;
    if (
      mName &&
      mName.toLowerCase() !== 'grand total' &&
      mName.toLowerCase() !== 'monthly packer' &&
      mName.toLowerCase() !== 'so' &&
      mName.toLowerCase() !== 'point'
    ) {
      mRaw.push({ name: mName, so: mSo, point: mPoint });
    }
  }

  // Helper to process group: sort, assign ranks, and contribution percentage
  const processGroup = (raw: { name: string; so: number; point: number }[]): PackerRecord[] => {
    // Sort descending by point, then by so, then by name alphabetically
    const sorted = [...raw].sort((a, b) => {
      if (b.point !== a.point) {
        return b.point - a.point;
      }
      if (b.so !== a.so) {
        return b.so - a.so;
      }
      return a.name.localeCompare(b.name);
    });

    const totalPoints = sorted.reduce((sum, item) => sum + item.point, 0);

    return sorted.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      so: item.so,
      point: item.point,
      contributionPercentage: totalPoints > 0 ? Math.round((item.point / totalPoints) * 100) : 0,
    }));
  };

  const shift1 = processGroup(s1Raw);
  const shift2 = processGroup(s2Raw);
  const shift3 = processGroup(s3Raw);
  const monthly = processGroup(mRaw);

  // Compute Shift Summary stats
  const computeSummary = (records: PackerRecord[]): ShiftSummary => {
    const totalSo = records.reduce((sum, r) => sum + r.so, 0);
    const totalPoint = records.reduce((sum, r) => sum + r.point, 0);
    const count = records.length;
    const avg = count > 0 ? parseFloat((totalPoint / count).toFixed(1)) : 0;
    const top = records.length > 0 ? records[0] : null;

    return {
      so: totalSo,
      point: totalPoint,
      packerCount: count,
      averagePoint: avg,
      topPacker: top,
    };
  };

  const s1Sum = computeSummary(shift1);
  const s2Sum = computeSummary(shift2);
  const s3Sum = computeSummary(shift3);

  // Daily Combined (Shift 1 + Shift 2 + Shift 3)
  const dailySo = s1Sum.so + s2Sum.so + s3Sum.so;
  const dailyPoint = s1Sum.point + s2Sum.point + s3Sum.point;
  const dailyCount = s1Sum.packerCount + s2Sum.packerCount + s3Sum.packerCount;

  // Find daily MVP
  const allDailyPackers: (PackerRecord & { shift: string })[] = [
    ...shift1.map((p) => ({ ...p, shift: 'Shift 1' })),
    ...shift2.map((p) => ({ ...p, shift: 'Shift 2' })),
    ...shift3.map((p) => ({ ...p, shift: 'Shift 3' })),
  ];

  const sortedAllDaily = [...allDailyPackers].sort((a, b) => {
    if (b.point !== a.point) return b.point - a.point;
    if (b.so !== a.so) return b.so - a.so;
    return a.name.localeCompare(b.name);
  });

  const dailyMVP: PackerRecord | null =
    sortedAllDaily.length > 0
      ? {
          rank: 1,
          name: `${sortedAllDaily[0].name} (${sortedAllDaily[0].shift})`,
          so: sortedAllDaily[0].so,
          point: sortedAllDaily[0].point,
          contributionPercentage: dailyPoint > 0 ? Math.round((sortedAllDaily[0].point / dailyPoint) * 100) : 0,
        }
      : null;

  const dailyCombined: ShiftSummary = {
    so: dailySo,
    point: dailyPoint,
    packerCount: dailyCount,
    averagePoint: dailyCount > 0 ? parseFloat((dailyPoint / dailyCount).toFixed(1)) : 0,
    topPacker: dailyMVP,
  };

  const monthlySum = computeSummary(monthly);

  return {
    shift1,
    shift2,
    shift3,
    monthly,
    totals: {
      shift1: s1Sum,
      shift2: s2Sum,
      shift3: s3Sum,
      dailyCombined,
      monthly: monthlySum,
    },
  };
}
