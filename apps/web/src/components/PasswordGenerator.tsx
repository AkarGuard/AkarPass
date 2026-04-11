"use client";

import { useState, useCallback } from "react";
import { generatePassword, generatePassphrase, checkPasswordStrength } from "@akarpass/core";
import type { PasswordGeneratorOptions } from "@akarpass/core";
import styles from "./PasswordGenerator.module.css";

interface Props {
  onClose: () => void;
}

const DEFAULT_OPTS: PasswordGeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: true,
  customChars: "",
};

export function PasswordGenerator({ onClose }: Props) {
  const [opts, setOpts] = useState<PasswordGeneratorOptions>(DEFAULT_OPTS);
  const [mode, setMode] = useState<"random" | "passphrase">("random");
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTS));
  const [copied, setCopied] = useState(false);

  const regen = useCallback(() => {
    if (mode === "passphrase") {
      setPassword(generatePassphrase(4));
    } else {
      setPassword(generatePassword(opts));
    }
    setCopied(false);
  }, [opts, mode]);

  function toggle(key: keyof PasswordGeneratorOptions) {
    setOpts((o) => {
      const updated = { ...o, [key]: !o[key as keyof typeof o] };
      const newPass = generatePassword(updated);
      setPassword(newPass);
      return updated;
    });
  }

  function handleLengthChange(val: number) {
    const updated = { ...opts, length: val };
    setOpts(updated);
    setPassword(generatePassword(updated));
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Auto-clear clipboard
    setTimeout(() => navigator.clipboard.writeText(""), 30_000);
  }

  const strength = checkPasswordStrength(password);
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Password Generator</h2>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Mode tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === "random" ? styles.tabActive : ""}`}
          onClick={() => { setMode("random"); setPassword(generatePassword(opts)); }}
        >
          Random
        </button>
        <button
          className={`${styles.tab} ${mode === "passphrase" ? styles.tabActive : ""}`}
          onClick={() => { setMode("passphrase"); setPassword(generatePassphrase(4)); }}
        >
          Passphrase
        </button>
      </div>

      {/* Generated password display */}
      <div className={styles.outputRow}>
        <code className={styles.output}>{password}</code>
        <button className={styles.regenBtn} onClick={regen} title="Regenerate">⟳</button>
        <button className={styles.copyBtn} onClick={copyPassword}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Strength indicator */}
      <div style={{ margin: "12px 0" }}>
        <div style={{ height: 4, borderRadius: 2, background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${((strength.score + 1) / 5) * 100}%`,
            background: strengthColors[strength.score],
            transition: "width 0.3s",
          }} />
        </div>
        <p style={{ fontSize: 12, color: strengthColors[strength.score], marginTop: 4 }}>
          {strength.strength.replace("-", " ")} · {strength.crackTime} to crack
        </p>
      </div>

      {mode === "random" && (
        <div className={styles.options}>
          {/* Length slider */}
          <div className={styles.sliderRow}>
            <label className={styles.optLabel}>Length: {opts.length}</label>
            <input
              type="range"
              min={8}
              max={128}
              value={opts.length}
              onChange={(e) => handleLengthChange(Number(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* Toggles */}
          {(
            [
              ["uppercase", "Uppercase (A-Z)"],
              ["lowercase", "Lowercase (a-z)"],
              ["digits", "Numbers (0-9)"],
              ["symbols", "Symbols (!@#...)"],
              ["excludeAmbiguous", "Exclude ambiguous (0Oll1I)"],
            ] as [keyof PasswordGeneratorOptions, string][]
          ).map(([key, label]) => (
            <label key={key} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={opts[key] as boolean}
                onChange={() => toggle(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
