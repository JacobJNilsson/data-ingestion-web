"use client";

import type { FieldConstraint } from "@/types/contract";

export function ConstraintBadge({ constraint }: { constraint: FieldConstraint }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    primary_key: { bg: "oklch(92% 0.02 260)", text: "oklch(40% 0.08 260)", label: "PK" },
    foreign_key: {
      bg: "oklch(92% 0.02 140)",
      text: "oklch(35% 0.08 140)",
      label: constraint.referred_table
        ? `FK → ${constraint.referred_table}.${constraint.referred_column}`
        : "FK",
    },
    unique: { bg: "oklch(92% 0.02 300)", text: "oklch(40% 0.08 300)", label: "UQ" },
    not_null: { bg: "oklch(92% 0.02 30)", text: "oklch(40% 0.08 30)", label: "NOT NULL" },
    check: { bg: "oklch(92% 0.005 80)", text: "oklch(40% 0.01 80)", label: "CHECK" },
  };

  const style = styles[constraint.type] || styles.check;

  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    integer: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    bigint: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    smallint: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    numeric: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    real: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    double: { bg: "oklch(95% 0.02 260)", text: "oklch(40% 0.08 260)" },
    text: { bg: "oklch(95% 0.005 80)", text: "oklch(40% 0.01 80)" },
    varchar: { bg: "oklch(95% 0.005 80)", text: "oklch(40% 0.01 80)" },
    char: { bg: "oklch(95% 0.005 80)", text: "oklch(40% 0.01 80)" },
    boolean: { bg: "oklch(95% 0.02 300)", text: "oklch(40% 0.08 300)" },
    date: { bg: "oklch(95% 0.02 140)", text: "oklch(35% 0.08 140)" },
    timestamp: { bg: "oklch(95% 0.02 140)", text: "oklch(35% 0.08 140)" },
    timestamptz: { bg: "oklch(95% 0.02 140)", text: "oklch(35% 0.08 140)" },
    uuid: { bg: "oklch(95% 0.02 50)", text: "oklch(40% 0.08 50)" },
    json: { bg: "oklch(95% 0.02 200)", text: "oklch(40% 0.08 200)" },
    jsonb: { bg: "oklch(95% 0.02 200)", text: "oklch(40% 0.08 200)" },
  };

  const color = colors[type] || { bg: "oklch(95% 0.005 80)", text: "oklch(40% 0.01 80)" };

  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {type}
    </span>
  );
}
