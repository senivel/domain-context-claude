// Source: https://eslint.org/docs/latest/use/configure/configuration-files
const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/',
      'templates/',
      'commands/',
      'agents/',
      'rules/',
      'docs/',
      '.planning/',
    ],
  },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
]);
