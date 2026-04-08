import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      output: {
        distPath: {
          root: './dist',
        },
      },
    },
  ],
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  output: {
    target: 'node',
  },
});
