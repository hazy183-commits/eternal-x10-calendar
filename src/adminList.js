export const ADMIN_FILTERS = Object.freeze(['Wszystkie', 'RB', 'Epic RB', 'Clan Hall', 'Siege', 'Olympiad', 'Event']);
export const ADMIN_SORTS = Object.freeze([
  Object.freeze({ value: 'nearest', label: 'Najbliższe najpierw' }),
  Object.freeze({ value: 'farthest', label: 'Najdalsze najpierw' }),
]);

function eventTimestamp(event) {
  return new Date(`${event.date}T${event.time}:00`).getTime();
}

export function filterAndSortAdminEvents(events, { type = 'Wszystkie', sort = 'nearest', query = '' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = events.filter((event) => {
    const typeMatches = type === 'Wszystkie' || event.type === type;
    const searchText = `${event.name ?? ''} ${event.boss ?? ''}`.toLocaleLowerCase();
    return typeMatches && (!normalizedQuery || searchText.includes(normalizedQuery));
  });
  return filtered.sort((left, right) => {
    const difference = eventTimestamp(left) - eventTimestamp(right);
    if (difference !== 0) return sort === 'farthest' ? -difference : difference;
    return String(left.id).localeCompare(String(right.id));
  });
}

