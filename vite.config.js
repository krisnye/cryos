
import { defineConfig } from 'vite';
import { resolve } from 'path'
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
    plugins: [],
    build: {
        minify: true,
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            formats: ['es']
        },
        rollupOptions: {
            plugins: [terser({
                format: {
                    comments: false,
                    ecma: 2023
                },
                mangle: {
                    keep_classnames: true,
                    reserved: [],
                },
                compress: {
                }
            })],
            output: {
                compact: true
            }
        }
    }
})