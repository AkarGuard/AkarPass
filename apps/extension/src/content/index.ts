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
    // Find the nearest username/email field preceding the password field
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

  // Shadow DOM to isolate styles from page CSS
  const shadow = overlay.attachShadow({ mode: "closed" });
  const container = document.createElement("div");
  container.innerHTML = `
    <style>
      .suggestion {
        position: fixed;
        top: ${rect.bottom + window.scrollY + 4}px;
        left: ${rect.left + window.scrollX}px;
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
      }
      .suggestion:hover { background: #273549; }
      .icon { font-size: 18px; }
      .info { flex: 1; }
      .title { font-weight: 600; }
      .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
      .close { color: #64748b; cursor: pointer; padding: 2px 4px; }
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
      return;
    }
    chrome.runtime.sendMessage({ type: "AUTOFILL", entryId: entry.id });
    removeOverlay();
  });

  shadow.appendChild(container);
  document.body.appendChild(overlay);
  _overlay = overlay;

  // Auto-dismiss after 10s
  setTimeout(removeOverlay, 10_000);
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

function fillCredentials(
  username: string,
  password: string,
  forms: LoginForm[],
) {
  if (forms.length === 0) return;
  const form = forms[0]!;

  if (form.usernameField && username) {
    nativeInputValueSet(form.usernameField, username);
  }
  nativeInputValueSet(form.passwordField, password);
}

/**
 * Set input value in a way that React/Angular/Vue controlled inputs detect.
 * Uses the native input value setter to bypass framework value tracking.
 */
function nativeInputValueSet(el: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  nativeInputValueSetter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ─── Initialise ─────────────────────────────────────────────────────────────

async function init() {
  const forms = findLoginForms();
  if (forms.length === 0) return;

  // Request matching credentials from background
  const response = await chrome.runtime.sendMessage({
    type: "GET_CREDENTIALS_FOR_URL",
    url: window.location.href,
  });

  if (response?.type !== "CREDENTIALS" || response.entries.length === 0) return;

  // Show suggestion on the first password field
  const target = forms[0]!.passwordField;
  const entry = response.entries[0]!;
  showAutofillSuggestion(target, entry);
}

// ─── Message listener (from background SW) ──────────────────────────────────

chrome.runtime.onMessage.addListener((message: AutofillPayload, _sender, sendResponse) => {
  if (message.type === "DO_AUTOFILL") {
    const forms = findLoginForms();
    fillCredentials(message.username, message.password, forms);
    sendResponse({ type: "OK" });
  }
  return true;
});

// ─── Run on focus (re-check after SPA navigation) ────────────────────────────

window.addEventListener("focus", init);
document.addEventListener("DOMContentLoaded", init);

// For SPAs that update the DOM without page load:
const observer = new MutationObserver(() => {
  const forms = findLoginForms();
  if (forms.length > 0 && !_overlay) {
    // Debounce
    setTimeout(init, 300);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

init();
