import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Heart,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setValidationError('Nama lengkap wajib diisi');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setValidationError('Alamat email valid wajib diisi');
      return;
    }
    if (password.length < 6) {
      setValidationError('Kata sandi minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      await register(name.trim(), cleanEmail, password);
      // Automatically redirect to user dashboard
      onNavigate('/app/dashboard');
    } catch (err: any) {
      if (err?.message) {
        setValidationError(err.message);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Pendaftaran Akun Pemantau Kesehatan Keluarga
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#FFFCFA] rounded-lg p-6 sm:p-8 border border-[#D9A6A0]/50 shadow-sm">
          <div className="mb-5">
            <h2 className="font-serif text-xl font-bold text-[#493B39]">Pendaftaran Akun Pasien Baru</h2>
            <p className="text-xs text-[#493B39]/70 mt-1">
              Catat kesehatan fisik, kualitas tidur, dan respon makanan harian Anda dengan aman.
            </p>
          </div>

          {(error || validationError) && (
            <div className="mb-5 p-3 rounded-md bg-[#FAF0E8] border border-[#A87575]/50 text-[#8C5E58] text-xs font-medium flex items-start gap-2">
              <span className="font-bold shrink-0">Catatan:</span>
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                Nama Lengkap / Panggilan <span className="text-[#A87575]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rina Safitri"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                  required
                />
              </div>
            </div>

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
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                Kata Sandi <span className="text-[#A87575]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                Ulangi Kata Sandi <span className="text-[#A87575]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                  required
                />
              </div>
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
                  <span>Mendaftarkan data...</span>
                </>
              ) : (
                <>
                  <span>Selesai & Buka Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-[#493B39]/70">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-medium text-[#8C5E58] hover:underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
