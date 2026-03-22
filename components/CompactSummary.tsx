"use client";

import type { SourceContract, DataContract } from "@/types/contract";

interface CompactSummaryProps {
  contract: SourceContract | DataContract;
}

export function CompactSummary({ contract }: CompactSummaryProps) {
  if ("schemas" in contract && "id" in contract) {
    return <DataContractSummaryView contract={contract as DataContract} />;
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

function DataContractSummaryView({ contract }: { contract: DataContract }) {
  const totalFields = contract.schemas.reduce((sum, s) => sum + s.fields.length, 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{contract.id}</Badge>
        <span className="text-xs" style={{ color: "oklch(50% 0.01 80)" }}>
          {contract.schemas.length} schemas, {totalFields} fields
        </span>
      </div>
      {contract.schemas.map((s) => (
        <div key={s.name} className="space-y-1">
          <span className="text-xs font-mono font-medium" style={{ color: "oklch(35% 0.01 80)" }}>
            {s.name}
          </span>
          <div className="flex flex-wrap gap-1">
            {s.fields.map((f) => (
              <FieldBadge key={f.name} name={f.name} type={f.data_type} />
            ))}
          </div>
        </div>
      ))}
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
