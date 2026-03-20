"use client";

import { useCallback, useState } from "react";

interface SupabaseFormProps {
  onSubmit: (projectURL: string, apiKey: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SupabaseForm({ onSubmit, loading, disabled }: SupabaseFormProps) {
  const [projectURL, setProjectURL] = useState("");
  const [apiKey, setAPIKey] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || !projectURL.trim() || !apiKey.trim()) return;
      onSubmit(projectURL.trim(), apiKey.trim());
    },
    [onSubmit, projectURL, apiKey, disabled]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="w-full border rounded-lg p-6"
        style={{ borderColor: "oklch(85% 0.005 80)", backgroundColor: "oklch(100% 0 0)" }}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="supa-url"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              Project URL
            </label>
            <input
              id="supa-url"
              type="text"
              value={projectURL}
              onChange={(e) => setProjectURL(e.target.value)}
              placeholder="https://your-project.supabase.co"
              disabled={disabled}
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "oklch(85% 0.005 80)",
                color: "oklch(20% 0.01 80)",
                backgroundColor: "oklch(99% 0.002 80)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="supa-key"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              API Key
            </label>
            <input
              id="supa-key"
              type="password"
              value={apiKey}
              onChange={(e) => setAPIKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              disabled={disabled}
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "oklch(85% 0.005 80)",
                color: "oklch(20% 0.01 80)",
                backgroundColor: "oklch(99% 0.002 80)",
              }}
            />
            <p className="mt-2 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>
              Use the <code className="font-mono">anon</code> key for public tables or{" "}
              <code className="font-mono">service_role</code> key for full access.
              Keys are sent to the API for analysis and are not stored.
            </p>
          </div>
          <button
            type="submit"
            disabled={disabled || !projectURL.trim() || !apiKey.trim()}
            className="px-6 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "oklch(35% 0.05 260)",
              color: "oklch(98% 0.005 80)",
            }}
          >
            {loading ? "Analyzing..." : "Analyze Database"}
          </button>
        </div>
      </div>
    </form>
  );
}
