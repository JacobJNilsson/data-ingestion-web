"use client";

import { useCallback, useState } from "react";
import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import { MappingEditor } from "@/components/MappingEditor";
import type { MappingRow } from "@/components/MappingEditor";
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
  VerifyResult,
} from "@/types/contract";

let nextMappingId = 1;

export function TransformTab() {
  const [sourceContract, setSourceContract] = useState<SourceContract | DataContract | null>(null);
  const [destContract, setDestContract] = useState<SourceContract | DataContract | null>(null);
  const [sourceSchemaIdx, setSourceSchemaIdx] = useState(0);
  const [destSchemaIdx, setDestSchemaIdx] = useState(0);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
  });

  const handleSourceChange = useCallback((contract: SourceContract | DataContract | null) => {
    setSourceContract(contract);
    setSourceSchemaIdx(0);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleDestChange = useCallback((contract: SourceContract | DataContract | null) => {
    setDestContract(contract);
    setDestSchemaIdx(0);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleSourceSchemaSelect = useCallback((idx: number) => {
    setSourceSchemaIdx(idx);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleDestSchemaSelect = useCallback((idx: number) => {
    setDestSchemaIdx(idx);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleMappingsChange = useCallback((newMappings: FieldMapping[]) => {
    setMappings(newMappings);
    setVerifyResult(null);
  }, []);

  const sourceFields = extractFields(sourceContract, sourceSchemaIdx);
  const destFields = extractFields(destContract, destSchemaIdx);
  const destFieldsFull = extractDestFields(destContract, destSchemaIdx);
  const sourceFieldNames = sourceFields.map((f) => f.Name);
  const canGenerate = sourceFields.length > 0 && destFields.length > 0;
  const canAISuggest = canGenerate && llmConfig.apiKey.trim().length > 0;

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setVerifyResult(null);
    try {
      const resp = await fetch(`${API_BASE}/api/v1/suggest-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_fields: sourceFields,
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
      setMappings(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mappings");
    } finally {
      setGenerating(false);
    }
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    setError("");
    setVerifyResult(null);
    try {
      // Build contract context for the selected schemas.
      const sourceCtx = extractSchemaContract(sourceContract, sourceSchemaIdx);
      const destCtx = extractSchemaContract(destContract, destSchemaIdx);

      const resp = await fetch(`${API_BASE}/api/v1/ai-suggest-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: llmConfig.provider,
          api_key: llmConfig.apiKey,
          model: llmConfig.model,
          source_contract: sourceCtx,
          destination_contract: destCtx,
          current_mappings: mappings.length > 0 ? mappings : undefined,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      const data = await resp.json();

      // Merge: preserve user-edited mappings, update the rest.
      const userEditedMap = new Map(
        (mappings as MappingRow[]).filter((m) => m.user_edited).map((m) => [m.destination_field, m])
      );

      const aiMappings: FieldMapping[] = data.mappings || [];
      const aiDestFields = new Set(aiMappings.map((m: FieldMapping) => m.destination_field));

      const merged: MappingRow[] = aiMappings.map((m: FieldMapping) => {
        const userEdited = userEditedMap.get(m.destination_field);
        if (userEdited) {
          return { ...userEdited, _id: userEdited._id ?? nextMappingId++ };
        }
        return {
          ...m,
          source_type: m.source_type || "unmapped",
          _id: nextMappingId++,
          confidence: m.confidence ?? 0,
          user_edited: false,
        };
      });

      // Append user-edited rows that the AI response omitted.
      for (const [destField, userEdited] of userEditedMap) {
        if (!aiDestFields.has(destField)) {
          merged.push({ ...userEdited, _id: userEdited._id ?? nextMappingId++ });
        }
      }

      setMappings(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError("");
    try {
      const transformContract = buildTransformContract(mappings);
      const resp = await fetch(`${API_BASE}/api/v1/verify-transformation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transformation: transformContract,
          source: sourceContract,
          destination: destContract,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      setVerifyResult(await resp.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const loading = generating || verifying;
  const transformContract = mappings.length > 0 ? buildTransformContract(mappings) : null;

  return (
    <div className="space-y-8">
      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnalyzerPanel
          label="Source"
          contract={sourceContract}
          selectedSchemaIndex={sourceSchemaIdx}
          onContractChange={handleSourceChange}
          onSchemaSelect={handleSourceSchemaSelect}
        />
        <AnalyzerPanel
          label="Destination"
          contract={destContract}
          selectedSchemaIndex={destSchemaIdx}
          onContractChange={handleDestChange}
          onSchemaSelect={handleDestSchemaSelect}
        />
      </div>

      {/* LLM Settings */}
      <LLMSettings config={llmConfig} onChange={setLlmConfig} />

      {/* Mapping editor */}
      <MappingEditor
        mappings={mappings}
        sourceFieldNames={sourceFieldNames}
        destFields={destFieldsFull}
        onMappingsChange={handleMappingsChange}
        onGenerate={handleGenerate}
        onAISuggest={handleAISuggest}
        onVerify={handleVerify}
        verifyResult={verifyResult}
        loading={loading}
        canGenerate={canGenerate}
        canAISuggest={canAISuggest}
        aiLoading={aiLoading}
      />

      {/* Error */}
      {error && (
        <div
          className="p-4 border-l-4 rounded-r flex items-start justify-between"
          style={{ backgroundColor: "oklch(95% 0.02 20)", borderColor: "oklch(55% 0.15 20)" }}
        >
          <p className="text-sm font-medium" style={{ color: "oklch(35% 0.08 20)" }}>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-sm ml-4 px-2 py-0.5 rounded"
            style={{ color: "oklch(50% 0.05 20)" }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Raw JSON of the transformation contract */}
      {transformContract && <RawJSON data={transformContract} />}
    </div>
  );
}

// --- helpers ----------------------------------------------------------------

interface APIField {
  Name: string;
  DataType: string;
  Nullable?: boolean;
}

function isDataContract(c: SourceContract | DataContract): c is DataContract {
  return "schemas" in c && "id" in c;
}

function extractFields(contract: SourceContract | DataContract | null, schemaIndex: number): APIField[] {
  if (!contract) return [];

  if (isDataContract(contract)) {
    const schema = contract.schemas[schemaIndex];
    if (!schema) return [];
    return schema.fields.map((f) => ({
      Name: f.name,
      DataType: f.data_type,
      Nullable: f.nullable,
    }));
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

// extractSchemaContract returns the full contract for the selected schema.
// For DataContracts with multiple schemas, it returns a contract with only
// the selected schema. For SourceContracts, it returns the contract as-is.
function extractSchemaContract(
  contract: SourceContract | DataContract | null,
  schemaIndex: number
): SourceContract | DataContract | null {
  if (!contract) return null;
  if (!isDataContract(contract)) return contract;
  if (contract.schemas.length <= 1) return contract;

  // Return a contract with only the selected schema.
  return {
    ...contract,
    schemas: [contract.schemas[schemaIndex]],
  };
}

function buildTransformContract(mappings: FieldMapping[]): TransformContract {
  return {
    contract_type: "transformation",
    transformation_id: "manual",
    source_ref: "source",
    destination_ref: "destination",
    field_mappings: mappings.map((m) => ({
      destination_field: m.destination_field,
      source_type: m.source_type || "unmapped",
      source_field: m.source_type === "field" ? m.source_field : undefined,
      source_constant: m.source_type === "constant" ? m.source_constant : undefined,
      transformation: m.transformation,
      confidence: m.confidence,
      user_edited: m.user_edited,
    })),
    execution_plan: {
      batch_size: 100,
      error_threshold: 0.1,
      validation_enabled: true,
    },
  };
}
