"use client";

import type { PipelineStepType } from "@/types/contract";

const STEP_OPTIONS: { type: PipelineStepType; label: string; description: string }[] = [
  { type: "source", label: "Source", description: "Load data from a file, API, or database" },
  { type: "mapping", label: "Map Fields", description: "Transform fields between schemas" },
  { type: "api_call", label: "API Call", description: "Send data to an API endpoint" },
  { type: "manual_label", label: "Manual Label", description: "Pause for human labeling" },
  { type: "llm_classify", label: "LLM Classify", description: "AI-powered field classification" },
  { type: "lookup", label: "Lookup", description: "Enrich data from another source" },
  { type: "destination", label: "Destination", description: "Write data to a target system" },
];

interface StepPaletteProps {
  onAddStep: (type: PipelineStepType) => void;
}

export function StepPalette({ onAddStep }: StepPaletteProps) {
  return (
    <div
      className="border rounded-lg p-3"
      style={{
        borderColor: "oklch(90% 0.005 80)",
        backgroundColor: "oklch(99% 0.002 80)",
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "oklch(45% 0.01 80)" }}
      >
        Add Step
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {STEP_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onAddStep(opt.type)}
            className="text-left px-2.5 py-2 rounded-md border transition-colors"
            style={{
              borderColor: "oklch(92% 0.005 80)",
              backgroundColor: "oklch(100% 0 0)",
            }}
          >
            <div
              className="text-xs font-semibold"
              style={{ color: "oklch(30% 0.01 80)" }}
            >
              {opt.label}
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: "oklch(55% 0.01 80)" }}
            >
              {opt.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
