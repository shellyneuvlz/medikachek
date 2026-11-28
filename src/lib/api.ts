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
  const isAuthPublicEndpoint =
    endpoint.startsWith('/api/auth/login') ||
    endpoint.startsWith('/api/auth/register') ||
    endpoint.startsWith('/api/auth/forgot-password') ||
    endpoint.startsWith('/api/auth/reset-password') ||
    endpoint.startsWith('/api/public/');

  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !isAuthPublicEndpoint && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const executeFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      return await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: options.signal || controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let response: Response;
  let lastNetworkError: unknown = null;
  const retryDelays = [500, 1000];

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      response = await executeFetch();
      const shouldRetry =
        response.status === 404 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;
      if (!shouldRetry || attempt === retryDelays.length) {
        break;
      }
      await new Promise((r) => setTimeout(r, retryDelays[attempt]));
    } catch (err: any) {
      lastNetworkError = err;
      if (err?.name === 'AbortError') {
        if (attempt === retryDelays.length) {
          throw new Error('Permintaan ke server melebihi batas waktu (timeout). Silakan coba lagi.');
        }
      } else if (attempt === retryDelays.length) {
        throw new Error('Tidak dapat terhubung ke server. Pastikan koneksi stabil lalu coba lagi.');
      }
      await new Promise((r) => setTimeout(r, retryDelays[attempt]));
    }
  }

  if (!response!) {
    throw lastNetworkError instanceof Error
      ? lastNetworkError
      : new Error('Tidak dapat terhubung ke server. Pastikan koneksi stabil lalu coba lagi.');
  }

  const rawText = await response.text().catch(() => '');
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isHtmlResponse =
    contentType.includes('text/html') ||
    rawText.trimStart().startsWith('<!') ||
    rawText.trimStart().startsWith('<html') ||
    response.url.includes('__cookie_check');

  if (isHtmlResponse) {
    throw new Error(
      `Sesi pratinjau halaman perlu disegarkan (HTTP ${response.status}). Silakan muat ulang (refresh) halaman lalu coba kembali.`
    );
  }

  let data: any = {};
  let parsedJson = false;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
      parsedJson = true;
    } catch {
      data = {};
    }
  }

  if (response.status === 401) {
    if (!isAuthPublicEndpoint) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.error || 'Sesi telah berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    if (response.status === 404 && !parsedJson) {
      throw new Error(
        'Koneksi ke server API sedang memulai ulang atau sesi pratinjau kadaluarsa (HTTP 404). Silakan muat ulang halaman lalu coba lagi.'
      );
    }
    throw new Error(
      data.error ||
        (response.status >= 500
          ? `Server sedang memproses atau memulai ulang (HTTP ${response.status}). Silakan coba beberapa detik lagi.`
          : `Permintaan gagal diproses (HTTP ${response.status}). Silakan muat ulang halaman dan coba lagi.`)
    );
  }

  return data as T;
}
