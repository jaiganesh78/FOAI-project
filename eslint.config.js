const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './apps/backend/src/modules/citizen',
              from: './apps/backend/src/modules/admin',
              message: 'Illegal cross-module import: Citizen module cannot import directly from Admin module',
            },
            {
              target: './apps/backend/src/modules/policy',
              from: './apps/backend/src/modules/eligibility',
              message: 'Illegal cross-module import: Policy module cannot depend on Eligibility internal modules directly',
            },
          ],
        },
      ],
    },
  },
];
