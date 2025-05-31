import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [
    'next',
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'warn',
    'react/react-in-jsx-scope': 'off'
  },
});
