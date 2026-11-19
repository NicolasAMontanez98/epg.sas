import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API_URL permite probar el frontend local contra la API publicada (p. ej. la de Vercel) sin correr el backend.
const api = process.env.API_URL || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: api, changeOrigin: true } } },
})
