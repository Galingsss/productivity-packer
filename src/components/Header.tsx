/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Clock, Database, Wifi, WifiOff, FileSpreadsheet, Play, Pause, AlertCircle } from 'lucide-react';

interface HeaderProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  countdown: number;
  lastUpdated: Date | null;
  onManualRefresh: () => void;
  isFetching: boolean;
  error: string | null;
  sheetUrl: string;
}

export default function Header({
  autoRefresh,
  onToggleAutoRefresh,
  countdown,
  lastUpdated,
  onManualRefresh,
  isFetching,
  error,
  sheetUrl,
}: HeaderProps) {
  // Format dates elegantly
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '---';
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <header className="relative w-full border-b border-slate-800/80 bg-slate-900/60 p-4 md:p-6 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title and Badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? 'animate-ping bg-teal-400' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex h-3 w-3 rounded-full ${autoRefresh ? 'bg-teal-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className="font-mono text-xs font-semibold tracking-wider text-teal-400 uppercase">
              Live Monitoring System
            </span>
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Dashboard Produktivitas <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Packer</span>
          </h1>
          
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock size={12} className="text-slate-500" />
            Terakhir diperbarui: <span className="font-mono text-teal-400">{formatTime(lastUpdated)}</span> • {formatDate(lastUpdated || new Date())}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
          {/* Public GSheet Data Reference */}
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-300"
            title="Buka Google Sheets"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">Sumber Data GSheet</span>
          </a>

          {/* Auto Refresh Toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition duration-200 cursor-pointer ${
              autoRefresh
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {autoRefresh ? (
              <>
                <Pause size={13} className="animate-pulse" />
                <span>Auto: On ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Auto: Off</span>
              </>
            )}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            disabled={isFetching}
            className={`relative flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:from-teal-400 hover:to-cyan-400 hover:shadow-cyan-400/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer`}
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>{isFetching ? 'Sinkronisasi...' : 'Refresh Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Error alert toast / bar */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-4 flex max-w-7xl items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
        >
          <AlertCircle size={14} className="shrink-0 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold">Gagal memuat data terbaru:</span> {error}. Menampilkan data cache jika tersedia.
          </div>
        </motion.div>
      )}
    </header>
  );
}
