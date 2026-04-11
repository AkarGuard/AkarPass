use tauri::Manager;

/// Chrome extension ID — derived deterministically from the RSA public key used
/// to sign the bundled extension.crx. If you rebuild the extension with a
/// different key, regenerate this ID and rebuild the desktop app.
const EXT_ID: &str = "okpoibgkhnbffhagpnhjnocckmofojaj";

/// Install the bundled AkarPass Chrome extension via Windows registry.
/// Chrome will auto-install the extension on its next launch.
#[tauri::command]
async fn install_chrome_extension(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::fs;

        // 1. Find the bundled CRX in the resource directory
        let res_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        let crx_src = res_dir.join("extension.crx");

        // 2. Copy CRX to a stable location in LocalAppData
        let local_app_data = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&local_app_data).map_err(|e| e.to_string())?;
        let crx_dest = local_app_data.join("extension.crx");
        fs::copy(&crx_src, &crx_dest).map_err(|e| {
            format!("CRX kopyalanamadı: {} → {}: {}", crx_src.display(), crx_dest.display(), e)
        })?;

        // 3. Write the Windows registry key that tells Chrome to install the extension
        use winreg::enums::{HKEY_CURRENT_USER, KEY_WRITE};
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let key_path = format!("SOFTWARE\\Google\\Chrome\\Extensions\\{}", EXT_ID);
        let (key, _) = hkcu
            .create_subkey_with_flags(&key_path, KEY_WRITE)
            .map_err(|e| format!("Registry yazılamadı: {}", e))?;
        let crx_path = crx_dest.to_string_lossy().into_owned();
        key.set_value("path", &crx_path).map_err(|e| e.to_string())?;
        key.set_value("version", &"0.1.0").map_err(|e| e.to_string())?;

        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        Err("Bu özellik sadece Windows'ta destekleniyor.".into())
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
        .invoke_handler(tauri::generate_handler![
            get_data_dir,
            write_vault,
            read_vault,
            list_vaults,
            install_chrome_extension,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
