import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mode = process.env.GAME;

// Discover available games by reading directories
const games = readdirSync(__dirname, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'node_modules')
  .map(dirent => dirent.name);

if (!mode || !games.includes(mode)) {
  throw new Error(`Please specify a valid game name: ${games.join(', ')}`);
}

export default defineConfig({
  root: resolve(__dirname, mode),
  build: {
    rollupOptions: {
      input: resolve(__dirname, mode, 'index.html')
    },
    outDir: resolve(__dirname, '../../../dist/www', mode),
    emptyOutDir: true
  },
  server: {
    open: true
  }
}); 