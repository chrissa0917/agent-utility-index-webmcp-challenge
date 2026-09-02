import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(join(root, dir))) {
    if (["node_modules", ".next", ".git"].includes(entry)) continue;
    const full = join(root, dir, entry);
    const rel = relative(root, full);
    const stats = statSync(full);
    if (stats.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

const webmcpSource = read("components/AgentResearchBoardWebMcp.tsx");
const expectedTools = [
  "create_research_board",
  "get_research_board",
  "add_research_candidate",
  "update_candidate_evidence",
  "get_missing_checks"
];

test("demo route registers exactly the five approved WebMCP tools", () => {
  const found = [...webmcpSource.matchAll(/name:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(found, expectedTools);
});

test("WebMCP demo route is preserved", () => {
  const page = read("app/agent-utility-index/demo/page.tsx");
  assert.match(page, /AgentResearchBoardWebMcp/);
  assert.match(read("README.md"), /https:\/\/chrissaautomates\.com\/agent-utility-index\/demo/);
});

test("verified evidence requires a source URL", () => {
  assert.match(webmcpSource, /status === "VERIFIED" && !sourceUrl/);
  assert.match(webmcpSource, /SOURCE_REQUIRED/);
  assert.match(webmcpSource, /VERIFICATION REJECTED/);
  assert.match(webmcpSource, /No source = no VERIFIED/);
  assert.match(webmcpSource, /current_cell_revision:\s*currentCellRevision/);
  assert.match(webmcpSource, /evidence_revision:\s*currentCellRevision/);
  assert.match(webmcpSource, /status === "VERIFIED" \? "EVIDENCE VERIFIED" : "EVIDENCE UPDATED"/);
});

test("public extraction excludes private service integrations", () => {
  const files = walk(".");
  const forbiddenPaths = [
    /^supabase\//,
    /^content\//,
    /^public\/images\//,
    /^app\/api\//,
    /^\.railway/,
    /^railway\.json$/,
    /^Dockerfile$/
  ];
  for (const file of files) {
    for (const pattern of forbiddenPaths) {
      assert.ok(!pattern.test(file), `unexpected private/deployment path: ${file}`);
    }
  }
});

test("source does not include credential-like values or private provider names", () => {
  const haystack = walk(".")
    .filter((file) => /^(app|components|lib)\//.test(file))
    .map((file) => `${file}\n${read(file)}`)
    .join("\n");
  const forbidden = [
    /sk-[A-Za-z0-9]{16,}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY/,
    /service_role/i,
    /SUPABASE/,
    /FIRECRAWL/,
    /TAVILY/,
    /SCRAPINGBEE/,
    /BRIGHTDATA/
  ];
  for (const pattern of forbidden) {
    assert.ok(!pattern.test(haystack), `forbidden secret/provider pattern: ${pattern}`);
  }
});

test("WebMCP tool source avoids network, cookies, and form submission", () => {
  const forbidden = [
    "document.cookie",
    "fetch(",
    "XMLHttpRequest",
    "sendBeacon",
    "WebSocket",
    ".submit(",
    "FormData"
  ];
  for (const snippet of forbidden) {
    assert.ok(!webmcpSource.includes(snippet), `unexpected browser capability: ${snippet}`);
  }
});
