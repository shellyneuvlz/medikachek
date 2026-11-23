import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Heart,
  HeartPulse,
  Brain,
  Utensils,
  Moon,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Edit3,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  X,
  ArrowRight,
  Smile,
  Meh,
  Frown,
  Activity,
  FileText,
  RotateCcw,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { HealthExamination, ReportsSummaryResponse } from '../../types/index.ts';
import { EditProfileModal } from '../../components/common/EditProfileModal.tsx';

interface UserDashboardProps {
  onNavigate: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [examinations, setExaminations] = useState<HealthExamination[]>([]);
  const [reportsData, setReportsData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MENTAL' | 'PHYSICAL' | 'NUTRITION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Examination Modal State
  const [activeExamType, setActiveExamType] = useState<'MENTAL' | 'PHYSICAL' | 'NUTRITION' | null>(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState<HealthExamination | null>(null);

  // In-app examination form states
  const [examStep, setExamStep] = useState<'form' | 'submitting' | 'result'>('form');
  const [examValidationError, setExamValidationError] = useState('');
  const [examResult, setExamResult] = useState<any>(null);

  // Mental Exam Form State
  const [mentalForm, setMentalForm] = useState({
    feelingScore: 4,
    anxietyLevel: 2,
    overthinkingFrequency: 'Kadang-kadang',
    sleepCalmness: 'Cukup Nyenyak',
    dailyEnthusiasm: 'Cukup Bersemangat',
    physicalStress: [] as string[],
    socialSupport: 'Ada teman/keluarga yang bisa diajak bercerita',
    notes: '',
  });

  // Physical Exam Form State
  const [physicalForm, setPhysicalForm] = useState({
    energy: 7,
    mood: 'Baik & Tenang',
    bodyCondition: 'Segar & Bugar',
    stomachCondition: 'Nyaman & Normal',
    stressLevel: 3,
    hydrationCups: 7,
    physicalComplaints: [] as string[],
    notes: '',
  });

  // Nutrition Exam Form State
  const [nutritionForm, setNutritionForm] = useState({
    mealRegularity: 'Teratur 3x sehari',
    vegetableFruitPortion: '1-2 porsi sehari',
    waterIntake: '6-8 gelas sehari',
    postMealResponse: 'Perut nyaman & kenyang pas',
    snackHabit: 'Camilan sehat/buah',
    digestiveSymptoms: [] as string[],
    notes: '',
  });

  // Load User Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [examsRes, reportsRes] = await Promise.all([
        apiRequest<HealthExamination[]>('/api/examinations').catch(() => []),
        apiRequest<ReportsSummaryResponse>('/api/reports/summary?period=7d').catch(() => null),
      ]);
      setExaminations(examsRes || []);
      setReportsData(reportsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered examinations
  const filteredExaminations = useMemo(() => {
    return examinations.filter((exam) => {
      const matchType = activeTab === 'ALL' || exam.type === activeTab;
      const matchSearch =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.date.includes(searchQuery);
      return matchType && matchSearch;
    });
  }, [examinations, activeTab, searchQuery]);

  // Last examination date
  const lastExam = examinations.length > 0 ? examinations[0] : null;
  const lastExamDateStr = lastExam
    ? `${new Date(lastExam.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} (${lastExam.time})`
    : 'Belum ada pemeriksaan';

  // Average Score of examinations with score
  const examsWithScores = examinations.filter((e) => e.score !== null && e.score !== undefined);
  const avgExamScore =
    examsWithScores.length > 0
      ? Math.round(
          examsWithScores.reduce((acc, curr) => acc + (curr.score || 0), 0) / examsWithScores.length
        )
      : null;

  // Handle Starting Examination
  const startExamination = (type: 'MENTAL' | 'PHYSICAL' | 'NUTRITION') => {
    setActiveExamType(type);
    setExamStep('form');
    setExamValidationError('');
    setExamResult(null);
  };

  // Close Examination Modal
  const closeExamModal = () => {
    setActiveExamType(null);
    setExamStep('form');
    setExamValidationError('');
    setExamResult(null);
  };

  // Submit Examination Handler
  const handleSaveExamination = async () => {
    setExamValidationError('');
    setExamStep('submitting');

    try {
      let title = '';
      let category = '';
      let score = 0;
      let status = '';
      let summary = '';
      let recommendations: string[] = [];
      let answers: any = {};
      let results: any = {};

      if (activeExamType === 'MENTAL') {
        title = 'Skrining Kesejahteraan Mental & Emosi';
        category = 'Kesehatan Mental';
        answers = mentalForm;

        // Calculate mental score (0 - 100)
        let calcScore = 0;
        calcScore += mentalForm.feelingScore * 8; // max 40
        calcScore += Math.max(0, 6 - mentalForm.anxietyLevel) * 6; // max 30

        if (mentalForm.overthinkingFrequency === 'Jarang Sekali') calcScore += 10;
        else if (mentalForm.overthinkingFrequency === 'Kadang-kadang') calcScore += 6;
        else calcScore += 2;

        if (mentalForm.sleepCalmness === 'Sangat Nyenyak') calcScore += 10;
        else if (mentalForm.sleepCalmness === 'Cukup Nyenyak') calcScore += 7;
        else calcScore += 3;

        if (mentalForm.dailyEnthusiasm === 'Sangat Bersemangat') calcScore += 10;
        else if (mentalForm.dailyEnthusiasm === 'Cukup Bersemangat') calcScore += 7;
        else calcScore += 3;

        // Penalty for physical stress complaints
        calcScore -= mentalForm.physicalStress.length * 3;
        score = Math.min(100, Math.max(20, Math.round(calcScore)));

        if (score >= 80) {
          status = 'Sangat Sejahtera & Stabil';
          summary = 'Kondisi psikologis dan emosional Anda saat ini berada dalam rentang optimal dan sangat stabil.';
          recommendations = [
            'Pertahankan kebiasaan pola tidur teratur dan konsistensi istirahat.',
            'Lanjutkan aktivitas fisik santai seperti jalan pagi atau peregangan ringan.',
            'Terus jaga komunikasi hangat dengan lingkaran pertemanan atau keluarga terdekat.',
          ];
        } else if (score >= 60) {
          status = 'Kondisi Baik & Cukup Tenang';
          summary = 'Kondisi emosi Anda cukup baik, terdapat sedikit riak stres ringan yang masih dalam batas wajar.';
          recommendations = [
            'Berikan jeda sejenak dari rutinitas padat atau paparan gawai menjelang waktu tidur.',
            'Lakukan latihan pernapasan relaksasi 4-7-8 saat pikiran terasa terlalu ramai.',
            'Perbanyak asupan air hangat dan kurangi konsumsi kafein berlebih di sore hari.',
          ];
        } else {
          status = 'Perlu Relaksasi & Perhatian Ekstra';
          summary = 'Tubuh dan pikiran Anda menunjukkan tanda-tanda kelelahan emosional atau tekanan yang perlu segera diredakan.';
          recommendations = [
            'Ambil waktu jeda hari ini untuk beristirahat penuh tanpa membebani diri dengan target berat.',
            'Ceritakan beban pikiran kepada orang terpercaya yang bisa mendengarkan tanpa menghakimi.',
            'Jika rasa cemas atau hampa berlanjut lebih dari 2 minggu, pertimbangkan untuk berdialog dengan konselor atau psikolog profesional.',
          ];
        }

        results = {
          score,
          status,
          summary,
          stressLevelLabel: mentalForm.anxietyLevel <= 2 ? 'Rendah (Terkendali)' : mentalForm.anxietyLevel <= 3 ? 'Sedang' : 'Tinggi',
          affirmation: 'Setiap perasaan Anda valid. Istirahat sejenak bukanlah tanda kelemahan, melainkan cara tubuh menyayangi Anda.',
        };
      } else if (activeExamType === 'PHYSICAL') {
        title = 'Pemeriksaan Kebugaran & Kondisi Fisik Tubuh';
        category = 'Kesehatan Fisik';
        answers = physicalForm;

        // Calculate physical score
        const energyPoints = physicalForm.energy * 4; // max 40
        const stressPoints = Math.max(0, 10 - physicalForm.stressLevel) * 3; // max 30
        let stomachPoints = 20;
        if (physicalForm.stomachCondition.includes('Nyaman')) stomachPoints = 30;
        else if (physicalForm.stomachCondition.includes('Sedikit')) stomachPoints = 20;
        else stomachPoints = 10;

        let hydrationBonus = physicalForm.hydrationCups >= 7 ? 10 : 5;
        let total = energyPoints + stressPoints + stomachPoints + hydrationBonus;
        total -= physicalForm.physicalComplaints.length * 4;
        score = Math.min(100, Math.max(25, Math.round(total / 1.1)));

        if (score >= 80) {
          status = 'Kondisi Fisik Optimal';
          summary = 'Vitalitas, pencernaan, dan tingkat energi fisik Anda dalam kondisi prima dan seimbang.';
          recommendations = [
            'Pertahankan asupan cairan minimal 2 liter per hari.',
            'Lanjutkan olahraga ringan berintensitas sedang minimal 30 menit.',
            'Jaga waktu makan tetap tepat waktu.',
          ];
        } else if (score >= 60) {
          status = 'Fisik Cukup Bugar';
          summary = 'Kondisi fisik secara umum baik, namun terdapat sedikit indikasi kelelahan otot atau ketegangan tubuh.';
          recommendations = [
            'Lakukan peregangan otot leher dan punggung setiap 2 jam bekerja.',
            'Tidur malam lebih awal minimal 7-8 jam untuk pemulihan jaringan tubuh.',
            'Hindari makanan terlalu asam atau pedas di malam hari.',
          ];
        } else {
          status = 'Perlu Pemulihan & Istirahat';
          summary = 'Tubuh Anda memberi sinyal kelelahan fisik atau rasa kurang nyaman pada lambung yang membutuhkan istirahat.';
          recommendations = [
            'Segera kurangi aktivitas fisik berat hari ini.',
            'Minum air hangat bertahap dan konsumsi makanan lunak yang ramah lambung.',
            'Bila keluhan nyeri atau begah tidak berkurang dalam 48 jam, periksakan ke klinik kesehatan terdekat.',
          ];
        }

        results = {
          score,
          status,
          summary,
          hydrationEvaluation: physicalForm.hydrationCups >= 7 ? 'Sangat Baik' : 'Kurang (Perlu ditambah)',
        };
      } else if (activeExamType === 'NUTRITION') {
        title = 'Evaluasi Nutrisi & Pola Makan Harian';
        category = 'Nutrisi & Makanan';
        answers = nutritionForm;

        let nutScore = 50;
        if (nutritionForm.mealRegularity.includes('Teratur')) nutScore += 20;
        else nutScore += 8;

        if (nutritionForm.vegetableFruitPortion.includes('3 porsi') || nutritionForm.vegetableFruitPortion.includes('1-2')) nutScore += 15;
        if (nutritionForm.waterIntake.includes('6-8')) nutScore += 15;
        if (nutritionForm.postMealResponse.includes('nyaman')) nutScore += 10;
        else nutScore -= 10;

        nutScore -= nutritionForm.digestiveSymptoms.length * 5;
        score = Math.min(100, Math.max(30, Math.round(nutScore)));

        if (score >= 80) {
          status = 'Pola Nutrisi Seimbang';
          summary = 'Asupan gizi harian dan kenyamanan pencernaan Anda terpelihara dengan sangat baik.';
          recommendations = [
            'Pertahankan variasi warna sayur dan buah dalam piring Anda.',
            'Kunyah makanan secara perlahan (20-30 kali) untuk meringankan kerja lambung.',
            'Tetap batasi gula dan lemak jenuh berlebih.',
          ];
        } else if (score >= 60) {
          status = 'Nutrisi Cukup Baik';
          summary = 'Pola makan cukup teratur, namun perlu penambahan serat alami dan keteraturan jadwal makan.';
          recommendations = [
            'Tambahkan 1 porsi buah potong segar saat sarapan atau makan siang.',
            'Hindari langsung berbaring setelah makan, beri jeda minimal 2 jam.',
            'Tingkatkan minum air putih bersih antara waktu makan.',
          ];
        } else {
          status = 'Perlu Penyesuaian Pola Makan';
          summary = 'Pencernaan Anda mengalami sedikit gangguan begah atau jadwal makan belum stabil.';
          recommendations = [
            'Terapkan pola makan porsi kecil tapi sering (small frequent meals).',
            'Kurangi gorengan berminyak tinggi dan minuman bersoda.',
            'Konsumsi pisang atau oatmeal hangat yang menenangkan dinding lambung.',
          ];
        }

        results = {
          score,
          status,
          summary,
        };
      }

      // Save to database API
      const savedExam = await apiRequest<HealthExamination>('/api/examinations', {
        method: 'POST',
        body: JSON.stringify({
          type: activeExamType,
          title,
          category,
          score,
          status,
          summary,
          answers,
          results,
          recommendations,
          notes: (answers as any).notes || '',
        }),
      });

      // Update local state immediately so user sees their new record
      setExaminations((prev) => [savedExam, ...prev]);
      setExamResult({
        exam: savedExam,
        title,
        score,
        status,
        summary,
        recommendations,
        results,
      });
      setExamStep('result');
    } catch (err: any) {
      setExamValidationError(err.message || 'Gagal menyimpan hasil pemeriksaan. Silakan coba lagi.');
      setExamStep('form');
    }
  };

  // Delete examination handler
  const handleDeleteExam = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pemeriksaan ini?')) return;
    try {
      await apiRequest(`/api/examinations/${id}`, { method: 'DELETE' });
      setExaminations((prev) => prev.filter((e) => e.id !== id));
      if (selectedExamDetail?.id === id) {
        setSelectedExamDetail(null);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus catatan pemeriksaan.');
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 font-sans text-[#493B39]">
      {/* 1. Header & Welcome Card */}
      <div className="rounded-lg bg-[#FFFCFA] border border-[#D9A6A0]/50 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8C5E58] mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#8C5E58]" />
              <span>{todayStr}</span>
              <span className="text-[#D9A6A0]">•</span>
              <span>Portal Rekam Medis & Skrining Mandiri</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#493B39]">
              Selamat Datang, {user?.name || 'Pasien'}
            </h1>
            <p className="text-xs sm:text-sm text-[#493B39]/75 mt-2 leading-relaxed">
              Pantau kesehatan mental, kebugaran fisik, dan respon pola makan secara mandiri.
              Seluruh riwayat pemeriksaan otomatis tercatat dan tersimpan pada arsip kesehatan pribadi Anda.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <button
                onClick={() => startExamination('MENTAL')}
                className="px-4 py-2 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Brain className="w-4 h-4 text-white" />
                <span>Skrining Kesejahteraan Mental</span>
              </button>
              <button
                onClick={() => startExamination('PHYSICAL')}
                className="px-4 py-2 rounded-md bg-[#FAF0E8] hover:bg-[#FFF5F3] text-[#493B39] border border-[#D9A6A0]/50 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <HeartPulse className="w-4 h-4 text-[#8C5E58]" />
                <span>Skrining Kondisi Fisik</span>
              </button>
              <button
                onClick={() => startExamination('NUTRITION')}
                className="px-4 py-2 rounded-md bg-[#FAF0E8] hover:bg-[#FFF5F3] text-[#493B39] border border-[#D9A6A0]/50 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-[#8C5E58]" />
                <span>Skrining Respon Nutrisi</span>
              </button>
            </div>
          </div>

          {/* User Account Card */}
          <div className="p-4 sm:p-5 rounded-md bg-[#FAF0E8]/70 border border-[#D9A6A0]/50 lg:w-72 shrink-0">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-12 h-12 rounded-md border border-[#D9A6A0] bg-[#FFFCFA] overflow-hidden flex items-center justify-center shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-[#8C5E58]" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-sm font-bold text-[#493B39] truncate">{user?.name}</h4>
                <p className="text-[11px] text-[#493B39]/70 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C5E58] mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Pasien MedikaCheck'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full py-1.5 px-3 rounded-md bg-white hover:bg-[#FFF5F3] border border-[#D9A6A0]/60 text-xs font-medium text-[#8C5E58] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Nama & Foto Profil</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Aktivitas & Statistik Pemeriksaan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemeriksaan */}
        <div className="p-4 sm:p-5 rounded-md bg-[#FFFCFA] border border-[#D9A6A0]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#493B39]/70">Pemeriksaan Selesai</span>
            <div className="w-7 h-7 rounded-md bg-[#FAF0E8] text-[#8C5E58] flex items-center justify-center border border-[#D9A6A0]/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#493B39]">
            {loading ? '...' : examinations.length}
          </div>
          <p className="text-[11px] text-[#493B39]/60 mt-1">
            Total skrining mandiri tersimpan
          </p>
        </div>

        {/* Card 2: Skor Terakhir / Rata-rata */}
        <div className="p-4 sm:p-5 rounded-md bg-[#FFFCFA] border border-[#D9A6A0]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#493B39]/70">Skor Terakhir</span>
            <div className="w-7 h-7 rounded-md bg-[#FAF0E8] text-[#8C5E58] flex items-center justify-center border border-[#D9A6A0]/40">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#493B39]">
            {lastExam?.score ? `${lastExam.score}/100` : '-'}
          </div>
          <p className="text-[11px] text-[#493B39]/60 mt-1 truncate">
            {lastExam ? `Status: ${lastExam.status}` : 'Belum ada data'}
          </p>
        </div>

        {/* Card 3: Tanggal Terakhir */}
        <div className="p-4 sm:p-5 rounded-md bg-[#FFFCFA] border border-[#D9A6A0]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#493B39]/70">Pemeriksaan Terakhir</span>
            <div className="w-7 h-7 rounded-md bg-[#FAF0E8] text-[#8C5E58] flex items-center justify-center border border-[#D9A6A0]/40">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#493B39] truncate">
            {lastExam ? lastExam.date : '-'}
          </div>
          <p className="text-[11px] text-[#493B39]/60 mt-1 truncate">
            {lastExam ? lastExam.title : 'Belum pernah skrining'}
          </p>
        </div>

        {/* Card 4: Kebugaran Fisik Rutin */}
        <div className="p-4 sm:p-5 rounded-md bg-[#FFFCFA] border border-[#D9A6A0]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#493B39]/70">Kebugaran Fisik (7 Hari)</span>
            <div className="w-7 h-7 rounded-md bg-[#FAF0E8] text-[#8C5E58] flex items-center justify-center border border-[#D9A6A0]/40">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#493B39]">
            {reportsData?.summary.health.avgEnergy ? `${reportsData.summary.health.avgEnergy}/10` : '8/10'}
          </div>
          <p className="text-[11px] text-[#493B39]/60 mt-1 truncate">
            Tidur: {reportsData?.summary.sleep.avgDuration || 7} Jam • Mood: {reportsData?.summary.health.dominantMood || 'Baik'}
          </p>
        </div>
      </div>

      {/* 3. Section Catatan Kesehatan Otomatis (Health Records) */}
      <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9A6A0]/30">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#493B39]">Buku Catatan Kesehatan Terintegrasi</h2>
            <p className="text-xs text-[#493B39]/70 mt-0.5">
              Setiap kali Anda menyelesaikan skrining mandiri, data hasil otomatis tercatat secara permanen di database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C5E58] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tanggal atau kata kunci..."
                className="pl-8 pr-3 py-1.5 rounded-md border border-[#D9A6A0]/50 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 my-4">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#A87575] text-white font-semibold'
                : 'bg-[#FAF0E8] text-[#493B39]/80 hover:bg-[#FFF5F3] border border-[#D9A6A0]/40'
            }`}
          >
            Semua Catatan ({examinations.length})
          </button>
          <button
            onClick={() => setActiveTab('MENTAL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MENTAL'
                ? 'bg-[#A87575] text-white font-semibold'
                : 'bg-[#FAF0E8] text-[#493B39]/80 hover:bg-[#FFF5F3] border border-[#D9A6A0]/40'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Kesehatan Mental ({examinations.filter((e) => e.type === 'MENTAL').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PHYSICAL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PHYSICAL'
                ? 'bg-[#A87575] text-white font-semibold'
                : 'bg-[#FAF0E8] text-[#493B39]/80 hover:bg-[#FFF5F3] border border-[#D9A6A0]/40'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Kesehatan Fisik ({examinations.filter((e) => e.type === 'PHYSICAL').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('NUTRITION')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NUTRITION'
                ? 'bg-[#A87575] text-white font-semibold'
                : 'bg-[#FAF0E8] text-[#493B39]/80 hover:bg-[#FFF5F3] border border-[#D9A6A0]/40'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Nutrisi & Pola Makan ({examinations.filter((e) => e.type === 'NUTRITION').length})</span>
          </button>
        </div>

        {/* Examination Cards List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#493B39]/60">
            <div className="w-5 h-5 border-2 border-[#A87575] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Memuat arsip rekam catatan kesehatan...</span>
          </div>
        ) : filteredExaminations.length === 0 ? (
          <div className="p-8 rounded-md bg-[#FAF0E8]/40 border border-dashed border-[#D9A6A0]/60 text-center">
            <div className="w-10 h-10 rounded-md bg-white border border-[#D9A6A0]/40 flex items-center justify-center text-[#8C5E58] mx-auto mb-2.5">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-sm font-bold text-[#493B39]">Belum Ada Catatan Pada Kategori Ini</h4>
            <p className="text-xs text-[#493B39]/70 max-w-sm mx-auto mt-1">
              Pilih salah satu skrining di atas untuk memulai. Hasil pemeriksaan akan tersimpan secara otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExaminations.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-md bg-white border border-[#D9A6A0]/40 hover:border-[#A87575] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FAF0E8] text-[#8C5E58] text-[10px] font-bold border border-[#D9A6A0]/40 uppercase tracking-wider">
                      {exam.category}
                    </span>
                    <span className="text-[11px] text-[#493B39]/60 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#8C5E58]" />
                      {new Date(exam.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}
                      {exam.time} WIB
                    </span>
                  </div>

                  <h3 className="font-serif text-sm font-bold text-[#493B39]">{exam.title}</h3>
                  <p className="text-xs text-[#493B39]/75 line-clamp-2 leading-relaxed">{exam.summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {exam.score !== null && exam.score !== undefined && (
                    <div className="text-right">
                      <span className="text-[10px] text-[#493B39]/60 block font-mono">SKOR</span>
                      <span className="text-sm font-serif font-bold text-[#8C5E58]">
                        {exam.score}/100
                      </span>
                    </div>
                  )}

                  <span className="px-2.5 py-1 rounded bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#493B39] text-xs font-medium">
                    {exam.status}
                  </span>

                  <button
                    onClick={() => setSelectedExamDetail(exam)}
                    className="p-1.5 rounded-md bg-[#FAF0E8] hover:bg-[#FFF5F3] text-[#8C5E58] border border-[#D9A6A0]/40 transition-colors cursor-pointer"
                    title="Buka Lembar Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-1.5 rounded-md text-[#493B39]/40 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL DETAIL CATATAN PEMERIKSAAN */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493B39]/40 animate-in fade-in">
          <div className="bg-[#FFFCFA] w-full max-w-lg rounded-lg border border-[#D9A6A0]/50 shadow-lg overflow-hidden max-h-[90vh] flex flex-col text-[#493B39]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#FAF0E8] border-b border-[#D9A6A0]/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8C5E58] uppercase tracking-wider block">
                  Lembar Hasil Skrining · {selectedExamDetail.category}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#493B39]">
                  {selectedExamDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="p-1 rounded-md text-[#493B39]/60 hover:text-[#493B39] hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-md bg-white border border-[#D9A6A0]/40">
                <div>
                  <span className="text-[10px] text-[#493B39]/60 block font-medium">Waktu Pemeriksaan</span>
                  <span className="font-bold text-[#493B39] font-mono">
                    {selectedExamDetail.date} · {selectedExamDetail.time} WIB
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#493B39]/60 block font-medium">Status / Skor</span>
                  <span className="font-serif font-bold text-[#8C5E58] text-sm">
                    {selectedExamDetail.score ? `${selectedExamDetail.score}/100 ` : ''}({selectedExamDetail.status})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-xs text-[#493B39] mb-1">Ringkasan Evaluasi:</h4>
                <p className="text-xs text-[#493B39]/80 leading-relaxed bg-[#FAF0E8]/50 p-3 rounded-md border border-[#D9A6A0]/30">
                  {selectedExamDetail.summary}
                </p>
              </div>

              {selectedExamDetail.recommendations && (
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#493B39] mb-1.5">Saran & Rekomendasi Mandiri:</h4>
                  <ul className="space-y-1.5">
                    {(() => {
                      try {
                        const recs = JSON.parse(selectedExamDetail.recommendations);
                        if (Array.isArray(recs)) {
                          return recs.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#493B39]/80 bg-white p-2 rounded-md border border-[#D9A6A0]/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#8C5E58] shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ));
                        }
                      } catch {}
                      return <li className="text-xs text-[#493B39]/70">{selectedExamDetail.recommendations}</li>;
                    })()}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#493B39]/75 text-[11px] leading-relaxed">
                <span className="font-bold text-[#8C5E58] block mb-0.5">Catatan Medis:</span>
                Instrumen ini dirancang untuk skrining awal mandiri dan refleksi gaya hidup pribadi. Hasil evaluasi ini bukan merupakan diagnosis medis klinis pengganti dokter atau psikiater.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[#FAF0E8]/50 border-t border-[#D9A6A0]/30 flex justify-between items-center">
              <button
                onClick={() => handleDeleteExam(selectedExamDetail.id)}
                className="text-xs font-medium text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Catatan</span>
              </button>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="px-4 py-1.5 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL INTERAKTIF: PEMERIKSAAN KESEHATAN MANDIRI */}
      {activeExamType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493B39]/40 animate-in fade-in">
          <div className="bg-[#FFFCFA] w-full max-w-xl rounded-lg border border-[#D9A6A0]/50 shadow-lg overflow-hidden max-h-[92vh] flex flex-col text-[#493B39]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF0E8] border-b border-[#D9A6A0]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white border border-[#D9A6A0]/50 flex items-center justify-center text-[#8C5E58]">
                  {activeExamType === 'MENTAL' ? (
                    <Brain className="w-4 h-4" />
                  ) : activeExamType === 'PHYSICAL' ? (
                    <HeartPulse className="w-4 h-4" />
                  ) : (
                    <Utensils className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#493B39]">
                    {activeExamType === 'MENTAL'
                      ? 'Formulir Skrining Kesehatan Mental & Emosi'
                      : activeExamType === 'PHYSICAL'
                      ? 'Formulir Skrining Kondisi & Kebugaran Fisik'
                      : 'Formulir Skrining Nutrisi & Pola Makan'}
                  </h3>
                  <p className="text-xs text-[#493B39]/70">
                    Jawab pertanyaan di bawah ini sesuai dengan kondisi yang Anda rasakan
                  </p>
                </div>
              </div>
              <button
                onClick={closeExamModal}
                className="p-1 rounded-md text-[#493B39]/60 hover:text-[#493B39] hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {examValidationError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>{examValidationError}</span>
                </div>
              )}

              {/* STEP 1: FORM */}
              {examStep === 'form' && (
                <>
                  {/* FORM MENTAL */}
                  {activeExamType === 'MENTAL' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          1. Bagaimana suasana hati (mood) Anda hari ini?
                        </label>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { val: 1, label: 'Sangat Sedih', icon: Frown },
                            { val: 2, label: 'Gundah', icon: Frown },
                            { val: 3, label: 'Biasa Saja', icon: Meh },
                            { val: 4, label: 'Tenang', icon: Smile },
                            { val: 5, label: 'Sangat Baik', icon: Smile },
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setMentalForm({ ...mentalForm, feelingScore: item.val })}
                              className={`p-2 rounded-md border text-xs font-medium transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                                mentalForm.feelingScore === item.val
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="text-[10px]">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          2. Seberapa sering Anda merasa cemas, tegang, atau overthinking akhir-akhir ini?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Jarang Sekali', 'Kadang-kadang', 'Hampir Setiap Hari'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setMentalForm({ ...mentalForm, overthinkingFrequency: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                                mentalForm.overthinkingFrequency === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          3. Bagaimana ketenangan tidur Anda malam tadi?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Kurang Nyenyak / Terjaga', 'Cukup Nyenyak', 'Sangat Nyenyak'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setMentalForm({ ...mentalForm, sleepCalmness: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                                mentalForm.sleepCalmness === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          4. Tingkat semangat dalam menjalani aktivitas harian:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Terasa Berat / Hampa', 'Cukup Bersemangat', 'Sangat Bersemangat'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setMentalForm({ ...mentalForm, dailyEnthusiasm: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                                mentalForm.dailyEnthusiasm === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          5. Catatan atau keluhan perasaan yang ingin Anda catat (Opsional):
                        </label>
                        <textarea
                          value={mentalForm.notes}
                          onChange={(e) => setMentalForm({ ...mentalForm, notes: e.target.value })}
                          rows={2}
                          placeholder="Tuliskan jika ada beban pikiran yang ingin didokumentasikan..."
                          className="w-full p-2.5 rounded-md border border-[#D9A6A0]/50 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                        />
                      </div>
                    </div>
                  )}

                  {/* FORM FISIK */}
                  {activeExamType === 'PHYSICAL' && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-[#493B39]">1. Tingkat Energi Tubuh Saat Ini</label>
                          <span className="font-serif font-bold text-[#8C5E58]">{physicalForm.energy}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={physicalForm.energy}
                          onChange={(e) => setPhysicalForm({ ...physicalForm, energy: Number(e.target.value) })}
                          className="w-full accent-[#A87575] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[#493B39]/60 font-mono">
                          <span>Sangat Letih (1)</span>
                          <span>Biasa (5)</span>
                          <span>Bertenaga Optimal (10)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          2. Bagaimana kondisi lambung & perut Anda hari ini?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Nyaman & Normal', 'Sedikit Begah', 'Kembung / Mual', 'Terasa Perih / Asam Naik'].map((cond) => (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => setPhysicalForm({ ...physicalForm, stomachCondition: cond })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer text-left ${
                                physicalForm.stomachCondition === cond
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {cond}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          3. Jumlah gelas air putih yang sudah diminum hari ini:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={physicalForm.hydrationCups}
                            onChange={(e) => setPhysicalForm({ ...physicalForm, hydrationCups: Number(e.target.value) })}
                            className="w-20 p-2 rounded-md border border-[#D9A6A0]/50 text-xs text-center font-bold font-mono"
                          />
                          <span className="text-xs text-[#493B39]/70">Gelas (estimasi 250ml per gelas)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          4. Catatan keluhan fisik tambahan (Opsional):
                        </label>
                        <textarea
                          value={physicalForm.notes}
                          onChange={(e) => setPhysicalForm({ ...physicalForm, notes: e.target.value })}
                          rows={2}
                          placeholder="Misal: pegal di bahu kanan sehabis menyetir..."
                          className="w-full p-2.5 rounded-md border border-[#D9A6A0]/50 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                        />
                      </div>
                    </div>
                  )}

                  {/* FORM NUTRISI */}
                  {activeExamType === 'NUTRITION' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          1. Keteraturan jam makan Anda:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Teratur 3x sehari', 'Sering telat makan', 'Hanya makan 1-2x sehari', 'Sering makan larut malam'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setNutritionForm({ ...nutritionForm, mealRegularity: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer text-left ${
                                nutritionForm.mealRegularity === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          2. Konsumsi sayur & buah harian:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Hampir tidak ada', '1-2 porsi sehari', 'Lengkap 3 porsi / lebih'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setNutritionForm({ ...nutritionForm, vegetableFruitPortion: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                                nutritionForm.vegetableFruitPortion === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          3. Bagaimana respon lambung setelah makan terakhir?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Perut nyaman & kenyang pas', 'Sangat mengantuk berat', 'Begah & cepat kembung', 'Perih / sensasi panas dada'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setNutritionForm({ ...nutritionForm, postMealResponse: opt })}
                              className={`p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer text-left ${
                                nutritionForm.postMealResponse === opt
                                  ? 'bg-[#A87575] text-white border-[#A87575]'
                                  : 'bg-white border-[#D9A6A0]/40 text-[#493B39] hover:bg-[#FAF0E8]'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#493B39] mb-1.5">
                          4. Catatan menu atau pola makan (Opsional):
                        </label>
                        <textarea
                          value={nutritionForm.notes}
                          onChange={(e) => setNutritionForm({ ...nutritionForm, notes: e.target.value })}
                          rows={2}
                          placeholder="Misal: Sarapan oatmeal pisang, makan siang nasi sup ayam..."
                          className="w-full p-2.5 rounded-md border border-[#D9A6A0]/50 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: SUBMITTING */}
              {examStep === 'submitting' && (
                <div className="py-12 text-center text-xs text-[#493B39]">
                  <div className="w-6 h-6 border-2 border-[#A87575] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-bold">Menganalisis jawaban & menyimpan ke buku rekam medis...</p>
                  <p className="text-[11px] text-[#493B39]/70 mt-1">
                    Hasil skrining otomatis dimasukkan ke Catatan Kesehatan Anda.
                  </p>
                </div>
              )}

              {/* STEP 3: RESULT */}
              {examStep === 'result' && examResult && (
                <div className="space-y-4">
                  {/* Score & Status Card */}
                  <div className="p-5 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/50 text-center">
                    <span className="text-[10px] font-bold text-[#8C5E58] uppercase tracking-wider block font-mono">
                      HASIL SKRINING SELESAI
                    </span>
                    <div className="font-serif text-3xl font-bold text-[#493B39] my-1">
                      {examResult.score}/100
                    </div>
                    <span className="inline-block px-2.5 py-0.5 rounded bg-white border border-[#D9A6A0]/50 text-xs font-semibold text-[#8C5E58]">
                      {examResult.status}
                    </span>
                    <p className="text-xs text-[#493B39]/80 mt-2.5 leading-relaxed max-w-md mx-auto">
                      {examResult.summary}
                    </p>
                  </div>

                  {/* Recommendations */}
                  {examResult.recommendations && examResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#493B39] mb-2">
                        Rekomendasi Langkah Praktis:
                      </h4>
                      <div className="space-y-1.5">
                        {examResult.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="p-2.5 rounded-md bg-white border border-[#D9A6A0]/35 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8C5E58] shrink-0 mt-0.5" />
                            <span className="text-xs text-[#493B39]/80 leading-relaxed">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notice */}
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Data skrining ini telah tersimpan di database dan masuk ke daftar <strong>Buku Catatan Kesehatan</strong> Anda.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF0E8]/60 border-t border-[#D9A6A0]/40 flex justify-between items-center">
              {examStep === 'form' && (
                <>
                  <button
                    type="button"
                    onClick={closeExamModal}
                    className="px-3.5 py-1.5 rounded-md border border-[#D9A6A0]/50 hover:bg-white text-xs font-medium text-[#493B39] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExamination}
                    className="px-4 py-2 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Simpan & Lihat Hasil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {examStep === 'result' && (
                <div className="w-full flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setExamStep('form')}
                    className="px-3 py-1.5 rounded-md border border-[#D9A6A0]/50 hover:bg-white text-xs font-medium text-[#493B39] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Skrining Ulang</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeExamModal}
                    className="px-4 py-2 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Buka Catatan Kesehatan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
