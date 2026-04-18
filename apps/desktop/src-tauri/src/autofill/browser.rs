//! Platform-abstracted reader: returns the foreground window's URL (when it
//! belongs to a browser) and app identity.
//!
//! Every platform impl must return a `Target` with at least `app_name` and
//! `window_title` populated; `url` is best-effort.

use super::AutofillTarget;

#[cfg(target_os = "windows")]
mod browser_windows;

#[cfg(target_os = "macos")]
mod browser_macos;

#[cfg(target_os = "linux")]
mod browser_linux;

pub fn read_target() -> Option<AutofillTarget> {
    #[cfg(target_os = "windows")]
    {
        return browser_windows::read_target();
    }
    #[cfg(target_os = "macos")]
    {
        return browser_macos::read_target();
    }
    #[cfg(target_os = "linux")]
    {
        return browser_linux::read_target();
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        None
    }
}
