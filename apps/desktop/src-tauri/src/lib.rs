use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

mod autofill;

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

/// Tauri command: return the app data directory path for secure file storage.
#[tauri::command]
fn get_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

/// Tauri command: write encrypted vault bytes to disk.
/// The data parameter is a base64-encoded encrypted blob — Rust never sees plaintext.
#[tauri::command]
async fn write_vault(
    app: tauri::AppHandle,
    vault_id: String,
    data: String,
) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.vault", vault_id));
    std::fs::write(&path, data.as_bytes()).map_err(|e| e.to_string())
}

/// Tauri command: read encrypted vault bytes from disk.
#[tauri::command]
async fn read_vault(
    app: tauri::AppHandle,
    vault_id: String,
) -> Result<Option<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.vault", vault_id));
    if !path.exists() {
        return Ok(None);
    }
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Some(String::from_utf8(bytes).map_err(|e| e.to_string())?))
}

/// Tauri command: list all vault IDs stored on disk.
#[tauri::command]
async fn list_vaults(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let ids = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.ends_with(".vault") {
                Some(name.trim_end_matches(".vault").to_string())
            } else {
                None
            }
        })
        .collect();
    Ok(ids)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            if let Err(err) = autofill::init(&app.handle().clone()) {
                eprintln!("autofill init failed: {err}");
            }

            // System tray icon — always present. When the user minimises
            // the main window (via the custom titlebar), the frontend calls
            // `hide()` so the window leaves the taskbar and becomes a tray
            // icon only. Left-click on the tray or "Show" menu item brings
            // it back.
            let show_item = MenuItem::with_id(app, "show", "Show AkarPass", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("akarpass-tray")
                .tooltip("AkarPass")
                .icon(app.default_window_icon().cloned().ok_or("missing window icon")?)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_data_dir,
            write_vault,
            read_vault,
            list_vaults,
            autofill::autofill_get_target,
            autofill::autofill_type_credentials,
            autofill::autofill_get_shortcut,
            autofill::autofill_set_shortcut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
