import React, { useState } from 'react';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activePath,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF5F3] text-[#493B39] flex flex-col font-sans antialiased selection:bg-[#D9A6A0]/40 selection:text-[#493B39]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePath={activePath}
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activePath={activePath}
          onNavigate={onNavigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-[#D9A6A0]/30 text-center text-xs text-[#493B39]/70 bg-[#FFFCFA]">
          <p>© 2026 Medika Check — Pendamping Kesehatan & Kesejahteraan Emosional Terpadu.</p>
        </footer>
      </div>
    </div>
  );
};
