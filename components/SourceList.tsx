"use client";

import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import type { SourceContract, DataContract } from "@/types/contract";

export interface SourceEntry {
  id: string;
  label: string;
  contract: SourceContract | DataContract | null;
  schemaIndex: number;
}

interface SourceListProps {
  sources: SourceEntry[];
  onSourceChange: (id: string, contract: SourceContract | DataContract | null) => void;
  onSchemaSelect: (id: string, index: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function SourceList({
  sources,
  onSourceChange,
  onSchemaSelect,
  onLabelChange,
  onAdd,
  onRemove,
}: SourceListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Sources
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{
            backgroundColor: "oklch(95% 0.01 80)",
            color: "oklch(35% 0.01 80)",
          }}
        >
          + Add Source
        </button>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="border rounded-lg p-3"
            style={{
              borderColor: "oklch(90% 0.005 80)",
              backgroundColor: "oklch(100% 0 0)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <input
                type="text"
                value={source.label}
                onChange={(e) => onLabelChange(source.id, e.target.value)}
                className="text-xs font-semibold px-2 py-1 border rounded bg-transparent"
                style={{
                  borderColor: "oklch(90% 0.005 80)",
                  color: "oklch(30% 0.01 80)",
                }}
                aria-label={`Label for source ${source.id}`}
              />
              {sources.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(source.id)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: "oklch(55% 0.05 20)" }}
                  aria-label="Remove source"
                >
                  Remove
                </button>
              )}
            </div>
            <AnalyzerPanel
              label={`source-${source.id}`}
              contract={source.contract}
              selectedSchemaIndex={source.schemaIndex}
              onContractChange={(c) => onSourceChange(source.id, c)}
              onSchemaSelect={(idx) => onSchemaSelect(source.id, idx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
