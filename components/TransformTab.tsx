"use client";

import { useCallback, useState } from "react";
import { SourceList } from "@/components/SourceList";
import type { SourceEntry } from "@/components/SourceList";
import { DestinationList } from "@/components/DestinationList";
import type { DestEntry } from "@/components/DestinationList";
import { MappingEditor } from "@/components/MappingEditor";
import type { MappingRow, NamedSourceGroup } from "@/components/MappingEditor";
import { LLMSettings } from "@/components/LLMSettings";
import type { LLMConfig } from "@/components/LLMSettings";
import { RawJSON } from "@/components/RawJSON";
import { DATA_INGESTION_API_URL } from "@/lib/constants";
import type {
  SourceContract,
  DataContract,
  DestinationField,
  FieldMapping,
  TransformContract,
  MappingGroup,
  VerifyResult,
} from "@/types/contract";

let nextId = 1;
let nextMappingId = 1;

function newSourceEntry(): SourceEntry {
  const id = `s${nextId++}`;
  return { id, label: `Source ${id}`, contract: null, selectedSchemaIndices: [] };
}

function newDestEntry(): DestEntry {
  const id = `d${nextId++}`;
  return {
    id, label: `Destination ${id}`, contract: null, selectedSchemaIndices: [],
    mappingsBySchema: {}, verifyResultBySchema: {},
    executionOrderBySchema: {}, preStepsBySchema: {}, postStepsBySchema: {}, notesBySchema: {},
  };
}

// A destination tab represents one checked schema from one destination entry.
interface DestTab {
  key: string;           // unique key: "entryId:schemaIndex"
  entryId: string;
  schemaIndex: number;
  label: string;         // "entryLabel.schemaName" or just "entryLabel"
  fields: DestinationField[];
}

export function TransformTab() {
  const [sources, setSources] = useState<SourceEntry[]>([newSourceEntry()]);
  const [destinations, setDestinations] = useState<DestEntry[]>([newDestEntry()]);
  const [activeDestTabKey, setActiveDestTabKey] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
  });

  // --- Derive destination tabs from all checked schemas across all dest entries ---
  const destTabs: DestTab[] = [];
  for (const d of destinations) {
    if (!d.contract) continue;
    for (const idx of d.selectedSchemaIndices) {
      const schemaName = getSchemaName(d.contract, idx);
      const tabLabel = schemaName ? `${d.label}.${schemaName}` : d.label;
      destTabs.push({
        key: `${d.id}:${idx}`,
        entryId: d.id,
        schemaIndex: idx,
        label: tabLabel,
        fields: extractDestFields(d.contract, idx),
      });
    }
  }

  // Active tab: find by key, fall back to first.
  const activeTab = destTabs.find((t) => t.key === activeDestTabKey) ?? destTabs[0] ?? null;
  const activeTabKey = activeTab?.key ?? "";

  // Get mappings/verifyResult/dataflow state for active tab.
  const activeEntry = activeTab ? destinations.find((d) => d.id === activeTab.entryId) : null;
  const activeSchemaIdx = activeTab?.schemaIndex ?? 0;
  const activeMappings = activeEntry?.mappingsBySchema[activeSchemaIdx] ?? [];
  const activeVerifyResult = activeEntry?.verifyResultBySchema[activeSchemaIdx] ?? null;

  // --- Source handlers ---
  const handleSourceChange = useCallback((id: string, contract: SourceContract | DataContract | null) => {
    setSources((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      // Auto-select first schema (or only schema for single-schema contracts).
      const indices = contract ? [0] : [];
      return { ...s, contract, selectedSchemaIndices: indices, label: contract ? deriveLabel(contract, s.label) : s.label };
    }));
    setDestinations((prev) => prev.map((d) => ({ ...d, mappingsBySchema: {}, verifyResultBySchema: {} })));
  }, []);

  const handleSourceSchemaToggle = useCallback((id: string, index: number) => {
    setSources((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const indices = s.selectedSchemaIndices.includes(index)
        ? s.selectedSchemaIndices.filter((i) => i !== index)
        : [...s.selectedSchemaIndices, index].sort();
      // Don't allow deselecting all -- keep at least one.
      if (indices.length === 0) return s;
      return { ...s, selectedSchemaIndices: indices };
    }));
    setDestinations((prev) => prev.map((d) => ({ ...d, mappingsBySchema: {}, verifyResultBySchema: {} })));
  }, []);

  const handleSourceLabelChange = useCallback((id: string, label: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, label } : s));
  }, []);

  const handleAddSource = useCallback(() => {
    setSources((prev) => [...prev, newSourceEntry()]);
  }, []);

  const handleRemoveSource = useCallback((id: string) => {
    setSources((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.length > 0 ? filtered : prev;
    });
    setDestinations((prev) => prev.map((d) => ({ ...d, mappingsBySchema: {}, verifyResultBySchema: {} })));
  }, []);

  // --- Destination handlers ---
  const handleDestChange = useCallback((id: string, contract: SourceContract | DataContract | null) => {
    setDestinations((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const indices = contract ? [0] : [];
      return {
        ...d, contract, selectedSchemaIndices: indices, label: contract ? deriveLabel(contract, d.label) : d.label,
        mappingsBySchema: {}, verifyResultBySchema: {},
        executionOrderBySchema: {}, preStepsBySchema: {}, postStepsBySchema: {}, notesBySchema: {},
      };
    }));
  }, []);

  const handleDestSchemaToggle = useCallback((id: string, index: number) => {
    setDestinations((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const indices = d.selectedSchemaIndices.includes(index)
        ? d.selectedSchemaIndices.filter((i) => i !== index)
        : [...d.selectedSchemaIndices, index].sort();
      if (indices.length === 0) return d;
      // Remove all per-schema state for deselected schemas.
      const newMappings = { ...d.mappingsBySchema };
      const newVerify = { ...d.verifyResultBySchema };
      const newExecOrder = { ...d.executionOrderBySchema };
      const newPreSteps = { ...d.preStepsBySchema };
      const newPostSteps = { ...d.postStepsBySchema };
      const newNotes = { ...d.notesBySchema };
      // Collect all schema indices across all per-schema maps.
      const allKeys = new Set([
        ...Object.keys(newMappings), ...Object.keys(newVerify),
        ...Object.keys(newExecOrder), ...Object.keys(newPreSteps),
        ...Object.keys(newPostSteps), ...Object.keys(newNotes),
      ].map(Number));
      for (const key of allKeys) {
        if (!indices.includes(key)) {
          delete newMappings[key];
          delete newVerify[key];
          delete newExecOrder[key];
          delete newPreSteps[key];
          delete newPostSteps[key];
          delete newNotes[key];
        }
      }
      return {
        ...d, selectedSchemaIndices: indices,
        mappingsBySchema: newMappings, verifyResultBySchema: newVerify,
        executionOrderBySchema: newExecOrder, preStepsBySchema: newPreSteps,
        postStepsBySchema: newPostSteps, notesBySchema: newNotes,
      };
    }));
  }, []);

  const handleDestLabelChange = useCallback((id: string, label: string) => {
    setDestinations((prev) => prev.map((d) => d.id === id ? { ...d, label } : d));
  }, []);

  const handleAddDest = useCallback(() => {
    const entry = newDestEntry();
    setDestinations((prev) => [...prev, entry]);
  }, []);

  const handleRemoveDest = useCallback((id: string) => {
    setDestinations((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) return prev;
      return filtered;
    });
  }, []);

  const handleMappingsChange = useCallback((entryId: string, schemaIndex: number, newMappings: FieldMapping[]) => {
    setDestinations((prev) => prev.map((d) =>
      d.id === entryId
        ? { ...d, mappingsBySchema: { ...d.mappingsBySchema, [schemaIndex]: newMappings }, verifyResultBySchema: { ...d.verifyResultBySchema, [schemaIndex]: null } }
        : d
    ));
  }, []);

  // --- Derived source groups: flatten checked schemas across all source entries ---
  const sourceGroups: NamedSourceGroup[] = [];
  for (const s of sources) {
    if (!s.contract) continue;
    for (const idx of s.selectedSchemaIndices) {
      const ref = schemaRef(s, idx);
      sourceGroups.push({
        ref,
        fieldNames: extractFieldNames(s.contract, idx),
      });
    }
  }

  const canGenerate = sourceGroups.length > 0 && (activeTab?.fields.length ?? 0) > 0;
  const canAISuggest = canGenerate && llmConfig.apiKey.trim().length > 0;

  // --- Generate (deterministic) ---
  const handleGenerate = async () => {
    if (!activeTab || !activeEntry) return;
    const { entryId, schemaIndex } = activeTab;
    setGenerating(true);
    setError("");
    try {
      // Build source fields with types.
      const properSources: { ref: string; fields: { Name: string; DataType: string; Nullable?: boolean }[] }[] = [];
      for (const s of sources) {
        if (!s.contract) continue;
        for (const idx of s.selectedSchemaIndices) {
          properSources.push({ ref: schemaRef(s, idx), fields: extractAPIFields(s.contract, idx) });
        }
      }

      const destFields = extractAPIFields(activeEntry.contract!, schemaIndex);

      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/suggest-mappings-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: properSources,
          destination_ref: activeTab.label,
          destination_fields: destFields,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();
      const generated: FieldMapping[] = (data.mappings || []).map((m: FieldMapping) => ({
        ...m,
        source_type: m.source_type || (m.source_field ? "field" : "unmapped"),
        _id: nextMappingId++,
        confidence: m.confidence ?? 0,
        user_edited: false,
      }));
      handleMappingsChange(entryId, schemaIndex, generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mappings");
    } finally {
      setGenerating(false);
    }
  };

  // --- AI Suggest ---
  const handleAISuggest = async () => {
    if (!activeTab || !activeEntry?.contract) return;
    const { entryId, schemaIndex } = activeTab;
    const currentMappings = activeMappings;
    setAiLoading(true);
    setError("");
    try {
      // Build source contracts map.
      const sourceContracts: Record<string, unknown> = {};
      for (const s of sources) {
        if (!s.contract) continue;
        for (const idx of s.selectedSchemaIndices) {
          sourceContracts[schemaRef(s, idx)] = extractSchemaContract(s.contract, idx);
        }
      }

      const destContracts: Record<string, unknown> = {};
      destContracts[activeTab.label] = extractSchemaContract(activeEntry.contract, schemaIndex);

      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/ai-suggest-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: llmConfig.provider,
          api_key: llmConfig.apiKey,
          model: llmConfig.model,
          source_contracts: sourceContracts,
          destination_contracts: destContracts,
          current_mappings: currentMappings.length > 0 ? currentMappings : undefined,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();

      // Merge: preserve user-edited mappings.
      const userEditedMap = new Map(
        (currentMappings as MappingRow[]).filter((m) => m.user_edited).map((m) => [m.destination_field, m])
      );
      const aiMappings: FieldMapping[] = data.mappings || [];
      const aiDestFields = new Set(aiMappings.map((m: FieldMapping) => m.destination_field));
      const merged: MappingRow[] = aiMappings.map((m: FieldMapping) => {
        const userEdited = userEditedMap.get(m.destination_field);
        if (userEdited) return { ...userEdited, _id: userEdited._id ?? nextMappingId++ };
        return { ...m, source_type: m.source_type || "unmapped", _id: nextMappingId++, confidence: m.confidence ?? 0, user_edited: false };
      });
      for (const [destField, userEdited] of userEditedMap) {
        if (!aiDestFields.has(destField)) {
          merged.push({ ...userEdited, _id: userEdited._id ?? nextMappingId++ });
        }
      }
      handleMappingsChange(entryId, schemaIndex, merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  // --- Verify ---
  const handleVerify = async () => {
    if (!activeTab || !activeEntry) return;
    const { entryId, schemaIndex } = activeTab;
    setVerifying(true);
    setError("");
    try {
      const transformContract = buildTransformContract(sources, destinations);

      const sourcesMap: Record<string, unknown> = {};
      for (const s of sources) {
        if (!s.contract) continue;
        for (const idx of s.selectedSchemaIndices) {
          sourcesMap[schemaRef(s, idx)] = extractSchemaContract(s.contract, idx);
        }
      }
      const destsMap: Record<string, unknown> = {};
      for (const d of destinations) {
        if (!d.contract) continue;
        for (const idx of d.selectedSchemaIndices) {
          destsMap[schemaRef(d, idx)] = extractSchemaContract(d.contract, idx);
        }
      }

      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/verify-transformation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transformation: transformContract, sources: sourcesMap, destinations: destsMap }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const result: VerifyResult = await resp.json();
      setDestinations((prev) => prev.map((d) =>
        d.id === entryId
          ? { ...d, verifyResultBySchema: { ...d.verifyResultBySchema, [schemaIndex]: result } }
          : d
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const loading = generating || verifying;
  const hasAnyMappings = destinations.some((d) => Object.values(d.mappingsBySchema).some((m) => m.length > 0));
  const transformContract = hasAnyMappings ? buildTransformContract(sources, destinations) : null;

  return (
    <div className="space-y-8">
      {/* Side-by-side source/destination lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SourceList
          sources={sources}
          onSourceChange={handleSourceChange}
          onSchemaToggle={handleSourceSchemaToggle}
          onLabelChange={handleSourceLabelChange}
          onAdd={handleAddSource}
          onRemove={handleRemoveSource}
        />
        <DestinationList
          destinations={destinations}
          onDestChange={handleDestChange}
          onSchemaToggle={handleDestSchemaToggle}
          onLabelChange={handleDestLabelChange}
          onAdd={handleAddDest}
          onRemove={handleRemoveDest}
        />
      </div>

      {/* LLM Settings */}
      <LLMSettings config={llmConfig} onChange={setLlmConfig} />

      {/* Destination tabs (only when multiple dest schemas selected) */}
      {destTabs.length > 1 && (
        <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "oklch(90% 0.005 80)" }}>
          {destTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveDestTabKey(tab.key)}
              className="px-4 py-2 text-xs font-semibold transition-all rounded-t-lg whitespace-nowrap"
              style={{
                backgroundColor: tab.key === activeTabKey ? "oklch(100% 0 0)" : "transparent",
                color: tab.key === activeTabKey ? "oklch(25% 0.01 80)" : "oklch(55% 0.01 80)",
                borderBottom: tab.key === activeTabKey ? "2px solid oklch(35% 0.05 260)" : "2px solid transparent",
              }}
            >
              {tab.label} ({tab.fields.length})
            </button>
          ))}
        </div>
      )}

      {/* Mapping editor for active destination tab.
          The closures capture activeTab from the render scope. This is safe
          because React re-renders synchronously on tab switch, so closures
          are always fresh before the next user interaction. */}
      {activeTab && (
        <MappingEditor
          mappings={activeMappings}
          sourceGroups={sourceGroups}
          destFields={activeTab.fields}
          onMappingsChange={(m) => handleMappingsChange(activeTab.entryId, activeTab.schemaIndex, m)}
          onGenerate={handleGenerate}
          onAISuggest={handleAISuggest}
          onVerify={handleVerify}
          verifyResult={activeVerifyResult}
          loading={loading}
          canGenerate={canGenerate}
          canAISuggest={canAISuggest}
          aiLoading={aiLoading}
          executionOrder={activeEntry?.executionOrderBySchema[activeSchemaIdx] ?? 1}
          onExecutionOrderChange={(order) => {
            if (!activeTab) return;
            setDestinations((prev) => prev.map((d) =>
              d.id === activeTab.entryId
                ? { ...d, executionOrderBySchema: { ...d.executionOrderBySchema, [activeTab.schemaIndex]: order } }
                : d
            ));
          }}
          preSteps={activeEntry?.preStepsBySchema[activeSchemaIdx] ?? []}
          onPreStepsChange={(steps) => {
            if (!activeTab) return;
            setDestinations((prev) => prev.map((d) =>
              d.id === activeTab.entryId
                ? { ...d, preStepsBySchema: { ...d.preStepsBySchema, [activeTab.schemaIndex]: steps } }
                : d
            ));
          }}
          postSteps={activeEntry?.postStepsBySchema[activeSchemaIdx] ?? []}
          onPostStepsChange={(steps) => {
            if (!activeTab) return;
            setDestinations((prev) => prev.map((d) =>
              d.id === activeTab.entryId
                ? { ...d, postStepsBySchema: { ...d.postStepsBySchema, [activeTab.schemaIndex]: steps } }
                : d
            ));
          }}
          notes={activeEntry?.notesBySchema[activeSchemaIdx] ?? ""}
          onNotesChange={(text) => {
            if (!activeTab) return;
            setDestinations((prev) => prev.map((d) =>
              d.id === activeTab.entryId
                ? { ...d, notesBySchema: { ...d.notesBySchema, [activeTab.schemaIndex]: text } }
                : d
            ));
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div
          className="p-4 border-l-4 rounded-r flex items-start justify-between"
          style={{ backgroundColor: "oklch(95% 0.02 20)", borderColor: "oklch(55% 0.15 20)" }}
        >
          <p className="text-sm font-medium" style={{ color: "oklch(35% 0.08 20)" }}>{error}</p>
          <button type="button" onClick={() => setError("")}
            className="text-sm ml-4 px-2 py-0.5 rounded" style={{ color: "oklch(50% 0.05 20)" }}
            aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Raw JSON */}
      {transformContract && <RawJSON data={transformContract} />}
    </div>
  );
}

// --- helpers ----------------------------------------------------------------

function isDataContract(c: SourceContract | DataContract): c is DataContract {
  return "schemas" in c && "id" in c;
}

function extractFieldNames(contract: SourceContract | DataContract, schemaIndex: number): string[] {
  if (isDataContract(contract)) {
    const schema = contract.schemas[schemaIndex];
    return schema?.fields.map((f) => f.name) ?? [];
  }
  return contract.fields.map((f) => f.name);
}

interface APIField {
  Name: string;
  DataType: string;
  Nullable?: boolean;
}

function extractAPIFields(contract: SourceContract | DataContract, schemaIndex: number): APIField[] {
  if (isDataContract(contract)) {
    const schema = contract.schemas[schemaIndex];
    if (!schema) return [];
    return schema.fields.map((f) => ({ Name: f.name, DataType: f.data_type, Nullable: f.nullable }));
  }
  return contract.fields.map((f) => ({ Name: f.name, DataType: f.data_type }));
}

function extractDestFields(contract: SourceContract | DataContract | null, schemaIndex: number): DestinationField[] {
  if (!contract) return [];
  if (isDataContract(contract)) {
    const schema = contract.schemas[schemaIndex];
    return schema?.fields ?? [];
  }
  return (contract as SourceContract).fields.map((f) => ({
    name: f.name,
    data_type: f.data_type,
    nullable: true,
  }));
}

function extractSchemaContract(
  contract: SourceContract | DataContract,
  schemaIndex: number
): SourceContract | DataContract {
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

// Get a specific schema's name from a contract, or null if single-schema.
function getSchemaName(contract: SourceContract | DataContract, schemaIndex: number): string | null {
  if (!isDataContract(contract) || contract.schemas.length <= 1) return null;
  return contract.schemas[schemaIndex]?.name ?? `schema_${schemaIndex}`;
}

// Build the ref label for a specific schema within an entry.
function schemaRef(entry: { label: string; contract: SourceContract | DataContract | null }, schemaIndex: number): string {
  if (!entry.contract) return entry.label;
  const name = getSchemaName(entry.contract, schemaIndex);
  return name ? `${entry.label}.${name}` : entry.label;
}

function buildTransformContract(sources: SourceEntry[], destinations: DestEntry[]): TransformContract {
  const sourceRefs: string[] = [];
  for (const s of sources) {
    if (!s.contract) continue;
    for (const idx of s.selectedSchemaIndices) {
      sourceRefs.push(schemaRef(s, idx));
    }
  }

  const destRefs: string[] = [];
  const mappingGroups: MappingGroup[] = [];
  for (const d of destinations) {
    if (!d.contract) continue;
    for (const idx of d.selectedSchemaIndices) {
      const ref = schemaRef(d, idx);
      destRefs.push(ref);
      const mappings = d.mappingsBySchema[idx] ?? [];
      const preSteps = d.preStepsBySchema[idx];
      const postSteps = d.postStepsBySchema[idx];
      const execOrder = d.executionOrderBySchema[idx];
      const notes = d.notesBySchema[idx];
      const hasContent = mappings.length > 0 || (preSteps && preSteps.length > 0) || (postSteps && postSteps.length > 0) || notes;
      if (hasContent) {
        mappingGroups.push({
          destination_ref: ref,
          field_mappings: mappings.map((m) => ({
            destination_field: m.destination_field,
            source_type: m.source_type || "unmapped",
            source_ref: m.source_type === "field" ? m.source_ref : undefined,
            source_field: m.source_type === "field" ? m.source_field : undefined,
            source_constant: m.source_type === "constant" ? m.source_constant : undefined,
            source_fields: m.source_type === "transform" ? m.source_fields : undefined,
            transform_description: m.source_type === "transform" ? m.transform_description : undefined,
            transformation: m.transformation,
            confidence: m.confidence,
            user_edited: m.user_edited,
          })),
          execution_order: execOrder,
          pre_steps: preSteps && preSteps.length > 0 ? preSteps : undefined,
          post_steps: postSteps && postSteps.length > 0 ? postSteps : undefined,
          notes: notes || undefined,
        });
      }
    }
  }

  return {
    contract_type: "transformation",
    transformation_id: "manual",
    source_refs: sourceRefs,
    destination_refs: destRefs,
    mapping_groups: mappingGroups,
    execution_plan: { batch_size: 100, error_threshold: 0.1, validation_enabled: true },
  };
}
