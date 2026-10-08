import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'packages/*/test/**/*.test.js',
      'server/test/**/*.test.js',
      'client/src/**/*.test.js'
    ],
    testTimeout: 30000
  }
});
