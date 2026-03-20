"use client";

import { useCallback, useState } from "react";

interface PostgresFormProps {
  onSubmit: (connectionString: string, schema: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PostgresForm({ onSubmit, loading, disabled }: PostgresFormProps) {
  const [connectionString, setConnectionString] = useState("");
  const [schema, setSchema] = useState("public");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || !connectionString.trim()) return;
      onSubmit(connectionString.trim(), schema.trim() || "public");
    },
    [onSubmit, connectionString, schema, disabled]
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
              htmlFor="pg-conn"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              Connection string
            </label>
            <input
              id="pg-conn"
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="postgres://user:password@host:5432/database"
              disabled={disabled}
              className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "oklch(85% 0.005 80)",
                color: "oklch(20% 0.01 80)",
                backgroundColor: "oklch(99% 0.002 80)",
              }}
            />
            <p className="mt-2 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>
              Connection strings are sent to the API for analysis and are not stored.
            </p>
          </div>
          <div>
            <label
              htmlFor="pg-schema"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              Schema
            </label>
            <input
              id="pg-schema"
              type="text"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder="public"
              disabled={disabled}
              className="w-full max-w-xs px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "oklch(85% 0.005 80)",
                color: "oklch(20% 0.01 80)",
                backgroundColor: "oklch(99% 0.002 80)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !connectionString.trim()}
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
