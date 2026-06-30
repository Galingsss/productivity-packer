/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, ShoppingBag, Users, Zap, LayoutGrid, Layers } from 'lucide-react';
import { DashboardData, PackerRecord, ShiftSummary } from '../types';

interface ShiftLeaderboardsProps {
  shift1: PackerRecord[];
  shift2: PackerRecord[];
  shift3: PackerRecord[];
  totals: DashboardData['totals'];
}

export default function ShiftLeaderboards({ shift1, shift2, shift3, totals }: ShiftLeaderboardsProps) {
  const [activeTab, setActiveTab] = useState<'s1' | 's2' | 's3'>('s1');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'tabs'>('grid'); // Grid is default for widescreen TV view

  const shiftConfigs = [
    {
      id: 's1',
      title: 'Shift 1 (Pagi)',
      records: shift1,
      summary: totals.shift1,
      color: 'teal',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      accentColor: 'border-teal-500/20',
      progressBg: 'bg-teal-500',
      iconColor: 'text-teal-400',
      glow: 'glow-teal',
    },
    {
      id: 's2',
      title: 'Shift 2 (Siang)',
      records: shift2,
      summary: totals.shift2,
      color: 'indigo',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      accentColor: 'border-indigo-500/20',
      progressBg: 'bg-indigo-500',
      iconColor: 'text-indigo-400',
      glow: 'glow-indigo',
    },
    {
      id: 's3',
      title: 'Shift 3 (Malam)',
      records: shift3,
      summary: totals.shift3,
      color: 'amber',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      accentColor: 'border-amber-500/20',
      progressBg: 'bg-amber-500',
      iconColor: 'text-amber-400',
      glow: 'glow-amber',
    },
  ];

  // Helper to render rank indicator
  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20" title="Juara 1">
            1
          </span>
        );
      case 2:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-bold text-xs shadow-md shadow-slate-300/20" title="Juara 2">
            2
          </span>
        );
      case 3:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20" title="Juara 3">
            3
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-semibold text-slate-500 pl-2">
            {rank}
          </span>
        );
    }
  };

  const renderLeaderboardCard = (config: typeof shiftConfigs[0]) => {
    const { records, summary, title, badgeColor, progressBg, iconColor, glow, accentColor } = config;

    return (
      <div className={`flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-md transition-all duration-300 ${glow}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
              {title}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
              <Users size={12} className="text-slate-500" />
              <span>{summary.packerCount} Packer Aktif</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-xl font-bold text-white leading-none">
              {summary.point} <span className="text-xs font-normal text-slate-500">Poin</span>
            </div>
            <div className="font-mono text-xs text-slate-400 mt-1">
              {summary.so} <span className="text-slate-500">SO Packed</span>
            </div>
          </div>
        </div>

        {/* Content Table / List */}
        <div className="mt-4 flex-1 space-y-3">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Zap size={24} className="text-slate-600 animate-pulse mb-2" />
              <p className="text-xs font-medium text-slate-500">Belum ada data shift berjalan</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {records.map((packer) => (
                <div
                  key={packer.name}
                  className="group relative flex flex-col rounded-lg border border-slate-800/40 bg-slate-950/25 p-3 transition hover:border-slate-700/60 hover:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Rank & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{renderRankBadge(packer.rank)}</div>
                      <span className="font-medium text-slate-200 truncate text-xs group-hover:text-white transition">
                        {packer.name}
                      </span>
                    </div>

                    {/* Performance values */}
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="font-mono text-xs">
                        <span className="text-slate-300 font-semibold">{packer.point}</span>
                        <span className="text-[10px] text-slate-500"> Pts</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 w-12">
                        {packer.so} <span className="text-slate-500 text-[10px]">SO</span>
                      </div>
                    </div>
                  </div>

                  {/* Contribution bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Kontribusi Shift</span>
                      <span className="font-mono font-medium text-slate-400">{packer.contributionPercentage}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${packer.contributionPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${progressBg}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MVP Footer */}
        {summary.topPacker && (
          <div className="mt-4 border-t border-slate-800/80 pt-3 flex items-center gap-2.5">
            <Award size={14} className={iconColor} />
            <div className="min-w-0 text-[11px]">
              <span className="text-slate-500">MVP Shift: </span>
              <span className="font-semibold text-slate-200 truncate inline-block max-w-[130px] align-bottom">
                {summary.topPacker.name.split(' (')[0]}
              </span>
              <span className="font-mono text-teal-400 ml-1">({summary.topPacker.point} Pts)</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
      {/* Title block with Layout Switcher */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award size={18} className="text-teal-400" />
            Leaderboard Shift Hari Ini
          </h2>
          <p className="text-xs text-slate-500">
            Performa per-shift berjalan (diperbarui otomatis)
          </p>
        </div>

        {/* Layout controls (Visible only on medium screen & up, since mobile will force tabs) */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'grid'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tampilkan semua shift sekaligus"
          >
            <LayoutGrid size={13} />
            <span>Semua Shift</span>
          </button>
          <button
            onClick={() => setLayoutMode('tabs')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'tabs'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tampilkan satu per satu"
          >
            <Layers size={13} />
            <span>Tab per Shift</span>
          </button>
        </div>
      </div>

      {/* RENDER GRID FOR DESKTOP (Grid mode) */}
      <div className={`${layoutMode === 'grid' ? 'hidden md:grid md:grid-cols-3' : 'hidden'} gap-5`}>
        {shiftConfigs.map((config) => (
          <div key={config.id}>{renderLeaderboardCard(config)}</div>
        ))}
      </div>

      {/* RENDER TABS FOR MOBILE OR DESKTOP (Tabs mode) */}
      <div className={`${layoutMode === 'tabs' ? 'block' : 'block md:hidden'} space-y-4`}>
        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
          {shiftConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setActiveTab(config.id as 's1' | 's2' | 's3')}
              className={`rounded-md py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === config.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              {config.title.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          {shiftConfigs.map(
            (config) =>
              activeTab === config.id && (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderLeaderboardCard(config)}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
