export type ExtensionMessage =
  | { type: "GET_CREDENTIALS_FOR_URL"; url: string }
  | { type: "AUTOFILL"; entryId: string }
  | { type: "LOCK_VAULT" }
  | { type: "GET_LOCK_STATE" }
  | { type: "UNLOCK_VAULT"; masterPassword: string; vaultId: string }
  | { type: "COPY_PASSWORD"; entryId: string }
  | { type: "SIGN_IN"; email: string; password: string }
  | { type: "SIGN_OUT" }
  | { type: "SYNC_FROM_CLOUD" };

export type ExtensionResponse =
  | { type: "CREDENTIALS"; entries: CredentialSummary[] }
  | { type: "LOCK_STATE"; locked: boolean; vaultId?: string }
  | { type: "UNLOCK_RESULT"; success: boolean }
  | { type: "SIGN_IN_RESULT"; success: boolean; error?: string; vaultId?: string }
  | { type: "SYNC_RESULT"; success: boolean; error?: string }
  | { type: "OK" }
  | { type: "ERROR"; message: string };

export interface CredentialSummary {
  id: string;
  title: string;
  username: string;
  url: string;
}

export function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message) as Promise<ExtensionResponse>;
}

export async function sendToContentScript(
  tabId: number,
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  return chrome.tabs.sendMessage(tabId, message) as Promise<ExtensionResponse>;
}
