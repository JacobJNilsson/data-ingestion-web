"use client";

import { useState } from "react";
import type {
  DataFlowStep,
  DataFlowStepType,
  ManualLabelConfig,
  LLMClassifyConfig,
  LookupConfig,
  CaptureResponseConfig,
} from "@/types/contract";

const STEP_TYPE_LABELS: Record<DataFlowStepType, string> = {
  manual_label: "Manual Label",
  llm_classify: "LLM Classify",
  lookup: "Lookup",
  capture_response: "Capture Response",
};

function defaultConfig(type: DataFlowStepType): DataFlowStep["config"] {
  switch (type) {
    case "manual_label":
      return { field: "", options: [], instructions: "", allow_custom: false };
    case "llm_classify":
      return { field: "", categories: [], prompt: "", model: "gpt-4o-mini" };
    case "lookup":
      return { source_ref: "", key_field: "", value_field: "" };
    case "capture_response":
      return { fields: [] };
  }
}

interface DataFlowStepsProps {
  label: string;
  steps: DataFlowStep[];
  onChange: (steps: DataFlowStep[]) => void;
}

export function DataFlowSteps({ label, steps, onChange }: DataFlowStepsProps) {
  const [expanded, setExpanded] = useState(steps.length > 0);

  const addStep = (type: DataFlowStepType) => {
    onChange([...steps, { type, config: defaultConfig(type), notes: "" }]);
    setExpanded(true);
  };

  const updateStep = (index: number, updates: Partial<DataFlowStep>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: "oklch(92% 0.005 80)",
        backgroundColor: "oklch(99.5% 0.002 80)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "oklch(50% 0.01 80)" }}
        >
          {label} ({steps.length})
        </span>
        <svg
          className="w-3.5 h-3.5 transition-transform"
          style={{
            color: "oklch(55% 0.01 80)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="border rounded p-3 space-y-2"
              style={{ borderColor: "oklch(90% 0.005 80)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "oklch(35% 0.01 80)" }}
                >
                  {STEP_TYPE_LABELS[step.type]}
                </span>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: "oklch(55% 0.05 20)" }}
                >
                  Remove
                </button>
              </div>

              <StepConfigEditor
                step={step}
                onConfigChange={(config) => updateStep(i, { config })}
              />

              <div>
                <label
                  className="block text-[10px] font-medium mb-0.5"
                  style={{ color: "oklch(50% 0.01 80)" }}
                >
                  Notes
                </label>
                <input
                  type="text"
                  value={step.notes ?? ""}
                  onChange={(e) => updateStep(i, { notes: e.target.value })}
                  placeholder="Additional context for the agent..."
                  className="w-full px-2 py-1 border rounded text-xs"
                  style={{
                    borderColor: "oklch(88% 0.005 80)",
                    color: "oklch(25% 0.01 80)",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Add step buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(STEP_TYPE_LABELS) as DataFlowStepType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addStep(type)}
                className="text-[10px] font-medium px-2 py-1 rounded border transition-colors"
                style={{
                  borderColor: "oklch(88% 0.005 80)",
                  color: "oklch(40% 0.01 80)",
                }}
              >
                + {STEP_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step config editors per type ---

function StepConfigEditor({
  step,
  onConfigChange,
}: {
  step: DataFlowStep;
  onConfigChange: (config: DataFlowStep["config"]) => void;
}) {
  const inputStyle = {
    borderColor: "oklch(88% 0.005 80)",
    color: "oklch(25% 0.01 80)",
  };

  switch (step.type) {
    case "manual_label": {
      const c = step.config as ManualLabelConfig;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Field</label>
              <input type="text" value={c.field} onChange={(e) => onConfigChange({ ...c, field: e.target.value })}
                placeholder="category" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Options (comma-sep)</label>
              <input type="text" value={c.options.join(", ")}
                onChange={(e) => onConfigChange({ ...c, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="A, B, C" className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Instructions</label>
            <input type="text" value={c.instructions} onChange={(e) => onConfigChange({ ...c, instructions: e.target.value })}
              placeholder="Instructions for the labeler..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
          </div>
          <label className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(45% 0.01 80)" }}>
            <input type="checkbox" checked={c.allow_custom} onChange={(e) => onConfigChange({ ...c, allow_custom: e.target.checked })} />
            Allow custom values
          </label>
        </div>
      );
    }

    case "llm_classify": {
      const c = step.config as LLMClassifyConfig;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Field</label>
              <input type="text" value={c.field} onChange={(e) => onConfigChange({ ...c, field: e.target.value })}
                placeholder="description" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Categories (comma-sep)</label>
              <input type="text" value={c.categories.join(", ")}
                onChange={(e) => onConfigChange({ ...c, categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="urgent, normal, low" className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Prompt</label>
            <input type="text" value={c.prompt} onChange={(e) => onConfigChange({ ...c, prompt: e.target.value })}
              placeholder="Classify the following..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Model</label>
            <input type="text" value={c.model} onChange={(e) => onConfigChange({ ...c, model: e.target.value })}
              placeholder="gpt-4o-mini" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
        </div>
      );
    }

    case "lookup": {
      const c = step.config as LookupConfig;
      return (
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Source</label>
            <input type="text" value={c.source_ref} onChange={(e) => onConfigChange({ ...c, source_ref: e.target.value })}
              placeholder="countries.csv" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Key field</label>
            <input type="text" value={c.key_field} onChange={(e) => onConfigChange({ ...c, key_field: e.target.value })}
              placeholder="country_name" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Value field</label>
            <input type="text" value={c.value_field} onChange={(e) => onConfigChange({ ...c, value_field: e.target.value })}
              placeholder="country_code" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
        </div>
      );
    }

    case "capture_response": {
      const c = step.config as CaptureResponseConfig;
      return (
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={{ color: "oklch(50% 0.01 80)" }}>Fields to capture (comma-sep)</label>
          <input type="text" value={c.fields.join(", ")}
            onChange={(e) => onConfigChange({ ...c, fields: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="id, created_at" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
        </div>
      );
    }
  }
}
