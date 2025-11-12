import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  vi.mock('../services/vstorage', () => ({
    uploadFile: vi.fn(),
    getFileURL: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn().mockResolvedValue([]),
  }));
});
// Provide a minimal localStorage polyfill if not available (e.g., Node env)
(function ensureLocalStorage() {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();

    const localStoragePolyfill: Storage = {
      getItem(key: string) {
        return store.has(key) ? (store.get(key) ?? null) : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key(index: number) {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
      get length() {
        return store.size;
      },
    } as unknown as Storage;

    // Assign polyfill to global without using 'any'
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStoragePolyfill,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    console.info('[testSetup] localStorage polyfilled (Node environment detected)');
  } else {
    console.info('[testSetup] jsdom environment detected; localStorage is available');
  }
})();
