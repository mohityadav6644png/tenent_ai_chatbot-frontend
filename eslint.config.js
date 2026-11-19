import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/features/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '**/auth/components/**',
            '**/auth/hooks/**',
            '**/auth/pages/**',
            '**/auth/services/**',
            '**/auth/mappers/**',
            '**/auth/constants/**',
            '**/auth/styles/**',
            '**/auth/AuthContext.jsx',
            '**/chat/components/**',
            '**/chat/hooks/**',
            '**/chat/pages/**',
            '**/chat/services/**',
            '**/chat/mappers/**',
            '**/chat/constants/**',
            '**/chat/styles/**',
            '**/company-admin/components/**',
            '**/company-admin/hooks/**',
            '**/company-admin/pages/**',
            '**/company-admin/services/**',
            '**/company-admin/mappers/**',
            '**/company-admin/constants/**',
            '**/company-admin/styles/**',
            '**/platform-admin/components/**',
            '**/platform-admin/hooks/**',
            '**/platform-admin/pages/**',
            '**/platform-admin/services/**',
            '**/platform-admin/mappers/**',
            '**/platform-admin/constants/**',
            '**/platform-admin/styles/**',
            '**/reports/components/**',
            '**/reports/hooks/**',
            '**/reports/pages/**',
            '**/reports/services/**',
            '**/reports/mappers/**',
            '**/reports/constants/**',
            '**/reports/styles/**',
          ],
          message: 'Import from the feature index.js barrel instead.',
        }],
      }],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
