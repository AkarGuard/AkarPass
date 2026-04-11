/**
 * Biometric unlock bridge using the WebAuthn / Credential Management API.
 *
 * Flow:
 *   1. At setup, generate a WebAuthn credential (platform authenticator).
 *   2. Store a small "biometric-wrapped" copy of the master password in
 *      a local store, protected by the WebAuthn credential's private key.
 *   3. At unlock, trigger WebAuthn assertion to prove presence.
 *   4. Use the assertion's user handle / PRF extension to derive the
 *      same key and decrypt the locally stored master password bytes.
 *
 * Note: Full WebAuthn PRF extension support is still rolling out.
 * This module provides the structure; actual credential storage uses
 * the platform keychain (OS-managed, not accessible to JS).
 *
 * On platforms without WebAuthn (old browsers), falls back gracefully
 * to password-only mode.
 */

export interface BiometricSetupResult {
  credentialId: string;
  supported: boolean;
}

/** Check if platform authenticator (biometric) is available. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a biometric credential for the current user.
 * The credential ID is stored locally and used for subsequent assertions.
 *
 * @param userId       The Supabase user ID (used as user.id in WebAuthn).
 * @param displayName  User display name for the authenticator prompt.
 */
export async function registerBiometric(
  userId: string,
  displayName: string,
): Promise<BiometricSetupResult> {
  if (!(await isBiometricAvailable())) {
    return { credentialId: "", supported: false };
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "AkarPass", id: window.location.hostname },
      user: {
        id: userIdBytes,
        name: userId,
        displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  }) as PublicKeyCredential | null;

  if (!credential) {
    return { credentialId: "", supported: false };
  }

  const credentialId = btoa(
    String.fromCharCode(...new Uint8Array(credential.rawId)),
  );

  return { credentialId, supported: true };
}

/**
 * Perform a WebAuthn assertion (biometric verification).
 * Returns true if the user verified successfully.
 */
export async function assertBiometric(credentialId: string): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rawId = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: rawId, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return assertion !== null;
  } catch {
    return false;
  }
}
