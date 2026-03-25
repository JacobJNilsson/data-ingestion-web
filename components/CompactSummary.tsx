"use client";

import type { SourceContract, DataContract } from "@/types/contract";

interface CompactSummaryProps {
  contract: SourceContract | DataContract;
  selectedSchemaIndex?: number;
}

export function CompactSummary({ contract, selectedSchemaIndex }: CompactSummaryProps) {
  if ("schemas" in contract && "id" in contract && Array.isArray((contract as DataContract).schemas)) {
    return <DataContractSummaryView contract={contract as DataContract} selectedSchemaIndex={selectedSchemaIndex ?? 0} />;
  }
  return <SourceSummary contract={contract as SourceContract} />;
}

function SourceSummary({ contract }: { contract: SourceContract }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{contract.source_format.toUpperCase()}</Badge>
        <span className="text-xs" style={{ color: "oklch(50% 0.01 80)" }}>
          {contract.total_rows.toLocaleString()} rows, {contract.fields.length} fields
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {contract.fields.map((f) => (
          <FieldBadge key={f.name} name={f.name} type={f.data_type} />
        ))}
      </div>
    </div>
  );
}

function DataContractSummaryView({ contract, selectedSchemaIndex }: { contract: DataContract; selectedSchemaIndex: number }) {
  const selected = contract.schemas[selectedSchemaIndex];
  if (!selected) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{selected.name}</Badge>
        <span className="text-xs" style={{ color: "oklch(50% 0.01 80)" }}>
          {selected.fields.length} fields
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {selected.fields.map((f) => (
          <FieldBadge key={f.name} name={f.name} type={f.data_type} />
        ))}
      </div>
    </div>
  );
}

function FieldBadge({ name, type }: { name: string; type: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
      style={{ borderColor: "oklch(88% 0.005 80)", color: "oklch(35% 0.01 80)" }}
    >
      <span className="font-mono font-medium">{name}</span>
      <span style={{ color: "oklch(55% 0.01 80)" }}>{type}</span>
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: "oklch(92% 0.005 80)", color: "oklch(40% 0.01 80)" }}
    >
      {children}
    </span>
  );
}
