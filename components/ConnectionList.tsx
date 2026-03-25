"use client";

import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import type { SourceContract, DataContract, ConnectionRole, ConnectionEntry } from "@/types/contract";

const ROLE_COLORS: Record<ConnectionRole, { bg: string; text: string }> = {
  source: { bg: "oklch(95% 0.02 140)", text: "oklch(35% 0.08 140)" },
  destination: { bg: "oklch(95% 0.02 20)", text: "oklch(35% 0.08 20)" },
  both: { bg: "oklch(95% 0.02 260)", text: "oklch(35% 0.08 260)" },
};

interface ConnectionListProps {
  connections: ConnectionEntry[];
  onConnectionChange: (id: string, contract: SourceContract | DataContract | null) => void;
  onSchemaToggle: (id: string, index: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onRoleChange: (id: string, role: ConnectionRole) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function ConnectionList({
  connections,
  onConnectionChange,
  onSchemaToggle,
  onLabelChange,
  onRoleChange,
  onAdd,
  onRemove,
}: ConnectionListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Connections
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ backgroundColor: "oklch(95% 0.01 80)", color: "oklch(35% 0.01 80)" }}
        >
          + Add Connection
        </button>
      </div>

      <div className="space-y-3">
        {connections.map((conn) => {
          const roleColors = ROLE_COLORS[conn.role];
          return (
            <div
              key={conn.id}
              className="border rounded-lg p-3"
              style={{ borderColor: "oklch(90% 0.005 80)", backgroundColor: "oklch(100% 0 0)" }}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <input
                  type="text"
                  value={conn.label}
                  onChange={(e) => onLabelChange(conn.id, e.target.value)}
                  className="text-xs font-semibold px-2 py-1 border rounded bg-transparent flex-1 min-w-[120px]"
                  style={{ borderColor: "oklch(90% 0.005 80)", color: "oklch(30% 0.01 80)" }}
                  aria-label={`Label for connection ${conn.id}`}
                />
                <select
                  value={conn.role}
                  onChange={(e) => onRoleChange(conn.id, e.target.value as ConnectionRole)}
                  className="text-xs px-2 py-1 border rounded font-medium"
                  style={{ borderColor: "oklch(90% 0.005 80)", backgroundColor: roleColors.bg, color: roleColors.text }}
                  aria-label="Connection role"
                >
                  <option value="source">Source</option>
                  <option value="destination">Destination</option>
                  <option value="both">Both</option>
                </select>
                {connections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(conn.id)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: "oklch(55% 0.05 20)" }}
                    aria-label="Remove connection"
                  >
                    Remove
                  </button>
                )}
              </div>
              <AnalyzerPanel
                label={`conn-${conn.id}`}
                contract={conn.contract}
                selectedSchemaIndices={conn.selectedSchemaIndices}
                onContractChange={(c) => onConnectionChange(conn.id, c)}
                onSchemaToggle={(idx) => onSchemaToggle(conn.id, idx)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
