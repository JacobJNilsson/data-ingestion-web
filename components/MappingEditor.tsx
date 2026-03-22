"use client";

import { useState } from "react";
import type { FieldMapping, VerifyResult, DestinationField } from "@/types/contract";
import { ConstraintBadge } from "@/components/badges";

// Delimiter for encoding ref+field in dropdown option values.
// Using null byte avoids collision with any user-typed label content.
export const REF_DELIM = "\x00";

// Extended mapping with stable ID for React keys.
export interface MappingRow extends FieldMapping {
  _id?: number;
}

// NamedSourceGroup pairs a source ref with its field names.
export interface NamedSourceGroup {
  ref: string;
  fieldNames: string[];
}

interface MappingEditorProps {
  mappings: MappingRow[];
  sourceGroups: NamedSourceGroup[];
  destFields: DestinationField[];
  onMappingsChange: (mappings: MappingRow[]) => void;
  onGenerate: () => void;
  onAISuggest?: () => void;
  onVerify: () => void;
  verifyResult: VerifyResult | null;
  loading: boolean;
  canGenerate: boolean;
  canAISuggest?: boolean;
  aiLoading?: boolean;
}

export function MappingEditor({
  mappings,
  sourceGroups,
  destFields,
  onMappingsChange,
  onGenerate,
  onAISuggest,
  onVerify,
  verifyResult,
  loading,
  canGenerate,
  canAISuggest,
  aiLoading,
}: MappingEditorProps) {
  const destFieldMap = new Map(destFields.map((f) => [f.name, f]));
  const hasMultipleSources = sourceGroups.length > 1;

  const updateMapping = (id: number, updates: Partial<MappingRow>) => {
    onMappingsChange(
      mappings.map((m) => {
        if (m._id !== id) return m;
        const updated = { ...m, ...updates };
        updated.user_edited = updated.source_type !== "unmapped";
        return updated;
      })
    );
  };

  const handleSourceChange = (id: number, value: string) => {
    if (value === "__null__") {
      updateMapping(id, { source_type: "null", source_ref: undefined, source_field: undefined, source_constant: undefined, source_fields: undefined, transform_description: undefined, confidence: 0 });
    } else if (value === "__constant__") {
      updateMapping(id, { source_type: "constant", source_ref: undefined, source_field: undefined, source_constant: "", source_fields: undefined, transform_description: undefined, confidence: 0 });
    } else if (value === "__transform__") {
      updateMapping(id, { source_type: "transform", source_ref: undefined, source_field: undefined, source_constant: undefined, source_fields: [], transform_description: "", confidence: 0 });
    } else if (value === "__unmapped__") {
      updateMapping(id, { source_type: "unmapped", source_ref: undefined, source_field: undefined, source_constant: undefined, source_fields: undefined, transform_description: undefined, confidence: 0 });
    } else {
      // value is "ref\x00field" (multi-source) or just "field" (single source)
      const delimIdx = value.indexOf(REF_DELIM);
      if (delimIdx >= 0) {
        const ref = value.substring(0, delimIdx);
        const field = value.substring(delimIdx + 1);
        updateMapping(id, { source_type: "field", source_ref: ref, source_field: field, source_constant: undefined, source_fields: undefined, transform_description: undefined });
      } else {
        updateMapping(id, { source_type: "field", source_ref: sourceGroups[0]?.ref, source_field: value, source_constant: undefined, source_fields: undefined, transform_description: undefined });
      }
    }
  };

  const selectValue = (m: MappingRow): string => {
    switch (m.source_type) {
      case "null": return "__null__";
      case "constant": return "__constant__";
      case "transform": return "__transform__";
      case "unmapped": return "__unmapped__";
      case "field": {
        if (hasMultipleSources && m.source_ref) {
          return `${m.source_ref}${REF_DELIM}${m.source_field ?? ""}`;
        }
        return m.source_field ?? "";
      }
      default: return "__unmapped__";
    }
  };

  const isAnyLoading = loading || (aiLoading ?? false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>
          Field Mappings
        </h3>
        <div className="flex gap-2">
          <button type="button" onClick={onGenerate} disabled={!canGenerate || isAnyLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: "oklch(35% 0.05 260)", color: "oklch(98% 0.005 80)" }}>
            {loading && !aiLoading ? "Working..." : "Generate"}
          </button>
          {onAISuggest && (
            <button type="button" onClick={onAISuggest} disabled={!canAISuggest || isAnyLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: "oklch(40% 0.08 280)", color: "oklch(98% 0.005 80)" }}>
              {aiLoading ? "Thinking..." : "AI Suggest"}
            </button>
          )}
          {mappings.length > 0 && (
            <button type="button" onClick={onVerify} disabled={isAnyLoading}
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
                const needsAttention = isRequired && m.source_type !== "field" && m.source_type !== "constant" && m.source_type !== "transform";

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
                        {m.user_edited && (
                          <span
                            className="text-[10px] px-1 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: "oklch(92% 0.02 260)",
                              color: "oklch(45% 0.08 260)",
                            }}
                            title="Manually edited — AI Suggest will preserve this mapping"
                          >
                            edited
                          </span>
                        )}
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
                      ) : m.source_type === "transform" ? (
                        <TransformInputs
                          mapping={m}
                          onFieldsChange={(fields) => updateMapping(m._id!, { source_fields: fields })}
                          onDescriptionChange={(desc) => updateMapping(m._id!, { transform_description: desc })}
                          onDismiss={() => handleSourceChange(m._id!, "__unmapped__")}
                        />
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
                          <option value="__transform__">Transform...</option>
                          <option disabled>───────</option>
                          {hasMultipleSources ? (
                            sourceGroups.map((group) => (
                              <optgroup key={group.ref} label={group.ref}>
                                {group.fieldNames.map((name) => (
                                  <option key={`${group.ref}${REF_DELIM}${name}`} value={`${group.ref}${REF_DELIM}${name}`}>
                                    {name}
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          ) : (
                            sourceGroups[0]?.fieldNames.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))
                          )}
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

// TransformInputs manages its own local text state for the source_fields
// comma-separated input. Parses to structured array on blur.
function TransformInputs({
  mapping,
  onFieldsChange,
  onDescriptionChange,
  onDismiss,
}: {
  mapping: MappingRow;
  onFieldsChange: (fields: { ref: string; field: string }[]) => void;
  onDescriptionChange: (desc: string) => void;
  onDismiss: () => void;
}) {
  const [fieldsText, setFieldsText] = useState(
    (mapping.source_fields ?? []).map((f) => f.ref ? `${f.ref}:${f.field}` : f.field).join(", ")
  );

  const commitFields = () => {
    const fields = fieldsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const colonIdx = s.indexOf(":");
        if (colonIdx > 0) {
          return { ref: s.substring(0, colonIdx), field: s.substring(colonIdx + 1) };
        }
        return { ref: "", field: s };
      });
    onFieldsChange(fields);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={fieldsText}
          onChange={(e) => setFieldsText(e.target.value)}
          onBlur={commitFields}
          placeholder="source:field_a, source:field_b"
          className="flex-1 px-2 py-1 border rounded font-mono text-xs"
          style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
          aria-label={`Source fields for ${mapping.destination_field}`}
        />
        <button type="button" onClick={onDismiss}
          className="text-xs px-1.5 py-1 rounded" style={{ color: "oklch(55% 0.01 80)" }}
          aria-label="Back to dropdown">×</button>
      </div>
      <input
        type="text"
        value={mapping.transform_description ?? ""}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe the transformation..."
        className="w-full px-2 py-1 border rounded text-xs"
        style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" }}
        aria-label={`Transform description for ${mapping.destination_field}`}
      />
    </div>
  );
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return "oklch(45% 0.1 140)";
  if (c >= 0.7) return "oklch(50% 0.08 80)";
  if (c >= 0.5) return "oklch(55% 0.08 50)";
  return "oklch(55% 0.08 20)";
}
