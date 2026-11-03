const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  message?: string | string[];
  code?: string;
}

export class BaseApiClient {
  protected get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  protected post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  protected patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  protected delete<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: 'include',
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, 'Cannot reach the Watchdog server. Check your connection and try again.');
    }

    if (response.status === 204) {
      return undefined as T;
    }
    const data = (await response.json().catch(() => null)) as (ErrorBody & T) | null;
    if (!response.ok) {
      const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
      throw new ApiError(response.status, message ?? 'Something went wrong', data?.code);
    }
    return data as T;
  }
}
