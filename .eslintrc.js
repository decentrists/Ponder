module.exports = {
  extends: ['airbnb-typescript', 'react-app'],
  env: {
    browser: true,
  },
  rules: {
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'object-curly-newline': ['error', {
      ImportDeclaration: {
        consistent: true,
        multiline: true,
        minProperties: 4,
      },
    }],
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    createDefaultProgram: true,
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        'jest.config.js',
        'seeders/**/*.js',
        'cypress/plugins/**/*',
        '**/__mocks__/**/*.js',
        '**/__tests__/**/*.js',
      ],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        strict: [2, 'global'],
        'import/no-extraneous-dependencies': [2, { devDependencies: true }],
      },
    },
    {
      files: [
        '**/*.test.js',
        './tests/**/*',
        '**/__mocks__/**/*.js',
        'jest.setup.js',
      ],
      extends: ['react-app/jest'],
      env: {
        jest: true,
      },
    },
    {
      files: [
        'cypress/support/commands.js',
      ],
      rules: {
        'import/no-extraneous-dependencies': [2, { devDependencies: true }],
      },
    },
    {
      files: ['cypress/**/*'],
      plugins: ['cypress'],
      env: {
        'cypress/globals': true,
      },
    },
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        'max-len': ['error', {
          code: 100,
        }],
      },
    },
  ],
};
