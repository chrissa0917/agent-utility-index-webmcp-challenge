# Agent Utility Index WebMCP Challenge Submission

This repository is the public, challenge-safe extraction of the Agent Utility Index WebMCP demo from Chrissa Automates.

Live demo: <https://chrissaautomates.com/agent-utility-index/demo>

## What It Demonstrates

The demo turns a webpage into shared working memory between a human and an AI agent:

- the human creates or changes research requirements in the browser
- the agent reads the same board state through WebMCP
- the agent adds candidates and source-backed evidence
- every `VERIFIED` claim requires a source URL
- when the human changes a requirement, the agent can re-check only the invalidated evidence cells instead of restarting

The core product idea comes from the CAutomates Agent Utility Index: agent tools should be evaluated by whether they reduce total work, cost, and risk, not just whether they can call another API.

## Preserved Production URL

The live Chrissa Automates route remains:

```text
https://chrissaautomates.com/agent-utility-index/demo
```

This public repository keeps the same route locally at:

```text
/agent-utility-index/demo
```

No changes in this extraction require making the existing Chrissa Automates repository public, and this repo intentionally omits private website content, private deployment history, production analytics, customer data, Supabase code, Railway project metadata, and environment variables.

## WebMCP Tools

The demo registers exactly five browser WebMCP tools on `/agent-utility-index/demo`:

| Tool | Purpose | Safety Boundary |
| --- | --- | --- |
| `create_research_board` | Create a visible shared research board from an objective and criteria. | Writes only to browser `localStorage` in the current tab/session. |
| `get_research_board` | Read the current board and optionally list changes since a previous revision. | Read-only; returns board state the page already owns. |
| `add_research_candidate` | Add a candidate discovered by the agent. | Deduplicates candidates; cannot edit human-controlled criteria. |
| `update_candidate_evidence` | Update one candidate/requirement evidence cell. | Requires expected revisions; `VERIFIED` requires a source URL. |
| `get_missing_checks` | Return the unresolved research queue. | Read-only; returns only missing or partial checks. |

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/agent-utility-index/demo
```

## Validate

```bash
npm run validate
```

Validation runs:

- `npm run lint`
- `npm run test`
- `npm run build`

The included tests statically verify that the demo registers only the approved five WebMCP tools and does not include network calls, cookies, storage beyond the explicit board state key, form submission, or private-service identifiers.

## Suggested Demo Prompt

```text
Use the WebMCP tools on this page to research the current board. Discover real candidates, add them to the board, then verify each must-have requirement with current web evidence. No source = no VERIFIED. Use get_missing_checks to research only unresolved cells. If the human changes a requirement on the page, call get_research_board with the last revision you saw, then re-check only what the change invalidated.
```

## License

This project is licensed as `AGPL-3.0-only`.

I chose AGPL instead of MIT because this is network-facing agent infrastructure. AGPL is the most protective widely accepted open-source license for this shape of project: it preserves user freedoms and source-availability obligations even when the software is run as a hosted service.

## Submission Scope

Included:

- minimal Next.js app
- `/agent-utility-index/demo` route
- five WebMCP tool definitions
- shared research board UI
- localStorage-backed demo state model
- static safety tests
- challenge documentation

Excluded:

- the private Chrissa Automates website repository
- private blog/content assets
- production secrets or `.env` files
- Supabase, email, analytics, CRM, and paid-provider integration code
- benchmark execution artifacts that are not necessary to run the WebMCP demo
- Railway deployment configuration from the private production service

