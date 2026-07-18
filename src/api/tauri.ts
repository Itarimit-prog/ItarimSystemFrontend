import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'

/**
 * Tauri API utilities
 * Эти функции работают только внутри Tauri приложения
 */

export const tauriApi = {
  /**
   * Открыть внешнюю ссылку в браузере
   */
  openLink: async (url: string) => {
    try {
      await open(url)
    } catch (error) {
      console.error('Failed to open link:', error)
      window.open(url, '_blank')
    }
  },

  /**
   * Вызвать Rust команду
   */
  invokeCommand: async <T>(command: string, args?: Record<string, any>): Promise<T> => {
    return await invoke<T>(command, args)
  },

  /**
   * Проверить, запущено ли приложение в Tauri
   */
  isTauri: () => {
    return typeof window !== 'undefined' && '__TAURI__' in window
  }
}

/**
 * Hook для определения платформы
 */
export const usePlatform = () => {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  
  // В Tauri v2 os.platform() требует @tauri-apps/plugin-os
  // Пока возвращаем 'desktop' для Tauri и 'web' для браузера
  return {
    isTauri,
    platform: isTauri ? 'desktop' : 'web',
    isDesktop: isTauri,
    isMobile: false, // Tauri iOS пока в beta
    isWeb: !isTauri
  }
}
