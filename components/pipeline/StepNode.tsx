"use client";

import { Handle, Position } from "@xyflow/react";
import type { PipelineStepType } from "@/types/contract";

const STEP_ICONS: Record<PipelineStepType, string> = {
  source: "📥",
  mapping: "🔀",
  api_call: "🌐",
  manual_label: "✏️",
  llm_classify: "🤖",
  lookup: "🔍",
  destination: "📤",
};

const STEP_COLORS: Record<PipelineStepType, { bg: string; border: string; text: string }> = {
  source:       { bg: "oklch(95% 0.02 140)", border: "oklch(80% 0.05 140)", text: "oklch(30% 0.08 140)" },
  mapping:      { bg: "oklch(95% 0.02 260)", border: "oklch(80% 0.05 260)", text: "oklch(30% 0.08 260)" },
  api_call:     { bg: "oklch(95% 0.02 200)", border: "oklch(80% 0.05 200)", text: "oklch(30% 0.08 200)" },
  manual_label: { bg: "oklch(95% 0.02 50)",  border: "oklch(80% 0.05 50)",  text: "oklch(30% 0.08 50)" },
  llm_classify: { bg: "oklch(95% 0.02 280)", border: "oklch(80% 0.05 280)", text: "oklch(30% 0.08 280)" },
  lookup:       { bg: "oklch(95% 0.02 170)", border: "oklch(80% 0.05 170)", text: "oklch(30% 0.08 170)" },
  destination:  { bg: "oklch(95% 0.02 20)",  border: "oklch(80% 0.05 20)",  text: "oklch(30% 0.08 20)" },
};

export interface StepNodeData extends Record<string, unknown> {
  label: string;
  stepType: PipelineStepType;
  selected?: boolean;
  onDelete?: () => void;
}

export function StepNode({ data }: { data: StepNodeData }) {
  const colors = STEP_COLORS[data.stepType] ?? STEP_COLORS.mapping;
  const icon = STEP_ICONS[data.stepType] ?? "⬜";
  const isSourceOrDest = data.stepType === "source" || data.stepType === "destination";

  return (
    <div
      className="rounded-lg border-2 px-4 py-3 min-w-[160px] shadow-sm"
      style={{
        backgroundColor: colors.bg,
        borderColor: data.selected ? "oklch(45% 0.1 260)" : colors.border,
        borderWidth: data.selected ? 2 : 1,
      }}
    >
      {/* Input handle (not on source steps) */}
      {data.stepType !== "source" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 10,
            height: 10,
            backgroundColor: "oklch(70% 0.01 80)",
            border: "2px solid oklch(90% 0.005 80)",
          }}
        />
      )}

      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <div>
          <div
            className="text-xs font-semibold"
            style={{ color: colors.text }}
          >
            {data.label}
          </div>
          <div
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "oklch(55% 0.01 80)" }}
          >
            {data.stepType.replace("_", " ")}
          </div>
        </div>
        {!isSourceOrDest && data.onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.();
            }}
            className="ml-auto text-xs px-1 rounded"
            style={{ color: "oklch(60% 0.05 20)" }}
            aria-label="Delete step"
          >
            ×
          </button>
        )}
      </div>

      {/* Output handle (not on destination steps) */}
      {data.stepType !== "destination" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 10,
            height: 10,
            backgroundColor: "oklch(70% 0.01 80)",
            border: "2px solid oklch(90% 0.005 80)",
          }}
        />
      )}
    </div>
  );
}
