// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;
use tauri::WebviewWindow;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

/// Локальный API-ключ для sidecar-бэкенда — тот же, что и VITE_API_KEY во
/// фронтенде (frontend/.env), совпадение проверяется бэкендом на каждый запрос.
/// Это не секрет в привычном смысле: бэкенд слушает только 127.0.0.1 и не
/// торчит в сеть, ключ — просто защита от случайных обращений с той же машины.
const SIDECAR_API_KEY: &str = "wTuwr_26oJsfMIB1BReNxSoYlO91E3OsfIBNsfaW3qI";
const SIDECAR_PORT: u16 = 8420;

struct SidecarState(Mutex<Option<CommandChild>>);

/// Принудительная перезагрузка WebView (обходит кэш)
#[tauri::command]
fn force_reload(window: WebviewWindow) {
    let _ = window.eval("window.location.href = window.location.pathname + '?t=' + Date.now()");
}

/// Ждём не просто открытый TCP-порт (он появляется раньше, чем FastAPI
/// реально готов отвечать), а успешный ответ от /health — иначе фронтенд
/// может выстрелить первые запросы раньше, чем бэкенд поднялся, и получить
/// пустые данные без повторной попытки.
fn wait_for_sidecar_ready() {
    let url = format!("http://127.0.0.1:{}/health", SIDECAR_PORT);
    for _ in 0..100 {
        if let Ok(resp) = ureq::get(&url).timeout(Duration::from_millis(500)).call() {
            if resp.status() == 200 {
                return;
            }
        }
        std::thread::sleep(Duration::from_millis(150));
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![force_reload])
        .setup(|app| {
            // Папку ~/Library/WebKit/<identifier> не трогаем: там лежит localStorage
            // (тема, режим планера). Статика зашита в сборку, чистить кэш незачем.

            // Если от прошлого запуска остался «осиротевший» бэкенд (например, после Cmd+Q),
            // он держит порт со старым кодом — завершаем его до старта нового
            #[cfg(unix)]
            {
                let _ = std::process::Command::new("pkill").args(["-f", "itarim-backend"]).status();
                std::thread::sleep(Duration::from_millis(400));
            }

            // Локальная БД живёт в app data dir — переживает обновления приложения
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("не удалось определить app data dir");
            std::fs::create_dir_all(&data_dir).expect("не удалось создать app data dir");
            let db_path = data_dir.join("life_os.db");
            let database_url = format!("sqlite:///{}", db_path.to_string_lossy());

            let (_rx, child) = app
                .shell()
                .sidecar("itarim-backend")
                .expect("не удалось найти sidecar-бинарь itarim-backend")
                .env("DATABASE_URL", database_url)
                .env("API_KEY", SIDECAR_API_KEY)
                .env("PORT", SIDECAR_PORT.to_string())
                .spawn()
                .expect("не удалось запустить sidecar-бэкенд");

            *app.state::<SidecarState>().0.lock().unwrap() = Some(child);

            wait_for_sidecar_ready();

            Ok(())
        })
        .on_window_event(|window, event| {
            // Останавливаем sidecar-процесс при закрытии окна, иначе он
            // продолжит висеть в фоне после выхода из приложения
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(child) = window
                    .app_handle()
                    .state::<SidecarState>()
                    .0
                    .lock()
                    .unwrap()
                    .take()
                {
                    let _ = child.kill();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // Cmd+Q и другие способы выйти без закрытия окна тоже должны гасить бэкенд
            if let tauri::RunEvent::Exit = event {
                if let Some(child) = app_handle.state::<SidecarState>().0.lock().unwrap().take() {
                    let _ = child.kill();
                }
            }
        });
}
