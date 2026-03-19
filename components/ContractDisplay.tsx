"use client";

import type { SourceContract } from "@/types/contract";

interface ContractDisplayProps {
  contract: SourceContract;
}

export function ContractDisplay({ contract }: ContractDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">File Summary</h2>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Format
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.source_format.toUpperCase()}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Encoding
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.encoding}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Delimiter
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.delimiter === "," ? "Comma (,)" : contract.delimiter}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Total Rows
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.total_rows.toLocaleString()}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Header Row
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.has_header ? "Yes" : "No"}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl p-4">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Columns
            </dt>
            <dd className="text-lg font-bold text-slate-900 font-mono">
              {contract.fields.length}
            </dd>
          </div>
        </dl>
      </div>

      {/* Schema Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Schema</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-4 font-semibold text-sm text-slate-700 uppercase tracking-wide">
                  Column Name
                </th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-slate-700 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-right py-4 px-4 font-semibold text-sm text-slate-700 uppercase tracking-wide">
                  Null %
                </th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-slate-700 uppercase tracking-wide">
                  Range
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contract.fields.map((field, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-4 font-mono text-sm font-medium text-slate-900">
                    {field.name}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        field.data_type === "numeric"
                          ? "bg-blue-100 text-blue-700"
                          : field.data_type === "date"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {field.data_type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm text-slate-600">
                    {field.profile.null_percentage.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-500 max-w-xs truncate">
                    {field.profile.min_value} ... {field.profile.max_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Data Profile</h2>
        </div>
        <div className="space-y-8">
          {contract.fields.map((field, idx) => (
            <div
              key={idx}
              className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"
            >
              <h3 className="font-semibold text-lg text-slate-900 mb-4 font-mono flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {idx + 1}
                </span>
                {field.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Count
                  </dt>
                  <dd className="font-mono text-lg font-bold text-slate-900">
                    {field.profile.total_count.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Nulls
                  </dt>
                  <dd className="font-mono text-lg font-bold text-slate-900">
                    {field.profile.null_count.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Min
                  </dt>
                  <dd className="font-mono text-sm font-bold text-slate-900 truncate">
                    {field.profile.min_value}
                  </dd>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Max
                  </dt>
                  <dd className="font-mono text-sm font-bold text-slate-900 truncate">
                    {field.profile.max_value}
                  </dd>
                </div>
              </div>
              {field.profile.top_values.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Top Values
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {field.profile.top_values.slice(0, 5).map((tv, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border border-slate-200 rounded-lg text-xs transition-all"
                      >
                        <span className="font-mono font-semibold text-slate-900">
                          {tv.value}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                          {tv.count}
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sample Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  {contract.fields.map((field, idx) => (
                    <th
                      key={idx}
                      className="text-left py-3 px-4 font-semibold text-xs text-slate-700 uppercase tracking-wide font-mono"
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contract.sample_data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="py-3 px-4 font-mono text-xs text-slate-600 max-w-xs truncate"
                      >
                        {cell || (
                          <span className="text-slate-400 italic">null</span>
                        )}
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
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl border-2 border-red-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-900">Issues Detected</h2>
          </div>
          <ul className="space-y-2">
            {contract.issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
