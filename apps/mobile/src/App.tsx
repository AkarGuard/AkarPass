/**
 * AkarPass Mobile App (React Native)
 *
 * Architecture:
 *   - Crypto: @akarpass/crypto (same package as web — Web Crypto API is
 *     available in RN via the Hermes engine on RN 0.71+, or via react-native-quick-crypto polyfill)
 *   - Storage: react-native-keychain (Keychain/Keystore) for secure data
 *   - Biometric: react-native-biometrics (FaceID/TouchID/Fingerprint)
 *   - Autofill: iOS uses ASCredentialProviderExtension; Android uses AutofillService API
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  StatusBar,
} from "react-native";
import type { VaultEntry } from "@akarpass/core";

// Mobile app state — simplified skeleton
type Screen = "lock" | "vault" | "detail";

export default function App() {
  const [screen, setScreen] = useState<Screen>("lock");
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [masterPassword, setMasterPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!masterPassword) return;
    setLoading(true);
    try {
      // In production: load encrypted vault from Keychain, decrypt with masterPassword
      // const { unlockVault } = await import('./lib/vault-service');
      // const success = await unlockVault(vaultId, masterPassword);
      setScreen("vault");
    } catch (e) {
      Alert.alert("Error", "Failed to unlock vault.");
    } finally {
      setLoading(false);
      setMasterPassword(""); // Wipe from state
    }
  }

  if (screen === "lock") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.lockContainer}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.appName}>AkarPass</Text>
          <Text style={styles.tagline}>Zero-knowledge. Post-quantum secure.</Text>

          <TextInput
            style={styles.input}
            placeholder="Master password"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={masterPassword}
            onChangeText={setMasterPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleUnlock}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Unlocking..." : "Unlock Vault"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.biometricBtn}>
            <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vault</Text>
        <TouchableOpacity onPress={() => setScreen("lock")}>
          <Text style={styles.lockBtn}>Lock</Text>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔑</Text>
          <Text style={styles.emptyText}>No entries yet.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.entryRow}>
              <View style={styles.entryIcon}>
                <Text>🔑</Text>
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryTitle}>{item.title}</Text>
                <Text style={styles.entrySub}>{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },

  // Lock screen
  lockContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: { fontSize: 56 },
  appName: { fontSize: 28, fontWeight: "700", color: "#f1f5f9", marginTop: 12 },
  tagline: { fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 32 },
  input: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 14,
  },
  btn: {
    width: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  biometricBtn: { marginTop: 16 },
  biometricText: { color: "#6366f1", fontSize: 14 },

  // Vault screen
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#f1f5f9" },
  lockBtn: { color: "#ef4444", fontSize: 14 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: "#64748b", marginTop: 12, fontSize: 14 },

  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  entryIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  entryInfo: { flex: 1 },
  entryTitle: { fontSize: 14, fontWeight: "500", color: "#f1f5f9" },
  entrySub: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
