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
import { API_BASE } from "@/lib/constants";
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
  return { id, label: `Source ${id}`, contract: null, schemaIndex: 0 };
}

function newDestEntry(): DestEntry {
  const id = `d${nextId++}`;
  return { id, label: `Destination ${id}`, contract: null, schemaIndex: 0, mappings: [], verifyResult: null };
}

export function TransformTab() {
  const [sources, setSources] = useState<SourceEntry[]>([newSourceEntry()]);
  const [destinations, setDestinations] = useState<DestEntry[]>([newDestEntry()]);
  const [activeDestTab, setActiveDestTab] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
  });

  // Ensure activeDestTab is valid.
  const activeDest = destinations.find((d) => d.id === activeDestTab) ?? destinations[0];
  const activeDestId = activeDest?.id ?? "";

  // --- Source handlers ---
  const handleSourceChange = useCallback((id: string, contract: SourceContract | DataContract | null) => {
    setSources((prev) => prev.map((s) => s.id === id
      ? { ...s, contract, schemaIndex: 0, label: contract ? deriveLabel(contract, s.label) : s.label }
      : s
    ));
    setDestinations((prev) => prev.map((d) => ({ ...d, mappings: [], verifyResult: null })));
  }, []);

  const handleSourceSchemaSelect = useCallback((id: string, index: number) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, schemaIndex: index } : s));
    setDestinations((prev) => prev.map((d) => ({ ...d, mappings: [], verifyResult: null })));
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
    setDestinations((prev) => prev.map((d) => ({ ...d, mappings: [], verifyResult: null })));
  }, []);

  // --- Destination handlers ---
  const handleDestChange = useCallback((id: string, contract: SourceContract | DataContract | null) => {
    setDestinations((prev) => prev.map((d) => d.id === id
      ? { ...d, contract, schemaIndex: 0, label: contract ? deriveLabel(contract, d.label) : d.label, mappings: [], verifyResult: null }
      : d
    ));
  }, []);

  const handleDestSchemaSelect = useCallback((id: string, index: number) => {
    setDestinations((prev) => prev.map((d) => d.id === id ? { ...d, schemaIndex: index, mappings: [], verifyResult: null } : d));
  }, []);

  const handleDestLabelChange = useCallback((id: string, label: string) => {
    setDestinations((prev) => prev.map((d) => d.id === id ? { ...d, label } : d));
  }, []);

  const handleAddDest = useCallback(() => {
    const entry = newDestEntry();
    setDestinations((prev) => [...prev, entry]);
    setActiveDestTab(entry.id);
  }, []);

  const handleRemoveDest = useCallback((id: string) => {
    setDestinations((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) return prev;
      return filtered;
    });
    // Reset active tab if needed -- use a separate setState to avoid
    // batching issues inside the updater.
    if (activeDestTab === id) {
      setDestinations((prev) => {
        if (prev.length > 0) setActiveDestTab(prev[0].id);
        return prev;
      });
    }
  }, [activeDestTab]);

  const handleMappingsChange = useCallback((destId: string, newMappings: FieldMapping[]) => {
    setDestinations((prev) => prev.map((d) =>
      d.id === destId ? { ...d, mappings: newMappings, verifyResult: null } : d
    ));
  }, []);

  // --- Derived data ---
  const sourceGroups: NamedSourceGroup[] = sources
    .filter((s) => s.contract)
    .map((s) => ({
      ref: s.label,
      fieldNames: extractFieldNames(s.contract!, s.schemaIndex),
    }));

  const activeDestFields = activeDest ? extractDestFields(activeDest.contract, activeDest.schemaIndex) : [];
  const canGenerate = sourceGroups.length > 0 && activeDestFields.length > 0;
  const canAISuggest = canGenerate && llmConfig.apiKey.trim().length > 0;

  // --- Generate (deterministic) ---
  const handleGenerate = async () => {
    if (!activeDest) return;
    const targetDestId = activeDest.id;
    setGenerating(true);
    setError("");
    try {
      const apiSources = sources
        .filter((s) => s.contract)
        .map((s) => ({
          ref: s.label,
          fields: extractAPIFields(s.contract!, s.schemaIndex),
        }));

      const destFields = extractAPIFields(activeDest.contract!, activeDest.schemaIndex);

      const resp = await fetch(`${API_BASE}/api/v1/suggest-mappings-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: apiSources,
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
      handleMappingsChange(targetDestId, generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mappings");
    } finally {
      setGenerating(false);
    }
  };

  // --- AI Suggest ---
  const handleAISuggest = async () => {
    if (!activeDest || !activeDest.contract) return;
    const targetDestId = activeDest.id;
    const currentMappings = activeDest.mappings;
    setAiLoading(true);
    setError("");
    try {
      const sourceContracts: Record<string, unknown> = {};
      for (const s of sources) {
        if (s.contract) {
          sourceContracts[s.label] = extractSchemaContract(s.contract, s.schemaIndex);
        }
      }
      const destContracts: Record<string, unknown> = {};
      destContracts[activeDest.label] = extractSchemaContract(activeDest.contract, activeDest.schemaIndex);

      const resp = await fetch(`${API_BASE}/api/v1/ai-suggest-mappings`, {
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
        if (userEdited) {
          return { ...userEdited, _id: userEdited._id ?? nextMappingId++ };
        }
        return { ...m, source_type: m.source_type || "unmapped", _id: nextMappingId++, confidence: m.confidence ?? 0, user_edited: false };
      });

      for (const [destField, userEdited] of userEditedMap) {
        if (!aiDestFields.has(destField)) {
          merged.push({ ...userEdited, _id: userEdited._id ?? nextMappingId++ });
        }
      }

      handleMappingsChange(targetDestId, merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  // --- Verify ---
  const handleVerify = async () => {
    if (!activeDest) return;
    const targetDestId = activeDest.id;
    setVerifying(true);
    setError("");
    try {
      const transformContract = buildTransformContract(sources, destinations);

      const sourcesMap: Record<string, unknown> = {};
      for (const s of sources) {
        if (s.contract) {
          sourcesMap[s.label] = extractSchemaContract(s.contract, s.schemaIndex);
        }
      }
      const destsMap: Record<string, unknown> = {};
      for (const d of destinations) {
        if (d.contract) {
          destsMap[d.label] = extractSchemaContract(d.contract, d.schemaIndex);
        }
      }

      const resp = await fetch(`${API_BASE}/api/v1/verify-transformation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transformation: transformContract,
          sources: sourcesMap,
          destinations: destsMap,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const result: VerifyResult = await resp.json();
      setDestinations((prev) => prev.map((d) =>
        d.id === targetDestId ? { ...d, verifyResult: result } : d
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const loading = generating || verifying;
  const transformContract = destinations.some((d) => d.mappings.length > 0)
    ? buildTransformContract(sources, destinations) : null;

  return (
    <div className="space-y-8">
      {/* Side-by-side source/destination lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SourceList
          sources={sources}
          onSourceChange={handleSourceChange}
          onSchemaSelect={handleSourceSchemaSelect}
          onLabelChange={handleSourceLabelChange}
          onAdd={handleAddSource}
          onRemove={handleRemoveSource}
        />
        <DestinationList
          destinations={destinations}
          onDestChange={handleDestChange}
          onSchemaSelect={handleDestSchemaSelect}
          onLabelChange={handleDestLabelChange}
          onAdd={handleAddDest}
          onRemove={handleRemoveDest}
        />
      </div>

      {/* LLM Settings */}
      <LLMSettings config={llmConfig} onChange={setLlmConfig} />

      {/* Destination tabs (only when multiple destinations) */}
      {destinations.length > 1 && (
        <div className="flex gap-1 border-b" style={{ borderColor: "oklch(90% 0.005 80)" }}>
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDestTab(d.id)}
              className="px-4 py-2 text-xs font-semibold transition-all rounded-t-lg"
              style={{
                backgroundColor: d.id === activeDestId ? "oklch(100% 0 0)" : "transparent",
                color: d.id === activeDestId ? "oklch(25% 0.01 80)" : "oklch(55% 0.01 80)",
                borderBottom: d.id === activeDestId ? "2px solid oklch(35% 0.05 260)" : "2px solid transparent",
              }}
            >
              {d.label} ({extractDestFields(d.contract, d.schemaIndex).length})
            </button>
          ))}
        </div>
      )}

      {/* Mapping editor for active destination */}
      {activeDest && (
        <MappingEditor
          mappings={activeDest.mappings}
          sourceGroups={sourceGroups}
          destFields={activeDestFields}
          onMappingsChange={(m) => handleMappingsChange(activeDestId, m)}
          onGenerate={handleGenerate}
          onAISuggest={handleAISuggest}
          onVerify={handleVerify}
          verifyResult={activeDest.verifyResult}
          loading={loading}
          canGenerate={canGenerate}
          canAISuggest={canAISuggest}
          aiLoading={aiLoading}
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

function buildTransformContract(sources: SourceEntry[], destinations: DestEntry[]): TransformContract {
  const sourceRefs = sources.filter((s) => s.contract).map((s) => s.label);
  const destRefs = destinations.filter((d) => d.contract).map((d) => d.label);

  const mappingGroups: MappingGroup[] = destinations
    .filter((d) => d.mappings.length > 0)
    .map((d) => ({
      destination_ref: d.label,
      field_mappings: d.mappings.map((m) => ({
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
    }));

  return {
    contract_type: "transformation",
    transformation_id: "manual",
    source_refs: sourceRefs,
    destination_refs: destRefs,
    mapping_groups: mappingGroups,
    execution_plan: {
      batch_size: 100,
      error_threshold: 0.1,
      validation_enabled: true,
    },
  };
}
