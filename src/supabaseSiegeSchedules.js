import { supabase } from './supabaseClient.js';
import { SIEGE_REFERENCE_DEFAULTS, normalizeSiegeRow } from './siegeSchedules.js';

async function requireAuthenticated() {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('Zaloguj się jako administrator, aby ustawiać terminy Siege.');
}

export class SupabaseSiegeScheduleRepository {
  async getAll() {
    if (!supabase) return SIEGE_REFERENCE_DEFAULTS.map(normalizeSiegeRow).filter(Boolean);
    try {
      const { data, error } = await supabase.schema('public').from('siege_schedule').select('*').order('castle').abortSignal(AbortSignal.timeout(5000));
      if (error || !Array.isArray(data)) {
        console.info('Siege Manager: tabela niedostępna, używam terminów referencyjnych.');
        return SIEGE_REFERENCE_DEFAULTS.map(normalizeSiegeRow).filter(Boolean);
      }
      if (!data.length) return SIEGE_REFERENCE_DEFAULTS.map(normalizeSiegeRow).filter(Boolean);
      return data.map(normalizeSiegeRow).filter(Boolean);
    } catch {
      console.info('Siege Manager: odczyt niedostępny, używam terminów referencyjnych.');
      return SIEGE_REFERENCE_DEFAULTS.map(normalizeSiegeRow).filter(Boolean);
    }
  }

  async saveReference(castle, referenceDate, referenceTime) {
    await requireAuthenticated();
    const rows = await this.getAll();
    const existing = rows.find((row) => row.castle === castle && row.id);
    const payload = {
      castle,
      reference_date: referenceDate,
      reference_time: referenceTime,
      duration_minutes: 120,
      updated_at: new Date().toISOString(),
    };
    const request = existing
      ? supabase.schema('public').from('siege_schedule').update(payload).eq('id', existing.id).select('*').single()
      : supabase.schema('public').from('siege_schedule').insert(payload).select('*').single();
    const { data, error } = await request;
    if (error) throw new Error(`Nie udało się zapisać terminu Siege: ${error.message}`);
    return normalizeSiegeRow(data);
  }
}
