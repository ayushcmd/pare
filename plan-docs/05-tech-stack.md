# PARE — Technology Stack & Dependency Specification

**Document:** `05-tech-stack.md`  
**Version:** 1.0 — implementation specification with explicit verification gates  
**Date:** 18 November 2026  
**Status:** Stack approved by product owner; a few platform-specific choices remain open for Document 06  
**Depends on:** `01-product-overview.md`, `02-problems-and-solutions.md`, `03-brand-guidelines.md`, `04-ui-ux-design.md`  
**Brand:** PARE — *Keep what matters. Cut the rest.*

> **Stack in one sentence:** a single Cloudflare Worker written in TypeScript, serving a no-framework HTML/CSS/JavaScript website and a stateless HTTP MCP endpoint, both using the same deterministic analysis logic. No accounts, database, paid AI service, or persistent prompt storage in v1.

> **Implementation update (23 November 2026):** [`00-implementation-baseline.md`](./00-implementation-baseline.md) supersedes conflicting stack details below. The implemented website is browser-local, uses Vite-built TypeScript, directly uses `@modelcontextprotocol/server` v2 without the Agents framework, and exposes two MCP tools.

---

## 1. Purpose, authority, and non-goals

This document defines what to install, why each dependency exists, how to organize the codebase, and what must be tested before deploying PARE. It is intentionally conservative: **a production-ready engineering process is not the same as a large technology stack**. Avoid introducing a technology simply because it is popular.

This document **implements rather than overrides** Documents 01–04. Where API schemas, security limits, or deployment permissions are not yet approved, identify them as **proposed** and defer final decisions to Documents 06–11.

### Approved decisions carried forward

| Concern | Approved choice | Evidence in project docs |
|---|---|---|
| Product | PARE, AI context and token waste advisor | 01 |
| Audience | Everyday users and developers, developer-first | 01 |
| Main flows | Analyze, recommend, optionally draft, compare | 01–02 |
| Optimization | Safe, conservative, original unchanged | 02 |
| Task awareness | Optional user-provided task description | 02–04 |
| Browser UI | Single page; paste-first, file input secondary | 04 |
| Results | Vertically stacked; review diff before copying | 04 |
| Comparison | Only when a **valid** draft and two comparable counts exist | 04 |
| Identity | Original provided logo is authoritative | 03 |
| Palette | Sampled `#021020` navy and `#BDFB64` lime; derived accessible shades | 03 |
| UI theme / type | Dark-first, no toggle; system font stack | 03 |
| Frontend | Plain HTML + CSS + vanilla JavaScript | 01–04 |
| Backend | TypeScript on Cloudflare Workers | 01 |
| Package manager | **npm** | Owner decision for 05 |
| Protocol SDK | **Official MCP TypeScript SDK v2** | Owner decision for 05 |
| Validation | **Zod** | Owner decision for 05 |
| Testing | **Vitest** | Owner decision for 05 |
| Tokenization | **One encoding implementation for v1**; other-model results called estimates | Owner decision for 05 |
| Files | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log` | Owner decision for 05 |
| Rollout | **Protected/limited beta**, not immediately unrestricted public MCP | Owner decision for 05 |
| Storage | No database, no stored analysis history | 01–04 |

### Explicitly out of scope

React, Next.js, Vue, Tailwind build pipeline, UI component libraries, Express, Fastify, Hono, Prisma, Redis, D1, R2, Docker/Kubernetes, a standalone Node server, Vite, queues, background jobs, PDF/Office/image/audio extraction, AI rewriting, model inference, account dashboards, token billing and automatic conversation interception. Optional or future needs must be justified by evidence and approved before addition.

---

## 2. Verified platform findings — 18 November 2026

The following are external verification findings, **not** facts inferred from prior PARE documents:

1. The **official MCP TypeScript SDK v2** is the current stable line; the server package is **`@modelcontextprotocol/server`**, not the historical monolithic `@modelcontextprotocol/sdk` v1 package. It implements the **2026-07-28** specification. Its web-standard handler supports deployment to Cloudflare Workers. [MCP SDK v2 overview](https://ts.sdk.modelcontextprotocol.io/v2/), [SDK package guide](https://ts.sdk.modelcontextprotocol.io/v2/get-started/packages).
2. The `createMcpHandler` API serves a server factory over web-standard `Request`/`Response`; on Workers, its `.fetch` can be routed to `/mcp` without a Node adapter or an HTTP framework. The SDK documents per-request behavior and legacy stateless compatibility. [Web-standard serving](https://ts.sdk.modelcontextprotocol.io/v2/serving/web-standard), [handler reference](https://ts.sdk.modelcontextprotocol.io/v2/api/%40modelcontextprotocol/server/server/createMcpHandler.html).
3. Cloudflare Workers support **static assets in the same deployment as a Worker script**. Static assets can be served from `public/` using Wrangler's `assets.directory` configuration. [Static assets](https://developers.cloudflare.com/workers/static-assets/), [assets binding](https://developers.cloudflare.com/workers/static-assets/binding/).
4. Cloudflare's own Agents SDK also supports remote MCP, but it is **not required** for this minimal v1; the official MCP SDK's handler already supports web-standard runtimes. Cloudflare's alternative is documented here: [Cloudflare MCP guide](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/).
5. `js-tiktoken` is a **pure JavaScript** tokenizer suitable for edge runtimes relative to WASM-based `tiktoken`; it is a candidate, **not proof** of PARE's final Worker bundle size/performance. Test the installed version under `wrangler dev` and deploy a canary before accepting it. [Package](https://www.npmjs.com/package/js-tiktoken), [source](https://github.com/bracesproul/js-tiktoken).
6. Cloudflare has plan-dependent **CPU, memory, deployment and body-size constraints**. Do not copy generic platform maximums into PARE input caps. Select a much lower app-level limit from profiling and security testing. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

**Versioning policy:** do not claim a precise package patch version was tested in this document. Resolve the latest compatible stable versions **when bootstrapping**, commit `package-lock.json`, review peer dependency requirements, and pin releases through the lockfile. Re-test after upgrades. Examples below intentionally omit patch version numbers.

---

## 3. The complete lightweight stack

| Layer | Selection | Classification | What it does |
|---|---|---|---|
| UI markup | HTML5 | Native | Accessible semantic single-page website |
| UI styling | Plain CSS | Native | Dark palette and responsive components |
| UI behavior | Vanilla JavaScript | Native | File selection, calls, state, diff review, copy |
| Backend language | TypeScript strict mode | Development tool | Typed analysis core and Worker request handlers |
| Runtime | Cloudflare Workers | Hosted runtime | Hosts API and remote MCP endpoints |
| Static serving | Workers Static Assets | Platform feature | Hosts `index.html`, `style.css`, `app.js`, approved logo |
| MCP | `@modelcontextprotocol/server` v2 | Runtime dependency | Tool registration and Streamable HTTP handling |
| Schemas | `zod` v4 | Runtime dependency | Validate tool inputs and structured data |
| Tokenization | `js-tiktoken` (proposed candidate) | Runtime dependency | One named OpenAI-style encoding, locally bundled |
| Testing | `vitest` | Dev dependency | Deterministic rules and contract tests |
| Type checking | `typescript` | Dev dependency | Compile-time correctness without frontend framework |
| Worker CLI | `wrangler` | Dev dependency | Local Worker simulation, build and deployment |
| Cloudflare types | `@cloudflare/workers-types` if needed | Conditional dev dependency | Only if type generation is insufficient |
| Package manager | npm + committed lockfile | Development tool | Reproducible installs and scripts |
| Source / CI | GitHub + GitHub Actions | Distribution / CI | PR checks and release workflow; no CI service required |

**Do not add `@modelcontextprotocol/client` to production merely to create a server**. It can be a development/test-only dependency if integration tests genuinely need a programmatic MCP client. Likewise, install MCP Inspector for manual inspection via `npx` rather than depending on it at runtime.

### Why no Node web framework?

Cloudflare Workers already expose `fetch(request, env, ctx)`. `createMcpHandler` already speaks MCP over web-standard HTTP. A small `if`/URL pathname dispatch is enough for `/api/analyze`, `/mcp` and the static-assets fallback. This is a specific architectural choice, not a ban on frameworks forever.

### Why no database?

All v1 operations transform only content supplied **in the current request**. There is no saved session, user account, usage ledger, or historical report. Adding D1 or R2 now would add a privacy obligation without serving an approved feature.

---

## 4. One deployment, two public interfaces, one analysis core

```text
Browser                              Compatible MCP client
HTML/CSS/vanilla JS                 Explicit tool invocation
      |                                      |
      | POST /api/analyze                    | POST /mcp (Streamable HTTP)
      +------------------+-------------------+
                         |
             Cloudflare Worker / TypeScript
                 [routing + validation]
                         |
              shared src/core/analyze.ts
            +------------+-------------+
            |            |             |
        tokenizer    rule engine    draft/diff guard
            |            |             |
            +------------+-------------+
                         |
                 Typed analysis result
                         |
             sanitized response to caller
```

The same core must be called from both interfaces. No separate browser token counter that can drift from the MCP implementation. Browser JS only renders results, selects files, and handles interactions.

**Do not assume MCP sees the current user conversation.** MCP clients supply the content explicitly and may not support arbitrary file attachments. A website file upload and a remote MCP tool argument are different integration paths, even when their normalized text uses the same core.

---

## 5. Repository layout — minimal but maintainable

```text
pare/
├── public/
│   ├── index.html              # single page and semantic form
│   ├── style.css               # system typography + approved CSS tokens
│   ├── app.js                  # vanilla UI and safe diff review
│   └── assets/
│       └── pare-logo.png       # approved asset/export; no recreated mark
├── src/
│   ├── index.ts                # Worker fetch router
│   ├── api.ts                  # POST /api/analyze HTTP handling
│   ├── mcp.ts                  # official SDK server factory + tools
│   ├── core/
│   │   ├── types.ts            # shared typed request/response contracts
│   │   ├── analyze.ts          # orchestrate validation and findings
│   │   ├── tokenize.ts         # one named encoding
│   │   ├── rules.ts            # deterministic analysis checks
│   │   ├── draft.ts            # safe proposed prose cleanup only
│   │   └── diff.ts             # compute inspectable changes
│   └── security/
│       └── validate-input.ts   # server-side size/type validation
├── tests/
│   ├── tokenizer.test.ts
│   ├── rules.test.ts
│   ├── drafts.test.ts
│   └── contracts.test.ts
├── docs/
│   ├── 01-product-overview.md
│   ├── 02-problems-and-solutions.md
│   ├── 03-brand-guidelines.md
│   ├── 04-ui-ux-design.md
│   └── 05-tech-stack.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── wrangler.jsonc
├── .gitignore
└── README.md
```

**File count is not a goal:** combine small modules if that improves clarity. But keep the core independent of HTTP, MCP, and DOM so it remains testable.

---

## 6. Installation and scripts

### Prerequisites

- A currently supported **Node.js LTS** version for local npm, TypeScript, Vitest and Wrangler. Node is **not** a production server in this architecture.
- npm; Cloudflare account for deployment; GitHub for source control.
- No API key or external LLM subscription to run the analyzer.

### Bootstrap (illustrative commands)

```bash
mkdir pare && cd pare
npm init -y
npm pkg set type=module
npm install @modelcontextprotocol/server zod js-tiktoken
npm install -D typescript wrangler vitest
mkdir -p public/assets src/core src/security tests docs
```

If build/type tests require Cloudflare type declarations, generate Wrangler types first; add `@cloudflare/workers-types` only if genuinely needed. Do not install old `@modelcontextprotocol/sdk` for new code.

### Recommended `package.json` scripts

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "wrangler deploy"
  }
}
```

Add a `ci` script once dependency security and Worker integration gates have been finalized; GitHub Actions should at least execute `npm ci`, `npm run typecheck`, and `npm test`.

### TypeScript configuration guidance

- Use `strict: true`, modern `ESNext` module output/resolution compatible with Wrangler, and `lib: ["ESNext", "WebWorker"]` for the Worker sources.
- Separate type checks for browser JS if desired; no client bundler required.
- Prefer `unknown` at network boundaries, then validate with Zod.
- Do not import Node-only modules (`node:fs`, `node:child_process`, process-bound transports) into the Worker.
- Never suppress a runtime incompatibility simply by enabling broad `nodejs_compat` flags; test if any compatibility flag is actually needed.

---

## 7. Cloudflare Worker configuration and routing

**Illustrative, non-secret `wrangler.jsonc`:**

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "pare-mcp",
  "main": "src/index.ts",
  "compatibility_date": "2026-11-18",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  }
}
```

This is a **starting skeleton**, not a production-verified configuration. Confirm the selected compatibility date with the installed Wrangler release and run the Workers local test. Route `/api/*` and `/mcp` **before** delegating to `env.ASSETS.fetch(request)`; carefully test any special asset routing configuration against these paths.

**Proposed route table, to finalize in Document 06:**

| Route | Method | Handler | Notes |
|---|---|---|---|
| `/` and static files | GET | Workers Static Assets | Main page, CSS, JS and approved logo |
| `/api/analyze` | POST | `api.ts` | JSON request containing normalized input text |
| `/mcp` | SDK-defined HTTP methods | `mcp.ts` handler | Do not implement a homegrown JSON-RPC parser |
| Other `/api/*` | N/A | Worker | Controlled JSON 404 |

**Suggested routing pseudocode** (not a final API implementation):

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/mcp') {
      // Verify beta authorization and origin/host policy first.
      return mcpHandler.fetch(request);
    }
    if (url.pathname === '/api/analyze') {
      return handleAnalyze(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
```

Here `Env`, `mcpHandler`, and `handleAnalyze` are placeholders to define in Documents 06–07; the snippet is an architectural sketch, **not copy-paste-ready code**. Authentication may need to wrap MCP handler construction rather than only a naive pre-check. The selected mode must be integration-tested.

### MCP handler choice

Use **official SDK `createMcpHandler`** with a **new server instance per request**, as documented for stateless HTTP. Mount `.fetch` only at `/mcp`. Avoid the stdio transport in the hosted Worker; if local stdio packaging is later demanded, make it an optional separate entry point with explicit approval. No Cloudflare Durable Objects are needed for stateless v1.

### Service routing caution

Static asset requests may be served without invoking Worker code depending on Wrangler asset routing. This is expected for assets; API and MCP calls must be confirmed to reach the Worker in both `wrangler dev` and staging. Avoid accidentally exposing source `.ts`, environment files or docs meant to remain private in `public/`.

---

## 8. Tokenization: one encoding, honest labels

### Proposed single implementation

Use **`js-tiktoken` with a locally included `o200k_base` encoding** as the first tokenizer candidate. This is a **proposed specific encoding**, not owner-approved exact model coverage. The single choice fits the approved “one tokenizer” rule and avoids fetching tokenizer data at analysis time.

- Use the same encoding for **both** original and candidate draft.
- Save/report the encoding identifier alongside counts.
- Label results **exact for that specified encoding on the counted text**, not as universally exact for ChatGPT, Claude, Gemini, or other models.
- For any model whose tokenizer is not confirmed to match, say **“estimated; based on o200k_base encoding”**; never disguise it as provider billing usage.
- Do **not** divide character counts by four and call that a measured tokenizer result.
- Avoid an external CDN dependency for the encoding table in v1; prefer bundling, subject to size/performance verification.
- If the tested bundle is too large or too slow, **pause and present alternatives** (smaller encoding subset or explicit approximate count) before changing dependencies or product claims.

**Gate TKN-1:** `wrangler dev` successfully imports and counts sample English, Unicode, emoji, code and JSON.  
**Gate TKN-2:** Worker deploy/canary stays within applicable bundle, CPU and memory limits.  
**Gate TKN-3:** Stable test fixtures verify token counts and draft comparison is deterministic.  
**Gate TKN-4:** UI always displays counting basis; unknown model labels remain qualified.

### Cost savings are not the same as token reductions

PARE is **not** a provider bill or model quality predictor. Caching, prompt prefixes, multimodal pricing, provider-side formatting, hidden context and other fees can change billed cost. A smaller submitted text may not produce a better or cheaper overall agent task. Do not calculate dollar savings in v1.

---

## 9. File support — the approved seven extensions

| Extension | Handling | Can offer rewritten draft in v1? |
|---|---|---|
| `.txt` | UTF-8 text | **Only** when safely detected as prose |
| `.md` | UTF-8 Markdown; preserve fences and structural context | **Only** safe prose segments, avoid headings/fences/links unless explicitly tested |
| `.json` | Text, validate when possible; detect verbose structure | **No**, recommendation only |
| `.js` | Source code treated as untrusted text | **No**, recommendation only |
| `.ts` | Source code treated as untrusted text | **No**, recommendation only |
| `.py` | Source code treated as untrusted text | **No**, recommendation only |
| `.log` | Plain logs, report repeated/noisy content | **No**, recommendation only |

- **Website:** use a browser file picker with explicit extension allowlist; read file content via `File.text()` where supported; send normalized text to API, not raw binary multipart uploads. This is a recommended implementation of the approved feature, subject to Document 06 confirmation.
- **MCP:** tools accept text and metadata or bounded text values. Remote MCP tools cannot assume a client will upload a local file path; no unrestricted server-side path reads.
- Validate byte size, UTF-8 decoding and probable binary input **server-side** even if the browser checked it first.
- Do not execute source code, eval JSON, render file HTML as trusted markup, or preserve arbitrary user filenames in logs.
- Refuse PDF, `.docx`, image, `.zip`, directories and unsupported file types in v1 with a clear explanation.
- `src` logic must not trust a claimed extension to determine whether an input is safely editable. Mixed Markdown/code and other ambiguous content should default to advice-only.

### Input-size decisions are still open

No exact byte cap or timeout was approved. Document 06 should propose a **small conservative per-request limit** based on measured Worker CPU/memory behavior; Document 09 should define abuse protection and Document 10 should verify stress/fuzz behavior. Limits must cover combined text + optional task description, not just a file's nominal size.

---

## 10. Deterministic rule engine; no AI API

PARE detects **observable structural patterns** without pretending to understand document semantics at a model level.

| Problem from Document 02 | Lightweight method | Safe action |
|---|---|---|
| Oversized context | Count input; show length/section evidence | Advise targeted extraction; don't autonomously remove sections |
| Duplicate instructions | Normalize cautiously and identify repeated blocks | Propose limited prose draft with exact diff and warning |
| Inefficient file content | Detect repeated page-style lines, Markdown boilerplate | Suggest clean sections or text, do not promise file-format magic |
| MCP tool schema bloat | Inspect supplied schema/description text | Recommend pruning/discovery; schema edits advice-only |
| Oversized logs / JSON | Count noisy patterns and repeated keys | Explain filtering fields/lines; never rewrite syntax-sensitive data |
| Unverified savings | Count original and validated draft with same encoding | Show before/after **only when a valid draft exists** |

### Safe draft eligibility gate

A draft may be returned only if ALL applicable checks pass:

1. The candidate is produced by a deterministic, explicitly supported prose cleanup rule.
2. It does not remove unique instructions, code, links, JSON keys, IDs, Markdown fences, or task constraints.
3. Its changes are explainable through a textual diff and change list.
4. Both original and candidate are counted using the **same** encoding.
5. Original is preserved and unchanged; candidate is optional.
6. Candidate's count is lower than original, or there is a specifically explained non-saving cleanup (do not advertise a reduction otherwise).
7. The user is asked to inspect the diff; the UI copy button is disabled until review.

If any gate fails: return **findings only**. Missing draft is a normal outcome, **not an error**. The optional task description can help prioritize suggestions but is not authoritative evidence that an otherwise unique passage is removable.

### Conservative formatting policy

Never turn text shortening into code minification, regex-based Markdown destruction, arbitrary JSON field removal, or deletion of paragraph content just because it appears irrelevant. Prefer useful findings to aggressive automatic edits.

---

## 11. Type, validation and response-design strategy

Create a **single domain-level** result type used by both HTTP and MCP adapters; adapters may present it differently but must not calculate separate token values. The following is a **conceptual type illustration**; Documents 06–07 will finalize runtime schemas and limits.

```ts
type AnalysisResult = {
  input: { kind: 'paste' | 'file' | 'mcp'; format: string };
  count: { tokens: number; encoding: string; accuracy: 'encoding-count' | 'estimate' };
  findings: Array<{
    code: string;
    severity: 'info' | 'warning';
    message: string;
    evidence?: { lineStart?: number; lineEnd?: number };
    recommendation: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  draft?: {
    text: string;
    tokenCount: number;
    changes: Array<{ reason: string; before: string; after: string }>;
    requiresReview: true;
  };
};
```

Do not return raw file text in log messages or request identifiers. The client already has its original content; whether results return normalized text or a hash is an API design question for Document 06. Avoid including fabricated `percent_saved` when no draft exists. If a draft is present, compute `((original - draft) / original) * 100` only when the denominator is valid, and round only at display time.

Use Zod at every externally reachable boundary. Explicitly reject invalid JSON, unexpected shapes, oversized strings, unsupported formats, and unsafe tool invocation parameters. Set appropriate response content types and non-caching headers for sensitive results; the final security policy belongs to Document 09.

---

## 12. Frontend specification implications

The UI is delivered as static assets, and `app.js` calls `POST /api/analyze` on the same origin. No client router, client state library, build-time hydration or external design system.

- Use approved brand CSS variables, including authoritative sampled navy/lime, and system fonts.
- Keep a single, clearly identified textarea as primary input.
- File picker supports only the seven extensions and displays selected filename/byte size, not an uploaded-file history.
- Task context uses an initially collapsed `<details>` pattern.
- All result text goes through safe DOM APIs such as `textContent`; never inject user data as `innerHTML`.
- Results are stacked: token summary, findings/recommendations, and only then optional draft review.
- The button **Copy reviewed draft** must remain unavailable until the diff is visibly opened and explicitly acknowledged as reviewed; hide it if no valid draft exists.
- Do not claim that checking a diff proves semantic equivalence. Include non-destructive warnings.
- Provide accessible labels, live status for async analyses, keyboard focus/contrast, error state and retry handling.
- No analytics package that records pasted prompts, filenames or task descriptions.

**No separate frontend tokenizer**. The Worker is the source of truth for both website and MCP counts; this may add a network round-trip but prevents divergent measures in a minimal architecture.

---

## 13. Privacy, logging and security boundaries

The product promise is **no application persistence**, not “your data never touches servers.” The Worker necessarily receives user-submitted text for processing. The Cloudflare platform, network layer, error tooling and client may have independent operational logs or controls.

### Beta must-have requirements

1. Restrict public access during protected beta with a documented mechanism, without falsely calling the server public/anonymous.
2. Decide separately how browsers and MCP clients authenticate; a static website cannot safely contain a permanent shared secret.
3. Validate HTTP method, content type, input type and length before expensive tokenization.
4. Apply rate limiting or equivalent abuse protection; avoid unlimited CPU-intensive anonymous use.
5. Avoid printing prompt, task context, file content, complete request bodies or secrets to logs.
6. Apply origin/host checks appropriate to remote MCP; do **not** treat CORS as authentication.
7. Use same-origin API requests from the website when possible.
8. Set sensible security headers and disable caching for analysis responses where appropriate.
9. Do not store analyzed inputs in Cloudflare KV, D1, R2, browser localStorage or analytics by default.
10. Document how to report vulnerabilities and how to revoke beta access.

**Critical unresolved trade-off:** A globally shareable MCP endpoint needs a deliberate authorization and client-compatibility design. The chosen protected beta must be tested with specific MCP clients before promising frictionless installation. No OAuth account system is required *for the initial private test*, but broad ChatGPT/public directory availability may require OAuth and publisher review. This is a deployment / distribution decision, not something a package install can guarantee.

---

## 14. Testing and CI baseline

### Required for Document 05 acceptance

- `npm ci` succeeds from an empty checkout.
- `npm run typecheck` passes in strict mode.
- `npm test` runs deterministic rule, tokenizer and draft eligibility fixtures.
- `npm run dev` serves the single page and routes `/api/analyze` and `/mcp` correctly.
- MCP Inspector can initialize, list tools, invoke at least one analysis tool, and receive a schema-conformant response.
- File tests cover all seven formats, unsupported binary files, invalid UTF-8 and oversized input.
- Rules do **not** propose rewritten code, JSON, or log content.
- Diff/copy tests verify no copy without opening/confirming a valid draft review.
- No result includes fabricated token savings when no candidate exists.
- Production deploy canary stays within chosen Worker resource limits.
- Privacy smoke test finds no request-body content in application logs.

### CI scripts, minimal

```bash
npm ci
npm run typecheck
npm test
```

A staging deployment and HTTP/MCP end-to-end smoke checks should be added before a public beta. Browser automation (Playwright) is an optional later addition, not an approved v1 runtime dependency; targeted manual accessibility checks are required even if tests pass.

### Release traceability

Commit `package-lock.json`; release through reviewed pull requests. Record the tested Node LTS version, Wrangler version, SDK version, tokenizer version and Worker compatibility date in the release notes or CI job output. The exact dependency versions will be locked at bootstrap rather than invented in this specification.

---

## 15. Performance and operational budget

The application should remain usable without a database or queue; PARE has an intentional **bounded request** model. The cost of counting and diffing scales with content size; poorly designed quadratic duplicate scans can exceed Worker CPU limits. Use linear or near-linear passes when possible, benchmark worst-case repeated text, and bound work before tokenization.

**Targets to define after measurement, not invented as guarantees:**

- Maximum request and normalized text bytes.
- Maximum candidate lines/blocks and duplicate-comparison work.
- Maximum analysis execution time in local Worker and on a canary.
- Maximum Worker bundle size (including tokenizer encoding data).
- Rate limit and concurrency policy for beta clients.
- Reasonable recovery behavior for failed or timed-out requests.

Default to a clear input-too-large error with a suggestion to analyze smaller sections rather than processing or truncating a prompt silently. No storage or deferred processing is needed for v1.

---

## 16. Compatibility and publishing reality

PARE's remote MCP endpoint can be published as metadata in an MCP registry and configured manually in supported clients. **GitHub MCP Registry listing is not automatically installation or approval in ChatGPT.** Public ChatGPT plugin distribution has separate identity, review, auth and compatibility requirements that must be checked at submission time. No endpoint or npm package is reserved just by creating this document.

Public source code and hosted API are separate concerns. An npm package is not a prerequisite for a hosted-only user experience **unless a particular registry schema or installer requires a supported distribution type**; Document 11 must check the actual current publication rules. Do not publish an empty npm package only for brand visibility.

Recommended distribution order: private beta → hosted demo and documentation → MCP interoperability smoke tests → public GitHub repository → registry submission → optional ChatGPT plugin submission after acceptance criteria and access policy are met.

---

## 17. Dependency decision record (ADR-lite)

| ID | Decision | Rationale | Consequence |
|---|---|---|---|
| TS-01 | npm | Widely available; no monorepo needed | Commit lockfile |
| TS-02 | TypeScript on Worker | Strong schemas and single runtime | Local Node required only for toolchain |
| TS-03 | Pure static frontend | Lightweight, fast, accessible | Manual DOM/event-state handling |
| TS-04 | MCP SDK v2 only | Official current protocol handling | Must follow newer v2 APIs, not old tutorials |
| TS-05 | No HTTP framework | Web-standard SDK already handles MCP | Explicit route and error design |
| TS-06 | Zod | Validate remote inputs and outputs | Small runtime dependency |
| TS-07 | One tokenizer | Small and honest MVP | Other providers marked estimated |
| TS-08 | `js-tiktoken` candidate | Pure JS edge-oriented package | Worker size and memory gate required |
| TS-09 | No application DB | No saved history or accounts | Every request self-contained |
| TS-10 | Vitest | Deterministic fast tests | Add client integration tests later |
| TS-11 | Limited beta | Protect service while validating integrations | Need access/authorization strategy |

---

## 18. Engineering implementation order

1. Initialize npm/TypeScript/Worker and static asset delivery; confirm a simple `/api/health` endpoint *only in development* if needed.
2. Create the typed analysis request/result and Zod validations.
3. Integrate the single candidate tokenizer; verify Worker runtime and bundle budget.
4. Implement deterministic detection rules and robust negative cases.
5. Implement strictly gated prose-cleanup drafts and diff generation.
6. Connect `/api/analyze`; render website results with plain DOM APIs.
7. Implement official SDK v2 MCP server factory and route `/mcp`; verify with MCP Inspector.
8. Implement beta access, abuse controls and non-logging policies before internet exposure.
9. Run end-to-end canary tests, accessibility QA and release checklist.
10. Publish documentation, GitHub source and registry metadata only once stable.

---

## 19. Decisions to make **before Document 06 — System Architecture**

These questions affect architecture. They are not silently approved by this document.

| ID | Question | Recommended lightweight option | Why it matters |
|---|---|---|---|
| A01 | **Beta access model** | Private staging first; restrict `/mcp` to approved testers; avoid putting secrets in public browser JS | Security vs cross-client setup |
| A02 | **Website access** | Public informational website, **protected analyzer API** during beta | Lets users discover product without opening unlimited compute |
| A03 | **Request limits** | Choose measured input-byte and timeout thresholds from Worker canary profiling; enforce before tokenization | CPU, memory and abuse |
| A04 | **MCP tool count and names** | Start with one `analyze_context` and add up to two only when distinct; finalize in Doc 07 | Simpler tool discovery vs clear actions |
| A05 | **File transfer normalization** | Browser decodes seven text/code extensions into UTF-8 text; server validates text; MCP takes explicit text inputs | No multipart/file storage |
| A06 | **Error contract** | Stable error codes, safe messages, no input echo | UI and client interoperability |
| A07 | **MCP auth maturity** | Test private beta auth against actual target clients; decide OAuth before public directory submission | Custom MCP clients differ in support |
| A08 | **Domain / route policy** | One Worker + one domain, `/api/analyze` and `/mcp`, static at `/` | Simpler deployment and same-origin UI |
| A09 | **Observability** | Minimal request IDs, failure category, elapsed time only; no prompt content | Privacy while debugging |
| A10 | **SDK compatibility strategy** | Serve SDK v2 with its documented default backward compatibility unless tests show a reason to restrict | Avoid unnecessary client breakage |
| A11 | **Tokenizer exact encoding** | Trial `o200k_base`, accept only after Worker bundle/runtime tests; clarify which model label UI displays | Accuracy, size and transparency |
| A12 | **Threat/abuse control** | Platform rate limit or Cloudflare rule; validate availability on the selected plan | Anonymous expense and denial of service |

### Recommended questions to ask the owner before drafting Document 06

1. **Should the website remain publicly visible during beta while its analyzer/API requires limited access, or should the entire product be private?** Recommended: website public, analyzer/API restricted.
2. **How should beta testers connect to MCP?** Recommended: start with a small invite-only group and test compatible authentication; avoid a long-lived shared API key on the public website.
3. **Do you prefer starting with one MCP tool (`analyze_context`) or three separate tools?** Recommended: one first, with the website supporting all corresponding result sections.
4. **Should we fix a conservative initial input-size cap based on a canary benchmark before writing architecture, or leave the numeric cap configurable until load tests?** Recommended: configurable, with numeric caps locked after tests.

---

## 20. Acceptance and change control

Document 05 is accepted when:

- [ ] The stack remains limited to approved choices: HTML/CSS/JS, TS, Cloudflare Worker, MCP SDK, Zod, npm, Vitest, and one tested tokenizer.
- [ ] All seven extension types are explicitly supported as **text**, not arbitrary executable file ingestion.
- [ ] No database, React/Next, web framework or paid model dependency is added.
- [ ] Sources verify that MCP SDK v2 and Worker web-standard interfaces are compatible in principle, **without** claiming this PARE repository was deployed/tested yet.
- [ ] All token counts and comparative claims are accurately qualified.
- [ ] The review-before-copy rule is preserved in browser UI and domain result flow.
- [ ] Protected beta is a launch constraint; final authentication and limits are visibly unresolved.
- [ ] The next document's decisions are explicitly listed and not implied to be approved.

**Change procedure:** Any new dependency or feature not approved here requires a written rationale, impact on bundle size/security/maintenance, affected-doc reference, and user approval before modification. This document is the technology baseline for Document 06, not an excuse to expand scope.

---

## Appendix A. External source links and verification notes

- Official MCP TypeScript SDK v2: https://ts.sdk.modelcontextprotocol.io/v2/
- MCP SDK packages: https://ts.sdk.modelcontextprotocol.io/v2/get-started/packages
- Official MCP web-standard runtime guide: https://ts.sdk.modelcontextprotocol.io/v2/serving/web-standard
- `createMcpHandler` API: https://ts.sdk.modelcontextprotocol.io/v2/api/%40modelcontextprotocol/server/server/createMcpHandler.html
- MCP authorization: https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization
- Cloudflare Workers static assets: https://developers.cloudflare.com/workers/static-assets/
- Worker assets binding: https://developers.cloudflare.com/workers/static-assets/binding/
- Workers platform limits: https://developers.cloudflare.com/workers/platform/limits/
- `js-tiktoken` npm: https://www.npmjs.com/package/js-tiktoken
- `js-tiktoken` source: https://github.com/bracesproul/js-tiktoken

**Verification scope:** Official documentation confirms the architectural compatibility of Workers and MCP SDK v2. This is **not** a claim that the exact PARE dependency lockfile, bundle, tokenizer, tests or production endpoint already exists; those require implementation-stage testing. Package versions, public registry acceptance and domain/name availability may change.
