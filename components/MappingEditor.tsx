"use client";

import type { FieldMapping, VerifyResult, DestinationField } from "@/types/contract";
import { ConstraintBadge } from "@/components/badges";

// Extended mapping with stable ID for React keys.
export interface MappingRow extends FieldMapping {
  _id?: number;
}

interface MappingEditorProps {
  mappings: MappingRow[];
  sourceFieldNames: string[];
  destFields: DestinationField[];
  onMappingsChange: (mappings: MappingRow[]) => void;
  onGenerate: () => void;
  onVerify: () => void;
  verifyResult: VerifyResult | null;
  loading: boolean;
  canGenerate: boolean;
}

export function MappingEditor({
  mappings,
  sourceFieldNames,
  destFields,
  onMappingsChange,
  onGenerate,
  onVerify,
  verifyResult,
  loading,
  canGenerate,
}: MappingEditorProps) {
  const destFieldMap = new Map(destFields.map((f) => [f.name, f]));

  const updateMapping = (id: number, updates: Partial<MappingRow>) => {
    onMappingsChange(mappings.map((m) => (m._id === id ? { ...m, ...updates } : m)));
  };

  const handleSourceChange = (id: number, value: string) => {
    if (value === "__null__") {
      updateMapping(id, { source_type: "null", source_field: undefined, source_constant: undefined, confidence: 0 });
    } else if (value === "__constant__") {
      updateMapping(id, { source_type: "constant", source_field: undefined, source_constant: "", confidence: 0 });
    } else if (value === "__unmapped__") {
      updateMapping(id, { source_type: "unmapped", source_field: undefined, source_constant: undefined, confidence: 0 });
    } else {
      updateMapping(id, { source_type: "field", source_field: value, source_constant: undefined });
    }
  };

  const selectValue = (m: MappingRow): string => {
    switch (m.source_type) {
      case "null": return "__null__";
      case "constant": return "__constant__";
      case "unmapped": return "__unmapped__";
      case "field": return m.source_field ?? "";
      default: return "__unmapped__";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>
          Field Mappings
        </h3>
        <div className="flex gap-2">
          <button type="button" onClick={onGenerate} disabled={!canGenerate || loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: "oklch(35% 0.05 260)", color: "oklch(98% 0.005 80)" }}>
            {loading ? "Working..." : "Generate"}
          </button>
          {mappings.length > 0 && (
            <button type="button" onClick={onVerify} disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40"
              style={{ borderColor: "oklch(80% 0.005 80)", color: "oklch(35% 0.01 80)" }}>
              Verify
            </button>
          )}
        </div>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div className="mb-4 p-3 rounded-lg border-l-4 text-sm" style={{
          borderColor: verifyResult.valid ? "oklch(50% 0.1 140)" : "oklch(55% 0.15 20)",
          backgroundColor: verifyResult.valid ? "oklch(97% 0.02 140)" : "oklch(95% 0.02 20)",
          color: verifyResult.valid ? "oklch(30% 0.08 140)" : "oklch(35% 0.08 20)",
        }}>
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
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "oklch(90% 0.005 80)" }}>
          <table className="w-full">
            <thead style={{ backgroundColor: "oklch(96% 0.005 80)" }}>
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Destination</th>
                <th className="px-2 py-2 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>←</th>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Source</th>
                <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Transform</th>
                <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Conf.</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "oklch(93% 0.005 80)" }}>
              {mappings.map((m, idx) => {
                const destField = destFieldMap.get(m.destination_field);
                const isRequired = destField ? !destField.nullable : false;
                const needsAttention = isRequired && m.source_type !== "field" && m.source_type !== "constant";

                return (
                  <tr key={m._id ?? idx} style={{
                    backgroundColor: needsAttention
                      ? "oklch(97% 0.02 30)"
                      : idx % 2 === 0 ? "transparent" : "oklch(99% 0.002 80)",
                  }}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-medium" style={{ color: "oklch(25% 0.01 80)" }}>
                          {m.destination_field}
                        </span>
                        {destField?.constraints?.map((c, i) => (
                          <ConstraintBadge key={i} constraint={c} />
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-xs" style={{ color: "oklch(55% 0.01 80)" }}>←</td>
                    <td className="px-4 py-2">
                      {m.source_type === "constant" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={m.source_constant ?? ""}
                            onChange={(e) => updateMapping(m._id!, { source_constant: e.target.value })}
                            placeholder="Enter value..."
                            className="flex-1 px-2 py-1 border rounded font-mono text-xs"
                            style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
                            aria-label={`Constant value for ${m.destination_field}`}
                          />
                          <button type="button" onClick={() => handleSourceChange(m._id!, "__unmapped__")}
                            className="text-xs px-1.5 py-1 rounded" style={{ color: "oklch(55% 0.01 80)" }}
                            aria-label="Back to dropdown">×</button>
                        </div>
                      ) : (
                        <select
                          value={selectValue(m)}
                          onChange={(e) => handleSourceChange(m._id!, e.target.value)}
                          className="w-full px-2 py-1 border rounded font-mono text-xs"
                          style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
                          aria-label={`Source for ${m.destination_field}`}
                        >
                          <option value="__unmapped__">(unmapped)</option>
                          <option value="__null__">NULL</option>
                          <option value="__constant__">Constant value...</option>
                          <option disabled>───────</option>
                          {sourceFieldNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {m.transformation ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: "oklch(92% 0.02 260)", color: "oklch(40% 0.08 260)" }}>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: "oklch(85% 0.005 80)" }}>
          <p className="text-sm mb-2" style={{ color: "oklch(50% 0.01 80)" }}>
            {canGenerate ? "Click Generate to suggest field mappings" : "Analyze both source and destination first"}
          </p>
        </div>
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
