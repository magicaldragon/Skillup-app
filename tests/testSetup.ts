// Provide a minimal localStorage polyfill if not available (e.g., Node env)
(function ensureLocalStorage() {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();

    const localStoragePolyfill = {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
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
    };

    // Assign polyfill to global
    // ... existing code ...
    (globalThis as any).localStorage = localStoragePolyfill;
    // ... existing code ...
    console.info('[testSetup] localStorage polyfilled (Node environment detected)');
  } else {
    console.info('[testSetup] jsdom environment detected; localStorage is available');
  }
})();