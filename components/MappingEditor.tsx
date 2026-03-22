"use client";

import type { FieldMapping, VerifyResult } from "@/types/contract";

// Extended mapping with stable ID for React keys.
export interface MappingRow extends FieldMapping {
  _id?: number;
}

let nextId = 1;

interface MappingEditorProps {
  mappings: MappingRow[];
  destFieldNames: string[];
  onMappingsChange: (mappings: MappingRow[]) => void;
  onGenerate: () => void;
  onVerify: () => void;
  verifyResult: VerifyResult | null;
  loading: boolean;
  canGenerate: boolean;
}

export function MappingEditor({
  mappings,
  destFieldNames,
  onMappingsChange,
  onGenerate,
  onVerify,
  verifyResult,
  loading,
  canGenerate,
}: MappingEditorProps) {
  const updateMapping = (id: number, updates: Partial<FieldMapping>) => {
    const updated = mappings.map((m) =>
      m._id === id ? { ...m, ...updates } : m
    );
    onMappingsChange(updated);
  };

  const removeMapping = (id: number) => {
    onMappingsChange(mappings.filter((m) => m._id !== id));
  };

  const addMapping = () => {
    onMappingsChange([
      ...mappings,
      { source_field: "", destination_field: "", confidence: 0, _id: nextId++ },
    ]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Field Mappings
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: "oklch(35% 0.05 260)", color: "oklch(98% 0.005 80)" }}
          >
            {loading ? "Working..." : "Generate"}
          </button>
          {mappings.length > 0 && (
            <button
              type="button"
              onClick={onVerify}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40"
              style={{ borderColor: "oklch(80% 0.005 80)", color: "oklch(35% 0.01 80)" }}
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div
          className="mb-4 p-3 rounded-lg border-l-4 text-sm"
          style={{
            borderColor: verifyResult.valid ? "oklch(50% 0.1 140)" : "oklch(55% 0.15 20)",
            backgroundColor: verifyResult.valid ? "oklch(97% 0.02 140)" : "oklch(95% 0.02 20)",
            color: verifyResult.valid ? "oklch(30% 0.08 140)" : "oklch(35% 0.08 20)",
          }}
        >
          <span className="font-semibold">{verifyResult.valid ? "Valid" : "Invalid"}</span>
          {verifyResult.issues && verifyResult.issues.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {verifyResult.issues.map((issue, i) => (
                <li key={i} className="text-xs">• {issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Mapping table */}
      {mappings.length > 0 ? (
        <div
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: "oklch(90% 0.005 80)" }}
        >
          <table className="w-full">
            <thead style={{ backgroundColor: "oklch(96% 0.005 80)" }}>
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Source</th>
                <th className="px-2 py-2 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>→</th>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Destination</th>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Transform</th>
                <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Conf.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "oklch(93% 0.005 80)" }}>
              {mappings.map((m, idx) => (
                <tr key={m._id ?? idx} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "oklch(99% 0.002 80)" }}>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={m.source_field}
                      onChange={(e) => updateMapping(m._id!, { source_field: e.target.value })}
                      className="w-full px-2 py-1 border rounded font-mono text-xs"
                      style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
                      aria-label={`Source field for mapping ${idx + 1}`}
                    />
                  </td>
                  <td className="px-2 py-2 text-center text-xs" style={{ color: "oklch(55% 0.01 80)" }}>→</td>
                  <td className="px-4 py-2">
                    {destFieldNames.length > 0 ? (
                      <select
                        value={m.destination_field}
                        onChange={(e) => updateMapping(m._id!, { destination_field: e.target.value })}
                        className="w-full px-2 py-1 border rounded font-mono text-xs"
                        style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
                        aria-label={`Destination field for mapping ${idx + 1}`}
                      >
                        <option value="">Select field...</option>
                        {destFieldNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={m.destination_field}
                        onChange={(e) => updateMapping(m._id!, { destination_field: e.target.value })}
                        className="w-full px-2 py-1 border rounded font-mono text-xs"
                        style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
                        aria-label={`Destination field for mapping ${idx + 1}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {m.transformation ? (
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: "oklch(92% 0.02 260)", color: "oklch(40% 0.08 260)" }}
                      >
                        {m.transformation.type}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "oklch(65% 0.01 80)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-mono text-xs" style={{ color: confidenceColor(m.confidence ?? 0) }}>
                      {(m.confidence ?? 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeMapping(m._id!)}
                      className="text-xs p-1 rounded transition-colors"
                      style={{ color: "oklch(55% 0.01 80)" }}
                      aria-label={`Remove mapping ${idx + 1}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          style={{ borderColor: "oklch(85% 0.005 80)" }}
        >
          <p className="text-sm mb-2" style={{ color: "oklch(50% 0.01 80)" }}>
            {canGenerate
              ? "Click Generate to suggest field mappings"
              : "Analyze both source and destination first"}
          </p>
        </div>
      )}

      {/* Add mapping button */}
      {mappings.length > 0 && (
        <button
          type="button"
          onClick={addMapping}
          className="mt-2 text-xs font-medium px-3 py-1.5 rounded border transition-colors"
          style={{ borderColor: "oklch(85% 0.005 80)", color: "oklch(45% 0.01 80)" }}
        >
          + Add mapping
        </button>
      )}
    </div>
  );
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return "oklch(45% 0.1 140)";
  if (c >= 0.7) return "oklch(50% 0.08 80)";
  if (c >= 0.5) return "oklch(55% 0.08 50)";
  return "oklch(55% 0.08 20)";
}
