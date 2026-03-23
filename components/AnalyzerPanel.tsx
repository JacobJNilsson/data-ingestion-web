"use client";

import { useState } from "react";
import { CSVUpload } from "@/components/CSVUpload";
import { FileUpload } from "@/components/FileUpload";
import { PostgresForm } from "@/components/PostgresForm";
import { SupabaseForm } from "@/components/SupabaseForm";
import { APISpecForm } from "@/components/APISpecForm";
import { CompactSummary } from "@/components/CompactSummary";
import { API_BASE } from "@/lib/constants";
import type { SourceContract, DataContract } from "@/types/contract";

export type AnalyzerType = "csv" | "json" | "excel" | "api" | "postgresql" | "supabase";

interface AnalyzerPanelProps {
  label: string;
  contract: SourceContract | DataContract | null;
  selectedSchemaIndices: number[];
  onContractChange: (contract: SourceContract | DataContract | null) => void;
  onSchemaToggle: (index: number) => void;
}

export function AnalyzerPanel({ label, contract, selectedSchemaIndices, onContractChange, onSchemaToggle }: AnalyzerPanelProps) {
  const [type, setType] = useState<AnalyzerType>("csv");
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const handleTypeChange = (newType: AnalyzerType) => {
    setType(newType);
    onContractChange(null);
    setPanelError("");
  };

  const analyzeFile = async (file: File, endpoint: string) => {
    setLoading(true);
    setPanelError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: formData });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      onContractChange(await resp.json());
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeEndpoint = async (body: Record<string, unknown>, endpoint: string) => {
    setLoading(true);
    setPanelError("");
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const respBody = await resp.json().catch(() => null);
        throw new Error(respBody?.error || `API error: ${resp.status}`);
      }
      onContractChange(await resp.json());
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const isMultiSchema = contract && "schemas" in contract && "id" in contract
    && (contract as DataContract).schemas.length > 1;
  const schemas = isMultiSchema ? (contract as DataContract).schemas : null;

  const selectId = `${label.toLowerCase()}-type-select`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label
          htmlFor={selectId}
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          {label}
        </label>
        <select
          id={selectId}
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as AnalyzerType)}
          className="px-3 py-1.5 border rounded text-sm font-medium"
          style={{
            borderColor: "oklch(85% 0.005 80)",
            color: "oklch(30% 0.01 80)",
            backgroundColor: "oklch(100% 0 0)",
          }}
        >
          <option value="csv">CSV</option>
          <option value="json">JSON / NDJSON</option>
          <option value="excel">Excel (.xlsx)</option>
          <option value="api">API (OpenAPI / Swagger)</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="supabase">Supabase</option>
        </select>
      </div>

      {/* Panel error */}
      {panelError && (
        <div
          className="mb-4 p-3 border-l-4 rounded-r flex items-start justify-between text-sm"
          style={{ backgroundColor: "oklch(95% 0.02 20)", borderColor: "oklch(55% 0.15 20)" }}
        >
          <p style={{ color: "oklch(35% 0.08 20)" }}>{panelError}</p>
          <button
            type="button"
            onClick={() => setPanelError("")}
            className="ml-2 px-1"
            style={{ color: "oklch(50% 0.05 20)" }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {contract ? (
        <div
          className="border rounded-lg p-4"
          style={{ borderColor: "oklch(85% 0.005 80)", backgroundColor: "oklch(100% 0 0)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "oklch(45% 0.1 140)" }}
            >
              Analyzed
            </span>
            <button
              type="button"
              onClick={() => onContractChange(null)}
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ color: "oklch(50% 0.01 80)" }}
            >
              Clear
            </button>
          </div>

          {/* Schema checkboxes for multi-schema contracts */}
          {schemas && (
            <div className="mb-3">
              <p
                className="text-xs mb-2"
                style={{ color: "oklch(50% 0.01 80)" }}
              >
                Select schemas to use
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {schemas.map((s, i) => {
                  const checked = selectedSchemaIndices.includes(i);
                  return (
                    <label
                      key={i}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm"
                      style={{
                        backgroundColor: checked ? "oklch(95% 0.02 260)" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onSchemaToggle(i)}
                        className="rounded"
                      />
                      <span
                        className="font-mono text-xs"
                        style={{ color: "oklch(25% 0.01 80)" }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "oklch(55% 0.01 80)" }}
                      >
                        ({s.fields.length} fields)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary: show the first selected schema */}
          <CompactSummary
            contract={contract}
            selectedSchemaIndex={selectedSchemaIndices[0] ?? 0}
          />
        </div>
      ) : (
        <div>
          {type === "csv" && (
            <CSVUpload
              onFileUpload={(f) => analyzeFile(f, "/api/v1/analyze")}
              loading={loading}
              disabled={loading}
            />
          )}
          {type === "json" && (
            <FileUpload
              onFileUpload={(f) => analyzeFile(f, "/api/v1/analyze-json")}
              loading={loading}
              disabled={loading}
              accept=".json,.ndjson,.jsonl,application/json"
              label="Upload JSON or NDJSON"
              hint=".json / .ndjson / .jsonl files"
              id={`${label.toLowerCase()}-json-upload`}
            />
          )}
          {type === "excel" && (
            <FileUpload
              onFileUpload={(f) => analyzeFile(f, "/api/v1/analyze-excel")}
              loading={loading}
              disabled={loading}
              accept=".xlsx,.xlsm,.xltx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              label="Upload Excel Spreadsheet"
              hint=".xlsx / .xlsm / .xltx files"
              id={`${label.toLowerCase()}-excel-upload`}
            />
          )}
          {type === "api" && (
            <APISpecForm
              onSubmit={(url) => analyzeEndpoint({ spec_url: url }, "/api/v1/analyze-api")}
              loading={loading}
              disabled={loading}
            />
          )}
          {type === "postgresql" && (
            <PostgresForm
              onSubmit={(conn, schema) =>
                analyzeEndpoint({ connection_string: conn, schema }, "/api/v1/analyze-destination")
              }
              loading={loading}
              disabled={loading}
            />
          )}
          {type === "supabase" && (
            <SupabaseForm
              onSubmit={(url, key) =>
                analyzeEndpoint({ project_url: url, api_key: key }, "/api/v1/analyze-supabase")
              }
              loading={loading}
              disabled={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
