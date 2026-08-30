# Security

This repository contains a browser-only WebMCP demo.

## Boundaries

- No production credentials are required.
- No `.env` file is needed for local demo use.
- No server-side provider keys are included.
- WebMCP tools write only to the current browser's local demo board state.
- `VERIFIED` evidence requires a source URL.
- Tool writes include revision checks so stale evidence updates fail instead of silently overwriting newer human or agent work.

## Reporting

Please open a GitHub issue for security concerns that do not expose a live secret. If you believe a live credential was exposed, revoke it first and then report the affected file/path.

