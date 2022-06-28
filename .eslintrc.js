module.exports = {
  extends: ['airbnb', 'airbnb-typescript', 'react-app'],
  env: {
    browser: true,
  },
  rules: {
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-const': ['error'],
    'object-curly-newline': ['error', {
      ImportDeclaration: {
        consistent: true,
        multiline: true,
        minProperties: 4,
      },
    }],
    'arrow-parens': [2, 'as-needed'],
    'react/jsx-props-no-spreading': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/require-default-props': 0,
    'react/prop-types': 0,
    'react/function-component-definition': [0],
    'import/prefer-default-export': 0,
    'react/jsx-no-bind': 0,
    'react/static-property-placement': [2, 'static public field'],
    'consistent-return': 0,
    'no-console': 0,
    'no-use-before-define': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'max-len': 'off',
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
