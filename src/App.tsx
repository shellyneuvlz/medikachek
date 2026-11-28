import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { PublicHealthCheckPage } from './pages/public/PublicHealthCheckPage.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard.tsx';
import { HealthLogsPage } from './pages/user/HealthLogsPage.tsx';
import { MealsPage } from './pages/user/MealsPage.tsx';
import { SymptomsPage } from './pages/user/SymptomsPage.tsx';
import { SleepPage } from './pages/user/SleepPage.tsx';
import { ActivityPage } from './pages/user/ActivityPage.tsx';
import { HydrationPage } from './pages/user/HydrationPage.tsx';
import { ReportsPage } from './pages/user/ReportsPage.tsx';
import { ArticlesPage } from './pages/user/ArticlesPage.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.tsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.tsx';
import { AdminFoodsPage } from './pages/admin/AdminFoodsPage.tsx';
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage.tsx';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.tsx';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage.tsx';

function MainRouter() {
  const { user, isAuthenticated, isAdmin, isInitializing, clearError } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  // Keep browser URL in sync and handle back/forward
  useEffect(() => {
    const handlePopState = () => {
      clearError();
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    clearError();
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Route protection logic
  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      // Admin MUST login
      if (currentPath.startsWith('/admin')) {
        navigate('/login');
      }
      // User wishing to check further (e.g. detailed tracking, reports, meal responses) MUST login
      else if (currentPath.startsWith('/app')) {
        navigate('/login');
      }
    } else {
      // Authenticated users
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/app/dashboard');
        }
      } else if (currentPath.startsWith('/admin') && !isAdmin) {
        // Regular user cannot access admin
        navigate('/app/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, isInitializing, currentPath]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FFF5F3] flex flex-col items-center justify-center text-[#493B39]">
        <div className="w-12 h-12 rounded-xl bg-[#FFFCFA] border border-[#D9A6A0]/50 flex items-center justify-center text-[#A87575] mb-4 shadow-xs">
          <span className="font-serif font-bold text-xl">M</span>
        </div>
        <div className="w-6 h-6 border-2 border-[#A87575] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-[#493B39]/70 font-medium">Memuat Medika Check...</p>
      </div>
    );
  }

  // Public Routes (Accessible without login)
  if (!isAuthenticated) {
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    // Default for guest: Cek Kesehatan Mandiri tanpa login!
    return <PublicHealthCheckPage onNavigate={navigate} />;
  }

  // Protected App Pages inside AppLayout
  const renderAppContent = () => {
    switch (currentPath) {
      // User Pages
      case '/app/dashboard':
        return <UserDashboard onNavigate={navigate} />;
      case '/app/health':
        return <HealthLogsPage />;
      case '/app/meals':
        return <MealsPage />;
      case '/app/symptoms':
        return <SymptomsPage />;
      case '/app/sleep':
        return <SleepPage />;
      case '/app/activity':
        return <ActivityPage />;
      case '/app/hydration':
        return <HydrationPage />;
      case '/app/reports':
        return <ReportsPage />;
      case '/app/articles':
        return <ArticlesPage />;

      // Admin Pages
      case '/admin/dashboard':
        return <AdminDashboard onNavigate={navigate} />;
      case '/admin/reports':
        return <AdminReportsPage />;
      case '/admin/users':
        return <AdminUsersPage />;
      case '/admin/foods':
        return <AdminFoodsPage />;
      case '/admin/articles':
        return <AdminArticlesPage />;
      case '/admin/categories':
        return <AdminCategoriesPage />;
      case '/admin/notifications':
        return <AdminNotificationsPage />;

      default:
        return isAdmin ? (
          <AdminDashboard onNavigate={navigate} />
        ) : (
          <UserDashboard onNavigate={navigate} />
        );
    }
  };

  return (
    <AppLayout activePath={currentPath} onNavigate={navigate}>
      {renderAppContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
