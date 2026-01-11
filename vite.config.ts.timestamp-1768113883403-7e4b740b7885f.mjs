// vite.config.ts
import { defineConfig } from "file:///Users/krisnye/Projects/ecs/cryos/node_modules/.pnpm/vite@4.5.14_@types+node@22.18.8_terser@5.44.0/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import terser from "file:///Users/krisnye/Projects/ecs/cryos/node_modules/.pnpm/@rollup+plugin-terser@0.4.4_rollup@4.52.4/node_modules/@rollup/plugin-terser/dist/es/index.js";
import vitePluginString from "file:///Users/krisnye/Projects/ecs/cryos/node_modules/.pnpm/vite-plugin-string@1.2.3_rollup@4.52.4_vite@4.5.14_@types+node@22.18.8_terser@5.44.0_/node_modules/vite-plugin-string/dist/index.mjs";
import tsconfigPaths from "file:///Users/krisnye/Projects/ecs/cryos/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_typescript@5.9.3_vite@4.5.14_@types+node@22.18.8_terser@5.44.0_/node_modules/vite-tsconfig-paths/dist/index.js";
var __vite_injected_original_dirname = "/Users/krisnye/Projects/ecs/cryos";
var vite_config_default = defineConfig({
  base: "./",
  clearScreen: false,
  plugins: [
    tsconfigPaths(),
    vitePluginString({ compress: false })
  ],
  test: {
    tsconfig: "./tsconfig.base.json",
    api: {
      strictPort: false
    },
    browser: {
      api: {
        strictPort: false
      },
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      options: {
        args: ["--enable-unsafe-webgpu"]
      },
      screenshotFailures: false,
      screenshot: false
    },
    include: ["src/**/*.test.ts"],
    exclude: ["lib/**/*"],
    update: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/*.test.ts", "**/*.d.ts"]
    }
  },
  server: {
    port: 3e3,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  preview: {
    port: 3e3,
    strictPort: true
  },
  build: {
    target: "esnext",
    minify: true,
    sourcemap: true,
    emptyOutDir: true,
    reportCompressedSize: false,
    lib: {
      entry: resolve(__vite_injected_original_dirname, "./index.html"),
      formats: ["es"]
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
    include: ["@rollup/plugin-terser"],
    exclude: ["@webgpu/types"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva3Jpc255ZS9Qcm9qZWN0cy9lY3MvY3J5b3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9rcmlzbnllL1Byb2plY3RzL2Vjcy9jcnlvcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva3Jpc255ZS9Qcm9qZWN0cy9lY3MvY3J5b3Mvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB0ZXJzZXIgZnJvbSAnQHJvbGx1cC9wbHVnaW4tdGVyc2VyJztcbmltcG9ydCB2aXRlUGx1Z2luU3RyaW5nIGZyb20gJ3ZpdGUtcGx1Z2luLXN0cmluZyc7XG5pbXBvcnQgdHlwZSB7IFVzZXJDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIGJhc2U6ICcuLycsXG4gICAgY2xlYXJTY3JlZW46IGZhbHNlLFxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgdHNjb25maWdQYXRocygpLFxuICAgICAgICB2aXRlUGx1Z2luU3RyaW5nKHsgY29tcHJlc3M6IGZhbHNlIH0pXG4gICAgXSxcbiAgICB0ZXN0OiB7XG4gICAgICAgIHRzY29uZmlnOiAnLi90c2NvbmZpZy5iYXNlLmpzb24nLFxuICAgICAgICBhcGk6IHtcbiAgICAgICAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBicm93c2VyOiB7XG4gICAgICAgICAgICBhcGk6IHtcbiAgICAgICAgICAgICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgbmFtZTogJ2Nocm9taXVtJyxcbiAgICAgICAgICAgIHByb3ZpZGVyOiAncGxheXdyaWdodCcsXG4gICAgICAgICAgICBoZWFkbGVzczogdHJ1ZSxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBhcmdzOiBbJy0tZW5hYmxlLXVuc2FmZS13ZWJncHUnXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNjcmVlbnNob3RGYWlsdXJlczogZmFsc2UsXG4gICAgICAgICAgICBzY3JlZW5zaG90OiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnRlc3QudHMnXSxcbiAgICAgICAgZXhjbHVkZTogWydsaWIvKiovKiddLFxuICAgICAgICB1cGRhdGU6IGZhbHNlLFxuICAgICAgICBjb3ZlcmFnZToge1xuICAgICAgICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICAgICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgICAgICAgICAgZXhjbHVkZTogWycqKi8qLnRlc3QudHMnLCAnKiovKi5kLnRzJ11cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeSc6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgICAgICAnQ3Jvc3MtT3JpZ2luLUVtYmVkZGVyLVBvbGljeSc6ICdyZXF1aXJlLWNvcnAnXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIHN0cmljdFBvcnQ6IHRydWVcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJy4vaW5kZXguaHRtbCcpLFxuICAgICAgICAgICAgZm9ybWF0czogWydlcyddXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBsdWdpbnM6IFt0ZXJzZXIoe1xuICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50czogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1hbmdsZToge1xuICAgICAgICAgICAgICAgICAgICBrZWVwX2NsYXNzbmFtZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHJlc2VydmVkOiBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXSxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGNvbXBhY3Q6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICAgIGluY2x1ZGU6IFsnQHJvbGx1cC9wbHVnaW4tdGVyc2VyJ10sXG4gICAgICAgIGV4Y2x1ZGU6IFsnQHdlYmdwdS90eXBlcyddXG4gICAgfVxufSBhcyBVc2VyQ29uZmlnKTsgIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUixTQUFTLG9CQUFvQjtBQUNsVCxTQUFTLGVBQWU7QUFDeEIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sc0JBQXNCO0FBRTdCLE9BQU8sbUJBQW1CO0FBTDFCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLE1BQU07QUFBQSxFQUNOLGFBQWE7QUFBQSxFQUNiLFNBQVM7QUFBQSxJQUNMLGNBQWM7QUFBQSxJQUNkLGlCQUFpQixFQUFFLFVBQVUsTUFBTSxDQUFDO0FBQUEsRUFDeEM7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNGLFVBQVU7QUFBQSxJQUNWLEtBQUs7QUFBQSxNQUNELFlBQVk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ0wsS0FBSztBQUFBLFFBQ0QsWUFBWTtBQUFBLE1BQ2hCO0FBQUEsTUFDQSxTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixVQUFVO0FBQUEsTUFDVixTQUFTO0FBQUEsUUFDTCxNQUFNLENBQUMsd0JBQXdCO0FBQUEsTUFDbkM7QUFBQSxNQUNBLG9CQUFvQjtBQUFBLE1BQ3BCLFlBQVk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsU0FBUyxDQUFDLGtCQUFrQjtBQUFBLElBQzVCLFNBQVMsQ0FBQyxVQUFVO0FBQUEsSUFDcEIsUUFBUTtBQUFBLElBQ1IsVUFBVTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUyxDQUFDLGdCQUFnQixXQUFXO0FBQUEsSUFDekM7QUFBQSxFQUNKO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDSixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDTCw4QkFBOEI7QUFBQSxNQUM5QixnQ0FBZ0M7QUFBQSxJQUNwQztBQUFBLEVBQ0o7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2Isc0JBQXNCO0FBQUEsSUFDdEIsS0FBSztBQUFBLE1BQ0QsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUN4QyxTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2xCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDWCxTQUFTLENBQUMsT0FBTztBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ0osVUFBVTtBQUFBLFFBQ2Q7QUFBQSxRQUNBLFFBQVE7QUFBQSxVQUNKLGlCQUFpQjtBQUFBLFVBQ2pCLFVBQVUsQ0FBQztBQUFBLFFBQ2Y7QUFBQSxNQUNKLENBQUMsQ0FBQztBQUFBLE1BQ0YsUUFBUTtBQUFBLFFBQ0osU0FBUztBQUFBLE1BQ2I7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1YsU0FBUyxDQUFDLHVCQUF1QjtBQUFBLElBQ2pDLFNBQVMsQ0FBQyxlQUFlO0FBQUEsRUFDN0I7QUFDSixDQUFlOyIsCiAgIm5hbWVzIjogW10KfQo=
