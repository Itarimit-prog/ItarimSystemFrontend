// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::WebviewWindow;

/// Принудительная перезагрузка WebView (обходит кэш)
#[tauri::command]
fn force_reload(window: WebviewWindow) {
    let _ = window.eval("window.location.href = window.location.pathname + '?t=' + Date.now()");
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![force_reload])
        .setup(|app| {
            // Очистка кэша WebView при каждом запуске
            if let Ok(cache_dir) = app.path().app_cache_dir() {
                if cache_dir.exists() {
                    let _ = std::fs::remove_dir_all(&cache_dir);
                }
            }
            // WKWebView хранит кэш в ~/Library/WebKit/<identifier>
            let home = std::env::var("HOME").unwrap_or_default();
            let webkit_cache = format!("{}/Library/WebKit/com.itarim.system", home);
            let caches_dir = format!("{}/Library/Caches/com.itarim.system", home);
            let _ = std::fs::remove_dir_all(&webkit_cache);
            let _ = std::fs::remove_dir_all(&caches_dir);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
