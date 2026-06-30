/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Award, Trophy, Users, TrendingUp, CalendarDays } from 'lucide-react';
import { DashboardData } from '../types';

interface MetricCardsProps {
  totals: DashboardData['totals'];
}

export default function MetricCards({ totals }: MetricCardsProps) {
  const { dailyCombined, monthly } = totals;

  const cardsData = [
    {
      id: 'daily-so',
      title: 'Total SO Harian',
      subtitle: 'Gabungan Shift 1, 2, & 3',
      value: dailyCombined.so.toLocaleString('id-ID'),
      icon: ShoppingBag,
      colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/10',
      glowClass: 'glow-teal',
      trend: `${dailyCombined.packerCount} Packer Aktif`,
      trendIcon: Users,
    },
    {
      id: 'daily-point',
      title: 'Total Point Harian',
      subtitle: 'Poin kerja shift hari ini',
      value: dailyCombined.point.toLocaleString('id-ID'),
      icon: Award,
      colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10',
      glowClass: 'glow-indigo',
      trend: `Avg: ${dailyCombined.averagePoint} Poin / Packer`,
      trendIcon: TrendingUp,
    },
    {
      id: 'daily-mvp',
      title: 'MVP Packer Hari Ini',
      subtitle: 'Poin harian tertinggi',
      value: dailyCombined.topPacker ? dailyCombined.topPacker.name : 'Tidak Ada',
      isTextSmall: true,
      subValue: dailyCombined.topPacker ? `${dailyCombined.topPacker.point} Poin (${dailyCombined.topPacker.so} SO)` : null,
      icon: Trophy,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/10',
      glowClass: 'glow-amber',
      trend: 'Performa Terbaik Harian',
      trendIcon: Award,
    },
    {
      id: 'monthly-so',
      title: 'Total SO Bulanan',
      subtitle: 'Kumulatif bulan berjalan',
      value: monthly.so.toLocaleString('id-ID'),
      icon: ShoppingBag,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
      glowClass: 'glow-emerald',
      trend: `${monthly.packerCount} Packer Terdaftar`,
      trendIcon: Users,
    },
    {
      id: 'monthly-point',
      title: 'Total Point Bulanan',
      subtitle: 'Poin akumulasi bulanan',
      value: monthly.point.toLocaleString('id-ID'),
      icon: Award,
      colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/10',
      glowClass: 'glow-sky',
      trend: `Avg: ${monthly.averagePoint} Poin / Packer`,
      trendIcon: TrendingUp,
    },
    {
      id: 'monthly-mvp',
      title: 'MVP Packer Bulanan',
      subtitle: 'Poin bulanan tertinggi',
      value: monthly.topPacker ? monthly.topPacker.name : 'Tidak Ada',
      isTextSmall: true,
      subValue: monthly.topPacker ? `${monthly.topPacker.point} Poin (${monthly.topPacker.so} SO)` : null,
      icon: Trophy,
      colorClass: 'text-pink-400 bg-pink-500/10 border-pink-500/10',
      glowClass: 'glow-pink',
      trend: 'Juara Akumulasi Bulanan',
      trendIcon: CalendarDays,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cardsData.map((card, idx) => {
          const IconComponent = card.icon;
          const TrendIconComponent = card.trendIcon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/60 ${card.glowClass}`}
            >
              {/* Decorative SVG background grid inside card */}
              <div className="absolute inset-0 -z-10 opacity-[0.02]">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                  <defs>
                    <pattern id={`grid-${card.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${card.id})`} />
                </svg>
              </div>

              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold tracking-wide text-slate-400">
                    {card.title}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ${card.colorClass}`}>
                  <IconComponent size={16} />
                </div>
              </div>

              {/* Value Area */}
              <div className="mt-4 min-h-[52px]">
                <h3 className={`font-mono font-bold leading-none tracking-tight text-white ${
                  card.isTextSmall ? 'text-sm truncate sm:text-base' : 'text-2xl md:text-3xl'
                }`}>
                  {card.value}
                </h3>
                {card.subValue && (
                  <p className="mt-1 font-mono text-xs font-semibold text-teal-400">
                    {card.subValue}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="my-2.5 border-t border-slate-800/60" />

              {/* Footer Trend */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendIconComponent size={12} className="text-slate-500" />
                <span className="font-medium truncate">{card.trend}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
