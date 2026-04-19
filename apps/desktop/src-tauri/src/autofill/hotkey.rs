//! Global shortcut registration with dynamic rebinding.
//!
//! The currently registered shortcut is tracked in `HotkeyState` (Tauri-managed
//! state) so we can unregister before installing a replacement. The chosen
//! accelerator is persisted to `<app_data_dir>/settings.json` so it survives
//! app restarts.

use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use super::browser;

pub const DEFAULT_ACCEL: &str = "CommandOrControl+Shift+L";
const SETTINGS_FILE: &str = "settings.json";
const SETTINGS_KEY: &str = "autofillShortcut";

/// Tauri-managed state holding the currently registered shortcut + its
/// accelerator string (keeping them in sync lets the frontend query the
/// current binding without re-parsing).
pub struct HotkeyState {
    current: Mutex<Option<Shortcut>>,
    accel: Mutex<String>,
}

impl HotkeyState {
    pub fn new() -> Self {
        Self {
            current: Mutex::new(None),
            accel: Mutex::new(DEFAULT_ACCEL.to_string()),
        }
    }
}

fn settings_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

fn load_stored_accel<R: Runtime>(app: &AppHandle<R>) -> String {
    let Ok(path) = settings_path(app) else { return DEFAULT_ACCEL.to_string() };
    let Ok(bytes) = std::fs::read(&path) else { return DEFAULT_ACCEL.to_string() };
    let Ok(json) = serde_json::from_slice::<serde_json::Value>(&bytes) else {
        return DEFAULT_ACCEL.to_string();
    };
    json.get(SETTINGS_KEY)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| DEFAULT_ACCEL.to_string())
}

fn save_stored_accel<R: Runtime>(app: &AppHandle<R>, accel: &str) -> Result<(), String> {
    let path = settings_path(app)?;
    let mut json = std::fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice::<serde_json::Value>(&b).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    json[SETTINGS_KEY] = serde_json::Value::String(accel.to_string());
    let bytes = serde_json::to_vec_pretty(&json).map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())
}

fn install<R: Runtime>(app: &AppHandle<R>, accel: &str) -> Result<(), String> {
    let shortcut: Shortcut = accel.parse().map_err(|e| format!("invalid shortcut: {e}"))?;
    let state = app.state::<HotkeyState>();
    let gs = app.global_shortcut();

    // Unregister previous binding before installing the new one (re-registering
    // an already-registered shortcut id returns AlreadyRegistered).
    if let Some(prev) = state.current.lock().unwrap().take() {
        let _ = gs.unregister(prev);
    }

    let app_for_handler = app.clone();
    gs.on_shortcut(shortcut, move |_app, _sc, event| {
        if event.state() == ShortcutState::Pressed {
            let target = browser::read_target();
            let _ = app_for_handler.emit("autofill:triggered", target);
        }
    })
    .map_err(|e| format!("register shortcut: {e}"))?;

    *state.current.lock().unwrap() = Some(shortcut);
    *state.accel.lock().unwrap() = accel.to_string();
    Ok(())
}

/// Manages `HotkeyState` and installs the stored (or default) shortcut. Called
/// once from the Tauri setup hook.
pub fn register_initial_hotkey<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    app.manage(HotkeyState::new());
    let stored = load_stored_accel(app);
    if let Err(err) = install(app, &stored) {
        eprintln!("stored shortcut '{stored}' invalid ({err}); falling back to default");
        install(app, DEFAULT_ACCEL)?;
    }
    Ok(())
}

pub fn current_accel<R: Runtime>(app: &AppHandle<R>) -> String {
    app.state::<HotkeyState>().accel.lock().unwrap().clone()
}

pub fn rebind<R: Runtime>(app: &AppHandle<R>, accel: &str) -> Result<(), String> {
    install(app, accel)?;
    save_stored_accel(app, accel)?;
    Ok(())
}
