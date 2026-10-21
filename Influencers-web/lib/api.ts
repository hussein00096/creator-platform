import type { PageMeta } from './types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiResult<T> = { data: T; meta?: PageMeta };

export async function api<T>(path: string, options: { method?: string; body?: unknown; token?: string; form?: FormData } = {}): Promise<ApiResult<T>> {
  const headers = new Headers();
  let body: BodyInit | undefined;
  if (options.form) body = options.form;
  else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  const response = await fetch(resolve(path), {
    method: options.method || 'GET',
    headers,
    body,
    cache: 'no-store',
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new ApiError(json?.message || 'Request failed', response.status);
  }
  return json as ApiResult<T>;
}

function resolve(path: string) {
  if (typeof window === 'undefined') {
    return `${process.env.API_ORIGIN || 'http://127.0.0.1:4000'}${path}`;
  }
  return path;
}
