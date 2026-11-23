import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Heart,
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Mail,
  Lock,
} from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { forgotPassword, resetPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [statusMessage, setStatusMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setLocalError('Silakan masukkan alamat email terdaftar.');
      return;
    }

    try {
      const res = await forgotPassword(cleanEmail);
      setStatusMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setStep('reset');
    } catch {
      // Handled in context
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!resetToken.trim() || !newPassword) {
      setLocalError('Token reset dan kata sandi baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Kata sandi baru minimal 6 karakter');
      return;
    }

    try {
      const msg = await resetPassword(resetToken.trim(), newPassword);
      setStatusMessage(msg);
      setStep('success');
    } catch {
      // Handled in context
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
            Pemulihan Akses Akun Pengguna
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFCFA] rounded-lg p-6 sm:p-8 border border-[#D9A6A0]/50 shadow-sm">
          {(error || localError) && (
            <div className="mb-5 p-3 rounded-md bg-[#FAF0E8] border border-[#A87575]/50 text-[#8C5E58] text-xs font-medium flex items-start gap-2">
              <span className="font-bold shrink-0">Catatan:</span>
              <span>{localError || error}</span>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div className="mb-4">
                <h2 className="font-serif text-xl font-bold text-[#493B39]">Lupa Kata Sandi?</h2>
                <p className="text-xs text-[#493B39]/70 mt-1">
                  Masukkan email akun Anda untuk mendapatkan token pemulihan kata sandi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                  Alamat Email Terdaftar <span className="text-[#A87575]">*</span>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Memproses...' : 'Kirim Token Pemulihan'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="mb-4">
                <h2 className="font-serif text-xl font-bold text-[#493B39]">Buat Sandi Baru</h2>
                <p className="text-xs text-[#493B39]/70 mt-1">
                  Masukkan token pemulihan yang diberikan dan ketikkan kata sandi baru.
                </p>
                {statusMessage && (
                  <p className="text-xs text-[#493B39] bg-[#FAF0E8] p-3 rounded-md border border-[#D9A6A0]/40 mt-3 leading-relaxed">
                    {statusMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                  Token Pemulihan <span className="text-[#A87575]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Masukkan token pemulihan"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#493B39] mb-1.5">
                  Kata Sandi Baru <span className="text-[#A87575]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-10 h-10 bg-[#FAF0E8] border border-[#D9A6A0]/50 text-[#8C5E58] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5 stroke-[#8C5E58]" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#493B39]">Kata Sandi Berhasil Diperbarui!</h2>
              <p className="text-xs text-[#493B39]/70">{statusMessage}</p>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-2 px-4 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Masuk ke Akun Sekarang
              </button>
            </div>
          )}

          <div className="mt-5 pt-3.5 border-t border-[#D9A6A0]/25 text-center">
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-medium text-[#8C5E58] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
