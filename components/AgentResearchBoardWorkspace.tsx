"use client";

import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/Section";
import {
  RESEARCH_BOARD_EVENT,
  RESEARCH_BOARD_STORAGE_KEY,
  candidateVerdict,
  missingEvidence,
  researchBoardId,
  type ResearchBoard,
  type ResearchCandidate,
  type ResearchEvidenceStatus
} from "@/lib/research-board";

const exampleObjective = "Find 5 email-finding tools with a free plan, API access, and CSV export.";

const tone: Record<ResearchEvidenceStatus, string> = {
  VERIFIED: "border-emerald-300/35 bg-emerald-400/10 text-emerald-200",
  PARTIAL: "border-amber-300/35 bg-amber-400/10 text-amber-100",
  MISSING: "border-white/10 bg-white/[0.03] text-white/45",
  FAILED: "border-red-300/30 bg-red-400/10 text-red-100"
};

const verdictTone = {
  QUALIFIES: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  NEEDS_EVIDENCE: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  REJECTED: "border-red-300/30 bg-red-400/10 text-red-100",
  NEEDS_RESEARCH: "border-white/10 bg-white/[0.03] text-white/50"
} as const;

function persist(board: ResearchBoard) {
  localStorage.setItem(RESEARCH_BOARD_STORAGE_KEY, JSON.stringify(board));
  window.dispatchEvent(new CustomEvent(RESEARCH_BOARD_EVENT, { detail: board }));
}

function newBoard(objective: string, labels: string[]) {
  const now = new Date().toISOString();
  return {
    id: researchBoardId("board"),
    objective,
    criteria: labels.map((label) => ({ id: researchBoardId("criterion"), label, hard: true, addedBy: "human", createdAt: now, updatedRevision: 1 })),
    candidates: [],
    activity: [{ id: researchBoardId("event"), at: now, actor: "human", label: "BOARD CREATED", detail: "The human created the shared research goal and initial requirements.", revision: 1 }],
    revision: 1,
    createdAt: now,
    updatedAt: now
  } satisfies ResearchBoard;
}

function CandidateRow({ board, candidate }: { board: ResearchBoard; candidate: ResearchCandidate }) {
  const verdict = candidateVerdict(board, candidate);
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{candidate.name}</h3>
            <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold ${verdictTone[verdict]}`}>{verdict.replace("_", " ")}</span>
          </div>
          {candidate.summary ? <p className="mt-2 text-sm leading-6 text-white/55">{candidate.summary}</p> : null}
          {candidate.website ? <a href={candidate.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#E2B632] underline underline-offset-2">{candidate.website}</a> : null}
        </div>
        <div className="text-right text-xs text-white/35">Updated {new Date(candidate.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {board.criteria.map((criterion) => {
          const evidence = candidate.evidence.find((item) => item.criterionId === criterion.id);
          const status = evidence?.status ?? "MISSING";
          return (
            <div key={criterion.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-5">{criterion.label}</p>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold ${tone[status]}`}>{status}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/52">{evidence?.detail || "The agent has not supplied evidence for this requirement yet."}</p>
              {evidence?.sourceSnippet ? <p className="mt-2 rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 text-[11px] leading-5 text-white/40">“{evidence.sourceSnippet}”</p> : null}
              {evidence?.sourceUrl ? <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-[11px] text-[#E2B632] underline underline-offset-2">{evidence.sourceTitle || evidence.sourceUrl}</a> : null}
              {evidence ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.08em] text-white/28"><span>cell r{evidence.evidenceRevision}</span>{evidence.observedAt ? <span>observed {new Date(evidence.observedAt).toLocaleString()}</span> : null}</div> : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function AgentResearchBoardWorkspace() {
  const [board, setBoard] = useState<ResearchBoard | null>(null);
  const [objective, setObjective] = useState("");
  const [initialCriteria, setInitialCriteria] = useState("");
  const [newRequirement, setNewRequirement] = useState("");

  useEffect(() => {
    const sync = () => {
      const raw = localStorage.getItem(RESEARCH_BOARD_STORAGE_KEY);
      if (!raw) { setBoard(null); return; }
      try { setBoard(JSON.parse(raw) as ResearchBoard); }
      catch { localStorage.removeItem(RESEARCH_BOARD_STORAGE_KEY); setBoard(null); }
    };
    sync();
    window.addEventListener(RESEARCH_BOARD_EVENT, sync);
    return () => window.removeEventListener(RESEARCH_BOARD_EVENT, sync);
  }, []);

  const missing = useMemo(() => board ? missingEvidence(board) : [], [board]);
  const qualified = useMemo(() => board?.candidates.filter((candidate) => candidateVerdict(board, candidate) === "QUALIFIES").length ?? 0, [board]);

  function save(next: ResearchBoard) {
    setBoard(next);
    persist(next);
  }

  function create() {
    const cleanObjective = objective.trim();
    if (cleanObjective.length < 8) return;
    const labels = initialCriteria.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
    save(newBoard(cleanObjective, labels.length ? labels : ["Meets the user's stated requirements"]));
  }

  function addRequirement() {
    if (!board || !newRequirement.trim()) return;
    const label = newRequirement.trim();
    if (board.criteria.some((item) => item.label.toLowerCase() === label.toLowerCase())) return;
    const now = new Date().toISOString();
    const revision = board.revision + 1;
    save({
      ...board,
      criteria: [...board.criteria, { id: researchBoardId("criterion"), label, hard: true, addedBy: "human", createdAt: now, updatedRevision: revision }],
      activity: [...board.activity, { id: researchBoardId("event"), at: now, actor: "human", label: "REQUIREMENT ADDED", detail: label, revision }].slice(-60),
      revision,
      updatedAt: now
    });
    setNewRequirement("");
  }

  function removeRequirement(id: string) {
    if (!board) return;
    const criterion = board.criteria.find((item) => item.id === id);
    if (!criterion) return;
    const now = new Date().toISOString();
    const revision = board.revision + 1;
    save({
      ...board,
      criteria: board.criteria.filter((item) => item.id !== id),
      candidates: board.candidates.map((candidate) => ({ ...candidate, evidence: candidate.evidence.filter((item) => item.criterionId !== id) })),
      activity: [...board.activity, { id: researchBoardId("event"), at: now, actor: "human", label: "REQUIREMENT REMOVED", detail: criterion.label, revision }].slice(-60),
      revision,
      updatedAt: now
    });
  }

  function reset() {
    localStorage.removeItem(RESEARCH_BOARD_STORAGE_KEY);
    window.dispatchEvent(new Event(RESEARCH_BOARD_EVENT));
    setBoard(null);
    setObjective("");
    setInitialCriteria("");
    setNewRequirement("");
  }

  return (
    <div className="bg-[#0B0B0B] text-white" id="research-board">
      <Section className="pb-12 pt-10 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#E2B632]">Agent Utility Index · shared research board</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-tight md:text-6xl">Humans control the rules. Agents control the research.</h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/65">Change a requirement while the agent works. The board keeps stable IDs and revisioned evidence cells, so the agent can re-check only what your change invalidated instead of restarting the whole comparison.</p>
          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">No source = no VERIFIED</div>

          {!board ? (
            <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl md:p-8">
              <div className="mb-5 rounded-2xl border border-[#E2B632]/25 bg-[#E2B632]/8 p-4 text-sm leading-6 text-[#F4D96D]">For the fastest demo, use the “Start demo” control above, then ask a WebMCP-enabled agent to research this page. You can also create any board manually here.</div>
              <label className="block text-sm font-semibold">Decision or research goal
                <textarea value={objective} onChange={(event) => setObjective(event.target.value)} className="mt-3 min-h-32 w-full rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-base leading-7 outline-none placeholder:text-white/30 focus:border-[#E2B632]" placeholder={exampleObjective} />
              </label>
              <label className="mt-5 block text-sm font-semibold">Must-have requirements <span className="font-normal text-white/40">(one per line or comma-separated)</span>
                <textarea value={initialCriteria} onChange={(event) => setInitialCriteria(event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-sm leading-6 outline-none placeholder:text-white/30 focus:border-[#E2B632]" placeholder={"Free plan\nAPI access\nCSV export"} />
              </label>
              <button type="button" onClick={create} disabled={objective.trim().length < 8} className="mt-5 w-full rounded-xl bg-[#E2B632] px-5 py-3.5 font-semibold text-black disabled:opacity-40">Create shared board</button>
            </div>
          ) : (
            <div className="mt-9 space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#E2B632]">Live shared state</p>
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">REVISION {board.revision}</span>
                    </div>
                    <h2 className="mt-3 max-w-4xl text-2xl font-semibold">{board.objective}</h2>
                  </div>
                  <button type="button" onClick={reset} className="text-sm text-white/45 underline underline-offset-4">Start over</button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-3xl font-semibold">{board.candidates.length}</div><div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/35">candidates</div></div>
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.05] p-4"><div className="text-3xl font-semibold text-emerald-200">{qualified}</div><div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/35">qualified</div></div>
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.05] p-4"><div className="text-3xl font-semibold text-amber-100">{missing.length}</div><div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/35">checks still missing</div></div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[#E2B632]">Human controls</p><h2 className="mt-2 text-xl font-semibold">Change the rules while the agent works</h2></div>
                  <span className="text-xs text-white/35">After board creation, the agent cannot edit these requirements.</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {board.criteria.map((criterion) => <span key={criterion.id} className="inline-flex items-center gap-2 rounded-full border border-[#E2B632]/30 bg-[#E2B632]/8 px-3 py-2 text-xs text-[#F4D96D]">{criterion.label}<button type="button" onClick={() => removeRequirement(criterion.id)} className="text-white/45 hover:text-white" aria-label={`Remove ${criterion.label}`}>×</button></span>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={newRequirement} onChange={(event) => setNewRequirement(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addRequirement(); }} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#E2B632]" placeholder="Add a new requirement, e.g. No credit card required" />
                  <button type="button" onClick={addRequirement} className="rounded-xl border border-[#E2B632]/40 bg-[#E2B632]/10 px-4 py-3 text-sm font-semibold text-[#F4D96D]">Add</button>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[#E2B632]">Agent research</p><h2 className="mt-2 text-2xl font-semibold">Candidates and source-backed evidence</h2></div>
                  <p className="max-w-lg text-right text-xs leading-5 text-white/38">The page does not invent candidates or proof. VERIFIED is rejected by the WebMCP tool unless a source URL is attached.</p>
                </div>
                {board.candidates.length ? <div className="mt-5 space-y-4">{board.candidates.map((candidate) => <CandidateRow key={candidate.id} board={board} candidate={candidate} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center"><p className="font-medium">Waiting for the agent to research.</p><p className="mt-2 text-sm text-white/45">Ask your WebMCP-enabled agent to discover candidates and write evidence into this board.</p></div>}
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-amber-100">Incremental research queue</p>
                  <p className="mt-2 text-xs leading-5 text-white/38">Only MISSING and PARTIAL checks appear here. FAILED is terminal unless explicitly revisited.</p>
                  {missing.length ? <div className="mt-4 space-y-2">{missing.slice(0, 12).map((item) => <div key={`${item.candidateId}-${item.criterionId}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/25 px-4 py-3 text-sm"><div><span className="font-semibold">{item.candidateName}</span><span className="text-white/40"> → </span>{item.criterionLabel}</div><span className="font-mono text-[9px] uppercase text-white/28">cell r{item.expectedCellRevision}</span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-emerald-200">No unresolved must-have checks remain for the candidates currently on the board.</p>}
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/40">Shared activity</p>
                  <div className="mt-4 space-y-3">{board.activity.slice(-8).reverse().map((item) => <div key={item.id} className="border-l border-white/10 pl-3"><div className="flex items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#E2B632]">{item.actor}</span><span className="text-xs font-semibold">{item.label}</span>{item.revision ? <span className="font-mono text-[9px] text-white/25">r{item.revision}</span> : null}</div><p className="mt-1 text-xs leading-5 text-white/42">{item.detail}</p></div>)}</div>
                </div>
              </section>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
