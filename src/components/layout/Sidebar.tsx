import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  HeartPulse,
  Utensils,
  AlertCircle,
  Moon,
  Flame,
  Droplets,
  BarChart3,
  BookOpen,
  Users,
  Database,
  Layers,
  BellRing,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Heart,
  Smile,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activePath,
  onNavigate,
}) => {
  const { user, isAdmin, logout } = useAuth();

  const userNavItems = [
    { name: 'Dashboard Saya', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Catatan Fisik', path: '/app/health', icon: HeartPulse },
    { name: 'Catatan Makanan', path: '/app/meals', icon: Utensils },
    { name: 'Catatan Gejala', path: '/app/symptoms', icon: AlertCircle },
    { name: 'Kualitas Tidur', path: '/app/sleep', icon: Moon },
    { name: 'Aktivitas Fisik', path: '/app/activity', icon: Flame },
    { name: 'Kebutuhan Air (Hidrasi)', path: '/app/hydration', icon: Droplets },
    { name: 'Rekap Laporan Mingguan', path: '/app/reports', icon: BarChart3, badge: 'Lengkap' },
    { name: 'Artikel Edukasi', path: '/app/articles', icon: BookOpen },
  ];

  const adminNavItems = [
    { name: 'Dashboard Admin', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Rekap Laporan Agregat', path: '/admin/reports', icon: BarChart3, badge: 'Agregat' },
    { name: 'Kelola Pengguna', path: '/admin/users', icon: Users },
    { name: 'Database Makanan', path: '/admin/foods', icon: Database },
    { name: 'Artikel Edukasi', path: '/admin/articles', icon: BookOpen },
    { name: 'Kelola Kategori', path: '/admin/categories', icon: Layers },
    { name: 'Pengumuman Sistem', path: '/admin/notifications', icon: BellRing },
  ];

  const items = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs lg:hidden"
        />
      )}

      {/* Sidebar Panel - Warm Soft Pink Clean Style */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#FFFCFA] text-[#493B39] flex flex-col transition-transform duration-300 ease-in-out border-r border-[#D9A6A0]/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#D9A6A0]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#FAF0E8] border border-[#D9A6A0]/60 text-[#A87575] flex items-center justify-center font-bold">
              <Heart className="w-4 h-4 fill-[#D9A6A0] stroke-[#A87575]" />
            </div>
            <div>
              <h1 className="font-serif text-base font-bold tracking-tight text-[#493B39]">
                Medika <span className="text-[#A87575] font-normal italic">Check</span>
              </h1>
              <p className="text-[10px] text-[#8C5E58] font-serif italic">Rekam Medis & Skrining</p>
            </div>
          </div>
          {isAdmin && (
            <span className="text-[9px] bg-[#FAF0E8] text-[#8C5E58] border border-[#D9A6A0]/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              ADMIN
            </span>
          )}
        </div>

        {/* User Card in Sidebar */}
        <div className="p-3 mx-3 my-3 rounded-md bg-[#FAF0E8]/70 border border-[#D9A6A0]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#FFF5F3] border border-[#D9A6A0]/50 text-[#A87575] flex items-center justify-center font-serif font-bold text-xs shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                user?.name?.charAt(0) || 'P'
              )}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-[#493B39] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#493B39]/70 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#8C5E58] uppercase tracking-wider font-serif">
            {isAdmin ? 'Menu Administrator' : 'Menu Pasien'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#A87575] text-white font-semibold'
                    : 'text-[#493B39]/80 hover:text-[#493B39] hover:bg-[#FAF0E8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8C5E58]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FAF0E8] text-[#8C5E58] border border-[#D9A6A0]/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-[#D9A6A0]'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#D9A6A0]/30 space-y-1">
          {/* Quick link back to Public Quick Check */}
          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[#493B39] hover:text-[#A87575] hover:bg-[#FAF0E8] transition-colors cursor-pointer"
          >
            <Smile className="w-4 h-4 text-[#8C5E58]" />
            <span>Pemeriksaan Mandiri</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[#8C5E58] hover:bg-[#FAF0E8] transition-colors font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
