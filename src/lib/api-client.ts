const AUTH_TOKEN_KEY = 'classroom-auth-token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) {
      return undefined as T;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, err.error || res.statusText);
    }

    return res.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request('PATCH', path, body);
  }

  delete(path: string): Promise<void> {
    return this.request('DELETE', path);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
