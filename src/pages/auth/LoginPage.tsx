import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import {
  Heart,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setValidationError('Silakan masukkan alamat email Anda.');
      return;
    }
    if (!password) {
      setValidationError('Silakan masukkan kata sandi.');
      return;
    }

    try {
      const user = await login(cleanEmail, password, rememberMe);

      // Check if user came from guest health check
      const pendingCheckStr = sessionStorage.getItem('pending_health_check');
      if (pendingCheckStr && user.role !== 'ADMIN') {
        try {
          const pendingData = JSON.parse(pendingCheckStr);
          await apiRequest('/api/health', {
            method: 'POST',
            body: JSON.stringify({
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().substring(0, 5),
              energy: pendingData.energy || 7,
              mood: pendingData.mood || 'Baik',
              bodyCondition: pendingData.bodyCondition || 'Segar',
              stomachCondition: pendingData.stomachCondition || 'Nyaman',
              stressLevel: pendingData.stressLevel || 3,
              notes: pendingData.symptoms ? `Pemeriksaan mandiri awal (Keluhan: ${pendingData.symptoms})` : 'Pemeriksaan mandiri awal',
            }),
          });
          sessionStorage.removeItem('pending_health_check');
        } catch (e) {
          console.error('Failed to sync pending health check:', e);
        }
      }

      // Check if user came from guest food effect check
      const pendingMealStr = sessionStorage.getItem('pending_meal_check');
      if (pendingMealStr && user.role !== 'ADMIN') {
        try {
          const mealData = JSON.parse(pendingMealStr);
          await apiRequest('/api/meals', {
            method: 'POST',
            body: JSON.stringify({
              name: mealData.foodName,
              category: 'Makan Siang',
              portion: mealData.portion || '1 Porsi',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().substring(0, 5),
              notes: `Pemeriksaan efek makanan awal (Minuman: ${mealData.drinkNotes || 'Air Putih'})`,
              preMeal: {
                hungerLevel: 7,
                energy: 6,
                mood: 'Baik',
                stomachCondition: mealData.conditionBefore || 'Normal',
                bodyCondition: 'Normal',
                notes: 'Kondisi sebelum makan',
              },
              postMeal: {
                energy: 7,
                mood: 'Baik',
                fullnessLevel: 7,
                stomachCondition: 'Nyaman',
                notes: 'Menunggu follow-up respon lambung',
              },
            }),
          });
          sessionStorage.removeItem('pending_meal_check');
        } catch (e) {
          console.error('Failed to sync pending meal check:', e);
        }
      }

      if (user.role === 'ADMIN') {
        onNavigate('/admin/dashboard');
      } else {
        onNavigate('/app/dashboard');
      }
    } catch {
      // Error handled in AuthContext
    }
  };


  return (
    <div className="min-h-screen bg-[#FFF5F3] flex items-center justify-center p-4 selection:bg-[#D9A6A0]/40 font-sans text-[#493B39]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            onClick={() => onNavigate('/')}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFFCFA] border border-[#D9A6A0]/50 text-[#A87575] shadow-xs mb-3 cursor-pointer"
          >
            <Heart className="w-6 h-6 fill-[#D9A6A0] stroke-[#A87575]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#493B39] tracking-tight">
            Medika <span className="text-[#A87575] font-normal italic">Check</span>
          </h1>
          <p className="text-xs text-[#493B39]/70 mt-0.5 font-serif italic">
            Pendamping Kesehatan Mandiri & Ramah Keluarga
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#FFFCFA] rounded-lg p-6 sm:p-8 border border-[#D9A6A0]/50 shadow-sm">
          
          {/* Guest Health Check CTA Banner */}
          <div className="mb-6 p-3.5 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/40 text-[#493B39] flex items-center justify-between">
            <div className="pr-2">
              <span className="text-[11px] font-bold text-[#8C5E58] uppercase tracking-wider block font-serif">
                Ingin Cek Tanpa Login?
              </span>
              <p className="text-[11px] text-[#493B39]/70 mt-0.5 leading-snug">
                Tersedia skrining kesehatan mental, respon makanan & fisik gratis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-3 py-1.5 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs shrink-0 transition-colors cursor-pointer"
            >
              Mulai Skrining →
            </button>
          </div>

          <div className="mb-5">
            <h2 className="font-serif text-xl font-bold text-[#493B39]">Masuk ke Portal Pasien</h2>
            <p className="text-xs text-[#493B39]/70 mt-1">
              Masukkan kredensial akun Anda untuk membuka rekam medis pribadi:
            </p>
          </div>

          {(error || validationError) && (
            <div className="mb-5 p-3 rounded-md bg-[#FAF0E8] border border-[#A87575]/50 text-[#8C5E58] text-xs font-medium flex items-start gap-2">
              <span className="font-bold shrink-0">Catatan:</span>
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                Alamat Email <span className="text-[#A87575]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: nama@email.com"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#493B39]">
                  Kata Sandi <span className="text-[#A87575]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-xs font-medium text-[#8C5E58] hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#493B39]/50 hover:text-[#493B39] cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#A87575] rounded border-[#D9A6A0] accent-[#A87575] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-[#493B39]/80 cursor-pointer select-none">
                Ingat saya di perangkat ini
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa data...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Login Option */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D9A6A0]/25" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#FFFCFA] px-2 text-[#493B39]/60 font-medium">atau masuk dengan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              clearError();
              setValidationError('');
              setGoogleLoading(true);
              try {
                const user = await loginWithGoogle();
                if (user.role === 'ADMIN') {
                  onNavigate('/admin/dashboard');
                } else {
                  onNavigate('/app/dashboard');
                }
              } catch (err: any) {
                if (err?.message) {
                  setValidationError(err.message);
                }
                setTimeout(() => {
                  const el = document.getElementById('google-login-feedback');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }, 60);
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={isLoading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-[#D9A6A0]/40 hover:bg-[#FAF0E8] text-[#493B39] font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 bg-white shadow-2xs"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#A87575] border-t-transparent rounded-full animate-spin" />
                <span>Menghubungkan ke Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {(validationError || error) && (validationError || error || '').toLowerCase().includes('google') && (
            <div
              id="google-login-feedback"
              className="mt-3 p-3 rounded-md bg-[#FAF0E8] border border-[#A87575]/40 text-[#8C5E58] text-xs space-y-2"
            >
              <p className="leading-relaxed">{validationError || error}</p>
              <a
                href={typeof window !== 'undefined' ? window.location.href : '/login'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#8C5E58] underline hover:text-[#493B39]"
              >
                Buka aplikasi di tab browser baru untuk Login Google →
              </a>
            </div>
          )}


          {/* Register Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-[#493B39]/70">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="font-medium text-[#A87575] hover:underline cursor-pointer"
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
