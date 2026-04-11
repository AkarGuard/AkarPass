export { SessionManager, session } from "./session.js";
export {
  isBiometricAvailable,
  registerBiometric,
  assertBiometric,
} from "./biometric.js";
export type { BiometricSetupResult } from "./biometric.js";
export {
  initSupabaseAuth,
  getAuthClient,
  signUp,
  signIn,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
} from "./supabase-auth.js";
export type { AuthResult } from "./supabase-auth.js";
