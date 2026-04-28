module.exports = {
  root: true,
  extends: ['./packages/config/eslint-base.js'],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['node_modules', 'dist', 'build', '.expo', 'coverage', '*.config.js', 'prisma/seed.ts'],
  overrides: [
    {
      // Fastify routes: async route handlers don't always have explicit await
      files: ['apps/api/src/routes/**/*.ts', 'apps/api/src/workers/**/*.ts'],
      rules: {
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
      },
    },
    {
      // React Native: async event handlers (onPress etc.) are valid patterns
      files: ['apps/mobile/**/*.tsx', 'apps/mobile/**/*.ts'],
      rules: {
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      },
    },
    {
      // Next.js dashboard: async event handlers + @/ path alias
      files: ['apps/dashboard/**/*.tsx', 'apps/dashboard/**/*.ts'],
      settings: {
        'import/resolver': {
          typescript: { project: 'apps/dashboard/tsconfig.json' },
        },
      },
      rules: {
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
        '@typescript-eslint/require-await': 'off',
      },
    },
    {
      // Next.js web: async event handlers + @/ path alias
      files: ['apps/web/**/*.tsx', 'apps/web/**/*.ts'],
      settings: {
        'import/resolver': {
          typescript: { project: 'apps/web/tsconfig.json' },
        },
      },
      rules: {
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
};
