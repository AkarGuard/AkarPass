//! Windows autofill target reader.
//!
//! The global-shortcut callback runs on a thread whose COM apartment is
//! already set (to MTA) by Tauri's runtime, and UIAutomation's own init path
//! tries to set it again — we see `RPC_E_CHANGED_MODE` ("İş parçacığı modu
//! kurulduktan sonra değiştirilemez"). To side-step that we do all UIA work
//! on a freshly spawned thread where we own the apartment choice. Basic
//! window identity (title, process name) stays on the hotkey thread via
//! plain Win32 so it can't fail.

use std::path::PathBuf;
use std::thread;
use std::time::Duration;

use uiautomation::controls::ControlType;
use uiautomation::patterns::UIValuePattern;
use uiautomation::types::Handle;
use uiautomation::{UIAutomation, UIElement};
use windows::core::PWSTR;
use windows::Win32::Foundation::{BOOL, CloseHandle, HWND, LPARAM, WPARAM};
use windows::Win32::System::Com::{CoInitializeEx, COINIT_MULTITHREADED};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumChildWindows, GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW,
    GetWindowThreadProcessId, SendMessageTimeoutW, SMTO_ABORTIFHUNG, WM_GETOBJECT,
};

/// UIA_ROOT_OBJECT_ID — the magic lparam value Chromium checks for in its
/// WM_GETOBJECT handler to switch the renderer into full UIA mode. Before this
/// message arrives, Chrome exposes only the top-level Window element and no
/// descendants, which is why our omnibox scan returns empty.
const UIA_ROOT_OBJECT_ID: isize = -25;
/// OBJID_CLIENT — the MSAA counterpart. Some Chromium subframes (and older
/// builds) hook this instead of the UIA id, so we fire both to be safe.
const OBJID_CLIENT: isize = -4;

use crate::autofill::AutofillTarget;

pub fn read_target() -> Option<AutofillTarget> {
    let hwnd = unsafe { GetForegroundWindow() };
    let hwnd_usable = !hwnd.0.is_null();
    eprintln!("[autofill] read_target hwnd={:?} usable={}", hwnd.0, hwnd_usable);

    let window_title = if hwnd_usable {
        window_text(hwnd)
    } else {
        String::new()
    };
    let app_name = if hwnd_usable {
        process_name_for_hwnd(hwnd).unwrap_or_default()
    } else {
        String::new()
    };
    let url = if hwnd_usable { read_url_uia(hwnd) } else { None };

    eprintln!(
        "[autofill] result url={:?} app={:?} title={:?}",
        url, app_name, window_title
    );

    let hwnd_i64 = if hwnd_usable {
        Some(hwnd.0 as isize as i64)
    } else {
        None
    };

    Some(AutofillTarget {
        url,
        app_name,
        window_title,
        hwnd: hwnd_i64,
    })
}

fn window_text(hwnd: HWND) -> String {
    let len = unsafe { GetWindowTextLengthW(hwnd) };
    if len <= 0 {
        return String::new();
    }
    let mut buf = vec![0u16; (len + 1) as usize];
    let copied = unsafe { GetWindowTextW(hwnd, &mut buf) };
    if copied <= 0 {
        return String::new();
    }
    String::from_utf16_lossy(&buf[..copied as usize])
}

fn process_name_for_hwnd(hwnd: HWND) -> Option<String> {
    let mut pid: u32 = 0;
    let tid = unsafe { GetWindowThreadProcessId(hwnd, Some(&mut pid)) };
    if tid == 0 || pid == 0 {
        return None;
    }
    let handle = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) }.ok()?;
    let mut buf = vec![0u16; 1024];
    let mut size = buf.len() as u32;
    let ok = unsafe {
        QueryFullProcessImageNameW(handle, PROCESS_NAME_FORMAT(0), PWSTR(buf.as_mut_ptr()), &mut size)
    };
    unsafe {
        let _ = CloseHandle(handle);
    }
    if ok.is_err() || size == 0 {
        return None;
    }
    let full = String::from_utf16_lossy(&buf[..size as usize]);
    PathBuf::from(&full)
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
}

/// Best-effort URL extraction. Anchors on the foreground HWND so the omnibox
/// and web content are siblings under the same root. Chromium-based browsers
/// only realise the full UIA tree once a client has asked for it, so if the
/// first pass comes back empty we poke WM_GETOBJECT and retry.
///
/// All UIA work happens on a spawned worker thread — Tauri's runtime has
/// already chosen an apartment on the hotkey thread and UIAutomation's own
/// init then fights with it. HWND isn't `Send`, so we shuttle it as `isize`.
fn read_url_uia(hwnd: HWND) -> Option<String> {
    let hwnd_val = hwnd.0 as isize;
    thread::spawn(move || -> Option<String> {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        }
        let automation = match UIAutomation::new() {
            Ok(a) => a,
            Err(e) => {
                eprintln!("[autofill] UIAutomation::new failed on worker: {e:?}");
                return None;
            }
        };
        let hwnd = HWND(hwnd_val as *mut _);
        eprintln!("[autofill] scan pass 1");
        if let Some(url) = scan_for_url(&automation, hwnd) {
            return Some(url);
        }
        eprintln!("[autofill] activating accessibility tree");
        activate_uia_tree(hwnd);
        eprintln!("[autofill] scan pass 2");
        scan_for_url(&automation, hwnd)
    })
    .join()
    .ok()
    .flatten()
}

fn scan_for_url(automation: &UIAutomation, hwnd: HWND) -> Option<String> {
    let handle = Handle::from(hwnd.0 as isize);
    let window = automation.element_from_handle(handle).ok()?;
    find_url_in(automation, &window)
}

/// Trigger Chromium's lazy accessibility init. Chrome hooks WM_GETOBJECT on
/// its inner `Chrome_RenderWidgetHostHWND` child rather than the top-level
/// frame, so we fan the message out to every descendant window. Firing both
/// UIA_ROOT_OBJECT_ID and OBJID_CLIENT covers UIA and MSAA clients. The
/// 250ms sleep gives Chrome/Edge time to finish wiring up AXPlatformNode
/// providers before we re-scan.
fn activate_uia_tree(hwnd: HWND) {
    poke_accessibility(hwnd);
    unsafe {
        let _ = EnumChildWindows(hwnd, Some(poke_child), LPARAM(0));
    }
    thread::sleep(Duration::from_millis(250));
}

unsafe extern "system" fn poke_child(hwnd: HWND, _lparam: LPARAM) -> BOOL {
    poke_accessibility(hwnd);
    BOOL(1)
}

fn poke_accessibility(hwnd: HWND) {
    unsafe {
        let _ = SendMessageTimeoutW(
            hwnd,
            WM_GETOBJECT,
            WPARAM(0),
            LPARAM(UIA_ROOT_OBJECT_ID),
            SMTO_ABORTIFHUNG,
            200,
            None,
        );
        let _ = SendMessageTimeoutW(
            hwnd,
            WM_GETOBJECT,
            WPARAM(0),
            LPARAM(OBJID_CLIENT),
            SMTO_ABORTIFHUNG,
            200,
            None,
        );
    }
}

fn find_url_in(automation: &UIAutomation, window: &UIElement) -> Option<String> {
    for ct in [
        ControlType::Edit,
        ControlType::ComboBox,
        ControlType::Custom,
    ] {
        let elements = match automation
            .create_matcher()
            .from(window.clone())
            .control_type(ct)
            .depth(32)
            .find_all()
        {
            Ok(els) => els,
            Err(e) => {
                eprintln!("[autofill] matcher {:?} error: {:?}", ct, e);
                continue;
            }
        };
        eprintln!("[autofill] matcher {:?} found {} elements", ct, elements.len());
        for (i, el) in elements.iter().enumerate() {
            let name = el.get_name().unwrap_or_default();
            let value = el
                .get_pattern::<UIValuePattern>()
                .ok()
                .and_then(|p| p.get_value().ok())
                .unwrap_or_default();
            eprintln!(
                "[autofill]   #{i} name={:?} value={:?}",
                truncate(&name, 80),
                truncate(&value, 200)
            );
            if let Some(url) = extract_url(el) {
                eprintln!("[autofill]   -> URL matched: {url}");
                return Some(url);
            }
        }
    }
    None
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_string()
    } else {
        let cut: String = s.chars().take(max).collect();
        format!("{cut}…")
    }
}

fn extract_url(edit: &UIElement) -> Option<String> {
    let via_value = edit
        .get_pattern::<UIValuePattern>()
        .ok()
        .and_then(|p| p.get_value().ok())
        .filter(|v| !v.is_empty());

    let candidate = via_value.or_else(|| edit.get_name().ok().filter(|s| !s.is_empty()))?;
    normalise_url(&candidate)
}

fn normalise_url(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return Some(trimmed.to_string());
    }
    if trimmed.starts_with("about:")
        || trimmed.starts_with("chrome:")
        || trimmed.starts_with("edge:")
        || trimmed.starts_with("file:")
    {
        return None;
    }
    if !trimmed.contains('.') || trimmed.contains(char::is_whitespace) {
        return None;
    }
    Some(format!("https://{trimmed}"))
}
