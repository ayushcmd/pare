# PARE — System Architecture

**Document:** `06-system-architecture.md`  
**Version:** 1.0 — architecture specification for protected beta  
**Prepared:** 18 November 2026  
**Status:** Proposed implementation contract, subject to explicitly marked open decisions  
**Depends on:** `01-product-overview.md`, `02-problems-and-solutions.md`, `03-brand-guidelines.md`, `04-ui-ux-design.md`, `05-tech-stack.md`  
**Next:** `07-mcp-tools.md`

> **Architecture in one sentence:** PARE uses **one stateless Cloudflare Worker** to host a **public static HTML/CSS/JavaScript website**, a **protected website analysis API**, and an **invite-only remote MCP endpoint**; all analysis flows through **one deterministic, privacy-conscious TypeScript core** with no database, user account system, or AI provider API.

> **Implementation update (23 November 2026):** The browser imports and runs the same core locally by default. The Worker remains the remote JSON/MCP adapter and static host. MCP has two tools (`analyze_context`, `compare_content`), with recommendations included in analysis. See [`00-implementation-baseline.md`](./00-implementation-baseline.md).

---

## 1. Authority, scope, and approved decisions

This document **extends but does not supersede** Documents 01–05. Where an earlier document contains a conceptual example, this document defines the v1 architecture and identifies the remaining tool-specific fields for Document 07. No implementation claim is made: this is a design specification, not a deployed or benchmarked service.

### 1.1 Approved architecture decisions

| Topic | Owner-approved decision | Consequence |
|---|---|---|
| Product | PARE, "Keep what matters. Cut the rest." | Preserve Documents 01–03 branding and honest claims |
| Audience | Developers and general AI users; developers first | Provide website and MCP interfaces |
| Website | One page, dark-first, paste-first, file upload secondary | No framework or client-side router |
| Visuals | Original uploaded logo; navy `#021020`, lime `#BDFB64`; system fonts | Serve approved asset; no third-party font calls |
| Results | Stacked cards | Summary, recommendations, optional draft review |
| Task awareness | Optional task description, initially collapsed | Rules may prioritize hints, not infer hidden semantics |
| Cleanup | Conservative proposed edits; user must inspect diff before copying | Never silently alter source or call downstream AI |
| Comparisons | Only show before/after when a valid cleaned draft exists | Never claim hypothetical savings as measured |
| Files | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log` | Browser reads text; no server-side file store |
| Tokenizer | Single tested encoding; `js-tiktoken`/`o200k_base` candidate | Confirm Worker compatibility; report precision honestly |
| Runtime | TypeScript, Cloudflare Workers, Wrangler, npm | No Node HTTP server, Express, Hono or Docker |
| MCP | Official TypeScript SDK v2; Streamable HTTP | Official SDK handles MCP protocol parsing |
| Validation/tests | Zod and Vitest | Schemas and repeatable fixtures |
| Storage | No DB, R2, KV, D1, queue or saved history | Bounded, per-request processing |
| Website beta | Public informational site, **protected analyzer API** | Avoid public unbounded CPU processing |
| MCP beta | **Invite-only testers** | Authentication gate before tool execution |
| Tools | **Three** focused tools | `analyze_context`, `suggest_optimizations`, `compare_tokens` — provisional contracts |
| Limits | **Configurable**, values established after profiling | Enforce on every entry point and do not guess safe caps |

### 1.2 Explicit non-goals

No automatic surveillance of AI chat activity; browser extension; transparent LLM proxy; real-time interception of host prompts; LLM rewriting; semantic retrieval or embeddings; PDF/DOCX/image ingestion; database/accounts; analytics dashboard; OAuth authorization-server implementation; continuous job handling; automatic edits to source code, JSON, logs or MCP schemas; model-by-model exact billing estimates.

A future product may add some of these only through a separately approved design change.

---

## 2. Architecture at a glance

```text
                         PUBLIC INTERNET
                  ┌───────────────────────────┐
                  │ Browser: one-page site    │
                  │ public GET /, css/js/logo │
                  └────────────┬──────────────┘
                               │ same-origin POST /api/analyze
                               ▼
         ┌────────────────────────────────────────────────┐
         │ ONE CLOUDFLARE WORKER DEPLOYMENT               │
         │                                                │
         │  router.ts / fetch(request, env)               │
         │    ├─ GET static  ──► Workers Static Assets    │
         │    ├─ /api/analyze ─► website beta gate        │
         │    └─ /mcp ────────► invite-only beta gate     │
         │                             │                  │
         │                        official MCP SDK        │
         │                        3 tool adapters         │
         │                             │                  │
         │                  ┌──────────┴──────────┐       │
         │                  │ SHARED CORE         │       │
         │                  │ input validation    │       │
         │                  │ tokenize            │       │
         │                  │ detect findings     │       │
         │                  │ propose safe draft  │       │
         │                  │ compare & diff      │       │
         │                  └─────────────────────┘       │
         │  no persistent prompt/content database          │
         └────────────────────────────────────────────────┘
                               ▲
                     HTTPS MCP /mcp
                               │
                ┌──────────────┴───────────────┐
                │ authorized MCP clients       │
                │ Inspector / tested clients   │
                └──────────────────────────────┘
```

**Trust zones:** (1) browser/client is untrusted, (2) Cloudflare edge and Worker are the bounded execution boundary, (3) the server-side analysis core must not trust client-provided claims about file type, model, tokens or identity. The user's own AI client can independently retain content; PARE cannot control that.

---

## 3. Request entry points and routes

### 3.1 Routing table

| Route | Methods | Access | Handler | Caching |
|---|---|---|---|---|
| `/` | GET, HEAD | Public | Cloudflare static `index.html` | Asset policy only |
| `/style.css`, `/app.js`, approved images | GET, HEAD | Public | Static Assets | Appropriate static cache headers |
| `/api/analyze` | POST, optional OPTIONS when justified | **Protected beta** | Request validator → shared analyzer | `Cache-Control: no-store` |
| `/mcp` | SDK-supported HTTP methods | **Invite-only beta** | Authorization → official MCP handler | `Cache-Control: no-store` |
| `/api/*` unknown | Any | N/A | Controlled JSON 404 | `no-store` |
| Other unknown paths | Any | Public | Static 404, **not** accidental SPA fallback | Asset policy |

`GET /api/health` is an optional **development-only** route; do not expose unrestricted infrastructure diagnostics publicly by default. Tool-specific method handling, `Accept` headers, MCP protocol negotiation and stream behavior must be delegated to the SDK, not recreated in the router. HTTP `HEAD` for static files is controlled by the asset handler.

### 3.2 Ensure API and MCP are Worker-first

Cloudflare Static Assets may be served without executing Worker code. The API and MCP routes **must never** be mistaken for static assets. Use explicit route handling and test Cloudflare's `assets.run_worker_first` option for `/api/*` and `/mcp` (including methods and any exact path patterns used). The following configuration is **illustrative, not yet runtime-verified**:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "pare-mcp",
  "main": "src/index.ts",
  "compatibility_date": "2026-11-18",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/mcp", "/mcp/*"]
  }
}
```

Validate this syntax with the installed Wrangler and exercise `wrangler dev` **and** staging before treating it as accepted. If needed, use `run_worker_first: true` to prioritize correctness at the cost of running Worker code on static requests; do not assume either mode without a routing test. Avoid exposing `src/`, `.dev.vars`, `.env`, source maps with secrets, or internal documentation in `public/`.

### 3.3 Transport and statelessness

The hosted endpoint uses HTTP over HTTPS via the SDK v2 `createMcpHandler` with a fresh `McpServer` instance per request. Use the documented stateless behavior and default legacy handling unless tests establish a reason to narrow it. Do not store MCP sessions in a database or Durable Object. If a given client requires a connection/session mode inconsistent with PARE's supported HTTP stack, publish that limitation rather than adding infrastructure without approval. No hand-written JSON-RPC parser.

---

## 4. Shared-core composition and separation of concerns

```text
src/
  index.ts                # Worker fetch routing; environmental bindings
  api.ts                  # Browser JSON adapter, error mapping
  mcp.ts                  # Official MCP handler; registers 3 tools
  auth.ts                 # Beta admission checks; no accounts
  config.ts               # Validated non-secret limits and flags
  core/
    types.ts              # Domain-level request/result contracts
    validate.ts           # Bounded text/format/task validation
    tokenizer.ts          # One tested encoding wrapper
    analyzer.ts           # Deterministic findings (P1–P5)
    recommendations.ts    # Explanations and priorities
    draft.ts              # Very limited safe candidate generation
    compare.ts            # Draft gate, counts, diff
    errors.ts             # Domain errors and safe serialization
public/
  index.html
  style.css
  app.js
  assets/pare-logo.*
tests/
  core/                   # Deterministic unit fixtures
  api/                    # HTTP route and protection tests
  mcp/                    # Contract/discovery tests
wrangler.jsonc
package.json
package-lock.json
```

The file layout is **recommended**, not mandatory. A small number of extra focused `.ts` modules is acceptable; no monorepo, framework, DI container or generated microservices. The browser does not reimplement tokenization or recommendation rules. `core/*` must not import Cloudflare request handlers, browser DOM APIs, or MCP SDK response types.

### 4.1 Shared core API (conceptual)

```ts
export type SourceFormat =
  | 'text' | 'markdown' | 'json' | 'javascript'
  | 'typescript' | 'python' | 'log' | 'mcp-schema';

export type CoreInput = {
  text: string;
  format: SourceFormat;
  taskDescription?: string;
};

export type CoreResult = {
  count: {
    tokens: number;
    encoding: string;
    accuracy: 'encoding-count' | 'estimate';
  };
  findings: Array<{
    code: string;
    severity: 'info' | 'warning';
    message: string;
    recommendation: string;
    risk: 'low' | 'medium' | 'high';
    evidence?: { lineStart?: number; lineEnd?: number };
  }>;
  draft?: {
    text: string;
    tokenCount: number;
    changes: Array<{ reason: string; before: string; after: string }>;
    requiresReview: true;
  };
};
```

This extends the conceptual Document 05 shape. It is **not** the frozen public HTTP/MCP schema. Document 07 must finalize stable field names, JSON-schema representations, MCP content/structuredContent, errors, size constraints and versioning. Domain logic must use a single result model so web and MCP counts cannot drift.

---

## 5. Website request lifecycle

1. Browser requests `/`: Cloudflare serves the public static website, stylesheet, approved logo and JavaScript. No account, framework or externally hosted fonts.
2. User pastes text into the primary textarea **or** chooses one of seven text/code extensions. The browser decodes file contents locally as UTF-8 and keeps the selected filename only in local UI state. No multipart upload is required in v1.
3. Optional task description stays collapsed until the user opens it; lack of a description is not an error.
4. Client-side precheck catches empty input and informs users of size limits. These checks are convenience only, **never** the security boundary.
5. User submits a same-origin `POST /api/analyze` with JSON containing normalized text, declared format and optional task description. During beta, the API is protected; the browser must not bundle a shared API secret in `app.js`.
6. Worker admits request through beta access control and abuse checks. Reject unauthorized/malformed/over-limit requests **before** expensive analysis.
7. Worker validates the fields, counts with the supported encoding, runs deterministic analysis, optionally proposes only an eligible low-risk prose draft, counts the candidate and returns bounded results.
8. Browser displays original count and findings in stacked cards. If and **only if** `draft` exists and passes validation, show draft/diff and before/after counts; the copy action remains disabled until the user opens/reviews the diff.
9. Browser renders untrusted text only with safe DOM sinks (`textContent`, not `innerHTML`). User can choose to copy a reviewed candidate; the original textarea/file is never overwritten.
10. Analysis data is not intentionally persisted by PARE. Client/browser histories and intermediary infrastructure may have separate logging/retention behavior.

### 5.1 Critical beta-access design note

A **public website with a protected API** means unauthenticated visitors can browse the product but **may not run a full hosted analysis**. Do not accidentally advertise an unrestricted live analyzer while the API is gated. The interface must either:

- show a transparent "Analyzer available to beta testers" state with an access workflow **outside** the public site; or
- include a small demonstrative sample analyzed in-browser with clearly labeled canned/sample results (not a real backend call).

**Proposed initial implementation:** public product page + analyzer controls visible, but protected submissions show a clear beta-access notice to unauthorized visitors. No client-bundled access token; no signup or account system. This choice needs final UI acknowledgment before deployment and is cross-referenced in the Document 07 questions.

---

## 6. MCP request lifecycle

1. Authorized tester configures a supported client with `https://<verified-host>/mcp` and the selected compatible beta authentication method. **The URL is illustrative and does not exist yet.**
2. Client sends MCP over HTTPS. Gateway checks path, origin/host as appropriate, authentication, method and body bound before routing to SDK.
3. SDK creates a fresh MCP server for the request and handles initialization/version negotiation, listing, and tool invocation. The server registers three tools:
   - `analyze_context`: inspect supplied content and return counts/findings and possibly a conservative draft;
   - `suggest_optimizations`: return actionable recommendations for explicitly supplied content; no automatic transformation is promised;
   - `compare_tokens`: compare *explicitly supplied original and candidate* using the same encoding and report measured differences; no candidate is silently generated unless the schema explicitly supports it.
4. The adapter validates arguments (Zod), maps input to `CoreInput` and uses the same core functions as `/api/analyze`.
5. It returns bounded tool output, safe messages and structured data where supported. It never implicitly accesses other conversation messages, private repository contents, local paths, a prompt cache or other MCP servers.
6. The client is responsible for displaying or invoking results. PARE cannot force an MCP host to show a diff review UI; **a draft returned through MCP must remain marked `requiresReview: true`, and PARE must never self-apply it**.

**Document 07 must decide:** exactly whether `analyze_context` generates safe draft proposals by default or behind an explicit opt-in parameter; how distinct `suggest_optimizations` is from `analyze_context`; whether `compare_tokens` accepts only provided original/candidate pairs; which formats are allowed through MCP; and maximum output lengths. Three tools are approved, but their schema details are not.

### 6.1 Web/MCP parity invariants

For identical text, format, options and selected encoding, the core produces the same count and same deterministic findings regardless of channel. The HTTP/MCP wrappers may differ in serialization, response envelope and transport-specific errors. Task context changes ranking or explanation only; it does not justify deleting otherwise unique material. MCP clients do **not** automatically send whole chats or attached files to PARE.

---

## 7. Validation and configurable resource budgets

No numeric maximum was approved. Define the following configuration keys, validate them during startup, and lock values only after performance and adversarial tests on the real Worker runtime:

| Key (proposed) | Applies to | Test-based selection criteria |
|---|---|---|
| `MAX_BODY_BYTES` | All user-submitted HTTP/MCP payloads | Stop malformed/huge requests before parsing |
| `MAX_TEXT_BYTES` | Main content string | Bound tokenizer cost and memory |
| `MAX_TASK_BYTES` | Optional task description | Prevent hidden overflow |
| `MAX_RESPONSE_BYTES` | Website/MCP serialized result | Prevent enormous result echoes |
| `MAX_FINDINGS` | Findings list | Avoid unbounded output |
| `MAX_DIFF_CHARS` | Diff and change previews | Prevent draft/diff memory explosions |
| `ANALYSIS_BUDGET_MS` | Core analysis soft budget | Fail fast before platform deadline where possible |
| `RATE_LIMIT_POLICY` | `/api/analyze`, `/mcp` | Test abuse cases and legitimate client bursts |

The **combined size** of text, optional task, and tool metadata matters; don't enforce only the client-reported file length. Use UTF-8 byte counts (`TextEncoder`) as appropriate, not only `string.length` (UTF-16 code units). Check `Content-Length` when available but do not rely on it; after reading use byte-aware validation. Workers may still buffer some request body data before app code runs, so provider-layer restrictions remain useful.

**Budget policy:** fail closed if configuration is missing/invalid for a protected deployment; choose a cautious hard-coded safe fallback only if formally approved after benchmark. Count and diff in linear or near-linear algorithms where possible. Avoid unbounded recursion, full text echo in findings, quadratic duplicate comparisons or uncontrolled regex work. The selected tokenizer package and encoding must pass Workers deployment, size and CPU canary tests before adoption.

---

## 8. Authentication and authorization: invite-only without user accounts

### 8.1 Required behaviors

- Public asset GET routes do not require login.
- `/api/analyze` denies unauthorized anonymous access during beta; no hidden shared API secret in browser JavaScript or HTML.
- `/mcp` denies unauthorized access **before** invoking MCP tool logic.
- Tokens and secrets live in Cloudflare secret bindings or Cloudflare-managed edge controls, **never** in GitHub, static assets, URLs, logs or localStorage by default.
- Enforce HTTPS; avoid accepting credential-bearing cross-origin browser calls without explicit policy. Don't mistake CORS for authentication.
- Test authentication and tool calls in at least one concrete target MCP client and MCP Inspector before publishing setup instructions.

### 8.2 Candidate beta admission paths (NOT yet selected)

**Path A — Cloudflare Access:** put protected endpoint behind Cloudflare Access with invite-only identities, using compatible browser sessions or service tokens where appropriate. Benefits: managed identity and revocation; caveat: some MCP clients may not support the Access login flow or required token headers. This may require deliberate route/app configuration so public static assets remain public.

**Path B — Per-tester bearer credential verified by Worker:** each invitee gets a credential provisioned out of band and stored server-side as hashed/verifiable reference where feasible. **No database** means credential management and revocation become limited; a small explicitly configured allowlist/secret rotation can be acceptable for a tiny private test but is not a scalable public-auth design. No shared evergreen key and no putting any credential into public `app.js`. Decide safe key provisioning, rotation and constant-time checking before implementation; avoid improvising a homegrown identity platform.

**Architecture recommendation:** run a **Cloudflare Access compatibility spike first**, then select a tested, supportable mechanism with no user account database. The beta audience and privacy promise take priority over effortless integration in every MCP client. OAuth/user registration is deferred to a separately approved distribution phase; do not claim universal ChatGPT installation based solely on a working HTTPS endpoint.

### 8.3 Abuse controls

Use provider-supported rate limiting/WAF or an available Worker rate-limiting binding compatible with the selected plan, plus body caps and bounded compute. Confirm actual plan limits and best identity key (e.g., client IP or authenticated tester) during tests. IP-based limits alone are imperfect due to shared networks. Avoid logging client prompts or storing raw inputs for bot detection.

---

## 9. Data and privacy boundaries

| Data | Origin | PARE v1 action | Persistence |
|---|---|---|---|
| Pasted text | Browser or MCP client | Validate, count, analyze, optionally propose reviewed draft | None intentionally |
| Uploaded file | Local browser | Local UTF-8 read; send only text and declared format | No file stored by PARE |
| Optional task | Browser or client | Influence finding priority only | None intentionally |
| MCP tool schema | Client-supplied text/JSON | Analyze only the supplied metadata | None intentionally |
| Original/candidate pair | Client | Compare counts using same encoding | None intentionally |
| Beta credentials | Auth system | Validate access | Auth configuration/secret store, **not prompt history** |
| Operational events | Cloudflare/app logs | Minimal status, duration, category and generated request ID | Platform-dependent retention, to verify in Doc 09 |

**Privacy statement:** "PARE does not intentionally store submitted content in an application database." This does **not** mean no processor ever sees data or no logs are retained anywhere. Be explicit that requests transit Cloudflare, and AI clients may handle/retain tool data independently. Avoid logging bodies, headers carrying secrets, raw diffs, file contents or task descriptions. Do not send inputs to third-party error telemetry or analytics in v1.

### 9.1 Content safety

- Treat all user/MCP content as data, not instructions to the server.
- Use allowlisted formats and reject binary/invalid UTF-8 uploads; do not parse PDFs or follow file paths/URLs.
- Never execute, import, run, fetch or compile supplied code; parse JSON only as data if implemented.
- Never treat `format: 'json'` as permission to rewrite keys or values.
- Escape and render user-supplied strings safely; no user content in HTML.
- Minimize response echoes: include bounded evidence excerpts only where essential; return candidate full text only when explicitly requested and within output caps.
- Ensure before/after counts appear only for a valid candidate, using the same tokenizer/encoding. A comparison of *two explicit supplied* texts is a measured pair, but the UI must distinguish that from PARE's own safe draft proposal.

---

## 10. Domain workflows and safe draft gate

### 10.1 Pipeline

```text
admit → validate → classify → tokenize original → detect structural issues
      → explain & prioritize → [optional eligible-prose draft]
      → verify draft & count candidate → build bounded diff → serialize
```

**Detection families:** oversized context, duplicate blocks, text/Markdown boilerplate, verbose logs/JSON/tool output, MCP tool schema description bloat. All are structural heuristics, not semantic guarantees. For non-prose code, structured JSON, Markdown tables/fences, quoted text, logs and supplied MCP schemas, return recommendations only when a safe transformation cannot be demonstrated.

### 10.2 Draft eligibility contract

Every proposed candidate MUST:

1. derive solely from a deterministic low-risk rule (e.g. exact repeated standalone prose block or redundant blank lines in safely classified prose);
2. preserve source unchanged; never mutate uploaded/local file;
3. avoid deleting unique instructions, code, JSON fields, links, IDs, fenced blocks or task constraints;
4. include bounded changes/diff and `requiresReview: true`;
5. be counted with the same encoding as original;
6. not advertise savings where no measured reduction exists;
7. remain optional; a failure to generate a draft is a normal outcome.

**Website review guard:** the UI may enable "Copy cleaned draft" only after the diff is explicitly opened and reviewed. A server-provided flag alone is not evidence that the user reviewed it; the current page session tracks review state. Do not auto-fill a future LLM request with the cleaned draft.

### 10.3 Task-aware hints

Optional task text may move a finding higher in the list or add "check whether these sections are needed for debugging" context. It cannot be used to assert that an unrelated section is safe to delete; a deterministic algorithm cannot prove that. When omitted, analyze structural issues normally.

---

## 11. Proposed HTTP request/response envelope

These examples are **architectural sketches** to align website and tool adapters; final stable schemas belong in Document 07.

### 11.1 Website request

```http
POST /api/analyze HTTP/1.1
Content-Type: application/json
Authorization: Bearer <beta-credential-if-selected>
```

```json
{
  "text": "Please review this prose ...",
  "format": "text",
  "taskDescription": "Optional: summarize the most important points"
}
```

**Caution:** the `Authorization` example is illustrative and is **not** a browser implementation recommendation. The website will not embed bearer credentials in public JavaScript. Its actual protected beta flow must be selected and tested under Section 8.

### 11.2 Website success response (illustrative)

```json
{
  "count": {
    "tokens": 42,
    "encoding": "o200k_base",
    "accuracy": "encoding-count"
  },
  "findings": [
    {
      "code": "EXACT_DUPLICATE_PROSE",
      "severity": "info",
      "message": "A standalone prose paragraph appears twice.",
      "recommendation": "Review the second copy and consider removing it.",
      "risk": "low"
    }
  ]
}
```

The token number is fictional, not a count calculated from the example body. Omit `draft` when no validated draft exists. A successful result may have an empty findings list, no draft and zero safe edits. `accuracy: encoding-count` means **counted with one named encoding**, not necessarily exact billing for every model.

### 11.3 Error envelope (illustrative)

```json
{
  "error": {
    "code": "INPUT_TOO_LARGE",
    "message": "The submitted text exceeds the configured beta limit.",
    "requestId": "example-generated-id"
  }
}
```

No raw content, stack trace or secrets in errors. Suggested categories: `INVALID_INPUT` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `METHOD_NOT_ALLOWED` (405), `UNSUPPORTED_MEDIA_TYPE` (415), `INPUT_TOO_LARGE` (413), `RATE_LIMITED` (429), `ANALYSIS_BUDGET_EXCEEDED` (bounded operation failure), `INTERNAL_ERROR` (500). Exact status mapping, `Retry-After`, and MCP error envelopes belong in Document 07/09. Return `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and an appropriate content type on sensitive data responses. Restrict CORS to the actual web origin or omit cross-origin browser access entirely for the same-origin website.

---

## 12. Operational and release architecture

### 12.1 Environments

- **Local:** Wrangler development Worker, static assets and mocked/invite test credentials; non-sensitive fixture content.
- **Staging:** Separate Cloudflare environment or Worker name and distinct secrets; verifies route handling, auth, SDK interoperability, tokenizer compatibility and resource limits.
- **Production beta:** One public informational site and two protected dynamic interfaces. Secrets unique to beta. Do not reuse local test credentials.

"Single Worker" means **one Worker per environment/deployment**, not that development and production must share credentials or route namespaces. The production app remains a single codebase and runtime service.

### 12.2 Minimal telemetry

Observe aggregate request counts, duration, response category, Worker exceptions and availability where Cloudflare controls permit, without storing text, body, token-bearing headers or full tool result payloads. Avoid logging raw URL query strings if they could include sensitive data. Use generated request IDs solely for debugging. Metrics and infrastructure retention require verification in Document 09. No user analytics product in v1.

### 12.3 Release and rollback

CI should run typecheck, Vitest, lint if adopted, and Worker build. Stage first; run synthetic contract and abuse-limit fixtures; then deploy beta. Keep a known-good prior deployment to roll back if routes, tool listing or authentication regress. Do not publish publicly accessible MCP instructions until actual client tests pass. See Document 11 for registries, release metadata and distribution eligibility.

---

## 13. Threat model overview (detailed treatment in Document 09)

| Threat | Likely failure | Minimum boundary |
|---|---|---|
| Anonymous compute abuse | Tokenize oversized requests repeatedly | Protected API/MCP, rate limits, bounded size/time |
| MCP secret exposure | Beta key copied from frontend or log | Cloudflare secrets/managed access; never static JS |
| Prompt/code leakage | Raw inputs in logs or analytics | No content logs; no persistence; safe errors |
| Crafted JSON/regex input | CPU or memory exhaustion | Zod, byte caps, near-linear algorithms, time budgets |
| Script injection | User content rendered as HTML | `textContent`, CSP reviewed in Doc 09 |
| Unsafe rewriting | User copies altered code/instructions | Prose-only gated draft; visible diff and review |
| Client incompatibility | Remote MCP cannot authenticate or connect | Real client smoke tests and clear support matrix |
| Incorrect savings claim | Unsupported model or no draft | Named encoding; measured comparison only |
| Unauthorized cross-origin call | Third party triggers protected analyzer | Authentication, origin policy, avoid broad CORS |
| Supply-chain issue | Compromised dependency/runtime | Lockfile, CI, dependency review, safe updates |

No high-confidence claim of "end-to-end zero retention" or "perfect context safety" should be made.

---

## 14. Performance and failure policy

- Prefer a single request/response without background workers or queued jobs; no cross-request state.
- Reject unsupported/invalid content **before** tokenization; use stream/body-size awareness where the runtime permits.
- Analysis should remain responsive for the **profiled configured input limit**, rather than promising an arbitrary millisecond SLA.
- When tokenizer load fails, return a clear service error; never silently substitute character counting as exact tokens.
- When no safe draft is possible, return valid counts/findings and no `draft`, not a fabricated optimization.
- If analyzer exceeds its soft budget, stop with a bounded error; never return half-validated savings as success.
- If the authentication dependency is unavailable, deny rather than fail open.
- If SDK transport/client is incompatible, return/document the proper protocol error rather than modifying the protocol implementation manually.
- Truncate or summarize findings safely within configured response caps; preserve evidence needed for review but do not echo large source bodies unnecessarily.

---

## 15. Testable architecture acceptance criteria

The following are **release gates** (not claims that tests have already passed):

### Routes and hosting

- [ ] Cloudflare staging serves public HTML, CSS, JS and approved logo over HTTPS.
- [ ] `/api/analyze` and `/mcp` reach Worker code regardless of similarly named static paths.
- [ ] Unknown `/api/*` routes return controlled JSON 404, not HTML or SPA fallback.
- [ ] No `src/`, secrets, private environment files or unapproved assets become publicly fetchable.

### Access

- [ ] Non-tester can view the public page but cannot execute `/api/analyze` or `/mcp` beta calls.
- [ ] Beta tester access works in the explicitly supported website flow and tested MCP client.
- [ ] Credentials cannot be obtained by inspecting `public/app.js` or HTML; refusal is fail-closed.
- [ ] Rate limiting, method checks, body-size limits and invalid input protections work in staging.

### Core and UI parity

- [ ] One deterministic test fixture yields the same token count/findings through both adapters.
- [ ] All seven approved extensions decode to eligible UTF-8 text; binary/unknown input fails safely.
- [ ] Optional task description may be omitted and does not enable unique-content deletion.
- [ ] Original input remains unchanged; code/JSON/logs get advice-only when edits are unsafe.
- [ ] No before/after reduction is shown when there is no validated draft.
- [ ] Website requires inspection of the draft diff before "Copy cleaned draft" is enabled.
- [ ] Token count labels explain encoding and approximation limits.

### MCP and runtime

- [ ] Exactly three tools appear in the supported MCP tool list with approved names.
- [ ] SDK handles transport/protocol; clients do not require an invented JSON-RPC variant.
- [ ] MCP Inspector and at least one target client can authenticate, list and call tools.
- [ ] Measured canary workload stays within selected Cloudflare plan CPU/memory/body/bundle constraints.
- [ ] Operational logs and errors contain no submitted text, raw diffs, authorization headers or token strings.

---

## 16. Proposed implementation sequence (smallest viable increments)

1. Create Worker + Static Assets routing; verify public page and secret-free build.
2. Implement `config.ts` typed bindings and bounded Zod validation.
3. Implement the deterministic tokenizer adapter; measure actual Worker compatibility/size.
4. Implement pure analysis and conservative draft/diff functions with fixtures.
5. Build one website API adapter calling shared core and render stacked UI states.
6. Add protected-beta admission and verify no secrets enter public assets.
7. Register exactly three MCP tools using the official SDK; confirm genuine role separation.
8. Test website/MCP parity, denial cases, body and performance limits.
9. Run client-compatibility spike and finalize beta access mechanism.
10. Document beta access, privacy limitations, deployment and registry plans; release only after gates pass.

Sequence can be adjusted for dependency testing, but must not require a database, SPA framework, extra AI provider, or extra runtime service.

---

## 17. Decisions for Document 07 — discuss before drafting

The following are **explicit open questions**, not defaults that this architecture quietly decides.

| ID | Required decision | Recommended lightweight option | Why it matters |
|---|---|---|---|
| M01 | Should `analyze_context` return a draft by default? | **Opt-in** e.g. `includeDraft: true`; always count/findings by default | Avoid accidental text echo and user confusion |
| M02 | What distinguishes `suggest_optimizations` from `analyze_context`? | Recommendations-only tool; omit `draft` and minimize output | Avoid duplicate expensive MCP surfaces |
| M03 | What should `compare_tokens` accept? | **Explicit `original` + `candidate`**, never infer original chat | Deterministic, meaningful measurements |
| M04 | What formats are allowed in remote tool arguments? | Explicit text + allowlisted declared format; no remote file path/URL fetching | Security and client portability |
| M05 | Should a tool response include full candidate text? | Only when explicitly requested, safely gated and within response cap | Privacy and result-token overhead |
| M06 | What is the output style? | Stable JSON-serializable structured result plus short human-readable text | Tool interoperability |
| M07 | How are errors returned? | Consistent safe error codes; distinguish tool execution errors from HTTP auth errors | Client UX and recovery |
| M08 | Which MCP clients are initially certified? | Inspector + one chosen supported client; others labeled untested | Honest integration docs |
| M09 | Which beta access method has actually passed a client spike? | Cloudflare Access **if compatible**; otherwise explicitly approved tiny-test alternative | Security vs client capability |
| M10 | Which numeric input/output/time caps passed staging benchmarks? | Configure and document measured caps after tests; no invented fixed number | Stable v1 contracts |

### Recommended conversation before Document 07

Please confirm these **four interface choices** first; the others can be profiled or tested later:

1. **Draft opt-in:** Should `analyze_context` generate a cleaned draft only when `includeDraft: true` (recommended), or whenever a safe cleanup exists?
2. **Tool separation:** Should `suggest_optimizations` return recommendations only, with no draft (recommended)?
3. **Comparison input:** Should `compare_tokens` require **both** original and candidate supplied by the caller (recommended)?
4. **MCP output:** Prefer short summary **plus structured JSON** (recommended), or structured JSON alone?

**Secondary implementation check:** select one client for the beta authentication spike (e.g., MCP Inspector + Cursor/Claude with supported remote MCP auth). Access mechanism remains pending actual compatibility testing.

---

## 18. Source-of-truth and traceability

| Prior document | Preserved requirements |
|---|---|
| Doc 01 | Two audiences, six problems, developer-first, no DB/AI provider, transparent privacy, GitHub/registry plan |
| Doc 02 | Deterministic structural analysis, optional task hints, no deletion of unique material, conservative proposed drafts, honest comparisons |
| Doc 03 | Approved exact logo reference; PARE/pare casing, navy/lime palette, dark-first, system fonts |
| Doc 04 | Single-page UX, paste-first, collapsed task `<details>`, stacked results, diff review before copy, comparison only with valid draft |
| Doc 05 | npm/TypeScript/Wrangler/Cloudflare Worker/MCP SDK v2/Zod/Vitest/one tokenizer; seven extensions; protected beta; no frontend framework/database |
| Owner decision for Doc 06 | Public website + protected API; invite-only MCP; 3 MCP tools; configurable limits |

### External technical sources checked for architecture

- [MCP TypeScript SDK v2 — Web-standard serving](https://ts.sdk.modelcontextprotocol.io/v2/serving/web-standard)
- [MCP TypeScript SDK v2 — 2026 protocol and stateless handler](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers — Worker-first asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Cloudflare Workers — secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers — runtime limits](https://developers.cloudflare.com/workers/platform/limits/)

**Verification scope:** These documents support feasibility and intended integration patterns. This specification does **not** assert that PARE is implemented, deployed, benchmarked, registered, publicly approved by ChatGPT, or compatible with all clients.

---

## 19. Document status and change control

**Resolved in this document:** one stateless Worker, public site/protected analyzer API, invite-only MCP, exactly three tool entry points, shared domain core, no database, seven file types, browser-side reading, safe draft review, configurable measured limits, privacy-first request handling.

**Still open:** precise schemas and response formatting (Doc 07); candidate tokenizer/runtime measurements and exact cap numbers (Docs 08/10); beta client authentication mechanism, security controls and retention audit (Doc 09); package namespace, domain, registry and ChatGPT eligibility (Doc 11).

Any future change requiring saved user content, automatic monitoring, semantic LLM rewriting, a database, public unauthenticated costly analysis, or additional runtime services requires explicit owner approval and an update to the earlier source-of-truth documents.
