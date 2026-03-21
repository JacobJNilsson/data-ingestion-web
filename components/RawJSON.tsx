"use client";

import { useState } from "react";

interface RawJSONProps {
  data: unknown;
}

export function RawJSON({ data }: RawJSONProps) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
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
          ({formatBytes(new Blob([json]).size)})
        </span>
      </button>

      {expanded && (
        <div className="relative">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(json)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: "oklch(92% 0.005 80)",
              color: "oklch(40% 0.01 80)",
            }}
          >
            Copy
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
