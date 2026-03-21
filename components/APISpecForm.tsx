"use client";

import { useCallback, useState } from "react";

interface APISpecFormProps {
  onSubmit: (specURL: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function APISpecForm({ onSubmit, loading, disabled }: APISpecFormProps) {
  const [specURL, setSpecURL] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || !specURL.trim()) return;
      onSubmit(specURL.trim());
    },
    [onSubmit, specURL, disabled]
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
              htmlFor="api-spec-url"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              OpenAPI Spec URL
            </label>
            <input
              id="api-spec-url"
              type="text"
              value={specURL}
              onChange={(e) => setSpecURL(e.target.value)}
              placeholder="https://petstore.swagger.io/v2/swagger.json"
              disabled={disabled}
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "oklch(85% 0.005 80)",
                color: "oklch(20% 0.01 80)",
                backgroundColor: "oklch(99% 0.002 80)",
              }}
            />
            <p className="mt-2 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>
              URL to an OpenAPI 3.x or Swagger 2.0 JSON spec
            </p>
          </div>
          <button
            type="submit"
            disabled={disabled || !specURL.trim()}
            className="px-6 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "oklch(35% 0.05 260)",
              color: "oklch(98% 0.005 80)",
            }}
          >
            {loading ? "Analyzing..." : "Analyze API"}
          </button>
        </div>
      </div>
    </form>
  );
}
