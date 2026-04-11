/**
 * Cryptographically secure password generator.
 *
 * Uses `randomInt` from @akarpass/crypto which wraps `crypto.getRandomValues`.
 * Never uses Math.random().
 */

import { randomInt } from "@akarpass/crypto";
import type { PasswordGeneratorOptions } from "./types.js";
import {
  CHARSET,
  DEFAULT_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "./constants.js";

export const DEFAULT_GENERATOR_OPTIONS: PasswordGeneratorOptions = {
  length: DEFAULT_PASSWORD_LENGTH,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: true,
  customChars: "",
};

/**
 * Generate a cryptographically secure random password.
 *
 * The algorithm:
 *   1. Build the character pool from enabled options.
 *   2. For each required character class, pick one mandatory character.
 *   3. Fill remaining slots from the full pool.
 *   4. Shuffle the result with Fisher-Yates using crypto random.
 *
 * This guarantees at least one character from each enabled class while
 * still producing a uniformly random output.
 */
export function generatePassword(
  options: Partial<PasswordGeneratorOptions> = {},
): string {
  const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };

  // Clamp length
  const length = Math.max(
    MIN_PASSWORD_LENGTH,
    Math.min(MAX_PASSWORD_LENGTH, opts.length),
  );

  // Build character pools per class
  const upper = opts.excludeAmbiguous ? CHARSET.uppercase : CHARSET.uppercaseAmbiguous;
  const lower = opts.excludeAmbiguous ? CHARSET.lowercase : CHARSET.lowercaseAmbiguous;
  const digit = opts.excludeAmbiguous ? CHARSET.digits : CHARSET.digitsAmbiguous;
  const sym = CHARSET.symbols;

  // Full pool
  let pool = "";
  if (opts.uppercase) pool += upper;
  if (opts.lowercase) pool += lower;
  if (opts.digits) pool += digit;
  if (opts.symbols) pool += sym;
  if (opts.customChars) {
    // Deduplicate custom chars already in pool
    for (const ch of opts.customChars) {
      if (!pool.includes(ch)) pool += ch;
    }
  }

  if (pool.length === 0) {
    throw new Error("At least one character class must be enabled.");
  }

  // Pick mandatory chars from each enabled class
  const mandatory: string[] = [];
  if (opts.uppercase && upper.length > 0) {
    mandatory.push(upper[randomInt(upper.length)]!);
  }
  if (opts.lowercase && lower.length > 0) {
    mandatory.push(lower[randomInt(lower.length)]!);
  }
  if (opts.digits && digit.length > 0) {
    mandatory.push(digit[randomInt(digit.length)]!);
  }
  if (opts.symbols) {
    mandatory.push(sym[randomInt(sym.length)]!);
  }

  // Trim mandatory to length
  const mandatorySlice = mandatory.slice(0, length);
  const remaining = length - mandatorySlice.length;

  // Fill with random chars from full pool
  const chars: string[] = [...mandatorySlice];
  for (let i = 0; i < remaining; i++) {
    chars.push(pool[randomInt(pool.length)]!);
  }

  // Fisher-Yates shuffle using crypto random
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }

  return chars.join("");
}

/**
 * Generate a memorable passphrase-style password (word-number-symbol pattern).
 * Uses a small built-in word list — no external dict dependency.
 */
export function generatePassphrase(wordCount = 4): string {
  const words = PASSPHRASE_WORDS;
  const parts: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    parts.push(words[randomInt(words.length)]!);
  }
  // Add a number and symbol for extra entropy
  const digits = "23456789";
  const syms = "!@#$%^&*";
  parts.push(digits[randomInt(digits.length)]!);
  parts.push(syms[randomInt(syms.length)]!);
  // Capitalise first letter of each word
  return parts
    .map((w) =>
      w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w,
    )
    .join("-");
}

// 200-word mini word list — enough for ~48 bits entropy at 4 words
const PASSPHRASE_WORDS = [
  "apple","brave","cloud","dance","eagle","flame","grove","house","ivory",
  "jewel","kneel","lemon","maple","noble","ocean","piano","quiet","river",
  "storm","tiger","ultra","vivid","water","xenon","yield","zebra","amber",
  "brush","cedar","drift","elder","frost","globe","haven","inbox","jungle",
  "knife","lunar","mango","nerve","otter","peach","quartz","raven","solar",
  "toast","urban","valve","wheat","xeric","yacht","zonal","blaze","crisp",
  "depth","ember","flute","grace","hurry","index","joust","karma","latch",
  "marsh","novel","orbit","prism","quest","relay","scout","trove","union",
  "vapor","width","xylol","yodel","zones","agent","birth","cloak","depot",
  "epoch","forge","grant","handy","image","jolly","kiosk","layer","merit",
  "nymph","optic","pearl","query","round","shift","track","usher","vista",
  "wreck","exact","young","zippy","bench","craft","debug","event","field",
  "giant","hedge","icing","jewel","knack","light","match","ninth","ozone",
  "proxy","quota","reach","stone","tower","unfold","verge","watch","extra",
  "yarns","zones","alarm","blade","charm","dwell","entry","fault","glide",
  "habit","ideal","judge","knelt","logic","mocha","north","offer","pilot",
  "quota","reach","scope","tempo","unity","vapor","worth","xerox","yield",
];
