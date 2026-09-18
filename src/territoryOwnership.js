import { SIEGE_CASTLES } from './siegeSchedules.js';
import { CLAN_HALLS } from './clanHallSchedule.js';

export const TERRITORY_GROUPS = Object.freeze({
  castle: Object.freeze(SIEGE_CASTLES.map((name) => Object.freeze({
    name,
    aliases: [name, `${name} castle`, `castle ${name}`],
  }))),
  clan_hall: Object.freeze(CLAN_HALLS.map(({ name }) => Object.freeze({
    name,
    aliases: [name, name.replace('Fortress of ', 'Fortress '), name.replace('Rainbow Spring', 'Rainbow Springs')],
  }))),
});

const OWNER_LABEL = /\b(?:owner|owned\s+by|clan|clan\s+name|ruler|lord|possession)\b\s*[:\-–—]?\s*/i;
const EMPTY_OWNER = /^(?:none|no\s+owner|unowned|neutral|npc|brak|-)$/i;
const EXPLICIT_EMPTY_OWNER = /\b(?:none|no\s+owner|unowned|neutral|brak)\b/i;
const SCHEDULE_MARKER = /(?:\b(?:[0-2]?\d)\s*[:.,]\s*[0-5]\d\b|\b(?:[01]\d|2[0-3])[0-5]\d(?:\d{6,8})?\b|\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b|\b20\d{2}\b)/i;

function normalized(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[|!]/g, 'l')
    .replace(/0/g, 'o')
    .replace(/[^a-z0-9\s'_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value = '') {
  return normalized(value).replace(/[^a-z0-9]/g, '');
}

function cleanOwner(value = '') {
  const raw = String(value).replace(/^[\s:|=\-–—>]+|[\s:|=\-–—<]+$/g, '').trim();
  if (!raw || EMPTY_OWNER.test(raw)) return '';
  const scheduleAt = raw.search(SCHEDULE_MARKER);
  const withoutSchedule = scheduleAt >= 0 ? raw.slice(0, scheduleAt).trim() : raw;
  let cleaned = withoutSchedule
    .replace(OWNER_LABEL, '')
    .replace(/^[\s:|=\-–—>]+|[\s:|=\-–—<]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!cleaned || EMPTY_OWNER.test(cleaned)) return '';
  // The server table has separate Clan and Leader columns. OCR flattens both
  // columns into one line before the siege time, while Interlude clan names
  // themselves cannot contain spaces. Keep only the Clan column in that case.
  if (scheduleAt >= 0) cleaned = cleaned.split(/\s+/)[0];
  return cleaned.slice(0, 80);
}

function findTerritory(line, territories) {
  const lineCompact = compact(line);
  return territories.find((territory) => territory.aliases.some((alias) => lineCompact.includes(compact(alias)))) || null;
}

function ownerAfterTerritory(line, territory) {
  const source = String(line);
  const aliases = [...territory.aliases].sort((a, b) => b.length - a.length);
  const alias = aliases.find((item) => compact(source).includes(compact(item)));
  if (!alias) return '';
  const pattern = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i');
  const match = pattern.exec(source);
  if (!match) return '';
  const rawTail = source.slice(match.index + match[0].length)
    .replace(/^\s*(?:castle|clan\s+hall)?\s*/, '')
    .replace(/^\s*[:|=\-–—>]+\s*/, '')
    .trim();
  if (EMPTY_OWNER.test(rawTail)) return '';
  const tail = rawTail
    .replace(OWNER_LABEL, '')
    .replace(/^\s*(?:status|siege\s+date|tax|lord)?\s*[:|=\-–—>]+\s*/i, '');
  return cleanOwner(tail);
}

function plausibleOwner(value, territories) {
  const owner = cleanOwner(value);
  if (!owner || owner.length < 2 || owner.length > 80) return '';
  if (findTerritory(owner, territories)) return '';
  if (/^(?:castle|clan hall|siege|territory|name|status|tax|date|time)$/i.test(owner)) return '';
  return owner;
}

export function parseTerritoryOwners(rawText = '', territoryType = 'castle') {
  const territories = TERRITORY_GROUPS[territoryType] || [];
  const lines = String(rawText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const found = new Map();

  lines.forEach((line, index) => {
    const territory = findTerritory(line, territories);
    if (!territory || found.has(territory.name)) return;
    const sameLine = plausibleOwner(ownerAfterTerritory(line, territory), territories);
    const nearby = lines.slice(index + 1, index + 4);
    const labeled = nearby.find((candidate) => OWNER_LABEL.test(candidate));
    const fallback = nearby.find((candidate) => !findTerritory(candidate, territories));
    const owner = sameLine || plausibleOwner(labeled || '', territories) || plausibleOwner(fallback || '', territories);
    const explicitEmpty = EXPLICIT_EMPTY_OWNER.test(line) || EXPLICIT_EMPTY_OWNER.test(labeled || fallback || '');
    found.set(territory.name, {
      territory_type: territoryType,
      territory_name: territory.name,
      owner_clan: owner,
      selected: Boolean(owner) || explicitEmpty,
    });
  });

  return [...found.values()];
}

export function normalizeOwnershipRow(row) {
  const type = row?.territory_type;
  const territory = (TERRITORY_GROUPS[type] || []).find(({ name }) => name === row?.territory_name);
  if (!territory) return null;
  return {
    territory_type: type,
    territory_name: territory.name,
    owner_clan: typeof row.owner_clan === 'string' ? row.owner_clan.trim() : '',
    updated_at: row.updated_at || null,
  };
}

export function ownerFor(rows = [], territoryType, territoryName) {
  return rows.find((row) => row.territory_type === territoryType && row.territory_name === territoryName)?.owner_clan || '';
}

export function applyTerritoryOwners(events = [], rows = []) {
  return events.map((event) => {
    const territoryType = event.isSiegeSchedule || event.type === 'Siege' ? 'castle' : event.isClanHallSchedule || event.type === 'Clan Hall' ? 'clan_hall' : '';
    if (!territoryType) return event;
    const territoryName = territoryType === 'castle' ? (event.castle || String(event.name || '').replace(/\s+Castle Siege$/i, '')) : event.name;
    const ownerClan = ownerFor(rows, territoryType, territoryName);
    if (!ownerClan) return { ...event, ownerClan: '', description: event.description?.replace(/\s*Właściciel:\s*[^.]+\.?$/i, '') || '' };
    const base = event.description?.replace(/\s*Właściciel:\s*[^.]+\.?$/i, '').trim() || '';
    return { ...event, ownerClan, description: `${base}${base ? ' ' : ''}Właściciel: ${ownerClan}.` };
  });
}

export class TerritoryOwnershipRepository {
  constructor(client) {
    this.client = client;
  }

  async getAll() {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client.schema('public').from('territory_ownership').select('*').order('territory_type').order('territory_name').abortSignal(AbortSignal.timeout(5000));
      if (error || !Array.isArray(data)) return [];
      return data.map(normalizeOwnershipRow).filter(Boolean);
    } catch {
      return [];
    }
  }

  async save(rows) {
    if (!this.client) throw new Error('Supabase nie jest skonfigurowany.');
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) throw new Error('Zaloguj się jako Owner lub Admin.');
    const payload = rows.map((row) => ({
      territory_type: row.territory_type,
      territory_name: row.territory_name,
      owner_clan: row.owner_clan.trim() || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await this.client.schema('public').from('territory_ownership').upsert(payload, { onConflict: 'territory_type,territory_name' });
    if (error) throw new Error(`Nie udało się zapisać właścicieli: ${error.message}`);
  }
}
