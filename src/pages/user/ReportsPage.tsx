import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
  Activity,
  HeartPulse,
  Utensils,
  Moon,
  Flame,
  Droplets,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { ReportsSummaryResponse } from '../../types/index.ts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '3m' | 'custom'>('7d');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = `?period=${period}`;
      if (period === 'custom') {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await apiRequest<ReportsSummaryResponse>(`/api/reports/summary${query}`);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, startDate, endDate]);

  const PIE_COLORS = ['#0d9488', '#059669', '#d97706', '#6366f1', '#e11d48'];

  // ==========================================
  // EXPORT EXCEL (.xlsx)
  // ==========================================
  const handleExportExcel = () => {
    if (!data) return;
    setExporting('excel');
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan & Info
      const summaryRows = [
        ['MEDIKACHECK - LAPORAN KESEHATAN DAN NUTRISI'],
        ['Nama Pengguna:', user?.name || 'Pasien'],
        ['Email:', user?.email || ''],
        ['Periode Laporan:', `${data.period.startDate} s/d ${data.period.endDate}`],
        ['Tanggal Cetak:', new Date().toLocaleDateString('id-ID')],
        [],
        ['REKAP KESEHATAN'],
        ['Total Hari Tercatat', data.summary.totalDaysRecorded],
        ['Total Health Check', data.summary.health.totalChecks],
        ['Rata-rata Energi (1-10)', data.summary.health.avgEnergy],
        ['Rata-rata Stres (1-10)', data.summary.health.avgStress],
        ['Mood Dominan', data.summary.health.dominantMood],
        ['Total Catatan Gejala', data.summary.symptoms.totalSymptoms],
        [],
        ['REKAP MAKANAN'],
        ['Total Porsi Makanan', data.summary.meals.totalMeals],
        ['Sarapan', data.summary.meals.breakfastCount],
        ['Makan Siang', data.summary.meals.lunchCount],
        ['Makan Malam', data.summary.meals.dinnerCount],
        ['Snack / Camilan', data.summary.meals.snackCount],
        [],
        ['REKAP RESPON PASCA MAKAN'],
        ['Follow-up Dicatat', data.summary.postMeal.totalFollowUps],
        ['Kembung Tercatat', data.summary.postMeal.bloatingCount],
        ['Mual Tercatat', data.summary.postMeal.nauseaCount],
        ['Mengantuk Berat Tercatat', data.summary.postMeal.sleepyCount],
        [],
        ['REKAP TIDUR & AKTIVITAS'],
        ['Rata-rata Durasi Tidur (Jam)', data.summary.sleep.avgDuration],
        ['Kualitas Tidur (1-5)', data.summary.sleep.avgQuality],
        ['Total Sesi Olahraga', data.summary.activity.totalActivities],
        ['Total Menit Olahraga', data.summary.activity.totalDurationMinutes],
        ['Total Asupan Air (ml)', data.summary.hydration.totalHydrationMl],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Sheet 2: Data Makanan
      const mealsData = data.rawLogs.meals.map((m) => ({
        Tanggal: m.date,
        Jam: m.time,
        'Nama Makanan': m.name,
        Kategori: m.category,
        Porsi: m.portion,
        Catatan: m.notes || '-',
      }));
      const wsMeals = XLSX.utils.json_to_sheet(mealsData);
      XLSX.utils.book_append_sheet(wb, wsMeals, 'Makanan');

      // Sheet 3: Catatan Kesehatan
      const healthData = data.rawLogs.health.map((h) => ({
        Tanggal: h.date,
        Jam: h.time,
        Energi: h.energy,
        Mood: h.mood,
        'Kondisi Tubuh': h.bodyCondition,
        'Kondisi Perut': h.stomachCondition,
        Stres: h.stressLevel,
        Catatan: h.notes || '-',
      }));
      const wsHealth = XLSX.utils.json_to_sheet(healthData);
      XLSX.utils.book_append_sheet(wb, wsHealth, 'Kesehatan');

      // Sheet 4: Gejala
      const symptomsData = data.rawLogs.symptoms.map((s) => ({
        Tanggal: s.date,
        Jam: s.time,
        'Nama Gejala': s.name,
        'Intensitas (1-10)': s.intensity,
        Durasi: s.duration,
        Catatan: s.notes || '-',
      }));
      const wsSymptoms = XLSX.utils.json_to_sheet(symptomsData);
      XLSX.utils.book_append_sheet(wb, wsSymptoms, 'Gejala');

      XLSX.writeFile(wb, `Laporan_MedikaCheck_${user?.name?.replace(/\s+/g, '_')}_${data.period.startDate}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor file Excel');
    } finally {
      setExporting(null);
    }
  };

  // ==========================================
  // EXPORT CSV
  // ==========================================
  const handleExportCSV = () => {
    if (!data) return;
    setExporting('csv');
    try {
      const csvRows = [
        ['Tipe_Data', 'Tanggal', 'Jam', 'Nama/Deskripsi', 'Kategori/Kondisi', 'Nilai/Intensitas', 'Catatan'],
      ];

      // Health
      data.rawLogs.health.forEach((h) => {
        csvRows.push(['KESEHATAN', h.date, h.time, h.mood, h.stomachCondition, `Energi:${h.energy}/Stres:${h.stressLevel}`, h.notes || '']);
      });

      // Meals
      data.rawLogs.meals.forEach((m) => {
        csvRows.push(['MAKANAN', m.date, m.time, m.name, m.category, m.portion, m.notes || '']);
      });

      // Symptoms
      data.rawLogs.symptoms.forEach((s) => {
        csvRows.push(['GEJALA', s.date, s.time, s.name, s.duration, `Intensitas:${s.intensity}`, s.notes || '']);
      });

      // Sleep
      data.rawLogs.sleep.forEach((sl) => {
        csvRows.push(['TIDUR', sl.date, `${sl.sleepTime}-${sl.wakeTime}`, 'Istirahat Malam', `Kualitas:${sl.quality}`, `${sl.durationHours} Jam`, sl.notes || '']);
      });

      // Activity
      data.rawLogs.activity.forEach((a) => {
        csvRows.push(['AKTIVITAS', a.date, a.time, a.activityName, a.intensity, `${a.durationMinutes} Menit`, a.notes || '']);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekap_MedikaCheck_${data.period.startDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Gagal mengekspor file CSV');
    } finally {
      setExporting(null);
    }
  };

  // ==========================================
  // EXPORT PDF
  // ==========================================
  const handleExportPDF = () => {
    if (!data) return;
    setExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(13, 148, 136); // Teal 600
      doc.rect(0, 0, 210, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('MEDIKACHECK — REKAP LAPORAN KESEHATAN', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistem Monitoring Mandiri Pola Hidup & Nutrisi Holistik', 14, 19);

      // Metadata Block
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMASI LAPORAN', 14, 33);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Nama Pengguna : ${user?.name || 'Pasien'}`, 14, 39);
      doc.text(`Email Terdaftar  : ${user?.email || '-'}`, 14, 44);
      doc.text(`Periode Data    : ${data.period.startDate} s/d ${data.period.endDate}`, 14, 49);
      doc.text(`Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 14, 54);

      // Summary Table
      autoTable(doc, {
        startY: 60,
        head: [['Indikator Kunci', 'Nilai Agregat', 'Catatan Khusus']],
        body: [
          ['Total Hari Tercatat', `${data.summary.totalDaysRecorded} Hari`, 'Pencatatan aktif dalam rentang tanggal'],
          ['Tingkat Energi Rata-rata', `${data.summary.health.avgEnergy} / 10`, `Mood paling dominan: ${data.summary.health.dominantMood}`],
          ['Tingkat Stres Rata-rata', `${data.summary.health.avgStress} / 10`, 'Skala 1 (tenang) s/d 10 (sangat tertekan)'],
          ['Total Porsi Makanan', `${data.summary.meals.totalMeals} Porsi`, `Sarapan: ${data.summary.meals.breakfastCount} | Siang: ${data.summary.meals.lunchCount} | Malam: ${data.summary.meals.dinnerCount}`],
          ['Evaluasi Efek Makanan', `${data.summary.postMeal.totalFollowUps} Catatan Respon`, `Kembung: ${data.summary.postMeal.bloatingCount}x | Mual: ${data.summary.postMeal.nauseaCount}x | Lemas: ${data.summary.postMeal.sleepyCount}x`],
          ['Durasi & Kualitas Tidur', `${data.summary.sleep.avgDuration} Jam / Hari`, `Kualitas rata-rata: ${data.summary.sleep.avgQuality}/5 Bintang`],
          ['Total Aktivitas Fisik', `${data.summary.activity.totalActivities} Sesi`, `Total durasi: ${data.summary.activity.totalDurationMinutes} Menit`],
          ['Total Keluhan Gejala', `${data.summary.symptoms.totalSymptoms} Laporan`, `Intensitas rata-rata: ${data.summary.symptoms.avgIntensity}/10`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
        styles: { fontSize: 8 },
      });

      // Meals History Table
      const finalY1 = (doc as any).lastAutoTable?.finalY || 130;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RIWAYAT MAKANAN TERKINI', 14, finalY1 + 8);

      const mealRows = data.rawLogs.meals.slice(0, 8).map((m) => [
        `${m.date} ${m.time}`,
        m.name,
        m.category,
        m.portion,
        m.notes || '-',
      ]);

      autoTable(doc, {
        startY: finalY1 + 12,
        head: [['Waktu', 'Nama Makanan', 'Kategori', 'Porsi', 'Catatan']],
        body: mealRows.length > 0 ? mealRows : [['-', 'Belum ada data', '-', '-', '-']],
        theme: 'plain',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 7 },
      });

      // Disclaimer Box (MANDATORY REQUIREMENT)
      const finalY2 = (doc as any).lastAutoTable?.finalY || 240;
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(14, finalY2 + 6, 182, 22, 'F');
      doc.setDrawColor(217, 119, 6);
      doc.rect(14, finalY2 + 6, 182, 22, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text('DISCLAIMER MEDIS MEDIKACHECK:', 18, finalY2 + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(
        '“Data dalam laporan ini berasal dari catatan pengguna dan bukan merupakan diagnosis medis',
        18,
        finalY2 + 17
      );
      doc.text(
        'atau pengganti pemeriksaan tenaga kesehatan.”',
        18,
        finalY2 + 22
      );

      doc.save(`Laporan_Medis_MedikaCheck_${data.period.startDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat dokumen PDF');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Rekap Laporan & Analisis Medis</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pusat agregasi riwayat nutrisi, respon metabolisme pasca makan, tren energi, dan kualitas hidup.
          </p>
        </div>

        {/* 3 Mandatory Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting !== null || loading}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting !== null || loading}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting !== null || loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER LAPORAN (Requirement 4) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Filter Periode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Periode Waktu:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7d', label: '7 Hari' },
              { id: '30d', label: '30 Hari' },
              { id: '3m', label: '3 Bulan' },
              { id: 'custom', label: 'Custom Date' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>
        )}

        {/* Filter Data Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-500 shrink-0">Filter Data:</span>
          {[
            { id: 'all', label: 'Semua Data' },
            { id: 'health', label: 'Kesehatan' },
            { id: 'meals', label: 'Makanan' },
            { id: 'symptoms', label: 'Gejala' },
            { id: 'sleep', label: 'Tidur' },
            { id: 'activity', label: 'Aktivitas' },
            { id: 'hydration', label: 'Hidrasi' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-teal-100 text-teal-800 font-bold border border-teal-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Mengambil data analitik terbaru dari PostgreSQL...
        </div>
      ) : !data ? (
        <div className="p-12 text-center text-xs text-slate-400">Tidak ada data untuk periode ini</div>
      ) : (
        <>
          {/* SECTION 1: REKAP KESEHATAN */}
          {(activeCategory === 'all' || activeCategory === 'health') && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-teal-600" />
                  <span>Rekap Kesehatan Umum</span>
                </h2>
                <span className="text-xs text-slate-400">{data.summary.totalDaysRecorded} Hari Tercatat</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Total Check-in</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{data.summary.health.totalChecks}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Rata-rata Energi</p>
                  <p className="text-lg font-black text-teal-700 mt-1">{data.summary.health.avgEnergy}/10</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Mood Dominan</p>
                  <p className="text-sm font-bold text-slate-900 mt-1.5">{data.summary.health.dominantMood}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Rata-rata Stres</p>
                  <p className="text-lg font-black text-amber-700 mt-1">{data.summary.health.avgStress}/10</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Catatan Gejala</p>
                  <p className="text-lg font-black text-rose-700 mt-1">{data.summary.symptoms.totalSymptoms}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400">Konsistensi Hari</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{data.summary.totalDaysRecorded} Hari</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GRAFIK ENERGI & GRAFIK MOOD (Recharts Line Charts) */}
          {(activeCategory === 'all' || activeCategory === 'health') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafik Energi & Stres */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Grafik Tren Energi & Stres (Line Chart)</h3>
                <p className="text-[11px] text-slate-400 mb-4">Fluktuasi energi vs tekanan stres harian</p>
                <div className="h-64 w-full">
                  {data.charts.energyTrend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data untuk grafik
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.charts.energyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="energy" stroke="#0d9488" strokeWidth={2.5} name="Energi (1-10)" />
                        <Line type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2} name="Stres (1-10)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Grafik Mood */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Grafik Tren Mood (Line Chart)</h3>
                <p className="text-[11px] text-slate-400 mb-4">Skor stabilitas suasana hati (1: Buruk s/d 5: Sangat Baik)</p>
                <div className="h-64 w-full">
                  {data.charts.moodTrend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data untuk grafik
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.charts.moodTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="stepAfter" dataKey="moodScore" stroke="#6366f1" strokeWidth={2.5} name="Skor Mood" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: REKAP MAKANAN & DISTRIBUSI MAKANAN (Recharts Pie Chart) */}
          {(activeCategory === 'all' || activeCategory === 'meals') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-teal-600" />
                    <span>Rekap Pola Makan & Distribusi Waktu</span>
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                    Total {data.summary.meals.totalMeals} Porsi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
                    <span className="text-[11px] text-teal-800 font-semibold">Sarapan</span>
                    <p className="text-lg font-black text-teal-900 mt-0.5">{data.summary.meals.breakfastCount}x</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[11px] text-emerald-800 font-semibold">Makan Siang</span>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">{data.summary.meals.lunchCount}x</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <span className="text-[11px] text-indigo-800 font-semibold">Makan Malam</span>
                    <p className="text-lg font-black text-indigo-900 mt-0.5">{data.summary.meals.dinnerCount}x</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <span className="text-[11px] text-amber-800 font-semibold">Snack</span>
                    <p className="text-lg font-black text-amber-900 mt-0.5">{data.summary.meals.snackCount}x</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-800 mb-2">Makanan yang Paling Sering Dicatat:</h4>
                <div className="space-y-2">
                  {data.summary.meals.mostFrequentMeals.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada makanan tercatat</p>
                  ) : (
                    data.summary.meals.mostFrequentMeals.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs">
                        <span className="font-medium text-slate-800">{m.name}</span>
                        <span className="font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                          {m.count} Kali
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pie/Donut Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center justify-between">
                <div className="w-full">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 text-center">Distribusi Kategori Makanan</h3>
                  <p className="text-[10px] text-slate-400 text-center mb-3">Proporsi waktu makan</p>
                </div>
                <div className="h-56 w-full">
                  {data.charts.mealCategoryDistribution.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data porsi
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.mealCategoryDistribution}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {data.charts.mealCategoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: REKAP KONDISI SETELAH MAKAN & GRAFIK RESPON */}
          {(activeCategory === 'all' || activeCategory === 'meals') && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Rekap Kondisi Setelah Makan & Respon Saluran Cerna</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {data.summary.postMeal.totalFollowUps} Follow-up Evaluasi
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Rata-rata Rasa Kenyang</span>
                  <p className="text-lg font-black text-slate-800 mt-1">{data.summary.postMeal.avgFullness}/10</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Keluhan Perut Kembung</span>
                  <p className="text-lg font-black text-amber-700 mt-1">{data.summary.postMeal.bloatingCount}x</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Keluhan Mual</span>
                  <p className="text-lg font-black text-rose-700 mt-1">{data.summary.postMeal.nauseaCount}x</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Mengantuk Berat (Food Coma)</span>
                  <p className="text-lg font-black text-purple-700 mt-1">{data.summary.postMeal.sleepyCount}x</p>
                </div>
              </div>

              {/* Line Chart Respon Setelah Makan */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Grafik Kondisi Setelah Makan (Line Chart):</h4>
                <div className="h-60 w-full">
                  {data.charts.postMealChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data evaluasi porsi makan
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.charts.postMealChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="fullness" stroke="#059669" strokeWidth={2} name="Kenyang (1-10)" />
                        <Line type="monotone" dataKey="energy" stroke="#0284c7" strokeWidth={2} name="Energi Pasca (1-10)" />
                        <Line type="monotone" dataKey="discomfort" stroke="#e11d48" strokeWidth={2} name="Ketidaknyamanan Perut" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: REKAP TIDUR & REKAP AKTIVITAS (Recharts Bar Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rekap & Grafik Tidur */}
            {(activeCategory === 'all' || activeCategory === 'sleep') && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Rekap Tidur & Durasi (Bar Chart)</span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Rerata: {data.summary.sleep.avgDuration} Jam
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Kualitas tidur rata-rata: {data.summary.sleep.avgQuality}/5 Bintang
                </p>
                <div className="h-60 w-full">
                  {data.charts.sleepBarChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data tidur
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts.sleepBarChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="duration" fill="#6366f1" radius={[4, 4, 0, 0]} name="Durasi Tidur (Jam)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Rekap & Grafik Aktivitas */}
            {(activeCategory === 'all' || activeCategory === 'activity') && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span>Rekap Aktivitas Fisik (Bar Chart)</span>
                  </h3>
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                    Total: {data.summary.activity.totalDurationMinutes} Menit
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  {data.summary.activity.totalActivities} sesi aktivitas tercatat
                </p>
                <div className="h-60 w-full">
                  {data.charts.activityBarChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Belum ada data aktivitas
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts.activityBarChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="duration" fill="#f97316" radius={[4, 4, 0, 0]} name="Durasi Olahraga (Menit)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: REKAP GEJALA */}
          {(activeCategory === 'all' || activeCategory === 'symptoms') && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Rekap Keluhan & Gejala</span>
                </h3>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Total {data.summary.symptoms.totalSymptoms} Catatan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500">Rata-rata Intensitas</p>
                  <p className="text-xl font-black text-rose-700 mt-1">
                    {data.summary.symptoms.avgIntensity} / 10
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Skala subjektif kenyamanan tubuh</p>
                </div>

                <div className="md:col-span-2 p-4 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-700 mb-2">Gejala Paling Sering Terjadi:</p>
                  {data.summary.symptoms.mostFrequentSymptoms.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tidak ada keluhan gejala pada periode ini</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.summary.symptoms.mostFrequentSymptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          {s.name} ({s.count}x)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: MANDATORY MEDICAL DISCLAIMER */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Peringatan & Batasan Medis Resmi
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                “Data dalam laporan ini berasal dari catatan pengguna dan bukan merupakan diagnosis medis atau pengganti pemeriksaan tenaga kesehatan.”
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
