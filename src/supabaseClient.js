import { createClient } from '@supabase/supabase-js';
import { installMemberAuth } from './memberAuth.js';
import { installMemberEventSignups } from './memberEventSignups.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The publishable key is safe for browser code. Never use a service-role key in Vite.
export const supabase = url?.startsWith('https://') && key?.startsWith('sb_publishable_')
  ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

if (typeof document !== 'undefined') {
  const startMemberFeatures = () => {
    installMemberAuth(supabase);
    installMemberEventSignups(supabase);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startMemberFeatures, { once: true });
  else queueMicrotask(startMemberFeatures);
}
