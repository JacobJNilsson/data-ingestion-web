"use client";

import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import type { SourceContract, DataContract, DataFlowStep, VerifyResult } from "@/types/contract";

export interface DestEntry {
  id: string;
  label: string;
  contract: SourceContract | DataContract | null;
  selectedSchemaIndices: number[];
  stepsBySchema: Record<number, DataFlowStep[]>;
  verifyResultBySchema: Record<number, VerifyResult | null>;
  notesBySchema: Record<number, string>;
}

interface DestinationListProps {
  destinations: DestEntry[];
  onDestChange: (id: string, contract: SourceContract | DataContract | null) => void;
  onSchemaToggle: (id: string, index: number) => void;
  onLabelChange: (id: string, label: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function DestinationList({
  destinations,
  onDestChange,
  onSchemaToggle,
  onLabelChange,
  onAdd,
  onRemove,
}: DestinationListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Destinations
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
          + Add Destination
        </button>
      </div>

      <div className="space-y-3">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="border rounded-lg p-3"
            style={{
              borderColor: "oklch(90% 0.005 80)",
              backgroundColor: "oklch(100% 0 0)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <input
                type="text"
                value={dest.label}
                onChange={(e) => onLabelChange(dest.id, e.target.value)}
                className="text-xs font-semibold px-2 py-1 border rounded bg-transparent"
                style={{
                  borderColor: "oklch(90% 0.005 80)",
                  color: "oklch(30% 0.01 80)",
                }}
                aria-label={`Label for destination ${dest.id}`}
              />
              {destinations.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(dest.id)}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ color: "oklch(55% 0.05 20)" }}
                  aria-label="Remove destination"
                >
                  Remove
                </button>
              )}
            </div>
            <AnalyzerPanel
              label={`dest-${dest.id}`}
              contract={dest.contract}
              selectedSchemaIndices={dest.selectedSchemaIndices}
              onContractChange={(c) => onDestChange(dest.id, c)}
              onSchemaToggle={(idx) => onSchemaToggle(dest.id, idx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
