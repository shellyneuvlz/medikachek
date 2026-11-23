import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  Utensils,
  HeartPulse,
  BarChart3,
  Database,
  BookOpen,
  Layers,
  BellRing,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Moon,
  Flame,
  Droplets,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminStats = async () => {
    try {
      setRefreshing(true);
      const res = await apiRequest('/api/admin/reports?period=all');
      setStats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'meal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Utensils className="w-3 h-3" /> Makanan
          </span>
        );
      case 'health':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <HeartPulse className="w-3 h-3" /> Health Check
          </span>
        );
      case 'symptom':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Gejala
          </span>
        );
      case 'sleep':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Moon className="w-3 h-3" /> Tidur
          </span>
        );
      case 'activity':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Flame className="w-3 h-3" /> Aktivitas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            Log
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-purple-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Portal Administrator MedikaCheck
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Selamat Datang, {user?.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Memantau data riil yang masuk dari seluruh pengguna secara langsung. Semua statistik di dashboard ini terhubung langsung ke database PostgreSQL.
            </p>
          </div>

          <button
            onClick={fetchAdminStats}
            disabled={refreshing}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-5">
          <button
            onClick={() => onNavigate('/admin/reports')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rekap Laporan Pengguna</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/users')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Pengguna ({stats?.aggregate.totalUsers || 0})</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/foods')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Master Makanan</span>
          </button>
        </div>
      </div>

      {/* KPI Stats (Real Database Counts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengguna</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {loading ? '-' : stats?.aggregate.totalUsers}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {loading ? '-' : `${stats?.aggregate.activeUsers} akun aktif`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Log Makanan</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {loading ? '-' : stats?.aggregate.totalMeals}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dicatat oleh semua user</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Health Check</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {loading ? '-' : stats?.aggregate.totalHealthChecks}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata energi: {loading ? '-' : `${stats?.aggregate.avgEnergy}/10`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Record Masuk</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {loading ? '-' : stats?.aggregate.totalLogs}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Semua tabel di PostgreSQL</p>
        </div>
      </div>

      {/* Main Grid: Real Live Activity Stream & Top Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Real-Time User Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">Aktivitas Real-Time Pengguna</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Data terbaru yang baru saja diinput atau dicatat oleh para pengguna
              </p>
            </div>
            <button
              onClick={() => onNavigate('/admin/reports')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Rekap Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat aktivitas pengguna real-time...
            </div>
          ) : stats?.recentActivities?.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada aktivitas baru yang dicatat pengguna.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
              {stats?.recentActivities?.map((act: any) => (
                <div key={act.id} className="py-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getModuleBadge(act.module)}
                        <span className="text-xs font-bold text-slate-900">{act.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          ({act.userEmail})
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-500">{act.detail}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-600 block">{act.date}</span>
                      <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {act.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Real Top Foods & Top Symptoms */}
        <div className="space-y-6">
          {/* Top Foods */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-teal-600" />
                <span>Makanan Paling Sering Dicatat</span>
              </h3>
            </div>

            {stats?.topMeals?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada data makanan masuk.</p>
            ) : (
              <div className="space-y-2.5">
                {stats?.topMeals?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">{item.category}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 font-black text-xs">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Symptoms */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Gejala Paling Sering Dilaporkan</span>
              </h3>
            </div>

            {stats?.topSymptoms?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada keluhan gejala masuk.</p>
            ) : (
              <div className="space-y-2.5">
                {stats?.topSymptoms?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">Intensitas Rata-rata: {item.avgIntensity}/10</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-black text-xs">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real User Contribution Breakdown Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rekapitulasi Data Pengguna yang Masuk</h2>
            <p className="text-xs text-slate-400">
              Volume pencatatan data kesehatan, makanan, dan pola hidup dari setiap pengguna terdaftar
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin/users')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Manajemen User</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
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
              {stats?.userRecap?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{u.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                    }`}>
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
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {u.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Admin Actions Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Pusat CRUD Administrasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('/admin/users')}
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Manajemen Pengguna</h3>
            </div>
            <p className="text-[11px] text-slate-500">Tambah user baru, edit profil, atur status aktif/nonaktif.</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/foods')}
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Database Makanan Global</h3>
            </div>
            <p className="text-[11px] text-slate-500">Kelola master nutrisi kalori, protein, lemak, dan porsi.</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/articles')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Artikel Edukasi</h3>
            </div>
            <p className="text-[11px] text-slate-500">Publikasi wawasan nutrisi dan tips medis bagi pasien.</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/categories')}
            className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Master Kategori</h3>
            </div>
            <p className="text-[11px] text-slate-500">Kelola taksonomi makanan, gejala, dan aktivitas.</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/notifications')}
            className="p-4 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <BellRing className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Notifikasi & Pengumuman</h3>
            </div>
            <p className="text-[11px] text-slate-500">Kirim broadcast pengumuman sistem kepada seluruh user.</p>
          </div>

          <div
            onClick={() => onNavigate('/admin/reports')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Laporan Agregat Platform</h3>
            </div>
            <p className="text-[11px] text-slate-500">Analisis tren dan statistik pemanfaatan fitur sistem.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
