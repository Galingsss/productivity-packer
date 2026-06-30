/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronDown, ChevronUp, Trophy, ArrowRight, Star } from 'lucide-react';
import { PackerRecord } from '../types';

interface MonthlyLeaderboardProps {
  monthlyRecords: PackerRecord[];
}

type SortField = 'rank' | 'name' | 'so' | 'point';
type SortOrder = 'asc' | 'desc';

export default function MonthlyLeaderboard({ monthlyRecords }: MonthlyLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Since rank 1 is sorted asc, point sorted desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default point and SO to desc sorting, name and rank to asc sorting
      setSortOrder(field === 'point' || field === 'so' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Process sorting & searching on monthly records
  const filteredSortedRecords = useMemo(() => {
    let result = [...monthlyRecords];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Sort records
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [monthlyRecords, searchQuery, sortField, sortOrder]);

  // Paginate records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSortedRecords, currentPage]);

  const totalPages = Math.ceil(filteredSortedRecords.length / itemsPerPage);

  // Render sort arrow helper
  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="ml-1 inline" /> : <ChevronDown size={14} className="ml-1 inline" />;
  };

  // Find top monthly MVP
  const monthlyMVP = useMemo(() => {
    if (monthlyRecords.length === 0) return null;
    return monthlyRecords.find((r) => r.rank === 1) || monthlyRecords[0];
  }, [monthlyRecords]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Monthly MVP Highlight Card (takes 4 cols in lg) */}
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-indigo-950/20 p-5 backdrop-blur-md h-full flex flex-col justify-between glow-indigo">
            {/* Decorative Ambient Radial Gradient */}
            <div className="absolute -top-12 -right-12 -z-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 -z-10 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Raja Packing Bulan Ini</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Top Performer Monthly</p>
                </div>
              </div>

              {monthlyMVP ? (
                <div className="space-y-4 pt-2">
                  <div className="relative flex items-center justify-center py-6 bg-slate-950/20 rounded-xl border border-slate-800/40">
                    <Star className="absolute top-2 right-2 text-amber-400 fill-amber-400/20 animate-pulse" size={16} />
                    <div className="text-center space-y-2">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                          <Trophy className="text-amber-400 animate-bounce" size={20} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base max-w-[180px] mx-auto truncate">
                          {monthlyMVP.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Rank 1 Kumulatif</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="rounded-lg bg-slate-950/35 border border-slate-800/30 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500">Poin Akumulasi</p>
                      <p className="font-mono text-base font-bold text-teal-400 mt-0.5">{monthlyMVP.point}</p>
                    </div>
                    <div className="rounded-lg bg-slate-950/35 border border-slate-800/30 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500">Sales Order (SO)</p>
                      <p className="font-mono text-base font-bold text-indigo-400 mt-0.5">{monthlyMVP.so}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950/20 border border-slate-800/40 rounded-lg p-2.5 text-center">
                    Kontribusi Terhadap Total Bulanan:{' '}
                    <span className="font-mono font-bold text-white">{monthlyMVP.contributionPercentage}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-500">
                  Belum ada data bulanan yang tersedia.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/40 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Updated Monthly Cycle</span>
              <span className="font-mono text-teal-500">Active</span>
            </div>
          </div>
        </div>

        {/* Right: Full Leaderboard Table (takes 8 cols in lg) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-md">
            {/* Table Filters Header */}
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Star className="text-indigo-400 fill-indigo-400/10" size={16} />
                  Akumulasi Kinerja Bulanan
                </h3>
                <p className="text-xs text-slate-500">Peringkat kumulatif packer bulan ini</p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama packer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-4 text-xs font-medium text-slate-300 placeholder-slate-500 transition focus:border-indigo-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto mt-4 no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/40 text-slate-400 font-semibold select-none">
                    <th className="py-2 px-3 cursor-pointer hover:text-white transition" onClick={() => handleSort('rank')}>
                      Rank {renderSortArrow('rank')}
                    </th>
                    <th className="py-2 px-3 cursor-pointer hover:text-white transition" onClick={() => handleSort('name')}>
                      Nama Packer {renderSortArrow('name')}
                    </th>
                    <th className="py-2 px-3 text-center cursor-pointer hover:text-white transition" onClick={() => handleSort('so')}>
                      Sales Order {renderSortArrow('so')}
                    </th>
                    <th className="py-2 px-3 text-center cursor-pointer hover:text-white transition" onClick={() => handleSort('point')}>
                      Total Point {renderSortArrow('point')}
                    </th>
                    <th className="py-2 px-3 text-right">Kontribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Tidak ada packer cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((packer) => (
                      <tr
                        key={packer.name}
                        className="hover:bg-slate-800/10 transition group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-400 group-hover:text-white transition">
                          {packer.rank === 1 ? (
                            <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-400">
                              Top 1
                            </span>
                          ) : packer.rank === 2 || packer.rank === 3 ? (
                            <span className="rounded bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400">
                              Top {packer.rank}
                            </span>
                          ) : (
                            `#${packer.rank}`
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200 group-hover:text-white transition">
                          {packer.name}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {packer.so.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-teal-400 font-bold">
                          {packer.point.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">{packer.contributionPercentage}%</span>
                            <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-teal-400"
                                style={{ width: `${packer.contributionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 mt-2">
                <p className="text-[10px] text-slate-500">
                  Menampilkan <span className="font-semibold text-slate-400">{paginatedRecords.length}</span> dari{' '}
                  <span className="font-semibold text-slate-400">{filteredSortedRecords.length}</span> tim packer
                </p>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    className="rounded-md border border-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 disabled:pointer-events-none disabled:opacity-40 transition cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <span className="font-mono text-[10px] text-slate-400 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    className="rounded-md border border-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 disabled:pointer-events-none disabled:opacity-40 transition cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
