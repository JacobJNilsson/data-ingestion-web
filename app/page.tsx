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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            CSV Contract Analyzer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Upload a CSV file to analyze its structure, encoding, and data quality
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <CSVUpload
            onFileUpload={handleFileUpload}
            loading={loading}
            disabled={loading}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {contract && (
            <div className="mt-8">
              <ContractDisplay contract={contract} />
            </div>
          )}
        </main>

        <footer className="text-center mt-16 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Powered by{" "}
            <a
              href="https://github.com/JacobJNilsson/data-ingestion-api"
              className="underline hover:text-slate-700 dark:hover:text-slate-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              data-ingestion-api
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
