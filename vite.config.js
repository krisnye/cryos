
import { defineConfig } from 'vite';
import { resolve } from 'path'
import { terser } from 'rollup-plugin-terser';
import vitePluginString from 'vite-plugin-string'

export default defineConfig({
    plugins: [
        vitePluginString({ compress: false })
    ],
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