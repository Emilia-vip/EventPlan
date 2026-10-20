import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Production: set VITE_CDN_URL=https://cdn.<domain>/ to serve JS/CSS from there.
  base: process.env.VITE_CDN_URL ?? '/',
  server: {
    // Local: /api -> backend (no CORS needed). In production VITE_API_URL is used.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
