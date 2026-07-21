/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, FileSpreadsheet, ShieldAlert, Settings, Lock, Unlock, LogOut, X, AlertCircle } from 'lucide-react';
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

  // Admin Authentication & Configuration States
  const [dailyBaseline, setDailyBaseline] = useState<number>(() => {
    const saved = localStorage.getItem('packer_daily_baseline');
    return saved ? parseInt(saved, 10) : 50;
  });
  const [customBaselinesMap, setCustomBaselinesMap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('packer_custom_baselines_map');
    return saved ? JSON.parse(saved) : {};
  });
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('packer_admin_pin') || '8899'; // Default PIN
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Helper to determine the shift date string (shifts end/start at 07:00 AM)
  const getEffectiveDateStr = useCallback((date: Date): string => {
    const d = new Date(date);
    if (d.getHours() < 7) {
      // Prior to 7:00 AM, the shift belongs to the previous day
      d.setDate(d.getDate() - 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Today's effective target baseline
  const getTodayBaseline = useCallback((): number => {
    const todayStr = getEffectiveDateStr(currentTime);
    return customBaselinesMap[todayStr] !== undefined 
      ? customBaselinesMap[todayStr] 
      : dailyBaseline;
  }, [currentTime, customBaselinesMap, dailyBaseline, getEffectiveDateStr]);

  // Compute monthly accumulated target
  const getMonthlyTarget = useCallback((): number => {
    let totalTarget = 0;
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth();
    const currentHour = currentTime.getHours();
    
    // Determine the effective end day of the month based on the 7 AM shift boundary
    const tempDate = new Date(currentTime);
    if (currentHour < 7) {
      tempDate.setDate(tempDate.getDate() - 1);
    }
    const endDay = tempDate.getDate();
    const endMonth = tempDate.getMonth();
    const endYear = tempDate.getFullYear();

    for (let d = 1; d <= endDay; d++) {
      const checkDate = new Date(endYear, endMonth, d, 12, 0, 0);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0) {
        // Sunday is day off
        continue;
      }
      const yyyy = checkDate.getFullYear();
      const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
      const dd = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const storedCustom = customBaselinesMap[dateStr];
      const dailyTargetForDay = storedCustom !== undefined ? storedCustom : dailyBaseline;
      totalTarget += dailyTargetForDay;
    }
    return totalTarget;
  }, [currentTime, customBaselinesMap, dailyBaseline]);

  // Modal temporary state inputs
  const [inputEmail, setInputEmail] = useState<string>('galang.erdiansyah@mhealth.tech');
  const [inputPin, setInputPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Config editing states
  const [tempBaseline, setTempBaseline] = useState<number>(dailyBaseline);
  const [tempTodayBaseline, setTempTodayBaseline] = useState<number>(dailyBaseline);
  const [tempPin, setTempPin] = useState<string>(adminPin);
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

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
    // Dynamic targets
    const todayBaseline = getTodayBaseline();
    const monthlyTarget = getMonthlyTarget();

    // Threshold calculation for Packer POINT:
    // Daily target: green if point >= todayBaseline, else red.
    // Monthly target: green if point >= monthlyTarget, else red.
    const getBadgeStyle = (point: number) => {
      if (isMonthly) {
        return point >= monthlyTarget
          ? 'bg-[#d1fae5] text-black font-black'
          : 'bg-[#fee2e2] text-black font-black';
      } else {
        return point >= todayBaseline
          ? 'bg-[#d1fae5] text-black font-black'
          : 'bg-[#fee2e2] text-black font-black';
      }
    };

    return (
      <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full">
        {/* Card Header Title */}
        <div className="pt-2 pb-1.5 px-4 text-center">
          <h2 className="text-sm font-black tracking-wider text-blue-900 uppercase">
            {title}
          </h2>
          {isMonthly ? (
            <p className="text-[10px] font-black text-slate-500 tracking-wide uppercase mt-0.5" title="Akumulasi target harian (Senin-Sabtu) s.d. hari ini">
              Target Berjalan: ≥{monthlyTarget} Pts
            </p>
          ) : (
            <p className="text-[10px] font-black text-slate-500 tracking-wide uppercase mt-0.5">
              Target: ≥{todayBaseline} Pts
            </p>
          )}
          {/* Blue accent line exactly as in previous Productivity Picker */}
          <div className="h-[3px] bg-[#2563eb] w-full mt-1.5 rounded-full" />
        </div>

        {/* Table Headings */}
        <div className="grid grid-cols-12 px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-sm font-black text-black tracking-wider select-none">
          <span className="col-span-6">NAMA</span>
          <span className="col-span-3 text-center">SO</span>
          <span className="col-span-3 text-right pr-4">POINT</span>
        </div>

        {/* Records List */}
        <div className="flex-1 divide-y divide-slate-100 overflow-y-auto no-scrollbar px-1 max-h-[78vh] md:max-h-[calc(100vh-185px)] lg:max-h-[calc(100vh-155px)] xl:max-h-[calc(100vh-135px)] min-h-[450px]">
          {records.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400">
              Belum ada data packer aktif
            </div>
          ) : (
            records.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-12 items-center px-4 py-1.5 transition hover:bg-slate-100/80 border-b border-slate-100"
              >
                {/* Packer Name */}
                <span className="col-span-6 font-black text-sm md:text-base tracking-wide text-black uppercase truncate pr-2">
                  {item.name}
                </span>

                {/* Sales Order Count */}
                <span className="col-span-3 text-center font-black text-base md:text-lg text-black">
                  {item.so}
                </span>

                {/* Point Highlight Badge */}
                <div className="col-span-3 flex justify-end pr-1">
                  <span className={`inline-block font-black text-lg md:text-xl px-4 py-1 rounded min-w-[64px] text-center tracking-tight shadow-sm ${getBadgeStyle(item.point)}`}>
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
      <header className="bg-white border-b border-slate-200/80 px-6 py-2 shadow-xs">
        <div className="w-full flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          
          {/* Brand/Title Block */}
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight">
              PRODUKTIVITAS PACKER
            </h1>
            <p className="text-[10px] font-extrabold text-[#2563eb] tracking-wide flex items-center gap-1.5">
              <span>Update: {formatTimeDot(lastUpdated)}</span>
              {isFetching && (
                <span className="inline-block animate-spin rounded-full h-3 w-3 border border-t-transparent border-[#2563eb]" />
              )}
            </p>
          </div>

          {/* Clock, Indonesian Date & Admin Settings Button */}
          <div className="flex items-center gap-4 text-left md:text-right md:justify-end select-none">
            <div className="flex flex-col justify-center">
              <div className="text-2xl md:text-3xl font-black text-[#2563eb] font-mono tracking-wider leading-none">
                {formatTimeDot(currentTime)}
              </div>
              <div className="text-[10px] font-black text-slate-500 tracking-wider mt-0.5 uppercase">
                {formatIndonesianDate(currentTime)}
              </div>
            </div>
            
            <button
              onClick={() => {
                setTempBaseline(dailyBaseline);
                setTempTodayBaseline(getTodayBaseline());
                setTempPin(adminPin);
                setLoginError(null);
                setSettingsSuccessMsg(null);
                setInputPin('');
                setShowSettingsModal(true);
              }}
              className="p-1.5 md:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600 hover:text-slate-900 border border-slate-200/60 flex items-center justify-center cursor-pointer"
              title="Atur Baseline"
            >
              <Settings size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View of 4 Parallel Columns */}
      <main className="flex-1 p-2 md:p-4">
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
      <footer className="bg-white border-t border-slate-200/80 py-1.5 px-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="text-slate-700 w-5 h-5" />
                <span className="font-black text-slate-900 text-sm tracking-wide uppercase">Pengaturan Baseline</span>
              </div>
              <button
                onClick={() => {
                  setIsEditingPin(false);
                  setShowSettingsModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            {!isLoggedIn ? (
              /* LOGIN FORM */
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="mx-auto w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Login khusus Admin</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan akun <strong className="text-[#2563eb]">galang.erdiansyah@mhealth.tech</strong> untuk mengakses konfigurasi baseline harian.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputEmail.trim().toLowerCase() !== 'galang.erdiansyah@mhealth.tech') {
                      setLoginError('Email tidak dikenal. Akses dibatasi hanya untuk galang.erdiansyah@mhealth.tech.');
                      return;
                    }
                    if (inputPin !== adminPin) {
                      setLoginError('PIN keamanan salah. Silakan coba lagi.');
                      return;
                    }
                    setLoginError(null);
                    setIsLoggedIn(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Email Admin</label>
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-slate-50 text-slate-900 font-bold"
                      placeholder="galang.erdiansyah@mhealth.tech"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      PIN Keamanan (Default: 8899)
                    </label>
                    <input
                      type="password"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white text-slate-900 font-mono tracking-widest text-center text-lg font-black"
                      placeholder="••••"
                      maxLength={12}
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold flex items-center gap-1.5 leading-relaxed">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="flex-1 py-2 rounded border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ADMIN PANEL */
              <div className="p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Unlock size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">galang.erdiansyah@mhealth.tech</h4>
                      <span className="text-[9px] text-emerald-600 font-black tracking-wider uppercase">Login Terverifikasi</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setSettingsSuccessMsg(null);
                    }}
                    className="text-[10px] font-black text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    <LogOut size={11} />
                    <span>Keluar</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Setting 1: Baseline Default */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      1. Baseline Default (Standar Harian)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5 leading-normal">
                      Target harian standar yang digunakan pada hari-hari biasa. Sewaktu-waktu bisa Anda ubah.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={tempBaseline}
                        onChange={(e) => setTempBaseline(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-3 py-2 border border-slate-300 rounded text-center text-lg font-black text-blue-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="text-[11px] text-slate-500 leading-normal">
                        <p className="font-bold text-slate-700">Point per hari per personil</p>
                      </div>
                    </div>
                  </div>

                  {/* Setting 2: Baseline Khusus Hari Ini */}
                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      2. Baseline Khusus Hari Ini ({getEffectiveDateStr(currentTime)})
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5 leading-normal">
                      Mengubah target untuk hari ini saja. Sistem akan <strong className="text-amber-600">otomatis mengembalikannya ke Baseline Default setiap jam 07:00 pagi besok</strong> jika Anda lupa.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={tempTodayBaseline}
                        onChange={(e) => setTempTodayBaseline(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-3 py-2 border border-slate-300 rounded text-center text-lg font-black text-amber-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="text-[11px] text-slate-500 leading-normal">
                        <p className="font-bold text-slate-700">Berlaku s.d. jam 07:00 esok pagi</p>
                        <p>Target berjalan akumulasi s.d. hari ini: <strong className="text-[#2563eb] font-extrabold">{getMonthlyTarget()} Pts</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Setting 3: Edit PIN */}
                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      PIN Keamanan Baru
                    </label>
                    {isEditingPin ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempPin}
                          onChange={(e) => setTempPin(e.target.value)}
                          placeholder="Masukkan PIN baru"
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm font-mono tracking-wider focus:outline-hidden focus:border-blue-500"
                          maxLength={12}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tempPin.trim() === '') {
                              alert('PIN tidak boleh kosong!');
                              return;
                            }
                            setIsEditingPin(false);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded cursor-pointer"
                        >
                          Selesai
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 p-2 border border-slate-200 rounded">
                        <span className="font-mono text-xs tracking-wider font-bold text-slate-600">•••••••• (Terproteksi)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempPin('');
                            setIsEditingPin(true);
                          }}
                          className="text-[10px] text-blue-600 hover:underline font-black uppercase tracking-wider cursor-pointer"
                        >
                          Ubah PIN
                        </button>
                      </div>
                    )}
                  </div>

                  {settingsSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-black text-center animate-pulse">
                      {settingsSuccessMsg}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPin(false);
                        setShowSettingsModal(false);
                      }}
                      className="flex-1 py-2 rounded border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (tempBaseline <= 0 || tempTodayBaseline <= 0) {
                          alert('Target baseline harus lebih besar dari 0!');
                          return;
                        }
                        
                        // Save Default baseline
                        setDailyBaseline(tempBaseline);
                        localStorage.setItem('packer_daily_baseline', tempBaseline.toString());

                        // Save Today Custom baseline for current effective date
                        const todayStr = getEffectiveDateStr(currentTime);
                        const updatedMap = {
                          ...customBaselinesMap,
                          [todayStr]: tempTodayBaseline
                        };
                        setCustomBaselinesMap(updatedMap);
                        localStorage.setItem('packer_custom_baselines_map', JSON.stringify(updatedMap));

                        if (tempPin.trim().length > 0 && tempPin !== adminPin) {
                          setAdminPin(tempPin);
                          localStorage.setItem('packer_admin_pin', tempPin);
                        }

                        setIsEditingPin(false);
                        setSettingsSuccessMsg('Baseline berhasil disimpan!');
                        setTimeout(() => {
                          setSettingsSuccessMsg(null);
                          setShowSettingsModal(false);
                        }, 1000);
                      }}
                      className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
