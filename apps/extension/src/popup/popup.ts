import { sendMessage } from "../shared/messages.js";

const app = document.getElementById("app")!;

const BASE = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  color: #f1f5f9;
`;

async function main() {
  const lockState = await sendMessage({ type: "GET_LOCK_STATE" });
  if (lockState.type !== "LOCK_STATE") return;

  if (lockState.locked) {
    if (lockState.vaultId) {
      renderUnlockForm(lockState.vaultId);
    } else {
      renderSignInForm();
    }
  } else {
    await renderCredentials();
  }
}

// ─── Sign-in form ─────────────────────────────────────────────────────────────

function renderSignInForm() {
  app.innerHTML = `
    <div style="padding:20px;${BASE}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <span style="font-size:24px">🔐</span>
        <div>
          <div style="font-weight:700;font-size:16px">AkarPass</div>
          <div style="font-size:11px;color:#64748b">Sign in to sync your vault</div>
        </div>
      </div>
      <form id="signin-form">
        <input type="email" id="email" placeholder="Email" autocomplete="email"
          style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:10px;color:#f1f5f9;font-size:14px;margin-bottom:10px;outline:none;box-sizing:border-box" />
        <input type="password" id="account-pw" placeholder="Account password" autocomplete="current-password"
          style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:10px;color:#f1f5f9;font-size:14px;margin-bottom:12px;outline:none;box-sizing:border-box" />
        <p id="signin-error" style="color:#ef4444;font-size:12px;margin-bottom:8px;display:none"></p>
        <button type="submit" id="signin-btn"
          style="width:100%;background:#6366f1;color:white;border:none;border-radius:6px;padding:10px;font-size:14px;font-weight:600;cursor:pointer">
          Sign in & sync vault
        </button>
      </form>
    </div>
  `;

  document.getElementById("signin-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const pw = (document.getElementById("account-pw") as HTMLInputElement).value;
    const btn = document.getElementById("signin-btn") as HTMLButtonElement;
    const err = document.getElementById("signin-error") as HTMLElement;

    btn.textContent = "Signing in...";
    btn.disabled = true;

    const response = await sendMessage({ type: "SIGN_IN", email, password: pw });

    if (response.type === "SIGN_IN_RESULT" && response.success) {
      renderUnlockForm(response.vaultId ?? "");
    } else {
      err.textContent = response.type === "SIGN_IN_RESULT" ? (response.error ?? "Sign in failed.") : "Sign in failed.";
      err.style.display = "block";
      btn.textContent = "Sign in & sync vault";
      btn.disabled = false;
    }
  });
}

// ─── Unlock form ─────────────────────────────────────────────────────────────

function renderUnlockForm(vaultId: string) {
  app.innerHTML = `
    <div style="padding:20px;${BASE}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <span style="font-size:24px">🔒</span>
        <div>
          <div style="font-weight:700;font-size:16px">AkarPass</div>
          <div style="font-size:11px;color:#64748b">Enter master password to unlock</div>
        </div>
      </div>
      <form id="unlock-form">
        <input type="password" id="master-pw" placeholder="Master password" autocomplete="current-password" autofocus
          style="width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:10px;color:#f1f5f9;font-size:14px;margin-bottom:12px;outline:none;box-sizing:border-box" />
        <p id="unlock-error" style="color:#ef4444;font-size:12px;margin-bottom:8px;display:none"></p>
        <button type="submit" id="unlock-btn"
          style="width:100%;background:#6366f1;color:white;border:none;border-radius:6px;padding:10px;font-size:14px;font-weight:600;cursor:pointer">
          Unlock
        </button>
      </form>
      <button id="sync-btn" style="width:100%;margin-top:8px;background:none;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;color:#94a3b8;cursor:pointer">
        ⟳ Sync vault from cloud
      </button>
      <button id="signout-btn" style="width:100%;margin-top:4px;background:none;border:none;padding:6px;font-size:11px;color:#475569;cursor:pointer">
        Sign out
      </button>
    </div>
  `;

  document.getElementById("unlock-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = (document.getElementById("master-pw") as HTMLInputElement).value;
    const btn = document.getElementById("unlock-btn") as HTMLButtonElement;
    const err = document.getElementById("unlock-error") as HTMLElement;

    btn.textContent = "Unlocking...";
    btn.disabled = true;

    const response = await sendMessage({ type: "UNLOCK_VAULT", masterPassword: pw, vaultId });

    if (response.type === "UNLOCK_RESULT" && response.success) {
      await renderCredentials();
    } else {
      const msg = response.type === "ERROR" ? response.message : "Incorrect master password.";
      err.textContent = msg;
      err.style.display = "block";
      btn.textContent = "Unlock";
      btn.disabled = false;
    }
  });

  document.getElementById("sync-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("sync-btn") as HTMLButtonElement;
    btn.textContent = "Syncing...";
    btn.disabled = true;
    const r = await sendMessage({ type: "SYNC_FROM_CLOUD" });
    if (r.type === "SYNC_RESULT" && r.success) {
      btn.textContent = "✓ Synced!";
    } else {
      btn.textContent = r.type === "SYNC_RESULT" && r.error ? r.error : "Sync failed";
    }
    setTimeout(() => { btn.textContent = "⟳ Sync vault from cloud"; btn.disabled = false; }, 2000);
  });

  document.getElementById("signout-btn")?.addEventListener("click", async () => {
    await sendMessage({ type: "SIGN_OUT" });
    renderSignInForm();
  });
}

// ─── Credentials list ─────────────────────────────────────────────────────────

async function renderCredentials() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? "";

  const response = await sendMessage({ type: "GET_CREDENTIALS_FOR_URL", url });
  const entries = response.type === "CREDENTIALS" ? response.entries : [];

  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1e293b;${BASE}">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">🔐</span>
        <span style="font-weight:700">AkarPass</span>
      </div>
      <button id="lock-btn" style="background:none;border:1px solid #334155;border-radius:4px;color:#94a3b8;padding:4px 10px;cursor:pointer;font-size:12px">Lock</button>
    </div>
    <div id="entries-list" style="padding:8px;${BASE}">
      ${entries.length === 0
        ? `<p style="color:#64748b;font-size:13px;text-align:center;padding:20px">No matching credentials for this site.</p>`
        : entries.map(renderEntryItem).join("")}
    </div>
  `;

  document.getElementById("lock-btn")?.addEventListener("click", async () => {
    await sendMessage({ type: "LOCK_VAULT" });
    const lockState = await sendMessage({ type: "GET_LOCK_STATE" });
    if (lockState.type === "LOCK_STATE") {
      renderUnlockForm(lockState.vaultId ?? "");
    }
  });

  document.querySelectorAll("[data-autofill]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset["autofill"]!;
      await sendMessage({ type: "AUTOFILL", entryId: id });
      window.close();
    });
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset["copy"]!;
      await sendMessage({ type: "COPY_PASSWORD", entryId: id });
      (btn as HTMLElement).textContent = "✓";
      setTimeout(() => { (btn as HTMLElement).textContent = "📋"; }, 2000);
    });
  });
}

function renderEntryItem(entry: { id: string; title: string; username: string; url: string }) {
  return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:6px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(entry.title)}</div>
        <div style="font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(entry.username)}</div>
      </div>
      <button data-autofill="${entry.id}" style="background:#6366f1;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;cursor:pointer">Fill</button>
      <button data-copy="${entry.id}" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:4px;padding:5px 8px;font-size:12px;cursor:pointer">📋</button>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

main();
