/**
 * Password strength evaluator.
 *
 * Uses an entropy-based approach (no external zxcvbn dependency to minimise
 * supply chain surface). We calculate Shannon entropy and apply pattern
 * penalties for common weaknesses.
 */

import type { PasswordStrength, PasswordStrengthResult } from "./types.js";

/**
 * Estimate the search space size for a password based on its character pool.
 * Returns log2 of the search space (bits of entropy).
 */
function estimateEntropy(password: string): number {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) return 0;
  return password.length * Math.log2(poolSize);
}

/** Detect common patterns that significantly reduce effective entropy. */
function detectPatterns(password: string): string[] {
  const issues: string[] = [];

  // Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    issues.push("Avoid repeated characters (e.g. aaa).");
  }

  // Sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    issues.push("Avoid sequential letters (e.g. abc).");
  }
  if (/(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    issues.push("Avoid sequential numbers (e.g. 123).");
  }

  // Keyboard walks
  if (/(?:qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm)/i.test(password)) {
    issues.push("Avoid keyboard patterns (e.g. qwerty).");
  }

  // Common words / passwords (top 20)
  const commonPasswords = [
    "password", "123456", "qwerty", "admin", "letmein", "welcome",
    "monkey", "dragon", "master", "sunshine", "princess", "shadow",
    "superman", "michael", "football",
  ];
  const lower = password.toLowerCase();
  if (commonPasswords.some((p) => lower.includes(p))) {
    issues.push("Password contains a common word or pattern.");
  }

  return issues;
}

/**
 * Estimate crack time from entropy bits.
 * Assumes 10^10 guesses/sec (high-end GPU cluster).
 */
function crackTime(entropyBits: number): string {
  const guessesPerSec = 1e10;
  const combinations = Math.pow(2, entropyBits);
  const seconds = combinations / (2 * guessesPerSec); // average: half search space

  if (seconds < 1) return "less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3.154e9) return `${Math.round(seconds / 31536000)} years`;
  if (seconds < 3.154e12) return `${(seconds / 3.154e9).toFixed(0)} thousand years`;
  if (seconds < 3.154e15) return `${(seconds / 3.154e12).toFixed(0)} million years`;
  return "centuries";
}

const STRENGTH_LABELS: Record<0 | 1 | 2 | 3 | 4, PasswordStrength> = {
  0: "very-weak",
  1: "weak",
  2: "fair",
  3: "strong",
  4: "very-strong",
};

/**
 * Evaluate password strength.
 *
 * Scoring rubric (entropy bits after pattern penalties):
 *   < 28  → very-weak  (score 0)
 *   < 36  → weak       (score 1)
 *   < 50  → fair       (score 2)
 *   < 64  → strong     (score 3)
 *   ≥ 64  → very-strong(score 4)
 */
export function checkPasswordStrength(
  password: string,
): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      strength: "very-weak",
      crackTime: "instantly",
      suggestions: ["Enter a password."],
    };
  }

  const suggestions: string[] = [];
  let entropy = estimateEntropy(password);

  // Apply penalties for patterns
  const patternIssues = detectPatterns(password);
  suggestions.push(...patternIssues);
  // Each pattern finding halves effective entropy
  entropy -= patternIssues.length * 8;
  entropy = Math.max(0, entropy);

  // Suggest improvements
  if (password.length < 12) {
    suggestions.push("Use at least 12 characters.");
  }
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters.");
  if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters.");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers.");
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push("Add symbols (!@#$...).");

  let score: 0 | 1 | 2 | 3 | 4;
  if (entropy < 28) score = 0;
  else if (entropy < 36) score = 1;
  else if (entropy < 50) score = 2;
  else if (entropy < 64) score = 3;
  else score = 4;

  return {
    score,
    strength: STRENGTH_LABELS[score],
    crackTime: crackTime(entropy),
    suggestions,
  };
}
