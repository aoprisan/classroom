import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/classroom/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: process.env.VITE_API_URL ? undefined : {
      '/classroom/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
