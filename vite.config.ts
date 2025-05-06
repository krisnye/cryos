import { defineConfig } from 'vite';
import { resolve } from 'path';
import terser from '@rollup/plugin-terser';
import vitePluginString from 'vite-plugin-string';
import type { UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    base: './',
    plugins: [
        tsconfigPaths(),
        vitePluginString({ compress: false })
    ],
    test: {
        browser: {
            enabled: true,
            name: 'chromium',
            provider: 'playwright',
            headless: true,
            options: {
                args: ['--enable-unsafe-webgpu']
            },
            screenshot: false
        },
        include: ['src/**/*.test.ts'],
        exclude: ['lib/**/*'],
        update: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['**/*.test.ts', '**/*.d.ts']
        }
    },
    server: {
        port: 3000,
        strictPort: true
    },
    preview: {
        port: 3000,
        strictPort: true
    },
    build: {
        target: 'esnext',
        minify: true,
        sourcemap: true,
        emptyOutDir: true,
        reportCompressedSize: false,
        lib: {
            entry: resolve(__dirname, './index.html'),
            formats: ['es']
        },
        rollupOptions: {
            plugins: [terser({
                format: {
                    comments: false
                },
                mangle: {
                    keep_classnames: true,
                    reserved: []
                }
            })],
            output: {
                compact: true
            }
        }
    },
    optimizeDeps: {
        include: ['@rollup/plugin-terser'],
        exclude: ['@webgpu/types']
    }
} as UserConfig); 