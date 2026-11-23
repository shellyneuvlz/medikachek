import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Utensils,
  HeartPulse,
  Activity,
  Layers,
  ShieldCheck,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  Moon,
  Flame,
  Droplets,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('all');
  const [searchUser, setSearchUser] = useState('');

  const fetchAdminReports = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/api/admin/reports?period=${selectedPeriod}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReports(period);
  }, [period]);

  const handleExportCSV = () => {
    if (!data?.userRecap || data.userRecap.length === 0) {
      alert('Tidak ada data pengguna untuk diekspor');
      return;
    }

    const headers = [
      'ID',
      'Nama Pengguna',
      'Email',
      'Role',
      'Status Akun',
      'Total Catatan Makanan',
      'Total Health Check',
      'Total Catatan Gejala',
      'Total Catatan Tidur',
      'Total Aktivitas Fisik',
      'Total Log Masuk',
      'Aktivitas Terakhir',
    ];

    const rows = data.userRecap.map((u: any) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      u.isActive ? 'Aktif' : 'Nonaktif',
      u.mealCount,
      u.healthCount,
      u.symptomCount,
      u.sleepCount,
      u.activityCount,
      u.totalLogs,
      u.lastActive,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `MedikaCheck_Rekap_Admin_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!data?.userRecap || data.userRecap.length === 0) {
      alert('Tidak ada data pengguna untuk diekspor');
      return;
    }

    const exportData = data.userRecap.map((u: any) => ({
      ID: u.id,
      'Nama Pengguna': u.name,
      Email: u.email,
      Role: u.role,
      Status: u.isActive ? 'Aktif' : 'Nonaktif',
      'Total Makanan': u.mealCount,
      'Total Health Check': u.healthCount,
      'Total Gejala': u.symptomCount,
      'Total Tidur': u.sleepCount,
      'Total Aktivitas': u.activityCount,
      'Total Semua Log': u.totalLogs,
      'Aktivitas Terakhir': u.lastActive,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Pengguna');
    XLSX.writeFile(wb, `MedikaCheck_Rekap_Pengguna_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredUsers = (data?.userRecap || []).filter(
    (u: any) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const PIE_COLORS = ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Rekap Laporan Data Riil Pengguna
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau seluruh metrik data asli yang masuk dari para pasien dan pengguna terdaftar di sistem.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent py-1 px-2 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">3 Bulan Terakhir</option>
            </select>
          </div>

          <button
            onClick={() => fetchAdminReports(period)}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 transition-colors shadow-xs cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Pengguna</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {loading ? '-' : data?.aggregate.totalUsers}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {loading ? '-' : `${data?.aggregate.activeUsers} Aktif`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Catatan Makanan</span>
          <div className="text-xl font-black text-teal-700 mt-1">
            {loading ? '-' : data?.aggregate.totalMeals}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Log menu masuk</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Health Check</span>
          <div className="text-xl font-black text-rose-700 mt-1">
            {loading ? '-' : data?.aggregate.totalHealthChecks}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Avg Energi: {loading ? '-' : `${data?.aggregate.avgEnergy}/10`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Laporan Gejala</span>
          <div className="text-xl font-black text-amber-700 mt-1">
            {loading ? '-' : data?.aggregate.totalSymptoms}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Keluhan fisik</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Log Tidur</span>
          <div className="text-xl font-black text-indigo-700 mt-1">
            {loading ? '-' : data?.aggregate.totalSleep}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Avg: {loading ? '-' : `${data?.aggregate.avgSleepDuration} jam`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Aktivitas Fisik</span>
          <div className="text-xl font-black text-orange-700 mt-1">
            {loading ? '-' : data?.aggregate.totalActivity}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Sesi olahraga</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Usage Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pemanfaatan Fitur Sistem ({period === 'all' ? 'Semua Waktu' : period})
              </h2>
              <p className="text-xs text-slate-400">
                Volume log data yang disimpan pengguna pada tiap kategori modul
              </p>
            </div>
            <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              Total {data?.aggregate.totalLogs || 0} Records
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Memuat data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.featureUsage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="feature" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Jumlah Record Masuk" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Meal Category Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Distribusi Kategori Makanan</h2>
            <p className="text-xs text-slate-400 mb-4">Proporsi waktu makan seluruh pengguna</p>

            <div className="h-48 w-full flex items-center justify-center">
              {loading ? (
                <div className="text-xs text-slate-400">Memuat grafik...</div>
              ) : (data?.mealCategoryDistribution || []).length === 0 ? (
                <div className="text-xs text-slate-400 text-center">Belum ada catatan makanan.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.mealCategoryDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data?.mealCategoryDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {data?.mealCategoryDistribution?.map((cat: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{cat.name}:</span>
                <span className="font-bold text-slate-900">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Top Foods & Top Symptoms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Foods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-teal-600" />
            <span>Top Makanan Terpopuler yang Dicatat Pengguna</span>
          </h3>
          {(data?.topMeals || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Belum ada makanan dicatat.</p>
          ) : (
            <div className="space-y-2">
              {data?.topMeals?.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.category}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-black text-xs shadow-xs">
                    {m.count} kali
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Symptoms */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Top Gejala yang Paling Sering Dilaporkan</span>
          </h3>
          {(data?.topSymptoms || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Belum ada gejala dicatat.</p>
          ) : (
            <div className="space-y-2">
              {data?.topSymptoms?.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-black flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-[10px] text-slate-400">Intensitas rata-rata: {s.avgIntensity}/10</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 font-black text-xs shadow-xs">
                    {s.count} laporan
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real User Contribution Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Rekapitulasi Data Per Pengguna (Real Time)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan rincian jumlah data yang sudah dimasukkan oleh masing-masing user ke database
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Makanan</th>
                <th className="py-3 px-4 text-center">Health Check</th>
                <th className="py-3 px-4 text-center">Gejala</th>
                <th className="py-3 px-4 text-center">Tidur</th>
                <th className="py-3 px-4 text-center">Aktivitas</th>
                <th className="py-3 px-4 text-center">Total Log</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                    Memuat rincian kontribusi data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-teal-700">{u.mealCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-700">{u.healthCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700">{u.symptomCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">{u.sleepCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-orange-700">{u.activityCount}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-black text-xs">
                        {u.totalLogs}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{u.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
