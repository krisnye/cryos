import { defineConfig } from 'vite';
import { resolve } from 'path'
import { terser } from 'rollup-plugin-terser';
import vitePluginString from 'vite-plugin-string'

export default defineConfig({
    plugins: [
        vitePluginString({ compress: false })
    ],
    test: {
        browser: {
            enabled: true,
            name: 'chromium',
            provider: 'playwright',
            headless: true,
            screenshot: false,
            options: {
                args: ['--enable-unsafe-webgpu']
            }
        },
        environmentOptions: {
            browser: {
                enabled: true,
                name: 'chrome',
                provider: 'webdriverio',
                headless: true,
            },
        },
        include: ['src/**/*.test.ts'],
        exclude: ['lib/**/*'],
        update: false,
    },
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