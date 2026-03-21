"use client";

import { useMemo, useState } from "react";

interface RawJSONProps {
  data: unknown;
}

export function RawJSON({ data }: RawJSONProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const byteSize = useMemo(() => new TextEncoder().encode(json).byteLength, [json]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-secure contexts.
    }
  };

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: "oklch(45% 0.01 80)" }}
      >
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Raw JSON
        <span className="font-normal normal-case tracking-normal" style={{ color: "oklch(55% 0.01 80)" }}>
          ({formatBytes(byteSize)})
        </span>
      </button>

      {expanded && (
        <div className="relative">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: copied ? "oklch(90% 0.03 140)" : "oklch(92% 0.005 80)",
              color: copied ? "oklch(35% 0.08 140)" : "oklch(40% 0.01 80)",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <pre
            className="overflow-x-auto p-5 rounded-lg border font-mono text-xs leading-relaxed"
            style={{
              borderColor: "oklch(90% 0.005 80)",
              backgroundColor: "oklch(99% 0.002 80)",
              color: "oklch(30% 0.01 80)",
              maxHeight: "600px",
            }}
          >
            {json}
          </pre>
        </div>
      )}
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
