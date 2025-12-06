import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  esbuild: {
    drop: ['console', 'debugger'] // 🚀 Премахва всички console.* и debugger в production
  }
})