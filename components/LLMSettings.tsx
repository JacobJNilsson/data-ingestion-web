"use client";

import { useState } from "react";

export type LLMProvider = "openai" | "anthropic";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

const MODELS: Record<LLMProvider, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  ],
};

interface LLMSettingsProps {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

export function LLMSettings({ config, onChange }: LLMSettingsProps) {
  const [open, setOpen] = useState(false);

  const models = MODELS[config.provider];
  const hasKey = config.apiKey.trim().length > 0;

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: "oklch(90% 0.005 80)",
        backgroundColor: "oklch(99% 0.002 80)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: "oklch(30% 0.01 80)" }}
          >
            AI Settings
          </span>
          {hasKey && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "oklch(92% 0.03 140)",
                color: "oklch(35% 0.08 140)",
              }}
            >
              {config.provider === "openai" ? "OpenAI" : "Anthropic"} configured
            </span>
          )}
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: "oklch(50% 0.01 80)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: "oklch(92% 0.005 80)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label
                htmlFor="llm-provider"
                className="block text-xs font-medium mb-1"
                style={{ color: "oklch(45% 0.01 80)" }}
              >
                Provider
              </label>
              <select
                id="llm-provider"
                value={config.provider}
                onChange={(e) => {
                  const provider = e.target.value as LLMProvider;
                  onChange({
                    ...config,
                    provider,
                    model: MODELS[provider][0].value,
                  });
                }}
                className="w-full px-3 py-1.5 border rounded text-sm"
                style={{
                  borderColor: "oklch(85% 0.005 80)",
                  color: "oklch(25% 0.01 80)",
                  backgroundColor: "oklch(100% 0 0)",
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="llm-model"
                className="block text-xs font-medium mb-1"
                style={{ color: "oklch(45% 0.01 80)" }}
              >
                Model
              </label>
              <select
                id="llm-model"
                value={config.model}
                onChange={(e) =>
                  onChange({ ...config, model: e.target.value })
                }
                className="w-full px-3 py-1.5 border rounded text-sm"
                style={{
                  borderColor: "oklch(85% 0.005 80)",
                  color: "oklch(25% 0.01 80)",
                  backgroundColor: "oklch(100% 0 0)",
                }}
              >
                {models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="llm-api-key"
                className="block text-xs font-medium mb-1"
                style={{ color: "oklch(45% 0.01 80)" }}
              >
                API Key
              </label>
              <input
                id="llm-api-key"
                type="password"
                value={config.apiKey}
                onChange={(e) =>
                  onChange({ ...config, apiKey: e.target.value })
                }
                placeholder="sk-..."
                className="w-full px-3 py-1.5 border rounded text-sm font-mono"
                style={{
                  borderColor: "oklch(85% 0.005 80)",
                  color: "oklch(25% 0.01 80)",
                  backgroundColor: "oklch(100% 0 0)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
