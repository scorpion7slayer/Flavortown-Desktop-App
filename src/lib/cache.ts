/* EN: API cache with memory first, localStorage fallback, and a five-minute TTL. | FR: Cache API avec priorité à la mémoire, repli sur localStorage et TTL de cinq minutes. */

const TTL_MS = 5 * 60 * 1000;
const LS_PREFIX = "ft_cache:";

interface Entry<T> {
  data: T;
  ts: number;
}

const mem = new Map<string, Entry<unknown>>();

function read<T>(key: string): T | null {
  /* EN: Check the in-memory cache first. | FR: Vérifie d'abord le cache en mémoire. */
  const m = mem.get(key);
  if (m && Date.now() - m.ts < TTL_MS) return m.data as T;

  /* EN: Fall back to localStorage when needed. | FR: Utilise localStorage en repli si nécessaire. */
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.ts < TTL_MS) {
      mem.set(key, entry);
      return entry.data;
    }
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* EN: Ignore localStorage access failures or parse errors. | FR: Ignore les échecs d'accès à localStorage ou les erreurs de parsing. */
  }

  return null;
}

function write<T>(key: string, data: T): void {
  const entry: Entry<T> = { data, ts: Date.now() };
  mem.set(key, entry);
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* EN: Ignore quota or availability issues and keep memory-only caching. | FR: Ignore les problèmes de quota ou de disponibilité et conserve le cache en mémoire uniquement. */
  }
}

function invalidate(prefix: string): void {
  /* EN: Remove matching entries from memory. | FR: Supprime les entrées correspondantes de la mémoire. */
  for (const k of [...mem.keys()]) {
    if (k.startsWith(prefix)) mem.delete(k);
  }

  /* EN: Remove matching entries from localStorage. | FR: Supprime les entrées correspondantes de localStorage. */
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX + prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* EN: Ignore localStorage cleanup errors. | FR: Ignore les erreurs de nettoyage de localStorage. */
  }
}

/** EN: Invalidate all cached data associated with an API key. | FR: Invalide toutes les données en cache associées à une clé API. */
export function invalidateUser(apiKey: string): void {
  invalidate(`me:${apiKey}`);
  invalidate(`project:${apiKey}:`);
  invalidate(`devlogs:${apiKey}:`);
}

export const apiCache = { read, write, invalidate };
