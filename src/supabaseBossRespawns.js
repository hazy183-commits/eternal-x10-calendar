import { supabase } from './supabaseClient.js';
import { calculateBaseRespawnAt, calculateWindowEnd, localDateTimeToDate, localDateTimeToIso, normalizeRespawnRow } from './bossRespawns.js';

async function requireAuthenticated() {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('Zaloguj się jako administrator, aby zmieniać respawny bossów.');
}

export class SupabaseBossRespawnRepository {
  async getAll() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.schema('public').from('boss_respawns').select('*').order('boss').abortSignal(AbortSignal.timeout(5000));
      if (error || !Array.isArray(data)) {
        console.info('Boss Respawn Manager: tabela niedostępna, używam pustego stanu.');
        return [];
      }
      return data.map(normalizeRespawnRow).filter(Boolean);
    } catch {
      console.info('Boss Respawn Manager: odczyt niedostępny, używam pustego stanu.');
      return [];
    }
  }

  async saveKill(boss, killDate, killTime) {
    await requireAuthenticated();
    const existing = (await this.getAll()).find((row) => row.boss === boss);
    const kill = calculateBaseRespawnAt(boss, killDate, killTime);
    const killAt = localDateTimeToDate(killDate, killTime);
    if (!kill || !killAt) throw new Error('Podaj prawidłową datę i godzinę zabicia.');
    const payload = {
      ...(existing?.id ? { id: existing.id } : {}), boss,
      last_kill_at: killAt.toISOString(),
      base_respawn_at: kill.toISOString(),
      window_start: null,
      window_end: null,
      status: 'ZABITY',
      updated_at: new Date().toISOString(),
    };
    const request = existing?.id
      ? supabase.schema('public').from('boss_respawns').update(payload).eq('id', existing.id).select('*').single()
      : supabase.schema('public').from('boss_respawns').insert(payload).select('*').single();
    const { data, error } = await request;
    if (error) throw new Error(`Nie udało się zapisać zabicia bossa: ${error.message}`);
    return normalizeRespawnRow(data);
  }

  async saveWindow(boss, windowDate, windowTime) {
    await requireAuthenticated();
    const existing = (await this.getAll()).find((row) => row.boss === boss);
    const startIso = localDateTimeToIso(windowDate, windowTime);
    const end = calculateWindowEnd(windowDate, windowTime);
    if (!startIso || !end) throw new Error('Podaj prawidłową datę i godzinę początku okna.');
    const payload = {
      ...(existing?.id ? { id: existing.id } : {}), boss,
      last_kill_at: existing?.last_kill_at || null,
      base_respawn_at: existing?.base_respawn_at || null,
      window_start: startIso,
      window_end: end.toISOString(),
      status: 'NADCHODZI',
      updated_at: new Date().toISOString(),
    };
    const request = existing?.id
      ? supabase.schema('public').from('boss_respawns').update(payload).eq('id', existing.id).select('*').single()
      : supabase.schema('public').from('boss_respawns').insert(payload).select('*').single();
    const { data, error } = await request;
    if (error) throw new Error(`Nie udało się zapisać okna respawnu: ${error.message}`);
    return normalizeRespawnRow(data);
  }
}
