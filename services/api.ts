/**
 * Thin client for the CAFFT API (server/). Same-origin under <base>api, so the
 * session cookie travels automatically and the strict CSP (connect-src 'self')
 * needs no exception.
 */

const API_BASE = `${import.meta.env.BASE_URL}api`;

/** Fired when the server answers 401 to a request made with a session. */
export const SESSION_EXPIRED_EVENT = 'cafft:session-expired';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** The server's error value; for auth errors this is a translation key. */
    readonly code: string,
  ) {
    super(`API ${status}: ${code}`);
  }

  /** Worth retrying: the request may succeed later as-is. */
  get transient(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

export async function api<T = void>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = typeof data?.error === 'string' ? data.error : 'unknown';
    // Login answers 401 for wrong credentials; that is not an expired session.
    if (res.status === 401 && code === 'unauthenticated') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, code);
  }
  return data as T;
}
