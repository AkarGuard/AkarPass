//! Global shortcut registration. Phase 1 hard-codes `Ctrl+Shift+L`; Phase 3
//! will read the binding from `tauri-plugin-store`.

use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use super::browser;

const DEFAULT_ACCEL: &str = "CommandOrControl+Shift+L";

pub fn register_default_hotkey<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let shortcut: Shortcut = DEFAULT_ACCEL.parse().map_err(|e| format!("invalid shortcut: {e}"))?;

    let app_for_handler = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _sc, event| {
            if event.state() == ShortcutState::Pressed {
                let target = browser::read_target();
                let _ = app_for_handler.emit("autofill:triggered", target);
            }
        })
        .map_err(|e| format!("register shortcut: {e}"))?;

    Ok(())
}
