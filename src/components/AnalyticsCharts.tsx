/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Award, ShoppingBag } from 'lucide-react';
import { DashboardData } from '../types';

interface AnalyticsChartsProps {
  totals: DashboardData['totals'];
  monthlyRecords: DashboardData['monthly'];
}

export default function AnalyticsCharts({ totals, monthlyRecords }: AnalyticsChartsProps) {
  const [hoveredShift, setHoveredShift] = useState<string | null>(null);
  const [hoveredPacker, setHoveredPacker] = useState<string | null>(null);

  // Shift Data for Daily
  const shiftChartData = useMemo(() => {
    const s1 = totals.shift1;
    const s2 = totals.shift2;
    const s3 = totals.shift3;
    const maxPoints = Math.max(s1.point, s2.point, s3.point, 10); // avoid division by 0

    return [
      { id: 'Shift 1', name: 'Shift 1 (Pagi)', point: s1.point, so: s1.so, maxPoints, color: '#14b8a6', gradId: 'grad-s1' },
      { id: 'Shift 2', name: 'Shift 2 (Siang)', point: s2.point, so: s2.so, maxPoints, color: '#6366f1', gradId: 'grad-s2' },
      { id: 'Shift 3', name: 'Shift 3 (Malam)', point: s3.point, so: s3.so, maxPoints, color: '#f59e0b', gradId: 'grad-s3' },
    ];
  }, [totals]);

  // Top 5 Monthly Packers for Horizontal Bar Chart
  const topPackersData = useMemo(() => {
    const sorted = [...monthlyRecords].slice(0, 5);
    const maxPoints = sorted.length > 0 ? Math.max(...sorted.map((p) => p.point), 10) : 10;
    return sorted.map((p) => ({
      name: p.name,
      point: p.point,
      so: p.so,
      maxPoints,
    }));
  }, [monthlyRecords]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Shift comparison chart */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-md flex flex-col">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Komparasi Poin Antar Shift</h3>
              <p className="text-xs text-slate-500">Perbandingan total pencapaian poin hari ini</p>
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 flex flex-col justify-center min-h-[220px] pt-6">
            <div className="relative w-full h-44 flex items-end gap-6 sm:gap-10 px-4">
              {/* Y-Axis Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-800/40">
                <div className="w-full border-t border-slate-800/20" />
                <div className="w-full border-t border-slate-800/20" />
                <div className="w-full border-t border-slate-800/20" />
                <div className="w-full border-t border-slate-800/20" />
              </div>

              {shiftChartData.map((shift) => {
                const heightPercent = Math.max(5, (shift.point / shift.maxPoints) * 85);

                return (
                  <div
                    key={shift.id}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onMouseEnter={() => setHoveredShift(shift.id)}
                    onMouseLeave={() => setHoveredShift(null)}
                  >
                    {/* Tooltip on Hover */}
                    <div className={`absolute bottom-full mb-2 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1 text-center text-[10px] pointer-events-none transition-opacity duration-200 ${
                      hoveredShift === shift.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <p className="font-semibold text-white">{shift.name}</p>
                      <p className="font-mono text-teal-400 font-bold mt-0.5">{shift.point} Poin</p>
                      <p className="font-mono text-slate-500">{shift.so} SO Packed</p>
                    </div>

                    {/* Numeric value indicator top of bar */}
                    <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-white mb-2 transition">
                      {shift.point}
                    </span>

                    {/* SVG Bar */}
                    <div className="w-full sm:w-16 h-full flex items-end justify-center">
                      <svg className="w-full h-full">
                        <defs>
                          <linearGradient id={shift.gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={shift.color} stopOpacity="1" />
                            <stop offset="100%" stopColor={shift.color} stopOpacity="0.15" />
                          </linearGradient>
                        </defs>
                        <rect
                          x="10%"
                          y={`${100 - heightPercent}%`}
                          width="80%"
                          height={`${heightPercent}%`}
                          rx="4"
                          fill={`url(#${shift.gradId})`}
                          stroke={shift.color}
                          strokeWidth="1"
                          className="transition-all duration-300 hover:brightness-125"
                        />
                      </svg>
                    </div>

                    {/* Label */}
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white mt-3 transition text-center">
                      {shift.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legends */}
          <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-center gap-6 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span>Shift 1 (Pagi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Shift 2 (Siang)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Shift 3 (Malam)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Top 5 Monthly Packer Performance */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-md flex flex-col">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Top 5 Packer Bulanan</h3>
              <p className="text-xs text-slate-500">Peringkat poin kumulatif tertinggi bulan ini</p>
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 flex flex-col justify-center min-h-[220px] pt-4">
            {topPackersData.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                Belum ada data bulanan untuk grafik
              </div>
            ) : (
              <div className="space-y-3.5 pr-2">
                {topPackersData.map((packer, idx) => {
                  const barWidthPercent = (packer.point / packer.maxPoints) * 75; // leave 25% for text labels

                  return (
                    <div
                      key={packer.name}
                      className="space-y-1 group"
                      onMouseEnter={() => setHoveredPacker(packer.name)}
                      onMouseLeave={() => setHoveredPacker(null)}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300 group-hover:text-white transition truncate max-w-[140px] sm:max-w-[180px]">
                          {idx + 1}. {packer.name}
                        </span>
                        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="text-teal-400 font-bold">{packer.point} Poin</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-500">{packer.so} SO</span>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="relative h-4 w-full bg-slate-950/40 rounded overflow-hidden border border-slate-800/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidthPercent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                          className="h-full rounded bg-gradient-to-r from-indigo-500/80 to-teal-500/80 hover:brightness-110 transition"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom highlight */}
          <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
            <span>Berdasarkan total akumulasi poin</span>
            <span className="font-mono flex items-center gap-1 text-indigo-400 font-semibold">
              <Award size={10} /> Juara Bulanan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
