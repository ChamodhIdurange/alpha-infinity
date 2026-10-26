let csrfToken = '';

export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

/** JSON/FormData request to the admin API. A 401 sends the owner back to sign in. */
export async function api<T = { ok: boolean }>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-CSRF-Token': csrfToken };
  const init: RequestInit = { method, credentials: 'same-origin', headers };
  if (data instanceof FormData) init.body = data;
  else if (data !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(data);
  }
  const resp = await fetch(path, init);
  if (resp.status === 401 && !path.endsWith('/login')) {
    location.href = '/admin';
    throw new Error('Session expired');
  }
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(typeof json.detail === 'string' ? json.detail : 'Could not save your changes');
  return json as T;
}
