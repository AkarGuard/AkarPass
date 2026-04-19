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

pub use hotkey::register_initial_hotkey;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutofillTarget {
    pub url: Option<String>,
    pub app_name: String,
    pub window_title: String,
    /// Raw HWND of the window that had foreground when the shortcut fired
    /// (Windows only; `None` on macOS/Linux stubs). Lets the inject command
    /// re-focus the target explicitly instead of gambling on Windows'
    /// focus-restoration heuristic — critical for the multi-match picker,
    /// where the user interacts with the AkarPass window before credentials
    /// are typed.
    pub hwnd: Option<i64>,
}

/// Read the active foreground window and report its URL / app identity so the
/// front-end can show which entry will be filled.
#[tauri::command]
pub fn autofill_get_target() -> Option<AutofillTarget> {
    browser::read_target()
}

/// Type `username + TAB + password` (+ optional ENTER) into the target window.
/// If `targetHwnd` is provided (Windows), the command explicitly focuses that
/// HWND before typing so credentials can't leak into a different window the
/// user Alt-Tabbed to while the picker was open. Without it we fall back to
/// the timing-based focus yield.
#[tauri::command]
pub async fn autofill_type_credentials(
    username: String,
    password: String,
    press_enter: bool,
    target_hwnd: Option<i64>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        inject::type_credentials(&username, &password, press_enter, target_hwnd)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}

/// Return the currently registered autofill shortcut as an accelerator string
/// (e.g., `"CommandOrControl+Shift+L"`).
#[tauri::command]
pub fn autofill_get_shortcut(app: AppHandle) -> String {
    hotkey::current_accel(&app)
}

/// Rebind the autofill shortcut and persist it. Returns an error if the
/// accelerator can't be parsed or if the OS rejects the registration.
#[tauri::command]
pub fn autofill_set_shortcut(app: AppHandle, accelerator: String) -> Result<(), String> {
    hotkey::rebind(&app, &accelerator)
}

/// Called from the Tauri setup hook; installs the persisted (or default) hotkey.
pub fn init<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    register_initial_hotkey(app)
}
