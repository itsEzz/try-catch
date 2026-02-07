import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	sourcemap: true,
	outputOptions: { legalComments: 'inline' },
	target: false,
});
