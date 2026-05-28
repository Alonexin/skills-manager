import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileApiPlugin } from './vite-plugin-file-api'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    fileApiPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'es2020'
  },
  optimizeDeps: {
    exclude: ['@tauri-apps/api']
  }
})
