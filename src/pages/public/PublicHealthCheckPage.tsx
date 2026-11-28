import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Smile,
  Frown,
  Meh,
  Sun,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  LogIn,
  Utensils,
  HeartPulse,
  Brain,
  BookOpen,
  Calendar,
  Clock,
  Check,
  Info,
  X,
  MessageCircleHeart,
  ChevronRight,
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  FileText,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import {
  computePublicMentalHealthCheck,
  computePublicFoodEffect,
  computePublicHealthCheck,
} from '../../lib/publicScreening.ts';

interface PublicHealthCheckPageProps {
  onNavigate: (path: string) => void;
  onSetPendingCheck?: (data: any) => void;
}

interface ArticleItem {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  author: string;
  readTime: string;
  createdAt?: string;
}

export const PublicHealthCheckPage: React.FC<PublicHealthCheckPageProps> = ({
  onNavigate,
  onSetPendingCheck,
}) => {
  // Navigation active state
  const [activeSection, setActiveSection] = useState<'home' | 'artikel' | 'pemeriksaan'>('home');
  
  // Active test in the "Kenali Kondisimu Lebih Dekat" section
  const [selectedTest, setSelectedTest] = useState<'mental' | 'food' | 'health'>('mental');

  // Selected article for reading in modal
  const [readingArticle, setReadingArticle] = useState<ArticleItem | null>(null);

  // Info modal for Footer links (Tentang Kami, Kontak, Kebijakan Privasi)
  const [footerModal, setFooterModal] = useState<{ title: string; content: React.ReactNode } | null>(null);

  // Articles state
  const [articles, setArticles] = useState<ArticleItem[]>([
    {
      id: 1,
      title: '5 Cara Menjaga Keseimbangan Lambung Saat Beraktivitas Padat',
      category: 'Nutrisi & Lambung',
      summary: 'Pahami pola makan teratur, kunyahan optimal, dan jenis makanan yang memicu peradangan mukosa lambung.',
      content: `Kesehatan sistem pencernaan sangat dipengaruhi oleh ritme sirkadian dan kestabilan hormon stres.

Berikut 5 prinsip utama menjaga kesehatan lambung:
1. Makan dengan porsi sedang pada jam yang teratur untuk menghindari lonjakan asam lambung mendadak.
2. Kunyah makanan setidaknya 20-30 kali per suapan untuk meringankan kerja mekanik dan enzimatik lambung.
3. Hindari langsung berbaring atau tidur dalam kurun waktu 2 hingga 3 jam setelah selesai bersantap.
4. Perbanyak konsumsi serat alami yang lembut dari sayuran matang dan buah yang tidak asam (seperti pepaya, pisang, dan melon).
5. Cukupi asupan air putih hangat secara bertahap sepanjang hari untuk menetralkan keasaman lambung.`,
      author: 'dr. Sarah Nurdiana, Sp.GK',
      readTime: '4 min read',
      createdAt: '18 Oktober 2026',
    },
    {
      id: 2,
      title: 'Pengaruh Kualitas Tidur terhadap Keseimbangan Mental & Emosi',
      category: 'Kesehatan Mental',
      summary: 'Tidur nyenyak 7-8 jam meregenerasi sel syaraf otak dan menyeimbangkan hormon kortisol serta serotonin.',
      content: `Kurang tidur secara kronis dapat meningkatkan hormon stres (kortisol) dan menurunkan sensitivitas reseptor serotonin di otak.

Menjaga sleep hygiene sederhana:
• Redupkan lampu kamar dan hentikan paparan layar ponsel 30 menit sebelum berbaring.
• Pastikan suhu ruangan sejuk dan ventilasi udara mengalir dengan baik.
• Minum segelas teh chamomile hangat atau air hangat untuk menenangkan sistem saraf parasimpatis.
• Lakukan latihan pernapasan santai 4-4-6 untuk membantu tubuh memasuki fase relaksasi dalam.`,
      author: 'dr. Budi Setiawan, Sp.KJ',
      readTime: '3 min read',
      createdAt: '15 Oktober 2026',
    },
    {
      id: 3,
      title: 'Mengenal Sinyal Fisik Tubuh Saat Mengalami Kelelahan Tersembunyi',
      category: 'Kesehatan Tubuh',
      summary: 'Otot leher kaku, mata lelah, dan rasa lapar palsu sering kali merupakan jeritan tubuh yang meminta jeda istirahat.',
      content: `Sering kali kita tidak menyadari bahwa tubuh sudah bekerja melampaui kapasitasnya. Tubuh manusia memberikan sinyal awal sebelum jatuh sakit:

1. Ketegangan pada tengkuk dan pundak akibat postur kerja statis dan ketegangan mental.
2. Mengidam makanan manis (sugar craving) karena otak kekurangan energi akibat kurang istirahat.
3. Kembung atau motilitas usus melambat karena darah dialihkan ke otot untuk respon siaga.

Solusi terbaik adalah jeda mikro (micro-break): berdiri setiap 45 menit, lakukan peregangan lembut, dan hirup udara segar.`,
      author: 'dr. Ratna Kartika, Sp.PD',
      readTime: '5 min read',
      createdAt: '12 Oktober 2026',
    },
  ]);

  useEffect(() => {
    // Try fetching live articles from API
    const fetchArticles = async () => {
      try {
        const res = await apiRequest<ArticleItem[]>('/api/public/articles');
        if (res && res.length > 0) {
          setArticles(res);
        }
      } catch {
        // Fallback to initial educational articles
      }
    };
    fetchArticles();
  }, []);

  // Section references for smooth scrolling
  const heroRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const artikelRef = useRef<HTMLDivElement>(null);
  const tesRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: 'home' | 'artikel' | 'pemeriksaan' | 'info') => {
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
    } else if (section === 'info') {
      infoRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'artikel') {
      artikelRef.current?.scrollIntoView({ behavior: 'smooth' });
      setActiveSection('artikel');
    } else if (section === 'pemeriksaan') {
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
      setActiveSection('pemeriksaan');
    }
  };

  // ==========================================
  // 1. MENTAL HEALTH CHECK STATE & LOGIC
  // ==========================================
  const [mentalData, setMentalData] = useState({
    feelingScore: 3,
    anxietyLevel: 2,
    overthinkingFrequency: 'Kadang-kadang',
    sleepCalmness: 'Cukup Nyenyak',
    dailyEnthusiasm: 'Cukup Bersemangat',
    physicalStress: [] as string[],
    supportSystem: 'Ada Keluarga/Sahabat yang Mendukung',
    notes: '',
  });
  const [mentalLoading, setMentalLoading] = useState(false);
  const [mentalResult, setMentalResult] = useState<any | null>(null);

  const physicalStressOptions = [
    'Otot Pundak & Leher Tegang',
    'Sakit Kepala / Pusing',
    'Dada Berdebar-debar',
    'Perut Begah / Asam Lambung Naik',
    'Nafas Terasa Pendek / Menghela Nafas',
    'Mudah Lelah Padahal Kurang Beraktivitas',
    'Tidak Ada Keluhan Fisik',
  ];

  const handleTogglePhysicalStress = (option: string) => {
    if (option === 'Tidak Ada Keluhan Fisik') {
      setMentalData((prev) => ({
        ...prev,
        physicalStress: prev.physicalStress.includes(option) ? [] : [option],
      }));
      return;
    }
    setMentalData((prev) => {
      const filtered = prev.physicalStress.filter((item) => item !== 'Tidak Ada Keluhan Fisik');
      if (filtered.includes(option)) {
        return { ...prev, physicalStress: filtered.filter((i) => i !== option) };
      } else {
        return { ...prev, physicalStress: [...filtered, option] };
      }
    });
  };

  const [screeningError, setScreeningError] = useState<string | null>(null);

  const handleMentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScreeningError(null);
    setMentalLoading(true);
    try {
      const res = await apiRequest('/api/public/mental-health-check', {
        method: 'POST',
        body: JSON.stringify(mentalData),
      });
      setMentalResult(res);
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      const fallbackRes = computePublicMentalHealthCheck(mentalData);
      setMentalResult(fallbackRes);
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setMentalLoading(false);
    }
  };

  // ==========================================
  // 2. FOOD EFFECT CHECK STATE & LOGIC
  // ==========================================
  const [foodData, setFoodData] = useState({
    foodName: '',
    portion: 'Sedang (1 Porsi)',
    drinkNotes: 'Air Putih Hangat',
    conditionBefore: 'Lapar Normal',
  });
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodResult, setFoodResult] = useState<any | null>(null);

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScreeningError(null);
    if (!foodData.foodName.trim()) {
      setScreeningError('Silakan tuliskan menu makanan yang sudah Anda konsumsi.');
      return;
    }
    setFoodLoading(true);
    try {
      const res = await apiRequest('/api/public/food-effect', {
        method: 'POST',
        body: JSON.stringify(foodData),
      });
      setFoodResult(res);
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      const fallbackRes = computePublicFoodEffect(foodData);
      setFoodResult(fallbackRes);
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setFoodLoading(false);
    }
  };

  // ==========================================
  // 3. PHYSICAL HEALTH CHECK STATE & LOGIC
  // ==========================================
  const [healthData, setHealthData] = useState({
    energy: 7,
    mood: 'Baik & Tenang',
    bodyCondition: 'Segar',
    stomachCondition: 'Nyaman',
    stressLevel: 3,
    symptoms: 'Tidak Ada',
    lastMeal: '',
  });
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any | null>(null);

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScreeningError(null);
    setHealthLoading(true);
    try {
      const res = await apiRequest('/api/public/health-check', {
        method: 'POST',
        body: JSON.stringify(healthData),
      });
      setHealthResult(res);
      if (onSetPendingCheck) {
        onSetPendingCheck(healthData);
      }
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      const fallbackRes = computePublicHealthCheck(healthData);
      setHealthResult(fallbackRes);
      if (onSetPendingCheck) {
        onSetPendingCheck(healthData);
      }
      tesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setHealthLoading(false);
    }
  };

  // Save to account helper
  const handleSimpanCatatan = () => {
    if (selectedTest === 'mental' && mentalResult) {
      sessionStorage.setItem('pending_mental_check', JSON.stringify({ ...mentalData, result: mentalResult }));
    } else if (selectedTest === 'food' && foodResult) {
      sessionStorage.setItem('pending_meal_check', JSON.stringify(foodData));
    } else {
      sessionStorage.setItem('pending_health_check', JSON.stringify(healthData));
    }
    onNavigate('/login');
  };

  const quickFoodSuggestions = [
    'Nasi Sup Ayam Bening',
    'Oatmeal Pisang & Madu',
    'Bubur Ayam Hangat',
    'Nasi Padang Rendang',
    'Ayam Geprek Sambal Bawang',
    'Mie Instan Kuah + Telur',
    'Teh Manis Hangat + Roti',
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F3] text-[#493B39] font-sans selection:bg-[#D9A6A0]/40 selection:text-[#493B39]">
      
      {/* ======================================================== */}
      {/* A. NAVBAR / HEADER                                       */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#FFF5F3] border-b border-[#D9A6A0]/40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          {/* Sebelah Kiri: Tulisan Logo Medika Check */}
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/60 flex items-center justify-center text-[#A87575] group-hover:border-[#A87575] transition-colors">
              <Heart className="w-4 h-4 fill-[#D9A6A0] stroke-[#A87575]" />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#493B39]">
              Medika <span className="text-[#A87575] font-normal italic">Check</span>
            </span>
          </div>

          {/* Bagian Tengah: Menu Home, Artikel, dan Pemeriksaan */}
          <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium text-[#493B39]/80">
            <button
              onClick={() => scrollToSection('home')}
              className={`hover:text-[#A87575] transition-colors cursor-pointer pb-0.5 border-b-2 ${
                activeSection === 'home' ? 'border-[#A87575] text-[#493B39] font-bold' : 'border-transparent'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('artikel')}
              className={`hover:text-[#A87575] transition-colors cursor-pointer pb-0.5 border-b-2 ${
                activeSection === 'artikel' ? 'border-[#A87575] text-[#493B39] font-bold' : 'border-transparent'
              }`}
            >
              Artikel
            </button>
            <button
              onClick={() => scrollToSection('pemeriksaan')}
              className={`hover:text-[#A87575] transition-colors cursor-pointer pb-0.5 border-b-2 ${
                activeSection === 'pemeriksaan' ? 'border-[#A87575] text-[#493B39] font-bold' : 'border-transparent'
              }`}
            >
              Pemeriksaan
            </button>
          </nav>

          {/* Sebelah Kanan: Tombol Login */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-[#FFFCFA] text-[#493B39] hover:text-[#A87575] border border-[#D9A6A0]/60 hover:border-[#A87575] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#8C5E58]" />
              <span>Login</span>
            </button>
            <button
              onClick={() => onNavigate('/register')}
              className="hidden sm:inline-flex px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-[#A87575] hover:bg-[#8f5f5f] text-white transition-colors cursor-pointer"
            >
              Daftar Akun
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-[#D9A6A0]/20 bg-[#FAF0E8]/70 px-4 py-2 justify-around text-xs font-medium text-[#493B39]">
          <button onClick={() => scrollToSection('home')} className="py-1 px-2.5 cursor-pointer hover:text-[#A87575]">
            Home
          </button>
          <span className="text-[#D9A6A0]">·</span>
          <button onClick={() => scrollToSection('artikel')} className="py-1 px-2.5 cursor-pointer hover:text-[#A87575]">
            Artikel
          </button>
          <span className="text-[#D9A6A0]">·</span>
          <button onClick={() => scrollToSection('pemeriksaan')} className="py-1 px-2.5 cursor-pointer hover:text-[#A87575]">
            Pemeriksaan
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* B. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section ref={heroRef} className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Bagian Kiri: Gambar / Ilustrasi Kesehatan Natural */}
          <div className="md:col-span-5 flex justify-center order-2 md:order-1">
            <div className="w-full max-w-sm sm:max-w-md bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 p-4 sm:p-5 relative">
              {/* Natural Classical Wellness Illustration */}
              <div className="w-full aspect-4/3 rounded-md bg-[#FAF0E8]/60 border border-[#D9A6A0]/30 flex flex-col items-center justify-center p-6 text-center relative">
                
                {/* Botanical & Medical Artwork */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFF5F3] border border-[#D9A6A0]/60 flex items-center justify-center text-[#8C5E58]">
                    <HeartPulse className="w-8 h-8 stroke-[1.75]" />
                  </div>
                </div>

                <span className="font-serif text-lg font-bold text-[#493B39] tracking-tight">
                  Keseimbangan Alami
                </span>
                <p className="text-xs text-[#493B39]/75 mt-1 max-w-[240px] leading-relaxed">
                  Menghubungkan kesehatan fisik, ketenangan batin, dan nutrisi harian secara selaras.
                </p>

                <div className="mt-3.5 flex items-center gap-2 text-[11px] font-medium text-[#8C5E58]">
                  <span>Skrining Mandiri</span>
                  <span className="text-[#D9A6A0]">·</span>
                  <span>Tanpa Wajib Login</span>
                  <span className="text-[#D9A6A0]">·</span>
                  <span>Privat</span>
                </div>
              </div>

              {/* Bottom caption */}
              <div className="mt-3 pt-2.5 border-t border-[#D9A6A0]/30 flex items-center justify-between text-xs text-[#493B39]/70">
                <span className="font-serif italic">Pendamping Kesehatan Keluarga</span>
                <span className="text-[11px] text-[#8C5E58] font-mono">Edisi 2026</span>
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Judul dan Deskripsi Medika Check */}
          <div className="md:col-span-7 space-y-4 order-1 md:order-2">
            
            <div className="text-xs font-serif italic text-[#8C5E58] tracking-wider uppercase">
              Panduan Kesehatan & Kesejahteraan Keluarga
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#493B39] leading-[1.2] tracking-tight">
              Kenali Kondisi Tubuh, <br className="hidden sm:inline" />
              Pikiran, & Makananmu <br className="hidden sm:inline" />
              dengan Tenang dan Bijak.
            </h1>

            <p className="text-sm sm:text-base text-[#493B39]/80 leading-relaxed max-w-xl font-normal">
              Medika Check hadir sebagai sarana skrining mandiri yang ramah dan menenangkan.
              Periksa respon lambung terhadap makanan, evaluasi kesejahteraan mental, serta kebugaran tubuh Anda secara mandiri tanpa keharusan mendaftar terlebih dahulu.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => scrollToSection('info')}
                className="px-5 py-2.5 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Pelajari Informasi Kesehatan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('pemeriksaan')}
                className="px-5 py-2.5 rounded-md bg-[#FFFCFA] hover:bg-[#FAF0E8] text-[#493B39] border border-[#D9A6A0]/60 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Mulai Skrining Mandiri
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Thin elegant separator */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <hr className="border-t border-[#D9A6A0]/25" />
      </div>

      {/* ======================================================== */}
      {/* C. INFORMASI KESEHATAN (3 KARTU HORIZONTAL)              */}
      {/* ======================================================== */}
      <section ref={infoRef} className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A87575]">
            Fondasi Hidup Sehat
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#493B39]">
            Tiga Pilar Kebugaran Holistik
          </h2>
          <p className="text-xs sm:text-sm text-[#493B39]/70 leading-relaxed">
            Menyelaraskan batin, raga, dan asupan nutrisi untuk energi yang stabil sepanjang hari.
          </p>
        </div>

        {/* 3 Horizontal Cards on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Kesehatan Mental */}
          <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 p-5 sm:p-6 flex flex-col justify-between hover:border-[#A87575] transition-colors">
            <div className="space-y-3.5">
              {/* Illustrative Header Box */}
              <div className="h-28 rounded-md bg-[#FAF0E8]/70 border border-[#D9A6A0]/30 flex items-center justify-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-[#FFFCFA] border border-[#D9A6A0]/50 flex items-center justify-center text-[#8C5E58]">
                  <Brain className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="absolute bottom-2 right-2.5 text-[10px] font-serif italic text-[#8C5E58]">
                  Pikiran & Emosi
                </div>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#493B39]">
                  Kesehatan Mental
                </h3>
                <p className="text-xs sm:text-sm text-[#493B39]/75 mt-1.5 leading-relaxed">
                  Menjaga kestabilan suasana hati, mengelola beban pikiran (*overthinking*), dan menemukan jeda istirahat yang menenangkan di tengah kesibukan.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-[#D9A6A0]/30 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedTest('mental');
                  scrollToSection('pemeriksaan');
                }}
                className="text-xs font-medium text-[#8C5E58] hover:text-[#493B39] flex items-center gap-1 cursor-pointer"
              >
                <span>Uji Kesejahteraan Mental</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Kesehatan Tubuh */}
          <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 p-5 sm:p-6 flex flex-col justify-between hover:border-[#A87575] transition-colors">
            <div className="space-y-3.5">
              {/* Illustrative Header Box */}
              <div className="h-28 rounded-md bg-[#FAF0E8]/70 border border-[#D9A6A0]/30 flex items-center justify-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-[#FFFCFA] border border-[#D9A6A0]/50 flex items-center justify-center text-[#8C5E58]">
                  <HeartPulse className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="absolute bottom-2 right-2.5 text-[10px] font-serif italic text-[#8C5E58]">
                  Fisik & Vitalitas
                </div>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#493B39]">
                  Kesehatan Tubuh
                </h3>
                <p className="text-xs sm:text-sm text-[#493B39]/75 mt-1.5 leading-relaxed">
                  Memahami sinyal energi harian, postur tubuh, kualitas lelapnya tidur malam, serta kebiasaan gerak aktif yang menjaga kebugaran jantung.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-[#D9A6A0]/30 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedTest('health');
                  scrollToSection('pemeriksaan');
                }}
                className="text-xs font-medium text-[#8C5E58] hover:text-[#493B39] flex items-center gap-1 cursor-pointer"
              >
                <span>Skrining Kondisi Fisik</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Nutrisi dan Makanan */}
          <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 p-5 sm:p-6 flex flex-col justify-between hover:border-[#A87575] transition-colors">
            <div className="space-y-3.5">
              {/* Illustrative Header Box */}
              <div className="h-28 rounded-md bg-[#FAF0E8]/70 border border-[#D9A6A0]/30 flex items-center justify-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-[#FFFCFA] border border-[#D9A6A0]/50 flex items-center justify-center text-[#8C5E58]">
                  <Utensils className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="absolute bottom-2 right-2.5 text-[10px] font-serif italic text-[#8C5E58]">
                  Pencernaan & Nutrisi
                </div>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#493B39]">
                  Nutrisi dan Makanan
                </h3>
                <p className="text-xs sm:text-sm text-[#493B39]/75 mt-1.5 leading-relaxed">
                  Mengetahui respon lambung setelah mengonsumsi makanan tertentu, durasi waktu cerna, serta panduan porsi agar perut tetap nyaman tanpa rasa begah.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-[#D9A6A0]/30 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedTest('food');
                  scrollToSection('pemeriksaan');
                }}
                className="text-xs font-medium text-[#8C5E58] hover:text-[#493B39] flex items-center gap-1 cursor-pointer"
              >
                <span>Cek Respon Makanan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Thin elegant separator */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <hr className="border-t border-[#D9A6A0]/30" />
      </div>

      {/* ======================================================== */}
      {/* D. BERITA DAN ARTIKEL KESEHATAN                          */}
      {/* ======================================================== */}
      <section ref={artikelRef} className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#8C5E58] font-mono">
              ARSIP EDUKASI MEDIKA
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#493B39]">
              Berita & Artikel Kesehatan
            </h2>
            <p className="text-xs sm:text-sm text-[#493B39]/70 max-w-xl leading-relaxed">
              Wawasan terpercaya dari praktisi medis untuk menemani langkah hidup sehat Anda setiap hari.
            </p>
          </div>

          <div className="text-xs text-[#8C5E58] font-serif italic">
            Format Editorial Klasik
          </div>
        </div>

        {/* Editorial Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 overflow-hidden flex flex-col justify-between hover:border-[#A87575] transition-colors"
            >
              <div>
                {/* Article Top Accent */}
                <div className="px-5 pt-4 pb-2.5 border-b border-[#D9A6A0]/25 flex items-center justify-between text-[11px] text-[#493B39]/70">
                  <span className="px-2 py-0.5 rounded bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#8C5E58] text-[10px] font-bold uppercase tracking-wider">
                    {art.category}
                  </span>
                  <span className="font-mono text-[10px]">{art.readTime || '4 min read'}</span>
                </div>

                <div className="p-5 space-y-2.5">
                  <h3
                    className="font-serif text-base sm:text-lg font-bold text-[#493B39] leading-snug hover:text-[#A87575] transition-colors cursor-pointer"
                    onClick={() => setReadingArticle(art)}
                  >
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#493B39]/75 leading-relaxed line-clamp-3">
                    {art.summary}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-4 pt-2.5 flex items-center justify-between border-t border-[#D9A6A0]/20 text-xs">
                <span className="text-[11px] text-[#493B39]/70">
                  Oleh {art.author}
                </span>
                <button
                  onClick={() => setReadingArticle(art)}
                  className="font-medium text-[#8C5E58] hover:text-[#493B39] underline underline-offset-2 cursor-pointer text-xs"
                >
                  Baca Selengkapnya →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Thin elegant separator */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <hr className="border-t border-[#D9A6A0]/30" />
      </div>

      {/* ======================================================== */}
      {/* E. SECTION TES KESEHATAN: "Kenali Kondisimu Lebih Dekat" */}
      {/* ======================================================== */}
      <section ref={tesRef} className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8C5E58] font-mono">
            SKRINING AWAL MANDIRI
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#493B39]">
            Kenali Kondisimu Lebih Dekat
          </h2>
          <p className="text-xs sm:text-sm text-[#493B39]/75 leading-relaxed">
            Pilih salah satu skrining di bawah ini untuk mengevaluasi kondisi Anda secara instan dan personal.
          </p>
        </div>

        {/* 3 Test Selector Buttons */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#FAF0E8] p-1 rounded-md flex flex-wrap sm:flex-nowrap items-center gap-1 w-full max-w-xl border border-[#D9A6A0]/50">
            
            <button
              type="button"
              onClick={() => setSelectedTest('mental')}
              className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                selectedTest === 'mental'
                  ? 'bg-[#FFFCFA] text-[#493B39] font-bold border border-[#D9A6A0]/60'
                  : 'text-[#493B39]/70 hover:text-[#493B39]'
              }`}
            >
              <Smile className="w-4 h-4 text-[#8C5E58]" />
              <span>Kesehatan Mental</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTest('food')}
              className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                selectedTest === 'food'
                  ? 'bg-[#FFFCFA] text-[#493B39] font-bold border border-[#D9A6A0]/60'
                  : 'text-[#493B39]/70 hover:text-[#493B39]'
              }`}
            >
              <Utensils className="w-4 h-4 text-[#8C5E58]" />
              <span>Respon Makanan</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTest('health')}
              className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                selectedTest === 'health'
                  ? 'bg-[#FFFCFA] text-[#493B39] font-bold border border-[#D9A6A0]/60'
                  : 'text-[#493B39]/70 hover:text-[#493B39]'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-[#8C5E58]" />
              <span>Kebugaran Fisik</span>
            </button>
          </div>
        </div>

        {screeningError && (
          <div className="max-w-3xl mx-auto mb-6 p-3.5 rounded-xl bg-[#FAF0E8] border border-[#A87575]/50 text-[#8C5E58] text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
            <span>
              <strong className="mr-1">Catatan:</strong>
              {screeningError}
            </span>
            <button
              type="button"
              onClick={() => setScreeningError(null)}
              className="text-xs underline shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: KESEHATAN MENTAL (Questionnaire & Result)        */}
        {/* ======================================================== */}
        {selectedTest === 'mental' && (
          <div className="max-w-3xl mx-auto">
            {!mentalResult ? (
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/40 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[#A87575] text-xs font-semibold mb-1">
                    <MessageCircleHeart className="w-4 h-4" />
                    <span>Refleksi Kesejahteraan Emosional</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#493B39]">
                    Kuesioner Kesehatan Mental Mandiri
                  </h3>
                  <p className="text-xs sm:text-sm text-[#493B39]/70 mt-1 leading-relaxed">
                    Jawablah sesuai yang Anda rasakan belakangan ini. Pertanyaan ini murni untuk refleksi perawatan diri dan menjaga ketenangan pikiran Anda.
                  </p>
                </div>

                <form onSubmit={handleMentalSubmit} className="space-y-6">
                  {/* Pertanyaan 1: Suasana Hati */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <label className="block text-xs sm:text-sm font-bold text-[#493B39]">
                      1. Secara umum, bagaimana suasana hati Anda beberapa hari ini?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { score: 1, label: 'Sangat Sedih / Lelah', icon: Frown },
                        { score: 2, label: 'Kurang Semangat', icon: Meh },
                        { score: 3, label: 'Biasa Saja / Netral', icon: Smile },
                        { score: 4, label: 'Cukup Bahagia', icon: Sun },
                        { score: 5, label: 'Sangat Tenang & Damai', icon: Heart },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = mentalData.feelingScore === item.score;
                        return (
                          <button
                            type="button"
                            key={item.score}
                            onClick={() => setMentalData({ ...mentalData, feelingScore: item.score })}
                            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#A87575] border-[#A87575] text-white shadow-xs font-semibold'
                                : 'bg-[#FFFCFA] border-[#D9A6A0]/40 text-[#493B39] hover:border-[#A87575]'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#A87575]'}`} />
                            <span className="text-xs leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pertanyaan 2: Tingkat Kekhawatiran / Cemas */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs sm:text-sm font-bold text-[#493B39]">
                        2. Seberapa sering rasa cemas atau was-was menghampiri Anda?
                      </label>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] border border-[#D9A6A0]/50 text-[#A87575]">
                        Skala: {mentalData.anxietyLevel} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={mentalData.anxietyLevel}
                      onChange={(e) => setMentalData({ ...mentalData, anxietyLevel: Number(e.target.value) })}
                      className="w-full accent-[#A87575] cursor-pointer h-2 bg-[#D9A6A0]/40 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-[#493B39]/65 font-medium">
                      <span>1: Sangat Jarang (Tenang)</span>
                      <span>3: Kadang Ada Kekhawatiran</span>
                      <span>5: Sering Cemas & Tegang</span>
                    </div>
                  </div>

                  {/* Pertanyaan 3: Beban Pikiran (Overthinking) */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <label className="block text-xs sm:text-sm font-bold text-[#493B39]">
                      3. Apakah pikiran Anda sering berputar memikirkan hal berat (*overthinking*)?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Jarang (Pikiran terasa santai dan mengalir)',
                        'Kadang-kadang (Hanya saat ada masalah mendesak)',
                        'Sering (Sulit mematikan pikiran di malam hari)',
                        'Hampir Setiap Saat (Merasa kepala sangat penuh)',
                      ].map((text) => {
                        const shortVal = text.split(' (')[0];
                        const isSelected = mentalData.overthinkingFrequency === shortVal;
                        return (
                          <button
                            type="button"
                            key={text}
                            onClick={() => setMentalData({ ...mentalData, overthinkingFrequency: shortVal })}
                            className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#A87575] border-[#A87575] text-white font-medium shadow-xs'
                                : 'bg-[#FFFCFA] border-[#D9A6A0]/40 text-[#493B39] hover:border-[#A87575]'
                            }`}
                          >
                            <span>{text}</span>
                            {isSelected && <Check className="w-4 h-4 ml-2 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pertanyaan 4: Ketenangan Tidur */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <label className="block text-xs sm:text-sm font-bold text-[#493B39]">
                      4. Bagaimana kualitas ketenangan tidur Anda malam hari?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { title: 'Sangat Nyenyak & Tenang', desc: 'Mudah tidur dan bangun terasa segar' },
                        { title: 'Cukup Nyenyak', desc: 'Bisa istirahat wajar, sesekali ada mimpi' },
                        { title: 'Sering Terbangun/Gelisah', desc: 'Tidur tidak lelap dan sering terbangun' },
                        { title: 'Sulit Tidur / Insomnia', desc: 'Butuh waktu berjam-jam untuk terlelap' },
                      ].map((item) => {
                        const isSelected = mentalData.sleepCalmness === item.title;
                        return (
                          <button
                            type="button"
                            key={item.title}
                            onClick={() => setMentalData({ ...mentalData, sleepCalmness: item.title })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#A87575] border-[#A87575] text-white shadow-xs'
                                : 'bg-[#FFFCFA] border-[#D9A6A0]/40 text-[#493B39] hover:border-[#A87575]'
                            }`}
                          >
                            <p className="text-xs font-bold">{item.title}</p>
                            <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/85' : 'text-[#493B39]/65'}`}>
                              {item.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pertanyaan 5: Sinyal Fisik */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#493B39]">
                        5. Apakah ada sensasi fisik yang sering Anda rasakan saat stres?
                      </label>
                      <p className="text-[11px] text-[#493B39]/65">Dapat memilih lebih dari satu yang sesuai</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {physicalStressOptions.map((opt) => {
                        const isChecked = mentalData.physicalStress.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleTogglePhysicalStress(opt)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-[#A87575] border-[#A87575] text-white shadow-xs'
                                : 'bg-[#FFFCFA] border-[#D9A6A0]/40 text-[#493B39] hover:border-[#A87575]'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border text-[9px] ${
                              isChecked ? 'bg-white text-[#A87575] border-white' : 'border-[#D9A6A0]'
                            }`}>
                              {isChecked && '✓'}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={mentalLoading}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {mentalLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengevaluasi Kesejahteraan Mental...</span>
                        </>
                      ) : (
                        <>
                          <Smile className="w-4 h-4" />
                          <span>Lihat Hasil Tes Kesehatan Mental</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* RESULT VIEW FOR MENTAL HEALTH */
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/50 p-6 sm:p-8 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9A6A0]/30 gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#A87575]">
                      Hasil Evaluasi Kesejahteraan Mental
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#493B39]">
                      {mentalResult.category}
                    </h3>
                    <p className="text-xs text-[#493B39]/70">{mentalResult.stressBadge}</p>
                  </div>

                  <div className="text-right bg-[#FAF0E8]/70 px-4 py-2.5 rounded-xl border border-[#D9A6A0]/30">
                    <span className="text-[11px] text-[#493B39]/65 block font-serif">Indeks Keseimbangan Batin</span>
                    <span className="font-serif text-3xl font-bold text-[#A87575]">{mentalResult.score}</span>
                    <span className="text-xs text-[#493B39]/65"> / 100</span>
                  </div>
                </div>

                {/* Warm Affirmation */}
                <div className="p-4 rounded-xl bg-[#FAF0E8]/70 border border-[#D9A6A0]/40 flex items-start gap-3.5">
                  <Heart className="w-5 h-5 text-[#A87575] shrink-0 mt-0.5 fill-[#D9A6A0]" />
                  <div>
                    <h4 className="text-xs font-bold text-[#A87575] uppercase tracking-wider mb-1 font-serif">
                      Pesan Penguat Hati:
                    </h4>
                    <p className="text-xs sm:text-sm text-[#493B39] leading-relaxed italic font-serif">
                      "{mentalResult.affirmation}"
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-[#493B39] font-serif">
                    Rangkuman Kondisi Saat Ini
                  </h4>
                  <p className="p-4 rounded-xl bg-[#FFF5F3]/60 border border-[#D9A6A0]/30 text-xs sm:text-sm text-[#493B39]/80 leading-relaxed">
                    {mentalResult.summary}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#493B39] font-serif flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A87575]" />
                    <span>Langkah Relaksasi yang Menenangkan</span>
                  </h4>
                  <div className="space-y-2">
                    {mentalResult.recommendations?.map((rec: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#FAF0E8]/50 border border-[#D9A6A0]/25 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#D9A6A0]/30 text-[#A87575] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-[#493B39]/85 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-4 rounded-xl bg-[#FAF0E8]/80 border border-[#D9A6A0]/40 text-[11px] text-[#493B39]/70 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#A87575] shrink-0 mt-0.5" />
                  <div>
                    <p>{mentalResult.disclaimer}</p>
                    <p className="mt-1 text-[#A87575] font-medium">
                      Hotline Konseling Gratis Kemenkes Sejiwa: 119 (ekstensi 8).
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setMentalResult(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-[#D9A6A0]/50 hover:bg-[#FAF0E8] text-[#493B39] font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#A87575]" />
                    <span>Ulangi Tes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimpanCatatan}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Simpan ke Akun Pribadi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RESPON MAKANAN (Questionnaire & Result)           */}
        {/* ======================================================== */}
        {selectedTest === 'food' && (
          <div className="max-w-3xl mx-auto">
            {!foodResult ? (
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/40 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[#A87575] text-xs font-semibold mb-1">
                    <Utensils className="w-4 h-4" />
                    <span>Pemeriksaan Pencernaan & Respon Lambung</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#493B39]">
                    Cek Efek & Respon Tubuh Setelah Makan
                  </h3>
                  <p className="text-xs sm:text-sm text-[#493B39]/70 mt-1 leading-relaxed">
                    Ketik menu makanan yang baru saja Anda santap. Sistem akan menganalisis perkiraan beban kerja lambung, durasi waktu cerna, dan kurva energi Anda.
                  </p>
                </div>

                <form onSubmit={handleFoodSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#493B39] mb-1.5">
                      Makanan apa yang sudah Anda santap? <span className="text-[#A87575]">*</span>
                    </label>
                    <input
                      type="text"
                      value={foodData.foodName}
                      onChange={(e) => setFoodData({ ...foodData, foodName: e.target.value })}
                      placeholder="Contoh: Nasi Sup Ayam, Oatmeal Madu, Soto Daging..."
                      className="w-full px-4 py-3 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575]"
                      required
                    />

                    {/* Quick suggestion menu pills */}
                    <div className="mt-3">
                      <span className="text-[11px] font-medium text-[#493B39]/60 block mb-1.5 font-serif italic">
                        Atau pilih contoh menu santai:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {quickFoodSuggestions.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => setFoodData({ ...foodData, foodName: item })}
                            className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                              foodData.foodName === item
                                ? 'bg-[#A87575] text-white border-[#A87575]'
                                : 'bg-[#FAF0E8] text-[#493B39] border-[#D9A6A0]/40 hover:border-[#A87575]'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#493B39] mb-1.5">Porsi Makanan</label>
                      <select
                        value={foodData.portion}
                        onChange={(e) => setFoodData({ ...foodData, portion: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                      >
                        <option>Kecil (Porsi Ringan)</option>
                        <option>Sedang (1 Porsi Standar)</option>
                        <option>Besar (Kenyang Padat)</option>
                        <option>Sangat Banyak (Double Porsi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#493B39] mb-1.5">Minuman Pendamping</label>
                      <select
                        value={foodData.drinkNotes}
                        onChange={(e) => setFoodData({ ...foodData, drinkNotes: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                      >
                        <option>Air Putih Hangat</option>
                        <option>Air Dingin / Es</option>
                        <option>Teh Hangat</option>
                        <option>Kopi Hitam / Latte</option>
                        <option>Susu / Jus Buah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#493B39] mb-1.5">Kondisi Sebelum Makan</label>
                      <select
                        value={foodData.conditionBefore}
                        onChange={(e) => setFoodData({ ...foodData, conditionBefore: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                      >
                        <option>Lapar Normal</option>
                        <option>Sangat Lapar (Perut Kosong Lama)</option>
                        <option>Sedikit Begah / Kenyang</option>
                        <option>Perut Sedang Agak Perih</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={foodLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {foodLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menganalisis Respon Makanan...</span>
                      </>
                    ) : (
                      <>
                        <Utensils className="w-4 h-4" />
                        <span>Periksa Efek Makanan Ini Pada Tubuh</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* RESULT VIEW FOR FOOD EFFECT */
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/50 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9A6A0]/30 gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#A87575]">
                      Hasil Respon Pencernaan
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#493B39] mt-1 capitalize">
                      {foodResult.foodName}
                    </h3>
                    <p className="text-xs text-[#493B39]/70">Porsi: {foodResult.portion}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF0E8]/70 border border-[#D9A6A0]/40 text-right">
                    <span className="text-[10px] text-[#493B39]/65 block font-serif uppercase">Beban Lambung</span>
                    <span className="font-serif text-base font-bold text-[#A87575]">{foodResult.stomachImpact}</span>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#FAF0E8]/50 border border-[#D9A6A0]/30">
                    <span className="text-[11px] font-medium text-[#493B39]/70 block mb-1">Waktu Cerna</span>
                    <span className="font-serif text-lg font-bold text-[#493B39]">{foodResult.digestionTime}</span>
                    <p className="text-[10px] text-[#493B39]/60 mt-0.5">Pengosongan lambung</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF0E8]/50 border border-[#D9A6A0]/30">
                    <span className="text-[11px] font-medium text-[#493B39]/70 block mb-1">Kenaikan Gula Darah</span>
                    <span className="font-serif text-lg font-bold text-[#493B39]">{foodResult.glycemicImpact || 'Sedang'}</span>
                    <p className="text-[10px] text-[#493B39]/60 mt-0.5">Respon insulin tubuh</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF0E8]/50 border border-[#D9A6A0]/30">
                    <span className="text-[11px] font-medium text-[#493B39]/70 block mb-1">Dampak Energi</span>
                    <span className="text-xs font-semibold text-[#493B39] leading-snug">{foodResult.expectedEnergyCurve}</span>
                  </div>
                </div>

                {/* Biological effects */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#493B39] font-serif flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#8C5E58]" />
                    <span>Reaksi Biologis Dalam Saluran Cerna</span>
                  </h4>
                  <div className="space-y-2">
                    {foodResult.effects?.map((eff: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FFF5F3]/50 border border-[#D9A6A0]/25 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#A87575] shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-[#493B39]/85">{eff}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Health advice */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#493B39] font-serif flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#A87575]" />
                    <span>Saran Perawatan Agar Pencernaan Nyaman</span>
                  </h4>
                  <div className="space-y-2">
                    {foodResult.healthAdvice?.map((adv: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FAF0E8]/60 border border-[#D9A6A0]/30 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#D9A6A0]/30 text-[#A87575] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-[#493B39]/85">{adv}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setFoodResult(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-[#D9A6A0]/50 hover:bg-[#FAF0E8] text-[#493B39] font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#A87575]" />
                    <span>Cek Menu Makanan Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimpanCatatan}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Simpan ke Jurnal Makan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: KEBUGARAN FISIK (Questionnaire & Result)          */}
        {/* ======================================================== */}
        {selectedTest === 'health' && (
          <div className="max-w-3xl mx-auto">
            {!healthResult ? (
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/40 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[#A87575] text-xs font-semibold mb-1">
                    <HeartPulse className="w-4 h-4" />
                    <span>Evaluasi Kebugaran & Kenyamanan Tubuh</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#493B39]">
                    Pemeriksaan Fisik Cepat Mandiri
                  </h3>
                  <p className="text-xs sm:text-sm text-[#493B39]/70 mt-1 leading-relaxed">
                    Evaluasi energi harian, kondisi lambung, dan respon vital tubuh Anda secara praktis.
                  </p>
                </div>

                <form onSubmit={handleHealthSubmit} className="space-y-6">
                  {/* Energy slider */}
                  <div className="bg-[#FAF0E8]/60 p-4 sm:p-5 rounded-xl border border-[#D9A6A0]/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs sm:text-sm font-bold text-[#493B39]">Tingkat Energi Tubuh Hari Ini</label>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] border border-[#D9A6A0]/50 text-[#A87575]">
                        {healthData.energy} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={healthData.energy}
                      onChange={(e) => setHealthData({ ...healthData, energy: Number(e.target.value) })}
                      className="w-full accent-[#A87575] cursor-pointer h-2 bg-[#D9A6A0]/40 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-[#493B39]/65">
                      <span>1: Butuh Istirahat</span>
                      <span>5: Normal</span>
                      <span>10: Sangat Segar</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FAF0E8]/60 p-4 rounded-xl border border-[#D9A6A0]/30 space-y-2">
                      <label className="block text-xs font-bold text-[#493B39]">Kondisi Lambung / Pencernaan</label>
                      <select
                        value={healthData.stomachCondition}
                        onChange={(e) => setHealthData({ ...healthData, stomachCondition: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                      >
                        <option>Nyaman & Enak</option>
                        <option>Sedikit Begah / Penuh</option>
                        <option>Kembung Bergas</option>
                        <option>Mual / Tidak Enak Makan</option>
                        <option>Perih Ulu Hati / Asam Lambung</option>
                      </select>
                    </div>

                    <div className="bg-[#FAF0E8]/60 p-4 rounded-xl border border-[#D9A6A0]/30 space-y-2">
                      <label className="block text-xs font-bold text-[#493B39]">Kondisi Otot & Raga</label>
                      <select
                        value={healthData.bodyCondition}
                        onChange={(e) => setHealthData({ ...healthData, bodyCondition: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575]"
                      >
                        <option>Segar & Ringan</option>
                        <option>Pegal / Lelah Ringan</option>
                        <option>Otot Kaku / Tegang</option>
                        <option>Kurang Tidur / Meriang</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={healthLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {healthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengevaluasi Kebugaran Fisik...</span>
                      </>
                    ) : (
                      <>
                        <HeartPulse className="w-4 h-4" />
                        <span>Lihat Hasil & Rekomendasi Kesehatan Fisik</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* RESULT VIEW FOR PHYSICAL HEALTH */
              <div className="bg-[#FFFCFA] rounded-2xl border border-[#D9A6A0]/50 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9A6A0]/30 gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#A87575]">
                      Hasil Kebugaran Fisik
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#493B39] mt-1">
                      {healthResult.status}
                    </h3>
                    <p className="text-xs text-[#493B39]/70">{healthResult.summaryText}</p>
                  </div>

                  <div className="text-right bg-[#FAF0E8]/70 px-4 py-2.5 rounded-xl border border-[#D9A6A0]/30">
                    <span className="text-[11px] text-[#493B39]/65 block font-serif">Skor Vitalitas</span>
                    <span className="font-serif text-3xl font-bold text-[#A87575]">{healthResult.score}</span>
                    <span className="text-xs text-[#493B39]/65"> / 100</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#493B39] font-serif flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A87575]" />
                    <span>Saran Pemulihan & Penjagaan Kebugaran</span>
                  </h4>
                  <div className="space-y-2">
                    {healthResult.recommendations?.map((r: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FAF0E8]/50 border border-[#D9A6A0]/25 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#D9A6A0]/30 text-[#A87575] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-[#493B39]/85 leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setHealthResult(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-[#D9A6A0]/50 hover:bg-[#FAF0E8] text-[#493B39] font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#A87575]" />
                    <span>Tes Ulang Fisik</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimpanCatatan}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Simpan ke Rekam Medis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </section>

      {/* ======================================================== */}
      {/* F. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="bg-[#A87575] text-[#FAF0E8] pt-14 pb-8 border-t border-[#8f5f5f]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#FAF0E8]/20">
            
            {/* Logo & Deskripsi */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FAF0E8] flex items-center justify-center text-[#A87575]">
                  <Heart className="w-3.5 h-3.5 fill-[#A87575]" />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-white">
                  Medika <span className="text-[#FAF0E8] font-normal italic">Check</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#FAF0E8]/85 leading-relaxed max-w-sm">
                Sistem pendamping kesehatan mandiri yang dirancang dengan kehangatan dan kesederhanaan untuk membantu setiap keluarga mengenali ritme tubuh serta nutrisi harian.
              </p>
            </div>

            {/* Navigasi Utama */}
            <div className="md:col-span-4 space-y-2.5">
              <span className="font-serif text-sm font-bold text-white block">
                Navigasi Cepat
              </span>
              <ul className="space-y-1.5 text-xs text-[#FAF0E8]/85">
                <li>
                  <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">
                    Home (Beranda)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('artikel')} className="hover:text-white transition-colors cursor-pointer">
                    Artikel & Edukasi
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pemeriksaan')} className="hover:text-white transition-colors cursor-pointer">
                    Pemeriksaan Cepat Mandiri
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('info')} className="hover:text-white transition-colors cursor-pointer">
                    Tiga Pilar Kesehatan
                  </button>
                </li>
              </ul>
            </div>

            {/* Informasi & Kebijakan */}
            <div className="md:col-span-3 space-y-2.5">
              <span className="font-serif text-sm font-bold text-white block">
                Pusat Informasi
              </span>
              <ul className="space-y-1.5 text-xs text-[#FAF0E8]/85">
                <li>
                  <button
                    onClick={() => setFooterModal({
                      title: 'Tentang Medika Check',
                      content: (
                        <div className="space-y-3 text-xs sm:text-sm text-[#493B39]/80 leading-relaxed font-sans">
                          <p>
                            <strong>Medika Check</strong> didirikan dengan filosofi bahwa kesehatan berakar dari perhatian terhadap sinyal-sinyal kecil tubuh kita: bagaimana tubuh merespon makanan, kualitas lelapnya istirahat malam, dan keheningan batin.
                          </p>
                          <p>
                            Platform ini dirancang dengan pendekatan klasik, ramah keluarga, dan tanpa kerumitan teknologi kecerdasan buatan yang berlebihan. Kami mengutamakan kepraktisan, kecepatan, dan privasi Anda.
                          </p>
                        </div>
                      )
                    })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Tentang Kami
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setFooterModal({
                      title: 'Kontak & Dukungan Medika Check',
                      content: (
                        <div className="space-y-3 text-xs sm:text-sm text-[#493B39]/80 leading-relaxed font-sans">
                          <p>
                            Bila Anda memiliki pertanyaan, saran perbaikan, atau ingin berkolaborasi dengan tim kami, silakan hubungi saluran resmi berikut:
                          </p>
                          <div className="p-3.5 rounded-xl bg-[#FAF0E8] border border-[#D9A6A0]/40 space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-[#493B39]">
                              <Mail className="w-4 h-4 text-[#A87575]" />
                              <span>dukungan@medikacheck.id</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#493B39]">
                              <PhoneCall className="w-4 h-4 text-[#A87575]" />
                              <span>(021) 8872-5501 (Senin–Jumat, 09.00–17.00 WIB)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#493B39]">
                              <MapPin className="w-4 h-4 text-[#A87575]" />
                              <span>Jakarta, Indonesia</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Kontak Kami
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setFooterModal({
                      title: 'Kebijakan Privasi',
                      content: (
                        <div className="space-y-3 text-xs sm:text-sm text-[#493B39]/80 leading-relaxed font-sans">
                          <p>
                            <strong>Komitmen Privasi:</strong> Seluruh data yang Anda masukkan pada formulir pemeriksaan cepat tanpa login tidak akan pernah dibagikan kepada pihak ketiga untuk kepentingan periklanan.
                          </p>
                          <p>
                            Data evaluasi hanya diolah di peramban dan server privat Medika Check untuk menghasilkan kalkulasi skor respon kesehatan yang dapat Anda simpan atau hapus sesuka hati.
                          </p>
                        </div>
                      )
                    })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Kebijakan Privasi
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Bottom */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#FAF0E8]/70 gap-2">
            <p>© 2026 Medika Check. Seluruh Hak Cipta Dilindungi.</p>
            <p className="font-serif italic text-[#FAF0E8]/85">Classic Soft Pink Healthcare Edition</p>
          </div>

        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL: BACA ARTIKEL EDUKASI                              */}
      {/* ======================================================== */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-[#493B39]/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8 animate-in fade-in">
            <button
              onClick={() => setReadingArticle(null)}
              className="absolute top-5 right-5 p-1 rounded-md text-[#493B39]/60 hover:text-[#493B39] hover:bg-[#FAF0E8] transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#8C5E58] text-[10px] font-bold uppercase tracking-wider">
                  {readingArticle.category}
                </span>
                <span className="text-[11px] text-[#493B39]/60 font-mono">· {readingArticle.readTime}</span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#493B39] leading-snug">
                {readingArticle.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-[#8C5E58] pb-3 border-b border-[#D9A6A0]/30 font-medium">
                <span>Oleh {readingArticle.author}</span>
              </div>

              <div className="text-xs sm:text-sm text-[#493B39]/85 leading-relaxed space-y-3 whitespace-pre-line font-sans pt-2">
                {readingArticle.content}
              </div>

              <div className="pt-5 border-t border-[#D9A6A0]/30 flex justify-end">
                <button
                  onClick={() => setReadingArticle(null)}
                  className="px-4 py-1.5 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white text-xs font-medium cursor-pointer"
                >
                  Tutup Artikel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INFO FOOTER (Tentang Kami, Kontak, Privasi)        */}
      {/* ======================================================== */}
      {footerModal && (
        <div className="fixed inset-0 z-50 bg-[#493B39]/50 flex items-center justify-center p-4">
          <div className="bg-[#FFFCFA] rounded-lg border border-[#D9A6A0]/50 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in">
            <button
              onClick={() => setFooterModal(null)}
              className="absolute top-5 right-5 p-1 rounded-md text-[#493B39]/60 hover:text-[#493B39] hover:bg-[#FAF0E8] transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-[#493B39] mb-3">
              {footerModal.title}
            </h3>

            {footerModal.content}

            <div className="mt-5 pt-3.5 border-t border-[#D9A6A0]/30 flex justify-end">
              <button
                onClick={() => setFooterModal(null)}
                className="px-4 py-1.5 rounded-md bg-[#FAF0E8] hover:bg-[#D9A6A0]/20 text-[#493B39] text-xs font-medium cursor-pointer border border-[#D9A6A0]/50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
