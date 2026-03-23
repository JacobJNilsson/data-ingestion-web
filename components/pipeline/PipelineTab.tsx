"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StepNode } from "@/components/pipeline/StepNode";
import type { StepNodeData } from "@/components/pipeline/StepNode";
import { StepPalette } from "@/components/pipeline/StepPalette";
import { StepEditor } from "@/components/pipeline/StepEditor";
import { RawJSON } from "@/components/RawJSON";
import { DATA_INGESTION_API_URL } from "@/lib/constants";
import type { PipelineStep, PipelineStepType, PipelineContract, VerifyResult } from "@/types/contract";

let nextStepId = 1;

function newStepId(): string {
  return `step_${nextStepId++}`;
}

type StepFlowNode = Node<StepNodeData, "step">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: NodeTypes = { step: StepNode as any };

// Default position for new nodes -- staggered right.
function nextPosition(existingNodes: Node[]): { x: number; y: number } {
  const maxX = existingNodes.reduce((m, n) => Math.max(m, n.position.x), 0);
  return { x: maxX + 220, y: 100 + (existingNodes.length % 3) * 80 };
}

export function PipelineTab() {
  // Pipeline steps as the source of truth.
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // ReactFlow state derived from steps.
  const [nodes, setNodes, onNodesChange] = useNodesState<StepFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  // Sync steps → nodes whenever steps change.
  const syncNodes = useCallback(
    (newSteps: PipelineStep[], selected: string | null) => {
      setNodes(
        newSteps.map((s) => ({
          id: s.id,
          type: "step",
          position: s.position ?? { x: 0, y: 0 },
          data: {
            label: s.label,
            stepType: s.type,
            selected: s.id === selected,
            onDelete: () => handleDeleteStep(s.id),
          },
        }))
      );
    },
    [setNodes]
  );

  // Sync steps → edges whenever steps change.
  const syncEdges = useCallback(
    (newSteps: PipelineStep[]) => {
      const newEdges: Edge[] = [];
      for (const s of newSteps) {
        for (const dep of s.depends_on) {
          newEdges.push({
            id: `${dep}->${s.id}`,
            source: dep,
            target: s.id,
            animated: true,
            style: { stroke: "oklch(65% 0.01 80)" },
          });
        }
      }
      setEdges(newEdges);
    },
    [setEdges]
  );

  const updateSteps = useCallback(
    (newSteps: PipelineStep[], selected?: string | null) => {
      setSteps(newSteps);
      const sel = selected !== undefined ? selected : selectedStepId;
      syncNodes(newSteps, sel);
      syncEdges(newSteps);
      setVerifyResult(null);
    },
    [selectedStepId, syncNodes, syncEdges]
  );

  // --- Add step ---
  const handleAddStep = useCallback(
    (type: PipelineStepType) => {
      const id = newStepId();
      const pos = nextPosition(nodes);
      const label =
        type === "source"
          ? "New Source"
          : type === "destination"
            ? "New Destination"
            : `${type.replace("_", " ")} step`;
      const defaultConfig: Record<string, unknown> =
        type === "source" || type === "destination"
          ? { contract_ref: "" }
          : type === "manual_label"
            ? { field: "", options: [], instructions: "", allow_custom: false }
            : type === "llm_classify"
              ? { field: "", categories: [], prompt: "", model: "gpt-4o-mini" }
              : type === "api_call"
                ? { method: "POST", url: "", response_fields: [] }
                : type === "lookup"
                  ? { source_ref: "", key_field: "", value_field: "" }
                  : { source_refs: [] }; // mapping

      const newStep: PipelineStep = {
        id,
        type,
        label,
        depends_on: [],
        config: defaultConfig,
        position: pos,
      };
      const newSteps = [...steps, newStep];
      updateSteps(newSteps, id);
      setSelectedStepId(id);
    },
    [steps, nodes, updateSteps]
  );

  // --- Delete step ---
  // Uses functional updater to avoid stale closure over `steps`.
  const handleDeleteStep = useCallback(
    (id: string) => {
      setSteps((prev) => {
        const newSteps = prev
          .filter((s) => s.id !== id)
          .map((s) => ({
            ...s,
            depends_on: s.depends_on.filter((d) => d !== id),
          }));
        // Schedule sync in next tick since we can't call updateSteps inside setSteps.
        queueMicrotask(() => {
          syncNodes(newSteps, selectedStepId === id ? null : selectedStepId);
          syncEdges(newSteps);
        });
        return newSteps;
      });
      if (selectedStepId === id) setSelectedStepId(null);
      setVerifyResult(null);
    },
    [selectedStepId, syncNodes, syncEdges]
  );

  // --- Connect steps (add edge = add dependency) ---
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const src = connection.source;
      const tgt = connection.target;

      // Prevent duplicate edges and self-loops.
      if (src === tgt) return;

      const newSteps = steps.map((s) => {
        if (s.id === tgt && !s.depends_on.includes(src)) {
          return { ...s, depends_on: [...s.depends_on, src] };
        }
        return s;
      });
      updateSteps(newSteps);
    },
    [steps, updateSteps, setEdges]
  );

  // --- Node click ---
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedStepId(node.id);
      // Update selection visual.
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === node.id },
        }))
      );
    },
    [setNodes]
  );

  // --- Node drag (update position) ---
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === node.id ? { ...s, position: node.position } : s
        )
      );
    },
    []
  );

  // --- Update step config ---
  const handleUpdateConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedStepId) return;
      const newSteps = steps.map((s) =>
        s.id === selectedStepId ? { ...s, config } : s
      );
      updateSteps(newSteps);
    },
    [selectedStepId, steps, updateSteps]
  );

  // --- Update step label ---
  const handleLabelChange = useCallback(
    (label: string) => {
      if (!selectedStepId) return;
      const newSteps = steps.map((s) =>
        s.id === selectedStepId ? { ...s, label } : s
      );
      updateSteps(newSteps);
    },
    [selectedStepId, steps, updateSteps]
  );

  // --- Build pipeline contract ---
  const pipelineContract: PipelineContract | null = useMemo(() => {
    if (steps.length === 0) return null;
    return {
      contract_type: "pipeline",
      pipeline_id: "draft",
      steps: steps.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        depends_on: s.depends_on,
        inputs_from: s.inputs_from,
        config: s.config,
        position: s.position,
      })),
    };
  }, [steps]);

  // --- Verify ---
  const handleVerify = async () => {
    if (!pipelineContract) return;
    setVerifying(true);
    setError("");
    try {
      const resp = await fetch(`${DATA_INGESTION_API_URL}/api/v1/verify-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipelineContract),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || `API error: ${resp.status}`);
      }
      setVerifyResult(await resp.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canvas + palette side by side */}
      <div className="grid grid-cols-[1fr_240px] gap-4">
        {/* DAG Canvas */}
        <div
          className="border rounded-lg overflow-hidden"
          style={{
            borderColor: "oklch(90% 0.005 80)",
            height: 500,
            backgroundColor: "oklch(99% 0.002 80)",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Controls
              showInteractive={false}
              style={{ bottom: 10, left: 10 }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="oklch(85% 0.005 80)"
            />
          </ReactFlow>
        </div>

        {/* Palette */}
        <StepPalette onAddStep={handleAddStep} />
      </div>

      {/* Step editor (when a step is selected) */}
      {selectedStep && (
        <StepEditor
          step={selectedStep}
          onUpdate={handleUpdateConfig}
          onLabelChange={handleLabelChange}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!pipelineContract || verifying}
          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40"
          style={{ borderColor: "oklch(80% 0.005 80)", color: "oklch(35% 0.01 80)" }}
        >
          {verifying ? "Verifying..." : "Verify Pipeline"}
        </button>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div
          className="p-3 rounded-lg border-l-4 text-sm"
          style={{
            borderColor: verifyResult.valid ? "oklch(50% 0.1 140)" : "oklch(55% 0.15 20)",
            backgroundColor: verifyResult.valid ? "oklch(97% 0.02 140)" : "oklch(95% 0.02 20)",
            color: verifyResult.valid ? "oklch(30% 0.08 140)" : "oklch(35% 0.08 20)",
          }}
        >
          <span className="font-semibold">{verifyResult.valid ? "Valid Pipeline" : "Invalid Pipeline"}</span>
          {verifyResult.issues && verifyResult.issues.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {verifyResult.issues.map((issue, i) => (
                <li key={i} className="text-xs">• {issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-4 border-l-4 rounded-r flex items-start justify-between"
          style={{ backgroundColor: "oklch(95% 0.02 20)", borderColor: "oklch(55% 0.15 20)" }}
        >
          <p className="text-sm font-medium" style={{ color: "oklch(35% 0.08 20)" }}>{error}</p>
          <button type="button" onClick={() => setError("")}
            className="text-sm ml-4 px-2 py-0.5 rounded" style={{ color: "oklch(50% 0.05 20)" }}
            aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Raw JSON */}
      {pipelineContract && <RawJSON data={pipelineContract} />}
    </div>
  );
}
