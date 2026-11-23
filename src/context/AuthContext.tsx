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
import { signInWithPopup } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Check auth validity on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiRequest<{ user: User }>('/api/auth/me');
        setUser(res.user);
      } catch (err) {
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
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
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      const firebaseToken = await userCredential.user.getIdToken();

      // Send to server to authenticate and sync
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }).catch(async () => {
        // Fetch user info via /api/auth/me directly with firebase token
        setStoredAuth(firebaseToken, {
          id: 0,
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || 'Pengguna MedikaCheck',
          role: 'USER',
        });
        const meRes = await apiRequest<{ user: User }>('/api/auth/me', {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        });
        setStoredAuth(firebaseToken, meRes.user, true);
        return { token: firebaseToken, user: meRes.user };
      });

      setStoredAuth(res.token, res.user, true);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
      throw err;
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
