"use client";

import { useEffect } from "react";
import {
  RESEARCH_BOARD_EVENT,
  RESEARCH_BOARD_STORAGE_KEY,
  missingEvidence,
  normalizedCandidateKey,
  researchBoardId,
  type ResearchBoard,
  type ResearchCandidate,
  type ResearchEvidenceStatus
} from "@/lib/research-board";

type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
    untrustedContentHint?: boolean;
  };
};

type ModelContext = { registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => Promise<void> };

function modelContext() {
  return (document as Document & { modelContext?: ModelContext }).modelContext;
}

function hasRegisterTool(context: ModelContext | undefined): context is ModelContext {
  return typeof context?.registerTool === "function";
}

function loadBoard() {
  const raw = localStorage.getItem(RESEARCH_BOARD_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ResearchBoard; }
  catch { return null; }
}

function saveBoard(board: ResearchBoard) {
  localStorage.setItem(RESEARCH_BOARD_STORAGE_KEY, JSON.stringify(board));
  window.dispatchEvent(new CustomEvent(RESEARCH_BOARD_EVENT, { detail: board }));
  return board;
}

function withActivity(board: ResearchBoard, label: string, detail: string) {
  const now = new Date().toISOString();
  const revision = board.revision + 1;
  return {
    ...board,
    revision,
    updatedAt: now,
    activity: [...board.activity, {
      id: researchBoardId("event"),
      at: now,
      actor: "agent" as const,
      label,
      detail,
      revision
    }].slice(-60)
  };
}

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

const boardSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    objective: { type: "string" },
    criteria: { type: "array", items: { type: "object" } },
    candidates: { type: "array", items: { type: "object" } },
    activity: { type: "array", items: { type: "object" } },
    revision: { type: "number" },
    changed: { type: "boolean" },
    changes_since: { type: "array", items: { type: "object" } },
    updatedAt: { type: "string" },
    workspace_url: { type: "string" },
    error: { type: "string" },
    message: { type: "string" }
  }
};

export function AgentResearchBoardWebMcp() {
  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: number | undefined;
    const workspaceUrl = () => `${location.origin}/agent-utility-index#research-board`;

    const tools: ToolDefinition[] = [
      {
        name: "create_research_board",
        title: "Create the shared research board",
        description: "Create the board visible to the human. At creation time the agent may translate the user's request into must-have criteria. After creation, humans control the rules; agents control candidate discovery and evidence.",
        inputSchema: {
          type: "object",
          properties: {
            objective: { type: "string", minLength: 8, maxLength: 1200 },
            criteria: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", minLength: 2, maxLength: 180 } }
          },
          required: ["objective", "criteria"],
          additionalProperties: false
        },
        outputSchema: boardSchema,
        annotations: { title: "Create shared research board", readOnlyHint: false, idempotentHint: false, openWorldHint: false, untrustedContentHint: false },
        execute: async (input) => {
          const objective = typeof input.objective === "string" ? input.objective.trim() : "";
          const criteria = Array.isArray(input.criteria)
            ? input.criteria.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 10)
            : [];
          if (objective.length < 8 || !criteria.length) return { error: "INVALID_INPUT" };
          const now = new Date().toISOString();
          const board: ResearchBoard = {
            id: researchBoardId("board"),
            objective,
            criteria: criteria.map((label) => ({
              id: researchBoardId("criterion"),
              label,
              hard: true,
              addedBy: "agent",
              createdAt: now,
              updatedRevision: 1
            })),
            candidates: [],
            activity: [{ id: researchBoardId("event"), at: now, actor: "agent", label: "BOARD CREATED", detail: "The agent translated the request into a shared research board.", revision: 1 }],
            revision: 1,
            createdAt: now,
            updatedAt: now
          };
          return { ...saveBoard(board), changed: true, changes_since: board.activity, workspace_url: workspaceUrl() };
        }
      },
      {
        name: "get_research_board",
        title: "Read the shared research board",
        description: "Read the exact current board state. Pass since_revision when you already saw an earlier revision; the response includes only the recorded changes since then as changes_since, while still returning the current board for safe synchronization.",
        inputSchema: {
          type: "object",
          properties: { since_revision: { type: "integer", minimum: 0 } },
          additionalProperties: false
        },
        outputSchema: boardSchema,
        annotations: { title: "Read shared research board", readOnlyHint: true, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
        execute: async (input) => {
          const board = loadBoard();
          if (!board) return { error: "NO_BOARD", message: "No research board exists yet." };
          const since = input.since_revision === undefined ? null : integer(input.since_revision);
          if (input.since_revision !== undefined && since === null) return { error: "INVALID_REVISION" };
          const changes = since === null ? [] : board.activity.filter((item) => (item.revision ?? 0) > since);
          return {
            ...board,
            changed: since === null ? true : board.revision > since,
            changes_since: changes,
            workspace_url: workspaceUrl()
          };
        }
      },
      {
        name: "add_research_candidate",
        title: "Add a research candidate",
        description: "Add a candidate discovered by the agent. Candidates are deduplicated by normalized domain when available, otherwise by normalized name. The agent may add candidates but may not change human-controlled requirements.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 180 },
            website: { type: "string", maxLength: 500 },
            summary: { type: "string", maxLength: 500 }
          },
          required: ["name"],
          additionalProperties: false
        },
        outputSchema: boardSchema,
        annotations: { title: "Add research candidate", readOnlyHint: false, idempotentHint: false, openWorldHint: true, untrustedContentHint: true },
        execute: async (input) => {
          const board = loadBoard();
          if (!board) return { error: "NO_BOARD", message: "Create a research board first." };
          const name = typeof input.name === "string" ? input.name.trim() : "";
          const website = typeof input.website === "string" && input.website.trim() ? input.website.trim() : undefined;
          const summary = typeof input.summary === "string" && input.summary.trim() ? input.summary.trim() : undefined;
          if (!name) return { error: "INVALID_INPUT" };
          const key = normalizedCandidateKey(name, website);
          const duplicate = board.candidates.find((candidate) => normalizedCandidateKey(candidate.name, candidate.website) === key);
          if (duplicate) {
            return { ...board, duplicate_candidate_id: duplicate.id, message: "Candidate already exists on the board.", workspace_url: workspaceUrl() };
          }
          const now = new Date().toISOString();
          const candidate: ResearchCandidate = {
            id: researchBoardId("candidate"),
            name,
            website,
            summary,
            evidence: [],
            updatedAt: now,
            updatedRevision: board.revision + 1
          };
          const next = withActivity({ ...board, candidates: [...board.candidates, candidate] }, "CANDIDATE ADDED", name);
          return { ...saveBoard(next), candidate_id: candidate.id, workspace_url: workspaceUrl() };
        }
      },
      {
        name: "update_candidate_evidence",
        title: "Update candidate evidence",
        description: "Write one researched candidate/requirement cell. Supply the board revision research started from and the exact evidence cell revision expected. Unrelated board edits do not invalidate the write; a changed requirement or newer write to this same cell does. VERIFIED requires a source URL.",
        inputSchema: {
          type: "object",
          properties: {
            candidate_id: { type: "string", minLength: 1, maxLength: 180 },
            requirement_id: { type: "string", minLength: 1, maxLength: 180 },
            expected_revision: { type: "integer", minimum: 0 },
            expected_cell_revision: { type: "integer", minimum: 0 },
            status: { type: "string", enum: ["VERIFIED", "PARTIAL", "MISSING", "FAILED"] },
            claim: { type: "string", minLength: 1, maxLength: 800 },
            source_url: { type: "string", maxLength: 1000 },
            source_title: { type: "string", maxLength: 250 },
            source_snippet: { type: "string", maxLength: 600 },
            observed_at: { type: "string", maxLength: 80 }
          },
          required: ["candidate_id", "requirement_id", "expected_revision", "expected_cell_revision", "status", "claim"],
          additionalProperties: false
        },
        outputSchema: boardSchema,
        annotations: { title: "Update candidate evidence", readOnlyHint: false, idempotentHint: false, openWorldHint: true, untrustedContentHint: true },
        execute: async (input) => {
          const board = loadBoard();
          if (!board) return { error: "NO_BOARD", message: "Create a research board first." };
          const candidateId = typeof input.candidate_id === "string" ? input.candidate_id.trim() : "";
          const requirementId = typeof input.requirement_id === "string" ? input.requirement_id.trim() : "";
          const expectedRevision = integer(input.expected_revision);
          const expectedCellRevision = integer(input.expected_cell_revision);
          const candidate = board.candidates.find((item) => item.id === candidateId);
          const criterion = board.criteria.find((item) => item.id === requirementId);
          if (!candidate || !criterion || expectedRevision === null || expectedCellRevision === null) {
            return { error: "INVALID_TARGET", message: "Read the latest board and use existing candidate and requirement IDs." };
          }

          const existingEvidence = candidate.evidence.find((item) => item.criterionId === criterion.id);
          const currentCellRevision = existingEvidence?.evidenceRevision ?? 0;
          const requirementChanged = (criterion.updatedRevision ?? 1) > expectedRevision;
          const cellChanged = currentCellRevision !== expectedCellRevision;
          if (requirementChanged || cellChanged) {
            return {
              error: "CELL_CONFLICT",
              current_revision: board.revision,
              current_cell_revision: currentCellRevision,
              changed: [requirementChanged ? "requirement" : null, cellChanged ? "evidence_cell" : null].filter(Boolean),
              message: "This specific check changed since research began. Read the latest board and retry only this affected cell."
            };
          }

          const status = input.status as ResearchEvidenceStatus;
          if (!["VERIFIED", "PARTIAL", "MISSING", "FAILED"].includes(status)) return { error: "INVALID_STATUS" };
          const sourceUrl = typeof input.source_url === "string" && input.source_url.trim() ? input.source_url.trim() : undefined;
          if (status === "VERIFIED" && !sourceUrl) {
            return { error: "SOURCE_REQUIRED", message: "No source = no VERIFIED. Supply a source URL or use PARTIAL/MISSING." };
          }

          const now = new Date().toISOString();
          const nextEvidence = candidate.evidence.filter((item) => item.criterionId !== criterion.id);
          nextEvidence.push({
            criterionId: criterion.id,
            status,
            detail: typeof input.claim === "string" ? input.claim.trim() : "",
            sourceUrl,
            sourceTitle: typeof input.source_title === "string" && input.source_title.trim() ? input.source_title.trim() : undefined,
            sourceSnippet: typeof input.source_snippet === "string" && input.source_snippet.trim() ? input.source_snippet.trim() : undefined,
            observedAt: typeof input.observed_at === "string" && input.observed_at.trim() ? input.observed_at.trim() : now,
            updatedAt: now,
            evidenceRevision: currentCellRevision + 1
          });
          const updated: ResearchCandidate = {
            ...candidate,
            evidence: nextEvidence,
            updatedAt: now,
            updatedRevision: candidate.updatedRevision
          };
          const candidates = board.candidates.map((item) => item.id === candidate.id ? updated : item);
          const next = withActivity({ ...board, candidates }, "EVIDENCE UPDATED", `${candidate.name}: ${criterion.label} → ${status}`);
          return { ...saveBoard(next), evidence_revision: currentCellRevision + 1, workspace_url: workspaceUrl() };
        }
      },
      {
        name: "get_missing_checks",
        title: "Get missing research checks",
        description: "Return only the automatic research queue. MISSING and PARTIAL cells are eligible for automatic recheck. FAILED is terminal and excluded unless the human changes the rule or explicitly asks the agent to revisit it.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: {
          type: "object",
          properties: {
            board_revision: { type: "number" },
            checks: { type: "array", items: { type: "object" } },
            count: { type: "number" },
            workspace_url: { type: "string" },
            error: { type: "string" },
            message: { type: "string" }
          }
        },
        annotations: { title: "Get missing research checks", readOnlyHint: true, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
        execute: async () => {
          const board = loadBoard();
          if (!board) return { error: "NO_BOARD", message: "No research board exists yet." };
          const checks = missingEvidence(board).map((check) => ({ ...check, expectedRevision: board.revision }));
          return { board_revision: board.revision, checks, count: checks.length, workspace_url: workspaceUrl() };
        }
      }
    ];

    const registerTools = (attempt = 0) => {
      const context = modelContext();
      if (!hasRegisterTool(context)) {
        if (attempt < 80 && !controller.signal.aborted) {
          retryTimer = window.setTimeout(() => registerTools(attempt + 1), 250);
        }
        return;
      }

      void Promise.all(tools.map((tool) => context.registerTool(tool, { signal: controller.signal }))).catch(() => {
        controller.abort();
      });
    };

    registerTools();

    return () => {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      controller.abort();
    };
  }, []);

  return null;
}
