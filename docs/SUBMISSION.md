# Submission Notes

## Project

Agent Utility Index WebMCP Demo

## Public Demo

<https://chrissaautomates.com/agent-utility-index/demo>

## Public Repository

This repository is intended to be the separate public submission repository. The existing Chrissa Automates website repository stays private.

## Challenge-Compatible License

`AGPL-3.0-only`

Reason: the project demonstrates browser-agent tooling for a network-facing workflow. AGPL keeps the code open for users who interact with modified hosted versions, which is more protective than permissive defaults while remaining an open-source license.

## What Was Extracted

Only the WebMCP challenge demo source was extracted:

- `app/agent-utility-index/demo/page.tsx`
- `components/AgentResearchBoardWebMcp.tsx`
- `components/AgentResearchBoardWorkspace.tsx`
- `components/AgentResearchBoardDemoBar.tsx`
- `components/AgentUtilityIndexProductDirection.tsx`
- `components/Section.tsx`
- `lib/research-board.ts`

## What Was Removed

The public repo omits:

- private Chrissa Automates site pages
- private marketing content and images
- production Railway configuration
- Supabase migrations and server code
- paid retrieval provider code
- email, analytics, and CRM integrations
- `.env` files and local machine metadata
- benchmark artifacts outside the WebMCP demo path

## Railway Production Behavior

No production Railway behavior was changed as part of this cleanup. The private production application can keep serving the existing live route at:

<https://chrissaautomates.com/agent-utility-index/demo>

This public repo is an extracted challenge artifact, not a replacement production deployment.

## WebMCP Tool Verification

The five expected tools are:

1. `create_research_board`
2. `get_research_board`
3. `add_research_candidate`
4. `update_candidate_evidence`
5. `get_missing_checks`

Run:

```bash
npm run test
```

## Build Verification

Run:

```bash
npm run validate
```

## Secret Scan

Suggested local scan:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' --glob '!.next/**' "(sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_[A-Za-z0-9_]+|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[0-9A-Za-z-]+|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|api[_-]?key|secret|token|password|service_role|SUPABASE|FIRECRAWL|TAVILY|SCRAPINGBEE|BRIGHTDATA|RAILWAY)"
```

Any hits should be reviewed manually. Documentation-only mentions of generic secret names are acceptable; real credential-like values are not.

