import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Применяем сохранённую тему СРАЗУ, до монтирования приложения —
// иначе страница всегда рендерится светлой до захода на "Настройки"
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Cmd+Shift+R — принудительная перезагрузка (обходит кэш WebView)
document.addEventListener('keydown', async (e) => {
  if (e.metaKey && e.shiftKey && e.key === 'R') {
    e.preventDefault()
    if ('__TAURI__' in window) {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('force_reload')
    } else {
      window.location.reload()
    }
  }
})

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered successfully:', registration.scope)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}
