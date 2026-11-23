import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  X,
  Upload,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
      setErrorMessage('Format file harus berupa JPG, PNG, atau WebP.');
      return;
    }

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal adalah 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file foto.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama pengguna tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(name.trim(), avatarPreview);
      setSuccessMessage('Profil berhasil diperbarui dan tersimpan ke database!');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Pengguna MedikaCheck';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493B39]/40 animate-in fade-in">
      <div className="bg-[#FFFCFA] w-full max-w-md rounded-lg border border-[#D9A6A0]/50 shadow-lg overflow-hidden text-[#493B39]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF0E8] border-b border-[#D9A6A0]/40 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#493B39]">Pengaturan Profil Pasien</h3>
            <p className="text-xs text-[#493B39]/70">Perbarui nama dan foto identitas akun Anda</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#493B39]/60 hover:text-[#493B39] hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Photo Section */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-3 group">
              <div className="w-20 h-20 rounded-full border-2 border-[#D9A6A0] bg-[#FAF0E8] flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-[#A87575]/70" />
                )}
              </div>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors cursor-pointer"
                  title="Hapus Foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/jpg"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md bg-[#FAF0E8] hover:bg-[#FFF5F3] border border-[#D9A6A0]/50 text-xs font-medium text-[#8C5E58] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{avatarPreview ? 'Ganti Foto Profil' : 'Unggah Foto Profil'}</span>
            </button>
            <p className="text-[11px] text-[#493B39]/60 mt-1">
              JPG, PNG, atau WebP (Maksimal 3 MB)
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1">
                Nama Lengkap / Panggilan <span className="text-[#A87575]">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/50 text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#A87575] focus:border-[#A87575]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#493B39] mb-1">
                Alamat Email (Akun)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A87575]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-[#D9A6A0]/30 text-xs sm:text-sm bg-[#FAF0E8]/50 text-[#493B39]/70 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-[#493B39]/60 mt-0.5 block">
                Email akun terhubung dengan data identitas login Anda.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-md bg-[#FAF0E8]/60 border border-[#D9A6A0]/40">
                <span className="text-[10px] text-[#493B39]/60 block font-medium">Peran Pengguna</span>
                <span className="font-bold text-[#8C5E58] flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Pasien MedikaCheck'}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-[#FAF0E8]/60 border border-[#D9A6A0]/40">
                <span className="text-[10px] text-[#493B39]/60 block font-medium">Terdaftar Sejak</span>
                <span className="font-bold text-[#493B39] flex items-center gap-1 mt-0.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#A87575]" />
                  {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2 px-3 rounded-md border border-[#D9A6A0]/50 hover:bg-[#FAF0E8] text-[#493B39] font-medium text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 px-3 rounded-md bg-[#A87575] hover:bg-[#8f5f5f] text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
