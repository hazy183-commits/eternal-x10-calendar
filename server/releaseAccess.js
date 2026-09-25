export class ReleaseError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function requireOwner(token, env = process.env, fetcher = fetch) {
  if (!token || token.length > 8000) throw new ReleaseError(401, 'Zaloguj się jako właściciel strony.');
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ReleaseError(503, 'Brak konfiguracji logowania.');
  const headers = { apikey: key, Authorization: `Bearer ${token}` };
  const userResponse = await fetcher(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(8000) });
  if (!userResponse.ok) throw new ReleaseError(401, 'Sesja wygasła. Zaloguj się ponownie.');
  const user = await userResponse.json();
  if (!user.id) throw new ReleaseError(401, 'Nieprawidłowa sesja.');
  const response = await fetcher(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,status,removed_at`, { headers, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new ReleaseError(403, 'Nie udało się potwierdzić uprawnień właściciela.');
  const rows = await response.json();
  const profile = rows.length === 1 ? rows[0] : null;
  if (profile?.role !== 'owner' || profile.status !== 'approved' || profile.removed_at != null) {
    throw new ReleaseError(403, 'Ta część strony jest dostępna tylko dla właściciela.');
  }
  return user.id;
}

export const PUBLIC_HOSTS = new Set(['orzelbialy.eu', 'www.orzelbialy.eu']);
export const PREVIEW_COOKIE = '__Host-ob-preview';
export function previewToken(cookie = '') {
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${PREVIEW_COOKIE}=`))?.slice(PREVIEW_COOKIE.length + 1) || '';
}
