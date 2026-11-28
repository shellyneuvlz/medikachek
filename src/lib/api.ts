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
    return fetch(endpoint, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  };

  let response: Response;
  try {
    response = await executeFetch();
    if (
      response.status === 404 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      await new Promise((r) => setTimeout(r, 900));
      response = await executeFetch();
    }
  } catch {
    // Retry once on transient connection reset / server wake-up
    await new Promise((r) => setTimeout(r, 900));
    try {
      response = await executeFetch();
    } catch {
      throw new Error('Tidak dapat terhubung ke server. Pastikan koneksi stabil lalu coba lagi.');
    }
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
      `Sesi pratinjau halaman perlu disegarkan (HTTP ${response.status}). Silakan refresh halaman lalu coba kembali.`
    );
  }

  let data: any = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
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
    throw new Error(
      data.error ||
        (response.status >= 500
          ? `Server sedang memproses atau memulai ulang (HTTP ${response.status}). Silakan coba beberapa detik lagi.`
          : `Permintaan gagal diproses (HTTP ${response.status}). Silakan muat ulang halaman dan coba lagi.`)
    );
  }

  return data as T;
}
