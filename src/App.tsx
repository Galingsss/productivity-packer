/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { DashboardData, PackerRecord } from './types';
import { parsePackerCSV } from './utils/csvParser';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-coIixzk6T3oWq5-U_8_bjhDN5BuNA-KfsRgCqiZHTFSviMh3UGgNgThBBhkVW7IF6fNAa9hz55Of/pub?output=csv';
const REFRESH_INTERVAL_SECONDS = 30;

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Real-time ticking Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Auto refresh countdown
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);

  // Clock Ticker
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Data loading function
  const loadData = useCallback(async () => {
    setIsFetching(true);
    try {
      // Direct live pull from the GSheet CDN with cache buster
      const cacheBustUrl = `${GOOGLE_SHEET_CSV_URL}&t=${new Date().getTime()}`;
      const response = await fetch(cacheBustUrl);
      if (!response.ok) {
        throw new Error(`Gagal memuat data (${response.status} ${response.statusText})`);
      }
      const csvText = await response.text();
      const parsed = parsePackerCSV(csvText);
      setData(parsed);
      setError(null);
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal memproses data Google Sheets');
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Countdown handler for auto refresh
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [loadData]);

  // Formatter Helpers
  const formatTimeDot = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
  };

  const formatIndonesianDate = (date: Date) => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Render a Single Leaderboard Column Card
  const renderColumnCard = (title: string, records: PackerRecord[], isMonthly: boolean = false) => {
    // Calculate average score for monthly list to determine the baseline dynamically
    const average = isMonthly && records.length > 0
      ? records.reduce((sum, item) => sum + item.point, 0) / records.length
      : 0;

    // Threshold calculation for Packer POINT:
    // Daily target: green if point >= 40, else red.
    // Monthly target: green if point >= average of the list, else red.
    const getBadgeStyle = (point: number) => {
      if (isMonthly) {
        return point >= average
          ? 'bg-[#d1fae5] text-[#065f46]'
          : 'bg-[#fee2e2] text-[#991b1b]';
      } else {
        return point >= 40
          ? 'bg-[#d1fae5] text-[#065f46]'
          : 'bg-[#fee2e2] text-[#991b1b]';
      }
    };

    return (
      <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full">
        {/* Card Header Title */}
        <div className="pt-4 pb-2 px-4 text-center">
          <h2 className="text-sm font-black tracking-wider text-blue-900 uppercase">
            {title}
          </h2>
          {isMonthly ? (
            records.length > 0 && (
              <p className="text-[10px] font-black text-teal-600 tracking-wide uppercase mt-0.5">
                Rata-Rata: {average.toFixed(1)} Pts
              </p>
            )
          ) : (
            <p className="text-[10px] font-black text-indigo-600 tracking-wide uppercase mt-0.5">
              Target: ≥40 Pts
            </p>
          )}
          {/* Blue accent line exactly as in previous Productivity Picker */}
          <div className="h-[3px] bg-[#2563eb] w-full mt-2 rounded-full" />
        </div>

        {/* Table Headings */}
        <div className="grid grid-cols-12 px-4 py-1.5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold text-[#64748b] tracking-wider select-none">
          <span className="col-span-7">NAMA</span>
          <span className="col-span-2 text-center">SO</span>
          <span className="col-span-3 text-right pr-2">POINT</span>
        </div>

        {/* Records List */}
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto no-scrollbar px-1 max-h-[70vh] md:max-h-[calc(100vh-270px)] lg:max-h-[calc(100vh-235px)] xl:max-h-[calc(100vh-215px)] min-h-[420px]">
          {records.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              Belum ada data packer aktif
            </div>
          ) : (
            records.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-12 items-center px-3 py-2 text-slate-900 transition hover:bg-slate-50/60"
              >
                {/* Packer Name */}
                <span className="col-span-7 font-black text-[13px] tracking-wide text-slate-950 uppercase truncate pr-1">
                  {item.name}
                </span>

                {/* Sales Order Count */}
                <span className="col-span-2 text-center font-extrabold text-sm text-slate-600">
                  {item.so}
                </span>

                {/* Point Highlight Badge */}
                <div className="col-span-3 flex justify-end pr-1">
                  <span className={`inline-block font-black text-sm px-3.5 py-1 rounded min-w-[54px] text-center tracking-tight shadow-sm ${getBadgeStyle(item.point)}`}>
                    {item.point}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans flex flex-col justify-between">
      {/* Top Header Panel */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 shadow-xs">
        <div className="w-full flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          
          {/* Brand/Title Block */}
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 uppercase">
              PRODUKTIVITAS PACKER
            </h1>
            <p className="text-xs font-extrabold text-[#2563eb] tracking-wide flex items-center gap-1.5">
              <span>Update: {formatTimeDot(lastUpdated)}</span>
              {isFetching && (
                <span className="inline-block animate-spin rounded-full h-3 w-3 border border-t-transparent border-[#2563eb]" />
              )}
            </p>
          </div>

          {/* Clock & Indonesian Date Block */}
          <div className="text-left md:text-right flex flex-col justify-center">
            <div className="text-4xl md:text-5xl font-black text-[#2563eb] font-mono tracking-wider leading-none">
              {formatTimeDot(currentTime)}
            </div>
            <div className="text-xs font-black text-slate-500 tracking-wider mt-1.5 uppercase">
              {formatIndonesianDate(currentTime)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View of 4 Parallel Columns */}
      <main className="flex-1 p-4 md:p-6">
        {!data ? (
          /* Error / Loading Fallback State */
          <div className="max-w-md mx-auto my-20 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-md space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Gagal Sinkronisasi Google Sheets</h2>
              <p className="text-xs text-slate-500">
                Sistem tidak dapat menarik data dari URL publik. Silakan cek apakah Google Sheets Anda sudah dipublikasikan sebagai CSV.
              </p>
            </div>
            {error && (
              <p className="bg-slate-50 p-2.5 rounded font-mono text-[10px] text-red-700 text-left overflow-x-auto border border-slate-200">
                {error}
              </p>
            )}
            <button
              onClick={loadData}
              disabled={isFetching}
              className="w-full py-2 px-4 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              Coba Hubungkan Kembali
            </button>
          </div>
        ) : (
          /* Dashboard columns grid layout matching the screenshot perfectly */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch h-full">
            {renderColumnCard('DAILY PACKER SHIFT 1', data.shift1, false)}
            {renderColumnCard('DAILY PACKER SHIFT 2', data.shift2, false)}
            {renderColumnCard('DAILY PACKER SHIFT 3', data.shift3, false)}
            {renderColumnCard('MONTHLY PACKER', data.monthly, true)}
          </div>
        )}
      </main>

      {/* Subtle control / status footer bar */}
      <footer className="bg-white border-t border-slate-200/80 py-3 px-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Sistem Monitoring Packer v1.1.0</span>
          <span className="text-slate-300">|</span>
          <a
            href={GOOGLE_SHEET_CSV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563eb] hover:underline font-bold flex items-center gap-1"
          >
            <FileSpreadsheet size={13} />
            <span>Google Sheets Source</span>
          </a>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-teal-400"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
          </span>
          <span className="font-bold">
            Auto-refresh dalam <span className="font-mono text-[#2563eb]">{countdown}s</span>
          </span>
          <button
            onClick={loadData}
            disabled={isFetching}
            className="ml-2 px-2 py-1 rounded border border-slate-200 text-[10px] font-bold hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
            title="Refresh Sekarang"
          >
            <RefreshCw size={10} className={isFetching ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
