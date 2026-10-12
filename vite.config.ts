import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  // Tauri ожидает относительные пути для production
  base: (typeof process !== 'undefined' && (process.env.TAURI_PLATFORM || process.env.TAURI_FAMILY)) ? './' : '/',
  server: {
    port: 5173
  }
})
