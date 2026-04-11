// AkarPass Tauri desktop backend.
//
// Security notes:
// - All cryptographic operations run in the JavaScript/WebView layer
//   using the Web Crypto API + WASM (ML-KEM).
// - The Rust layer provides: secure file storage, OS keychain integration,
//   and system tray functionality.
// - mlock() is called on the WebView process memory pages where possible
//   to prevent sensitive data from being swapped to disk.

// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    akarpass_desktop_lib::run();
}
