export type ResearchEvidenceStatus = "VERIFIED" | "PARTIAL" | "MISSING" | "FAILED";

export type ResearchCriterion = {
  id: string;
  label: string;
  hard: boolean;
  addedBy: string;
  createdAt: string;
  updatedRevision?: number;
};

export type ResearchEvidence = {
  criterionId: string;
  status: ResearchEvidenceStatus;
  detail: string;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceSnippet?: string;
  observedAt?: string;
  updatedAt: string;
  evidenceRevision: number;
};

export type ResearchCandidate = {
  id: string;
  name: string;
  website?: string;
  summary?: string;
  evidence: ResearchEvidence[];
  updatedAt: string;
  updatedRevision?: number;
};

export type ResearchActivity = {
  id: string;
  at: string;
  actor: string;
  label: string;
  detail: string;
  revision?: number;
};

export type ResearchBoard = {
  id: string;
  objective: string;
  criteria: ResearchCriterion[];
  candidates: ResearchCandidate[];
  activity: ResearchActivity[];
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export const RESEARCH_BOARD_STORAGE_KEY = "cautomates_research_board_v2";
export const RESEARCH_BOARD_EVENT = "cautomates:research-board-updated";

export function researchBoardId(prefix = "item") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizedCandidateKey(name: string, website?: string) {
  if (website) {
    try {
      return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      // Fall through to normalized name when the URL is incomplete or invalid.
    }
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/(\.io|\.com|\.ai)$/g, "");
}

export function missingEvidence(board: ResearchBoard) {
  return board.candidates.flatMap((candidate) => board.criteria
    .filter((criterion) => criterion.hard)
    .filter((criterion) => {
      const evidence = candidate.evidence.find((item) => item.criterionId === criterion.id);
      return !evidence || evidence.status === "MISSING" || evidence.status === "PARTIAL";
    })
    .map((criterion) => {
      const evidence = candidate.evidence.find((item) => item.criterionId === criterion.id);
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        criterionId: criterion.id,
        criterionLabel: criterion.label,
        expectedCellRevision: evidence?.evidenceRevision ?? 0,
        currentStatus: evidence?.status ?? "MISSING"
      };
    }));
}

export function candidateVerdict(board: ResearchBoard, candidate: ResearchCandidate) {
  const hard = board.criteria.filter((criterion) => criterion.hard);
  if (!hard.length) return "NEEDS_RESEARCH" as const;

  let verified = 0;
  let failed = 0;
  for (const criterion of hard) {
    const evidence = candidate.evidence.find((item) => item.criterionId === criterion.id);
    if (evidence?.status === "VERIFIED") verified += 1;
    if (evidence?.status === "FAILED") failed += 1;
  }

  if (failed > 0) return "REJECTED" as const;
  if (verified === hard.length) return "QUALIFIES" as const;
  return "NEEDS_EVIDENCE" as const;
}
