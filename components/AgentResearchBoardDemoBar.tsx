"use client";

import { useEffect, useState } from "react";
import {
  RESEARCH_BOARD_EVENT,
  RESEARCH_BOARD_STORAGE_KEY,
  researchBoardId,
  type ResearchBoard
} from "@/lib/research-board";

const DEMO_OBJECTIVE = "Find 5 email-finding tools with a free plan, API access, and CSV export.";
const DEMO_REQUIREMENTS = ["Free plan", "API access", "CSV export"];
const LIVE_TWIST = "No credit card required";
const AGENT_PROMPT = `Use the WebMCP tools on this page to research the current board. Discover real candidates, add them to the board, then verify each must-have requirement with current web evidence. No source = no VERIFIED. Use get_missing_checks to research only unresolved cells. If the human changes a requirement on the page, call get_research_board with the last revision you saw, then re-check only what the change invalidated.`;

function loadBoard() {
  const raw = localStorage.getItem(RESEARCH_BOARD_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ResearchBoard; } catch { return null; }
}

function publish(board: ResearchBoard) {
  localStorage.setItem(RESEARCH_BOARD_STORAGE_KEY, JSON.stringify(board));
  window.dispatchEvent(new CustomEvent(RESEARCH_BOARD_EVENT, { detail: board }));
}

export function AgentResearchBoardDemoBar() {
  const [webMcpReady, setWebMcpReady] = useState(false);
  const [board, setBoard] = useState<ResearchBoard | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sync = () => setBoard(loadBoard());
    let attempts = 0;
    const checkWebMcp = () => {
      const ready = Boolean((document as Document & { modelContext?: { registerTool?: unknown } }).modelContext?.registerTool);
      setWebMcpReady(ready);
      attempts += 1;
      if (ready || attempts >= 80) window.clearInterval(timer);
    };
    const timer = window.setInterval(checkWebMcp, 250);
    checkWebMcp();
    sync();
    window.addEventListener(RESEARCH_BOARD_EVENT, sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(RESEARCH_BOARD_EVENT, sync);
    };
  }, []);

  function startDemo() {
    const now = new Date().toISOString();
    const next: ResearchBoard = {
      id: researchBoardId("board"),
      objective: DEMO_OBJECTIVE,
      criteria: DEMO_REQUIREMENTS.map((label) => ({
        id: researchBoardId("criterion"),
        label,
        hard: true,
        addedBy: "human",
        createdAt: now,
        updatedRevision: 1
      })),
      candidates: [],
      activity: [{
        id: researchBoardId("event"),
        at: now,
        actor: "human",
        label: "DEMO BOARD CREATED",
        detail: "The human started the hackathon demo with three must-have requirements.",
        revision: 1
      }],
      revision: 1,
      createdAt: now,
      updatedAt: now
    };
    publish(next);
    location.hash = "research-board";
  }

  function addTwist() {
    const current = loadBoard();
    if (!current || current.criteria.some((item) => item.label.toLowerCase() === LIVE_TWIST.toLowerCase())) return;
    const now = new Date().toISOString();
    const revision = current.revision + 1;
    publish({
      ...current,
      criteria: [...current.criteria, {
        id: researchBoardId("criterion"),
        label: LIVE_TWIST,
        hard: true,
        addedBy: "human",
        createdAt: now,
        updatedRevision: revision
      }],
      activity: [...current.activity, {
        id: researchBoardId("event"),
        at: now,
        actor: "human",
        label: "REQUIREMENT ADDED",
        detail: LIVE_TWIST,
        revision
      }].slice(-60),
      revision,
      updatedAt: now
    });
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(AGENT_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const twistAdded = board?.criteria.some((item) => item.label.toLowerCase() === LIVE_TWIST.toLowerCase()) ?? false;

  return (
    <section className="border-b border-white/10 bg-[#0B0B0B] px-5 pt-6 text-white md:px-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-[#E2B632]/25 bg-[#E2B632]/[0.06] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F4D96D]">90-second live demo</span>
              <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${webMcpReady ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                {webMcpReady ? "WebMCP detected" : "WebMCP not detected in this tab"}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">Start the fixed demo scenario, let the agent research, then add one requirement while it works. The board revision changes and only the newly invalidated checks should return to the research queue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startDemo} className="rounded-xl bg-[#E2B632] px-4 py-2.5 text-sm font-semibold text-black">{board ? "Reset demo" : "Start demo"}</button>
            <button type="button" onClick={() => void copyPrompt()} className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/75">{copied ? "Prompt copied" : "Copy agent prompt"}</button>
            <button type="button" onClick={addTwist} disabled={!board || twistAdded} className="rounded-xl border border-[#E2B632]/35 bg-[#E2B632]/10 px-4 py-2.5 text-sm font-semibold text-[#F4D96D] disabled:cursor-not-allowed disabled:opacity-35">{twistAdded ? "Twist added" : "+ No credit card required"}</button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-4">
          <div><span className="text-white/75">1.</span> Start demo board</div>
          <div><span className="text-white/75">2.</span> Agent adds sourced evidence</div>
          <div><span className="text-white/75">3.</span> Human changes one rule</div>
          <div><span className="text-white/75">4.</span> Agent rechecks only affected cells</div>
        </div>
      </div>
    </section>
  );
}
