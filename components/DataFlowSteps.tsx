"use client";

import React, { useState } from "react";
import type {
  PipelineStep,
  PipelineStepType,
  DestinationField,
} from "@/types/contract";
import { MappingEditor } from "@/components/MappingEditor";
import type { NamedSourceGroup } from "@/components/MappingEditor";

// --- Step factory ---

const STEP_TYPE_LABELS: Record<PipelineStepType, string> = {
  map: "Map",
  send: "Send",
  label: "Label",
  classify: "Classify",
  lookup: "Lookup",
  filter: "Filter",
  merge: "Merge",
};

function newStepId(): string {
  return `step_${crypto.randomUUID().slice(0, 8)}`;
}

function newStep(type: PipelineStepType): PipelineStep {
  const base = { id: newStepId(), label: STEP_TYPE_LABELS[type], inputs: [] as string[], output: "", notes: "", user_created: true };
  switch (type) {
    case "map": return { ...base, type, config: { field_mappings: [] } };
    case "send": return { ...base, type, config: { destination_ref: "" } };
    case "label": return { ...base, type, config: { field: "", options: [], instructions: "", allow_custom: false } };
    case "classify": return { ...base, type, config: { field: "", output_field: "", categories: [], prompt: "", model: "gpt-4o-mini" } };
    case "lookup": return { ...base, type, config: { lookup_source: "", key_field: "", value_field: "", output_field: "" } };
    case "filter": return { ...base, type, config: { condition: "" } };
    case "merge": return { ...base, type, config: { strategy: "union" as const } };
  }
}

// --- Field resolution ---

export interface InputOption {
  ref: string;
  label: string;
  fields: string[];
}

export function resolveInputOptions(
  stepIndex: number,
  steps: PipelineStep[],
  sourceGroups: NamedSourceGroup[],
): InputOption[] {
  const options: InputOption[] = [];
  for (const sg of sourceGroups) {
    options.push({ ref: sg.ref, label: sg.ref, fields: sg.fieldNames });
  }
  for (let i = 0; i < stepIndex; i++) {
    const s = steps[i];
    if (!s.output) continue;
    const fields = s.output_schema?.map((f) => f.name) ?? [];
    options.push({ ref: s.output, label: `Step ${i + 1}: ${s.output}`, fields });
  }
  return options;
}

// --- Shared styles ---

const labelStyle = { color: "oklch(50% 0.01 80)" };
const inputStyle = { borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" };

// --- Component ---

interface DataFlowStepsProps {
  steps: PipelineStep[];
  onChange: (steps: PipelineStep[]) => void;
  sourceGroups: NamedSourceGroup[];
  destGroups: NamedSourceGroup[];
  destOptions: { ref: string; label: string }[];
  onGenerateMappings?: (stepId: string) => void;
  onAISuggestMappings?: (stepId: string) => void;
  onAIBuild?: () => void;
  mappingLoading?: boolean;
  aiLoading?: boolean;
  aiBuildLoading?: boolean;
  canGenerate?: boolean;
  canAISuggest?: boolean;
  canAIBuild?: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export function DataFlowSteps({
  steps, onChange, sourceGroups, destGroups, destOptions,
  onGenerateMappings, onAISuggestMappings, onAIBuild,
  mappingLoading, aiLoading, aiBuildLoading,
  canGenerate, canAISuggest, canAIBuild,
  notes, onNotesChange,
}: DataFlowStepsProps) {
  const addStep = (type: PipelineStepType) => onChange([...steps, newStep(type)]);

  const updateStep = (id: string, updates: Partial<PipelineStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates, user_created: true } as PipelineStep : s)));
  };

  const removeStep = (id: string) => onChange(steps.filter((s) => s.id !== id));

  const moveStep = (id: string, dir: -1 | 1) => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= steps.length) return;
    const ns = [...steps];
    [ns[idx], ns[ni]] = [ns[ni], ns[idx]];
    onChange(ns);
  };

  const isAnyLoading = (mappingLoading ?? false) || (aiLoading ?? false) || (aiBuildLoading ?? false);

  return (
    <div className="space-y-3">
      {/* AI Build button */}
      {onAIBuild && (
        <button type="button" onClick={onAIBuild} disabled={!canAIBuild || isAnyLoading}
          className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: "oklch(40% 0.08 280)", color: "oklch(98% 0.005 80)" }}>
          {aiBuildLoading ? "Generating plan..." : "Generate Pipeline Plan"}
        </button>
      )}

      {steps.map((step, i) => {
        const inputOptions = resolveInputOptions(i, steps, sourceGroups);

        return (
          <div key={step.id} className="border rounded-lg overflow-hidden" style={{ borderColor: "oklch(88% 0.005 80)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "oklch(97% 0.005 80)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono" style={{ color: "oklch(55% 0.01 80)" }}>{i + 1}</span>
                <span className="text-xs font-semibold" style={{ color: "oklch(30% 0.01 80)" }}>{STEP_TYPE_LABELS[step.type]}</span>
                {step.user_created && (
                  <span className="text-[10px] px-1 py-0.5 rounded font-medium"
                    style={{ backgroundColor: "oklch(92% 0.02 260)", color: "oklch(45% 0.08 260)" }}
                    title="User-created step — AI Build will preserve this">pinned</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveStep(step.id, -1)} disabled={i === 0}
                  className="text-xs px-1.5 py-0.5 rounded disabled:opacity-30" style={{ color: "oklch(50% 0.01 80)" }}>↑</button>
                <button type="button" onClick={() => moveStep(step.id, 1)} disabled={i === steps.length - 1}
                  className="text-xs px-1.5 py-0.5 rounded disabled:opacity-30" style={{ color: "oklch(50% 0.01 80)" }}>↓</button>
                <button type="button" onClick={() => removeStep(step.id)}
                  className="text-xs px-1.5 py-0.5 rounded" style={{ color: "oklch(55% 0.05 20)" }}>Remove</button>
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Label + Inputs + Output */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <LabelEl>Step label</LabelEl>
                  <input type="text" value={step.label} onChange={(e) => updateStep(step.id, { label: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
                </div>
                <div>
                  <LabelEl>Input(s)</LabelEl>
                  <MultiInputSelect selected={step.inputs} options={inputOptions}
                    onChange={(inputs) => updateStep(step.id, { inputs })} />
                </div>
                <div>
                  <LabelEl>Output name</LabelEl>
                  <input type="text" value={step.output} onChange={(e) => updateStep(step.id, { output: e.target.value })}
                    placeholder={`${step.type}_output`} className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
                </div>
              </div>

              {/* Type-specific config */}
              <StepConfigEditor step={step} inputOptions={inputOptions}
                sourceGroups={sourceGroups} destGroups={destGroups} destOptions={destOptions}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onGenerateMappings={onGenerateMappings ? () => onGenerateMappings(step.id) : undefined}
                onAISuggestMappings={onAISuggestMappings ? () => onAISuggestMappings(step.id) : undefined}
                mappingLoading={mappingLoading} aiLoading={aiLoading}
                canGenerate={canGenerate} canAISuggest={canAISuggest} />

              {/* Notes */}
              <div>
                <LabelEl>Notes</LabelEl>
                <input type="text" value={step.notes ?? ""} onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                  placeholder="Context for the agent..."
                  className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Add step buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(STEP_TYPE_LABELS) as PipelineStepType[]).map((type) => (
          <button key={type} type="button" onClick={() => addStep(type)}
            className="text-[10px] font-medium px-2.5 py-1.5 rounded border transition-colors"
            style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(40% 0.01 80)" }}>
            + {STEP_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Pipeline-level notes */}
      {onNotesChange && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(45% 0.01 80)" }}>
            Pipeline Notes
          </label>
          <textarea value={notes ?? ""} onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Dependencies, prerequisites, special handling..."
            rows={2} className="w-full px-3 py-2 border rounded text-sm"
            style={{ borderColor: "oklch(85% 0.005 80)", color: "oklch(25% 0.01 80)", backgroundColor: "oklch(100% 0 0)" }} />
        </div>
      )}
    </div>
  );
}

// --- Small shared components ---

function LabelEl({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>{children}</label>;
}

function MultiInputSelect({ selected, options, onChange }: {
  selected: string[]; options: InputOption[]; onChange: (inputs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-2 py-1 border rounded text-xs text-left truncate"
        style={inputStyle}>
        {selected.length === 0 ? "-- Select input(s) --" : selected.join(", ")}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow-lg max-h-48 overflow-y-auto"
          style={{ borderColor: "oklch(88% 0.005 80)" }}>
          {options.map((opt) => (
            <label key={opt.ref} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(opt.ref)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt.ref]);
                  else onChange(selected.filter((r) => r !== opt.ref));
                }} />
              <span className="truncate">{opt.label}</span>
            </label>
          ))}
          {options.length === 0 && (
            <div className="px-2 py-1.5 text-xs" style={{ color: "oklch(55% 0.01 80)" }}>No inputs available</div>
          )}
        </div>
      )}
    </div>
  );
}

function CommaSepInput({ value, onChange, placeholder, mono }: {
  value: string[]; onChange: (v: string[]) => void; placeholder: string; mono?: boolean;
}) {
  const [text, setText] = useState(value.join(", "));
  const commit = () => onChange(text.split(",").map((s) => s.trim()).filter(Boolean));
  return <input type="text" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit}
    placeholder={placeholder} className={`w-full px-2 py-1 border rounded text-xs ${mono ? "font-mono" : ""}`} style={inputStyle} />;
}

function FieldDropdown({ value, onChange, fields, placeholder }: {
  value: string; onChange: (v: string) => void; fields: string[]; placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle}>
      <option value="">{placeholder}</option>
      {fields.map((f) => <option key={f} value={f}>{f}</option>)}
    </select>
  );
}

// --- Step config editor ---

function StepConfigEditor({ step, inputOptions, sourceGroups, destGroups, destOptions, onUpdate,
  onGenerateMappings, onAISuggestMappings, mappingLoading, aiLoading, canGenerate, canAISuggest }: {
  step: PipelineStep;
  inputOptions: InputOption[];
  sourceGroups: NamedSourceGroup[];
  destGroups: NamedSourceGroup[];
  destOptions: { ref: string; label: string }[];
  onUpdate: (updates: Partial<PipelineStep>) => void;
  onGenerateMappings?: () => void;
  onAISuggestMappings?: () => void;
  mappingLoading?: boolean;
  aiLoading?: boolean;
  canGenerate?: boolean;
  canAISuggest?: boolean;
}) {
  const fields = [...new Set(step.inputs.flatMap((ref) => inputOptions.find((o) => o.ref === ref)?.fields ?? []))];

  switch (step.type) {
    case "map": {
      const groups: NamedSourceGroup[] = [];
      for (const ref of step.inputs) {
        const opt = inputOptions.find((o) => o.ref === ref);
        if (opt) groups.push({ ref: opt.ref, fieldNames: opt.fields });
      }
      for (const sg of sourceGroups) {
        if (!groups.some((g) => g.ref === sg.ref)) groups.push(sg);
      }
      const destFields: DestinationField[] = destGroups.length > 0
        ? destGroups[0].fieldNames.map((n) => ({ name: n, data_type: "text", nullable: true }))
        : [];
      return (
        <MappingEditor
          mappings={step.config.field_mappings}
          sourceGroups={groups} destFields={destFields}
          onMappingsChange={(m) => onUpdate({ config: { field_mappings: m } })}
          onGenerate={onGenerateMappings ?? (() => {})}
          onAISuggest={onAISuggestMappings}
          verifyResult={null} loading={mappingLoading ?? false}
          canGenerate={canGenerate ?? false} canAISuggest={canAISuggest} aiLoading={aiLoading} />
      );
    }
    case "send":
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div><LabelEl>Destination</LabelEl>
              <select value={step.config.destination_ref} onChange={(e) => onUpdate({ config: { ...step.config, destination_ref: e.target.value } })}
                className="w-full px-2 py-1 border rounded text-xs" style={inputStyle}>
                <option value="">-- Select destination --</option>
                {destOptions.map((d) => <option key={d.ref} value={d.ref}>{d.label}</option>)}
              </select></div>
            <div><LabelEl>Method</LabelEl>
              <select value={step.config.method ?? ""} onChange={(e) => onUpdate({ config: { ...step.config, method: e.target.value || undefined } })}
                className="w-full px-2 py-1 border rounded text-xs" style={inputStyle}>
                <option value="">Auto</option><option value="POST">POST</option><option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option><option value="INSERT">INSERT</option>
              </select></div>
          </div>
          <div><LabelEl>Capture response fields (comma-sep)</LabelEl>
            <CommaSepInput value={step.config.capture_response ?? []}
              onChange={(f) => onUpdate({ config: { ...step.config, capture_response: f.length > 0 ? f : undefined } })}
              placeholder="id, created_at" mono /></div>
        </div>
      );
    case "label":
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div><LabelEl>Field</LabelEl>
              <FieldDropdown value={step.config.field} onChange={(field) => onUpdate({ config: { ...step.config, field } })} fields={fields} placeholder="-- Select --" /></div>
            <div><LabelEl>Options (comma-sep)</LabelEl>
              <CommaSepInput value={step.config.options} onChange={(options) => onUpdate({ config: { ...step.config, options } })} placeholder="A, B, C" /></div>
          </div>
          <div><LabelEl>Instructions</LabelEl>
            <input type="text" value={step.config.instructions} onChange={(e) => onUpdate({ config: { ...step.config, instructions: e.target.value } })}
              placeholder="Instructions..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} /></div>
          <label className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(45% 0.01 80)" }}>
            <input type="checkbox" checked={step.config.allow_custom} onChange={(e) => onUpdate({ config: { ...step.config, allow_custom: e.target.checked } })} /> Allow custom values</label>
        </div>
      );
    case "classify":
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div><LabelEl>Input field</LabelEl>
              <FieldDropdown value={step.config.field} onChange={(field) => onUpdate({ config: { ...step.config, field } })} fields={fields} placeholder="-- Select --" /></div>
            <div><LabelEl>Output field</LabelEl>
              <input type="text" value={step.config.output_field} onChange={(e) => onUpdate({ config: { ...step.config, output_field: e.target.value } })}
                placeholder="category" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
            <div><LabelEl>Categories (comma-sep)</LabelEl>
              <CommaSepInput value={step.config.categories} onChange={(categories) => onUpdate({ config: { ...step.config, categories } })} placeholder="A, B, C" /></div>
          </div>
          <div><LabelEl>Prompt</LabelEl>
            <input type="text" value={step.config.prompt} onChange={(e) => onUpdate({ config: { ...step.config, prompt: e.target.value } })}
              placeholder="Classify..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} /></div>
          <div><LabelEl>Model</LabelEl>
            <input type="text" value={step.config.model} onChange={(e) => onUpdate({ config: { ...step.config, model: e.target.value } })}
              placeholder="gpt-4o-mini" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
        </div>
      );
    case "lookup":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <div><LabelEl>Lookup source</LabelEl>
            <select value={step.config.lookup_source} onChange={(e) => onUpdate({ config: { ...step.config, lookup_source: e.target.value } })}
              className="w-full px-2 py-1 border rounded text-xs" style={inputStyle}>
              <option value="">-- Select --</option>
              {sourceGroups.map((sg) => <option key={sg.ref} value={sg.ref}>{sg.ref}</option>)}
            </select></div>
          <div><LabelEl>Output field</LabelEl>
            <input type="text" value={step.config.output_field} onChange={(e) => onUpdate({ config: { ...step.config, output_field: e.target.value } })}
              placeholder="country_code" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
          <div><LabelEl>Key field</LabelEl>
            <FieldDropdown value={step.config.key_field} onChange={(kf) => onUpdate({ config: { ...step.config, key_field: kf } })} fields={fields} placeholder="-- Key --" /></div>
          <div><LabelEl>Value field</LabelEl>
            <input type="text" value={step.config.value_field} onChange={(e) => onUpdate({ config: { ...step.config, value_field: e.target.value } })}
              placeholder="value" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
        </div>
      );
    case "filter":
      return (
        <div><LabelEl>Condition</LabelEl>
          <input type="text" value={step.config.condition} onChange={(e) => onUpdate({ config: { ...step.config, condition: e.target.value } })}
            placeholder="status != 'deleted'" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
      );
    case "merge":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <div><LabelEl>Strategy</LabelEl>
            <select value={step.config.strategy} onChange={(e) => onUpdate({ config: { ...step.config, strategy: e.target.value as "union" | "join" } })}
              className="w-full px-2 py-1 border rounded text-xs" style={inputStyle}>
              <option value="union">Union (append rows)</option>
              <option value="join">Join (merge by key)</option>
            </select></div>
          {step.config.strategy === "join" && (
            <div><LabelEl>Join key</LabelEl>
              <FieldDropdown value={step.config.join_key ?? ""} onChange={(jk) => onUpdate({ config: { ...step.config, join_key: jk } })} fields={fields} placeholder="-- Key --" /></div>
          )}
        </div>
      );
  }
}
