# PARE — Brand Guidelines

**Document:** `03-brand-guidelines.md`  
**Version:** 1.0 — working brand specification  
**Date:** 18 November 2026  
**Status:** Brand direction approved; external name clearance and final production asset export pending  
**Depends on:** [`01-product-overview.md`](01-product-overview.md), [`02-problems-and-solutions.md`](02-problems-and-solutions.md)  
**Next:** `04-ui-ux-design.md`

> **Implementation update (23 November 2026):** Frontend source is now framework-free TypeScript compiled by Vite. This does not change the approved logo, palette, typography, or brand-use rules.

> **Authority and source:** The user's uploaded lime-on-navy graphic is the definitive logo reference. The exact supplied image is copied without modification to [`assets/pare-logo-original.png`](assets/pare-logo-original.png). No newly generated, visually similar symbol should replace it. Colors below were sampled from the actual PNG; the image itself, not a manually reconstructed shape, is the authoritative design asset.

![Original PARE logo — three rounded lime bars and diagonal cut on deep navy](assets/pare-logo-original.png)

---

## 1. Purpose and scope

This document establishes the visual and verbal identity of **PARE**, a lightweight context and token optimization product delivered through a website and a Model Context Protocol (MCP) server. It governs website surfaces, MCP/plugin directory listings, GitHub assets, documentation screenshots, error messages, and eventual distribution materials.

This brand specification does **not** authorize additional product features. The approved v1 remains: HTML, CSS, vanilla JavaScript for the frontend; TypeScript, Cloudflare Workers, and the official MCP SDK for the backend; no database or account system; explicit user-submitted text and lightweight text/code files; conservative recommendations and optional reviewed cleaned drafts; an optional task description; application-level processing in memory without intentionally stored submitted content.

The principles are **recognizability at tiny sizes**, **clarity**, **trustworthy claims**, **accessibility**, **fast loading**, and **no decorative complexity that makes the product slower or harder to understand**.

## 2. Brand identity

### 2.1 Name and case rules (approved)

- **Official product name:** `PARE` in documentation, legal metadata, titles, registry descriptions, and running prose when the brand is first introduced.
- **Display wordmark:** lowercase `pare` is allowed as a deliberate typographic treatment alongside the logo, including on the website header and screenshots.
- Do not alternate case within a single lockup (`PaRe`, `Pare`, or `pAre`); avoid styling the name as an acronym unless context explicitly uses the official uppercase brand.
- **Pronunciation:** English verb *pare* (rhymes with *care*).
- **Meaning:** to cut away unwanted or excess material while preserving the useful part. In product messaging, emphasize **judgment and relevance**, not arbitrary deletion.
- **Working status:** the name has been selected for the project, but trademark, adjacent software-mark, domain, GitHub and npm checks have **not** established exclusivity or availability. Do not write “trademarked,” “verified,” or “official ChatGPT partner.”

### 2.2 Positioning

**Category:** AI context optimization / MCP developer utility.  
**Short directory description:** `Find wasted AI context and suggest safer ways to reduce tokens.`  
**Primary tagline:** **Keep what matters. Cut the rest.**  
**Supporting line:** `Analyze prompts, text/code files, and supplied MCP tool definitions. Find duplication, excess context, and clear optimization opportunities.`

**What PARE is:** a transparent analyzer and advice tool with optional conservative draft cleanup and before/after measurements.  
**What it is not:** an automatic all-conversation monitor, a replacement for an LLM, an autonomous file rewriter, a guarantee of lower bills, or a promise of lossless compression.

### 2.3 Brand personality

| Trait | Express through | Avoid |
|---|---|---|
| Precise | Specific findings and measured counts | Unsupported 50%/90% claims |
| Calm | Focused layout, restrained motion | Flashing banners, neon overload |
| Technical but approachable | Plain wording with optional detail | Dense jargon on public pages |
| Respectful | User review and diff visibility | Deleting content silently |
| Privacy-conscious | Clear disclosure of handling | Claiming the platform never sees inputs |
| Lightweight | Native browser controls, simple CSS | Framework-heavy visual effects |

## 3. Authoritative logo asset

### 3.1 Description of the uploaded source

The supplied source is a **214 × 169 pixel RGB PNG**, landscape aspect ratio (~1.266:1). It depicts **three bold rounded lime horizontal elements**, progressively shortened from top to bottom, with a diagonal notch/cut linking the shape visually. The background is **deep navy with subtle spatial color variation** rather than a flat solid fill. The logo has no text, and it is not a transparent-background vector.

This matters: the asset is **not currently square**, not a transparent SVG, and not an editable master. Any future square app-icon rendition must preserve the symbol proportions, curves, diagonal shape, and colors without stretching or arbitrarily rebuilding the mark. The original pixels remain the source of truth.

### 3.2 Asset policy

| Asset | Status | Intended use |
|---|---|---|
| `assets/pare-logo-original.png` | **Approved original; unaltered** | Brand reference, preview and source for approved exports |
| Transparent icon PNG | **Not yet approved/exported** | Optional later, if extracted cleanly from original |
| Square icon (e.g. 512×512) | **Production deliverable pending** | Plugin/registry image requirements; preserve aspect within a square canvas |
| SVG/vector master | **Not available** | Do not represent one as approved; manual tracing needs visual review |
| Text wordmark | **Typographic treatment approved in principle** | Use system font and spacing until bespoke lettering is approved |

**IMPORTANT:** `assets/pare-logo-original.png` is a relative documentation asset; retain that file alongside this Markdown when distributing docs. If the Markdown file is downloaded by itself, the embedded preview will not render until the image is copied with it.

### 3.3 Logo construction and export requirements

1. **Do not** distort the uploaded image to a square, skew, rotate, outline, recolor, add shadows to the lime shape, or turn the diagonal into an unrelated arrow.
2. For square app tiles, place the original graphic **proportionally** inside a dark navy square. Use background continuity and balanced padding; do not crop lime elements. Square asset creation requires visual review before publishing.
3. Use pixel-clean exports with no compression artifacts around rounded contours.
4. In navigation, use a square **approved icon variant when available**; until then, show the full original image using `object-fit: contain` with its native aspect ratio.
5. Keep separate **full-color on navy** and **single-color/high-contrast** variants only after they have been approved. Don't assume the current PNG works on white backgrounds.
6. Never create a logo by copying a vaguely similar image found online or generated independently.

### 3.4 Clear space and minimum size

Working rule pending final square asset: keep surrounding whitespace at least **one quarter of the rendered logo height** on every side, unless the original image includes this space as part of its canvas. Avoid combining external padding and large intrinsic padding so the mark looks too small.

- Website hero: show the original at approximately **100–160 CSS px wide** while preserving aspect.
- Header: show at **36–48 CSS px wide** where recognition remains clear; test on actual mobile and retina screens.
- Directory/app avatars: **test at 24, 32, and 48 px** using the approved square export. This is a test target, not a claim that the uploaded landscape PNG is legible at 24 px.
- If the symbol loses definition at smaller sizes, use an approved simplified icon variant or increase its display size rather than warping it.

## 4. Sampled brand palette (approved strategy)

### 4.1 Sampling methodology

Colors were sampled directly from the user-provided PNG: typical internal lime pixels cluster around `(189–190, 251–252, 99–102)`, and typical background pixels around `(1–5, 15–20, 30–38)`. The PNG contains slight pixel-level variation, likely intentional texture/lighting and antialiasing. Use the following **representative design tokens** for user-interface styling; they are **approximations of the image, not exact replacements for every image pixel**.

| Token | Hex | Source / function |
|---|---|---|
| `--pare-lime` | **`#BDFB64`** | Representative sampled logo lime; brand accent |
| `--pare-navy` | **`#021020`** | Representative sampled logo background; primary app canvas |
| `--pare-surface` | `#101E2D` | Derived dark surface; UI design token, **not directly sampled** |
| `--pare-surface-raised` | `#142537` | Derived hover/card surface |
| `--pare-border` | `#304256` | Derived structural border |
| `--pare-text` | `#F8FAFC` | Accessible primary text |
| `--pare-muted` | `#94A3B8` | Accessible supporting text on dark backgrounds |
| `--pare-danger` | `#FDA4AF` | Accessible warning/error text on navy |
| `--pare-focus` | `#BDFB64` | High-visibility keyboard focus ring |

**Color precedence:** approved source logo image > sampled reference colors > derived UI shades. Never recolor the uploaded brand asset to match a CSS token.

### 4.2 Contrast checks for selected combinations

Approximate WCAG relative luminance contrast ratios (calculated using sRGB conversion):

| Foreground on background | Ratio | Guidance |
|---|---:|---|
| Lime `#BDFB64` on navy `#021020` | **15.62:1** | Excellent for accent text/buttons; verify specific component states |
| White `#F8FAFC` on navy `#021020` | **18.29:1** | Preferred primary copy |
| Muted `#94A3B8` on navy `#021020` | **7.46:1** | Suitable for secondary body text |
| Navy `#021020` on white `#FFFFFF` | **19.13:1** | Suitable fallback for light export situations |
| Lime `#BDFB64` on white `#FFFFFF` | **1.22:1** | **Do not** use as ordinary text on white |

These pairs are checked as examples, not a blanket WCAG audit of all interface components. Contrast must be measured again for disabled, hovered, selected, and overlaid states. Don't convey severity through color alone.

### 4.3 CSS design-token starter

```css
:root {
  color-scheme: dark;
  --pare-navy: #021020;
  --pare-lime: #bdfb64;
  --pare-surface: #101e2d;
  --pare-surface-raised: #142537;
  --pare-border: #304256;
  --pare-text: #f8fafc;
  --pare-muted: #94a3b8;
  --pare-danger: #fda4af;
  --pare-focus: #bdfb64;
  --pare-radius-sm: 6px;
  --pare-radius-md: 10px;
  --pare-radius-lg: 16px;
  --pare-space-1: 4px;
  --pare-space-2: 8px;
  --pare-space-3: 12px;
  --pare-space-4: 16px;
  --pare-space-6: 24px;
  --pare-space-8: 32px;
}
```

### 4.4 Color usage and restraint

- Default background is navy; cards use derived dark surfaces rather than a wall of bright lime.
- Primary CTA: lime fill with navy label; secondary CTA: transparent or dark fill with text and visible border.
- Do **not** use lime to suggest guaranteed savings; use actual numerical results with explicit `estimated` labels.
- Report warnings in readable text with icons/labels; do not use red/green as the only signal.
- Keep code blocks mostly neutral; use lime sparingly for selected tokens, links and key actions.
- The existing logo may be used in contexts where the navy canvas matches it. Against a light page or third-party listing, use an approved square brand tile rather than transparentizing or recoloring it without review.

## 5. Theme and visual language

### 5.1 Dark-first only (approved)

The v1 product UI is **dark-first**, with **no theme toggle**. This reduces styling and testing complexity. Use a consistent navy backdrop across the website, analyzer, documentation area, and error states. Browsers/users with forced-colors or high-contrast settings must still be supported using native semantics and visible focus states; the brand preference does not override accessibility settings.

Light-background use cases such as directory previews, social cards and README renders should present the original logo **within an opaque navy tile**. Do not add a light-mode application in v1 solely to support a preview.

### 5.2 Shape, spacing and borders

- Rounded rectangular cards/controls, using 6–16px corner radii; avoid giant capsule pills for every element.
- Comfortable 8px-based spacing with 4px subdivisions.
- Use thin visible borders to separate dark surfaces; excessive drop shadows create visual noise.
- Prefer a clean, typographic layout to large illustration sections.
- Use simple neutral line icons when required; don't introduce another competing glyph family as branding.

### 5.3 Motion and microinteractions

- Use subtle CSS transitions (~120–200ms) only for hover, focus, or expandable detail.
- Respect `prefers-reduced-motion: reduce`; avoid animated token counters or decorative confetti.
- Success is displayed as a measured result, not celebratory animation.
- No autoplay video, parallax, gradient storms or heavyweight animation dependencies.

## 6. Typography (approved: system fonts)

Use **system UI fonts**, without third-party font downloads. This matches the performance and privacy goals.

```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  color: var(--pare-text);
  background: var(--pare-navy);
}
code, pre, .metric-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", monospace;
}
```

Suggested **starting** responsive type scale (final layouts belong to Document 04):

| Text role | Desktop | Mobile | Weight |
|---|---|---|---|
| Hero title | 44–56px | 32–40px | 700 |
| Section title | 26–32px | 24–28px | 650–700 |
| Card title | 18–20px | 18px | 600 |
| Body copy | 16px | 16px | 400 |
| Supporting text | 14px | 14px | 400 |
| Technical values | 14–20px monospace | 14–18px | 500–650 |

- Use real text (not rasterized image text) for `PARE`/`pare` wordmarks outside the supplied symbol.
- Prefer sentence case for navigation, labels, messages, and CTAs.
- Use adequate line height for long recommendations; do not make 12px text the default.
- Keep numerical metrics in tabular numerals when supported (`font-variant-numeric: tabular-nums`).
- Avoid tracking-heavy uppercase paragraphs; uppercase is acceptable only for tiny editorial overlines with sufficient contrast.

## 7. Wordmark and lockups

**Two approved naming presentations:**

1. **Documentation and metadata:** `PARE` (uppercase official name).
2. **Marketing UI header:** `pare` (lowercase design wordmark), preferably next to the approved symbol.

Working horizontal lockup: **[original symbol] + [pare text]**, visually aligned by optical center, with clear separation. The mark must not substitute for the letters in the name unless a custom wordmark is approved. No alternate logotypes or letterforms are official yet.

**Examples:**

- Website browser title: `PARE — AI context optimization`.
- GitHub project title: `PARE — Keep what matters. Cut the rest.`
- Plugin/registry product name: `PARE`.
- UI header wordmark: `pare` next to the logo.
- Documentation H1: `PARE — Brand Guidelines`.

## 8. Product copy and microcopy rules

### 8.1 Writing voice

Clear, concise, professional but approachable. Speak to both agent builders and everyday ChatGPT/Claude users; define unfamiliar terms once. Prefer short specific verbs: **analyze**, **review**, **compare**, **copy**, **keep**, **remove**, **inspect**.

### 8.2 Required trust language

- Say **“estimated token count”** if the chosen model tokenizer is not exact or supported.
- Say **“potential reduction”** when an action hasn't been applied and counted.
- Say **“cleaned draft”** rather than **“lossless compressed text.”**
- Always disclose that task descriptions are optional hints and do not establish semantic relevance automatically.
- Clarify that PARE **cannot inspect ChatGPT conversations or other agent calls automatically**; compatible clients must explicitly submit content.
- For privacy, write **“PARE does not intentionally store submitted content in an application database”** instead of an unverified claim like **“nothing is ever logged anywhere.”** Hosting provider, client and network handling must be documented in the privacy policy.

### 8.3 Example interface copy

| Context | Recommended text | Avoid |
|---|---|---|
| Hero | `Keep what matters. Cut the rest.` | `Zero-token AI, guaranteed.` |
| Supporting | `Find repeated or oversized context before sending it to AI.` | `Automatically monitors every prompt.` |
| Input | `Paste text or choose a supported text/code file.` | `Upload anything.` |
| Optional field | `What are you trying to do? (optional)` | `AI knows which content matters.` |
| Primary CTA | `Analyze context` | `Magically optimize` |
| Secondary action | `Review cleaned draft` | `Fix everything` |
| Comparison | `Estimated tokens before / after` | `Guaranteed savings` |
| Security hint | `Review sensitive content before submitting.` | `100% private on all systems.` |
| No issues | `No clear structural issues found in this input.` | `Perfect prompt` |
| Unsupported file | `This file type isn't supported. Try a text or code file.` | `Invalid input` |
| Potential risk | `Review the proposed edit; meaning may change.` | `Safe to delete` |

## 9. Accessibility and responsive identity

### 9.1 Minimum accessibility rules

- Target WCAG 2.2 AA for the website; audit actual implementations, not just palette swatches.
- Use semantic HTML, correct heading order, labels, and native buttons where appropriate.
- Visible keyboard focus ring: 2–3px lime with offset so it remains distinct from button fill.
- Avoid placeholder-only labels; status updates for results should be announced accessibly as appropriate.
- Provide meaningful logo alt text (`PARE logo`) when it identifies the product; use empty alt when an adjacent text wordmark already does so and duplication would be distracting.
- Communicate changes through text/diff and not colors alone. Use `+`/`−`, accessible labels, and line context.
- Ensure zoom to 200%/400% does not hide analyzer actions or break navigation; verify mobile widths.
- Support reduced motion and platform forced-colors preferences even though no light theme is offered.

### 9.2 Responsive logo rules

- Small layouts may use the icon plus a short `pare` label; do not shrink the entire landscape image until it becomes illegible.
- Mobile spacing and icon cropping must be tested with the **actual** asset.
- The three lime bars are distinctive; never replace them with stock scissors, coins, robots or generic AI sparkles.

## 10. Design examples and non-examples

### Do

- Show an uncluttered analyzer panel on navy, with a readable text field, a lime `Analyze context` button, and a clear result explanation.
- Use an understated bordered card for recommendation severity, supporting rationale and an optional edit/diff.
- Use `PARE` in metadata and `pare` as a deliberate visible wordmark treatment.
- Use the **original** user-uploaded mark, proportionally scaled.
- Present the measured original and edited token counts, with tokenizer or estimation qualification.

### Don't

- Use arbitrary percentage-saving claims in brand graphics unless supported by a real measurement and cited context.
- Show simulated background monitoring of ChatGPT or a recording indicator implying access to chats.
- Use green text on white, gradients that compromise contrast, or a bright lime page background.
- Automatically remove code, JSON keys, logs or structural content under the label “safe cleanup.”
- Promote fake endorsement from GitHub, MCP Registry, OpenAI, or Cloudflare.
- Alter the logo because a generated or vectorized approximation looks cleaner.

## 11. Public and developer surfaces

### 11.1 Website

Brand treatment: `pare` + approved mark in header; `Keep what matters. Cut the rest.` in the hero; restrained lime CTA. Dark-first only, no theme toggle. Content should be useful even before the MCP connection exists. Website IA and components are a Document 04 decision.

### 11.2 GitHub repository

Use `PARE` in the README heading. Include approved source image or approved square export in a relative path; add a short plain-language summary, installation instructions, privacy limitations, and accurate screenshots. Never present a visual mockup as proof of an implemented feature.

### 11.3 MCP and AI client directory cards

Proposed display title: **PARE**.  
Proposed one-line description: **`Spot wasted AI context and review ways to reduce token use.`**  
Icon: approved square export derived from original logo.  
Tool descriptions and compatibility statements must be functional and truthful, not purely marketing copy.

Exact marketplace icon dimensions, file-format limitations, metadata and account eligibility must be verified against current submission documentation before publishing; a registered MCP server is not automatically distributed in all ChatGPT plans.

### 11.4 Error and status identity

Errors should use neutral layout and specific recovery guidance, not dramatic red full-screen overlays. For unsupported file, oversize payload, unavailable tokenizer and network failure, preserve the user's browser-entered content where feasible and do not claim analysis succeeded.

## 12. Practical CSS component examples

The snippets below are illustrative design references, **not** a complete UI or a request to add a framework.

```css
.pare-app {
  background: var(--pare-navy);
  color: var(--pare-text);
  min-height: 100vh;
}
.pare-card {
  background: var(--pare-surface);
  border: 1px solid var(--pare-border);
  border-radius: var(--pare-radius-lg);
  padding: var(--pare-space-6);
}
.pare-button-primary {
  color: var(--pare-navy);
  background: var(--pare-lime);
  border: 2px solid transparent;
  border-radius: var(--pare-radius-md);
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
}
.pare-button-primary:focus-visible,
.pare-link:focus-visible {
  outline: 3px solid var(--pare-focus);
  outline-offset: 3px;
}
.pare-button-secondary {
  background: transparent;
  color: var(--pare-text);
  border: 1px solid var(--pare-border);
  border-radius: var(--pare-radius-md);
  padding: 10px 16px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

**Implementation note:** Test focus visibility on both button colors. The design tokens do not replace component-level accessibility QA.

## 13. Brand asset workflow and QA checklist

### Asset handling

1. Keep `assets/pare-logo-original.png` unchanged; store hashes for release integrity if desired.
2. Create proposed production exports **from the approved image**, without repainting the symbol.
3. Present square icon, app-sized previews, and any transparent/vector alternatives for human approval.
4. Verify icon readability at 24/32/48px and directory-specific resolutions on both dark and light surrounding UIs.
5. Verify no colored halo, ragged edges, crop, or stretched aspect ratio.
6. Include source/ownership attribution internally; ensure commercial usage rights belong to the project owner.
7. Publish only approved exports, avoiding mistaken substitution with unrelated old mockups.

### Website checks

- [ ] Correct mark and name presentation in all header/hero/documentation surfaces.
- [ ] Dark-first only; no half-implemented light theme.
- [ ] Token values, warnings, and labels are legible and correctly qualified.
- [ ] Keyboard-only navigation and focus indicators work.
- [ ] Responsive layout preserves logo proportions and readable copy.
- [ ] No external font requests or unnecessary UI libraries.
- [ ] Contrast meets target in real components, not solely palette examples.
- [ ] Sensitive-content wording is consistent with actual platform behavior.
- [ ] No claims of automatic interception or guaranteed optimization.

## 14. Resolved vs. outstanding decisions

### 14.1 Decisions resolved by the user

| ID | Decision | Resolution |
|---|---|---|
| B01 | Brand name case | `PARE` official; lowercase `pare` permitted as styled wordmark |
| B02 | Logo | User's exact uploaded asset is authoritative |
| B03 | Palette strategy | Sample logo colors, derive accessible UI shades |
| B04 | Theme | Dark-first, no v1 theme toggle |
| B05 | Typography | System UI fonts; no webfont downloads |
| P04 | Cleanup (Document 02) | Conservative draft edits, visible review/diff |
| P05 | Task context (Document 02) | Optional task description |

### 14.2 Open decisions to discuss **before** `04-ui-ux-design.md`

**Please resolve the following before drafting the UI specification, rather than silently treating suggested defaults as requirements:**

1. **Page structure:** one single-page website with sections (Home / Analyzer / Docs), or separate lightweight routes/pages? **Recommended:** single-page landing + analyzer; documentation linked to GitHub Markdown initially.
2. **Analyzer entry:** paste-first with a clearly labeled file picker, or equal prominence for paste and file? **Recommended:** paste-first, file option secondary.
3. **Result presentation:** one results screen with tabs (`Summary`, `Suggestions`, `Compare`) or three stacked cards? **Recommended:** stacked cards for the smallest, simplest UI.
4. **Copy flow:** should a proposed cleaned draft be copyable only after expanding a visible diff/review panel? **Recommended:** yes, require explicit review before copy.
5. **Task description placement:** collapsed `Add task context (optional)` detail or always-visible field? **Recommended:** collapsed, with a simple example and privacy notice.
6. **Output display:** show original and suggested estimated tokens as headline figures only when a valid cleaned draft exists; otherwise show original token count and recommendation text without inventing an after-state. **Recommended:** yes.

Additional later decisions retained from Documents 01–02: file extension allowlist and size caps; Worker-compatible tokenizer and model support; final MCP tool names/schemas; public access controls/authentication/rate limits; license and publication clearance; official production square-icon export. Their absence must not be disguised by design mockups.

## 15. Relationship to the documentation series

- **Document 01** defines what PARE is, its scope, users, metrics, privacy intentions, and overall architecture.
- **Document 02** defines the six problem classes, detection guidance, safe edits, optional task context, and measurable outcome rules.
- **This Document 03** defines the brand, visual tokens, authoritative logo handling, copy voice, and design constraints.
- **Document 04** will define exact screens, mobile layouts, interface states, file picker handling, result flows, accessibility behaviors and approved interactions—*after* resolving Section 14.2.
- Later architecture and engineering documents must not add a database, React/Next.js, an LLM API, unrestricted document parsing, or automatic AI-conversation monitoring without a product decision.

**Change-control rule:** If a future brand or UX decision changes an approved assumption, record it explicitly in the newer document and update the relevant decision table in Documents 01–03. The logo source itself must never be overwritten by a generated lookalike.
