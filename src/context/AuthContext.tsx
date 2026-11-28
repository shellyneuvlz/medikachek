import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import {
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
  apiRequest,
} from '../lib/api.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (name: string, email: string, pass: string) => Promise<User>;
  updateUserProfile: (name: string, avatar?: string | null) => Promise<User>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const syncFirebaseTokenToBackend = async (firebaseToken: string, fallbackUser?: { uid: string; email: string | null; displayName: string | null }): Promise<{ token: string; user: User }> => {
  try {
    return await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
      },
    });
  } catch {
    if (fallbackUser) {
      setStoredAuth(firebaseToken, {
        id: 0,
        uid: fallbackUser.uid,
        email: fallbackUser.email || '',
        name: fallbackUser.displayName || 'Pengguna MedikaCheck',
        role: 'USER',
      });
    }
    const meRes = await apiRequest<{ user: User }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    return { token: firebaseToken, user: meRes.user };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Check auth validity and pending Google redirect result on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (auth) {
          const redirectCred = await Promise.race([
            getRedirectResult(auth).catch(() => null),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
          ]);
          if (redirectCred?.user) {
            const firebaseToken = await redirectCred.user.getIdToken();
            const synced = await syncFirebaseTokenToBackend(firebaseToken, redirectCred.user);
            setStoredAuth(synced.token, synced.user, true);
            setToken(synced.token);
            setUser(synced.user);
            setIsInitializing(false);
            return;
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal menyelesaikan login Google');
      }

      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await apiRequest<{ user: User }>('/api/auth/me');
        setUser(res.user);
      } catch {
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    // Listen to token expiration event
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      setError('Sesi telah kedaluwarsa. Silakan login kembali.');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean = false): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, rememberMe }),
      });

      setStoredAuth(res.token, res.user, rememberMe);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Login gagal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!auth || !googleAuthProvider) {
        throw new Error('Autentikasi Google belum siap di browser ini. Silakan gunakan email & password.');
      }
      const popupPromise = signInWithPopup(auth, googleAuthProvider);
      const guardedPopup = new Promise<typeof popupPromise extends Promise<infer U> ? U : never>(
        (resolve, reject) => {
          let settled = false;
          let popupFocused = false;

          const onBlur = () => {
            popupFocused = true;
          };
          window.addEventListener('blur', onBlur, { once: true });

          const quickCheckTimer = setTimeout(() => {
            if (!settled && !popupFocused && document.hasFocus()) {
              settled = true;
              window.removeEventListener('blur', onBlur);
              reject({
                code: 'auth/popup-blocked',
                message:
                  'Popup login Google tidak dapat dibuka di dalam pratinjau iframe ini.',
              });
            }
          }, 2200);

          const hardTimeoutTimer = setTimeout(() => {
            if (!settled) {
              settled = true;
              window.removeEventListener('blur', onBlur);
              reject({
                code: 'auth/popup-timeout',
                message:
                  'Login Google melebihi batas waktu tunggu. Silakan coba lagi, buka aplikasi di tab baru, atau masuk dengan Email & Kata Sandi.',
              });
            }
          }, 90000);

          popupPromise
            .then((cred) => {
              if (!settled) {
                settled = true;
                clearTimeout(quickCheckTimer);
                clearTimeout(hardTimeoutTimer);
                window.removeEventListener('blur', onBlur);
                resolve(cred);
              }
            })
            .catch((err) => {
              if (!settled) {
                settled = true;
                clearTimeout(quickCheckTimer);
                clearTimeout(hardTimeoutTimer);
                window.removeEventListener('blur', onBlur);
                reject(err);
              }
            });
        }
      );

      const userCredential = await guardedPopup;
      const firebaseToken = await userCredential.user.getIdToken();

      const res = await syncFirebaseTokenToBackend(firebaseToken, userCredential.user);

      setStoredAuth(res.token, res.user, true);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        let inIframe = true;
        try {
          inIframe = window.self !== window.top;
        } catch {
          inIframe = true;
        }
        if (!inIframe && auth && googleAuthProvider) {
          await signInWithRedirect(auth, googleAuthProvider);
          await new Promise((resolve) => setTimeout(resolve, 2500));
          const redirectMsg = 'Browser tidak mengizinkan pengalihan ke halaman Google. Silakan gunakan login Email & Kata Sandi.';
          setError(redirectMsg);
          throw new Error(redirectMsg);
        }
        const popupMsg =
          'Popup login Google diblokir oleh browser atau iframe pratinjau. Izinkan popup di pengaturan browser, buka aplikasi di tab baru, atau masuk dengan Email & Kata Sandi.';
        setError(popupMsg);
        throw new Error(popupMsg);
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        const cancelMsg = 'Jendela login Google ditutup sebelum selesai. Silakan coba lagi.';
        setError(cancelMsg);
        throw new Error(cancelMsg);
      }
      if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
        const domainMsg =
          'Login Google belum aktif pada domain pratinjau ini. Silakan gunakan Email & Kata Sandi untuk masuk atau mendaftar.';
        setError(domainMsg);
        throw new Error(domainMsg);
      }
      if (code === 'auth/network-request-failed' || code === 'auth/internal-error' || code === 'auth/web-storage-unsupported') {
        const netMsg =
          'Layanan login Google tidak dapat diakses di browser/iframe ini. Silakan gunakan Email & Kata Sandi untuk masuk.';
        setError(netMsg);
        throw new Error(netMsg);
      }
      const fallbackMsg = err?.message || 'Gagal login dengan Google. Silakan gunakan Email & Kata Sandi.';
      setError(fallbackMsg);
      throw new Error(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass }),
      });

      setStoredAuth(res.token, res.user, true);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (name: string, avatar?: string | null): Promise<User> => {
    setError(null);
    try {
      const res = await apiRequest<{ message: string; user: User }>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, avatar }),
      });

      const updatedUser = res.user;
      setUser(updatedUser);
      const currentToken = getStoredToken();
      if (currentToken) {
        setStoredAuth(currentToken, updatedUser, true);
      }
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil');
      throw err;
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return res;
    } catch (err: any) {
      setError(err.message || 'Gagal memproses lupa password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      return res.message;
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kata sandi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
        isInitializing,
        isLoading,
        error,
        clearError,
        login,
        loginWithGoogle,
        register,
        updateUserProfile,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
