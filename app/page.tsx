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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            CSV Contract Analyzer
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload your CSV file and instantly understand its structure, encoding, data types, and quality
          </p>
        </header>

        <main className="max-w-5xl mx-auto">
          <CSVUpload
            onFileUpload={handleFileUpload}
            loading={loading}
            disabled={loading}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {contract && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ContractDisplay contract={contract} />
            </div>
          )}
        </main>

        <footer className="text-center mt-20 text-sm text-slate-500">
          <p>
            Powered by{" "}
            <a
              href="https://github.com/JacobJNilsson/data-ingestion-api"
              className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
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
