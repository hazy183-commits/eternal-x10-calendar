import { next } from '@vercel/functions';
import { requireOwner, ReleaseError, PUBLIC_HOSTS, PREVIEW_COOKIE, previewToken } from './server/releaseAccess.js';

export const config = { matcher: '/:path*' };

function loginPage(message = '') {
  // Messages are fixed application strings; never echo a URL, login or upstream response.
  return new Response(`<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prywatny podgląd · Orzeł Biały</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#080f0e;color:#e6dcc5;font:16px system-ui}main{margin:20px;padding:32px;max-width:420px;border:1px solid #77602c;background:#101714}small{color:#d9ad50;letter-spacing:2px}h1{font-family:Georgia}label{display:block;margin:18px 0}input,button{box-sizing:border-box;width:100%;padding:13px;background:#08100e;border:1px solid #77602c;color:#fff;margin-top:7px}button{color:#ffd169;cursor:pointer}p{line-height:1.6}a{color:#ffd169}</style><main><small>ORZEŁ BIAŁY · TYLKO DLA WŁAŚCICIELA</small><h1>Prywatny podgląd</h1><p>Zmiany w tej wersji nie są jeszcze opublikowane dla klanu. Zaloguj się swoim kontem właściciela. Użyj tego samego e-maila lub nicku i hasła co na głównej stronie.</p><form method="post" action="/__preview-login"><label>E-mail lub nick<input name="nickname" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="254"></label><label>Hasło<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Otwórz wersję testową</button></form><p role="status">${message}</p><a href="https://orzelbialy.eu">Wróć na stronę klanu</a></main></html>`, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } });
}

export function makePreviewMiddleware(env = process.env, fetcher = fetch) {
  return async request => {
    const url = new URL(request.url);
    // Public production domains serve the released version. Generated deployment URLs stay private,
    // even after promotion (Vercel keeps the build's original environment after promotion).
    if (PUBLIC_HOSTS.has(url.hostname) || (!env.VERCEL && ['localhost','127.0.0.1'].includes(url.hostname))) return next();
    if (url.pathname === '/__preview-login' && request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin) return new Response('Forbidden', { status: 403 });
      try {
        if (Number(request.headers.get('content-length') || 0) > 4096) return loginPage('Formularz jest zbyt duży.');
        const form = await request.formData();
        const identifier = String(form.get('nickname') || '').trim().toLowerCase();
        const nickname = identifier.replace(/[^a-z0-9_-]/g,'');
        const email = identifier.includes('@') ? identifier : `${nickname}@members.orzelbialy.local`;
        const password = String(form.get('password') || '');
        if (!identifier || identifier.length > 254 || !nickname || !password || password.length > 256) return loginPage('Wpisz e-mail lub nick oraz hasło używane na głównej stronie.');
        const response = await fetcher(`${env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(8000) });
        if (!response.ok) return loginPage('Nie udało się zalogować. Sprawdź dane właściciela.');
        const session = await response.json();
        await requireOwner(session.access_token, env, fetcher);
        if (!/^[A-Za-z0-9_.-]+$/.test(session.access_token)) return loginPage('Nieprawidłowa sesja.');
        return new Response(null, { status: 303, headers: { Location: '/', 'Cache-Control': 'no-store', 'Set-Cookie': `${PREVIEW_COOKIE}=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.min(Number(session.expires_in)||3600,3600)}` } });
      } catch (error) {
        const known = error instanceof ReleaseError;
        console.error('[preview-login]', JSON.stringify({status:known?error.status:503,reason:known?error.message:(error?.name==='TimeoutError'?'timeout':'unexpected')}));
        return loginPage(known?error.message:'Nie udało się połączyć z usługą logowania. Spróbuj ponownie.');
      }
    }
    if (url.pathname === '/__preview-logout' && request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin) return new Response('Forbidden', { status: 403 });
      return new Response(null, { status: 303, headers: { Location:'/', 'Cache-Control':'no-store', 'Set-Cookie':`${PREVIEW_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` } });
    }
    try {
      await requireOwner(previewToken(request.headers.get('cookie') || ''), env, fetcher);
      return next({ headers: { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow' } });
    } catch {
      if (request.headers.get('accept')?.includes('text/html')) return loginPage();
      return new Response('Private preview', { status:401, headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'} });
    }
  };
}

export default makePreviewMiddleware();
