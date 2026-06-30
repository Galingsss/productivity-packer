/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PackerRecord {
  rank: number;
  name: string;
  so: number;
  point: number;
  contributionPercentage: number;
}

export interface ShiftSummary {
  so: number;
  point: number;
  packerCount: number;
  averagePoint: number;
  topPacker: PackerRecord | null;
}

export interface DashboardData {
  shift1: PackerRecord[];
  shift2: PackerRecord[];
  shift3: PackerRecord[];
  monthly: PackerRecord[];
  totals: {
    shift1: ShiftSummary;
    shift2: ShiftSummary;
    shift3: ShiftSummary;
    dailyCombined: ShiftSummary;
    monthly: ShiftSummary;
  };
}

export interface RefreshSettings {
  autoRefresh: boolean;
  intervalSeconds: number;
  lastUpdated: Date | null;
  countdown: number;
}
