import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': hooks,
    },
    rules: {
      ...hooks.configs.recommended.rules,
    },
  },
  { ignores: ['dist'] },
);
