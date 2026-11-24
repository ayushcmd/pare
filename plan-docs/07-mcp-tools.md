# PARE — MCP Tools and Contracts

**Document:** `07-mcp-tools.md`  
**Version:** 1.0 — proposed v1 interface contract  
**Prepared:** 18 November 2026  
**Status:** Detailed specification for implementation and product approval; **not a claim of a deployed or tested server**  
**Depends on:** `01-product-overview.md` through `06-system-architecture.md`  
**Next:** `08-optimization-engine.md`

> **Contract in one sentence:** PARE exposes exactly three explicitly invoked, stateless, read-only MCP tools—`analyze_context`, `suggest_optimizations`, and `compare_tokens`—which use a single deterministic TypeScript analysis core, return concise text **and** structured results, avoid unnecessary user-content echo, and never modify user content or claim hypothetical savings as measured.

> **Implementation update (23 November 2026):** The active v1 contract is intentionally smaller: `analyze_context` includes findings/recommendations and optional reviewed draft data; `compare_content` compares explicit strings. `suggest_optimizations` and `compare_tokens` are not registered. Current Zod schemas in `src/core/contracts.ts` are the executable contract; see [`00-implementation-baseline.md`](./00-implementation-baseline.md).

---

## 1. Authority and confirmed decisions

This document follows the earlier PARE specifications, not a new feature proposal. The most relevant binding decisions are:

| Area | Approved behavior |
|---|---|
| Brand | **PARE**; tagline **“Keep what matters. Cut the rest.”**; original approved logo; navy `#021020` and lime `#BDFB64` |
| Target | Both AI developers and everyday users; prioritize developer integrations |
| Frontend | One public HTML/CSS/vanilla-JS page, dark-first, paste-first, stacked result cards |
| Backend | One Cloudflare Worker, TypeScript, official MCP TypeScript SDK v2, Zod, `npm`/Wrangler, Vitest |
| Processing | Rule-based, no external LLM; same core for website API and MCP tools |
| Storage | No application database, saved analysis history, prompt ledger, or automatic file storage |
| Inputs | Supplied text and lightweight UTF-8 content; website can read `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`; no PDFs |
| Task awareness | Optional task description, not a justification to delete unique material |
| Cleanup | Only conservative standalone prose transformations; proposal requires review; never auto-apply |
| Draft generation | **Opt-in**: `analyze_context` only produces a candidate if `includeDraft: true` |
| Suggestions | `suggest_optimizations` produces **recommendations only**, never a draft |
| Comparison | `compare_tokens` requires both **explicit original and candidate**; no implicit candidate generation |
| MCP output | Short human-readable `content` plus machine-readable `structuredContent` |
| Access | MCP beta is invite-only; website is public but analyzer API is protected |
| Resource limits | Server-configured size/output/CPU budgets; numeric values selected by measured Worker tests |

**Important distinction:** A client explicitly passing two text strings to `compare_tokens` establishes a measured text-to-text comparison—not that PARE generated, recommends, or validated the candidate for semantic equivalence. The website’s “Copy cleaned draft” permission remains a browser-local UI state requiring an opened/reviewed diff; a remote MCP client cannot be forced to present that UI. Any PARE-proposed draft must set `requiresReview: true`.

### 1.1 Version and change-control policy

- Public tool names are stable for this proposed v1: `analyze_context`, `suggest_optimizations`, `compare_tokens`.
- Use additive, optional fields for compatible evolution. Do not silently change meaning or units of existing keys.
- All JSON responses include `schemaVersion: "1.0"`. Treat breaking shapes, error-code changes, or altered tokenizer semantics as contract changes requiring tests and a version plan.
- SDK version names/packages are based on official **MCP TypeScript SDK v2** documentation available on 18 November 2026; exact API typings and structured-output behavior **must be compiled and tested** with the installed lockfile before marking implementation complete.
- `inputSchema` accepts Zod v4; when using an output schema, confirm the exact installed SDK type requirement rather than assuming a snippet is executable unmodified.

## 2. Product and tool boundary

### 2.1 End-to-end flow

```text
Authorized MCP client
  -> HTTPS /mcp; Worker authentication, request/size guards, Host/Origin checks
  -> Official SDK MCP protocol handler; tools/list and tools/call
  -> Zod input schema -> application-level UTF-8 byte limits
  -> Shared core: tokenize -> detect -> suggest -> optional safe prose proposal
  -> Bounded tool result: short content[] + structuredContent
  -> Client chooses how to display, review, or use the result
```

PARE does **not** inspect other conversation messages, intercept background AI traffic, read client filesystem paths, fetch arbitrary URLs, retrieve repositories, enumerate hidden tools, use a third-party AI API, or send optimized content to a model. File support on the website means the browser reads an approved file as UTF-8 text and submits its content; MCP tools accept **text**, not file paths, file handles, binary attachments, or URLs.

### 2.2 Tool separation

| Tool | User question | Output | Draft? |
|---|---|---|---|
| `analyze_context` | “What is wasteful in this content?” | Count, findings, prioritized recommendations, optionally safe proposed draft + diff metadata | **Only** with `includeDraft: true` and eligibility |
| `suggest_optimizations` | “How should I reduce this context?” | Actionable, ranked suggestions with reasoning, risk and constraints | **Never** |
| `compare_tokens` | “Did this candidate actually use fewer tokens?” | Comparable original/candidate counts, signed delta, percentage and caveat | **Never** |

Do not add an `auto_optimize`, `rewrite`, `upload`, `scan_account`, `browse_repo`, or `estimate_billing` tool in v1.

## 3. Shared terminology and measurement conventions

| Term | Meaning |
|---|---|
| Original | Exact supplied `text` or `original` string, not a normalized hidden substitute |
| Candidate | Explicit user/client-provided `candidate`, or eligible PARE-proposed prose draft when opted in |
| Count | Integer produced by PARE’s named tokenizer on the **exact string** under inspection |
| Exact encoding count | Exact with respect to the documented encoding implementation, **not** necessarily exact model-provider billing |
| Estimate | Count that may differ from the actual target model’s usage, stated clearly |
| Finding | Evidence-backed structural observation, e.g., repeated prose or a large log |
| Recommendation | Non-destructive advice; potential benefit need **not** be quantifiable |
| Draft | Optional output of conservative, bounded edits to eligible prose |
| Measured delta | `originalTokens - candidateTokens`, counted with the same encoding |
| Reduction % | `(originalTokens - candidateTokens) / originalTokens * 100`, when original > 0 |
| Risk | `low`, `medium`, or `high` **for applying the suggestion**, not a probability of semantic correctness |

**Count integrity rules:** The default proposed encoding is `o200k_base` through `js-tiktoken`, contingent on successful Cloudflare Worker canary testing (Document 05). Label counts as `encoding_count` or `model_estimate` using the fields below; never assert an unrelated model used precisely that many tokens. Never substitute characters/4 as an exact token count if tokenizer initialization fails.

### 3.1 Common output primitives

Every successful response has `schemaVersion`, `tool`, `tokenization`, `warnings` and `result`. Tool-specific `result` types are described below. `warnings` must contain bounded, plain-language notices; may be empty. Tool outputs should not contain the original text unless draft output is explicitly requested and deemed eligible. `suggest_optimizations` and `compare_tokens` must **not echo** either full input string.

```typescript
// Zod v4 shape definitions: implementation-targeted contracts.
import * as z from "zod/v4";

export const SourceKind = z.enum([
  "plain_text", "markdown", "json", "javascript",
  "typescript", "python", "log", "mcp_tool_schema",
]);

export const RiskLevel = z.enum(["low", "medium", "high"]);
export const IssueCategory = z.enum([
  "duplicate_prose", "oversized_context", "boilerplate",
  "verbose_json", "verbose_log", "tool_schema_bloat",
  "formatting", "task_relevance_review",
]);

export const TokenizationInfo = z.object({
  encoding: z.string().min(1), // e.g. "o200k_base"; not a provider-model promise
  precision: z.enum(["encoding_count", "model_estimate"]),
  targetModel: z.string().nullable(), // descriptive; never selects unverified model tokenizer
  note: z.string(),
}).strict();

export const Evidence = z.object({
  startLine: z.number().int().nonnegative().nullable(),
  endLine: z.number().int().nonnegative().nullable(),
  snippet: z.string().max(160).nullable(),
}).strict();

export const Recommendation = z.object({
  id: z.string().min(1),
  category: IssueCategory,
  title: z.string().min(1),
  rationale: z.string().min(1),
  action: z.string().min(1),
  risk: RiskLevel,
  requiresReview: z.boolean(),
  evidence: z.array(Evidence).max(3),
  // No imaginary numeric savings on advice-only results.
}).strict();

export const ToolError = z.object({
  schemaVersion: z.literal("1.0"),
  tool: z.enum(["analyze_context", "suggest_optimizations", "compare_tokens"]),
  error: z.object({
    code: z.enum([
      "INVALID_INPUT", "INPUT_TOO_LARGE", "UNSUPPORTED_CONTENT",
      "TOKENIZER_UNAVAILABLE", "RESOURCE_LIMIT", "INTERNAL_ERROR",
    ]),
    message: z.string(), // safe, non-sensitive wording
    retryable: z.boolean(),
    field: z.string().nullable(),
  }).strict(),
}).strict();
```

The maximum lengths shown on output examples are **shape-bound examples**. Runtime output/count limits remain configurable; document actual chosen values in deployment settings after benchmarking. Evidence snippets must be escaped by consumers and redacted if they resemble secrets. For the first implementation, omit evidence snippets entirely (`null`) if content-sensitive previews cannot be made safe.

## 4. Tool 1 — `analyze_context`

### 4.1 Tool description

> Analyze explicitly supplied AI context for token count, repetition and structural overhead. Return findings and recommendations. Optionally propose a conservative, review-required cleaned prose draft when `includeDraft` is true. Never apply changes.

Read-only; no network fetch or side effects. The response may have **zero** suggestions or no eligible draft.

### 4.2 Input schema (Zod v4)

```typescript
export const AnalyzeContextInput = z.object({
  text: z.string().min(1).describe("Exact context text to analyze; do not summarize before sending"),
  contentType: SourceKind.default("plain_text")
    .describe("Hint describing supplied text; never bypasses content validation"),
  taskDescription: z.string().trim().min(1).optional()
    .describe("Optional task context to prioritize advice; not grounds to delete unique content"),
  includeDraft: z.boolean().default(false)
    .describe("Opt into a conservative cleaned prose proposal if safe and eligible"),
}).strict();

export type AnalyzeContextArgs = z.infer<typeof AnalyzeContextInput>;
```

**Validation outside the schema:** reject over-limit UTF-8 bytes in `text` and `taskDescription`, including the request’s total bytes; reject invalid JSON/unapproved kinds if a richer format is claimed; do not accept raw PDFs, attachments or binary data. `contentType` is a hint, not an authentication or trust signal. Input cap values live in verified Worker config, not fixed in these Zod definitions.

### 4.3 Structured result shape

```typescript
export const Finding = z.object({
  id: z.string(),
  category: IssueCategory,
  severity: z.enum(["info", "moderate", "high"]),
  description: z.string(),
  evidence: z.array(Evidence).max(3),
}).strict();

export const Change = z.object({
  kind: z.enum(["duplicate_prose_removed", "extra_blank_lines_collapsed"]),
  description: z.string(),
  originalLineStart: z.number().int().nonnegative().nullable(),
  originalLineEnd: z.number().int().nonnegative().nullable(),
}).strict();

export const DraftProposal = z.object({
  text: z.string(),                 // bounded; only with caller opt-in
  requiresReview: z.literal(true),
  eligible: z.literal(true),
  changes: z.array(Change),
  diffPreview: z.string(),           // bounded preview, NOT exhaustive diff
  diffComplete: z.boolean(),        // false if only a preview fits result budget
  originalTokens: z.number().int().nonnegative(),
  candidateTokens: z.number().int().nonnegative(),
  deltaTokens: z.number().int(),
  reductionPercent: z.number().nullable(),
}).strict();

export const AnalyzeContextResult = z.object({
  schemaVersion: z.literal("1.0"),
  tool: z.literal("analyze_context"),
  tokenization: TokenizationInfo,
  warnings: z.array(z.string()),
  result: z.object({
    originalTokens: z.number().int().nonnegative(),
    originalBytes: z.number().int().nonnegative(),
    findings: z.array(Finding),
    recommendations: z.array(Recommendation),
    draft: DraftProposal.nullable(),
    draftStatus: z.enum([
      "not_requested", "not_eligible", "no_safe_change",
      "available", "exceeds_output_limit",
    ]),
  }).strict(),
}).strict();
```

**Draft behavior:** `includeDraft` omitted/false ⇒ `draft: null`, `draftStatus: "not_requested"`, no before/after fields. For code/JSON/log/MCP schemas and syntax-sensitive Markdown, return advice only unless the shared core can prove a specific prose region is safe; the v1 default for non-prose is `not_eligible`. Even eligible prose may yield `no_safe_change`. If a candidate cannot fit output caps, return no draft and `exceeds_output_limit`; do **not** truncate candidate text and claim a valid comparison.

Only return a draft when both exact strings have been counted with the same encoding and the full candidate plus review metadata can be delivered within output bounds. A diff preview alone may be abbreviated, but `diffComplete: false` must not be mistaken for a complete inspection. The website must expose a **complete review mechanism** before copying (for example, client-side diff between exact original and full proposed text). An MCP response carries a `requiresReview` obligation as guidance; hosts are responsible for their interface.

### 4.4 Example request and response (illustrative)

```json
{
  "name": "analyze_context",
  "arguments": {
    "text": "Prepare a brief project update.\n\nPrepare a brief project update.",
    "contentType": "plain_text",
    "includeDraft": true
  }
}
```

```json
{
  "schemaVersion": "1.0",
  "tool": "analyze_context",
  "tokenization": {
    "encoding": "o200k_base",
    "precision": "encoding_count",
    "targetModel": null,
    "note": "Counts use the named encoding, not a verified provider bill."
  },
  "warnings": ["The repeated sentence may be intentional; review before reuse."],
  "result": {
    "originalTokens": 14,
    "originalBytes": 68,
    "findings": [{
      "id": "f1", "category": "duplicate_prose", "severity": "moderate",
      "description": "A standalone sentence appears twice.",
      "evidence": [{"startLine": 0, "endLine": 2, "snippet": null}]
    }],
    "recommendations": [{
      "id": "r1", "category": "duplicate_prose", "title": "Review repeated sentence",
      "rationale": "Identical prose appears more than once.",
      "action": "Consider removing the second occurrence after reviewing its purpose.",
      "risk": "low", "requiresReview": true,
      "evidence": [{"startLine": 0, "endLine": 2, "snippet": null}]
    }],
    "draft": {
      "text": "Prepare a brief project update.",
      "requiresReview": true,
      "eligible": true,
      "changes": [{
        "kind": "duplicate_prose_removed",
        "description": "Removed one repeated standalone prose sentence.",
        "originalLineStart": 2, "originalLineEnd": 2
      }],
      "diffPreview": "- Prepare a brief project update. (second occurrence)",
      "diffComplete": true,
      "originalTokens": 14,
      "candidateTokens": 7,
      "deltaTokens": 7,
      "reductionPercent": 50
    },
    "draftStatus": "available"
  }
}
```

**Fixture note:** Numbers and byte count above are **illustrative only**, not computed by a running tokenizer. Before implementation tests ship, regenerate counts/byte lengths and line ranges from a real fixture; never use these sample numbers as ground-truth assertions. Line indices in the proposed schema are **zero-based**, inclusive.

## 5. Tool 2 — `suggest_optimizations`

### 5.1 Tool description

> Recommend safe ways to reduce unnecessary context in explicitly supplied text, code, logs, JSON, or MCP tool definitions. Return actionable guidance only; never rewrite or automatically remove text.

Its purpose differs from `analyze_context`: lighter, advice-only results for users or agents that want a plan rather than a draft or detailed findings. It can share internal detection logic but must **never** return the cleaned text or an estimated numeric saving for edits that were not performed.

### 5.2 Input schema

```typescript
export const SuggestOptimizationsInput = z.object({
  text: z.string().min(1),
  contentType: SourceKind.default("plain_text"),
  taskDescription: z.string().trim().min(1).optional(),
}).strict();
```

Apply the same server-side UTF-8, config and structural checks as `analyze_context`.

### 5.3 Structured result

```typescript
export const SuggestOptimizationsResult = z.object({
  schemaVersion: z.literal("1.0"),
  tool: z.literal("suggest_optimizations"),
  tokenization: TokenizationInfo,
  warnings: z.array(z.string()),
  result: z.object({
    originalTokens: z.number().int().nonnegative(),
    recommendations: z.array(Recommendation),
    summary: z.string(),
    draftGenerated: z.literal(false),
    measuredSavings: z.null(),
  }).strict(),
}).strict();
```

If `taskDescription` is provided (e.g., “debug a login error”), recommendations can prioritize error-adjacent lines or related symbols **as suggestions**. They cannot delete a seemingly unrelated unique line on that basis. A zero-recommendation result is legitimate; it should say no actionable structural issues were found under current rules, not “already optimal.”

### 5.4 Example (illustrative)

```json
{
  "name": "suggest_optimizations",
  "arguments": {
    "text": "ERROR login failed\nINFO request handled\nINFO request handled",
    "contentType": "log",
    "taskDescription": "Investigate failed login"
  }
}
```

```json
{
  "schemaVersion": "1.0",
  "tool": "suggest_optimizations",
  "tokenization": {
    "encoding": "o200k_base", "precision": "encoding_count",
    "targetModel": null, "note": "Encoding count only; provider model usage may vary."
  },
  "warnings": ["Do not discard unique error evidence without review."],
  "result": {
    "originalTokens": 13,
    "recommendations": [{
      "id": "r1", "category": "verbose_log",
      "title": "Filter repeated INFO lines",
      "rationale": "Repeated status lines may add little value to login debugging.",
      "action": "Select error lines and nearby context; retain original log separately.",
      "risk": "medium", "requiresReview": true,
      "evidence": [{"startLine": 1, "endLine": 2, "snippet": null}]
    }],
    "summary": "One possible log-filtering improvement; no data removed.",
    "draftGenerated": false,
    "measuredSavings": null
  }
}
```

The example token count is illustrative and must be regenerated during testing.

## 6. Tool 3 — `compare_tokens`

### 6.1 Tool description

> Compare token counts for two explicitly supplied text versions using the same tokenizer. Return signed count differences and percentage change; do not rewrite either input or infer that the candidate preserves meaning.

This tool does **not** generate an optimized candidate, enforce review completion, or calculate the user’s provider invoice. A candidate can be longer, identical, or shorter. A negative delta is not “saved tokens.”

### 6.2 Input schema

```typescript
export const CompareTokensInput = z.object({
  original: z.string().min(1)
    .describe("Exact original text supplied by the caller"),
  candidate: z.string()
    .describe("Exact candidate text supplied by the caller; empty candidate is allowed and flagged"),
  contentType: SourceKind.default("plain_text"),
}).strict();
```

**Decision rationale:** Empty candidate is allowed to surface a real comparison but must warn that it may remove all useful meaning; empty original is rejected so percentage denominators are well defined for normal text inputs. The combined **UTF-8 byte** budget of original + candidate must be enforced before counting. Source-kind labels are hints; code/JSON validity is **not** guaranteed by a lower token count.

### 6.3 Structured result

```typescript
export const CompareTokensResult = z.object({
  schemaVersion: z.literal("1.0"),
  tool: z.literal("compare_tokens"),
  tokenization: TokenizationInfo,
  warnings: z.array(z.string()),
  result: z.object({
    originalTokens: z.number().int().nonnegative(),
    candidateTokens: z.number().int().nonnegative(),
    deltaTokens: z.number().int(),
    reductionPercent: z.number().nullable(),
    outcome: z.enum(["reduced", "unchanged", "increased"]),
    candidateSource: z.literal("caller_supplied"),
    semanticEquivalenceVerified: z.literal(false),
    reviewRecommended: z.literal(true),
  }).strict(),
}).strict();
```

**Math:**

```typescript
const deltaTokens = originalTokens - candidateTokens;
const reductionPercent = originalTokens > 0
  ? (deltaTokens / originalTokens) * 100
  : null;
const outcome = deltaTokens > 0 ? "reduced"
  : deltaTokens < 0 ? "increased" : "unchanged";
```

Round percentages **for display**, not internally for reconciliation. If count is zero for a nonempty string due to a tokenizer defect, reject the result rather than showing misleading percentages. An identical count does not imply identical content. A 100% reduction from empty candidate may be mathematically valid but **cannot be marketed as successful optimization**.

### 6.4 Example (illustrative)

```json
{
  "name": "compare_tokens",
  "arguments": {
    "original": "Please summarize this text. Please summarize this text.",
    "candidate": "Please summarize this text.",
    "contentType": "plain_text"
  }
}
```

```json
{
  "schemaVersion": "1.0",
  "tool": "compare_tokens",
  "tokenization": {
    "encoding": "o200k_base", "precision": "encoding_count",
    "targetModel": null,
    "note": "Both texts counted with same encoding; no quality guarantee."
  },
  "warnings": ["Token reduction does not confirm semantic equivalence."],
  "result": {
    "originalTokens": 12,
    "candidateTokens": 6,
    "deltaTokens": 6,
    "reductionPercent": 50,
    "outcome": "reduced",
    "candidateSource": "caller_supplied",
    "semanticEquivalenceVerified": false,
    "reviewRecommended": true
  }
}
```

Counts are placeholders for demonstration; compute real values in automated tests.

## 7. MCP protocol representation and SDK wiring

### 7.1 Correct transport and public discovery

- Remote MCP endpoint: HTTPS `/mcp`, using the official SDK v2 web-standard `createMcpHandler` on the Cloudflare Worker; no separate Node server or local stdio needed for the hosted beta.
- Required methods and headers are managed by the SDK. Do not implement a custom JSON-RPC facade and call it MCP.
- The tool list exposes **exactly three** stable names and meaningful descriptions, plus Zod-derived input schemas. Register no write tools.
- MCP SDK handles protocol-level errors, initialization and version negotiation; Worker guards authenticate and limit requests **before** forwarding.
- MCP results carry `content: [{type: "text", text: shortSummary}]` and `structuredContent: validatedObject` when supported by the locked SDK version. Do not dump the full structured JSON into the text summary; keep output bounded.
- When an output schema is registered, it must validate the exact contents of `structuredContent`. Test client behavior for hosts that ignore structured output and only display `content`.

### 7.2 SDK registration blueprint (implementation-targeted)

```typescript
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";

// These are imported from the tool schema and core modules described above.
export function createPareServer(): McpServer {
  const server = new McpServer({ name: "pare", version: "0.1.0" });

  server.registerTool(
    "analyze_context",
    {
      description: "Analyze supplied context and optionally propose reviewable safe prose cleanup.",
      inputSchema: AnalyzeContextInput,
      outputSchema: AnalyzeContextResult,
    },
    async (args) => {
      const data = AnalyzeContextResult.parse(await coreAnalyze(args));
      return {
        content: [{ type: "text", text: formatShortSummary(data) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "suggest_optimizations",
    {
      description: "Recommend context reductions without rewriting content.",
      inputSchema: SuggestOptimizationsInput,
      outputSchema: SuggestOptimizationsResult,
    },
    async (args) => {
      const data = SuggestOptimizationsResult.parse(await coreSuggest(args));
      return {
        content: [{ type: "text", text: formatShortSummary(data) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "compare_tokens",
    {
      description: "Compare explicitly supplied original and candidate text token counts.",
      inputSchema: CompareTokensInput,
      outputSchema: CompareTokensResult,
    },
    async (args) => {
      const data = CompareTokensResult.parse(await coreCompare(args));
      return {
        content: [{ type: "text", text: formatShortSummary(data) }],
        structuredContent: data,
      };
    }
  );

  return server;
}

const handler = createMcpHandler(createPareServer);
// Worker router calls handler.fetch(request, { authInfo }) only after
// authentication, host/origin checks and request budgeting.
```

**Implementation review note:** `coreAnalyze`, `coreSuggest`, `coreCompare`, and `formatShortSummary` are application functions to implement, not built-in SDK helpers. Apply bounded error handling, input limits and runtime resource checks around these handlers; do not leak validation errors containing source text. Confirm `outputSchema`, `structuredContent`, `authInfo`, and the precise SDK import signatures with the installed v2 lockfile and tests. An error may need a separate SDK-supported result path rather than parsing against a success output schema.

### 7.3 MCP result wrapper example

```json
{
  "content": [
    {"type": "text", "text": "Found 2 structural issues. No cleaned draft was requested."}
  ],
  "structuredContent": {
    "schemaVersion": "1.0",
    "tool": "analyze_context",
    "tokenization": {"encoding": "o200k_base", "precision": "encoding_count", "targetModel": null, "note": "Encoding count only."},
    "warnings": [],
    "result": {
      "originalTokens": 100,
      "originalBytes": 400,
      "findings": [],
      "recommendations": [],
      "draft": null,
      "draftStatus": "not_requested"
    }
  }
}
```

Illustrative wrapper; actual provider and SDK transport may include additional MCP/JSON-RPC envelope fields. Never manually add `content` and `structuredContent` to the outer HTTP JSON-RPC object; those belong inside the SDK’s *tool call result*.

## 8. Error taxonomy and protocol layers

### 8.1 Failure classification

| Situation | Layer | Behavior | Safe error code |
|---|---|---|---|
| No/invalid beta credential | Worker pre-MCP gate | HTTP 401/403; **do not reach tool** | HTTP access response; not a tool error |
| Rate limit hit | Worker or provider protection | HTTP 429; retry guidance where supportable | HTTP access response |
| Wrong method, protocol version, invalid MCP JSON-RPC | SDK | Let SDK generate proper transport/protocol response | SDK-owned |
| Missing/invalid tool args | SDK/Zod, then app | Validation result; do not leak input | `INVALID_INPUT` when app handles it |
| Request bytes exceed bound | Worker pre-handler / core | Reject before expensive tokenize | `INPUT_TOO_LARGE` |
| PDF or binary supplied as text | Core validation | Reject or explain text-only support | `UNSUPPORTED_CONTENT` |
| Tokenizer initialization/call fails | Core | No fabricated counts | `TOKENIZER_UNAVAILABLE` |
| Execution/output budget exhausted | Core | Stop safely; no partial savings claims | `RESOURCE_LIMIT` |
| Unexpected code failure | Core / outer error boundary | Generic safe error; internal metrics only | `INTERNAL_ERROR` |

### 8.2 Tool-level error result shape

For a *handled execution failure* after successful protocol dispatch, return `isError: true`, a brief human-readable text block and a structured object matching `ToolError` **if compatible with the installed SDK’s output schema behavior**. Some SDKs enforce registered success output schemas even on error results: verify and, if necessary, use the SDK-supported error content shape while preserving the documented error code in the safe text. Do not return partially valid success data as success.

```json
{
  "isError": true,
  "content": [{"type": "text", "text": "PARE could not analyze this input: it exceeds the configured beta size limit."}],
  "structuredContent": {
    "schemaVersion": "1.0", "tool": "analyze_context",
    "error": {
      "code": "INPUT_TOO_LARGE",
      "message": "The submitted text exceeds the configured beta limit.",
      "retryable": false,
      "field": "text"
    }
  }
}
```

This object is a **proposed application-level error shape**, subject to verifying the installed SDK’s behavior. Requests failing transport-layer authentication generally do not produce it.

### 8.3 Operational guarantees

- Fail closed if protection configuration is absent or authentication fails.
- Avoid reflecting invalid user input, secrets, request headers or stack traces in errors.
- No retry for validation, unauthorized or unsafe-format errors; limited retries may be appropriate for transient internal or tokenizer faults, but never promise automatic retries.
- No response caching for `/mcp` or `/api/analyze`; set `Cache-Control: no-store`.
- Cap the number of recommendations, findings, change records, error details, and all text outputs. Communicate truncation; never truncate a proposed draft into a supposedly valid draft.
- On uncaught Worker exceptions, emit a sanitized response with request correlation ID only if safe; do not log user-submitted content.

## 9. Privacy and content safety

1. **Explicit input only.** The caller must supply content in tool args; PARE does not query chat history, device files, private repositories or other MCP servers.
2. **No intentional persistence.** Process in request memory and avoid a data store. This does not guarantee that Cloudflare security/access logs or the calling AI client keep nothing; document those separately.
3. **Avoid echoing content.** `suggest_optimizations` and `compare_tokens` return findings and counts, not full prompts, logs or source code. `analyze_context` only returns candidate text with explicit `includeDraft: true` and safe eligibility. Even then the calling MCP client may retain tool output.
4. **Do not trust the input text.** Text may contain embedded instructions, secrets or malicious markup. Treat as data, not commands. Never execute code, interpret prompt instructions as policy, or fetch embedded links.
5. **No unsafe automatic edits.** Never auto-remove code, JSON keys, logs, unique requirements, security instructions, quoted evidence or MCP parameter constraints. Candidate text is a *proposal*, not a validated semantic equivalent.
6. **Output-safe design.** Evidence snippets are bounded; preferably omit them or redact potential secrets in v1. Website uses safe DOM text rendering and sanitizes any visual diff implementation.
7. **Transport safety.** HTTPS, configured origin/host validation, Worker-first API routing and authorization before MCP processing. Beta credentials must not be embedded in the public website source.
8. **Third-party terms.** Client platforms may have their own data processing and eligibility policies. Publishing in GitHub’s MCP directory is not universal ChatGPT installation approval.
9. **No content analytics.** Collect only coarse operational metrics as approved in Docs 06 and 09, without body text, auth headers or full responses.
10. **One request, one analysis.** No cross-request data retention; no hidden project profile or task memory.

## 10. Compatibility and integration requirements

### 10.1 Host and protocol tests

- MCP Inspector: list the three tools, validate JSON schemas, invoke valid and invalid calls, verify `content` and `structuredContent` and error behavior.
- At least one real supported client: authenticate with the selected invite-only method, discover and call each tool, receive useful plain-text summaries even if structured output is hidden.
- Verify that host clients support the chosen authorization method (Cloudflare Access vs compatible bearer admission is an **open architecture decision**). A working curl request alone is insufficient.
- Confirm `createMcpHandler` works on deployed Cloudflare Workers with request-scoped server creation, no Node-only dependencies, and no session database.
- Confirm Host/Origin checks are enforced at Worker boundary; official web-standard docs say the bare handler does **not** automatically perform them.
- Check what happens if the client ignores `structuredContent`, or if its MCP version does not recognize certain optional fields; human-readable text must remain useful.

### 10.2 Security and resource budget tests

- `/mcp` denies unauthenticated users *before* expensive tokenization and does not expose secrets on errors.
- JSON body cap and combined UTF-8 content cap enforced server-side even if browser performed prevalidation.
- Unexpected request paths do not receive the SPA HTML fallback; `/api/*` and `/mcp` are Worker-first.
- Enforce bounded output and CPU; check large unicode inputs and giant repetitive strings; no unbounded regex or quadratic diff.
- File type labels cannot trick the server into executing content or bypassing policy.
- No unreviewed server-generated candidate automatically passes through to another tool or LLM call.

## 11. Core-to-adapter contract and website parity

Implement a pure, testable core API, such as:

```typescript
export interface PareCore {
  analyze(input: AnalyzeContextArgs): Promise<z.infer<typeof AnalyzeContextResult>>;
  suggest(input: z.infer<typeof SuggestOptimizationsInput>): Promise<z.infer<typeof SuggestOptimizationsResult>>;
  compare(input: z.infer<typeof CompareTokensInput>): Promise<z.infer<typeof CompareTokensResult>>;
}
```

- `/api/analyze` calls the **same `analyze` core method** and maps structured data into the website’s agreed stacked UI. It must not implement independent heuristics in client JS.
- `suggest` may reuse shared detection results but only exposes guidance; `compare` must be deterministic and requires two strings.
- Common field names should match website and MCP semantics (`originalTokens`, `draft`, `draftStatus`, `requiresReview`). The website can derive presentation labels without changing business logic.
- For a PARE draft, the site shows before/after metrics only when `draftStatus === "available"`, full candidate is present and valid, token counts are paired and result is validated.
- For explicit comparison of two texts, an MCP client can show a measured pair even though no PARE draft exists. **Do not mislabel it as “PARE-saved tokens.”**
- Browser-local review state is keyed to the **current text and draft version**; editing input or receiving a new result resets “reviewed” and disables copying again.
- Changing `includeDraft` from false to true is an explicitly initiated request, never an invisible optimization.

## 12. Test fixtures and acceptance cases

The following are **required fixtures** for Documents 08/10; example numeric token values in this document are not test oracles.

| ID | Input / situation | Required expected behavior |
|---|---|---|
| T01 | Basic short prose, `includeDraft` absent | Valid original count; `draft=null`, `not_requested` |
| T02 | Exact repeated eligible prose, `includeDraft=true` | Full candidate only if safe; count exact two strings; `requiresReview=true` |
| T03 | Repeated code lines, `includeDraft=true` | Findings/advice only; no automatic code deletion |
| T04 | JSON with repeated values | Advisory response, no field dropping |
| T05 | Large log with recurring INFO lines | Advice-only, preserve original evidence |
| T06 | MCP tool schema descriptions | Suggest shorten/discover selectively; no automatic schema changes |
| T07 | Optional task description omitted | Valid analysis, no fabricated task-specific insight |
| T08 | Task description supplied | Prioritize clues but do not delete unique content |
| T09 | Explicit compare candidate smaller | Positive `deltaTokens`; computed percent; no semantic equivalence promise |
| T10 | Candidate longer | Negative `deltaTokens`, outcome `increased`; never call this savings |
| T11 | Candidate identical | Zero delta; `unchanged` |
| T12 | Empty candidate | Permit as comparison with strong warning; do not market as useful optimization |
| T13 | Original blank/empty | Validation error; do not divide by zero |
| T14 | Invalid contentType | Zod validation failure; no analyzer execution |
| T15 | Input over configured byte limit | Fail before tokenizer; no content echo |
| T16 | Draft output exceeds cap | `draft=null`; status `exceeds_output_limit`; no invented reduction |
| T17 | Tokenizer runtime failure | Clear failure, never pretend character count is exact tokens |
| T18 | Unauthenticated MCP call | 401/403 at Worker gate, not application tool result |
| T19 | Unauthorized unknown path | Controlled 404; never accidentally serve HTML for `/mcp` |
| T20 | Website same fixture as MCP | Same deterministic core counts/recommendations, modulo display formatting |
| T21 | Host ignores structured output | Concise `content` still explains action/results |
| T22 | Diff preview truncated | Flag incomplete; website still requires complete content review |

### 12.1 Tool contract release gates

- [ ] Exactly three tools; descriptions match their actual boundaries.
- [ ] Each `inputSchema` derives valid JSON Schema and rejects extra fields.
- [ ] All successful `structuredContent` payloads pass their Zod output schemas.
- [ ] No success response invents measured savings from advice-only suggestions.
- [ ] Original and candidate counts use the same named tokenizer.
- [ ] `includeDraft` default is false; no draft under suggestions or compare.
- [ ] The client sees proper `isError` failures for handled application exceptions; authentication rejects at HTTP boundary.
- [ ] Output sizes and privacy protections pass Cloudflare staging and redaction fixtures.
- [ ] Auth method works with at least one target client, not only direct HTTP testing.
- [ ] No sensitive source text is logged, persisted by PARE, or echoed unnecessarily.

## 13. Engineering implementation sequence

1. Finalize numeric config variable names and add safe fail-closed validation for limits.
2. Define the three Zod inputs and structured result schemas; generate compile-time types.
3. Implement tokenizer adapter and exact per-encoding counts with real fixture assertions.
4. Implement structural findings and risk-tagged recommendations.
5. Implement *optional* conservative prose candidate with bounded, complete return and review metadata.
6. Implement explicit two-string comparison and signed math, including no-op/negative cases.
7. Add a generic helper that validates and returns one short summary + `structuredContent` or a safe tool failure.
8. Register exactly three SDK v2 tools, create request-scoped MCP handler, put Worker auth/limits first.
9. Test in Wrangler local and Cloudflare staging plus MCP Inspector/at least one actual AI client.
10. Review tool contract version, update doc 08 with detection details and doc 10 with executable test fixtures.

## 14. Open decisions and questions **before Document 08**

These items are **not silently approved**; make deliberate choices when authoring `08-optimization-engine.md`:

| ID | Decision needed | Lightweight recommendation | Why it matters |
|---|---|---|---|
| E01 | What exact prose units can be de-duplicated? | Repeated *standalone multi-sentence paragraphs* only; exclude quoted/markdown fenced content | Reduce false-positive deletions |
| E02 | Are blank-line collapses allowed in Markdown? | Restrict to unstructured plain prose; otherwise advice-only | Markdown line breaks may carry meaning |
| E03 | How many findings/recommendations and what evidence? | Configurable bounded lists; line references; secret-safe snippets optional | Size/privacy controls |
| E04 | Should PARE ever return a longer proposed draft? | Return recommendations but omit the candidate unless no worse and structurally valid | Avoid fake “optimization” |
| E05 | How to handle task-aware relevance without an LLM? | Deterministic keyword hints for ranking, never deletion | Avoid unsupported semantic claims |
| E06 | Numeric limits for bytes, task length, outputs and diff? | Select only after Worker canary benchmarks | Performance and security |
| E07 | Rounding and zero-token behavior | Signed integer deltas, percentage with display rounding; no false success claims | Reproducible outputs |
| E08 | JSON and MCP schema analysis depth | Parse cautiously if within budget; suggestions only | No code/schema rewriting |
| E09 | How to classify synthetic/quoted repeated instructions? | Default to advice, exclude automated deletion if ambiguous | Prevent semantic damage |
| E10 | Is `compare_tokens` empty candidate permitted? | Proposed **yes, with strong warning**, but requires explicit approval | Product semantics |
| E11 | Which beta auth method will be used for tool client tests? | Run Access compatibility test; otherwise review another secure invite-only option | Host interoperability and security |
| E12 | Can `structuredContent` error objects coexist with a distinct success output schema in the installed SDK? | Confirm through SDK contract tests; adapt error strategy only as needed | Protocol correctness |

### Suggested questions to ask the owner next

1. **Safe cleanup scope:** only exact repeated prose paragraphs, or also collapse extra empty lines in plain text?
2. **Task-aware advice:** basic deterministic keyword hints, or no task matching in v1?
3. **Comparison edge case:** should an empty candidate be allowed (with an explicit warning), or rejected?
4. **Output evidence:** should detailed snippets be completely omitted by default to protect private prompts, or allowed as short redacted previews?

These decisions directly affect the optimization engine. They can be made before Document 08 without introducing a database, AI model, new frontend framework, or separate worker.

## 15. References and source traceability

### Internal PARE source documents

- `01-product-overview.md`: product purpose, personas, six problems, lightweight scope, privacy qualifications.
- `02-problems-and-solutions.md`: conservative transformation classes, no code/JSON/log mutation, task-aware hints, deterministic acceptance.
- `03-brand-guidelines.md`: PARE identity, original logo, sampled navy/lime colors, system typography.
- `04-ui-ux-design.md`: single-page paste-first website, stacked cards, collapsed optional task description, mandatory diff review.
- `05-tech-stack.md`: SDK v2, Zod, TypeScript, `js-tiktoken` candidate, npm, Wrangler, Vitest, no DB/framework.
- `06-system-architecture.md`: one Worker, public site/protected analyzer, invite-only MCP, Worker-first routes, shared core, privacy/resource guards.

### Public technical references checked 18 November 2026

- [MCP TypeScript SDK — First server](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server): `McpServer`, `registerTool`, Zod-backed inputs, text tool results, error behavior.
- [MCP TypeScript SDK — Web-standard runtimes](https://ts.sdk.modelcontextprotocol.io/v2/serving/web-standard): `createMcpHandler`, Cloudflare `fetch`, authentication context, and Host/Origin protection caveat.
- [MCP TypeScript SDK — HTTP transport](https://ts.sdk.modelcontextprotocol.io/v2/serving/http): web-standard remote serving and transport ownership.
- [Cloudflare Workers — Static assets](https://developers.cloudflare.com/workers/static-assets/): one Worker and public static asset deployment.
- [Cloudflare Workers — Limits](https://developers.cloudflare.com/workers/platform/limits/): profile and configure application-specific bounds.

---

## 16. Status

**Specified:** Three tool names, selected inputs, typed result shapes, explicit draft opt-in, advice-only suggestions, explicit comparison, dual MCP result format, privacy/error/test requirements.

**Not yet implemented or validated:** Actual deployed code; tokenizer output figures in examples; final Worker input/CPU caps; beta authentication compatibility with named MCP clients; SDK `outputSchema` / error-structured-content integration; semantic safety of candidate transformations beyond deterministic fixtures.

**Next document:** `08-optimization-engine.md`, after agreeing on the focused decisions in Section 14.
