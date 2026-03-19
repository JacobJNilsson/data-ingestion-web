"use client";

import type { SourceContract } from "@/types/contract";

interface ContractDisplayProps {
  contract: SourceContract;
}

export function ContractDisplay({ contract }: ContractDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          File Summary
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Format</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.source_format.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Encoding</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.encoding}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Delimiter</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.delimiter === "," ? "Comma (,)" : contract.delimiter}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Total Rows</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.total_rows.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Header Row</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.has_header ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">Columns</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-50 font-mono">
              {contract.fields.length}
            </dd>
          </div>
        </dl>
      </div>

      {/* Schema Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Schema
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">
                  Column Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">
                  Type
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">
                  Null %
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">
                  Range
                </th>
              </tr>
            </thead>
            <tbody>
              {contract.fields.map((field, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-50">
                    {field.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        field.data_type === "numeric"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : field.data_type === "date"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {field.data_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                    {field.profile.null_percentage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {field.profile.min_value} ... {field.profile.max_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Data Profile
        </h2>
        <div className="space-y-6">
          {contract.fields.map((field, idx) => (
            <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 font-mono">
                {field.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Count</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-50">
                    {field.profile.total_count.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Nulls</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-50">
                    {field.profile.null_count.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Min</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-50 truncate">
                    {field.profile.min_value}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Max</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-50 truncate">
                    {field.profile.max_value}
                  </dd>
                </div>
              </div>
              {field.profile.top_values.length > 0 && (
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Top Values
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {field.profile.top_values.slice(0, 5).map((tv, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                      >
                        <span className="font-mono text-slate-900 dark:text-slate-50">
                          {tv.value}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          ({tv.count})
                        </span>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data Card */}
      {contract.sample_data.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Sample Data
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {contract.fields.map((field, idx) => (
                    <th
                      key={idx}
                      className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-slate-50 font-mono text-xs"
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contract.sample_data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="py-2 px-3 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Card */}
      {contract.issues && contract.issues.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-4">
            Issues Detected
          </h2>
          <ul className="space-y-2">
            {contract.issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
