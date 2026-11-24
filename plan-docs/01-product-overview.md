# PARE — Product Overview

**Document:** `01-product-overview.md`  
**Version:** 1.0 (working product specification)  
**Status:** Approved product direction; implementation details subject to follow-up documents  
**Prepared:** 18 November 2026  
**Product:** PARE — AI Context & Token Optimization MCP

> **Implementation update (23 November 2026):** [`00-implementation-baseline.md`](./00-implementation-baseline.md) is authoritative for the active build. The website is browser-local by default, uses framework-free TypeScript compiled with Vite, supports both remote and local MCP, and exposes `analyze_context` and `compare_content`.

> **Brand promise:** Keep what matters. Cut the rest.

---

## 1. Executive summary

**PARE** is a lightweight, privacy-conscious tool that helps people identify unnecessary tokens in AI context, understand the sources of waste, and make safer, more efficient input choices. It has two entry points:

1. A minimal website where anyone can paste text or supply supported local text-based files, view analysis, and optionally copy reviewed cleaned content.
2. A Model Context Protocol (MCP) server that lets compatible AI clients explicitly invoke PARE's context-analysis and optimization tools.

PARE is **not** an AI model, an autonomous prompt interceptor, a billing platform, or a guarantee that shorter text produces equally good AI responses. Its value is **transparent, actionable recommendations** with measurable before-and-after estimates and human review of changes.

The first release targets **developers and AI-agent builders first**, while keeping the website intuitive for everyday ChatGPT and Claude users. Its implementation stays intentionally small: **HTML, CSS, framework-free TypeScript; Vite as build tooling; Cloudflare Workers; the official MCP TypeScript server SDK; a compatible tokenizer; and lightweight, rule-based analysis.** No database, application accounts, paid AI API, heavy PDF parser, or separate infrastructure is required for the MVP.

## 2. Problem statement

AI users frequently submit more context than their tasks require. Examples include repeated instructions, copied documentation, lengthy console logs, irrelevant code sections, verbose JSON/tool output, or long MCP tool definitions. This can:

- Consume more model input tokens and, depending on the provider's charging model, increase cost.
- Occupy context-window capacity and make important information harder to find.
- Increase request size and sometimes latency.
- Make prompt maintenance and agent-tool integration more difficult.

A simple token counter measures input size but doesn't explain **what could be improved, why, or what information might be lost**. PARE focuses on these decisions, rather than promising automatic lossless compression.

### 2.1 Six problem areas

| ID | Problem | PARE's initial approach | Important boundary |
| --- | --- | --- | --- |
| P1 | Oversized context | Flag unusually large sections; propose targeted inclusion | PARE cannot independently determine all task-relevant details without task context |
| P2 | Repeated instructions/content | Detect identical or strongly repetitive material; propose removal of clear duplicates | Some repetition may be intentional |
| P3 | Noisy text/code files | Identify boilerplate, excess lines, or unrelated sections; suggest selective extraction | Preserve code syntax and dependencies; don't blindly delete code |
| P4 | Large JSON/tool results | Find repetitive structures and suggest selective fields or compact representations | Proposed selection might omit needed evidence |
| P5 | Bloated MCP tool definitions | Analyze provided tool schema descriptions and highlight verbosity/overlap | PARE cannot control which tools an MCP host loads |
| P6 | Unknown impact | Compare token counts and produce a human-readable change summary | Token counts and dollar savings depend on model/provider settings |

**PDF clarification:** The file extension itself is not an optimization. A PDF converted to Markdown is only potentially more efficient when the content actually sent to the model is smaller and still useful. **PDF ingestion is out of scope in v1.**

## 3. Vision, mission, and principles

**Vision:** A world where sending context to AI is deliberate, lean, and understandable.

**Mission:** Give users a fast, accessible explanation of avoidable context overhead and help them reduce it responsibly.

**Product principles:**

1. **Preserve meaning before chasing savings.** No silent destructive rewrites.
2. **Evidence over hype.** Show measured counts when available; label estimates and assumptions.
3. **Explain each suggestion.** Every recommendation should say what was detected, why it matters, and what may be lost.
4. **Privacy by design.** Process user content transiently; do not intentionally persist prompts or files.
5. **Lightweight by default.** Avoid frameworks, databases, and external AI calls that are not necessary for the MVP.
6. **Client-neutral MCP.** Expose standards-compatible tools instead of tying core logic to one AI application.
7. **Useful without installation.** A public website demonstrates the product even for users without MCP access.

## 4. Confirmed product and brand decisions

| Area | Confirmed direction |
| --- | --- |
| Product name | **PARE** (working public brand; legal/name availability not yet cleared) |
| Product category | AI context and token-optimization assistant; website + MCP server |
| Tagline | **Keep what matters. Cut the rest.** |
| Brand visual | User-provided, rounded three-bar lime symbol on deep navy background; keep original as authoritative visual reference |
| Primary audience | Both developers and everyday AI users; **developer-first launch** |
| Optimization mode | Recommendations **plus** optional cleaned output; user sees changes before copying or using |
| Inputs for v1 | Pasted text and lightweight text/code files |
| Privacy | In-memory/transient processing; no intentionally stored content/history/accounts in v1 |
| Frontend | HTML + CSS + framework-free TypeScript; Vite for builds only |
| Backend | TypeScript on Cloudflare Workers |
| MCP | Official TypeScript MCP SDK and remote HTTP endpoint |
| Core analysis | Deterministic rules; model-aware or clearly labeled approximate token counting |
| Database | None in v1 |
| Deployment | Cloudflare-hosted website + Worker endpoint |
| Open-source/discovery goal | GitHub repository, MCP Registry; evaluate additional distribution channels separately |

**Brand assets note:** The actual logo is the user-uploaded graphic, not a newly generated substitute. Exact brand color hex values and downloadable icon variants will be specified in `03-brand-guidelines.md` after inspecting/extracting the approved asset. No trademark exclusivity is implied by choosing PARE.

## 5. Target users and their jobs to be done

### 5.1 Primary persona: AI developer / agent builder

**Context:** Builds prompt flows, RAG pipelines, coding agents, or MCP integrations; frequently handles logs, code, tool responses, and large prompts.

**Job:** "Before I send this context to a model, show me obvious waste, what is safe to remove, and how much smaller the revised input is."

**Key need:** Repeatable, inspectable output from an MCP tool that can be invoked in normal agent workflows.

### 5.2 Secondary persona: Everyday AI user

**Context:** Uses ChatGPT, Claude, or similar assistants to work with personal text, study notes, and written instructions; may not know what tokens are.

**Job:** "Make this long prompt cleaner, tell me what changed, and let me copy the result without signing in."

**Key need:** Simple language and a lightweight web analyzer, not a developer console.

### 5.3 Tertiary persona: MCP maintainer

**Context:** Publishes tools to an MCP-compatible directory and maintains descriptions/schemas.

**Job:** "Identify oversized or repetitive tool metadata and receive concrete editorial recommendations."

**Boundary:** Metadata analysis requires supplying definitions or connecting through a permitted client workflow; PARE does not enumerate all tools visible to an AI client without support from that client.

## 6. Product experience

### 6.1 Website journey

1. User opens the PARE landing page and sees the short value proposition plus an analyzer entry point.
2. User pastes text or selects an allowed local text-based file.
3. UI indicates supported file types, request size limits, and that sensitive material should be reviewed before submission.
4. User clicks **Analyze**; the frontend sends the content to the Cloudflare Worker API over HTTPS.
5. PARE returns token count/estimate, detected issues, suggested fixes, and an optional draft cleaned output where supported.
6. UI displays **original vs. suggested** counts, changes/diff, warnings, and the reasons behind each suggestion.
7. User reviews and explicitly copies the suggested content. Original remains available in the current browser session.
8. Content is not intentionally saved as account history or persisted by PARE's application.

**Failures:** Unsupported/binary files, too-large input, extraction errors, unknown tokenizer/model, and server errors must be explained clearly. Never show a fabricated savings percentage.

### 6.2 MCP journey

1. Developer connects the PARE remote MCP endpoint through a compatible, authorized MCP client.
2. The client explicitly calls PARE with content or user-supplied tool metadata.
3. PARE validates the input, analyzes it using shared core functions, and returns structured recommendations and counts.
4. The client can summarize suggestions, show the draft output, or ask the user whether to use it.

**Important:** PARE cannot monitor hidden conversation context, other MCP servers' data, or external model usage unless a client deliberately supplies those inputs. Publishing in an MCP registry does not grant access to any AI platform or guarantee every ChatGPT plan can install a custom MCP server.

## 7. MVP capabilities and scope

### 7.1 In scope: v1

**Website**
- Lightweight landing page with brand, concise explanation, and GitHub/install/documentation links.
- Analyzer UI for pasted content and local lightweight text/code files.
- Summary of token counts (or estimates), actionable issues, optional safe cleaned draft, and visible before/after comparison.
- Copy actions and clear empty/loading/error/unsupported input states.
- Responsive layout and basic accessibility (keyboard, contrast, semantic labels).

**Core analysis**
- Basic text normalization for analysis without silently altering original content.
- Deterministic identification of exact repeated lines/blocks and other conservative, explainable waste patterns.
- Warnings for oversized context, repetitive JSON structures, verbose tool descriptions, and large logs when present in supplied text.
- Suggestions ranked by confidence and possible information-loss risk.
- Optional cleaned text for **low-risk** transformations only, preserving original and returning a change summary.
- Token counts from a supported tokenizer, or clearly labeled approximations when model-specific accuracy cannot be achieved.

**MCP integration**
- Remote MCP server hosted via Cloudflare Worker using a supported transport.
- Initial MCP tool set: `analyze_context` and `compare_content`; recommendations are returned by analysis rather than a duplicate suggestion tool.
- Shared analyzer functions for website and MCP tools; no duplicate business logic.
- Input validation, bounded payloads, predictable structured errors.

**Engineering & distribution**
- Source published on GitHub with clear README, examples, license decision, and tests.
- Cloudflare deployment and basic CI checks.
- Prepare metadata for MCP Registry publication, subject to registry eligibility/namespace requirements.

### 7.2 Explicitly out of scope: v1

- PDF/DOCX/OCR and image processing.
- Automatic monitoring of all ChatGPT/Cursor/Claude prompts.
- Automatic interception or rewriting of model requests.
- LLM-powered summarization, semantic rewriting, embeddings, and RAG indexing.
- Accounts, login, billing, dashboards, or saved analysis histories.
- Database, queue, Redis, Docker, Kubernetes, separate microservices.
- Automated removal of arbitrary code, legal clauses, task-critical context, or other potentially important content.
- Claiming that shorter prompts guarantee model quality, faster responses, or lower total bills.
- Publishing directly into ChatGPT as an automatic side effect of appearing in GitHub MCP Registry.

## 8. File and content support: preliminary policy

**Confirmed category:** Pasted text plus lightweight text/code files. The precise extension allowlist is a follow-up decision.

**Proposed initial allowlist (not yet approved):** `.txt`, `.md`, `.json`, `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.css`, `.html`, `.yml`, `.yaml`, `.xml`, `.log`.

File data is treated as **untrusted text**, never executable code. Content displayed in the UI must be escaped; no uploaded code is run. The system should use bounded UTF-8 inputs and reject binary formats. Client-side previews and warnings are encouraged, but server-side validation is required.

We should not assume a Markdown conversion automatically saves tokens. Analysis must compare what would actually be sent to a model.

## 9. Recommendation and optimization contract

Each finding should ideally include:

- **Category:** duplication, verbosity, oversized content, response shaping, tool-definition bloat, etc.
- **Location:** line range, section, or structured field when feasible.
- **Reason:** Why this pattern may add unnecessary context.
- **Action:** Specific next step, not just "compress this."
- **Confidence and risk:** What can safely be changed automatically vs. what requires user review.
- **Estimated impact:** Measured or estimated token difference with tokenizer/model assumptions.

### 9.1 Safe behavior

- **Recommend by default.** Original content remains unchanged.
- **Optional draft output.** Only conservative edits are automatically proposed, and a readable change summary accompanies them.
- **No invisible deletion.** Do not imply that all removed content is semantically irrelevant.
- **No invented savings.** Never claim savings for a suggestion that has not been materialized and counted.
- **Be honest about limitations.** A result may report zero safe changes while still giving strategic recommendations.

### 9.2 Example result (illustrative, not measured)

```json
{
  "token_count_type": "estimate",
  "original_tokens": 1200,
  "suggested_tokens": 1040,
  "potential_reduction_percent": 13.3,
  "findings": [
    {
      "category": "duplicate_block",
      "reason": "The same paragraph appears twice.",
      "suggested_action": "Review removing the repeated copy.",
      "risk": "low"
    }
  ],
  "review_required": true
}
```

## 10. Product architecture at a glance

```text
Website (HTML / CSS / vanilla JS)    MCP-compatible AI client
                |                            |
                | HTTPS /api/analyze         | MCP over HTTPS /mcp
                v                            v
         +------------------------------------------+
         |        Cloudflare Worker (TypeScript)    |
         |  validation / limits / API & MCP routing |
         |            shared analyzer core          |
         |    tokenizer + deterministic rules       |
         +------------------------------------------+
                          |
                          v
                 In-memory response
                 No application DB
```

**Key architectural choice:** Both entry points use the same core analysis functions and return consistent recommendations. No separate backend is needed. Worker's runtime limits and dependency compatibility must be tested before finalizing file size limits and tokenizer package.

## 11. Privacy, safety, and trust boundaries

### 11.1 Confirmed privacy posture

- No user account or PARE-owned persistent analysis history in v1.
- No intentional storage of submitted file or prompt contents by application code.
- Analyze request content transiently and discard it after the response is returned.
- Do not use submitted prompts or documents for AI model training; no external model API is required.

### 11.2 Important qualification

"In-memory processing" **does not automatically imply zero retention across every layer**. Infrastructure access logs, security events, browser behavior, network intermediaries, and a user's own AI client may maintain records independently. Production configuration must minimize content logging, limit diagnostic output, and describe residual platform processing accurately. Do not promise complete non-retention without verification.

### 11.3 MVP protections

- HTTPS in production; request-size and time limits; validation and safe rendering.
- Public endpoint abuse protection and rate limiting appropriate to Cloudflare's supported features.
- No arbitrary URL fetching or remote file retrieval in v1.
- No code execution, shell execution, or access to the user's filesystem beyond explicitly uploaded files processed in the browser.
- Prefer anonymous access for the simple website. **Decide the remote MCP endpoint's authentication and abuse-control policy before public release**; anonymous MCP access must not be assumed safe.

## 12. Product positioning and messaging

**One-sentence pitch:** PARE helps people spot wasted AI context, understand safer ways to reduce it, and compare token usage before using a revised input.

**Short plugin description (draft):** "Find and reduce wasted AI tokens."

**Hero headline (draft):** "Keep what matters. Cut the rest."

**Supporting copy (draft):** "Analyze prompts, text files, code and MCP tool descriptions. Find repetition, oversized context and unnecessary output—with clear suggestions and a before/after comparison."

**Messaging to avoid:**
- "Automatically reduces every ChatGPT conversation."
- "Guaranteed 50% cost savings."
- "Lossless compression of any prompt."
- "Private with zero logs anywhere."
- "Install in every ChatGPT account from GitHub Registry."

## 13. Metrics and acceptance criteria

The MVP should be evaluated on **correctness, usefulness, trust, and compatibility**, not speculative download or star targets.

### 13.1 Functional acceptance

- [ ] Website analyzes pasted UTF-8 text and agreed file types.
- [ ] MCP tools can be discovered and invoked through a compatible test client.
- [ ] Same input produces consistent core findings through web API and MCP.
- [ ] Token counts are reproducible for the selected tokenizer; estimates are labeled.
- [ ] Duplicate detection works on documented examples without deleting originals.
- [ ] Before/after reduction is derived from actual original and suggested content, not guessed percentages.
- [ ] Optional cleaned output has a reviewable change summary.
- [ ] Unsupported input, large payloads, and internal errors produce safe, understandable responses.
- [ ] No application database or account system is necessary to run v1.

### 13.2 Quality signals to measure in tests

- **Rule precision:** Few false suggestions on intentional repetitions and code samples.
- **Meaning retention:** Reviewable edits preserve task-critical content in a curated test set.
- **Tokenizer integrity:** Counts match the documented tokenizer on test fixtures.
- **Performance:** Analysis stays responsive within Cloudflare runtime limits at the chosen input cap.
- **Safety:** No code execution or unsafe HTML rendering; sensitive content absent from application logs.
- **Interoperability:** Passes MCP Inspector and selected real-client smoke tests.

**Numeric performance goals, payload limits, and any opt-in anonymous usage telemetry remain undecided** and should be established by baseline testing, not guessed here.

## 14. Launch and distribution plan

1. **Local prototype:** Implement deterministic analyzer and tokenizer; test website and MCP tools.
2. **Public demo:** Deploy HTTPS website + API + MCP endpoint on Cloudflare with protective limits.
3. **Open-source release:** Publish source, examples, README, contribution guidance, license, and security/privacy information on GitHub.
4. **MCP Registry:** Validate and publish the package or remote endpoint metadata according to the registry's current rules and namespace verification process.
5. **Compatibility checks:** Document tested installation paths for supported MCP clients, distinguishing manual connection from marketplace installation.
6. **ChatGPT-specific distribution:** Treat any public ChatGPT plugin/app-directory submission, review, and account eligibility as a **separate process** requiring current verification. Do not guarantee universal availability.

**Name clearance:** PARE is a common English word; independently check trademarks, similar software brands, domains, GitHub organization/repository naming, and npm namespaces before public branding or paid distribution.

## 15. Risks and mitigations

| Risk | Impact | MVP mitigation |
| --- | --- | --- |
| Shortening harms response quality | Users may miss crucial detail | Recommend, show diff, require review; conservative default edits |
| Token-count inaccuracies | Misleading savings | Define supported tokenizer(s), label estimates, use real before/after calculations |
| Unknown task relevance | Incorrect trimming advice | Only claim structural waste; make uncertain suggestions conditional |
| File privacy | Sensitive data exposure | No intentional persistence, minimize logging, validate uploads, warn users |
| Public Worker abuse | Cost or availability problems | Size limits, rate limits, bounded CPU/time, monitoring |
| Platform/client differences | Confusing installation | Publish client-specific compatibility notes and tested setup paths |
| Brand/name collision | Legal and distribution conflicts | Perform trademark, registry, domain and package checks |
| Scope creep | Delayed MVP | Keep PDF, LLM rewriting, analytics dashboards, auto-monitoring out of scope |

## 16. Decisions needed before subsequent documents

The following are **open decisions**, not assumed product requirements. Discuss them before writing the most affected documentation sections.

| ID | Open decision | Suggested default | Affects |
| --- | --- | --- | --- |
| D01 | Which file extensions are allowed in v1? | Begin `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`; expand only after tests | Docs 02, 04, 08, 09 |
| D02 | Maximum input size per request/file? | Set after Cloudflare benchmark; start with a conservative configurable cap | Docs 04, 06, 09, 10 |
| D03 | Tokenizer/model coverage? | One tested tokenizer; others clearly labeled estimates | Docs 05, 08, 10 |
| D04 | Allowed automatic cleanup transformations? | Exact duplicate **non-code** blocks and formatting-only edits; require review | Docs 02, 07, 08 |
| D05 | Does v1 provide task-aware analysis? | Optional user-provided task description; no extra AI model | Docs 02, 04, 07, 08 |
| D06 | Remote MCP authentication/abuse protection? | Restrict public traffic and select Cloudflare-compatible approach before launch | Docs 06, 09, 11 |
| D07 | Anonymous telemetry or analytics? | No content telemetry; minimal aggregate operational metrics only if needed | Docs 09, 10, 11 |
| D08 | Exact logo assets/colors/type specifications? | Derive from uploaded approved logo; confirm brand palette and icon variants | Doc 03 |
| D09 | License and repository/package naming? | Choose permissive license after review; conduct availability checks | Docs 05, 11 |
| D10 | Supported AI clients and release targets? | Test MCP Inspector plus one or two selected clients; list others as unverified | Docs 07, 10, 11 |
| D11 | Browser-only vs server-side file reading? | Browser reads UTF-8 files, sends text to analyzer; no server file storage | Docs 04, 06, 09 |
| D12 | Exact first-release MCP tool names and result schema? | **Resolved:** `analyze_context` and `compare_content`; Zod-backed v1 structured results | Doc 07 + implementation baseline |

### Recommended decision order

Before **`02-problems-and-solutions.md`**, settle **D04 (cleanup policy)** and **D05 (task awareness)**. D01 can be settled alongside that document. Infrastructure-specific decisions (D02, D03, D06, D07) can wait until their corresponding architecture and security documents.

## 17. Documentation map

1. `01-product-overview.md` — **This document**: intent, scope, personas, user journeys, success criteria, open questions.
2. `02-problems-and-solutions.md` — Detection scenarios, recommendations, tradeoffs, user-visible examples.
3. `03-brand-guidelines.md` — Verified logo, brand palette, usage rules, typography, icons.
4. `04-ui-ux-design.md` — Pages, interaction states, responsive behavior, accessibility.
5. `05-tech-stack.md` — Minimal dependencies, compatibility, versions, package choices.
6. `06-system-architecture.md` — Request flows, API/MCP paths, Cloudflare Worker integration.
7. `07-mcp-tools.md` — Tool contracts, examples, validation, interoperability.
8. `08-optimization-engine.md` — Detailed rules, token counting, confidence/risk, correctness.
9. `09-security-and-privacy.md` — Trust boundaries, threat model, data handling, abuse controls.
10. `10-testing.md` — Test strategy, fixtures, protocol compatibility, performance budgets.
11. `11-deployment-and-publishing.md` — Cloudflare, GitHub, registry, client-specific rollout.

---

## 18. Document status and change control

**Approved now:** Name PARE; uploaded logo as visual reference; developer-first but broad audience; recommendations plus optional cleaned output; pasted text and lightweight text/code file inputs; transient in-memory application processing; lightweight HTML/CSS/JS + TypeScript + Cloudflare Workers + MCP SDK stack; no database in v1.

**Not yet approved:** Exact logo palette, final file allowlist, model tokenizer, request cap, cleanup transformations, task-awareness UI, MCP tool schemas, authentication mechanism, license, package namespace, public-directory approvals.

When future documents resolve an open decision, update this overview's decision table to avoid conflicting specifications. Do not silently introduce a framework, database, external AI provider, or new product feature without discussion.
