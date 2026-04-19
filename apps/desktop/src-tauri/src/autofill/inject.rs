//! Keystroke injection via `enigo`, with clipboard paste for text fields.
//!
//! Delay contract: the front-end dispatches `autofill_type_credentials`
//! from its own Tauri window (so that window briefly holds focus). We sleep
//! ~220 ms to let the user's original target window regain focus before we
//! start typing. Without this, the first characters land in the AkarPass
//! main window.
//!
//! Why clipboard paste instead of `enigo.text()`: char-by-char synthetic
//! typing races with browser autocomplete dropdowns (the dropdown swallows
//! TAB, so focus never advances to the password field and the password
//! ends up back in the username field). Pasting is instant and sidesteps
//! keyboard-layout quirks for characters like `@` on non-US layouts.

use std::thread;
use std::time::Duration;

use arboard::Clipboard;
use enigo::{Direction, Enigo, Key, Keyboard, Settings};

const FOCUS_YIELD_MS: u64 = 260;
const POST_FOCUS_MS: u64 = 80;
const POST_PASTE_MS: u64 = 80;
const POST_TAB_MS: u64 = 60;

pub fn type_credentials(
    username: &str,
    password: &str,
    press_enter: bool,
    target_hwnd: Option<i64>,
) -> Result<(), String> {
    eprintln!(
        "autofill: user_len={} pass_len={} enter={} hwnd={:?}",
        username.len(),
        password.len(),
        press_enter,
        target_hwnd,
    );

    if username.is_empty() {
        return Err(
            "Bu kaydın kullanıcı adı / e-posta alanı boş. Lütfen kaydı düzenleyip doldurun."
                .to_string(),
        );
    }
    if password.is_empty() {
        return Err("Bu kaydın şifre alanı boş.".to_string());
    }

    focus_target(target_hwnd)?;

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut clipboard = Clipboard::new().map_err(|e| format!("clipboard: {e}"))?;

    let saved = clipboard.get_text().ok();

    let result = (|| -> Result<(), String> {
        paste_via_clipboard(&mut clipboard, &mut enigo, username)?;
        thread::sleep(Duration::from_millis(POST_PASTE_MS));

        enigo
            .key(Key::Tab, Direction::Click)
            .map_err(|e| e.to_string())?;
        thread::sleep(Duration::from_millis(POST_TAB_MS));

        paste_via_clipboard(&mut clipboard, &mut enigo, password)?;

        if press_enter {
            thread::sleep(Duration::from_millis(POST_PASTE_MS));
            enigo
                .key(Key::Return, Direction::Click)
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    })();

    // Restore (or clear) clipboard so the password does not linger there.
    // Give the target app a moment to consume the paste first.
    thread::sleep(Duration::from_millis(POST_PASTE_MS));
    match saved {
        Some(prev) => {
            let _ = clipboard.set_text(prev);
        }
        None => {
            let _ = clipboard.clear();
        }
    }

    result
}

/// Put keyboard focus on the intended target before we start typing.
///
/// With a known HWND we skip the timing-based focus yield and explicitly
/// `SetForegroundWindow`. This is the authoritative path for the multi-match
/// picker flow — the AkarPass window has focus when the user clicks a match,
/// so relying on Windows to restore focus to the original browser is unsafe
/// (a password could land in the wrong window if the user Alt-Tabbed in the
/// meantime).
#[cfg(target_os = "windows")]
fn focus_target(target_hwnd: Option<i64>) -> Result<(), String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{IsWindow, SetForegroundWindow};

    let Some(hwnd_val) = target_hwnd else {
        thread::sleep(Duration::from_millis(FOCUS_YIELD_MS));
        return Ok(());
    };

    let hwnd = HWND(hwnd_val as isize as *mut _);
    unsafe {
        if !IsWindow(hwnd).as_bool() {
            return Err("Target window is no longer available.".to_string());
        }
        if !SetForegroundWindow(hwnd).as_bool() {
            return Err("Could not focus target window.".to_string());
        }
    }
    thread::sleep(Duration::from_millis(POST_FOCUS_MS));
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn focus_target(_target_hwnd: Option<i64>) -> Result<(), String> {
    thread::sleep(Duration::from_millis(FOCUS_YIELD_MS));
    Ok(())
}

fn paste_via_clipboard(
    clipboard: &mut Clipboard,
    enigo: &mut Enigo,
    text: &str,
) -> Result<(), String> {
    clipboard
        .set_text(text.to_string())
        .map_err(|e| format!("clipboard set: {e}"))?;
    // Let the OS register the new clipboard contents before pasting.
    thread::sleep(Duration::from_millis(30));

    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| e.to_string())?;
    Ok(())
}
