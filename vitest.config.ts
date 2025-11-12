import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['tests/testSetup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
});
