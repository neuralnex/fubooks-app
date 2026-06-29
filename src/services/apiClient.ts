import type { ApiErrorBody } from '../sharedTypes';

/**
 * Reads the API base URL from the EXPO_PUBLIC_API_BASE_URL env var, which is injected
 * per build profile by eas.json (development/preview/production each point at a
 * different backend). Expo automatically inlines any env var prefixed with
 * EXPO_PUBLIC_ into the JS bundle at build time — see https://docs.expo.dev/guides/environment-variables/
 * Falls back to localhost for local `expo start` / Expo Go sessions where no EAS
 * build profile env is present.
 */
const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiClientError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

type GetTokenFn = () => Promise<string | null>;

/**
 * Thin fetch wrapper. `getToken` is injected by the caller (ultimately backed by
 * Privy's `getAccessToken` from `usePrivy()`), so this module has no direct
 * dependency on the Privy SDK and stays easily testable.
 */
async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    getToken?: GetTokenFn;
    skipAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, getToken, skipAuth = false } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!skipAuth && getToken) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // non-JSON error response; fall through to generic message
    }
    throw new ApiClientError(
      response.status,
      errorBody?.error?.code ?? 'UNKNOWN_ERROR',
      errorBody?.error?.message ?? `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T,>(path: string, getToken?: GetTokenFn) => request<T>(path, { method: 'GET', getToken }),
  post: <T,>(path: string, body?: unknown, getToken?: GetTokenFn) =>
    request<T>(path, { method: 'POST', body, getToken }),
  patch: <T,>(path: string, body?: unknown, getToken?: GetTokenFn) =>
    request<T>(path, { method: 'PATCH', body, getToken }),
  put: <T,>(path: string, body?: unknown, getToken?: GetTokenFn) =>
    request<T>(path, { method: 'PUT', body, getToken }),
  delete: <T,>(path: string, getToken?: GetTokenFn) =>
    request<T>(path, { method: 'DELETE', getToken }),
};
