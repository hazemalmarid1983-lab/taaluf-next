/**
 * محول تخزين localStorage مع fallback متوافق مع نمط تآلف.
 */

export type TrainingStorageAdapter = {
  isAvailable: () => boolean;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function createBrowserTrainingStorageAdapter(): TrainingStorageAdapter {
  return {
    isAvailable: () => {
      try {
        return typeof localStorage !== 'undefined';
      } catch {
        return false;
      }
    },
    getItem: (key: string) => {
      try {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(key, value);
      } catch {
        /* تجاوز الحصة أو وضع التصفح الخاص */
      }
    },
    removeItem: (key: string) => {
      try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

let activeAdapter: TrainingStorageAdapter = createBrowserTrainingStorageAdapter();

export function getTrainingStorageAdapter(): TrainingStorageAdapter {
  return activeAdapter;
}

/** للاختبارات — حقن محول ذاكرة أو mock */
export function setTrainingStorageAdapter(adapter: TrainingStorageAdapter) {
  activeAdapter = adapter;
}

export function resetTrainingStorageAdapter() {
  activeAdapter = createBrowserTrainingStorageAdapter();
}

export function createMemoryTrainingStorageAdapter(
  initial?: Record<string, string>
): TrainingStorageAdapter {
  const memory = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

export function readJsonArray<T>(
  adapter: TrainingStorageAdapter,
  key: string,
  sanitize: (item: unknown) => T | null
): T[] {
  if (!adapter.isAvailable()) return [];

  const raw = adapter.getItem(key);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitize(item))
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

export function writeJsonArray<T>(
  adapter: TrainingStorageAdapter,
  key: string,
  items: T[],
  maxItems: number
) {
  if (!adapter.isAvailable()) return;
  adapter.setItem(key, JSON.stringify(items.slice(0, maxItems)));
}
