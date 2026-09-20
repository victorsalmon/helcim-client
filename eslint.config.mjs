// ESLint flat config for helcim-client (TypeScript sources and tests).
//
// Run via `npm run lint`. Base: @eslint/js recommended + typescript-eslint
// recommended, kept green on the tree as it stands.
//
// Tooling note: the repo builds with TypeScript 7 (`tsc` from the
// `@typescript/native` alias); typescript-eslint still needs the TypeScript 6
// programmatic API, so the `typescript` devDependency is aliased to
// `@typescript/typescript6` (the side-by-side setup documented in the
// TypeScript 7.0 release notes and already used by saas-modules and
// vopay-client).
//
// Deliberate deviation, with a reason:
//   - `@typescript-eslint/no-unused-vars` (configuration, not disabled):
//     underscore-prefixed args/vars/caught errors are intentional
//     (test doubles and API-shaped callbacks): `argsIgnorePattern` etc.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'stryker-report/**',
      'stryker-tmp/**',
      'coverage/**',
      '.worktrees/**',
      '.backup/**',
      '.quarantine/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      // Test doubles and mock payloads legitimately use `any`.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  }
);
