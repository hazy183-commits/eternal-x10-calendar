// Storage boundary: can later be replaced by a Supabase implementation.
const STORAGE_KEY = 'eternal-x10-events-v1';

window.LocalEventRepository = class LocalEventRepository {
  constructor(seedEvents) {
    this.seedEvents = seedEvents;
    this.memoryEvents = null;
  }

  clone(events) { return events.map((event) => ({ ...event })); }

  read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // Some file-preview environments block localStorage. Keep the app usable.
      return this.memoryEvents;
    }
  }

  write(events) {
    const copy = this.clone(events);
    this.memoryEvents = copy;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(copy)); } catch { /* in-memory fallback */ }
    return this.clone(copy);
  }

  async getAll() {
    const stored = this.read();
    if (!stored || stored.length === 0) return this.write(this.seedEvents);
    this.memoryEvents = this.clone(stored);
    return this.clone(stored);
  }

  async save(event) {
    const all = await this.getAll();
    const index = all.findIndex((item) => item.id === event.id);
    if (index >= 0) all[index] = event; else all.push(event);
    return this.write(all);
  }

  async remove(id) { return this.write((await this.getAll()).filter((event) => event.id !== id)); }

  async restoreDemo() { return this.write(this.seedEvents); }
};
