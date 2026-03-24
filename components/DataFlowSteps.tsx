"use client";

import { useState } from "react";
import type {
  DataFlowStep,
  DataFlowStepType,
  FieldMapping,
  DestinationField,
} from "@/types/contract";
import { MappingEditor } from "@/components/MappingEditor";
import type { NamedSourceGroup } from "@/components/MappingEditor";

function newStepId(): string {
  return `step_${crypto.randomUUID().slice(0, 8)}`;
}

const STEP_TYPE_LABELS: Record<DataFlowStepType, string> = {
  mapping: "Mapping",
  manual_label: "Manual Label",
  llm_classify: "LLM Classify",
  lookup: "Lookup",
  capture_response: "Capture Response",
};

const labelStyle = { color: "oklch(50% 0.01 80)" };
const inputStyle = { borderColor: "oklch(88% 0.005 80)", color: "oklch(25% 0.01 80)" };

function newStep(type: DataFlowStepType): DataFlowStep {
  const id = newStepId();
  const base = { id, input_ref: "", output_ref: "", notes: "", user_created: true };
  switch (type) {
    case "mapping":
      return { ...base, type, config: { field_mappings: [] } };
    case "manual_label":
      return { ...base, type, config: { field: "", options: [], instructions: "", allow_custom: false } };
    case "llm_classify":
      return { ...base, type, config: { field: "", categories: [], prompt: "", model: "gpt-4o-mini" } };
    case "lookup":
      return { ...base, type, config: { source_ref: "", key_field: "", value_field: "" } };
    case "capture_response":
      return { ...base, type, config: { fields: [] } };
  }
}

// --- Field resolution --------------------------------------------------------

export interface InputOption {
  ref: string;
  label: string;
  fields: string[];
}

export function resolveInputOptions(
  stepIndex: number,
  steps: DataFlowStep[],
  sourceGroups: NamedSourceGroup[],
  destFields: DestinationField[],
): InputOption[] {
  const options: InputOption[] = [];
  for (const sg of sourceGroups) {
    options.push({ ref: sg.ref, label: sg.ref, fields: sg.fieldNames });
  }
  for (let i = 0; i < stepIndex; i++) {
    const s = steps[i];
    if (!s.output_ref) continue;
    options.push({
      ref: s.output_ref,
      label: `Step ${i + 1}: ${s.output_ref}`,
      fields: resolveStepOutputFields(s, steps, sourceGroups, destFields),
    });
  }
  return options;
}

function resolveStepOutputFields(
  step: DataFlowStep,
  allSteps: DataFlowStep[],
  sourceGroups: NamedSourceGroup[],
  destFields: DestinationField[],
  visited = new Set<string>(),
): string[] {
  const inputFields = resolveFieldsForRef(step.input_ref, allSteps, sourceGroups, destFields, visited);
  switch (step.type) {
    case "mapping":
      return destFields.map((f) => f.name);
    case "manual_label": {
      const f = step.config.field;
      return f && !inputFields.includes(f) ? [...inputFields, f] : inputFields;
    }
    case "llm_classify": {
      const out = step.config.field ? `${step.config.field}_classified` : "";
      return out && !inputFields.includes(out) ? [...inputFields, out] : inputFields;
    }
    case "lookup": {
      const vf = step.config.value_field;
      return vf && !inputFields.includes(vf) ? [...inputFields, vf] : inputFields;
    }
    case "capture_response":
      return step.config.fields;
  }
}

function resolveFieldsForRef(
  ref: string,
  allSteps: DataFlowStep[],
  sourceGroups: NamedSourceGroup[],
  destFields: DestinationField[],
  visited = new Set<string>(),
): string[] {
  if (visited.has(ref)) return []; // cycle guard
  visited.add(ref);
  const sg = sourceGroups.find((g) => g.ref === ref);
  if (sg) return sg.fieldNames;
  const step = allSteps.find((s) => s.output_ref === ref);
  if (step) return resolveStepOutputFields(step, allSteps, sourceGroups, destFields, visited);
  return [];
}

// --- Component ---------------------------------------------------------------

interface DataFlowStepsProps {
  steps: DataFlowStep[];
  onChange: (steps: DataFlowStep[]) => void;
  sourceGroups: NamedSourceGroup[];
  destFields: DestinationField[];
  onGenerateMappings?: (stepId: string) => void;
  onAISuggestMappings?: (stepId: string) => void;
  onVerifyMappings?: (stepId: string) => void;
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
  steps, onChange, sourceGroups, destFields,
  onGenerateMappings, onAISuggestMappings, onVerifyMappings, onAIBuild,
  mappingLoading, aiLoading, aiBuildLoading, canGenerate, canAISuggest, canAIBuild,
  notes, onNotesChange,
}: DataFlowStepsProps) {
  const addStep = (type: DataFlowStepType) => onChange([...steps, newStep(type)]);

  const updateStep = (id: string, updates: Partial<DataFlowStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates, user_created: true } as DataFlowStep : s)));
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
        <button
          type="button"
          onClick={onAIBuild}
          disabled={!canAIBuild || isAnyLoading}
          className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: "oklch(40% 0.08 280)", color: "oklch(98% 0.005 80)" }}
        >
          {aiBuildLoading ? "Building pipeline..." : "AI Build Pipeline"}
        </button>
      )}

      {steps.map((step, i) => {
        const inputOptions = resolveInputOptions(i, steps, sourceGroups, destFields);
        const selectedInput = inputOptions.find((o) => o.ref === step.input_ref);
        const availableFields = selectedInput?.fields ?? [];

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
              {/* Input / Output */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Input</label>
                  <select value={step.input_ref} onChange={(e) => updateStep(step.id, { input_ref: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-xs" style={inputStyle}>
                    <option value="">-- Select input --</option>
                    {inputOptions.map((opt) => <option key={opt.ref} value={opt.ref}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Output name</label>
                  <input type="text" value={step.output_ref} onChange={(e) => updateStep(step.id, { output_ref: e.target.value })}
                    placeholder={`${step.type}_output`} className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} />
                </div>
              </div>

              {/* Type-specific config */}
              {step.type === "mapping" && (
                <MappingStepContent step={step} sourceGroups={sourceGroups} destFields={destFields} inputOptions={inputOptions}
                  onMappingsChange={(m) => updateStep(step.id, { config: { field_mappings: m } })}
                  onGenerate={onGenerateMappings ? () => onGenerateMappings(step.id) : undefined}
                  onAISuggest={onAISuggestMappings ? () => onAISuggestMappings(step.id) : undefined}
                  onVerify={onVerifyMappings ? () => onVerifyMappings(step.id) : undefined}
                  loading={mappingLoading} aiLoading={aiLoading} canGenerate={canGenerate} canAISuggest={canAISuggest} />
              )}
              {step.type === "manual_label" && <ManualLabelContent config={step.config} fields={availableFields} onUpdate={(config) => updateStep(step.id, { config })} />}
              {step.type === "llm_classify" && <LLMClassifyContent config={step.config} fields={availableFields} onUpdate={(config) => updateStep(step.id, { config })} />}
              {step.type === "lookup" && <LookupContent config={step.config} fields={availableFields} onUpdate={(config) => updateStep(step.id, { config })} />}
              {step.type === "capture_response" && <CaptureResponseContent config={step.config} onUpdate={(config) => updateStep(step.id, { config })} />}

              {/* Step notes */}
              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Notes</label>
                <input type="text" value={step.notes ?? ""} onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                  placeholder="Context for the agent..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Add step buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(STEP_TYPE_LABELS) as DataFlowStepType[]).map((type) => (
          <button key={type} type="button" onClick={() => addStep(type)}
            className="text-[10px] font-medium px-2.5 py-1.5 rounded border transition-colors"
            style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(40% 0.01 80)" }}>
            + {STEP_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Destination-level notes */}
      {onNotesChange && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(45% 0.01 80)" }}>
            Destination Notes
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

// --- Mapping step: embeds the full MappingEditor ---

function MappingStepContent({ step, sourceGroups, destFields, inputOptions, onMappingsChange, onGenerate, onAISuggest, onVerify, loading, aiLoading, canGenerate, canAISuggest }: {
  step: DataFlowStep & { type: "mapping" };
  sourceGroups: NamedSourceGroup[];
  destFields: DestinationField[];
  inputOptions: InputOption[];
  onMappingsChange: (m: FieldMapping[]) => void;
  onGenerate?: () => void;
  onAISuggest?: () => void;
  onVerify?: () => void;
  loading?: boolean;
  aiLoading?: boolean;
  canGenerate?: boolean;
  canAISuggest?: boolean;
}) {
  const groups: NamedSourceGroup[] = [];
  const inputOpt = inputOptions.find((o) => o.ref === step.input_ref);
  if (inputOpt) groups.push({ ref: inputOpt.ref, fieldNames: inputOpt.fields });
  for (const sg of sourceGroups) {
    if (!groups.some((g) => g.ref === sg.ref)) groups.push(sg);
  }

  return (
    <MappingEditor
      mappings={step.config.field_mappings}
      sourceGroups={groups}
      destFields={destFields}
      onMappingsChange={onMappingsChange}
      onGenerate={onGenerate ?? (() => {})}
      onAISuggest={onAISuggest}
      onVerify={onVerify}
      verifyResult={null}
      loading={loading ?? false}
      canGenerate={canGenerate ?? false}
      canAISuggest={canAISuggest}
      aiLoading={aiLoading}
    />
  );
}

// --- Shared small components ---

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

// --- Step type content editors ---

function ManualLabelContent({ config, fields, onUpdate }: {
  config: { field: string; options: string[]; instructions: string; allow_custom: boolean };
  fields: string[]; onUpdate: (c: typeof config) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Field</label>
          <FieldDropdown value={config.field} onChange={(field) => onUpdate({ ...config, field })} fields={fields} placeholder="-- Select field --" /></div>
        <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Options (comma-sep)</label>
          <CommaSepInput value={config.options} onChange={(options) => onUpdate({ ...config, options })} placeholder="A, B, C" /></div>
      </div>
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Instructions</label>
        <input type="text" value={config.instructions} onChange={(e) => onUpdate({ ...config, instructions: e.target.value })}
          placeholder="Instructions for the labeler..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} /></div>
      <label className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(45% 0.01 80)" }}>
        <input type="checkbox" checked={config.allow_custom} onChange={(e) => onUpdate({ ...config, allow_custom: e.target.checked })} /> Allow custom values</label>
    </div>
  );
}

function LLMClassifyContent({ config, fields, onUpdate }: {
  config: { field: string; categories: string[]; prompt: string; model: string };
  fields: string[]; onUpdate: (c: typeof config) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Field</label>
          <FieldDropdown value={config.field} onChange={(field) => onUpdate({ ...config, field })} fields={fields} placeholder="-- Select field --" /></div>
        <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Categories (comma-sep)</label>
          <CommaSepInput value={config.categories} onChange={(categories) => onUpdate({ ...config, categories })} placeholder="urgent, normal, low" /></div>
      </div>
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Prompt</label>
        <input type="text" value={config.prompt} onChange={(e) => onUpdate({ ...config, prompt: e.target.value })}
          placeholder="Classify the following..." className="w-full px-2 py-1 border rounded text-xs" style={inputStyle} /></div>
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Model</label>
        <input type="text" value={config.model} onChange={(e) => onUpdate({ ...config, model: e.target.value })}
          placeholder="gpt-4o-mini" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
    </div>
  );
}

function LookupContent({ config, fields, onUpdate }: {
  config: { source_ref: string; key_field: string; value_field: string };
  fields: string[]; onUpdate: (c: typeof config) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Lookup source</label>
        <input type="text" value={config.source_ref} onChange={(e) => onUpdate({ ...config, source_ref: e.target.value })}
          placeholder="countries.csv" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Key field</label>
        <FieldDropdown value={config.key_field} onChange={(key_field) => onUpdate({ ...config, key_field })} fields={fields} placeholder="-- Key --" /></div>
      <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Value field</label>
        <input type="text" value={config.value_field} onChange={(e) => onUpdate({ ...config, value_field: e.target.value })}
          placeholder="country_code" className="w-full px-2 py-1 border rounded text-xs font-mono" style={inputStyle} /></div>
    </div>
  );
}

function CaptureResponseContent({ config, onUpdate }: {
  config: { fields: string[] }; onUpdate: (c: typeof config) => void;
}) {
  return (
    <div><label className="block text-[10px] font-medium mb-0.5" style={labelStyle}>Fields to capture (comma-sep)</label>
      <CommaSepInput value={config.fields} onChange={(fields) => onUpdate({ ...config, fields })} placeholder="id, created_at" mono /></div>
  );
}
