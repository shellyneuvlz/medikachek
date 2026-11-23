import { User } from '../types/index.ts';

const TOKEN_KEY = 'medikacheck_token';
const USER_KEY = 'medikacheck_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: User, rememberMe: boolean = true) => {
  // Clear any existing stale data first
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Always store in localStorage so sessions survive refreshes and navigation
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const executeFetch = async (): Promise<Response> => {
    return fetch(endpoint, {
      ...options,
      headers,
    });
  };

  let response: Response;
  try {
    response = await executeFetch();
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      await new Promise((r) => setTimeout(r, 900));
      response = await executeFetch();
    }
  } catch (networkError) {
    // Retry once on transient connection reset / server wake-up
    await new Promise((r) => setTimeout(r, 900));
    try {
      response = await executeFetch();
    } catch {
      throw new Error('Tidak dapat terhubung ke server. Pastikan koneksi stabil lalu coba lagi.');
    }
  }

  if (response.status === 401) {
    // Session expired or invalid token
    clearStoredAuth();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Sesi telah berakhir. Silakan login kembali.');
  }

  const rawText = await response.text().catch(() => '');
  let data: any = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        (response.status >= 500
          ? 'Server sedang memproses atau memulai ulang. Silakan coba beberapa detik lagi.'
          : 'Terjadi kesalahan pada permintaan.')
    );
  }

  return data as T;
}
