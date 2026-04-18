//! Keystroke injection via `enigo`.
//!
//! Delay contract: the front-end dispatches `autofill_type_credentials`
//! from its own Tauri window (so that window briefly holds focus). We sleep
//! ~200 ms to let the user's original target window regain focus before we
//! start typing. Without this, the first characters land in the AkarPass
//! main window.

use std::thread;
use std::time::Duration;

use enigo::{Direction, Enigo, Key, Keyboard, Settings};

const FOCUS_YIELD_MS: u64 = 220;
const INTER_KEY_MS: u64 = 25;

pub fn type_credentials(username: &str, password: &str, press_enter: bool) -> Result<(), String> {
    thread::sleep(Duration::from_millis(FOCUS_YIELD_MS));

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    if !username.is_empty() {
        enigo.text(username).map_err(|e| e.to_string())?;
        thread::sleep(Duration::from_millis(INTER_KEY_MS));
        enigo
            .key(Key::Tab, Direction::Click)
            .map_err(|e| e.to_string())?;
        thread::sleep(Duration::from_millis(INTER_KEY_MS));
    }

    if !password.is_empty() {
        enigo.text(password).map_err(|e| e.to_string())?;
    }

    if press_enter {
        thread::sleep(Duration::from_millis(INTER_KEY_MS));
        enigo
            .key(Key::Return, Direction::Click)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
