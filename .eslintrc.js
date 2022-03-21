module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  extends: ['airbnb'],
  env: {
    browser: true,
  },
  rules: {
    'arrow-parens': [2, 'as-needed'],
    'react/jsx-props-no-spreading': 0,
    'react/jsx-one-expression-per-line': 0,
    'import/prefer-default-export': 0,
    'react/jsx-no-bind': 0,
    'react/static-property-placement': [2, 'static public field'],
    'consistent-return': 0,
    'no-console': 0,
    'no-use-before-define': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'max-len': 'off',
    'operator-linebreak': 'off',
    'brace-style': 'off',
    'no-continue': 'off',
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        'babel.config.js',
        'webpack.config.js',
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
        'cypress/support/commands.js',
      ],
      rules: {
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
      plugins: ['jest'],
      env: {
        jest: true,
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
      files: ['src/components/cytoscape/cytoscape/**/*.js'],
      rules: {
        'no-underscore-dangle': 0,
      },
    },
  ],
};
