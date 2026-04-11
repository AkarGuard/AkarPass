import { checkPasswordStrength } from "@akarpass/core";
import type { PasswordStrengthResult } from "@akarpass/core";

interface Props {
  password: string;
  showFeedback?: boolean;
}

const COLOR_MAP: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#eab308",
  3: "#22c55e",
  4: "#10b981",
};

const LABEL_MAP: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "Very weak",
  1: "Weak",
  2: "Fair",
  3: "Strong",
  4: "Very strong",
};

export function PasswordStrengthBar({ password, showFeedback = true }: Props) {
  const result: PasswordStrengthResult = checkPasswordStrength(password);
  const color = COLOR_MAP[result.score];
  const label = LABEL_MAP[result.score];
  const widthPct = ((result.score + 1) / 5) * 100;

  return (
    <div style={{ width: "100%" }}>
      {/* Bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${widthPct}%`,
            background: color,
            transition: "width 0.3s ease, background 0.3s ease",
          }}
        />
      </div>

      {/* Label + crack time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <span style={{ color, fontWeight: 600 }}>{label}</span>
        <span>Crack time: {result.crackTime}</span>
      </div>

      {/* Suggestions */}
      {showFeedback && result.suggestions.length > 0 && (
        <ul
          style={{
            margin: "4px 0 0",
            padding: "0 0 0 16px",
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          {result.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
