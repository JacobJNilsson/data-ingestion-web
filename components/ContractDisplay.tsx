"use client";

import type { SourceContract } from "@/types/contract";
import { RawJSON } from "@/components/RawJSON";

interface ContractDisplayProps {
  contract: SourceContract;
}

export function ContractDisplay({ contract }: ContractDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'oklch(45% 0.01 80)' }}>
          File Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Format" value={contract.source_format.toUpperCase()} />
          <StatCard label="Encoding" value={contract.encoding} />
          <StatCard label="Delimiter" value={contract.delimiter === "," ? "Comma" : contract.delimiter} />
          <StatCard label="Rows" value={contract.total_rows.toLocaleString()} />
          <StatCard label="Header" value={contract.has_header ? "Yes" : "No"} />
          <StatCard label="Columns" value={contract.fields.length.toString()} />
        </div>
      </section>

      {/* Schema Table */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'oklch(45% 0.01 80)' }}>
          Schema
        </h2>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'oklch(90% 0.005 80)' }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'oklch(96% 0.005 80)' }}>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(45% 0.01 80)' }}>
                  Column
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(45% 0.01 80)' }}>
                  Type
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(45% 0.01 80)' }}>
                  Nulls
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'oklch(45% 0.01 80)' }}>
                  Range
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'oklch(93% 0.005 80)' }}>
              {contract.fields.map((field, idx) => (
                <tr key={idx} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'oklch(99% 0.002 80)' }}>
                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: 'oklch(25% 0.01 80)' }}>
                    {field.name}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={field.data_type} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'oklch(45% 0.01 80)' }}>
                    {field.profile.null_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-xs" style={{ color: 'oklch(55% 0.01 80)' }}>
                    {field.profile.min_value} ... {field.profile.max_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Profile */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'oklch(45% 0.01 80)' }}>
          Data Profile
        </h2>
        <div className="space-y-6">
          {contract.fields.map((field, idx) => (
            <div key={idx} className="border-l-2 pl-6" style={{ borderColor: 'oklch(85% 0.005 80)' }}>
              <h3 className="font-mono font-semibold text-sm mb-4" style={{ color: 'oklch(25% 0.01 80)' }}>
                {field.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'oklch(50% 0.01 80)' }}>Count</div>
                  <div className="font-mono font-semibold" style={{ color: 'oklch(25% 0.01 80)' }}>
                    {field.profile.total_count.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'oklch(50% 0.01 80)' }}>Nulls</div>
                  <div className="font-mono font-semibold" style={{ color: 'oklch(25% 0.01 80)' }}>
                    {field.profile.null_count.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'oklch(50% 0.01 80)' }}>Min</div>
                  <div className="font-mono text-sm truncate" style={{ color: 'oklch(25% 0.01 80)' }}>
                    {field.profile.min_value}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'oklch(50% 0.01 80)' }}>Max</div>
                  <div className="font-mono text-sm truncate" style={{ color: 'oklch(25% 0.01 80)' }}>
                    {field.profile.max_value}
                  </div>
                </div>
              </div>
              {field.profile.top_values.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'oklch(50% 0.01 80)' }}>
                    Top Values
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {field.profile.top_values.slice(0, 5).map((tv, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm"
                        style={{ 
                          borderColor: 'oklch(88% 0.005 80)',
                          backgroundColor: 'oklch(99% 0.002 80)',
                        }}
                      >
                        <span className="font-mono font-medium" style={{ color: 'oklch(25% 0.01 80)' }}>
                          {tv.value}
                        </span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ 
                          backgroundColor: 'oklch(92% 0.005 80)',
                          color: 'oklch(40% 0.01 80)',
                        }}>
                          {tv.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sample Data */}
      {contract.sample_data.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'oklch(45% 0.01 80)' }}>
            Sample Data
          </h2>
          <div className="border rounded-lg overflow-x-auto" style={{ borderColor: 'oklch(90% 0.005 80)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'oklch(96% 0.005 80)' }}>
                <tr>
                  {contract.fields.map((field, idx) => (
                    <th
                      key={idx}
                      className="text-left px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'oklch(45% 0.01 80)' }}
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'oklch(93% 0.005 80)' }}>
                {contract.sample_data.map((row, rowIdx) => (
                  <tr 
                    key={rowIdx} 
                    className="hover:bg-opacity-50 transition-colors"
                    style={{ backgroundColor: rowIdx % 2 === 0 ? 'transparent' : 'oklch(99% 0.002 80)' }}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 font-mono text-xs whitespace-nowrap max-w-xs truncate"
                        style={{ color: cell ? 'oklch(35% 0.01 80)' : 'oklch(65% 0.01 80)' }}
                      >
                        {cell || <span className="italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Issues */}
      {contract.issues && contract.issues.length > 0 && (
        <section className="border-l-4 pl-6 py-4" style={{ 
          borderColor: 'oklch(60% 0.15 30)',
          backgroundColor: 'oklch(97% 0.02 30)',
        }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'oklch(35% 0.08 30)' }}>
            Issues Detected
          </h2>
          <ul className="space-y-2">
            {contract.issues.map((issue, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2" style={{ color: 'oklch(35% 0.08 30)' }}>
                <span className="mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RawJSON data={contract} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4" style={{ borderColor: 'oklch(90% 0.005 80)' }}>
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'oklch(50% 0.01 80)' }}>
        {label}
      </div>
      <div className="font-mono font-bold text-lg" style={{ color: 'oklch(20% 0.01 80)' }}>
        {value}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors = {
    numeric: { bg: 'oklch(95% 0.02 260)', text: 'oklch(40% 0.08 260)' },
    date: { bg: 'oklch(95% 0.02 140)', text: 'oklch(35% 0.08 140)' },
    text: { bg: 'oklch(95% 0.005 80)', text: 'oklch(40% 0.01 80)' },
  };

  const color = colors[type as keyof typeof colors] || colors.text;

  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {type}
    </span>
  );
}
