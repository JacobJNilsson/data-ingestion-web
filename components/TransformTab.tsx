"use client";

import { useCallback, useState } from "react";
import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import { MappingEditor } from "@/components/MappingEditor";
import { RawJSON } from "@/components/RawJSON";
import { API_BASE } from "@/lib/constants";
import type {
  SourceContract,
  DataContract,
  FieldMapping,
  TransformContract,
  VerifyResult,
} from "@/types/contract";

let nextMappingId = 1;

export function TransformTab() {
  const [sourceContract, setSourceContract] = useState<SourceContract | DataContract | null>(null);
  const [destContract, setDestContract] = useState<SourceContract | DataContract | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleSourceChange = useCallback((contract: SourceContract | DataContract | null) => {
    setSourceContract(contract);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleDestChange = useCallback((contract: SourceContract | DataContract | null) => {
    setDestContract(contract);
    setMappings([]);
    setVerifyResult(null);
  }, []);

  const handleMappingsChange = useCallback((newMappings: FieldMapping[]) => {
    setMappings(newMappings);
    setVerifyResult(null);
  }, []);

  const sourceFields = extractFields(sourceContract);
  const destFields = extractFields(destContract);
  const destFieldNames = destFields.map((f) => f.Name);
  const canGenerate = sourceFields.length > 0 && destFields.length > 0;

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
        _id: nextMappingId++,
        confidence: m.confidence ?? 0,
      }));
      setMappings(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mappings");
    } finally {
      setGenerating(false);
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
          onContractChange={handleSourceChange}
        />
        <AnalyzerPanel
          label="Destination"
          contract={destContract}
          onContractChange={handleDestChange}
        />
      </div>

      {/* Mapping editor */}
      <MappingEditor
        mappings={mappings}
        destFieldNames={destFieldNames}
        onMappingsChange={handleMappingsChange}
        onGenerate={handleGenerate}
        onVerify={handleVerify}
        verifyResult={verifyResult}
        loading={loading}
        canGenerate={canGenerate}
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

function extractFields(contract: SourceContract | DataContract | null): APIField[] {
  if (!contract) return [];

  if (isDataContract(contract)) {
    return contract.schemas.flatMap((s) =>
      s.fields.map((f) => ({
        Name: contract.schemas.length > 1 ? `${s.name}.${f.name}` : f.name,
        DataType: f.data_type,
        Nullable: f.nullable,
      }))
    );
  }

  // Source contract (CSV, JSON)
  return contract.fields.map((f) => ({ Name: f.name, DataType: f.data_type }));
}

function buildTransformContract(mappings: FieldMapping[]): TransformContract {
  return {
    contract_type: "transformation",
    transformation_id: "manual",
    source_ref: "source",
    destination_ref: "destination",
    field_mappings: mappings.map(({ source_field, destination_field, transformation, confidence }) => ({
      source_field,
      destination_field,
      transformation,
      confidence,
    })),
    execution_plan: {
      batch_size: 100,
      error_threshold: 0.1,
      validation_enabled: true,
    },
  };
}
