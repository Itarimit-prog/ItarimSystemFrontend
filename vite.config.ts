import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  // Tauri ожидает относительные пути для production
  base: (typeof process !== 'undefined' && (process.env.TAURI_PLATFORM || process.env.TAURI_FAMILY)) ? './' : '/',
  server: {
    port: 5173
    // Proxy не нужен - используем Railway backend напрямую
  }
})
