// scripts/generateTestSetup.cjs
const fs = require("node:fs");
const path = require("node:path");

const outDir = path.join(process.cwd(), "tests", ".generated");
const outFile = path.join(outDir, "testSetup.ts");

const content = `
// Auto-generated test setup. Do not edit manually.
(function ensureLocalStorage() {
  try {
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
      (globalThis as any).localStorage = localStoragePolyfill;
      console.info('[testSetup] localStorage polyfilled (Node environment detected)');
    } else {
      console.info('[testSetup] jsdom environment detected; localStorage is available');
    }
  } catch (err) {
    console.warn('[testSetup] Failed to initialize localStorage polyfill:', (err && err.message) || err);
  }
})();
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, content, "utf8");
console.log("✅ Generated test setup at:", outFile);
