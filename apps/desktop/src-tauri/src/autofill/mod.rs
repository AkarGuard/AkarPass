//! Native autofill for AkarPass.
//!
//! Flow on every global-shortcut trigger:
//!   1. `browser::read_target()` returns the URL + process name of the active window
//!   2. Rust emits `autofill:triggered` with that target
//!   3. React looks the URL up in the unlocked vault and (if a match exists)
//!      calls the `autofill_type_credentials` command
//!   4. `inject::type_credentials` fires the keystrokes into whichever window
//!      regains focus after the picker/front-end yields
//!
//! Phase 1 is Windows-only single-press; macOS and Linux live in sibling
//! modules behind `#[cfg(target_os = ...)]` and currently return `None`.

mod browser;
mod hotkey;
mod inject;

use serde::Serialize;
use tauri::{AppHandle, Runtime};

pub use hotkey::register_default_hotkey;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutofillTarget {
    pub url: Option<String>,
    pub app_name: String,
    pub window_title: String,
}

/// Read the active foreground window and report its URL / app identity so the
/// front-end can show which entry will be filled.
#[tauri::command]
pub fn autofill_get_target() -> Option<AutofillTarget> {
    browser::read_target()
}

/// Type `username + TAB + password` (+ optional ENTER) into whichever window
/// currently has keyboard focus. Runs on a background task so the command
/// returns fast and the foreground window regains focus while we wait.
#[tauri::command]
pub async fn autofill_type_credentials(
    username: String,
    password: String,
    press_enter: bool,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        inject::type_credentials(&username, &password, press_enter)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}

/// Called from the Tauri setup hook; installs the default Ctrl+Shift+L hotkey.
pub fn init<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    register_default_hotkey(app)
}
