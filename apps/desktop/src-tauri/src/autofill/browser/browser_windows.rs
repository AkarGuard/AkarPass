//! Windows implementation. Uses UIAutomation end-to-end so we don't have to
//! reconcile windows-rs HWND types across crate versions.
//!
//! Strategy: start from the element that currently has keyboard focus (usually
//! a form field the user wants to fill), walk up to the owning Window, then
//! search that window's subtree for Edit controls and inspect their Value /
//! Name properties for something that looks like a URL.

use std::path::PathBuf;

use uiautomation::controls::ControlType;
use uiautomation::patterns::UIValuePattern;
use uiautomation::{UIAutomation, UIElement};
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT, PROCESS_QUERY_LIMITED_INFORMATION,
};

use crate::autofill::AutofillTarget;

pub fn read_target() -> Option<AutofillTarget> {
    let automation = UIAutomation::new().ok()?;
    let focused = automation.get_focused_element().ok()?;
    let window = walk_to_window(&automation, focused)?;

    let window_title = window.get_name().unwrap_or_default();
    let pid = window.get_process_id().ok().unwrap_or(0);
    let app_name = if pid > 0 {
        process_name_for_pid(pid as u32).unwrap_or_default()
    } else {
        String::new()
    };

    let url = read_url_within(&automation, &window);

    Some(AutofillTarget {
        url,
        app_name,
        window_title,
    })
}

fn walk_to_window(automation: &UIAutomation, start: UIElement) -> Option<UIElement> {
    let walker = automation.get_control_view_walker().ok()?;
    let mut current = start;
    for _ in 0..32 {
        let ct = current.get_control_type().ok();
        if matches!(ct, Some(ControlType::Window)) || matches!(ct, Some(ControlType::Pane)) {
            // Top-level for a browser is often a Pane (Chrome/Edge wrap their
            // top window in a Pane). Accept either.
            if current.get_process_id().is_ok() {
                return Some(current);
            }
        }
        match walker.get_parent(&current) {
            Ok(p) => current = p,
            Err(_) => return Some(current),
        }
    }
    Some(current)
}

fn read_url_within(automation: &UIAutomation, window: &UIElement) -> Option<String> {
    let matcher = automation
        .create_matcher()
        .from(window.clone())
        .control_type(ControlType::Edit)
        .depth(16);

    let edits = matcher.find_all().ok()?;
    for edit in edits {
        if let Some(url) = extract_url(&edit) {
            return Some(url);
        }
    }
    None
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
    // Must look like a hostname: at least one dot, no whitespace.
    if !trimmed.contains('.') || trimmed.contains(char::is_whitespace) {
        return None;
    }
    Some(format!("https://{trimmed}"))
}

fn process_name_for_pid(pid: u32) -> Option<String> {
    if pid == 0 {
        return None;
    }
    let handle = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) }.ok()?;
    let mut buf = vec![0u16; 1024];
    let mut size = buf.len() as u32;
    let ok = unsafe {
        QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_FORMAT(0),
            windows::core::PWSTR(buf.as_mut_ptr()),
            &mut size,
        )
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
