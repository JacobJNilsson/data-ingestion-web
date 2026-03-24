"use client";

import { useState } from "react";
import type {
  DataFlowStep,
  DataFlowStepType,
} from "@/types/contract";

let nextStepId = 1;

const STEP_TYPE_LABELS: Record<DataFlowStepType, string> = {
  manual_label: "Manual Label",
  llm_classify: "LLM Classify",
  lookup: "Lookup",
  capture_response: "Capture Response",
};

const labelStyle = { color: "oklch(50% 0.01 80)" };
const inputStyle = { borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" };

function newStep(type: DataFlowStepType): DataFlowStep {
  const id = `dfs_${nextStepId++}`;
  switch (type) {
    case "manual_label":
      return { id, type, config: { field: "", options: [], instructions: "", allow_custom: false }, notes: "" };
    case "llm_classify":
      return { id, type, config: { field: "", categories: [], prompt: "", model: "gpt-4o-mini" }, notes: "" };
    case "lookup":
      return { id, type, config: { source_ref: "", key_field: "", value_field: "" }, notes: "" };
    case "capture_response":
      return { id, type, config: { fields: [] }, notes: "" };
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
    onChange([...steps, newStep(type)]);
    setExpanded(true);
  };

  const updateStep = (id: string, updates: Partial<DataFlowStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } as DataFlowStep : s)));
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  return (
    <div
      className="border rounded-lg"
      style={{ borderColor: "oklch(92% 0.005 80)", backgroundColor: "oklch(99.5% 0.002 80)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
          {label} ({steps.length})
        </span>
        <svg
          className="w-3.5 h-3.5 transition-transform"
          style={{ color: "oklch(55% 0.01 80)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="border rounded p-3 space-y-2" style={{ borderColor: "oklch(90% 0.005 80)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "oklch(35% 0.01 80)" }}>
                  {STEP_TYPE_LABELS[step.type]}
                </span>
                <button type="button" onClick={() => removeStep(step.id)}
                  className="text-xs px-1.5 py-0.5 rounded" style={{ color: "oklch(55% 0.05 20)" }}>
                  Remove
                </button>
              </div>

              <StepConfigEditor step={step} onUpdate={(updates) => updateStep(step.id, updates)} />

              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Notes</label>
                <input type="text" value={step.notes ?? ""} onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                  placeholder="Additional context for the agent..."
                  className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
              </div>
            </div>
          ))}

          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(STEP_TYPE_LABELS) as DataFlowStepType[]).map((type) => (
              <button key={type} type="button" onClick={() => addStep(type)}
                className="text-[10px] font-medium px-2 py-1 rounded border transition-colors"
                style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(40% 0.01 80)" }}>
                + {STEP_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Comma-separated input with local state + blur commit ---

function CommaSepInput({ value, onChange, placeholder, mono }: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  mono?: boolean;
}) {
  const [text, setText] = useState(value.join(", "));
  const commit = () => onChange(text.split(",").map((s) => s.trim()).filter(Boolean));
  return (
    <input type="text" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit}
      placeholder={placeholder}
      className={`w-full px-2 py-1 border rounded text-xs ${mono ? "font-mono" : ""}`}
      style={inputStyle} />
  );
}

// --- Step config editors (discriminated union, no casts) ---

function StepConfigEditor({ step, onUpdate }: {
  step: DataFlowStep;
  onUpdate: (updates: Partial<DataFlowStep>) => void;
}) {
  switch (step.type) {
    case "manual_label": {
      const c = step.config;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Field</label>
              <input type="text" value={c.field} onChange={(e) => onUpdate({ config: { ...c, field: e.target.value } })}
                placeholder="category" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Options (comma-sep)</label>
              <CommaSepInput value={c.options} onChange={(options) => onUpdate({ config: { ...c, options } })} placeholder="A, B, C" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Instructions</label>
            <input type="text" value={c.instructions} onChange={(e) => onUpdate({ config: { ...c, instructions: e.target.value } })}
              placeholder="Instructions for the labeler..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
          </div>
          <label className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(45% 0.01 80)" }}>
            <input type="checkbox" checked={c.allow_custom} onChange={(e) => onUpdate({ config: { ...c, allow_custom: e.target.checked } })} />
            Allow custom values
          </label>
        </div>
      );
    }

    case "llm_classify": {
      const c = step.config;
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Field</label>
              <input type="text" value={c.field} onChange={(e) => onUpdate({ config: { ...c, field: e.target.value } })}
                placeholder="description" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Categories (comma-sep)</label>
              <CommaSepInput value={c.categories} onChange={(categories) => onUpdate({ config: { ...c, categories } })} placeholder="urgent, normal, low" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Prompt</label>
            <input type="text" value={c.prompt} onChange={(e) => onUpdate({ config: { ...c, prompt: e.target.value } })}
              placeholder="Classify the following..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Model</label>
            <input type="text" value={c.model} onChange={(e) => onUpdate({ config: { ...c, model: e.target.value } })}
              placeholder="gpt-4o-mini" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
        </div>
      );
    }

    case "lookup": {
      const c = step.config;
      return (
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Source</label>
            <input type="text" value={c.source_ref} onChange={(e) => onUpdate({ config: { ...c, source_ref: e.target.value } })}
              placeholder="countries.csv" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Key field</label>
            <input type="text" value={c.key_field} onChange={(e) => onUpdate({ config: { ...c, key_field: e.target.value } })}
              placeholder="country_name" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Value field</label>
            <input type="text" value={c.value_field} onChange={(e) => onUpdate({ config: { ...c, value_field: e.target.value } })}
              placeholder="country_code" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
          </div>
        </div>
      );
    }

    case "capture_response": {
      const c = step.config;
      return (
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Fields to capture (comma-sep)</label>
          <CommaSepInput value={c.fields} onChange={(fields) => onUpdate({ config: { ...c, fields } })} placeholder="id, created_at" mono />
        </div>
      );
    }
  }
}
