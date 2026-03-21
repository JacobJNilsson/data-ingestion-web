"use client";

import { useState } from "react";
import { CSVUpload } from "@/components/CSVUpload";
import { FileUpload } from "@/components/FileUpload";
import { ContractDisplay } from "@/components/ContractDisplay";
import { PostgresForm } from "@/components/PostgresForm";
import { SupabaseForm } from "@/components/SupabaseForm";
import { DataContractDisplay } from "@/components/DataContractDisplay";
import type { SourceContract, DataContract } from "@/types/contract";

const API_BASE = "https://ingest-api-handsala-d4d73ec6.koyeb.app";

type Tab = "csv" | "json" | "destination" | "supabase";

export default function Home() {
  const [tab, setTab] = useState<Tab>("csv");
  const [sourceContract, setSourceContract] = useState<SourceContract | null>(null);
  const [jsonContract, setJsonContract] = useState<SourceContract | null>(null);
  const [dbContract, setDbContract] = useState<DataContract | null>(null);
  const [supaContract, setSupaContract] = useState<DataContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setSourceContract(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      setSourceContract(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleJSONUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setJsonContract(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/v1/analyze-json`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `API error: ${response.status}`);
      }

      setJsonContract(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze JSON");
    } finally {
      setLoading(false);
    }
  };

  const handleDbAnalyze = async (connectionString: string, schema: string) => {
    setLoading(true);
    setError(null);
    setDbContract(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze-destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_string: connectionString, schema }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `API error: ${response.status}`);
      }

      setDbContract(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze database");
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseAnalyze = async (projectURL: string, apiKey: string) => {
    setLoading(true);
    setError(null);
    setSupaContract(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze-supabase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_url: projectURL, api_key: apiKey }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `API error: ${response.status}`);
      }

      setSupaContract(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze Supabase project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(98% 0.005 80)" }}>
      <header className="border-b" style={{ borderColor: "oklch(90% 0.005 80)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "oklch(20% 0.01 80)" }}
              >
                Data Contract Analyzer
              </h1>
              <p className="mt-1 text-sm" style={{ color: "oklch(45% 0.01 80)" }}>
                Analyze CSV, JSON, and PostgreSQL databases
              </p>
            </div>
            <a
              href="https://github.com/JacobJNilsson/data-ingestion-api"
              className="text-sm font-medium hover:underline"
              style={{ color: "oklch(45% 0.01 80)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "oklch(90% 0.005 80)" }}>
          <TabButton
            active={tab === "csv"}
            onClick={() => { setTab("csv"); setError(null); }}
          >
            CSV
          </TabButton>
          <TabButton
            active={tab === "json"}
            onClick={() => { setTab("json"); setError(null); }}
          >
            JSON
          </TabButton>
          <TabButton
            active={tab === "destination"}
            onClick={() => { setTab("destination"); setError(null); }}
          >
            Destination (PostgreSQL)
          </TabButton>
          <TabButton
            active={tab === "supabase"}
            onClick={() => { setTab("supabase"); setError(null); }}
          >
            Supabase
          </TabButton>
        </div>

        {/* Tab content */}
        {tab === "csv" && (
          <>
            <CSVUpload onFileUpload={handleFileUpload} loading={loading} disabled={loading} />
            {sourceContract && (
              <div className="mt-12">
                <ContractDisplay contract={sourceContract} />
              </div>
            )}
          </>
        )}

        {tab === "json" && (
          <>
            <FileUpload
              onFileUpload={handleJSONUpload}
              loading={loading}
              disabled={loading}
              accept=".json,.ndjson,.jsonl,application/json"
              label="Upload JSON or NDJSON"
              hint=".json / .ndjson / .jsonl files"
              id="json-upload"
            />
            {jsonContract && (
              <div className="mt-12">
                <ContractDisplay contract={jsonContract} />
              </div>
            )}
          </>
        )}

        {tab === "destination" && (
          <>
            <PostgresForm onSubmit={handleDbAnalyze} loading={loading} disabled={loading} />
            {dbContract && (
              <div className="mt-12">
                <DataContractDisplay contract={dbContract} />
              </div>
            )}
          </>
        )}

        {tab === "supabase" && (
          <>
            <SupabaseForm onSubmit={handleSupabaseAnalyze} loading={loading} disabled={loading} />
            {supaContract && (
              <div className="mt-12">
                <DataContractDisplay contract={supaContract} />
              </div>
            )}
          </>
        )}

        {/* Error — shared across both tabs */}
        {error && (
          <div
            className="mt-6 p-4 border-l-4 rounded-r"
            style={{
              backgroundColor: "oklch(95% 0.02 20)",
              borderColor: "oklch(55% 0.15 20)",
            }}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: "oklch(55% 0.15 20)" }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium" style={{ color: "oklch(35% 0.08 20)" }}>
                {error}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-3 text-sm font-semibold transition-colors -mb-px"
      style={{
        color: active ? "oklch(20% 0.01 80)" : "oklch(50% 0.01 80)",
        borderBottom: active ? "2px solid oklch(35% 0.05 260)" : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}
