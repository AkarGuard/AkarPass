# Changelog

All notable changes to AkarPass are documented here. This project follows
[Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [0.3.0] — 2026-04-19

Desktop release: internationalisation, customisable autofill, multi-match
picker.

### Added

- **32-language UI** — English (default) plus all 24 official EU languages,
  Turkish, and six additional European languages (Norwegian, Icelandic,
  Albanian, Serbian, Bosnian, Macedonian, Ukrainian). Live switching; the
  chosen language persists to `localStorage`. Fallback chain: selected ⇒
  English ⇒ raw key. ([`apps/desktop/src/lib/i18n/`](apps/desktop/src/lib/i18n/))
- **Settings panel** accessible from the sidebar footer, containing the
  language picker and the autofill shortcut binding.
- **Customisable autofill shortcut** — click the recorder, press any
  combination (needs Ctrl/Alt/Shift + a key); value is persisted to
  `<app_data_dir>/settings.json` and restored on next launch. Invalid or
  unparseable stored values fall back to the built-in default
  `CommandOrControl+Shift+L`.
- **Multi-match picker** — when a site has several saved credentials, a modal
  lists them; choose with mouse, arrow keys + Enter, or quick-select 1–9. Esc
  cancels.
- **Explicit target-window focus** — on Windows, the hotkey handler captures
  `HWND` via `GetForegroundWindow` and passes it through to the inject
  command. Before typing, Rust calls `SetForegroundWindow(hwnd)` with an
  `IsWindow` guard. This closes a class of "wrong-window injection" bugs that
  timing-based focus yield could not prevent reliably, and is essential for
  the picker flow where the user interacts with the AkarPass window between
  shortcut and keystroke injection.

### Changed

- `autofill_type_credentials` Tauri command now accepts an optional
  `targetHwnd: Option<i64>`. Omitting it falls back to the previous
  timing-based behaviour; the single-match path in the bridge now passes it
  consistently.

### Security

- **No regression in zero-knowledge guarantees.** Master password, master
  key, DEK, and ML-KEM shared secrets are still never persisted unencrypted
  and are wiped in `finally` blocks. The new `settings.json` stores only
  non-sensitive UI preferences (`autofillShortcut`).
- The new language message files are static strings compiled into the
  bundle; no runtime download, no external fetch.

### Dependencies

- No new npm/crate dependencies. (`arboard` was added in 0.2.x for clipboard
  paste.)

---

## [0.2.0] — previous release

- Native autofill replacing Chrome extension.
- Clipboard-based keystroke injection for autofill.

## [0.1.0] — initial release

- Zero-knowledge vault with AES-256-GCM + ML-KEM-768 + Argon2id.
- Web, desktop (Tauri), and mobile (React Native) apps.
- Supabase cloud sync with row-level security.
