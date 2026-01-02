module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',  // Allow 'any' type
    '@typescript-eslint/no-non-null-assertion': 'off',  // Allow non-null assertions
    '@typescript-eslint/ban-types': 'off', // Disable banning of certain types
    '@typescript-eslint/no-empty-function': 'off', // Allow empty functions
    '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables
    '@typescript-eslint/no-namespace': 'error', // Prevent TypeScript namespace usage
  },
  ignorePatterns: ['.eslintrc.cjs', 'docs', 'dist', 'lib', 'node_modules', 'vite.config.ts'],
};
