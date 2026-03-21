"use client";

import { useState } from "react";
import type { DataContract, SchemaContract, FieldConstraint } from "@/types/contract";
import { RawJSON } from "@/components/RawJSON";

interface DataContractDisplayProps {
  contract: DataContract;
}

export function DataContractDisplay({ contract }: DataContractDisplayProps) {
  const [expandedSchema, setExpandedSchema] = useState<string | null>(
    contract.schemas.length === 1 ? contract.schemas[0].name : null
  );

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-6"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          {contract.id}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Schemas" value={contract.schemas.length.toString()} />
          <StatCard
            label="Total Fields"
            value={contract.schemas
              .reduce((sum, s) => sum + s.fields.length, 0)
              .toLocaleString()}
          />
          <StatCard label="Namespace" value={typeof contract.metadata?.schema === "string" ? contract.metadata.schema : "public"} />
        </div>
      </section>

      {/* Schemas */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-6"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Schemas
        </h2>
        <div className="space-y-3">
          {contract.schemas.map((schema) => (
            <SchemaRow
              key={schema.name}
              schema={schema}
              expanded={expandedSchema === schema.name}
              onToggle={() =>
                setExpandedSchema(
                  expandedSchema === schema.name ? null : schema.name
                )
              }
            />
          ))}
        </div>
      </section>

      <RawJSON data={contract} />
    </div>
  );
}

function SchemaRow({
  schema,
  expanded,
  onToggle,
}: {
  schema: SchemaContract;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pkFields = schema.fields.filter((f) =>
    f.constraints?.some((c) => c.type === "primary_key")
  );
  const fkFields = schema.fields.filter((f) =>
    f.constraints?.some((c) => c.type === "foreign_key")
  );

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: "oklch(90% 0.005 80)" }}
    >
      {/* Table header — clickable */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ backgroundColor: expanded ? "oklch(97% 0.003 80)" : "oklch(100% 0 0)" }}
      >
        <div className="flex items-center gap-4">
          <span
            className="font-mono font-semibold"
            style={{ color: "oklch(20% 0.01 80)" }}
          >
            {schema.name}
          </span>
          <span className="text-xs" style={{ color: "oklch(50% 0.01 80)" }}>
            {schema.fields.length} fields
          </span>
          {schema.description && (
            <span className="text-xs truncate max-w-md" style={{ color: "oklch(50% 0.01 80)" }}>
              — {schema.description}
            </span>
          )}
          {pkFields.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "oklch(92% 0.02 260)", color: "oklch(40% 0.08 260)" }}
            >
              PK: {pkFields.map((f) => f.name).join(", ")}
            </span>
          )}
          {fkFields.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "oklch(92% 0.02 140)", color: "oklch(35% 0.08 140)" }}
            >
              {fkFields.length} FK
            </span>
          )}
        </div>
        <svg
          className="w-5 h-5 transition-transform"
          style={{
            color: "oklch(50% 0.01 80)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded: column detail table */}
      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: "oklch(92% 0.005 80)" }}
        >
          {/* Fields table */}
          <table className="w-full">
            <thead style={{ backgroundColor: "oklch(96% 0.005 80)" }}>
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Field</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Type</th>
                <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Nullable</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(45% 0.01 80)" }}>Constraints</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "oklch(93% 0.005 80)" }}>
              {schema.fields.map((field, idx) => (
                <tr
                  key={idx}
                  className="transition-colors"
                  style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "oklch(99% 0.002 80)" }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium" style={{ color: "oklch(25% 0.01 80)" }}>{field.name}</span>
                      {field.description && (
                        <span className="text-xs italic" style={{ color: "oklch(55% 0.01 80)" }}>{field.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3"><TypeBadge type={field.data_type} /></td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-xs font-medium" style={{ color: field.nullable ? "oklch(55% 0.01 80)" : "oklch(40% 0.08 20)" }}>
                      {field.nullable ? "yes" : "no"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {field.constraints?.map((c, i) => (<ConstraintBadge key={i} constraint={c} />))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* API metadata: request body and responses */}
          {schema.metadata && <EndpointMeta metadata={schema.metadata} />}
        </div>
      )}
    </div>
  );
}

function ConstraintBadge({ constraint }: { constraint: FieldConstraint }) {
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

function TypeBadge({ type }: { type: string }) {
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function EndpointMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const requestBody = isRecord(metadata.request_body) ? metadata.request_body : undefined;
  const responses = isRecord(metadata.responses) ? metadata.responses as Record<string, Record<string, unknown>> : undefined;
  const reqDesc = typeof requestBody?.description === "string" ? requestBody.description : undefined;

  if (!requestBody && !responses) return null;

  return (
    <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: "oklch(92% 0.005 80)" }}>
      {requestBody && (
        <div>
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "oklch(45% 0.01 80)" }}
          >
            Request Body
            {reqDesc && (
              <span className="font-normal normal-case tracking-normal ml-2" style={{ color: "oklch(55% 0.01 80)" }}>
                — {reqDesc}
              </span>
            )}
          </h4>
          {"example" in requestBody && (
            <div className="mb-2">
              <div className="text-xs mb-1" style={{ color: "oklch(50% 0.01 80)" }}>Example</div>
              <JSONBlock data={requestBody.example} />
            </div>
          )}
          {"schema" in requestBody && (
            <div>
              <div className="text-xs mb-1" style={{ color: "oklch(50% 0.01 80)" }}>Schema</div>
              <JSONBlock data={requestBody.schema} maxHeight="300px" />
            </div>
          )}
        </div>
      )}

      {responses && Object.keys(responses).length > 0 && (
        <div>
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "oklch(45% 0.01 80)" }}
          >
            Responses
          </h4>
          <div className="space-y-3">
            {Object.entries(responses)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, resp]) => (
                <div key={code} className="border-l-2 pl-4" style={{ borderColor: statusColor(code) }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: statusBg(code), color: statusColor(code) }}
                    >
                      {code}
                    </span>
                    {typeof resp.description === "string" && (
                      <span className="text-xs" style={{ color: "oklch(50% 0.01 80)" }}>
                        {resp.description}
                      </span>
                    )}
                  </div>
                  {"example" in resp && (
                    <div className="mb-2">
                      <div className="text-xs mb-1" style={{ color: "oklch(50% 0.01 80)" }}>Example</div>
                      <JSONBlock data={resp.example} />
                    </div>
                  )}
                  {"schema" in resp && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: "oklch(50% 0.01 80)" }}>Schema</div>
                      <JSONBlock data={resp.schema} maxHeight="300px" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JSONBlock({ data, maxHeight }: { data: unknown; maxHeight?: string }) {
  return (
    <pre
      className="overflow-auto p-3 rounded border font-mono text-xs"
      style={{
        borderColor: "oklch(90% 0.005 80)",
        backgroundColor: "oklch(99% 0.002 80)",
        color: "oklch(30% 0.01 80)",
        maxHeight: maxHeight ?? "none",
      }}
    >
      {JSON.stringify(data, null, 2) ?? "null"}
    </pre>
  );
}

function statusColor(code: string): string {
  if (code.startsWith("2")) return "oklch(45% 0.1 140)";
  if (code.startsWith("3")) return "oklch(50% 0.08 260)";
  if (code.startsWith("4")) return "oklch(55% 0.1 50)";
  if (code.startsWith("5")) return "oklch(50% 0.1 20)";
  return "oklch(50% 0.01 80)";
}

function statusBg(code: string): string {
  if (code.startsWith("2")) return "oklch(95% 0.02 140)";
  if (code.startsWith("3")) return "oklch(95% 0.02 260)";
  if (code.startsWith("4")) return "oklch(95% 0.02 50)";
  if (code.startsWith("5")) return "oklch(95% 0.02 20)";
  return "oklch(95% 0.005 80)";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "oklch(90% 0.005 80)" }}>
      <div
        className="text-xs uppercase tracking-wider mb-2"
        style={{ color: "oklch(50% 0.01 80)" }}
      >
        {label}
      </div>
      <div
        className="font-mono font-bold text-lg"
        style={{ color: "oklch(20% 0.01 80)" }}
      >
        {value}
      </div>
    </div>
  );
}
