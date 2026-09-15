import { supabase } from './supabaseClient.js';
import { eventIdentity } from './adminScheduling.js';
import { clanHallEvents } from './clanHallSchedule.js';
import './clanHallGallery.js';
import './communityLinks.js';

const EVENT_TYPES = new Map(
  ['RB', 'Epic RB', 'Clan Hall', 'Siege', 'Olympiad', 'Event'].map((type) => [type.toUpperCase(), type]),
);

function normalizeTime(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(value)) return null;
  return value.slice(0, 5);
}

export function normalizeEvent(row) {
  const time = normalizeTime(row?.event_time ?? row?.time);
  const type = EVENT_TYPES.get(String(row?.type ?? '').toUpperCase());
  if (!row || !['string', 'number'].includes(typeof row.id) || !String(row.name ?? '').trim() ||
      typeof row.event_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.event_date) ||
      !time || !type) return null;

  const date = new Date(`${row.event_date}T${time}:00`);
  if (!Number.isFinite(date.getTime())) return null;

  return {
    id: String(row.id),
    name: row.name.trim(),
    date: row.event_date,
    time,
    type,
    location: typeof row.location === 'string' ? row.location : '',
    description: typeof row.description === 'string' ? row.description : '',
    duration: Number(row.duration_minutes ?? row.duration) > 0 ? Number(row.duration_minutes ?? row.duration) : null,
    ...(typeof row.boss === 'string' ? { boss: row.boss } : {}),
  };
}

export async function readSupabaseEvents(client = supabase) {
  if (!client) return null;
  try {
    const { data, error } = await client
      .schema('public')
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .abortSignal(AbortSignal.timeout(5000));
    if (error || !Array.isArray(data)) {
      console.info('Supabase: nie udało się pobrać wydarzeń.', error?.code || 'unavailable');
      return null;
    }
    const events = data.map(normalizeEvent);
    if (events.some((event) => !event)) {
      console.info('Supabase: niezgodny format wydarzeń.');
      return null;
    }
    return events;
  } catch {
    console.info('Supabase: połączenie niedostępne.');
    return null;
  }
}

function databasePayload(event) {
  return {
    name: event.name,
    type: event.type,
    boss: event.boss || null,
    event_date: event.date,
    event_time: event.time,
    duration_minutes: event.duration || null,
    location: event.location || null,
    description: event.description || null,
  };
}

async function requireAuthenticated() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('Zaloguj się jako administrator, aby zmieniać wydarzenia.');
}

export class SupabaseEventRepository {
  clone(events) {
    return events.map((event) => ({ ...event }));
  }

  async getAll() {
    const remote = await readSupabaseEvents();
    const ordinary = (remote ?? []).filter((event) => event.type !== 'Clan Hall');
    return this.clone([...ordinary, ...clanHallEvents(new Date(), 14, 70)]);
  }

  async save(event) {
    if (!supabase) throw new Error('Supabase nie jest skonfigurowany.');
    await requireAuthenticated();
    const payload = databasePayload(event);
    const hasId = event.id !== undefined && event.id !== null && String(event.id).trim() !== '';
    const request = hasId
      ? supabase.schema('public').from('events').update(payload).eq('id', event.id).select('*').single()
      : supabase.schema('public').from('events').insert(payload).select('*').single();
    const { data, error } = await request;
    if (error) throw new Error(`Nie udało się zapisać wydarzenia: ${error.message}`);
    const normalized = normalizeEvent(data);
    if (!normalized) throw new Error('Supabase zwrócił wydarzenie w niezgodnym formacie.');
    return normalized;
  }

  async findDuplicates(candidates) {
    if (!supabase) throw new Error('Supabase nie jest skonfigurowany.');
    await requireAuthenticated();
    const { data, error } = await supabase
      .schema('public')
      .from('events')
      .select('name,event_date,event_time')
      .abortSignal(AbortSignal.timeout(5000));
    if (error) throw new Error(`Nie udało się sprawdzić duplikatów: ${error.message}`);
    const existingKeys = new Set((data ?? []).map((row) => eventIdentity(row)));
    return candidates.filter((candidate) => existingKeys.has(eventIdentity(candidate)));
  }

  async remove(id) {
    if (!supabase) throw new Error('Supabase nie jest skonfigurowany.');
    await requireAuthenticated();
    const { error } = await supabase.schema('public').from('events').delete().eq('id', id);
    if (error) throw new Error(`Nie udało się usunąć wydarzenia: ${error.message}`);
  }
}
