import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@mitron/ui': path.resolve(import.meta.dirname, '../../packages/ui/src')
    }
  },
  build: {
    assetsDir: 'system-assets'
  }
})
