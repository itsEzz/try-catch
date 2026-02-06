import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	sourcemap: true,
	outputOptions: { legalComments: 'inline' },
	outExtensions({ format }) {
		return {
			js: format === 'cjs' ? '.js' : '.mjs',
		};
	},
	target: false,
});
