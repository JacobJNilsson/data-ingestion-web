"use client";

import { useCallback, useMemo, useState } from "react";
import { ConnectionList } from "@/components/ConnectionList";
import { DataFlowSteps } from "@/components/DataFlowSteps";
import type { NamedSourceGroup } from "@/components/MappingEditor";
import { LLMSettings } from "@/components/LLMSettings";
import type { LLMConfig } from "@/components/LLMSettings";
import { RawJSON } from "@/components/RawJSON";
import { DATA_INGESTION_API_URL } from "@/lib/constants";
import type {
  SourceContract,
  DataContract,
  ConnectionEntry,
  ConnectionRole,
  PipelineStep,
  PipelineContract,
  FieldMapping,
} from "@/types/contract";

let nextConnId = 1;
let nextMappingId = 1;

function newConnection(): ConnectionEntry {
  const id = `c${nextConnId++}`;
  return { id, label: `Connection ${id}`, role: "source", contract: null, selectedSchemaIndices: [] };
}

export function TransformTab() {
  const [connections, setConnections] = useState<ConnectionEntry[]>([newConnection()]);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [pipelineNotes, setPipelineNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBuildLoading, setAiBuildLoading] = useState(false);
  const [error, setError] = useState("");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
  });

  // --- Derived data ---

  const sourceGroups: NamedSourceGroup[] = useMemo(() => {
    const groups: NamedSourceGroup[] = [];
    for (const c of connections) {
      if (!c.contract || (c.role !== "source" && c.role !== "both")) continue;
      for (const idx of c.selectedSchemaIndices) {
        groups.push({ ref: schemaRef(c, idx), fieldNames: extractFieldNames(c.contract, idx) });
      }
    }
    return groups;
  }, [connections]);

  const destGroups: NamedSourceGroup[] = useMemo(() => {
    const groups: NamedSourceGroup[] = [];
    for (const c of connections) {
      if (!c.contract || (c.role !== "destination" && c.role !== "both")) continue;
      for (const idx of c.selectedSchemaIndices) {
        groups.push({ ref: schemaRef(c, idx), fieldNames: extractFieldNames(c.contract, idx) });
      }
    }
    return groups;
  }, [connections]);

  const destOptions = useMemo(() => destGroups.map((g) => ({ ref: g.ref, label: g.ref })), [destGroups]);

  const hasLLMKey = llmConfig.apiKey.trim().length > 0;
  const canGenerate = sourceGroups.length > 0 && destGroups.length > 0;
  const canAISuggest = canGenerate && hasLLMKey;

  // --- Connection handlers ---

  const handleConnectionChange = useCallback((id: string, contract: SourceContract | DataContract | null) => {
    setConnections((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return { ...c, contract, selectedSchemaIndices: contract ? [0] : [], label: contract ? deriveLabel(contract, c.label) : c.label };
    }));
    setSteps([]);
  }, []);

  const handleSchemaToggle = useCallback((id: string, index: number) => {
    setConnections((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const indices = c.selectedSchemaIndices.includes(index)
        ? c.selectedSchemaIndices.filter((i) => i !== index)
        : [...c.selectedSchemaIndices, index].sort();
      return indices.length === 0 ? c : { ...c, selectedSchemaIndices: indices };
    }));
  }, []);

  const handleLabelChange = useCallback((id: string, label: string) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, label } : c));
  }, []);

  const handleRoleChange = useCallback((id: string, role: ConnectionRole) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, role } : c));
  }, []);

  const handleAddConnection = useCallback(() => {
    setConnections((prev) => [...prev, newConnection()]);
  }, []);

  const handleRemoveConnection = useCallback((id: string) => {
    setConnections((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return filtered.length > 0 ? filtered : prev;
    });
    setSteps([]);
  }, []);

  // --- Generate mappings for a map step ---

  const handleGenerateMappings = useCallback(async (stepId: string) => {
    setGenerating(true);
    setError("");
    try {
      const sources = sourceGroups.map((sg) => ({ ref: sg.ref, fields: sg.fieldNames.map((n) => ({ Name: n, DataType: "text" })) }));
      const destFields = destGroups[0]?.fieldNames.map((n) => ({ Name: n, DataType: "text" })) ?? [];

      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/suggest-mappings-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources, destination_fields: destFields }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();
      const generated: FieldMapping[] = (data.mappings || []).map((m: FieldMapping) => ({
        ...m, source_type: m.source_type || "unmapped", _id: nextMappingId++, confidence: m.confidence ?? 0, user_edited: false,
      }));
      setSteps((prev) => prev.map((s) =>
        s.id === stepId && s.type === "map" ? { ...s, config: { field_mappings: generated } } as PipelineStep : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mappings");
    } finally {
      setGenerating(false);
    }
  }, [sourceGroups, destGroups]);

  // --- AI Suggest mappings for a map step ---

  const handleAISuggestMappings = useCallback(async (stepId: string) => {
    setAiLoading(true);
    setError("");
    try {
      const srcContracts: Record<string, unknown> = {};
      const dstContracts: Record<string, unknown> = {};
      for (const c of connections) {
        if (!c.contract) continue;
        for (const idx of c.selectedSchemaIndices) {
          const ref = schemaRef(c, idx);
          const sc = extractSchemaContract(c.contract, idx);
          if (c.role === "source" || c.role === "both") srcContracts[ref] = sc;
          if (c.role === "destination" || c.role === "both") dstContracts[ref] = sc;
        }
      }
      const step = steps.find((s) => s.id === stepId && s.type === "map");
      const currentMappings = step?.type === "map" ? step.config.field_mappings : [];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);
      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/ai-suggest-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          provider: llmConfig.provider, api_key: llmConfig.apiKey, model: llmConfig.model,
          source_contracts: srcContracts, destination_contracts: dstContracts,
          current_mappings: currentMappings.length > 0 ? currentMappings : undefined,
        }),
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();
      const mappings: FieldMapping[] = (data.mappings || []).map((m: FieldMapping) => ({
        ...m, source_type: m.source_type || "unmapped", _id: nextMappingId++, confidence: m.confidence ?? 0, user_edited: false,
      }));
      setSteps((prev) => prev.map((s) =>
        s.id === stepId && s.type === "map" ? { ...s, config: { field_mappings: mappings } } as PipelineStep : s
      ));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("AI suggestion timed out. Try with fewer sources or a faster model.");
      } else {
        setError(err instanceof Error ? err.message : "AI suggestion failed");
      }
    } finally {
      setAiLoading(false);
    }
  }, [connections, steps, llmConfig]);

  // --- AI Build Pipeline ---

  const handleAIBuild = useCallback(async () => {
    setAiBuildLoading(true);
    setError("");
    try {
      const srcContracts: Record<string, unknown> = {};
      const dstContracts: Record<string, unknown> = {};
      for (const c of connections) {
        if (!c.contract) continue;
        for (const idx of c.selectedSchemaIndices) {
          const ref = schemaRef(c, idx);
          const sc = extractSchemaContract(c.contract, idx);
          if (c.role === "source" || c.role === "both") srcContracts[ref] = sc;
          if (c.role === "destination" || c.role === "both") dstContracts[ref] = sc;
        }
      }
      const existingUserSteps = steps.filter((s) => s.user_created);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);
      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/ai-pipeline-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          provider: llmConfig.provider, api_key: llmConfig.apiKey, model: llmConfig.model,
          source_contracts: srcContracts, destination_contracts: dstContracts,
          existing_steps_by_destination: existingUserSteps.length > 0 ? { pipeline: existingUserSteps } : undefined,
        }),
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();
      const stepsByDest = data.steps_by_destination as Record<string, PipelineStep[]> | undefined;
      const allSteps: PipelineStep[] = [];
      if (stepsByDest) {
        for (const destSteps of Object.values(stepsByDest)) {
          for (const s of destSteps) {
            allSteps.push({ ...s, id: s.id || `step_${crypto.randomUUID().slice(0, 8)}`, user_created: s.user_created ?? false });
          }
        }
      }
      setSteps(allSteps);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Pipeline plan generation timed out. Try with fewer sources/destinations or a faster model.");
      } else {
        setError(err instanceof Error ? err.message : "Pipeline plan generation failed");
      }
    } finally {
      setAiBuildLoading(false);
    }
  }, [connections, steps, llmConfig]);

  // --- Build pipeline contract ---

  const pipelineContract: PipelineContract | null = useMemo(() => {
    if (steps.length === 0) return null;
    const sources: Record<string, { contract_ref: string }> = {};
    const destinations: Record<string, { contract_ref: string }> = {};
    for (const c of connections) {
      if (!c.contract) continue;
      for (const idx of c.selectedSchemaIndices) {
        const ref = schemaRef(c, idx);
        if (c.role === "source" || c.role === "both") sources[ref] = { contract_ref: ref };
        if (c.role === "destination" || c.role === "both") destinations[ref] = { contract_ref: ref };
      }
    }
    return {
      contract_type: "pipeline" as const,
      pipeline_id: "draft",
      sources,
      destinations,
      steps,
      metadata: pipelineNotes ? { notes: pipelineNotes } : undefined,
    };
  }, [connections, steps, pipelineNotes]);

  return (
    <div className="space-y-8">
      <ConnectionList
        connections={connections}
        onConnectionChange={handleConnectionChange}
        onSchemaToggle={handleSchemaToggle}
        onLabelChange={handleLabelChange}
        onRoleChange={handleRoleChange}
        onAdd={handleAddConnection}
        onRemove={handleRemoveConnection}
      />

      <LLMSettings config={llmConfig} onChange={setLlmConfig} />

      <DataFlowSteps
        steps={steps}
        onChange={setSteps}
        sourceGroups={sourceGroups}
        destGroups={destGroups}
        destOptions={destOptions}
        onGenerateMappings={handleGenerateMappings}
        onAISuggestMappings={handleAISuggestMappings}
        onAIBuild={handleAIBuild}
        mappingLoading={generating}
        aiLoading={aiLoading}
        aiBuildLoading={aiBuildLoading}
        canGenerate={canGenerate}
        canAISuggest={canAISuggest}
        canAIBuild={canAISuggest}
        notes={pipelineNotes}
        onNotesChange={setPipelineNotes}
      />

      {error && (
        <div className="p-4 border-l-4 rounded-r flex items-start justify-between"
          style={{ backgroundColor: "oklch(95% 0.02 20)", borderColor: "oklch(55% 0.15 20)" }}>
          <p className="text-sm font-medium" style={{ color: "oklch(35% 0.08 20)" }}>{error}</p>
          <button type="button" onClick={() => setError("")}
            className="text-sm ml-4 px-2 py-0.5 rounded" style={{ color: "oklch(50% 0.05 20)" }}>×</button>
        </div>
      )}

      {pipelineContract && <RawJSON data={pipelineContract} />}
    </div>
  );
}

// --- Helpers ---

function isDataContract(c: SourceContract | DataContract): c is DataContract {
  return "schemas" in c && "id" in c;
}

function extractFieldNames(contract: SourceContract | DataContract, schemaIndex: number): string[] {
  if (isDataContract(contract)) return contract.schemas[schemaIndex]?.fields.map((f) => f.name) ?? [];
  return contract.fields.map((f) => f.name);
}

function getSchemaName(contract: SourceContract | DataContract, schemaIndex: number): string | null {
  if (!isDataContract(contract) || contract.schemas.length <= 1) return null;
  return contract.schemas[schemaIndex]?.name ?? `schema_${schemaIndex}`;
}

function schemaRef(entry: { label: string; contract: SourceContract | DataContract | null }, schemaIndex: number): string {
  if (!entry.contract) return entry.label;
  const name = getSchemaName(entry.contract, schemaIndex);
  return name ? `${entry.label}.${name}` : entry.label;
}

function extractSchemaContract(contract: SourceContract | DataContract, schemaIndex: number): SourceContract | DataContract {
  if (!isDataContract(contract)) return contract;
  if (contract.schemas.length <= 1) return contract;
  return { ...contract, schemas: [contract.schemas[schemaIndex]] };
}

function deriveLabel(contract: SourceContract | DataContract, fallback: string): string {
  if (isDataContract(contract)) {
    if (contract.schemas.length === 1) return contract.schemas[0].name;
    return contract.id || fallback;
  }
  const sc = contract as SourceContract;
  if (sc.source_path) {
    const parts = sc.source_path.split("/");
    return parts[parts.length - 1] || fallback;
  }
  return sc.source_format || fallback;
}
