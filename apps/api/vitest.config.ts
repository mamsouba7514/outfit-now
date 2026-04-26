import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://outfit:outfit@localhost:5432/outfit_now',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-key-at-least-32-chars!!',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_BUCKET: 'outfit-now',
      S3_ACCESS_KEY: 'minioadmin',
      S3_SECRET_KEY: 'minioadmin',
      S3_REGION: 'eu-west-3',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 70, functions: 70, branches: 60 },
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/server.ts'],
    },
  },
});
