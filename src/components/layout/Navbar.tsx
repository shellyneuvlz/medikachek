import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Activity,
  Heart,
  Bell,
  LogOut,
  Menu,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { SystemNotification } from '../../types/index.ts';
import { EditProfileModal } from '../common/EditProfileModal.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activePath,
  onNavigate,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiRequest<SystemNotification[]>('/api/admin/notifications');
        setNotifications(res || []);
      } catch {
        // quiet fallback
      }
    };
    fetchNotifs();
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#FFF5F3] border-b border-[#D9A6A0]/40 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-[#493B39] hover:text-[#A87575] hover:bg-[#FAF0E8] border border-transparent hover:border-[#D9A6A0]/40 transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate(isAdmin ? '/admin/dashboard' : '/app/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/60 flex items-center justify-center text-[#A87575] group-hover:border-[#A87575] transition-colors">
              <Heart className="w-4 h-4 fill-[#D9A6A0] stroke-[#A87575]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-[#493B39]">
                Medika <span className="text-[#A87575] font-normal italic">Check</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF0E8] text-[#8C5E58] border border-[#D9A6A0]/50 uppercase tracking-wider">
                {isAdmin ? 'Portal Admin' : 'Portal Pasien'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-md text-[#493B39]/70 hover:text-[#493B39] hover:bg-[#FAF0E8] border border-transparent hover:border-[#D9A6A0]/40 relative transition-colors cursor-pointer"
              title="Notifikasi & Pengumuman"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A87575] rounded-full ring-2 ring-[#FFF5F3]" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFCFA] rounded-md shadow-lg border border-[#D9A6A0]/50 py-3 z-50 animate-in fade-in">
                <div className="px-4 pb-2 border-b border-[#D9A6A0]/30 flex items-center justify-between">
                  <span className="font-serif font-bold text-xs text-[#493B39]">Pengumuman & Notifikasi</span>
                  <span className="text-[10px] bg-[#FAF0E8] text-[#8C5E58] border border-[#D9A6A0]/40 px-1.5 py-0.5 rounded font-mono">
                    {notifications.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#D9A6A0]/20">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#493B39]/60">Tidak ada pengumuman baru</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-[#FAF0E8]/50 transition-colors">
                        <p className="text-xs font-semibold text-[#493B39] mb-0.5">{n.title}</p>
                        <p className="text-[11px] text-[#493B39]/75 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#D9A6A0]/40" />

          {/* User Info & Avatar */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowProfileModal(true)}
              className="text-right hidden md:block cursor-pointer group"
              title="Klik untuk membuka data profil"
            >
              <div className="text-xs font-bold text-[#493B39] group-hover:text-[#A87575] transition-colors">{user?.name}</div>
              <div className="text-[11px] font-medium text-[#493B39]/70 flex items-center justify-end gap-1">
                {isAdmin ? (
                  <span className="text-[#8C5E58] font-semibold flex items-center gap-0.5">
                    <Shield className="w-3 h-3" /> Administrator
                  </span>
                ) : (
                  <span>{user?.email}</span>
                )}
              </div>
            </div>

            <div
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/60 flex items-center justify-center text-[#A87575] font-serif font-bold text-xs cursor-pointer hover:border-[#A87575] transition-all overflow-hidden"
              title="Ubah Identitas & Foto Profil"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-[#A87575]" />
              )}
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-md text-[#493B39]/60 hover:text-[#8C5E58] hover:bg-[#FAF0E8] border border-transparent hover:border-[#D9A6A0]/40 transition-colors cursor-pointer"
              title="Keluar dari Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};
