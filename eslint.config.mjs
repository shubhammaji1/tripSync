import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.next-dev/**', '**/coverage/**', '**/public/**', '**/next-env.d.ts'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
    rules: { 'no-unreachable': 'error', 'valid-typeof': 'error', 'no-unsafe-optional-chaining': 'error', 'no-constant-binary-expression': 'error', 'no-debugger': 'error' },
  },
];
