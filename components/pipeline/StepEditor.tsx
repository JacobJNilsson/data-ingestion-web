"use client";

import type { PipelineStep, PipelineStepType } from "@/types/contract";

interface StepEditorProps {
  step: PipelineStep;
  onUpdate: (config: Record<string, unknown>) => void;
  onLabelChange: (label: string) => void;
}

export function StepEditor({ step, onUpdate, onLabelChange }: StepEditorProps) {
  const config = step.config;

  return (
    <div
      className="border rounded-lg p-4 space-y-4"
      style={{
        borderColor: "oklch(90% 0.005 80)",
        backgroundColor: "oklch(100% 0 0)",
      }}
    >
      <div className="flex items-center justify-between">
        <h4
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "oklch(45% 0.01 80)" }}
        >
          Configure: {step.type.replace("_", " ")}
        </h4>
        <span
          className="text-[10px] font-mono"
          style={{ color: "oklch(60% 0.01 80)" }}
        >
          {step.id}
        </span>
      </div>

      {/* Label */}
      <Field label="Label">
        <input
          type="text"
          value={step.label}
          onChange={(e) => onLabelChange(e.target.value)}
          className="w-full px-3 py-1.5 border rounded text-sm"
          style={inputStyle}
        />
      </Field>

      {/* Type-specific config */}
      {step.type === "source" && (
        <SourceEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "destination" && (
        <DestinationEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "manual_label" && (
        <ManualLabelEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "llm_classify" && (
        <LLMClassifyEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "api_call" && (
        <APICallEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "lookup" && (
        <LookupEditor config={config} onUpdate={onUpdate} />
      )}
      {step.type === "mapping" && (
        <MappingStepEditor config={config} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// --- Shared helpers ---------------------------------------------------------

const inputStyle = {
  borderColor: "oklch(85% 0.005 80)",
  color: "oklch(25% 0.01 80)",
  backgroundColor: "oklch(100% 0 0)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1"
        style={{ color: "oklch(45% 0.01 80)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function strVal(config: Record<string, unknown>, key: string): string {
  return (config[key] as string) ?? "";
}

function arrVal(config: Record<string, unknown>, key: string): string[] {
  return (config[key] as string[]) ?? [];
}

function boolVal(config: Record<string, unknown>, key: string): boolean {
  return (config[key] as boolean) ?? false;
}

// --- Step-type editors ------------------------------------------------------

function SourceEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <Field label="Contract Reference">
      <input
        type="text"
        value={strVal(config, "contract_ref")}
        onChange={(e) => onUpdate({ ...config, contract_ref: e.target.value })}
        placeholder="e.g., orders.csv or postgres://..."
        className="w-full px-3 py-1.5 border rounded text-sm font-mono"
        style={inputStyle}
      />
    </Field>
  );
}

function DestinationEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <Field label="Contract Reference">
      <input
        type="text"
        value={strVal(config, "contract_ref")}
        onChange={(e) => onUpdate({ ...config, contract_ref: e.target.value })}
        placeholder="e.g., target-db or api://..."
        className="w-full px-3 py-1.5 border rounded text-sm font-mono"
        style={inputStyle}
      />
    </Field>
  );
}

function ManualLabelEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Field to label">
        <input
          type="text"
          value={strVal(config, "field")}
          onChange={(e) => onUpdate({ ...config, field: e.target.value })}
          placeholder="e.g., category"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
      <Field label="Options (comma-separated)">
        <input
          type="text"
          value={arrVal(config, "options").join(", ")}
          onChange={(e) =>
            onUpdate({
              ...config,
              options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., electronics, clothing, food"
          className="w-full px-3 py-1.5 border rounded text-sm"
          style={inputStyle}
        />
      </Field>
      <Field label="Instructions">
        <textarea
          value={strVal(config, "instructions")}
          onChange={(e) => onUpdate({ ...config, instructions: e.target.value })}
          placeholder="Instructions for the person doing the labeling..."
          rows={2}
          className="w-full px-3 py-1.5 border rounded text-sm"
          style={inputStyle}
        />
      </Field>
      <label className="flex items-center gap-2 text-xs" style={{ color: "oklch(40% 0.01 80)" }}>
        <input
          type="checkbox"
          checked={boolVal(config, "allow_custom")}
          onChange={(e) => onUpdate({ ...config, allow_custom: e.target.checked })}
        />
        Allow custom values
      </label>
    </>
  );
}

function LLMClassifyEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Field to classify">
        <input
          type="text"
          value={strVal(config, "field")}
          onChange={(e) => onUpdate({ ...config, field: e.target.value })}
          placeholder="e.g., description"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
      <Field label="Categories (comma-separated)">
        <input
          type="text"
          value={arrVal(config, "categories").join(", ")}
          onChange={(e) =>
            onUpdate({
              ...config,
              categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., urgent, normal, low"
          className="w-full px-3 py-1.5 border rounded text-sm"
          style={inputStyle}
        />
      </Field>
      <Field label="Prompt">
        <textarea
          value={strVal(config, "prompt")}
          onChange={(e) => onUpdate({ ...config, prompt: e.target.value })}
          placeholder="Classify the following text into one of the categories..."
          rows={3}
          className="w-full px-3 py-1.5 border rounded text-sm"
          style={inputStyle}
        />
      </Field>
      <Field label="Model">
        <input
          type="text"
          value={strVal(config, "model")}
          onChange={(e) => onUpdate({ ...config, model: e.target.value })}
          placeholder="e.g., gpt-4o-mini"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
    </>
  );
}

function APICallEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <Field label="Method">
          <select
            value={strVal(config, "method")}
            onChange={(e) => onUpdate({ ...config, method: e.target.value })}
            className="w-full px-3 py-1.5 border rounded text-sm"
            style={inputStyle}
          >
            <option value="">--</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </Field>
        <div className="col-span-3">
          <Field label="URL">
            <input
              type="text"
              value={strVal(config, "url")}
              onChange={(e) => onUpdate({ ...config, url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-3 py-1.5 border rounded text-sm font-mono"
              style={inputStyle}
            />
          </Field>
        </div>
      </div>
      <Field label="Response fields to capture (comma-separated)">
        <input
          type="text"
          value={arrVal(config, "response_fields").join(", ")}
          onChange={(e) =>
            onUpdate({
              ...config,
              response_fields: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., id, created_at"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
    </>
  );
}

function LookupEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Lookup source reference">
        <input
          type="text"
          value={strVal(config, "source_ref")}
          onChange={(e) => onUpdate({ ...config, source_ref: e.target.value })}
          placeholder="e.g., countries.csv"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Key field">
          <input
            type="text"
            value={strVal(config, "key_field")}
            onChange={(e) => onUpdate({ ...config, key_field: e.target.value })}
            placeholder="e.g., country_name"
            className="w-full px-3 py-1.5 border rounded text-sm font-mono"
            style={inputStyle}
          />
        </Field>
        <Field label="Value field">
          <input
            type="text"
            value={strVal(config, "value_field")}
            onChange={(e) => onUpdate({ ...config, value_field: e.target.value })}
            placeholder="e.g., country_code"
            className="w-full px-3 py-1.5 border rounded text-sm font-mono"
            style={inputStyle}
          />
        </Field>
      </div>
    </>
  );
}

function MappingStepEditor({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Source references (comma-separated)">
        <input
          type="text"
          value={arrVal(config, "source_refs").join(", ")}
          onChange={(e) =>
            onUpdate({
              ...config,
              source_refs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., orders.csv, customers"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
      <Field label="Destination references (comma-separated)">
        <input
          type="text"
          value={arrVal(config, "destination_refs").join(", ")}
          onChange={(e) =>
            onUpdate({
              ...config,
              destination_refs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., target-db"
          className="w-full px-3 py-1.5 border rounded text-sm font-mono"
          style={inputStyle}
        />
      </Field>
    </>
  );
}
