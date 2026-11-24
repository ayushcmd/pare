# PARE — Problems & Solutions

**Document:** `02-problems-and-solutions.md`  
**Version:** 1.0 (implementation-oriented working specification)  
**Status:** Draft for review; product decisions D04/D05 resolved by user  
**Prepared:** 18 November 2026  
**Depends on:** [`01-product-overview.md`](./01-product-overview.md)  
**Next:** `03-brand-guidelines.md`

> **Implementation update (23 November 2026):** The active build follows [`00-implementation-baseline.md`](./00-implementation-baseline.md): browser-local framework-free TypeScript by default and two MCP tools (`analyze_context`, `compare_content`). Product safety rules in this document remain authoritative.

> **Brand promise:** Keep what matters. Cut the rest.

---

## 1. Purpose and authority

This document translates the six problem areas in the approved PARE product overview into specific, beginner-implementable behaviors. It describes how PARE should recognize avoidable context overhead, explain it, and optionally generate a **safe, reviewable** cleaned draft. It is a product behavior specification, **not** a claim that automatic shortening preserves model quality in every case.

**Confirmed decisions carried from Document 01:**

- Product: **PARE**, AI Context & Token Optimization MCP; user-provided lime three-bar logo on deep navy remains the authoritative brand asset.
- Users: everyday AI users **and** developers/agent builders, with a developer-first launch.
- Frontend: HTML, CSS, vanilla JavaScript. Backend: TypeScript in Cloudflare Workers. MCP via official TypeScript SDK; no database, extra AI model, or other backend service for v1.
- Inputs: pasted UTF-8 text plus lightweight text/code files; precise extension allowlist remains a decision.
- Privacy: transient in-memory processing by application code; no account, history, or intentional content persistence; do not promise zero retention across infrastructure and AI clients.
- Optimization: recommendations **plus optional cleaned output**, shown with a diff before the user chooses whether to copy/use it.
- **D04 resolved — cleanup policy: SAFE.** Only conservative transformations qualify for generated cleanup drafts. Higher-risk ideas are recommendations only.
- **D05 resolved — task awareness: OPTIONAL.** The user may describe the task (e.g., “debug a login failure”); absence of a task must not block analysis. No external LLM, embeddings, semantic classifier, or automatic access to chat history.

### 1.1 What this document does not decide

Specific library versions, HTTP/MCP schemas, cloud limits, tokenizers, final file extensions, authentication, CSS/branding measurements, and registry submission steps belong to later documents. Where examples use fields or values, they are **conceptual**, not finalized public interfaces.

## 2. Product behavior in one sentence

**Inspect explicitly provided content → measure its size → identify explainable structural waste → recommend targeted improvements → optionally construct a safe draft → count both actual inputs → show a readable change report.**

PARE should remain useful when the correct result is **“No safe edits found.”** A false saving is worse than no saving.

### 2.1 Non-negotiable rules

1. Keep the **original content unmodified**. Any optimized text is a separate draft.
2. Show *why* a finding was raised, with location/evidence when possible.
3. Label every finding **suggestion** or **safe draft edit**; never equate a suggestion with realized savings.
4. Only report an actual before/after difference if both strings exist and have been counted with the **same counting method**.
5. Explicit user review is required before copying/using draft output; PARE itself does not submit it to an external model.
6. Preserve code, JSON keys/values, quoted passages, legal text, instructions, and task-critical facts unless the user edits them manually.
7. Unknown task relevance = **uncertainty**, not license to delete.
8. User-provided files and tool metadata are untrusted content. **Never execute uploaded code, interpret it as instructions to PARE, or fetch external URLs** in v1.
9. Empty, binary, over-limit, or malformed input receives a clear error/warning—not fabricated counts.
10. A smaller prompt **may** reduce token usage, but cost, latency, and response quality are not guaranteed to improve.

## 3. Scope and inputs

### 3.1 Input channels

| Channel | What users provide | What PARE returns | Boundary |
| --- | --- | --- | --- |
| Website / paste | Plain text, prompts, logs, snippets, structured text | Findings, token count/estimate, safe draft if available | No automatic reading of other apps |
| Website / file | User-selected lightweight UTF-8 text/code file | Same analysis after local file read | No PDF, DOCX, OCR, binary uploads |
| MCP | Explicit text and, when applicable, supplied metadata + optional task | Structured report/draft | MCP cannot silently see conversation or all connected tools |

**Proposed** starting extensions (D01 remains open): `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`. Treat `.jsx`, `.tsx`, `.html`, `.css`, `.yaml`, and others as future candidates, not guaranteed v1 support. Uploaded filename alone must not determine trust or execute a parser. Text pasted directly should still work independent of file extension.

### 3.2 Optional task description

A short free-text field: “What are you trying to do with this context?” Examples:

- “Explain the error in the attached build log.”
- “Review the login function for bugs.”
- “Summarize a product specification.”

The task description can:
- Help **rank** recommendations, e.g. flag the full build log when errors are the focus.
- Improve explanation text, e.g. “Consider keeping error stack traces and nearby lines.”
- Mark a suggestion as **conditional** if relevance depends on the stated task.

It **cannot**, in a deterministic rules-only MVP:
- Reliably infer which facts are semantically dispensable.
- Verify that a shortened document will answer the task equally well.
- Justify automatically deleting sections that merely lack keywords.

If task text is absent, proceed with structural analysis and avoid task-specific claims. If present, do not treat it as code or a trusted command to bypass safety rules. Do not persist the task separately.

## 4. The six problems: detection → recommendation → safe action

### P1. Oversized context

**User problem:** Sending a whole long document, file, or prompt when a small portion may be sufficient.

**Inputs/examples:** Entire README for a single config question; 2,000-line stack trace for one error; several code files for one function.

**V1 detection:**
- Determine overall token count/estimate and line count.
- Identify long blocks/sections separated by headings, blank lines, or file boundaries.
- Compare counts to a **configurable warning threshold**; do not hardcode a provider context-window limit before tokenizer/model selection.
- If optional task is supplied, show it in explanatory copy and suggest *reviewing* task-relevant sections; do not automatically perform semantic retrieval.

**User-facing advice:** “This input includes long sections. Consider sharing the relevant heading and supporting definitions rather than the complete document.”

**Safe draft action:** **None solely because a section is long.** Flag for user selection. Removing unspecified paragraphs, code blocks, or context is not safe by default.

**Risks:** Removing a dependency, exception, definition, or disambiguating detail may hurt answers.

**Acceptance tests:** A large unique document triggers a size recommendation but has zero automatic deletions. A small document does not get a false “too large for your model” assertion.

### P2. Repeated instructions and duplicated content

**User problem:** The same content is pasted more than once and consumes tokens unnecessarily.

**Examples:** Two exact copies of a non-code paragraph; repeated setup instructions in study notes; duplicated introductory blurb.

**V1 detection:**
- Find exact repeated **non-code** paragraphs/blocks after conservative normalization for comparison (e.g. line-ending normalization and surrounding blank-space handling).
- Preserve source positions; do not mutate the underlying original during detection.
- Distinguish adjacent duplicate paragraphs from repeated lines with structural meaning.
- Avoid treating single words, headings, punctuation, list items, table rows, or code lines as safe duplicates merely because they repeat.

**Recommendation:** “Paragraph repeated twice. Review whether the second copy is needed.”

**Safe draft action:** May remove a second **identical, standalone prose paragraph** only where the text is not inside code fences, JSON/YAML/XML, Markdown tables, quoted blocks, templates, or other syntax-sensitive sections; both paragraphs must contain substantial text (minimum length configurable). Mark the edit and return exact before/after output with diff. **Even this edit is review-required** because repetition might be deliberate.

**Special cases requiring recommendation-only behavior:** Repeated user instructions for emphasis; emphasis in poetry; quoted evidence; repeated test fixtures; identical log lines where frequency matters; repeated code statements; duplicated rows representing separate real records.

**Acceptance tests:** Identical prose paragraphs can produce a reviewable candidate; repeating an `if` statement in source code, two identical JSON array entries, or repeated error lines cannot be silently removed.

### P3. Noisy Markdown, text, and code files

**User problem:** Input includes peripheral file content, generated banners, navigation, verbose comments, or irrelevant sections.

**V1 detection:**
- Recognize Markdown headings, fenced code blocks, sections, and repeated prose where practical.
- Report large comments, banner-like sections, or sections markedly longer than neighboring sections **as suggestions**, not as definitively irrelevant.
- Recognize a supplied source-code file or code fence and apply stricter “do not change code” policy.
- Keep line numbers/section labels in findings for easy review.

**Recommendation:** “You may be able to provide only the `Authentication` section with its related code sample.”

**Safe draft action:** No automatic source-code deletion, import removal, minification, or comment stripping in v1. Prose-only exact duplicate cleanup may apply outside code structures.

**Risks:** Code comments can specify security assumptions; imports can be required; Markdown references, footnotes, and links may be used elsewhere.

**Acceptance tests:** Markdown code fences remain intact; leading indentation and whitespace in code remains unchanged; deleting a README section is only proposed, never executed by safe mode.

### P4. Verbose JSON, API responses, and terminal logs

**User problem:** Sending entire structured API payloads or raw logs when the task likely needs fewer fields or lines.

**V1 detection:**
- If valid JSON is provided, inspect only **structure** and compute count of keys, depth, repeated object shapes and approximate size of large fields. A simple parse is optional if it remains lightweight.
- For logs, detect high line counts, repeated line formats and excessive output volume.
- Highlight likely bulk arrays or large raw payloads without asserting fields are irrelevant.
- If parsing fails, continue as text with an “unstructured or invalid JSON” note; do not attempt to auto-repair user data.

**Recommendations:** “Filter the API response upstream to fields you need”; “Ask the agent/tool for the failing command, error lines, and nearby context”; “Use pagination or bounded output where available.”

**Safe draft action:** **Never** delete JSON keys, array elements, null values, log lines, or stack frames automatically in v1. A compact JSON serialization could theoretically reduce whitespace, but should **not** be enabled until verified against user readability and exact structure requirements; treat as future decision.

**Risks:** Duplicate events may represent multiple occurrences; dropped keys or log lines can remove evidence; compacting structured data may hurt readability.

**Acceptance tests:** Original JSON parses identically before and after (since no automatic edits). Repeated log lines result in suggestions, not loss of frequency information.

### P5. Bloated MCP tool definitions

**User problem:** Tool descriptions/schemas passed to an AI client may be verbose or redundant.

**V1 inputs:** A developer explicitly pastes/passes tool metadata or a JSON schema-like representation. PARE does **not** connect to or enumerate other MCP servers automatically.

**V1 detection:**
- Count available tool description text and schema-related text in supplied metadata.
- Flag repeated description phrases, unusually lengthy prose, and closely repeated explanatory sections using transparent structural rules.
- Identify potential opportunities to shorten wording or narrow tool exposure. Do not claim tool discovery behavior that the client doesn't support.

**Recommendations:** “Replace repetitive prose with a concise, unambiguous operation description”; “Group related tools or enable on-demand discovery if supported by your MCP host.”

**Safe draft action:** **Suggestions only** for tool contracts and schemas. Do not rewrite tool names, parameter schemas, required fields, security warnings or tool descriptions automatically in v1; small wording changes can modify tool-calling behavior.

**Risks:** Truncated instructions can lead to incorrect tool invocation. Different clients serialize/load tool schemas differently, so local estimates may not equal the model's actual prompt overhead.

**Acceptance tests:** Input metadata yields advisory findings; no schema mutation occurs; estimates explicitly state what text was counted.

### P6. Unknown outcome of optimizations

**User problem:** Users cannot tell whether a proposed revision is smaller or what information disappeared.

**V1 behavior:**
- Count the exact original content that was analyzed.
- If safe draft exists, count that exact draft using the **same** tokenizer/approximation.
- Calculate `saved_tokens = original_tokens - draft_tokens` and `reduction_percent = saved_tokens / original_tokens × 100`, provided the original count is positive.
- Show a readable diff or before/after change list, even if the draft is identical.
- Distinguish **draft reduction** from **speculative suggestion**. There is no numerical saving for an unapplied recommendation.
- If no safe draft was generated, show `no measured draft reduction` (not an invented 25% opportunity).

**Risk:** Fewer input tokens does not prove lower bill, better accuracy, lower latency, or preserved quality.

**Acceptance tests:** Same input to website API and MCP core gives consistent counts; no division by zero; no negative savings marketed as a reduction; estimated-token language visible when appropriate.

## 5. Safe cleanup policy: explicit boundaries

### 5.1 Recommended transformation classes

| Class | Example | Safe draft in v1? | Why |
| --- | --- | --- | --- |
| Exact duplicate *standalone prose* block | Same multi-sentence paragraph pasted twice | **Conditional yes**, review required | Locally verifiable duplicate; may still be intentional |
| Extra blank lines in ordinary prose | Four consecutive blank lines between paragraphs | **Conditional yes**, review required | Usually formatting-only, but avoid code/poetry/templates |
| CRLF vs LF normalization | Windows vs Unix line endings | **No savings claim by itself** | Can aid internal analysis, but original must remain intact |
| Remove any unique section | Full unrelated chapter | **No** | Relevance not verifiable with simple rules |
| Truncate log lines | Keep last 50 lines | **No** | Could remove primary failure evidence |
| Remove source code comments/imports | Strip comments | **No** | Can change meaning/security requirements |
| Shorten JSON/API response | Drop fields | **No** | May remove relevant evidence or alter contract |
| Shorten tool descriptions | Rewrite parameter instructions | **No** | Can alter tool-use quality or safety |
| Reword prompts with an LLM | Summarize text | **No** | Outside no-external-AI MVP |

**Implementation guard:** If the analyzer cannot classify text confidently as standalone prose outside structural/syntax-sensitive regions, **do not generate a draft edit**. Report a suggestion instead.

### 5.2 Exact edit process

1. Parse/detect candidate region on a *working copy*; store original unchanged.
2. Ensure region is substantial standalone prose (not code, structured data, log, quoted material, or table).
3. Check exact equivalence under a narrow, documented normalization rule.
4. Build proposed draft by removing **only** the subsequent duplicate or reducing redundant blank lines, preserving all other bytes/characters to the extent feasible.
5. Generate a change list with **removed text snippets or bounded previews**, line ranges, and rationale.
6. Count original and draft using identical counting method.
7. If draft becomes larger, report that plainly and do not label it savings.
8. Return `review_required: true`; never apply edits to user files or send revised content to another model.

### 5.3 What “safe” means here

“Safe” is a **conservative product policy**, not a formal guarantee that the user's task is unaffected. Even removing duplicate prose can change emphasis or evidence. Every change remains opt-in.

## 6. Recommendation quality and prioritization

Every finding should answer:

- **What:** Name the problem (`duplicate_prose`, `large_section`, `verbose_log`, `tool_description`, etc.).
- **Where:** Point to a line span, section, field, or block whenever possible.
- **Why:** Explain the concrete pattern observed, not a speculative motive.
- **How:** Give one practical action the user can take.
- **Evidence:** Show observed counts or duplicate examples (bounded preview).
- **Confidence:** `high`, `medium`, `low` based on structural detection certainty.
- **Information-loss risk:** `low`, `medium`, `high`; this is separate from confidence.
- **Change status:** `draft_applied`, `suggested_only`, or `informational`.

Suggested ordering: reliable, low-risk, high-impact findings first; then medium-risk; then high-risk strategic suggestions. Do not rank a conjecture above a proven duplicate merely because its theoretical savings might be larger.

### 6.1 Illustrative risk matrix

| Scenario | Confidence | Risk | Behavior |
| --- | --- | --- | --- |
| Two exact lengthy prose blocks | High | Low to medium | Optional reviewed draft (subject to guards) |
| Many blank lines between prose paragraphs | High | Low | Optional reviewed draft (outside protected regions) |
| Long unique Markdown section | High (size) | High (deletion) | Recommend targeted selection, no deletion |
| Large source-code comment | High (size) | High | Recommend manual review, preserve code |
| Repeated log lines | High (pattern) | High (meaning) | Recommend filtering upstream, no deletion |
| Verbose tool descriptions | Medium | Medium/high | Suggest editorial review only |

## 7. Website experience: expected states

The exact UI design belongs to Document 04; this is the behavioral contract.

1. **Empty:** Text area and optional local file input; optional task description. Clear size/type guidance.
2. **Input ready:** Show what will be analyzed; no automatic remote submission on file selection.
3. **Analyzing:** Show bounded loading state; disable duplicate submits.
4. **Results:** Show original tokens (or estimate), categories and explanations; possible safe cleaned draft; diff; risks and copy control.
5. **No safe changes:** Say “No safe automatic changes found,” still show useful recommendations.
6. **Invalid/unsupported:** Report binary/unsupported file, unreadable UTF-8, malformed relevant structure, or excessive size with next steps.
7. **Failure:** Explain timeout/network/server error without displaying sensitive input or pretending success.

User-visible notices should explain: uploaded text is transmitted to the Cloudflare endpoint for analysis; PARE does not intentionally persist the content; infrastructure and AI clients may have independent retention behaviors.

### 7.1 Example microcopy

- **No task:** “Optional: tell us what you need this text for. We'll use it to tailor suggestions.”
- **Potential duplicate:** “This paragraph appears twice. Review removing the second copy.”
- **High-risk recommendation:** “This may save context, but we can't verify the section is unnecessary.”
- **No draft:** “We found areas to review, but no changes we can safely prepare automatically.”
- **Count uncertainty:** “Estimated tokens using [method]; your AI provider may tokenize this differently.”
- **Review:** “Inspect the highlighted changes before copying.”

## 8. MCP experience and parity requirements

Conceptual tool responsibilities inherited from Document 01 (final names and JSON schemas will be set in Document 07):

| Proposed tool | Behavior |
| --- | --- |
| `analyze_context` | Return measured/estimated input size, structural findings, warnings, and optional task-conditioned explanation |
| `suggest_optimizations` | Return actionable recommendations and optional safe draft with review metadata |
| `compare_tokens` | Count two explicitly supplied strings with the same counting method and report a verified difference |

**Consistency rule:** Website `/api/analyze` and MCP tools must call shared analysis functions. For identical content, options, and tokenizer, the underlying counts/findings must not drift.

**Privacy boundary:** The MCP host controls what it sends. The server must not claim visibility into hidden system instructions, earlier chat messages, other tools or API spend unless explicitly supplied. The returned safe draft is *data for review*, not a command to replace a user's prompt.

## 9. Conceptual output model (NOT the final API schema)

```json
{
  "status": "ok",
  "analysis_method": "deterministic-rules",
  "token_count": {
    "kind": "estimate",
    "tokenizer": "to-be-selected",
    "original": 842,
    "draft": 780,
    "difference": 62,
    "reduction_percent": 7.36
  },
  "findings": [
    {
      "type": "duplicate_prose_block",
      "location": "lines 28-32",
      "evidence": "The same standalone paragraph appears twice",
      "recommendation": "Review removing the second copy",
      "confidence": "high",
      "risk": "low",
      "status": "draft_applied"
    },
    {
      "type": "large_section",
      "location": "section: Reference Notes",
      "recommendation": "Consider supplying only sections relevant to your task",
      "confidence": "high",
      "risk": "high",
      "status": "suggested_only"
    }
  ],
  "review_required": true,
  "draft_available": true,
  "draft_text": "<redacted example placeholder>",
  "changes": [{ "kind": "remove_duplicate", "location": "lines 28-32" }]
}
```

**The numbers are illustrative, not real tokenizer output.** A production result should avoid claiming a specific percent unless original and actual draft were counted. A real response may omit `draft` and `reduction_percent` if no draft is available. Final identifiers, fields, and data types are subject to Document 07.

### 9.1 Sample task scenarios

**Scenario A — Repeated prompt paragraphs**

Input: identical long instruction paragraph twice. Task: “Make this prompt concise.”

Expected: identify duplicate; offer a reviewable draft removing only the duplicate; show exact before/after counts and diff. Do **not** assert the model will behave identically.

**Scenario B — Large source file**

Input: 1,500 lines of TypeScript. Task: “Explain the login error.”

Expected: mark size; recommend supplying the failing function, related definitions, and stack trace. **No code edits** or asserted automatic savings.

**Scenario C — API JSON**

Input: JSON containing a huge `events` array. Task: “Find the failed payment event.”

Expected: advise upstream filter/pagination or relevant-field selection. No automatic deletion. Say task filtering would need manual/user-side action.

**Scenario D — Terminal logs**

Input: repeated stack traces. Task omitted.

Expected: flag volume and repetition as a suggestion. Preserve repeated lines because occurrence count might matter.

**Scenario E — MCP schema**

Input: tool metadata with long repeated descriptions.

Expected: show areas to review. Do not rewrite parameter contracts or claim to reduce tokens inside another MCP host by itself.

**Scenario F — No duplicates**

Input: short, unique paragraph.

Expected: correct token count/estimate; no artificial problem; no cleaned draft if there are no safe edits.

## 10. Measurement and reporting honesty

### 10.1 Token counts

- Use a selected, tested tokenizer for supported models; otherwise mark counts as estimates.
- Counting Markdown vs. HTML vs. PDF cannot be meaningfully compared without fixing *what extracted text is sent to the model*. PDF processing is excluded for v1.
- Provider-specific overhead (message wrappers, tool serialization, images, caching, internal token categories) may differ from local text counts.
- Do not translate token reduction into monetary savings unless an accurate model price and billable categories have been explicitly supplied and implemented; v1 is **not** a billing calculator.

### 10.2 Formula

For original count `O > 0` and actual draft count `D` using the same method:

`difference = O - D`  
`percentage = (difference / O) × 100`

If `O = 0`, show no percentage. If `D > O`, indicate an increase rather than calling it reduction. If only a *recommendation* exists with no draft, there is **no measured saving**.

### 10.3 What PARE never promises

- Guaranteed response-quality retention.
- Automatic token interception or cross-client monitoring.
- Universal compatibility with every model tokenizer.
- Reduced spend without provider billing information.
- Automatic acceptance or installation through GitHub Registry or ChatGPT.
- Zero retention by all upstream infrastructure.

## 11. Lightweight implementation strategy

**Core functions (conceptual):**

```text
analyze(inputText, optionalTask, options)
  -> validate size and text
  -> tokenize / estimate original
  -> classify protected regions (code, JSON, logs, tables, quotes)
  -> detect structural findings
  -> propose conservative prose-only edits
  -> construct separate draft, if any
  -> tokenize / estimate actual draft
  -> return findings + diff + warnings
```

**Minimal technologies:** TypeScript rules, Worker-compatible tokenizer, Zod validation, Cloudflare Worker HTTP routing, official TypeScript MCP SDK; HTML/CSS/vanilla JS for the website. No external model call, vector store, account system, or database.

**Future document ownership:**
- Doc 04: exact UI and interaction flows.
- Doc 05: dependencies and tokenizer package.
- Doc 06: Worker routing and deployment architecture.
- Doc 07: MCP tool schemas/error contracts.
- Doc 08: parsing, detection algorithms, guardrails, exact edit semantics.
- Doc 09: retention, abuse protections, size limits and threat model.
- Doc 10: fixtures, quality tests and performance thresholds.

## 12. Edge cases and failure behavior

| Input condition | Required behavior |
| --- | --- |
| Empty string | Friendly validation; no division by zero |
| Whitespace-only text | May count/flag it; no invented meaning-preserving improvement |
| File is binary or invalid text | Reject with explicit explanation |
| Input exceeds size cap | Reject or ask user to select a smaller section; never silently truncate |
| Unsupported tokenizer/model | Return clearly labeled estimate or unsupported-model warning |
| Repeated source-code lines | No auto-removal |
| Repeated Markdown table rows | No auto-removal |
| Repeated log events | No auto-removal |
| Very large JSON body | Bounded analysis, suggestions only |
| Markdown fenced code block not closed | Assume protected region continues to end; avoid edit |
| User task conflicts with preserving a section | Suggest manual review, do not delete automatically |
| Duplicate paragraph is within a quotation | No auto-removal |
| Normalized duplicates differ in whitespace | Detect for suggestion; automatic edit only when exact-match guard is met |
| Same text submitted twice | Stateless repeatability; no retained session needed |
| Client disconnects or request times out | No persisted partial content; report error if response possible |
| API error includes submitted text | Sanitize message/log; never echo full content as diagnostic |

## 13. Acceptance criteria and test matrix

### 13.1 Functional (must pass for v1)

- [ ] User can analyze pasted text with or without a task description.
- [ ] Agreed lightweight UTF-8 text/code files can be read client-side and analyzed.
- [ ] All six problem categories have explicit **examples and boundaries**, even if some produce suggestions only.
- [ ] PARE detects exact duplicated standalone prose on a controlled fixture.
- [ ] Optional cleaned output appears only for whitelisted conservative edits.
- [ ] Original content remains unchanged and inspectable.
- [ ] Every draft edit has a reviewable explanation and diff.
- [ ] No code, JSON arrays/keys, Markdown tables, or logs are automatically shortened.
- [ ] No draft means no fabricated before/after saving.
- [ ] Token counts of both existing strings use the same counting method and are correctly labeled.
- [ ] Results from the same core logic agree across website and MCP calls.
- [ ] Unsupported files, over-limit inputs and malformed data have clear safe error states.
- [ ] No account/database/LLM integration is required for the MVP.

### 13.2 Quality (measure rather than assume)

- [ ] Curated examples include intentional repetitions, duplicated data events, and code fences to detect false positives.
- [ ] Risk categories are understandable to both developers and casual users.
- [ ] User can identify exactly what was removed from a draft.
- [ ] Performance and maximum payload are benchmarked against Cloudflare Worker constraints before release.
- [ ] Application diagnostic logs do not record raw prompt/file contents.
- [ ] MCP Inspector and at least one chosen client smoke-test supported tools.

### 13.3 Suggested fixture set

| Fixture ID | Description | Expected outcome |
| --- | --- | --- |
| F01 | Two identical full prose paragraphs | Suggest and optionally draft-removal; diff |
| F02 | Repeated `return` lines in code fence | No auto-edit |
| F03 | JSON array with identical events | Suggest-only at most; never delete |
| F04 | Huge Markdown document with unique sections | Size warning; no automatic deletion |
| F05 | Repeated build log errors | Repetition/volume finding; preserve every event |
| F06 | Verbose MCP tool description | Editorial suggestions; no schema change |
| F07 | Short unique text | No false savings |
| F08 | Task provided / omitted on same input | Same structural facts; possibly different recommendation priority |
| F09 | Empty/unsupported/binary input | Validated failure |
| F10 | Duplicate prose inside blockquote/table | No auto-edit |
| F11 | Same content via API and MCP | Same core counts/findings |
| F12 | Proposed change increases token count | No positive-savings claim |

## 14. Known limitations and trade-offs

1. **Rule-based, not semantic.** PARE cannot prove relevance or meaning retention for unique material.
2. **Not continuous monitoring.** No passive access to prompts inside third-party clients.
3. **Tokenizers differ.** Counts reflect the stated method and may not match provider billing totals.
4. **No native PDF v1.** PDF-to-Markdown claims require actual extracted content comparisons and suitable parsing, deferred.
5. **No auto-rewriting code or tool schemas.** Higher-risk optimization remains advice, not a transformed file.
6. **No result history.** Users should copy/download results within the current session if desired; download UX not finalized.
7. **Public backend protections needed.** Hosting without accounts still requires abuse prevention and appropriate MCP authorization decisions.
8. **No guaranteed result quality.** Users should test revised prompts against their actual AI tasks.
9. **No universal ChatGPT availability.** MCP Registry discovery and ChatGPT plugin distribution are distinct.
10. **Potentially sensitive inputs.** Stateless app design reduces persistence but cannot negate browser/client/platform logs.

## 15. Open decisions / dependencies

These items are intentionally **not** silently locked in by this document.

| ID | Decision | Status and default | Owner document |
| --- | --- | --- | --- |
| D01 | Exact file extension allowlist | Open; start small (`.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`) | 04/08/09 |
| D02 | Max input/file size | Open; benchmark on Cloudflare before setting number | 06/09/10 |
| D03 | Tokenizer and model support | Open; select one and label unknowns estimates | 05/08 |
| D04 | Cleanup policy | **Resolved: safe**; reviewed prose-only edits, no risky transformations | This doc / 08 |
| D05 | Task-awareness | **Resolved: optional** plain-text task description, no LLM | This doc / 04/07 |
| D06 | Public MCP authentication/abuse rules | Open; production deployment must choose | 06/09 |
| D07 | Usage telemetry | Open; no content telemetry by default | 09 |
| D08 | Brand color/logo/type rules | Open; derive from user's exact uploaded logo | **03** |
| D09 | License / npm scope / GitHub namespace | Open; check conflicts | 05/11 |
| D10 | Client compatibility targets | Open | 07/10 |
| D11 | Local vs Worker file input handling | Recommended browser reads UTF-8 and sends text, no file persistence; pending formal choice | 04/06 |
| D12 | Tool names / schema | Tentative; final design later | 07 |
| D13 | Exact prose-edit guard thresholds | Open; conservative baseline + fixtures | 08 |
| D14 | Expose potential output as downloadable `.txt`? | Open; copy is confirmed, download optional | 04 |

## 16. Decisions to discuss **before** `03-brand-guidelines.md`

Document 03 should use the **exact uploaded logo**, not a regenerated lookalike. Before writing it, confirm only the visual-brand choices that are not already settled:

1. **Brand name rendering:** Should the public wordmark be `PARE`, `pare`, or both depending on context? (Recommendation: `PARE` in official metadata, lowercase `pare` permitted as stylized wordmark.)
2. **Accent color:** Should we extract the exact lime from the uploaded logo as the canonical color, or use a nearby web-accessible lime with contrast corrections? (Recommendation: sample from the original and define accessibility-safe variants.)
3. **Background/theme:** Dark-first only, or both dark and light website modes? (Recommendation: dark-first for v1; establish light-background logo rules without implementing a full theme toggle.)
4. **Logo variants:** Keep symbol-only, symbol + wordmark, favicon, and monochrome variants? (Recommendation: yes, but the provided original stays authoritative.)
5. **Typography:** System fonts only for minimum asset weight, or allow hosted web font? (Recommendation: system stack first.)

**Suggested simplest default for Doc 03:** Public name `PARE`, stylized lowercase `pare` allowed; original sampled navy/lime palette; dark-first site; 4 variants derived from approved mark; system typography.

## 17. Relationship to Document 01 and change control

This document **implements**, rather than replaces, the product overview. In particular:

- It resolves **D04 (safe cleanup)** and **D05 (optional task description)**.
- It does not promote the proposed extension list, tokenizer, request cap, schema, or Cloudflare security settings to approved requirements.
- It keeps all six product problems aligned with Document 01 and treats most high-risk changes as **recommendations only**.
- If a future experiment shows a safe-edit rule creates unacceptable false positives, remove or narrow that rule rather than weakening the review boundary.
- If a future decision conflicts with Document 01, update Document 01's decision log so there is only one current source of truth.

**End of Document 02.**
