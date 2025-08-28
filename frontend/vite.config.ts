import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Clear screen when starting dev server
  clearScreen: false,
  
  // Dev server configuration
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    // Proxy API calls to the Python backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  },
  
  // Build configuration for Tauri
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@themes': path.resolve(__dirname, 'src/themes'),
      '@types': path.resolve(__dirname, 'src/types'),
    }
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'TAURI_'],
})