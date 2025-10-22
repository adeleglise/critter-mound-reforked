import { defineConfig } from 'vite'
import { resolve } from 'path'

// Use repository name for GitHub Pages base path
const base = process.env.GITHUB_PAGES === 'true'
  ? '/critter-mound-reforked/'
  : '/'

export default defineConfig({
  base,
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@styles': resolve(__dirname, './src/styles'),
      '@scripts': resolve(__dirname, './src/scripts'),
      '@assets': resolve(__dirname, './src/assets')
    }
  }
})
