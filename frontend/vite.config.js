import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Local dev: './'  |  GitHub Pages production: '/Roam_Eats/'
  base: process.env.VITE_BASE_PATH || './',
  server: {
    port: 5173,
  }
})
