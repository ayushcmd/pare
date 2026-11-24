# PARE — UI/UX Design Specification

**Document:** `04-ui-ux-design.md`  
**Version:** 1.0 — approved UI direction, detailed implementation specification  
**Date:** 18 November 2026  
**Status:** Design specification; explicit open decisions remain below  
**Depends on:** `01-product-overview.md`, `02-problems-and-solutions.md`, `03-brand-guidelines.md`  
**Brand:** PARE — *Keep what matters. Cut the rest.*

> **Scope statement:** A minimal, single-page, dark-first PARE website built with HTML, CSS, and vanilla JavaScript, backed by the same deterministic TypeScript analysis core used by the Cloudflare Worker MCP endpoint. The analyzer is *paste-first* and accepts supported local text/code files as a secondary input path. Suggestions are conservative, and proposed cleaned content requires explicit diff review before copying.

> **Implementation update (23 November 2026):** The UI remains framework-free but is authored in TypeScript and compiled by Vite. The shared core now runs locally in the browser by default; `/api/analyze` is an optional programmatic/remote adapter, not the normal website path.

---

## 1. Document purpose and authority

This document specifies how PARE looks, behaves, and communicates its results across screen sizes. It is written for a developer implementing the UI without introducing React, a dashboard, authentication, or hidden AI features.

### 1.1 Confirmed decisions carried forward

| Area | Decision | Source |
| --- | --- | --- |
| Audience | Both everyday AI users and developers; developer-first launch | 01 |
| Page architecture | **One page** with analyzer, concise explanation, and external documentation links | User approval for 04 |
| Main input | **Large paste area first**, file selector secondary | User approval for 04 |
| Results | **Stacked cards**, not a tabbed dashboard | User approval for 04 |
| Cleaned draft | **Review differences before copying**; no silent application | User approval for 04; 01–02 |
| Optional task context | Collapsed by default; advisory hint, not a required field | 02; user approval for 04 |
| Comparison visibility | **Only show before/after token counts when a valid proposed draft exists** | User approval for 04 |
| Cleanup | Conservative, reviewable prose-only candidates; code/JSON/tool-schema edits are advice-only | 02 |
| Style | Dark-first; official logo asset; navy and lime; system fonts | 03 |
| Frontend | HTML, CSS, vanilla JavaScript | 01 |
| Backend | Cloudflare Workers, TypeScript, official MCP SDK; no application database | 01 |
| Content handling | Transient processing; no intentionally stored prompt/file history | 01–02 |

**Interpretation of comparison rule:** Original token count may appear after successful analysis, including when no draft is offered. The dual metric (`before` and `after`), delta, percentage, and visual savings indicator appear **only** after the backend provides a validated draft and comparable counts for both strings. A speculative recommendation never creates a numerical savings estimate.

### 1.2 Out of scope for this design

No dashboard, user profile, authentication UI, saved histories, billing, PDF upload, image/video processing, automatic monitoring of ChatGPT, automatic AI rewriting, external LLM call, code editor, whole-repository ingestion, or installation wizard requiring client-specific assumptions. No light-mode toggle in v1. Do not use client-side analytics that capture submitted content.

---

## 2. Primary user goals and success paths

### 2.1 Everyday AI user

**Goal:** Paste a long prompt, understand structural issues in plain language, optionally review a cleaner draft, and copy it.

1. See PARE's value in the first viewport.
2. Paste text and press **Analyze context**.
3. Read token count or clearly labeled estimate, followed by specific findings.
4. If a draft exists, open **Review cleaned draft**, inspect removals, then choose **Copy reviewed draft**.
5. Original remains visible and unchanged throughout the session.

### 2.2 Developer / AI-agent builder

**Goal:** Analyze pasted code, log, Markdown, JSON or MCP tool metadata; see line/field-based evidence and actionable advice.

1. Paste content or select an approved text/code file.
2. Optionally describe their task, such as “debug the OAuth callback.”
3. Inspect results, detected locations, confidence, and loss-of-information risk.
4. For syntax-sensitive input, receive **advice only** rather than rewritten executable data.
5. Follow the **Use as MCP** documentation link for installation.

### 2.3 Trust outcome

A successful PARE analysis must leave the user knowing **what was counted**, **what was detected**, **what might change**, and **what PARE cannot guarantee**. A reduction in tokens does not prove equivalent answer quality or guaranteed cost savings.

---

## 3. Single-page information architecture

Recommended DOM sequence (no SPA router required):

1. **Skip link** to the analyzer.
2. **Header:** authoritative logo, lowercase `pare` text wordmark, links to `How it works`, `Docs`, and `GitHub`.
3. **Hero:** headline, one supporting sentence, primary button/anchor **Try the analyzer**, short non-hyped privacy statement.
4. **Analyzer** (`#analyzer`): paste text, optional file picker, collapsed optional task context, single primary submit button, input guidance.
5. **Results** (`#results`, hidden until success): summary followed by findings, recommendations, and optional draft review.
6. **How it works** (`#how-it-works`): three simple steps and explicit limits, not a long marketing section.
7. **MCP / Developer section** (`#mcp`): describe explicit tool calls; link to maintained install docs, no unsupported “Install in ChatGPT” promise.
8. **Footer:** privacy, repository, docs, security, license once chosen.

Use semantic `<header>`, `<main>`, `<section>`, `<footer>`, and `<form>` elements. Navigation is anchor-based where possible. Documentation can live as Markdown in GitHub; a second rendered documentation website is not required for v1.

### 3.1 Section priority

The analyzer is the main product, not buried below decorative content. On desktop the first viewport should convey brand + purpose + an immediate route to the paste area. On mobile, keep the primary call to action visible without a lengthy introduction.

### 3.2 Text-only wireframe — desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ [official symbol] pare             How it works   Docs   GitHub     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Keep what matters. Cut the rest.                                   │
│  Find repeated and oversized AI context before you send it.        │
│  [Try the analyzer]       No account needed                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Analyze context                                               │  │
│  │ Paste the text you want to check                              │  │
│  │ ┌───────────────────────────────────────────────────────────┐ │  │
│  │ │                                                           │ │  │
│  │ │                   TEXTAREA                                │ │  │
│  │ └───────────────────────────────────────────────────────────┘ │  │
│  │ [Choose a text/code file]  filename • size [remove]           │  │
│  │ ▸ Add task context (optional)                                 │  │
│  │ Review sensitive content before submitting.                  │  │
│  │ [Analyze context]                                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  AFTER ANALYSIS — STACKED RESULTS:                                  │
│  [1. Original token count and measurement method]                  │
│  [2. Findings and recommendations]                                  │
│  [3. Optional draft + review diff + copy (only if valid)]          │
│                                                                     │
│  How it works   •   Use with MCP                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Text-only wireframe — mobile

```text
┌──────────────────────────┐
│ [logo] pare     [Docs]   │
│ Keep what matters.       │
│ Cut the rest.            │
│ [Try the analyzer]       │
│ ┌──────────────────────┐ │
│ │ Paste your text      │ │
│ │                      │ │
│ │ textarea             │ │
│ │                      │ │
│ └──────────────────────┘ │
│ [Choose file]            │
│ ▸ Task context (optional)│
│ [Analyze context]        │
│ [Original tokens]        │
│ [Issue card 1]           │
│ [Issue card 2]           │
│ [Review draft, if any]   │
│ [How it works]           │
└──────────────────────────┘
```

Mobile is one column by default; no horizontally scrolling results, toolbars, or side-by-side diff as the only comparison mode.

---

## 4. Layout, sizing, spacing, and responsive behavior

Use Document 03's CSS tokens rather than inventing a new visual identity.

| Element | Starting specification | Notes |
| --- | --- | --- |
| Body background | `#021020` | Sample-derived brand navy |
| Brand accent | `#BDFB64` | Sample-derived lime; not a claim of guaranteed savings |
| Main text | `#F8FAFC` | Derived accessible text color |
| Supporting text | `#94A3B8` | Check contrast in actual states |
| Cards | `#101E2D`; raised `#142537` | Thin borders `#304256` |
| Content width | `min(100% - 32px, 1000px)` | Can be narrowed after usability testing |
| Reading text width | About 65–75 characters | Keep long explanations readable |
| Analyzer panel | 100% available width | Primary element on page |
| Input height | Minimum ~220px desktop; ~190px mobile | Allow manual vertical resize |
| Section spacing | ~40–72px desktop; ~28–48px mobile | Use existing 4/8px spacing tokens |
| Touch controls | Aim for 44×44px targets | WCAG-compatible target considerations |
| Focus | Visible 2–3px lime ring with offset | Test against lime controls |
| Border radii | 6–16px | From Document 03 |

**Breakpoint guidance (implementation suggestions, not finalized tokens):** single column under 768px, optional larger spacing above. Prefer fluid widths using `max-width` and `clamp()`; no UI framework or breakpoint library is necessary.

**Typography:** Use `system-ui` for body/UI and platform monospace for code, metadata, line ranges, and technical counts. No web font download. Use native tabular numerals for token metrics.

**Motion:** Simple 120–200ms transitions where helpful; honor `prefers-reduced-motion`. No animated counters, confetti, parallax, or loading spinners as the only status indicator.

---

## 5. Header, hero, and branding rules

- Official directory/display name is **PARE**; the on-site stylized wordmark may be **pare**.
- Use the **exact uploaded logo** as the image source, not a redrawn or AI-generated approximation. Its symbol is lime on navy; preserve its colors and geometry.
- The current user-provided asset is not assumed to be a ready-made square directory avatar; exporting the approved app icon is a separate brand task.
- Header logo should be clearly readable and lead to the page top; image `alt` should be empty if immediately adjacent to visible “pare” text, otherwise `alt="PARE logo"`.
- Hero headline: **Keep what matters. Cut the rest.**
- Supporting text: “Find repeated and oversized AI context before you send it.”
- Small qualifier near analyzer: “Estimates may differ from your AI model's actual token usage.”
- Do not use fake logos of platforms as compatibility endorsements.

---

## 6. Input panel: paste-first behavior

### 6.1 Main textarea

**Label:** `Paste the context you want to analyze`  
**Supporting hint:** `Prompts, Markdown, code, JSON, logs, or MCP tool descriptions.`  
**Placeholder example:** `Paste a prompt, document excerpt, or tool response…`  
**Action:** `Analyze context`

The textarea is the primary, obvious entry point. It is plain text and must not render HTML supplied by the user. Do not auto-analyze every keystroke (cost, privacy, and confusing partial-result concerns).

**Submission checks:**
- Reject empty or whitespace-only submissions with inline guidance and focus the input.
- Count input size before submission; tell users when a configured limit is exceeded. **Exact limit is open**, to be decided after Cloudflare and tokenizer benchmarks.
- Never log submitted content to the browser console or an analytics service.
- Show a static privacy notice before the user explicitly submits to Cloudflare.

### 6.2 Secondary file selection

**Label:** `Or choose a text/code file`  
**Priority:** Secondary outlined button below the textarea, not equal visual weight to paste.

The browser uses the File API to read supported UTF-8 text locally and inserts that text into the textarea for inspection. **No raw binary upload and no server-side file storage.** File selection does not itself transmit data to Cloudflare.

A conservative *proposed, not yet locked* allowlist follows Documents 01–02: `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`. Extensions can expand later after tests. Validate extension/type, bytes, UTF-8 readability, and binary/control-character indicators both before use and on the server. MIME alone is not authoritative. Filename is presented as local metadata and should not be required by the analysis core.

**File UI behavior:**
1. Click `Choose a text/code file`.
2. Read locally; show `filename · readable size` with `Remove` action.
3. Preview the file content in the main text area, keeping the user's ability to edit it.
4. On choosing a file when the textarea already contains pasted text, **do not silently overwrite**. Ask a clear native or in-page confirmation: `Replace current text with this file?` with `Replace` / `Cancel`.
5. Analyze only after the user clicks the primary button.
6. If file is too large/unsupported/binary, show a clear error and preserve the existing text.

**Open decision:** Should the UI also allow a `Download cleaned .txt` action? Not needed for the confirmed copy-first MVP.

### 6.3 Optional task-context disclosure

Use native `<details>` and `<summary>` where practicable. Default **collapsed**.

- Summary: `Add task context (optional)`
- Expanded label: `What are you trying to do? (optional)`
- Example helper: `E.g., “Debug a failed login” or “Summarize this release note.”`
- Note: `This helps prioritize suggestions; PARE does not know whether omitted content is safe to discard.`

The task description is a bounded plain-text hint. It is never required to submit and should not be treated as instruction authority that overrides safe-cleanup rules. No external LLM interprets the task in v1; deterministic recommendations can refer to explicit terms while being candid about limited semantic understanding.

### 6.4 Primary action and privacy notice

- Primary: lime-filled `Analyze context` button.
- Button disabled while a request is in flight; show `Analyzing…` text (not a spinner alone).
- Example privacy note: `PARE sends the text you submit to its Cloudflare endpoint for analysis. We do not intentionally save submitted content in an application database. Review sensitive content first.`
- Add link to privacy policy when published; do **not** promise that cloud/network/client logs never exist.

---

## 7. Analysis result design: stacked cards

The results area is hidden until there is a successful current response. The card order is fixed for ease of scanning.

### Card 1 — Original analysis summary (always on successful analysis)

Display:
- `Original context` plus formatted **token count** (or **estimated tokens**) and the tokenizer/count method label.
- Input type if determined: prose, Markdown, code, JSON, log, MCP schema, or mixed/unknown; **heuristic**, not certainty.
- Number of findings and concise context about what the counter included.
- If tokenizer is not model-exact: `Estimated token count. Your AI provider may count differently.`

**No after-count here** until a valid draft exists. An unchanged input can still be successfully analyzed; say `No clear structural issues found` rather than `Perfect prompt`.

### Card 2 — Findings and actionable recommendations

Each finding is a bordered stacked item containing:

1. **Title:** `Repeated paragraph`, `Large section`, `Verbose JSON`, etc.
2. **Where:** line range, section heading, field name, or `location unavailable`.
3. **Observed evidence:** bounded preview or count of repeated occurrences.
4. **Why it matters:** plain-language explanation of potential context overhead.
5. **Next action:** explicit user action, e.g., `Review the second repeated paragraph`.
6. **Confidence:** high / medium / low detection confidence.
7. **Information-loss risk:** low / medium / high **as a separate label**.
8. **Disposition:** `Draft prepared`, `Suggestion only`, or `Information`.

Order low-risk high-confidence findings first. Avoid claiming a section is irrelevant merely because it is long. An optional task description may improve the explanation but must never authorize automatic removal of unique text.

**Suggestion-only examples:** large code blocks, source comments, JSON fields, logs, MCP tool parameter descriptions, task-relevant unique prose. Never display a “save N tokens” number for an unapplied suggestion.

### Card 3 — Optional draft and mandatory review

Only render this card if the backend returns a **validated candidate draft** and a structured change list. If not, use a compact informational state below recommendations: `No safe automatic changes were prepared. You can still act on the suggestions above.`

When there is a valid draft:

**Step A — Entry state (not yet reviewed):**
- Heading: `Cleaned draft available`.
- Short disclaimer: `Review changes before copying; removing repetition can still change emphasis.`
- Button: **Review cleaned draft**.
- **No enabled copy button in this state.**

**Step B — Diff review:**
- Show what was removed or normalized with line/section references.
- On mobile, use vertically stacked `Original excerpt` then `Proposed excerpt` or a single inline unified diff; never rely solely on red/green highlighting.
- Preserve context around each edit, with accessible `Removed` / `Kept` labels.
- Present full draft in a read-only, scrollable plain-text area (or a clearly labeled preview with access to the complete text) so user can inspect it. Render safely with `textContent`, not `innerHTML`.
- Display draft comparison metrics *now*: **Original tokens**, **Draft tokens**, **difference**, and **percentage reduction**, computed by the same tokenizer/method from exact text. If draft is equal or larger, show `No measured reduction` or an increase honestly.
- Require a distinct checkbox **`I reviewed the proposed changes`**. Copy stays disabled until it is checked and the review panel has been opened.

**Step C — Copy:**
- Enabled button: `Copy reviewed draft`.
- Clicking copies only the reviewed draft, not the original.
- If clipboard permission fails, show `Copy failed. Select the draft text and copy manually.` with a selectable fallback.
- After success, announce `Reviewed draft copied` in a nonintrusive status region; **do not auto-send it to ChatGPT or overwrite the original input**.

**Review state invalidation:** A change to source text, task context, chosen file, or any analysis-affecting option invalidates previous results/draft review state. An old draft must not be copyable as if it came from the newly edited input. Require reanalysis and re-review.

### 7.1 Validity conditions for before/after metrics

A comparison panel is **allowed only if all conditions hold**:

1. The server returned `draft_available = true` with an actual `draft_text` string.
2. The draft belongs to the active request/version of the original content.
3. Changes describe a conservative, allowed transformation rather than auto-editing protected code/JSON/log/tool-schema content.
4. Both token counts refer to the exact original/draft strings under the **same** tokenizer or approximation.
5. Counts are valid nonnegative finite integers and comparison math is valid; no division by zero percentages.
6. The UI has sufficient data to present an inspectable diff/change list.

If validation fails, suppress the after-count/comparison and show a clear error or advice-only state. Don't silently estimate an after-count from recommendation heuristics. Optionally show only the original count if the base analysis is still valid.

**Formula:** If `original_tokens > 0`, `delta = original_tokens - draft_tokens`; `percent = 100 * delta / original_tokens`. A negative delta is **increase**, not a reduction. All values should be rounded only for display, not computation.

### 7.2 Suggested visual card structure

```text
[Original context]
  1,284 estimated tokens   • method: named tokenizer
  3 findings • Markdown / prose (heuristic)

[Recommendations]
  1. Repeated paragraph      High confidence • Low/medium risk
     Lines 15–19 duplicate lines 4–8.
     Review removing the repeated copy.
  2. Large unique section    High confidence • High deletion risk
     Suggest selecting relevant sections manually; no draft edit.

[Cleaned draft available]
  Removing duplicates can affect emphasis. Review first.
  [Review cleaned draft]
    ↓ after user opens review
  [Diff with removed lines + rationale]
  [Original 1,284] [Draft 1,143] [Difference 141; 10.98%]
  [ ] I reviewed the proposed changes
  [Copy reviewed draft — disabled until reviewed]
```

Numbers are illustrative only and MUST NOT be hardcoded into the live UI.

---

## 8. Full UI state machine

| State | Trigger | UI content / actions | Guard |
| --- | --- | --- | --- |
| `idle` | Initial visit | Empty textarea, file option, collapsed task section | Results hidden |
| `input_ready` | Valid text entered/read | Primary submit available | Size/type preliminary checks |
| `invalid_input` | Empty/unsupported/oversized | Inline error near input; preserve text | Never submit |
| `submitting` | Click analyze | Busy label and status; prevent duplicate submit | Abort/cancel behavior optional; no response mixing |
| `results_no_draft` | Successful valid response, no draft | Original count + findings + advisory state | No after count, percent or copy draft |
| `results_draft_unreviewed` | Valid draft returned | Show review CTA, not copy | Draft belongs to active input |
| `review_open` | User chooses review | Diff and comparison shown; checkbox unchecked | Copy disabled |
| `review_confirmed` | User explicitly checks reviewed | Copy enabled | Active input still matches analyzed input |
| `copy_success` | Clipboard succeeds | Status announcement, retain review | No input mutation |
| `copy_failure` | Clipboard denied/error | Clear selectable fallback | Do not claim success |
| `network_error` | Timeout/HTTP failure | Human-readable retry guidance | Preserve source; no stale success |
| `stale_result` | Source/task/options changes | Hide/invalidate results/review; show “Analyze again” | Never reuse old comparison |

**Concurrency:** Tag every request with a local monotonically increasing request counter; ignore responses that don't match the current input/request. Consider `AbortController` if supported; older requests must not replace newer results. No need for a state management library.

---

## 9. Errors, edge cases, and honest copy

| Condition | UI behavior | Example copy |
| --- | --- | --- |
| Empty/whitespace input | Inline error, focus textarea | `Paste some text to analyze.` |
| Unsupported file | No content replacement | `This file type isn't supported. Try a text or code file.` |
| Binary / unreadable UTF-8 | No analysis | `We couldn't read this as a supported text file.` |
| Content too large | No submission; show current vs configured max | `This input exceeds the current size limit. Select a smaller section.` |
| Unknown tokenizer | Original count labeled estimate | `Estimated tokens using [method]. Your model may differ.` |
| Valid analysis, zero findings | Original count + honest empty state | `No clear structural issues found in this input.` |
| Findings, no safe draft | Recommendations; no comparison | `We found suggestions but no changes we can safely prepare automatically.` |
| Draft but invalid count or diff | Fall back to advice only; record safe operational error | `We couldn't verify the cleaned draft comparison.` |
| Draft increases tokens | Show increase, not green saving | `This draft is larger by N tokens.` |
| Malformed JSON submitted as text | Analyze as text only, explain structure is unknown | `JSON-specific suggestions need valid JSON.` |
| Code/log/tool schema | Advice only | `We won't automatically edit syntax-sensitive content.` |
| Network/Worker failure | Preserve input, retry affordance | `Analysis failed. Your text is still here; try again.` |
| Clipboard unavailable | Selectable fallback | `Copy failed. Select the draft text and copy manually.` |

Avoid absolute claims such as `100% safe`, `lossless`, `all tokens saved`, `every prompt monitored`, or `guaranteed lower bill`. PARE measures a submitted input, not the complete hidden prompt sent by a third-party host.

---

## 10. Accessibility contract

Target WCAG 2.2 AA in the implemented interface. Palette contrast from Document 03 is a starting point, not a substitute for testing.

- Use labels for textarea, file input, task description, and review checkbox. Do not rely on placeholders alone.
- Ensure logical keyboard tab order and visible focus; support native Enter/Space behavior.
- Use `<details>/<summary>` (or an equivalently accessible disclosure) for optional context.
- Announce loading, result completion, copy success, and errors using a restrained `role="status"` / `aria-live="polite"`; use `role="alert"` for urgent validation only when warranted.
- Error text must be programmatically associated with the relevant field (`aria-describedby`, `aria-invalid` when applicable).
- Diff markers must have words/icons such as `Removed`, `Unchanged`, and accessible line references—not color alone.
- Avoid tiny text; body 16px, support 14px, inputs legible without mobile zoom.
- Keep results usable at 320px viewport, 200% text zoom, reduced motion, and forced-colors/high-contrast settings.
- Maintain adequate target size for touchscreen controls and clear disabled states.
- After results appear, move focus **only if it benefits the keyboard/screen-reader flow** (e.g., to a results heading at user request); don't unexpectedly steal focus while typing.
- Provide a visible skip-to-analyzer link.

### 10.1 Specific diff accessibility

A unified diff can be represented as a readable list of change items:

`Change 1: removed duplicate prose at lines 22–25. Matches lines 5–8.`

A code-like visual diff may accompany the list, but the list is the accessible basis. Preserve line boundaries and avoid interpreting user-supplied markup as HTML.

---

## 11. Privacy and security interface requirements

**Data flow:** browser-held text → explicit submit → Cloudflare HTTPS Worker → transient analysis → response rendered as text. No app database, saved accounts, or history. The same core engine is used for MCP calls, which are independently initiated by compatible clients.

- Make it clear that a **file is read locally first** but **its extracted text is transmitted** on Analyze.
- Do not imply “local-only processing” for the website's backend analysis.
- Use `textContent`, `value`, DOM nodes, or safe escaping for all displayed user content. Never inject untrusted HTML into `innerHTML`.
- Do not auto-open external links embedded in submitted content.
- Do not embed request bodies or full prompts in client-side error reports, analytics, request URLs, or page query strings.
- Clear sensitive state on page reload under the proposed transient UX; do not persist in `localStorage`, cookies, IndexedDB, or service-worker caches.
- The browser's native clipboard may retain copied text; state that behavior honestly as platform controlled, not PARE storage.
- Provide a small note that Cloudflare, connected AI clients, and network infrastructure may have separate operational logging/retention policies; configure request-body logging off in app code.
- Add public abuse limits and authentication decisions to Documents 06 and 09; no authentication UI is included in v1.

---

## 12. Frontend technical implementation guide (not final API schema)

Use plain semantic HTML, one CSS file, and one small browser JS controller. A minimal layout compatible with the confirmed stack:

```text
public/
  index.html
  style.css
  app.js
  assets/
    pare-logo-original.png  # approved logo source or tracked derivative with provenance
src/
  index.ts                 # Cloudflare Worker routes
  analyzer.ts              # shared core, deterministic rules
  tokenizer.ts             # shared counting adapter
```

Keep view logic separate from analysis logic even if the app remains only a few files. Browser code should call `POST /api/analyze` for website submissions. **This endpoint is conceptual until Document 06 defines request and response contracts.** MCP tools will reuse the core via a separate `/mcp` transport handler.

### 12.1 Example semantic markup skeleton

```html
<a class="skip-link" href="#analyzer">Skip to analyzer</a>
<header class="site-header">
  <a href="#top" aria-label="PARE home">
    <img src="/assets/pare-logo-original.png" alt="" />
    <span>pare</span>
  </a>
  <nav aria-label="Primary">
    <a href="#how-it-works">How it works</a>
    <a href="https://github.com/OWNER/REPOSITORY">Docs</a>
    <a href="https://github.com/OWNER/REPOSITORY">GitHub</a>
  </nav>
</header>
<main id="top">
  <section class="hero" aria-labelledby="hero-title">
    <h1 id="hero-title">Keep what matters. Cut the rest.</h1>
    <p>Find repeated and oversized AI context before you send it.</p>
    <a href="#analyzer">Try the analyzer</a>
  </section>
  <section id="analyzer" aria-labelledby="analyzer-title">
    <h2 id="analyzer-title">Analyze context</h2>
    <form id="analysis-form">
      <label for="source-text">Paste the context you want to analyze</label>
      <textarea id="source-text" name="sourceText" required></textarea>
      <label for="source-file">Or choose a text/code file</label>
      <input id="source-file" type="file" />
      <details>
        <summary>Add task context (optional)</summary>
        <label for="task-context">What are you trying to do? (optional)</label>
        <textarea id="task-context" name="taskContext"></textarea>
      </details>
      <p>Review sensitive content before submitting.</p>
      <button type="submit">Analyze context</button>
    </form>
  </section>
  <section id="results" aria-labelledby="results-title" hidden>
    <h2 id="results-title">Analysis results</h2>
    <!-- Stacked original count, findings, optional reviewed draft -->
  </section>
  <section id="how-it-works">...</section>
  <section id="mcp">...</section>
</main>
<footer>...</footer>
<div id="status-message" role="status" aria-live="polite"></div>
```

`OWNER/REPOSITORY` is a placeholder; no real repository or domain has been confirmed. The markup is illustrative and must be tested (for example, file inputs must not be required and `required`/custom empty validation must work together).

### 12.2 Client logic requirements

1. `readTextFile(file)`: enforce preliminary allowed type/size/binary checks; read UTF-8; preview source.
2. `validateSource(text)`: reject empty and over-limit inputs using backend-configured cap.
3. `submitAnalysis(text, taskHint)`: call remote Worker only after explicit submit.
4. `renderSummary(data)`: show original count and tokenizer/estimate label.
5. `renderFindings(data)`: evidence, reason, risk, suggestion, disposition.
6. `validateDraft(data, requestVersion)`: only expose valid reviewed draft and count comparison.
7. `renderReviewDiff(data)`: safe text nodes; one-to-one changes.
8. `setReviewConfirmed(bool)`: control copy availability and reset on changes.
9. `copyReviewedDraft()`: use clipboard with fallback.
10. `invalidateResults()`: hide stale results on input/task change or file replacement.

Do not import a frontend UI framework for these behaviors. Any client-side parsing should avoid duplicating the server's authoritative analysis rules.

---

## 13. Content design and microcopy library

| UI location | Copy | Reason |
| --- | --- | --- |
| Main headline | `Keep what matters. Cut the rest.` | Approved brand line |
| Main CTA | `Analyze context` | Explicit user action |
| File action | `Or choose a text/code file` | Secondary path |
| Task disclosure | `Add task context (optional)` | Not required |
| Result heading | `Analysis results` | Clear output |
| Token count | `[N] estimated tokens` | Honest counting label |
| Findings heading | `What you could improve` | User-oriented |
| No findings | `No clear structural issues found in this input.` | Avoids perfection claim |
| No draft | `No safe automatic changes were prepared.` | Differentiates advice from edits |
| Review CTA | `Review cleaned draft` | Required before copying |
| Review checkbox | `I reviewed the proposed changes` | Explicit acknowledgement |
| Copy CTA | `Copy reviewed draft` | No premature copy |
| Review risk | `Removing repetition can still change emphasis.` | Meaning-preservation caveat |
| MCP section | `Use PARE with compatible MCP clients` | No universal-install promise |
| Privacy reminder | `Review sensitive content before submitting.` | Honest boundary |

Use straightforward verbs; avoid “magic,” “lossless,” “perfect,” and “guaranteed.”

---

## 14. UI acceptance criteria / testable scenarios

**U01 — Single page:** Header, hero, analyzer, how-it-works, MCP/docs, and footer function without client routing.

**U02 — Paste-first:** The textarea is the visually primary input and accepts multiline content. File selection is secondary and cannot silently replace existing pasted text.

**U03 — Optional context:** Task details are collapsed on first load, accessible by keyboard, and never block submission.

**U04 — Explicit request:** No request occurs on page load, keystroke, or file selection. Only user submit sends content to the Worker.

**U05 — Original metric:** A successful analysis shows the original count and its tokenizer or estimation method.

**U06 — No speculative delta:** Suggestions without a validated draft show **no after count, token delta, reduction percent, or progress/savings bar**.

**U07 — Valid-draft comparison:** Before/after metrics are derived from exact original and draft text using the same method and are only rendered for a validated draft.

**U08 — Review gating:** Before review, draft-copy action is unavailable. Opening diff is required; after explicit reviewed-checkbox acknowledgement it becomes enabled. Changing input invalidates review.

**U09 — Untrusted rendering:** A pasted payload such as `<script>alert(1)</script>` displays as literal text and never runs.

**U10 — Protected content:** JSON, code, logs, and tool schema inputs receive advice-only recommendations; the UI does not advertise an automatically rewritten artifact.

**U11 — File safety:** Unsupported, binary or unreadable files do not replace current text and are not sent to the server.

**U12 — Network resilience:** A failed request preserves user input, shows a retry path, and never leaves a stale successful result.

**U13 — Clipboard:** Success is only announced after the browser confirms copy; failure has a selectable text fallback.

**U14 — Mobile:** At 320–390px widths, all controls and findings are usable with no horizontal page overflow.

**U15 — Accessibility:** Labels, focus rings, live statuses, keyboard disclosure, diff descriptions, and high-contrast behavior meet tested WCAG 2.2 AA objectives.

**U16 — Brand fidelity:** Official uploaded logo asset is used, with Document 03 colors and system fonts. No regenerated substitute or off-brand mark.

**U17 — Privacy:** No intentional history storage, no input in URL, no request content logged to application analytics, visible consent-by-submit notice.

**U18 — Website/MCP consistency:** Same content and options yield matching underlying counts/findings from the shared core; any differing presentation is explained.

### 14.1 Suggested usability fixtures

- One short clean paragraph (no findings).
- Two identical substantial prose paragraphs (valid draft + review).
- Blank-line-heavy prose outside code blocks (conditional reviewed draft).
- Markdown with fenced code (preserve code).
- JSON with many fields (advice only).
- JavaScript/Python with repeated-looking lines (no automatic code deletion).
- Repeated failure logs (advice only; no truncation).
- MCP tool metadata with long descriptions (advice only).
- Unicode, emoji, CRLF, empty input, malformed JSON, large content and HTML injection attempts.
- A task context change after analysis (invalidate previous draft).

---

## 15. Performance and reliability expectations

- Keep the page lean: a static HTML shell, one small CSS bundle, one vanilla JS script, compressed official logo asset.
- Avoid remote fonts, marketing trackers, heavy icon packs, large dependencies in the browser, and client-side frameworks.
- Prefer server-authoritative token counts and rules to multiple inconsistent implementations.
- Limit returned excerpts/diff previews so results are bounded. For longer valid drafts, provide a full selectable draft region without forcing giant page-height expansions.
- Provide text-based loading, error, and retry states; don't claim millisecond latency targets without benchmarks.
- Record no submitted prompts in normal application logs.
- Define concrete maximum input size and analysis timeout only after basic Cloudflare load tests; wire them into helpful UI messages.

---

## 16. Decisions that are now resolved

| Decision | Status |
| --- | --- |
| Single-page website | **Approved** |
| Paste-first, file secondary | **Approved** |
| Stacked result cards | **Approved** |
| Optional task context initially collapsed | **Approved** |
| Review cleaned draft before copying | **Approved** |
| Show before/after only for valid proposed draft | **Approved** |
| Dark-first, no toggle | **Approved in Document 03** |
| System fonts, no downloaded font | **Approved in Document 03** |
| Code/JSON/log/tool schemas advisory only | **Approved in Document 02** |
| No app database or stored history | **Approved in Document 01** |

---

## 17. Remaining decisions before `05-tech-stack.md`

**Do not silently choose these dependencies or policies during implementation.** Suggested defaults are proposals, not user approvals.

| ID | Decision to confirm | Recommended lightweight default | Reason / owner |
| --- | --- | --- | --- |
| T01 | Tokenizer package and model support | **One Worker-compatible JS tokenizer**, with named encoding and “estimate” fallback | Determines bundle size, correctness, browser display; Docs 05/08 |
| T02 | File extension allowlist | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log` | Need explicit parsing/validation test set; Docs 05/08/09 |
| T03 | Dependency/tooling style | npm + TypeScript + Wrangler + SDK + Zod; no bundler for frontend beyond Cloudflare tooling | Minimum maintainable setup; Doc 05 |
| T04 | MCP transport and local test method | Remote Streamable HTTP on Worker; MCP Inspector for tests | Finalize SDK adapter compatible with Cloudflare runtime; Docs 05/06/07 |
| T05 | Max input bytes and analysis timeout | Configurable conservative limits, final number after benchmarks | Can't invent platform-safe caps; Docs 06/09/10 |
| T06 | Anonymous public endpoint protection | Rate limiting + size cap; evaluate authenticated MCP before broad rollout | Security may affect compatibility, Docs 06/09/11 |
| T07 | File editing and output | Copy-only reviewed draft; no download in v1 | Smaller scope; Docs 05/08 |
| T08 | Packaging/distribution | Public GitHub repository + hosted `/mcp`; npm distribution only if real local install is planned | Registry requirements vary; Docs 05/11 |
| T09 | Test dependencies | Vitest for rules + manual browser a11y tests, then minimal automated browser tests if needed | Avoid Playwright unless its additional value is clear; Docs 05/10 |
| T10 | API/MCP response contract | Shared typed core with `original` always and `draft` only when valid | Final schemas in Docs 06/07 |

### Suggested questions for the next discussion

1. **Tokenizer:** Do we start with one well-supported tokenizer and label other model estimates, or immediately support multiple model tokenizers? **Recommend one.**
2. **Files:** Approve `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log` for v1, or narrow to `.txt` and `.md` first? **Recommend the seven-file allowlist if validation fixtures are included.**
3. **Tooling:** Confirm `npm + TypeScript + Cloudflare Wrangler + MCP SDK + Zod + Vitest`, with no framework and no database? **Recommend yes.**
4. **Public rollout:** Should the first Worker endpoint launch as a protected/limited beta, or be fully anonymous immediately? **Recommend protected/limited beta** until rate limits, transport compatibility, and abuse protection pass testing.

A decision to use a specific tokenizer, published registry namespace, web domain, or package name must be based on tested compatibility and availability. No package availability, trademark, or universal client installation is implied by this document.

---

## 18. Document traceability and change control

- **Document 01** defines the product, developer-first/both-audience positioning, lightweight architecture, six problem categories, and privacy boundaries.
- **Document 02** defines detection and safe cleanup boundaries, optional task context, honest measurement, and advice-only behavior on syntax-sensitive data.
- **Document 03** defines official logo provenance, sampled navy/lime (`#021020`, `#BDFB64`), derived accessible surfaces, dark-first UI, and system fonts.
- **Document 04** defines how those decisions become screens, interactions, error states, diff review, copy gates, and UI acceptance tests.

If a later document proposes a conflicting feature, describe it as a proposed change and obtain explicit approval before changing Documents 01–04. Preserve the source logo asset and the original user-submitted content in all cases.
