# PARE — Security & Privacy Specification

**Document:** `09-security-and-privacy.md`  
**Version:** 1.0 — proposed protected-beta security specification  
**Prepared:** 18 November 2026  
**Status:** Implementation requirements and verification plan; **not evidence of deployed controls or a security audit**  
**Authority:** `01-product-overview.md` through `08-optimization-engine.md`  
**Next:** `10-testing.md`

> **Security principle:** PARE accepts potentially sensitive user-supplied text. In v1 it must process that text only for the explicitly requested operation, protect compute-intensive routes, avoid persisting prompt bodies, and never promise protection that the Cloudflare deployment, MCP host, or browser cannot actually guarantee.

> **Implementation update (23 November 2026):** Browser-local analysis is the default website privacy boundary and sends no content to PARE's Worker. Remote `/api/analyze` and `/mcp` still require the protections specified here before public deployment. MCP exposes two read-only tools. See [`00-implementation-baseline.md`](./00-implementation-baseline.md).

---

## 1. Approved decisions and hierarchy

| Subject | Approved decision | Engineering impact |
|---|---|---|
| Product | **PARE**, “Keep what matters. Cut the rest.” | No inflated security or token-saving claims |
| Interface | One public HTML/CSS/vanilla-JS website, dark first, paste first | `/` and approved static assets stay public |
| Branding | User-provided logo; navy `#021020`, lime `#BDFB64`, system fonts | Do not substitute placeholder icons or third-party hosted fonts |
| Runtime | Single TypeScript Cloudflare Worker; official MCP SDK v2, Zod, one tested tokenizer | No separate auth service, DB, queue, proxy, R2, or D1 in v1 |
| Browser beta | **Public landing page; analyzer API protected** | `/api/analyze` requires authorized tester identity |
| Remote MCP beta | **Invite-only Cloudflare Access**, conditional on confirmed client compatibility | `/mcp` requires verified authorization before SDK dispatch |
| Log policy | **Minimal operational metadata; never content bodies** | Disable or redact request/response capture; investigate platform-managed logging separately |
| Abuse controls | **Cloudflare-managed rate limiting**, where plan/hostname supports it | Explicit deploy verification; fail closed if unavailable without an approved alternative |
| Scope | Explicit input only; seven lightweight extensions | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`; no PDFs/binaries |
| MCP tools | Exactly three | `analyze_context`, `suggest_optimizations`, `compare_tokens` |
| Drafts | Only `includeDraft: true`; exact repeated standalone prose paragraphs | Draft is always review-required; never edit the user's originals |
| Task awareness | Optional deterministic keywords | Ranking only; no semantics-based deletion |
| Evidence | Original zero-based line references, `snippet: null` | No user text in finding summaries, logs, or errors |
| Comparisons | Explicit original and candidate; empty candidate allowed with strong warning | Honest before/after measurements; never claim a zero-length candidate is safe |
| Limits | Deployment-configurable, benchmark-driven | No invented universal payload or rate thresholds |

**Precedence:** This document defines security-policy choices, but it does not silently change tool schemas defined in Document 07 or deterministic cleanup rules defined in Document 08. Any necessary schema or route change is a documented cross-file change request. Earlier documents' discussion of anonymous public use is a long-term possibility, **not** the approved beta access policy.

## 2. Security objectives and non-goals

### 2.1 Required outcomes

1. Unauthorized browser or MCP callers cannot invoke analysis operations.
2. PARE does not intentionally write submitted prompts, source code, tasks, candidates, or generated drafts to persistent application storage.
3. Content never appears in PARE application logs, metrics, URLs, exception reports, trace attributes, analytics, or security-report payloads.
4. Processing is bounded by request/body/field/output/time and rate controls before resource-intensive work.
5. Server responses are safe for consumers to display, and the browser never interprets analyzed text as HTML or executable code.
6. The MCP authorization path works with the **specific beta clients** tested; incompatible clients are documented, not claimed supported.
7. Deployed behavior is proved with reproducible staging tests and screenshots/configuration evidence with secrets redacted.
8. A security incident can be contained by revoking Access identities, disabling routes, or rolling back a Worker deployment.

### 2.2 Explicit non-goals

No application-user database, sign-up, password reset, custom OAuth authorization server, browser extension, transparent prompt interception, web crawler, arbitrary remote file fetch, upload storage, model inference, sensitive-content classifier, third-party analytics SDK, content history, long-term per-user usage ledger, or security certification. Cloudflare Access maintains its own identity and access records; this is **not** an application database or a claim of zero metadata retention.

## 3. Trust boundaries and data-flow diagram

```text
PUBLIC INTERNET
  │
  ├── GET / + static assets ──────► Cloudflare static assets (PUBLIC)
  │
  ├── POST /api/analyze ────────┐
  │                             │  Cloudflare security/rate controls
  └── MCP methods /mcp ────────┤  + Access path-scoped admission
                                ▼
                SINGLE CLOUDFLARE WORKER
        ┌─────────────────────────────────────┐
        │  worker-first routes                │
        │  verify access and route identity   │
        │  origin/host + request/body guards  │
        │  schema/byte validation             │
        │                │                    │
        │  /api adapter  │  /mcp SDK adapter  │
        │                ▼                    │
        │  shared deterministic core          │
        │  tokenize, recommend, optional draft│
        │                │                    │
        │  bounded no-store response          │
        └─────────────────────────────────────┘
                                │
        NO app DB, no file store, no LLM calls
```

**Trust boundaries:** (A) untrusted browser/client and all fields; (B) Cloudflare edge and Access policies; (C) Worker code and its verified authorization boundary; (D) MCP host/AI client, which may retain submitted content outside PARE’s control; (E) Cloudflare-managed security and operational logs, which may be retained under platform/account configuration.

Never treat `Origin`, `Referer`, filename, file extension, user-declared model, token count, `contentType`, `CF-Connecting-IP`, or a self-supplied identity header as user authorization. Cloudflare-generated identity context must be validated, not blindly trusted if the route is reachable outside Access.

## 4. Threat model

**Assets:** confidential input text, access credentials, service availability, integrity of optimization results, trust in published security/retention statements.

| ID | Threat / attacker behavior | Entry point | Impact | Required defense | Test |
|---|---|---|---|---|---|
| T01 | Anonymous call to protected analyzer | `/api/analyze` | Unauthorized computation/data exposure | Access path gate + Worker verification | SEC-01 |
| T02 | Bypass Access via alternate host / `workers.dev` | All protected routes | Auth bypass | Disable unintended public aliases or protect all aliases; verify actual host | SEC-02 |
| T03 | Spoofed Access JWT or forged identity header | Protected routes | Tester impersonation | Validate issuer, audience, signature, expiry and approved identity | SEC-03 |
| T04 | Confused MCP OAuth vs cookie/session | `/mcp` | Broken login, token confusion | Managed OAuth client compatibility tests; no cookie assumed on MCP | SEC-04 |
| T05 | Reused token intended for another audience | `/mcp` | Credential cross-service misuse | Audience/resource binding verification | SEC-05 |
| T06 | Oversized/binary/malformed/unbounded input | Both APIs | CPU/memory exhaustion | Raw-size gate before parse; Zod and per-field limits | SEC-06 |
| T07 | Request floods or repeated expensive operations | Protected APIs | DoS/cost | Cloudflare WAF/Workers rate limits; per-route thresholds | SEC-07 |
| T08 | Input reflected into errors/logs | All | Confidentiality breach | Safe errors, no-body logging and redaction | SEC-08 |
| T09 | Prompt contents interpreted as instructions | Core and SDK | Unexpected actions | Deterministic data-only analysis; no model/tool execution | SEC-09 |
| T10 | Cross-site script injection via results | Web UI | Browser compromise | `textContent`, escaping, CSP, no unsafe HTML | SEC-10 |
| T11 | CSRF / unintended request submission | Browser API | Abuse with victim session | Same-origin checks, appropriate cookies/Access policy, JSON content type | SEC-11 |
| T12 | CORS mistakenly used as authentication | Both | Unauthorized access | Authorization independent of CORS; deny cross-origin by default | SEC-12 |
| T13 | Response caching of sensitive drafts | HTTP/CDN/browser | Content exposure | `Cache-Control: no-store`; disable custom caching | SEC-13 |
| T14 | Browser accidentally persists analyzed text | Frontend | Local secret leak | No localStorage/IndexedDB for content; no URL payloads | SEC-14 |
| T15 | Secrets exposed in repo/build/artifacts | CI/deploy | Credential compromise | Wrangler secrets, GitHub secret scanning, review | SEC-15 |
| T16 | Denial via tokenizer/regex pathological inputs | Core | Availability | Bounded algorithms and fuzz tests | SEC-16 |
| T17 | Truncated draft presented as valid | Core/API | Integrity loss | Output cap → omit draft entirely, never partial candidate | SEC-17 |
| T18 | Host treats proposals as automatically safe | MCP host | Meaning loss | `requiresReview: true`, cautionary text and explicit no-guarantee | SEC-18 |
| T19 | Public static assets accidentally protected or API bypasses Worker | Routing | Availability/auth bypass | Path-scoped Access + Worker-first routing tests | SEC-19 |
| T20 | Hidden Cloudflare/third-party content recording | Infrastructure | Retention/privacy failure | Audit account settings and verify disclosures | SEC-20 |

**Risk priority:** T01–T08, T10, T13, T15, T19, T20 are release-blocking for a public beta hostname. All rows are required before broad release. A test passing only locally is not proof that Access, WAF, or asset-routing rules work on the deployed hostname.

## 5. Protected beta authentication architecture

### 5.1 Proposed Cloudflare Access deployment

- Public informational pages and approved static assets remain accessible without login.
- Protect `/api/analyze` and `/mcp` (including any SDK-required method/path variants) through suitably scoped **Cloudflare Access applications/policies**, plus in-Worker identity verification.
- Allow only explicitly approved beta tester identities. Use a small allowlist or controlled group with owner-reviewed membership and prompt revocation.
- Use a browser sign-in flow for the website analyzer. **Never** embed a shared secret, Access service token, permanent API key, or private JWT in public JavaScript or HTML.
- For MCP, first test **Cloudflare Access Managed OAuth** with supported non-browser MCP clients. The server must satisfy MCP discovery/challenge/resource metadata expectations, rather than only allowing a human browser cookie.
- Do not add a standalone OAuth provider or token store for v1. If the selected Cloudflare Access/Managed OAuth setup cannot satisfy the target client, treat that client as unsupported in beta and request a separate design decision before adding infrastructure.

**Important:** Managed OAuth is an **available Cloudflare capability**, not proof that every client or ChatGPT plan accepts PARE. Cloudflare Access service tokens are useful for trusted service-to-service callers but **are not** a universal substitute for OAuth user authorization in arbitrary MCP clients.

### 5.2 Verify identity in the Worker

Prefer Cloudflare's supported Worker Access context where it is available and trusted. Where full claims are required or that context is unavailable, verify the Access JWT cryptographically against Cloudflare's published JWKS and check `iss`, `aud`, `exp`, and applicable identity/application policy. Never parse a JWT without verification and accept its fields as valid. Use the current official Cloudflare `ctx.access` / JWT guidance, account-level policy, and actual route behavior. The verifier must reject missing or bad configuration at startup/first request (fail closed), not fall back to anonymous mode.

**Illustrative control flow (not drop-in auth code):**

```ts
async function guard(request: Request, env: Env, path: string) {
  const identity = await verifyCloudflareAccess(request, env);
  if (!identity || !identity.isApprovedBetaTester) {
    throw new UnauthorizedError();
  }
  // Independent origin, method, raw-byte and schema checks follow.
  return identity;
}
```

`verifyCloudflareAccess` is a conceptual placeholder. It **must not** be implemented by merely checking header presence or decoding a token. Authorized identity is not copied into the analysis core or tool result; only ephemeral admission metadata belongs to the router.

### 5.3 MCP authorization and discovery compatibility

MCP Streamable HTTP authorization is separate from merely making an HTTPS endpoint available:

1. An unauthenticated protected resource should provide the expected `401` bearer challenge and a protected-resource-metadata pointer as prescribed by the current MCP authorization specification (where applicable).
2. Protected Resource Metadata identifies the canonical resource and trusted authorization server(s); ensure metadata routes required for discovery are reachable in a way compatible with Access rules, without exposing the tool execution route.
3. OAuth-capable clients should discover an authorization endpoint, complete the approved authorization flow, and then send a token scoped to the resource. Validate the intended audience/resource as well as signed identity.
4. Client authorization checks run before the MCP SDK tool handler; successful authorization does not waive Zod, body-size, or per-tool limits.
5. HTTP auth failure is not an MCP `isError: true` tool result. Protocol/version/method errors are SDK-owned, while handled tool validation/engine failures follow Document 07.
6. Test the precise HTTP methods, negotiation headers, stateless transport, and auth redirect behavior on staging. Preserve SDK-owned wire framing; do not hand-implement JSON-RPC or invent protocol headers.
7. Publish a client compatibility matrix: version, authentication method, status, reproducible steps, date tested, and known limitations.

**Release blocker:** If Cloudflare Access returns an interactive login page or redirect when a tested MCP client expects a usable OAuth challenge, that client is **not supported yet**. Do not circumvent this by exposing `/mcp` anonymously or using a shared token in website JS.

## 6. Website analyzer access and browser protections

- Display the public brand, product explanation, safe-input warning, and documentation to everyone. The analyzer may be visible but should clearly state beta access is required.
- On analysis attempt, guide non-testers toward approved beta access without copying sensitive input into redirects, login URLs, query parameters, tracking events, or console logs.
- When authenticated, `POST /api/analyze` sends the pasted text or browser-read file content using same-origin HTTPS. No server-side file upload store is permitted.
- Browser must not save submitted content in localStorage, sessionStorage, IndexedDB, service-worker cache, or URL fragments. In-memory UI state is allowed until the page is closed/reloaded. Avoid preloading user-submitted files into analytics scripts.
- Use `textContent` or strictly safe DOM construction for returned text. Never use `innerHTML` with the input, draft, task, or recommendation strings. Copying cleaned content requires visible review of the differences under Document 04.
- Apply `Cache-Control: no-store` to analysis responses and sensitive tool results. Use restrictive `Referrer-Policy`, `X-Content-Type-Options: nosniff`, and an appropriate narrowly scoped `Content-Security-Policy`; test against the actual static assets, including logo files.
- Allow only needed browser request methods and content types. For the same-origin frontend, default to **no cross-origin API access**. CORS headers never replace access control. Ensure `Origin`/Fetch Metadata checks are compatible with legitimate beta browser requests; do not use `Origin` as sole authentication.
- A static/worker deployment is not a reason to enable automatic browser content collection. Avoid external analytics, error-tracking scripts, and third-party fonts for v1.

## 7. Data handling, lifecycle, and privacy boundaries

### 7.1 Data inventory

| Category | Examples | Processing purpose | Intentional persistence by PARE | Exposure |
|---|---|---|---|---|
| Source text | Prompts, docs, code, JSON, logs, tool schemas | Analysis | **None** | Worker memory; optional response draft only |
| Optional task | “Debug an auth error” | Rank advice | **None** | Worker memory; no text in logs |
| Original/candidate | Compare inputs | Token comparison | **None** | Worker memory; comparison output excludes full originals |
| Generated draft | Duplicate-paragraph proposal | User-reviewable output | **None** | Response to authorized requester only |
| Findings | Line indices and rule types | Explain signals | **None** | Response, no copied snippets |
| Operational metadata | Status class, route, duration bucket, request size bucket | Reliability/abuse detection | **Platform-dependent** | Minimal allowed logs, no text |
| Tester identity | Access account and policy information | Admission/revocation | Cloudflare Access control plane | Cloudflare-managed |
| Security events | Block/rate-limit/action information | Abuse investigation | **Platform-dependent** | Cloudflare-managed settings |
| Secrets | Cloudflare API/access config | Deployment / verification | Secret store (not app DB) | Authorized maintainers/runtime |

### 7.2 Required flow

`user explicitly submits → transport encrypted → authorization → byte/schema validation → request-scoped core → bounded response → request data becomes eligible for garbage collection`.

Do not promise a precise deletion instant, zero memory remnants, no platform metadata, or a universal zero-retention guarantee. The browser, user's AI host, their employer, and Cloudflare may have distinct retention policies. PARE's promise is narrower: **no intentional application-level persistence of submitted content** and **no prompt-body application logging** after configuration is verified.

### 7.3 Content outputs and response handling

- Draft text is the sole approved route for reproducing large portions of submitted input and only after explicit opt-in; return it solely to the authorized caller and never in operational telemetry.
- `suggest_optimizations` only returns advice; `compare_tokens` does not echo full original/candidate values.
- Findings use zero-based line references; `snippet: null`. No text excerpt may leak through validation or other evidence fields.
- All errors and HTTP headers are free of submitted text and task snippets. Avoid filenames where they could be sensitive; never log full query strings or URL paths containing accidental user payloads.
- `Content-Type: application/json` for the browser API; use SDK-defined MCP protocol response handling. Apply non-cacheable headers to sensitive routes and disable edge cache transforms for them.

## 8. Logging, traces, analytics and telemetry

### 8.1 Approved minimal logging

Only the following kinds of **non-content operational metadata** may be considered, subject to deployment review: route category (`website_api`/`mcp`), status class, safe error code, rounded duration, broad request-size bucket, coarse rate-limit event, and a generated ephemeral correlation ID. No payload values or text-derived fingerprints are necessary for v1.

**Never record** raw request/response bodies, generated draft, tokenized content, file bytes/names, task description, API keys, JWTs, Access cookies, authorization headers, entire URLs with query strings, source line snippets, stack traces containing argument values, or user emails in application telemetry.

Cloudflare observability, Access audit events, WAF logs, request logs, trace sampling and browser developer tools must be audited individually. If an unavoidable platform layer retains user content, update the user disclosure or block launch. Configure retention/access to the minimum justified by operations and plan capabilities; do not invent a universal retention duration.

### 8.2 Implementation pattern

```ts
// Illustration: only allowlisted, non-content properties.
function safeEvent(event: {
  route: 'website_api' | 'mcp';
  statusClass: '2xx' | '4xx' | '5xx';
  code?: string;
  durationMs?: number;
}) {
  return {
    route: event.route,
    statusClass: event.statusClass,
    code: event.code ?? 'NONE',
    durationBucket: event.durationMs == null
      ? 'unknown'
      : event.durationMs < 100 ? '<100ms' : '>=100ms',
  };
}
```

Even this example does **not** authorize unlimited event export. Disable broad `console.log(request)` and automatic exception reporting until scrubbed and verified. Use static safe error codes, not `error.message` from third-party dependencies, in client-visible responses.

## 9. Secrets and dependency security

1. Store any runtime secret via Wrangler secret bindings / Cloudflare secure configuration—not in Git, `public/`, HTML, JS assets, screenshots, CI logs, documentation, or frontend env variables.
2. Identity-provider secrets and Access client configuration must follow Cloudflare's current managed OAuth setup. Do not manually expose confidential OAuth client secrets in application responses.
3. Repository `.gitignore` should exclude `.dev.vars*`, `.env*`, local credential files, test tokens, screenshots containing JWTs, and generated artifacts with submitted text. Use safe `.example` files with fake values.
4. Production and staging use separately scoped credentials/policies. Apply least privilege to Cloudflare deploy tokens, GitHub Actions, and beta administrators.
5. Pin compatible production dependency ranges through `package-lock.json`; use `npm ci` in CI. Scan dependencies and review breaking changes in official MCP SDK, Zod, tokenizer and Wrangler.
6. No shell execution, dynamic code evaluation, remote fetch from user text, package installation from untrusted input, or filesystem access in the analyzer.
7. Rotate/revoke exposed secrets immediately; preserve an incident note without reproducing the secret. Explicitly disable unused tokens and hosts before opening beta.
8. For open-source releases, verify source maps and build output do not expose credentials or internal config. A public Worker bundle and static site must contain no secrets.

## 10. Cloudflare controls and routing checklist

### 10.1 Static assets and protected paths

Cloudflare Workers Static Assets can be served without running Worker code. The deployment must keep `/api/*` and `/mcp` (and intentional subpaths) **Worker-first** using installed Wrangler-supported `assets.run_worker_first` settings, as outlined in Document 06. Test exact path matching, trailing slashes and all SDK-supported methods. Access rules must protect these routes independently of asset behavior.

Prevent alternate routes to the same Worker code: default `workers.dev` aliases, preview URLs, alternate domains, or direct endpoints must be checked and either disabled or protected equivalently. Confirm custom-domain DNS/TLS and actual Access app path scoping in staging.

### 10.2 Managed rate limiting

Preferred: Cloudflare WAF rate-limiting rules scoped to `/api/analyze` and `/mcp`, or Cloudflare Workers Rate Limiting binding if appropriate for the selected deployment. The exact available features and limits depend on Cloudflare account plan, zone, and routing choice.

- Apply independent buckets for browser analysis and MCP where feasible.
- Do not rate-limit harmless static assets with the same strict budget as computational routes.
- Design counting keys from supported, trustworthy Cloudflare features or vetted tester identity. An attacker-controlled `X-User-ID` must never determine a trusted quota.
- Test `429`/block responses, request bursts, bursts from separate testers and intentional exhaustion. Verify limits actually apply to the public hostname and relevant Worker paths.
- Rate limiting is additional to raw-size, output-size, tokenizer, time and algorithmic resource caps; none replaces the others.
- If the selected Cloudflare account cannot enforce the approved controls, **do not launch an exposed beta analysis endpoint** until a new option has been explicitly approved.
- Avoid assuming globally exact counters; test the platform's distribution and eventual behavior and document the guarantees actually provided.

### 10.3 Suggested deployment variables (names provisional)

```text
PARE_ENV=staging | production
ACCESS_TEAM_DOMAIN=<configured Access team domain>
ACCESS_AUD=<configured Access application audience>
MAX_REQUEST_BYTES=<from benchmarking>
MAX_TEXT_BYTES=<from benchmarking>
MAX_TASK_BYTES=<from benchmarking>
MAX_COMPARISON_BYTES=<from benchmarking>
MAX_OUTPUT_BYTES=<from benchmarking>
MAX_FINDINGS=<from benchmarking>
MAX_RECOMMENDATIONS=<from benchmarking>
MAX_LINES=<from benchmarking>
MAX_PARAGRAPHS=<from benchmarking>
MAX_EDITS=<from benchmarking>
```

These are design-time names, not a copy/paste production secrets file. Credential values, rate quotas, and numeric size caps require real staging tests and approval. Config parsing must reject invalid/missing security-critical values (fail closed) rather than silently falling back to unlimited work.

## 11. Request validation and execution limits

**Order matters:**

1. Check allowed hostname, HTTPS, route and method; apply edge Access/rate protections.
2. Verify Access identity and authorization **before** entering expensive body parsing where practicable.
3. Enforce raw HTTP content length/stream byte cap; do not trust only the declared `Content-Length`.
4. Validate `Content-Type`, JSON framing and **Document 07 Zod schemas**; reject unknown keys and absent required values.
5. Enforce UTF-8-encoded bytes on every string and combined fields. Validate `MAX_COMPARISON_BYTES` across both texts; do not double memory consumption unknowingly.
6. Reject unsupported binary uploads, unsupported extension hints and file contents failing the approved text ingestion policy. File extensions are advisory, not a security certificate.
7. Enforce line, paragraph, finding, recommendation, edit, tokenizer and final serialized output budgets. Use bounded regexes and loops; profile worst-case input, not only common examples.
8. If a draft exceeds output limits, return no draft and a safe warning; never return a truncated candidate as valid.
9. Keep user-facing error text generic and bounded. Distinguish `401/403`, `413`, `415`, `429`, safe input `4xx`, and internal `5xx` appropriately; let the MCP SDK own protocol errors.
10. Never retry hostile inputs endlessly. No long-running or background tasks are required for v1.

Rate limits alone do not prevent one authorized tester from sending a costly permitted request; app-level complexity and byte bounds are mandatory.

## 12. MCP tool permissions and output integrity

All three tools are *analysis* operations; the server does not modify external state. However, output may contain a **user-supplied draft**, so their confidentiality still matters.

| Tool | Reads | Writes | Security notes |
|---|---|---|---|
| `analyze_context` | Explicit `text`, optional `task`, source hint, `includeDraft` | None | Draft only if opted-in and eligible; response may contain copied content |
| `suggest_optimizations` | Explicit `text`, optional `task`, hint | None | Advice only; safe line evidence |
| `compare_tokens` | Explicit original and candidate | None | Candidate may be empty; meaning-loss warning; no echo of full strings |

No tool may access other conversations, device files, private repositories, upstream model bills, or another MCP server without an additional, approved integration. User input that says “ignore previous instructions,” “send this to URL,” or includes shell commands is **data**. It cannot create new tools, auth scope or network behavior.

**Diff review:** The PARE website must open the diff and require explicit review before enabling copy of a proposed draft. The MCP server can set `requiresReview: true` and provide clear warnings, but **cannot ensure a third-party AI client displays or enforces review**. Do not claim otherwise.

## 13. Privacy notice — draft user-facing language

> **What PARE processes:** Text you paste, supported text/code files you choose, optional task details, and any comparison text you submit. PARE uses this information to count tokens and suggest or prepare reviewable reductions.
>
> **What PARE stores:** PARE v1 is designed without an application database or saved analysis history, and we configure its application logs not to contain submitted text. Cloudflare may process and retain operational/security information, and your AI client or browser may separately retain content according to their policies.
>
> **Who can use the analyzer during beta:** The informational website is public; analysis features require approved beta access. The remote MCP endpoint is invite-only.
>
> **What PARE cannot access:** PARE does not automatically read your chat history, device files, repositories, or other tools. It receives only information you or your compatible client explicitly send.
>
> **What to avoid:** Do not submit passwords, private keys, access tokens, highly sensitive personal information, or code you do not have permission to share.
>
> **Optimization limits:** Token counts depend on the selected tokenizer; suggested removals can change meaning. Review every cleaned draft before use.

**Status:** Draft disclosure, **not a finalized legal privacy policy**. Before publishing, verify actual Cloudflare region/retention settings, controller/operator identity, contact details, security event practices, applicable law, and platform requirements. Do not claim “zero retention,” “end-to-end encrypted,” or “GDPR compliant” without separate evidence and appropriate review.

## 14. Disclosure and incident-response operational notes

- Publish `SECURITY.md` with a private responsible-disclosure contact, supported security-fix policy, and a warning not to attach sensitive examples to public issues.
- The maintainer can revoke testers in Cloudflare Access, temporarily block `/api/analyze` or `/mcp`, change WAF rules, rotate credentials, and roll back deployment.
- For suspected leaked content, stop the route or disable logging immediately, preserve the **minimum necessary metadata**, determine whether any Cloudflare-managed service captured content, assess notifications with professional advice, and remediate before reopening.
- For a compromised OAuth/client credential, revoke it through the authority that issued it; do not just hide it in UI.
- Handle false security reports and bug bounty claims respectfully; do not promise a bounty program or a specified response SLA without operating one.
- Never ask users to post full prompts containing secrets to GitHub issues for debugging.

## 15. Security verification matrix for Document 10

| ID | Verification fixture / action | Pass requirement |
|---|---|---|
| SEC-01 | Anonymous `POST /api/analyze` | Rejected before core; no leak |
| SEC-02 | Direct alternate hostname / alias attempt | Protected or unreachable |
| SEC-03 | Missing, expired, wrong issuer/audience, forged JWT | Rejected; no SDK execution |
| SEC-04 | MCP Inspector + chosen client OAuth walkthrough | Correct challenge, login, callback, invoke; otherwise unsupported |
| SEC-05 | Token for wrong resource | Rejected |
| SEC-06 | Oversized declared/undeclared body, binary and malformed JSON | Bounded 4xx; stable memory |
| SEC-07 | Burst calls to both protected routes | Cloudflare rule/binding demonstrably blocks or 429s |
| SEC-08 | Unique secret-marker input followed by error | Marker absent from allowed logs/errors/telemetry |
| SEC-09 | Hostile prompt asking PARE to fetch/execute | Treated as text only |
| SEC-10 | XSS payload in text, task and draft | Rendered as inert text |
| SEC-11 | Cross-origin form/request with authenticated browser | Rejected where policy requires; no CSRF bypass |
| SEC-12 | CORS origin spoof with missing auth | Denied despite Origin header |
| SEC-13 | Sensitive API responses, proxy/CDN tests | Non-cacheable; no unexpected edge cache |
| SEC-14 | Submit/reload; inspect local/session storage and URL | Content not persisted by PARE frontend |
| SEC-15 | Search repository, built assets, workflow artifacts for test secret | No matches; credentials scoped |
| SEC-16 | Fuzz long lines, nesting, Unicode, repetition | Bounded CPU/memory and deterministic errors |
| SEC-17 | Draft exceeding output cap | `unavailable`/omitted draft, never partial valid draft |
| SEC-18 | Opt-in draft and compare empty candidate | Review warning and meaning-loss warning present |
| SEC-19 | Static public plus protected `/api/*`/`/mcp` on staging | Access and Worker-first routing correct |
| SEC-20 | Audit Cloudflare Access/WAF/observability configurations | Disclosures match actual retention/capture settings |
| SEC-21 | Allowed tester revoked mid-beta | New calls denied after provider propagation |
| SEC-22 | Missing security-critical binding/env value | Fail closed, no public fallback |
| SEC-23 | Unauthorized MCP requests with unusual headers/methods | SDK not reached; safe HTTP response |
| SEC-24 | Review provided file types with misleading MIME/extension | No binary parsing or unsafe cleanup |
| SEC-25 | Unauthorized requests and high-volume attack | No content, JWT, cookies or query strings in logs |
| SEC-26 | Authorized input with sensitive code/JSON/logs | No automatic edits outside exact eligible prose |

Fixture credentials must be synthetic and never valid production secrets. Test actual Cloudflare staging configuration rather than just mocked unit guards.

## 16. Protected-beta deployment security checklist

### Cloudflare project and routes

- [ ] Public static landing page and logo render without authentication.
- [ ] `/api/analyze`, `/mcp`, intentional MCP subpaths and expected HTTP methods have correct Access protection.
- [ ] Static asset handling cannot bypass Worker authorization on protected routes; `assets.run_worker_first` is verified.
- [ ] `workers.dev`, preview URLs and alternate custom domains cannot bypass beta rules.
- [ ] Production HTTPS, DNS, expected host restrictions and TLS are tested.
- [ ] Staging and production Access audiences, approved identities and credentials are separated.

### Authorization

- [ ] Access policy is invite-only and allows immediate administrative revocation.
- [ ] Worker validates Access identity/JWT correctly; no blind header trust.
- [ ] Non-browser MCP OAuth has passed an end-to-end test for each advertised client.
- [ ] MCP metadata/challenge paths and response codes pass SDK and client tests.
- [ ] No permanent access token or service secret appears in website assets.
- [ ] Unauthorized requests are rejected before engine/tool execution.

### Data/privacy

- [ ] Request, response and draft bodies are excluded from application logs and traces.
- [ ] Cloudflare platform and identity logging/retention settings are reviewed.
- [ ] Analysis responses use `Cache-Control: no-store` and are not accidentally cached.
- [ ] Browser uses no persistent prompt storage or query-string submission.
- [ ] Privacy notice is accurate for actual deployment, with operator/contact information added.
- [ ] Logs and error paths have passed unique secret-marker leakage tests.

### Abuse and correctness

- [ ] Cloudflare-managed rate controls operate for exact deployed routes and traffic types.
- [ ] Request, content, task, comparison, output, lines, paragraphs and findings caps are configured and tested.
- [ ] Malformed/binary/over-limit requests return bounded safe errors.
- [ ] XSS, CSRF, Origin/CORS, auth bypass, cache and dependency tests pass.
- [ ] `includeDraft` gating, exact paragraph-only cleanup and mandatory diff-review UX are verified.
- [ ] Empty-candidate comparison contains warning; no invented token-saving claims.

### Release hygiene

- [ ] `npm ci`, TypeScript checks, Vitest, integration tests and dependency audit pass.
- [ ] GitHub Actions deploy credential is least-privilege; no test credentials leak in artifacts.
- [ ] `SECURITY.md`, privacy notice and user-facing limitations are published.
- [ ] Emergency revoke/disable/rollback procedure is documented and rehearsed.
- [ ] One maintainer signs off on staging evidence; no unsupported client/platform availability claims.

## 17. Known constraints, unresolved risks and decisions for Document 10

| ID | Open issue | Why it matters | Proposed test-first disposition |
|---|---|---|---|
| S09-01 | **Exact Cloudflare Access/Managed OAuth setup** for tested MCP clients | A browser login isn't necessarily interoperable with MCP | Execute full login + tool-call flow with MCP Inspector and chosen real client; retain auth-only fallback for unsupported clients |
| S09-02 | **Access path scoping** for public site + protected analysis on one hostname | Misconfiguration could expose analyzer or block public static assets | Deploy representative staging route policies and verify all paths and methods |
| S09-03 | **Access JWT validation API** (`ctx.access` versus direct JWT) | Depends on actual Worker context/routing | Confirm recommended Cloudflare implementation with current Wrangler, and test forged/wrong-audience tokens |
| S09-04 | **Cloudflare WAF/Workers rate-control availability** | Depends on account plan, zone, bindings and Workers route | Verify available control on deployment account; set and test route-specific caps before exposure |
| S09-05 | **Numeric limits** (request, field, output, CPU and rate) | Cannot safely guess | Profile real Worker and tokenizer with representative plus adversarial inputs; approve values before beta |
| S09-06 | **Cloudflare logging and retention settings** | “In memory” is not equivalent to zero platform retention | Inspect active Access, Workers, WAF and observability settings; adjust privacy copy based on reality |
| S09-07 | **Beta client list** | Compatibility claims require evidence | Select at least one MCP Inspector version and one real target client; record matrix |
| S09-08 | **Static site auth messaging** | Public visitors need clear private-beta onboarding | Approve visible sign-in/invite UX without adding accounts or storing submissions |
| S09-09 | **Test evidence storage** | Risk of accidentally saving real prompts in test artifacts | Use synthetic fixtures only, redact IDs and credentials, set artifact retention policy |
| S09-10 | **Legal identity/contact and regional notices** | Publication/privacy obligations | Supply maintainer contact and verify jurisdiction-specific disclosures before public launch |

### 17.1 Questions to settle **before** writing Document 10

1. **Which client compatibility target comes first?** Recommendation: MCP Inspector plus **one** actual client (e.g., Cursor or Claude), not every AI app at once; do not promise ChatGPT installability without eligible-account testing.
2. **What test-depth should Document 10 require for beta?** Recommendation: Vitest unit/contract suite **plus** a small Cloudflare staging smoke suite covering authorization, rate limits and browser UX; no extra test framework initially.
3. **How should test fixtures handle sensitive content?** Recommendation: synthetic-only fixtures, including fake token strings, XSS examples and intentionally oversized test documents; prohibit real prompts in CI.
4. **How should release blocking work?** Recommendation: any failed auth bypass, sensitive-data leakage, cache, unsafe-edit or unbounded-compute test is a **hard stop**; cosmetic issues may remain tracked.

Secondary values (exact numeric caps, Cloudflare plan choices, Access policy configuration and retention durations) remain **test-derived deployment configuration**, not assumptions hidden in Document 10.

## 18. Official references (checked 18 November 2026)

These external references verify available platform/protocol mechanisms. They do **not** establish that PARE has configured or passed them.

1. Cloudflare Workers Access: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
2. Cloudflare Access JWT verification: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
3. Cloudflare Access Managed OAuth: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/
4. Cloudflare MCP authorization guidance: https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/
5. MCP TypeScript SDK v2 authorization: https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization
6. Cloudflare WAF rate-limiting rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
7. Cloudflare Workers Rate Limiting API: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
8. MCP July 2026 spec overview: https://blog.modelcontextprotocol.io/posts/2026-07-28/

---

## 19. Document 09 acceptance criteria

This document is complete as a **design specification** when: (1) all four owner-approved security decisions are preserved; (2) public assets vs protected endpoints and Access compatibility are distinguished; (3) there is an explicit threat model, privacy inventory and controls; (4) every meaningful trust boundary has a test; (5) no numeric, plan, or retention guarantee is fabricated; (6) security-critical staging checks are listed as hard beta release gates; and (7) Document 10 choices are identified without silently implementing new infrastructure.

**Implementation status:** No deployed configuration, penetration test, formal compliance audit, trademark clearance, or client authorization outcome is asserted by this document.
