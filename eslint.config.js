const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'prototipo/*', 'node_modules/*'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/features/**/viewmodel/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-sqlite',
              message: 'Usa useRepositories() de shared/services/data en los ViewModels.',
            },
          ],
        },
      ],
    },
  },
]);
