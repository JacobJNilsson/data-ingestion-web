"use client";

import { useState } from "react";
import { CSVUpload } from "@/components/CSVUpload";
import { ContractDisplay } from "@/components/ContractDisplay";
import type { SourceContract } from "@/types/contract";

export default function Home() {
  const [contract, setContract] = useState<SourceContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setContract(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "https://ingest-api-handsala-d4d73ec6.koyeb.app/api/v1/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'oklch(98% 0.005 80)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'oklch(90% 0.005 80)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'oklch(20% 0.01 80)' }}>
                CSV Contract Analyzer
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'oklch(45% 0.01 80)' }}>
                Instant analysis of structure, types, and data quality
              </p>
            </div>
            <a
              href="https://github.com/JacobJNilsson/data-ingestion-api"
              className="text-sm font-medium hover:underline"
              style={{ color: 'oklch(45% 0.01 80)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <CSVUpload
          onFileUpload={handleFileUpload}
          loading={loading}
          disabled={loading}
        />

        {error && (
          <div className="mt-6 p-4 border-l-4 rounded-r" style={{ 
            backgroundColor: 'oklch(95% 0.02 20)',
            borderColor: 'oklch(55% 0.15 20)',
          }}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'oklch(55% 0.15 20)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'oklch(35% 0.08 20)' }}>{error}</p>
            </div>
          </div>
        )}

        {contract && (
          <div className="mt-12">
            <ContractDisplay contract={contract} />
          </div>
        )}
      </main>
    </div>
  );
}
