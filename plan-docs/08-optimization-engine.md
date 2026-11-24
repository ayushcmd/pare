# PARE — Deterministic Optimization Engine

**Document:** `08-optimization-engine.md`  
**Version:** 1.0 — proposed v1 implementation specification  
**Prepared:** 18 November 2026  
**Status:** Detailed design, **not** evidence of a working or deployed implementation  
**Source of authority:** `01-product-overview.md` through `07-mcp-tools.md`  
**Next:** `09-security-and-privacy.md`

> **Engine contract:** Given explicitly supplied text, PARE counts tokens using one documented encoding, detects defensible structural issues, provides evidence using **line references only**, prioritizes suggestions with optional **keyword-based** task hints, and optionally proposes a strictly review-required draft that removes **only exact repeated standalone prose paragraphs**. No code, structured data, logs, or unique text is automatically removed.

> **Implementation update (23 November 2026):** Engine safety rules remain authoritative. Orchestration now maps to `analyze_context` and `compare_content`; the browser runs the same core locally by default. See [`00-implementation-baseline.md`](./00-implementation-baseline.md).

---

## 1. Decisions locked for this document

| Decision | Approved outcome | Consequence |
|---|---|---|
| Cleanup scope | `paragraphs` | **Only exact duplicate standalone prose paragraphs** may produce a cleaned draft in v1. No blank-line collapse. |
| Task awareness | `keywords` | Optional deterministic keyword matching may **reorder advice**; it may **never delete** content or assert semantic irrelevance. |
| Empty comparison candidate | `allow` | `compare_tokens` can compare nonempty original to `""`, showing a strong meaning-loss warning and no claim of successful optimization. |
| Evidence | `lines` | Structured evidence has original line references with `snippet: null`; do **not** echo user text in evidence, errors, telemetry, or summaries. |
| Draft | Opt-in | `analyze_context` only considers a draft if `includeDraft: true`. |
| Suggestion tool | Advice only | `suggest_optimizations` never returns candidate text. |
| Compare | Explicit inputs | `compare_tokens` requires original and candidate; never fabricates a candidate. |
| Transport / storage | One Worker / no DB | All computation is in-memory and request-scoped; same pure core for website and MCP. |
| File extensions | Seven | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log` for the website; MCP accepts their text, not paths. |

**Precedence rule:** This owner-approved `paragraphs` decision **narrows** earlier documents that contemplated blank-line reduction. Document 07's `Change.kind` union contains `extra_blank_lines_collapsed` as a reserved future value; PARE v1 MUST NOT emit it. Consumers should still tolerate the enum member in the schema if they follow Document 07. If the maintainer later changes this behavior, update this document, docs 02 and 07, fixtures, and version history together.

### 1.1 Traceability and non-goals

The six problems from Document 02 remain: oversized context, repeated content, noisy document/source material, verbose JSON/log output, bulky MCP tool definitions, and unverifiable savings. The engine may **recommend** solutions for all six, but its only automated edit is the narrow duplicate-prose rule. The engine is not a semantic compressor, summarizer, repository crawler, prompt interceptor, document converter, billing calculator, model router, file writer, or AI agent. Do not implement these as implied features.

Document 07 governs public MCP field names and enums; this document governs internal algorithms. If pseudocode below differs from a released SDK signature or output contract, preserve the public contract and adapt the implementation, then record a change.

## 2. Operating principles and safety invariants

1. **Exact input:** Preserve the caller-provided JavaScript string. Do not silently normalize newline sequences, Unicode, case, or whitespace before counting it.
2. **Pure core:** The analyzer accepts values and returns values. No filesystem reads, network fetches, code execution, external model calls, persistent content storage, or random outcomes.
3. **Fail closed on ambiguity:** Non-prose, mixed syntax, uncertain boundaries, and content that resembles code, structured payloads, templates, quotations, or logs cannot be automatically edited.
4. **Only the later duplicate:** Remove the **later** of two exactly identical eligible paragraphs, keeping the first occurrence intact.
5. **No unique-text removal:** Every deleted nonseparator character must belong to an exact duplicate standalone paragraph whose earlier identical occurrence is preserved.
6. **Review required:** A draft is a proposal, never a performed edit; the original remains untouched. `requiresReview: true` always.
7. **Only measured comparisons:** Show before/after counts only when both exact strings were tokenized with the same encoding. Advice-only findings have no invented savings figure.
8. **Honest basis:** Counts are exact for the selected encoding implementation, not universally exact provider token usage or money saved.
9. **No private snippets:** Finding/recommendation evidence uses original **zero-based inclusive line indices** and `snippet: null` only.
10. **Bounded execution:** Validation, byte limits, output-size checks, maximum findings and comparison budgets precede expensive analysis.
11. **Deterministic stability:** Same source, configuration, tokenizer version and rules version yields identical structured analysis (apart from server request metadata, which must not enter core results).
12. **No semantic guarantee:** Even exact duplicates may intentionally convey emphasis or multiple records; every potential edit needs a human review.

## 3. Component boundaries

```text
Website HTML/JS ---- POST /api/analyze ----┐
                                        │
MCP client -------- HTTPS /mcp ----------┤ Cloudflare Worker
                                        │ Auth + body guards + Zod
                                        ▼
                                Request-scoped core
                        ┌──────────────────────────────┐
                        │ inspect/tokenize             │
                        │ parse line & block boundaries│
                        │ structural rule detectors     │
                        │ keyword-based advice ranking │
                        │ safe draft eligibility gate  │
                        │ exact text comparison         │
                        └──────────────────────────────┘
                                        │
                               bounded result objects
                                        ▼
                     HTTP JSON OR MCP text + structuredContent
```

Only the adapter knows about Cloudflare, HTTP, authorization, and MCP. `core/` code must not depend on `Request`, `Response`, Wrangler bindings, or the MCP SDK. Both adapters import the same functions and share test fixtures.

### 3.1 Suggested minimal source organization

```text
src/
  core/
    tokenizer.ts         # singleton lazy init, exact encoding counts
    lines.ts             # lossless line indexing and offsets
    classify.ts          # conservative source/paragraph gating
    detectors.ts         # structural signals and evidence spans
    task-hints.ts        # optional keyword advice prioritization
    draft.ts             # exact duplicate paragraph proposal
    compare.ts           # signed integer token comparison
    engine.ts            # analyze/suggest/compare orchestration
  worker/
    index.ts             # existing API and MCP routing
    mcp.ts               # existing 3-tool registration
  types/
    contracts.ts         # Document 07 public Zod schemas
 tests/
    fixtures/            # text fixtures, not private source data
    engine.test.ts
    drafts.test.ts
    comparison.test.ts
    performance.test.ts
```

No extra service, database, queue, dependency-injection container, worker pool, or frontend framework is needed.

## 4. Input and validation pipeline

### 4.1 Public source kinds (Document 07)

`plain_text`, `markdown`, `json`, `javascript`, `typescript`, `python`, `log`, `mcp_tool_schema`.

Website extension-to-hint map: `.txt` → `plain_text`; `.md` → `markdown`; `.json` → `json`; `.js` → `javascript`; `.ts` → `typescript`; `.py` → `python`; `.log` → `log`. A user/client-supplied hint is **untrusted**: it may guide conservative detection but never authorize an unsafe rewrite.

### 4.2 Processing order

1. Worker enforces invite-only MCP or protected website API as Document 06 requires; reject unauthorized requests before processing the body where possible.
2. Check HTTP method, content type, total raw body bytes and permitted request transport framing; apply configurable request/CPU budgets.
3. Parse JSON, apply Document 07 Zod schema, reject unexpected fields and invalid values; enforce Unicode/UTF-8 encoded byte caps on every relevant field and combined payload.
4. Reject empty `analyze_context.text`, `suggest_optimizations.text`, or `compare_tokens.original`; permit `compare_tokens.candidate === ""`.
5. Validate claimed JSON **for parseable JSON detection only**; malformed JSON is an input/format error if the public contract requires it, or advice-only when uncertain. Do not normalize or reserialize it.
6. If tokenizer cannot initialize, return `TOKENIZER_UNAVAILABLE`; do not silently substitute a character-count heuristic as a token measurement.
7. Count original; scan structural signals; bound emitted findings; optionally compute task-hint ranking.
8. For `analyze_context` with `includeDraft: true`, run **all** draft gates, then create a candidate if eligible, count candidate, verify exact edits, and apply output cap.
9. Validate the full result against the Document 07 output schema and enforce response size. Format short text summary without source snippets.
10. Return and release request-scoped intermediate arrays/references; do not persist prompts or full drafts.

**Limits:** Use deployment-configurable `MAX_REQUEST_BYTES`, `MAX_TEXT_BYTES`, `MAX_TASK_BYTES`, `MAX_OUTPUT_BYTES`, `MAX_FINDINGS`, `MAX_RECOMMENDATIONS`, `MAX_PARAGRAPHS`, `MAX_LINES`, and `MAX_COMPARISON_BYTES`. These names are **proposed internal keys**, not already-approved numeric defaults. Document 09 must decide their security configuration and Document 10 must benchmark them. Avoid a single unbounded regex on hostile input.

### 4.3 Encoded bytes and invalid input

- In Worker JavaScript, use `new TextEncoder().encode(input).byteLength` for field byte measurement; first enforce raw request byte limits to avoid unnecessary allocation.
- No browser-provided filename, extension, MIME type, or `contentType` is authoritative for safe editing.
- Validate input text for NUL and suspicious control-character density; treat as non-prose/advice-only or reject as `UNSUPPORTED_CONTENT` according to configuration. Never execute HTML/script strings.
- Unicode is valid content; don't reject accents, emojis, RTL scripts or combining characters merely for being non-ASCII.
- Never include input text or full token strings in validation errors.

## 5. Tokenizer implementation

### 5.1 One proposed encoding

Use the Document 05 candidate **`js-tiktoken` with bundled `o200k_base`**, subject to the required Cloudflare Worker bundle/runtime canary. Lazy-initialize the encoder once per Worker isolate if compatible; reuse across requests without storing user content. Do not download tokenizer files or pricing tables at request time. The package and encoder selection are not irrevocably final until tested.

Token counting must operate on the **exact original or candidate string** rather than a trimmed, lowercased, normalized, or parsed variant. Record:

```json
{
  "encoding": "o200k_base",
  "precision": "encoding_count",
  "targetModel": null,
  "note": "Counted with the selected encoding; actual model billing can differ."
}
```

If client supplies a target model not verified to use that encoding, report `precision: "model_estimate"`, keep a truthful basis note, and **do not** switch tokenization based on a free-form model label. Document 07 input schemas currently do **not** include `targetModel`; do not silently add it. In v1, `targetModel` should normally be `null`.

### 5.2 Counting contract and invariants

```typescript
interface TokenCounter {
  encoding: "o200k_base";
  countExact(text: string): number; // integer >= 0, throws on failure
}

function countPair(original: string, candidate: string, tc: TokenCounter) {
  const a = tc.countExact(original);
  const b = tc.countExact(candidate);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0) {
    throw new TokenizerFailure();
  }
  if (original.length > 0 && a === 0) throw new TokenizerFailure();
  if (candidate.length > 0 && b === 0) throw new TokenizerFailure();
  const delta = a - b;
  return {
    originalTokens: a,
    candidateTokens: b,
    deltaTokens: delta,
    reductionPercent: a > 0 ? 100 * delta / a : null,
    outcome: delta > 0 ? "reduced" : delta < 0 ? "increased" : "unchanged",
  };
}
```

- `candidate === ""` normally counts zero tokens and is allowed **only** for explicit `compare_tokens`; it may yield 100% arithmetic reduction but is not proven safe, desirable, or usable.
- Negative delta means **increased** tokens; do not label it a saving.
- Percentage values are calculated with full precision, rounded only at presentation.
- Identical token counts do not mean identical text or semantic equivalence.
- Cache hits, API fees, provider hidden prompts, tool framing and model output length are out of scope.

### 5.3 Failure behavior

- Unavailable import, incompatible encoder payload or tokenizer exception → `TOKENIZER_UNAVAILABLE` or bounded `INTERNAL_ERROR` according to the Document 07 taxonomy.
- Never convert to approximate `characters / 4` while still marking a real count.
- A draft must never be returned with before/after numeric fields until **both** counts succeed.

## 6. Lossless line and paragraph model

### 6.1 Source spans

Use original-string offsets (`startOffset`, `endOffset` with end exclusive) and derive **zero-based inclusive** line numbers for outward evidence. Keep original newline bytes and spacing in slices. Treat CRLF as a single line break for indexing, but never rewrite it as LF during analysis or count comparisons. A trailing final newline must be preserved if no edit touches it.

```typescript
interface LineSpan {
  index: number;          // zero-based
  start: number;          // JavaScript UTF-16 offset, inclusive
  end: number;            // offset before line separator
  separatorEnd: number;   // offset after CRLF/LF/CR, exclusive
}
interface ParagraphSpan {
  startOffset: number;    // includes paragraph text, not separators
  endOffset: number;
  startLine: number;
  endLine: number;
  literalText: string;    // exact source slice, never normalized
  eligibleForDraft: boolean;
}
```

UTF-16 offsets are internal JavaScript slicing units, **not** UTF-8 byte offsets; do not expose them as line numbers. Index CRLF/LF/CR accurately. Avoid copying entire source many times; store offsets and slice only for validated comparisons and final candidate assembly.

### 6.2 Paragraph segmentation

Conservative plain-prose paragraph definition:

- One or more consecutive **nonblank lines** with a blank-line boundary before/after, or at start/end of document.
- A blank line is one whose characters excluding whitespace are empty.
- Paragraph must be sufficiently substantial: configurable minimum nonwhitespace character count and minimum word-like tokens; **numbers are measured in fixtures, not invented here**.
- Exactly equal means `source.slice(a.start,a.end) === source.slice(b.start,b.end)` at the JavaScript string level. **No** trimming, case-folding, Unicode normalization, punctuation deletion, whitespace collapse, Markdown stripping, or fuzzy similarity when deciding whether to remove.
- Paragraphs immediately adjacent without a blank separator are a single paragraph and not separate removal candidates.
- Paragraph may contain internal newlines, but the exact literal must match.
- If line breaks, quoting, Markdown structure, labels, or text classification are uncertain, recommendation only.

**Tight safety requirement for v1:** A pair is eligible for a draft only when the *whole input* is safely classifiable as ordinary standalone prose (typically `plain_text`/`.txt`) with no protected syntax regions; do not attempt partial Markdown document editing in v1. Markdown may still receive duplicate findings and advice, but `draftStatus: "not_eligible"` for uncertain structure. This is a deliberately stricter implementation of Documents 02/05/07, not a new feature.

### 6.3 Protected/ambiguous content patterns

Classify as **draft-ineligible** when any of the following is present or strongly suspected:

- Code fences (backticks or tildes), indented code, HTML/XML, template delimiters, Markdown tables, blockquotes, lists or headings whose structure could be affected.
- JSON/YAML, CSV/TSV, API traces, code stack traces, log timestamps, source-code keywords, function/class/import syntax, path-heavy test fixtures.
- Repeated commands, policy or safety instructions, legal clauses, quoted evidence, poems, transcripts with speaker labels, inventory rows, numbered statements, or repeated user requirements where repetition may be intentional.
- Invalid surrogate sequences, NUL or control-heavy text, unusually large lines, mixed formats, unknown syntax.
- Content hints `json`, `javascript`, `typescript`, `python`, `log`, `mcp_tool_schema`; these **always** get advice-only output even if the text looks like prose.

A code-like line detector is a **heuristic safety veto**, not a code parser and not a guarantee that all risky content is recognized. Conservative false negatives (no draft offered) are acceptable.

## 7. Detection algorithms for six problem categories

All findings map to the Document 07 `IssueCategory` enum (`duplicate_prose`, `oversized_context`, `boilerplate`, `verbose_json`, `verbose_log`, `tool_schema_bloat`, `formatting`, `task_relevance_review`). Do not invent extra public categories in v1. Finding severity uses `info | moderate | high`; advice risk uses `low | medium | high`.

### 7.1 Duplicate prose

Detect paragraph literals with a bounded hash map: keyed by stable hash plus **full exact-string equality** to avoid false positives from collisions. On later exact matches, report original and later line spans (each `Evidence` has `snippet: null`) and recommend review. Deduplicate overlapping findings; cap repeated occurrences per value and total entries. Detection ≠ edit permission: only the eligibility gate can propose deletion.

Avoid claiming that repeated text is necessarily waste. Repetition may be emphasis or independent factual records.

### 7.2 Oversized context

Count exact encoding tokens, total lines and paragraph/section sizes. If tokens or longest region exceed **configurable informational thresholds**, report an `oversized_context` finding with bounded line ranges. Suggest extracting task-relevant sections manually; no automatic unique-section removal. Don't pretend an arbitrary threshold equals a provider's model context window.

### 7.3 Boilerplate and formatting noise

Look for repeated navigation labels, obvious separators, headers, page-footers, large empty regions, or low-information repetition. Advise review with line references. No blank-line cleanup or boilerplate deletion in v1. Never assume a PDF-to-Markdown conversion decreases tokens; PDF parsing is out of scope.

### 7.4 Verbose JSON

Where content type is `json`, parse as JSON **only inside set size/depth constraints**; use native parser cautiously, catch failures, and never reserialize as a suggested automatic edit. Detect large key-value trees, unusually repeated structural keys, long string values or large arrays. Suggest caller-side field selection or pagination. Avoid exposing key values or literal snippets in results. Limit traversal depth, node count, and array inspection.

### 7.5 Verbose logs

Detect timestamps, repetitive line patterns, long log runs, and large blocks. Recommend extracting relevant errors plus local surrounding context, preserving occurrence counts and ordering. Never deduplicate log lines, strip stack traces or truncate output automatically. Rate/count repeated events only for advice, with bounded memory.

### 7.6 MCP tool-schema bloat

When `contentType === "mcp_tool_schema"`, inspect supplied text (and parse JSON if safely possible), count description lengths and apparent tool entries, and suggest reviewing long descriptions or lazy tool discovery **when supported by the client's environment**. Never rewrite parameter descriptions, enum values, auth language or schemas. If input is not valid schema JSON, report only observable length-based advice; don't pretend to validate the MCP spec.

### 7.7 Cross-cutting privacy/evidence rules

- Each evidence item: `{ startLine: number | null, endLine: number | null, snippet: null }`.
- When reliable line location is unavailable, use `null` rather than invented numbers; findings can still describe counts and pattern categories.
- Descriptions, rationale, action and short human summaries **must not interpolate input text, filename, user task text, secrets, or exact source identifiers**.
- Findings may count structural occurrences but must not echo matched paragraph literals.
- A draft's `text` necessarily contains caller content **only** when explicitly opted in; it is not evidence and must not be logged.

## 8. Optional keyword-aware prioritization

Task context is a hint for recommendations, not a semantic understanding system.

### 8.1 Conservative algorithm

1. If `taskDescription` is absent, keep deterministic base ordering.
2. Tokenize task description into lowercase Unicode-aware word-like terms; discard very short terms and a small **versioned** stopword set. Cap term count, characters and processing work.
3. Use headings/section titles **only for ranking advice**, not as evidence of irrelevance. Count simple term overlap when headings are safely identified; otherwise compare task terms against bounded structural labels/categories, not full source excerpts in outputs.
4. Increase priority of recommendations for sections whose visible headings overlap task keywords; do not automatically lower the importance of all nonmatching sections.
5. Break ties by fixed category rank and ascending line location; never use unstable locale comparisons or randomized scores.
6. Warn that keyword matches are incomplete, language-dependent and can miss synonyms or implicit dependencies.
7. **Never modify draft eligibility or removal rules based on keyword score.**

Example: task = `debug authentication error`, with a code file containing a section heading `Authentication Middleware`. PARE may prioritize the recommendation to inspect that section instead of the entire file; PARE must not delete unrelated sections, and must not claim accurate retrieval.

### 8.2 Pseudocode

```typescript
function rankRecommendations(items: Recommendation[], task?: string): Recommendation[] {
  const terms = task ? boundedTaskKeywords(task) : new Set<string>();
  return items.map((r, stableIndex) => ({
    r,
    stableIndex,
    priority: basePriority(r.category, r.risk)
      + boundedCategoryKeywordHint(r.category, terms),
  })).sort((a, b) =>
    b.priority - a.priority || a.stableIndex - b.stableIndex
  ).map(x => x.r);
}
```

The example intentionally ranks by bounded category metadata rather than pretending to understand arbitrary paragraph meaning. Future finer matching requires explicit product approval and tests.

## 9. Safe duplicate-paragraph draft algorithm

### 9.1 Mandatory eligibility gates

A candidate may be emitted **only if all are true**:

1. Tool is `analyze_context` and `includeDraft === true`.
2. Claimed type and actual content are confidently ordinary standalone prose, with no protected structure.
3. Input fits all byte, line, paragraph, analysis and output limits.
4. At least two paragraph spans meet substance thresholds, have exact identical literals, and are independent paragraphs separated by blank lines.
5. The later duplicate is not a quotation, instruction emphasis, repeated record, test, transcript, list, legal clause, or other plausible intentional repetition.
6. Removal leaves the first exact paragraph untouched, preserves all remaining nonseparator characters in order, and does not produce malformed/blank-only text.
7. Every removal is recorded with original zero-based inclusive line references and a `duplicate_prose_removed` change.
8. Original and full candidate tokenize successfully with identical encoding and count implementation.
9. Full candidate plus required result fields fit `MAX_OUTPUT_BYTES`; never truncate `draft.text`.
10. Engine can generate accurate metadata and bounded diff preview; a complete client-side review remains possible using the original and full candidate.

**Policy choice for initial implementation:** If there is any uncertainty about paragraph semantic role, return `draft: null` and `draftStatus: "not_eligible"` or `"no_safe_change"` rather than over-editing. A pure duplicate detection finding may still be returned.

### 9.2 Exact edit construction

- Maintain line spans for the original text.
- Identify the **later duplicate paragraph range**; remove that range plus only the minimum adjacent separator needed to avoid an empty paragraph slot.
- Preserve all earlier paragraph characters and order and avoid removing structural section separators beyond the selected duplicate slot.
- Generate edit ranges sorted from end to start; assert nonoverlap.
- Apply slices to the unchanged original using original offsets; do not repeatedly mutate and re-index live strings.
- Validate reconstructed text against the original with a deletion-only edit verifier. Reject if any nondeleted character changed or if a new character was inserted.
- If multiple duplicates produce excessive edits, cap edits and return a **complete** candidate based on the capped set (clearly record it); if unable to fit the output bound, return no draft.
- Token changes may be zero even after deletion; that is a measured result, not a guarantee of savings.

### 9.3 Pseudocode (illustrative, no runtime I/O)

```typescript
function proposeDuplicateParagraphDraft(
  original: string,
  kind: SourceKind,
  lineIndex: LineSpan[],
  limits: EngineLimits,
): { candidate: string; changes: Change[] } | null {
  if (!isConfidentOrdinaryProse(original, kind, lineIndex)) return null;
  const paragraphs = segmentStandaloneParagraphs(original, lineIndex, limits);
  const firstByExactText = new Map<string, ParagraphSpan>();
  const edits: Array<{ start: number; end: number; source: ParagraphSpan }> = [];

  for (const para of paragraphs) {
    if (!para.eligibleForDraft) continue;
    const first = firstByExactText.get(para.literalText);
    if (!first) { firstByExactText.set(para.literalText, para); continue; }
    if (!safeRoleForBoth(first, para, original)) return null; // fail closed
    const deletion = findMinimalDuplicateSlotDeletion(original, para);
    if (!deletion || !canRemoveSafely(original, deletion, limits)) return null;
    edits.push({ ...deletion, source: para });
    if (edits.length >= limits.maxEdits) break;
  }
  if (!edits.length || hasOverlaps(edits)) return null;
  const candidate = applyDeletionOnlyRanges(original, edits);
  if (!verifyDeletionOnly(original, candidate, edits)) return null;
  if (!candidate.trim()) return null;
  const changes = edits.map(e => ({
    kind: "duplicate_prose_removed" as const,
    description: "Removed a later exact duplicate prose paragraph; review required.",
    originalLineStart: e.source.startLine,
    originalLineEnd: e.source.endLine,
  }));
  return { candidate, changes };
}
```

**Important design caution:** This pseudocode is stricter than a production implementation must be in one respect: a `return null` on one unsafe pair sacrifices other possible safe edits. That is intentional for the first release, minimizing accidental data loss. A subsequent relaxation requires a review and additional fixtures.

### 9.4 Draft status mapping (Document 07)

| Condition | `draftStatus` | `draft` |
|---|---|---|
| `includeDraft` false/absent | `not_requested` | `null` |
| Source is code/JSON/log/ambiguous or syntax-sensitive | `not_eligible` | `null` |
| Eligible prose but no safely removable exact duplicate | `no_safe_change` | `null` |
| Valid full draft and measured pair fit limits | `available` | populated, `requiresReview: true` |
| Valid proposal would exceed outbound size budget | `exceeds_output_limit` | `null` |

No `extra_blank_lines_collapsed` action is emitted in v1. The `draft.changes` list must contain only `duplicate_prose_removed`.

### 9.5 Diff and website review

- Server returns **full** valid `draft.text`, bounded `diffPreview`, `diffComplete` flag, precise change line ranges, and pair counts.
- `diffPreview` is a short overview and may be incomplete. If incomplete, mark `diffComplete: false`; never present a preview as a full diff.
- Website makes its own complete diff from original and full draft, lets user inspect it, and unlocks **Copy cleaned draft only after review** as specified in Document 04.
- Host MCP clients control their own UI; PARE cannot enforce actual review. It must return `requiresReview: true` and cautionary text; do not falsely assert that a user reviewed the changes.
- Never auto-submit the draft to an LLM or overwrite the pasted/file content.

## 10. `analyze_context` orchestration

```typescript
function analyzeContext(input: AnalyzeInput, ctx: EngineContext): AnalyzeResult {
  const original = input.text;
  const originalTokens = ctx.counter.countExact(original);
  const indexed = indexLinesLosslessly(original, ctx.limits);
  const findings = detectAll(original, input.contentType, indexed, ctx.limits);
  const recommendations = rankRecommendations(
    makeBoundedRecommendations(findings, ctx.limits),
    input.taskDescription,
  );
  let draft: DraftProposal | null = null;
  let draftStatus: DraftStatus = input.includeDraft ? "no_safe_change" : "not_requested";
  if (input.includeDraft) {
    if (!isDraftEligibleSource(original, input.contentType, indexed)) {
      draftStatus = "not_eligible";
    } else {
      const proposal = proposeDuplicateParagraphDraft(original, input.contentType, indexed, ctx.limits);
      if (proposal) {
        const counts = countPair(original, proposal.candidate, ctx.counter);
        if (fitsFullOutput(proposal, counts, ctx.limits)) {
          draft = buildReviewableDraft(proposal, counts, ctx.limits);
          draftStatus = "available";
        } else draftStatus = "exceeds_output_limit";
      }
    }
  }
  return validateAnalyzeOutput({
    schemaVersion: "1.0", tool: "analyze_context",
    tokenization: ctx.tokenizationInfo, warnings: relevantWarnings(...),
    result: {
      originalTokens,
      originalBytes: new TextEncoder().encode(original).byteLength,
      findings, recommendations, draft, draftStatus,
    },
  });
}
```

**Note:** `...` and `relevantWarnings` are placeholders; this block specifies composition, not a copy-paste executable module. Enforce request limits before entry and safe output bounds at exit. Unusable tokenizer results become tool errors rather than incomplete successes.

## 11. `suggest_optimizations` orchestration

- Accept Document 07 text, source-kind and optional task description.
- Return token count, bounded findings and **advice only**.
- `recommendations[].evidence` uses line ranges with `snippet: null`.
- No draft object, rewritten content, estimated removal volume, or invented percentage.
- If none of the rules fires, respond truthfully: no confirmed structural issue found, not a promise of optimal context.
- Advice for JSON/log/code/MCP schema must be phrased as *developer review steps* (filter response fields, isolate errors, use scoped tools), never executable automated transformations.

## 12. `compare_tokens` orchestration

```typescript
function compareTokens(input: CompareInput, ctx: EngineContext): CompareResult {
  // Original: validated nonempty. Candidate: validated string including "".
  const counts = countPair(input.original, input.candidate, ctx.counter);
  const warnings = ["Token reduction does not prove meaning preservation or lower total cost."];
  if (input.candidate === "") {
    warnings.push(
      "Candidate is empty. Any 100% arithmetic reduction may erase all useful context."
    );
  }
  return {
    schemaVersion: "1.0",
    tool: "compare_tokens",
    tokenization: ctx.tokenizationInfo,
    warnings,
    result: {
      ...counts,
      candidateSource: "caller_supplied",
      semanticEquivalenceVerified: false,
      reviewRecommended: true,
    },
  };
}
```

A candidate with more tokens yields a negative delta and `outcome: "increased"`. An unchanged count yields `"unchanged"` even if content differs. A 100% arithmetic reduction from an empty candidate **must not** display as a validated optimized draft on the website, since the website's draft flow requires a valid PARE-generated proposal.

## 13. Error and resource-budget matrix

| Situation | Outcome | Required behavior |
|---|---|---|
| Missing/empty analysis text | `INVALID_INPUT` | No counts; short safe message |
| Empty compare original | `INVALID_INPUT` | Reject, even if candidate nonempty |
| Empty compare candidate | Successful comparison + strong warning | Never label semantics as preserved |
| Oversized request/text/combined compare | `INPUT_TOO_LARGE` | Reject before tokenization |
| Unsupported/binary material | `UNSUPPORTED_CONTENT` | No binary decoding or PDF processing |
| Tokenizer unavailable/failing | `TOKENIZER_UNAVAILABLE` | No misleading estimate fallback |
| Work/line/paragraph budget exceeded | `RESOURCE_LIMIT` | Bounded error, no partial fabricated result |
| Candidate too large to return | Success with `draftStatus: "exceeds_output_limit"` | No truncated draft; findings still valid |
| Unexpected bug | `INTERNAL_ERROR` | Redacted error, no source text or stack in client response |
| Unauthorized endpoint | HTTP/auth-layer rejection | Do not present as successful MCP tool result |

Match error schemas and HTTP/protocol layering to Document 07. The public website is accessible; analyzer API is protected during beta; MCP is invite-only. Auth mechanisms remain architectural decisions for Document 09 and client testing. No per-user history is available without storage.

## 14. Edge cases and required decisions

| Case | Expected v1 behavior |
|---|---|
| Empty or whitespace-only analysis text | A nonempty whitespace-only string may count, but return no draft and appropriate informational warning; truly empty text is invalid. |
| Same paragraph twice with different casing | Finding may flag similarity only if bounded heuristic supports it; **no edit**. |
| Same paragraph with CRLF vs LF | Not exactly identical, so **no edit**. |
| Identical paragraphs with one trailing space difference | **No edit**; exact match required. |
| Repeated one-word heading | **No edit**; heading/short-content guard. |
| Identical Markdown list entries | **No edit**. |
| Repeated code fences or code lines | **No edit**. |
| Repeated legal/safety warnings | **No edit**, even if exact. |
| Repeated log errors | Advice only; frequency may be meaningful. |
| Repeated JSON array objects | Advice only; duplicates may be valid records. |
| Paragraph inside quotation/blockquote | **No edit**. |
| Emoji and combining characters | Count exact string; offset-to-line mapping must remain correct. |
| Mixed RTL/LTR | Count exact string; line references not dependent on display direction. |
| Unicode normalization variants | No equivalence normalization for draft matching. |
| Very long unbroken line | Limit/guard; avoid catastrophic regex or giant diff allocations. |
| Huge repeated paragraphs beyond budgets | Bounded/resource failure or no draft; never unbounded map growth. |
| Empty comparison candidate | Return measured zero candidate tokens and prominent warning. |
| Candidate greater than original | Negative delta, `increased` label. |
| Zero token result for nonempty text | Tokenizer error, never synthetic valid result. |
| Draft deletion leaves blank document | Reject draft. |
| Draft text fails outbound size cap | Return no draft, `exceeds_output_limit`. |
| Task hint contains secrets | Do not echo the task; treat as private, capped text. |
| Same document via website and MCP | Shared-core result content must be materially identical for matching inputs/config. |

### 14.1 Performance and failure philosophy

The tool should prefer **predictable bounded refusal** over an unresponsive Worker or incorrect optimization. Do not truncate input silently. Do not silently skip unprocessed segments and claim a complete scan. If only a bounded scan was performed, either represent that limitation transparently within allowed warnings or treat the operation as a resource-limit failure, depending on the public contract and implementation ability.

## 15. Algorithmic complexity and Cloudflare constraints

| Stage | Target complexity | Guard |
|---|---|---|
| Raw request and JSON parse | O(n) | Raw bytes + parsed field caps |
| Token count | Approx. O(n) with tokenizer-dependent factors | Encoding initialization and benchmark gate |
| Line indexing | O(n) time, O(lines) spans | `MAX_LINES` |
| Paragraph segmentation | O(n) | `MAX_PARAGRAPHS` and maximum paragraph size |
| Exact duplication detection | Expected O(n) with bounded hash+equality; pathological repeats can be worse | Candidate/hash buckets, max comparisons and length caps |
| Keyword hint ranking | O(k × r) bounded | Limit task terms `k`, recommendations `r` |
| Building deletion-only candidate | O(n + edits) | At most `MAX_EDITS` |
| Full diff in browser | Potentially expensive depending on algorithm | Cap comparison size and avoid high-cost quadratic algorithms |
| JSON/log/schema inspection | O(n) bounded | Depth/node/line and output caps |

**No fixed latency guarantee yet:** Document 05/06 explicitly defer numeric CPU, memory, byte and latency targets until measured in `wrangler dev` and staging. Measure cold/warm encoder initialization, large Unicode input, duplicate-heavy cases, invalid JSON and concurrency. Avoid claiming Cloudflare free-tier suitability until the bundle and runtime budget have passed.

The deployed Worker should contain static assets and `/api/*` plus `/mcp` Worker-first routes as Document 06 requires; core engine itself is transport-independent.

## 16. Deterministic test fixtures

Fixture token numbers should be generated by the tested tokenizer; **do not hardcode illustrative guesses as expected counts**. Keep checked-in fixtures synthetic and non-sensitive. For each test, assert stable shape, bounded output and line references.

### 16.1 Core fixtures

| ID | Fixture | Expected result |
|---|---|---|
| F01 | Plain text, 2 substantial identical prose paragraphs separated by blank line | Finding; with opt-in, available draft if all gates pass; one later duplicate removed; review required |
| F02 | F01 with `includeDraft: false` | Findings allowed; `draft: null`, `not_requested` |
| F03 | F01 but casing differs | No automatic edit |
| F04 | F01 but trailing whitespace differs | No automatic edit |
| F05 | Identical short headings | No edit; avoid duplicate-prose false positive |
| F06 | Ordinary unique text | No invented findings/savings; `no_safe_change` if draft requested |
| F07 | Markdown list with duplicate bullets | Advice only, `not_eligible` |
| F08 | Markdown fenced code with repeated paragraph-like prose | No edit |
| F09 | JavaScript code with repeated statements | No edit |
| F10 | Python comments repeated verbatim | No edit |
| F11 | JSON array with duplicate values | No edit; optional verbosity advice |
| F12 | Repeated `.log` error messages | No edit; frequency not erased |
| F13 | MCP tool schema with long descriptions | Recommendation only; no schema rewrite |
| F14 | Plain prose with excessive blank lines, no duplicate | **No edit** under approved paragraphs-only policy |
| F15 | Three identical eligible paragraphs | Retain first; remove later ones only when safe and within edit/output limits |
| F16 | Duplicate legal/safety clauses | No edit under guard |
| F17 | Two prose blocks separated by CRLF/LF differences | No edit if literal strings differ |
| F18 | Emoji + RTL + combining marks | Stable counts, accurate zero-based line spans |
| F19 | Huge paragraph/line beyond caps | Bounded error or no draft; no stall |
| F20 | `compare_tokens`: original nonempty, candidate `""` | Successful arithmetic result and emphatic warning; `semanticEquivalenceVerified: false` |
| F21 | Candidate longer than original | Negative delta; outcome `increased` |
| F22 | Different strings with equal token counts | `unchanged` count, no semantic equivalence claim |
| F23 | Task `debug login` + code file | Rank relevant advice using keywords; no rewriting |
| F24 | Task omitted | Stable base-order recommendation ranking |
| F25 | Optional task containing a fake secret | No task text in result/log/error |
| F26 | Tokenizer intentionally fails | `TOKENIZER_UNAVAILABLE` or supported bounded error; no guessed count |
| F27 | Candidate exceeds outbound bytes | `exceeds_output_limit`, no truncated `draft.text` |
| F28 | Repeat identical input through API and MCP | Equivalent core result semantics and tokenizer basis |
| F29 | Malformed JSON claimed `json` | Safe error/advice-only per input-format rule; no edit |
| F30 | Sensitive string inside duplicate prose | Only permitted opt-in draft text can contain it; all evidence snippets `null`; no logs |

### 16.2 Property-based tests

- Draft is a deletion-only subsequence of original after allowed exact-duplicate removal, with first occurrence preserved.
- Every emitted change refers to an existing original line span; spans sorted or stable, no overlaps.
- `draftStatus === "available"` iff `draft` is nonnull; all nonnull drafts `requiresReview === true`.
- Draft change kinds in v1 are **only** `duplicate_prose_removed`.
- `suggest_optimizations` and `compare_tokens` never contain full source/candidate echoes.
- Recommendations and evidence objects always have `snippet: null`.
- `originalTokens`, `candidateTokens` and delta exactly match tokenizer calls; percentage math matches signed delta.
- Empty compare candidate succeeds with warning; empty original fails.
- Mutating `taskDescription` alone never changes draft content or deletion eligibility.
- Re-running with same config gives identical core results.
- Structured response validates against exact Document 07 Zod output schemas.

### 16.3 Quality checks (not model-semantic claims)

The tests above prove deterministic contract behavior, not that shortened prompts always perform equivalently in a downstream AI model. If future human evaluation or benchmark suites are introduced, track them separately as **quality evaluations**, not automatic guarantees of semantic preservation.

## 17. Reference implementation skeleton (non-executable integration blueprint)

```typescript
export type SourceKind =
  | "plain_text" | "markdown" | "json" | "javascript"
  | "typescript" | "python" | "log" | "mcp_tool_schema";

export interface EngineLimits {
  maxRequestBytes: number;
  maxTextBytes: number;
  maxTaskBytes: number;
  maxOutputBytes: number;
  maxComparisonBytes: number;
  maxLines: number;
  maxParagraphs: number;
  maxFindings: number;
  maxRecommendations: number;
  maxEdits: number;
}

export interface EngineContext {
  counter: TokenCounter;
  limits: EngineLimits;
  tokenizationInfo: {
    encoding: "o200k_base";
    precision: "encoding_count" | "model_estimate";
    targetModel: string | null;
    note: string;
  };
}

// Implement these as pure functions; bind them to API and MCP adapters:
export function analyzeContext(input: AnalyzeInput, ctx: EngineContext): AnalyzeResult;
export function suggestOptimizations(input: SuggestInput, ctx: EngineContext): SuggestResult;
export function compareTokens(input: CompareInput, ctx: EngineContext): CompareResult;
```

Types such as `AnalyzeInput`, `AnalyzeResult`, etc. refer to Document 07's actual Zod-derived types and are **not** duplicated definitions in this spec. Concrete functions above are illustrative declarations; TypeScript stubs require bodies and compatible imports.

## 18. Release gates and acceptance checklist

### Counting and determinism
- [ ] A single version-pinned tokenizer imports in `wrangler dev` and deployed staging Worker.
- [ ] Exact encoding-count test vectors pass for English, Unicode, code, JSON and empty candidate.
- [ ] Cold-start/bundle/CPU/memory gates pass at tested caps; no character/4 fallback.
- [ ] Website and MCP use the same core and counts.

### Detection and recommendation
- [ ] Every emitted finding is grounded in a structural detector and valid line evidence.
- [ ] Evidence `snippet` always null; user-supplied task/source never echoed in findings or errors.
- [ ] Optional task keyword rank is deterministic, bounded, and never alters draft permissions.
- [ ] Advice covers relevant categories without inventing numeric savings.

### Draft safety
- [ ] `includeDraft` defaults to false and gates every proposal.
- [ ] Only exact duplicate standalone prose paragraphs may be removed in v1.
- [ ] No automated blank-line collapse, code/JSON/log/Markdown schema rewrite or unique-section truncation.
- [ ] All edits deletion-only and review-required; original preserved.
- [ ] Full draft and both real counts fit output limit; else no draft.
- [ ] Website enforces open/inspect full diff before copy; MCP flags review guidance.

### Security, privacy, operations
- [ ] No application DB, remote model calls, hidden file reads, telemetry of prompt content or unapproved storage.
- [ ] Protected analyzer API and invite-only MCP request guards are in place.
- [ ] All size/cpu/output limits configured and verified; excess input rejected explicitly.
- [ ] Synthetic fixtures, error fuzzing and auth/client compatibility checks pass.

## 19. Decisions to resolve before Document 09 — Security & Privacy

These are **questions for approval**, not features silently added to the v1 design. The first option for each is the lightweight recommendation.

**S09-1 — Beta authentication method.** Should we use **Cloudflare Access** for approved beta testers, provided MCP client authentication interoperability tests pass, or use a separate bounded bearer-token access method if Access is incompatible? Access can require external authentication steps; this must be tested with actual clients before committing.

**S09-2 — Website analyzer beta protection.** Should the public landing page offer analysis only to approved testers initially, with a short "Beta access required" explanation, or allow low-volume anonymous analysis from day one? Existing Documents 05–07 favor a public site but **protected analyzer**.

**S09-3 — Privacy and logs.** Should the default be **zero application-level request-body logging**, with only status/category/duration/correlation IDs collected when necessary (recommended), or allow opt-in redacted diagnostics? Cloudflare/platform/security logging must be audited separately; "process in memory" must not be advertised as absolute zero retention.

**S09-4 — Rate limits without database.** Should we use managed Cloudflare protection/rate controls (recommended if plan and feature support permit), rather than adding app-managed persistence? Numerical thresholds require staging data and product approval.

**S09-5 — Abuse and size policy.** Should all limits stay **configurable with conservative measured defaults** (approved architecture), with stricter thresholds for anonymous routes and no unbounded exception paths? Approve actual values after benchmark testing.

**S09-6 — Sensitive-user-content policy.** Should UI explicitly warn **"Do not submit secrets or confidential data you cannot share with this service"**, avoid content in telemetry/bug reports, and use in-memory processing with no account history (recommended)? Define legal/privacy copy carefully, acknowledging upstream host/client/cloud retention differences.

**S09-7 — Security response for suspicious syntax.** Should code-like, mixed, quoted or sensitive-looking prose **fail closed to recommendation-only** (recommended), rather than attempting best-effort automated edits? This design already uses fail closed and asks to carry it into security policy.

No answers are assumed beyond already approved decisions. Document 09 should resolve these before finalizing launch controls.

## 20. References and change record

### PARE source documents (project authority)

- `01-product-overview.md` — product purpose, audiences, six problems, no stored history, transparency about model-dependent usage.
- `02-problems-and-solutions.md` — problem taxonomy and careful prose editing; general consideration of blank lines superseded by owner-approved **paragraphs-only** policy here.
- `03-brand-guidelines.md` — approved PARE identity, source logo, sampled dark navy/lime visual tokens and system-font typography.
- `04-ui-ux-design.md` — single-page UI, paste-first inputs, optional collapsed task description, stacked results, mandatory full diff review before copy.
- `05-tech-stack.md` — npm, TypeScript, Wrangler, official MCP SDK v2, Zod, Vitest, `js-tiktoken` candidate, one Worker, no database.
- `06-system-architecture.md` — protected analyzer, invite-only MCP, stateless shared core, Worker-first routes, configurable limits.
- `07-mcp-tools.md` — three tool names, Zod input/output fields, `structuredContent` + summary text, error enums, and dual count semantics.

### Public implementation references (reviewed previously for Documents 05–07)

- [MCP TypeScript SDK — First server](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server)
- [MCP TypeScript SDK — Web-standard serving](https://ts.sdk.modelcontextprotocol.io/v2/serving/web-standard)
- [Cloudflare Workers — Platform limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers — Static assets](https://developers.cloudflare.com/workers/static-assets/)
- [js-tiktoken](https://www.npmjs.com/package/js-tiktoken)

**Change record:** 18 November 2026 — v1 design created. Owner decisions: `paragraphs`, `keywords`, `allow` empty comparison candidate, and `lines` evidence. This document deliberately avoids claims that code has been executed, model-token bills have been observed, or Cloudflare benchmarks have already passed.
