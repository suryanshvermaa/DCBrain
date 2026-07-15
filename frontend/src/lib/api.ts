const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiErrorDetails {
  [key: string]: string[];
}

export interface ApiErrorPayload {
  code?: string;
  message: string;
  details?: ApiErrorDetails;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: ApiErrorDetails;

  constructor(message: string, status: number, code?: string, details?: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeApiErrorBody(body: unknown): ApiErrorPayload {
  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === 'object') {
      const payload = error as { code?: unknown; message?: unknown; details?: unknown };
      const details =
        payload.details && typeof payload.details === 'object'
          ? Object.fromEntries(
              Object.entries(payload.details as Record<string, unknown>).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value)],
              ])
            )
          : undefined;

      return {
        code: typeof payload.code === 'string' ? payload.code : undefined,
        message: typeof payload.message === 'string' ? payload.message : 'An error occurred',
        details,
      };
    }
  }

  if (body && typeof body === 'object') {
    const payload = body as { code?: unknown; message?: unknown; details?: unknown };
    const details =
      payload.details && typeof payload.details === 'object'
        ? Object.fromEntries(
            Object.entries(payload.details as Record<string, unknown>).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value)],
            ])
          )
        : undefined;

    return {
      code: typeof payload.code === 'string' ? payload.code : undefined,
      message: typeof payload.message === 'string' ? payload.message : 'An error occurred',
      details,
    };
  }

  return {
    message: 'An error occurred',
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = options.body instanceof FormData
      ? { ...options.headers }
      : {
          'Content-Type': 'application/json',
          ...options.headers,
        };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const error = normalizeApiErrorBody(errorBody);
      throw new ApiError(error.message || `HTTP error ${response.status}`, response.status, error.code, error.details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async getBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const token = await this.getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      method: 'GET',
      headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      let payload: ApiErrorPayload;
      try {
        const body = await response.json();
        payload = normalizeApiErrorBody(body);
      } catch {
        payload = { message: response.statusText || 'An error occurred' };
      }
      throw new ApiError(payload.message, response.status, payload.code, payload.details);
    }

    return response.blob();
  }

  post<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  postForm<T>(endpoint: string, formData: FormData, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  put<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiClient };

export function getApiClient(): ApiClient {
  return api;
}
