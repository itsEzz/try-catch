import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	sourcemap: true,
	clean: true,
	esbuildOptions(options) {
		options.legalComments = 'inline';
	},
	outExtension({ format }) {
		return {
			js: format === 'cjs' ? '.js' : '.mjs',
		};
	},
});
