/**
 * Content script — injected into every page.
 *
 * Responsibilities:
 *   1. Detect login forms on the page.
 *   2. Request matching credentials from the background SW.
 *   3. Show an autofill suggestion UI (non-intrusive overlay).
 *   4. Inject credentials into form fields on user confirmation.
 *
 * Security:
 *   - Credentials are NOT stored in the content script.
 *   - Passwords are received from the background SW only on explicit user action.
 *   - The content script never communicates with external servers.
 *   - DOM injection uses textContent/value assignment — no innerHTML.
 *   - Strict: no eval(), no dynamic code.
 */

interface AutofillPayload {
  type: "DO_AUTOFILL";
  username: string;
  password: string;
}

// ─── Form detection ─────────────────────────────────────────────────────────

interface LoginForm {
  form: HTMLFormElement | null;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement;
}

function findLoginForms(): LoginForm[] {
  const passwordFields = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="password"]'),
  ).filter((el) => el.offsetParent !== null); // visible only

  return passwordFields.map((passwordField) => {
    const form = passwordField.closest("form");
    const candidates = form
      ? Array.from(form.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"], input[autocomplete="username"], input[autocomplete="email"]'))
      : Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"]'));

    const usernameField = candidates.find(
      (el) =>
        el !== passwordField &&
        el.offsetParent !== null &&
        (el.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ) ?? null;

    return { form, usernameField, passwordField };
  });
}

// ─── Autofill overlay ───────────────────────────────────────────────────────

let _overlay: HTMLElement | null = null;

function showAutofillSuggestion(
  target: HTMLInputElement,
  entry: { id: string; title: string; username: string },
) {
  removeOverlay();

  const rect = target.getBoundingClientRect();
  const overlay = document.createElement("div");
  overlay.setAttribute("id", "akarpass-overlay");

  const shadow = overlay.attachShadow({ mode: "closed" });
  const container = document.createElement("div");
  container.innerHTML = `
    <style>
      .suggestion {
        position: fixed;
        top: ${rect.bottom + 4}px;
        left: ${rect.left}px;
        z-index: 2147483647;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px;
        color: #f1f5f9;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        cursor: pointer;
        user-select: none;
        min-width: 200px;
        max-width: ${Math.min(target.offsetWidth, 360)}px;
        animation: slideIn 0.12s ease;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .suggestion:hover { background: #273549; }
      .icon { font-size: 16px; flex-shrink: 0; }
      .info { flex: 1; min-width: 0; }
      .title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .close { color: #64748b; cursor: pointer; padding: 2px 6px; flex-shrink: 0; font-size: 14px; line-height: 1; }
      .close:hover { color: #f1f5f9; }
    </style>
    <div class="suggestion" id="fill-btn">
      <span class="icon">🔑</span>
      <div class="info">
        <div class="title">${escapeHtml(entry.title)}</div>
        <div class="sub">${escapeHtml(entry.username)}</div>
      </div>
      <span class="close" id="close-btn">✕</span>
    </div>
  `;

  container.querySelector("#fill-btn")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "close-btn") {
      removeOverlay();
      _dismissed = true; // user explicitly closed — don't show again
      return;
    }
    chrome.runtime.sendMessage({ type: "AUTOFILL", entryId: entry.id });
    removeOverlay();
    _dismissed = true; // filled — don't show again this session
  });

  shadow.appendChild(container);
  document.body.appendChild(overlay);
  _overlay = overlay;

  // Auto-dismiss after 8s
  setTimeout(removeOverlay, 8_000);
}

function removeOverlay() {
  if (_overlay) {
    _overlay.remove();
    _overlay = null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Fill credentials into form ─────────────────────────────────────────────

function fillCredentials(username: string, password: string, forms: LoginForm[]) {
  if (forms.length === 0) return;
  const form = forms[0]!;
  if (form.usernameField && username) nativeInputValueSet(form.usernameField, username);
  nativeInputValueSet(form.passwordField, password);
}

function nativeInputValueSet(el: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype, "value",
  )?.set;
  nativeInputValueSetter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ─── State ───────────────────────────────────────────────────────────────────

let _registered = false;  // focus listeners attached?
let _dismissed  = false;  // user filled or closed — skip until page changes
let _lastUrl    = location.href;

/** Reset state on SPA navigation */
function checkNavigation() {
  if (location.href !== _lastUrl) {
    _lastUrl = location.href;
    _registered = false;
    _dismissed = false;
    removeOverlay();
    setTimeout(init, 400);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  checkNavigation();

  // Don't re-register or re-show if already set up for this page
  if (_registered) return;

  const forms = findLoginForms();
  if (forms.length === 0) return;

  // Fetch matching credentials once — don't repeat on every focus event
  let response: { type: string; entries: { id: string; title: string; username: string }[] } | null = null;
  try {
    response = await chrome.runtime.sendMessage({
      type: "GET_CREDENTIALS_FOR_URL",
      url: window.location.href,
    });
  } catch {
    return; // extension context invalidated (e.g. reloaded)
  }

  if (response?.type !== "CREDENTIALS" || !response.entries.length) return;

  const entry = response.entries[0]!;
  const target = forms[0]!.passwordField;
  const usernameField = forms[0]!.usernameField;

  // Mark as registered so we don't re-attach listeners
  _registered = true;

  function maybeShow() {
    if (_dismissed || _overlay) return;
    showAutofillSuggestion(target, entry);
  }

  // Show on focus of password OR username field
  target.addEventListener("focus", maybeShow);
  usernameField?.addEventListener("focus", maybeShow);

  // Show immediately if one of them is already active
  const active = document.activeElement;
  if (active === target || active === usernameField) {
    maybeShow();
  }
}

// ─── Message listener (from background SW) ──────────────────────────────────

chrome.runtime.onMessage.addListener((message: AutofillPayload, _sender, sendResponse) => {
  if (message.type === "DO_AUTOFILL") {
    const forms = findLoginForms();
    fillCredentials(message.username, message.password, forms);
    removeOverlay();
    _dismissed = true;
    sendResponse({ type: "OK" });
  }
  return true;
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);

// SPA navigation detection via MutationObserver (debounced)
let _mutationTimer: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver(() => {
  checkNavigation();
  // Re-run init if new forms appear (SPA rendered new login form)
  if (!_registered && !_mutationTimer) {
    _mutationTimer = setTimeout(() => {
      _mutationTimer = null;
      init();
    }, 400);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

init();
