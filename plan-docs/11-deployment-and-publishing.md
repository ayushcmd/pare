# PARE — Deployment, Open-Source Release & Registry Publishing

**Document:** `11-deployment-and-publishing.md`  
**Version:** 1.0 — release and publishing specification  
**Prepared:** 18 November 2026  
**Status:** Approved deployment direction and conditional launch checklist; **no deployment, publishing, verification, or platform approval is claimed to have occurred**  
**Depends on:** Documents `01-product-overview.md` through `10-testing.md`  
**Brand:** **PARE** — *Keep what matters. Cut the rest.*  
**Ownership:** Ayush Raj; personal GitHub repository `ayushcmd/pare`
**License:** **Apache License, Version 2.0** (approved)

> **Release principle:** Ship one small, inspectable service securely before publishing to directories. A repository listing, registry record, operational deployment, and ChatGPT public plugin approval are **four distinct events**. None automatically guarantees the next.

> **Implementation update (23 November 2026):** Publishing must package both the remote Streamable HTTP endpoint and optional local stdio entry, and registry metadata must advertise only the two implemented tools. Browser-local website analysis is public-capable without opening Worker compute. See [`00-implementation-baseline.md`](./00-implementation-baseline.md).

---

## 1. Authority, scope, and frozen owner decisions

This document completes the eleven-document product-specification series. It operationalizes, but does not override, the architecture, contracts, security policies, and test gates from Documents 01–10. These decisions are **locked**:

| Topic | Approved rule | Source |
|---|---|---|
| Name/visuals | PARE; uploaded original PARE symbol; sampled navy `#021020` and lime `#BDFB64`; dark-first, system-font website | 01, 03 |
| Audience | Developers first, also everyday AI users | 01 |
| UI | Single page, paste-first; secondary file selection; optional task context collapsed; stacked results | 04 |
| Review | A valid cleaned draft requires visible full-diff review before copy; no fabricated before/after metrics | 02, 04 |
| Stack | HTML, plain CSS, vanilla JS, TypeScript, official MCP TypeScript SDK v2, Zod, npm, Wrangler, Vitest | 05 |
| Runtime | **One Cloudflare Worker per environment**, with public static assets and shared analysis core | 05–06 |
| Persistence | No app database, saved prompt history, external LLM, React/Next.js, Redis, Docker or PDF ingestion | 01, 05–06 |
| Input files | `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.log`; browser extracts local UTF-8 text; remote MCP receives explicit text | 05–07 |
| MCP tools | Exactly `analyze_context`, `suggest_optimizations`, `compare_tokens`; text summary + `structuredContent`; `schemaVersion: "1.0"` | 07 |
| Safety | `includeDraft: true` opt-in; automatic draft changes restricted to **exact duplicate standalone prose paragraphs**; never code/JSON/log edits | 02, 07–08 |
| Task relevance | Optional task description reorders recommendations via keywords, never authorizes deletion | 08 |
| Comparison | Original and candidate required; empty candidate accepted with strong warning | 07–08 |
| Evidence | Zero-based line references, no snippets (`snippet: null`) | 07–08 |
| Access | **Public landing page**; **protected** analyzer API; **invite-only MCP** during beta | 06, 09 |
| Identity | Cloudflare Access; Managed OAuth considered for MCP; Worker verifies Access JWT; prove Cursor/Inspector interoperability | 09–10 |
| Logs/rate | Minimal operational metadata, never prompt bodies; Cloudflare-managed rate protection plus bounded workload | 09 |
| QA | Vitest, MCP Inspector + Cursor, lightweight deployed staging smoke tests, synthetic fixtures only; strict release-blocking gates | 10 |
| Hosting & distribution | Cloudflare Workers, personal GitHub repository, Apache-2.0, then MCP registry, then separate ChatGPT review | Owner decision for 11 |

**Precedence:** If a suggestion below is incompatible with existing MCP tool schemas, the document identifies it as a proposed change, not an implicit alteration. Reserved `extra_blank_lines_collapsed` changes from Document 07 **must not be emitted by v1**. No unapproved authentication workaround, data store, or background agent is permitted.

### 1.1 Purpose and scope

Describe: local-to-staging-to-production deployments; environment and secret isolation; branch/tag strategy; Apache-2.0 legal files; GitHub repository publishing; official MCP Registry metadata, ownership, CLI and verification; the *different* GitHub MCP catalog; OpenAI ChatGPT plugin eligibility and submission; final security/privacy checks; rollback and incident containment; and owner decisions still outstanding.

### 1.2 Explicit non-goals

No implementation of the backend itself, no promise that a `workers.dev` hostname or trademark is available, no automatic npm package publication, no public unauthenticated MCP endpoint during beta, no unsupported claim of ChatGPT account eligibility, no promise of directory acceptance, no legal conclusion about trademark clearance, and no invented pricing/quotas. Release commands are **templates to execute only after credentials, endpoints, configs and tests exist**.

---

## 2. Release surfaces: distinguish what is actually published

| Surface | What is published | Audience | Prerequisite | Not guaranteed |
|---|---|---|---|---|
| Public website | HTML/CSS/JS and logo over Cloudflare HTTPS | Anyone | Worker with correct static routing | Analyzer access: remains protected |
| Protected analyzer API | `/api/analyze` on same Worker | Approved beta testers only | Access policy + Worker validation + Cloudflare limits | Anonymous use |
| Protected MCP endpoint | `/mcp` using Streamable HTTP | Invited, verified beta testers | MCP transport + Cloudflare Access/OAuth + client tests | Every client can connect |
| GitHub repository | Apache-2.0 source, documentation, reproducible setup | Public source readers | Redaction, license, maintainer review | Registry listing or live service |
| Official MCP Registry | Versioned `server.json` metadata with remote endpoint | MCP ecosystem clients/discovery | Namespace ownership, valid metadata, reachable remote | Inclusion in GitHub's curated catalog |
| GitHub MCP catalog | Separately surfaced curated/discoverable listing | Supported Copilot/VS Code workflows | Ecosystem indexing and GitHub criteria | Instant appearance after registry publish |
| ChatGPT public plugin directory | Reviewed remote MCP integration and listing | Eligible users of the directory | OpenAI review, verified identity, URL/auth tooling, privacy/legal materials | Approval, plan support or immediate availability |

**Key launch tension:** A registry *remote* endpoint must be publicly reachable at its advertised URL; an OAuth-protected endpoint can be Internet-reachable while still requiring authentication. Nevertheless, a private tester-only Access policy may make it unusable for ordinary registry users and automated crawlers. **Do not promote a public-install claim while access is invite-only.** A public directory launch needs a separately reviewed and tested onboarding/authentication policy—without exposing tools anonymously by accident.

---

## 3. Repository ownership, structure, and release hygiene

### 3.1 Personal account

Official code location is **`https://github.com/ayushcmd/pare`**, owned by Ayush Raj. The npm package name `pare-mcp` is prepared but remains unpublished and unreserved. Do not imply that the GitHub repository owns the global PARE trademark or package namespaces. Use a GitHub-based MCP Registry name under `io.github.ayushcmd` only after validating its actual schema and availability at publishing time.

### 3.2 Recommended public repository layout

```text
pare-mcp/
├── LICENSE                         # Unmodified Apache License 2.0 text
├── NOTICE                          # Only if required/useful for applicable notices
├── README.md                       # Description, quickstart, safety, tested clients
├── CONTRIBUTING.md                 # PR/review/test process
├── CODE_OF_CONDUCT.md              # Optional, simple project policy
├── SECURITY.md                     # Responsible disclosure, support lifecycle
├── PRIVACY.md                      # Accurate data practices; platform qualifications
├── TERMS.md                        # If required for public service/directory
├── CHANGELOG.md                    # SemVer and changes to tools/schemas
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/deploy-staging.yml   # Optional, gated
│   └── workflows/deploy-production.yml # Manual approval gate
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── assets/pare-logo.png        # Approved asset only
├── src/
│   ├── index.ts                     # Routing & Worker auth boundary
│   ├── api/
│   ├── mcp/
│   └── core/                       # Shared deterministic logic
├── tests/                           # Synthetic fixtures only
├── docs/
│   ├── 01-product-overview.md
│   ├── ...
│   └── 11-deployment-and-publishing.md
├── server.json                      # Official MCP Registry metadata when ready
├── package.json
├── package-lock.json
├── tsconfig.json
└── wrangler.jsonc
```

The actual file layout may follow Document 05's approved minimal organization; the names above illustrate release-facing files. **Never commit** `.env`, `.dev.vars`, API tokens, test-user identity tokens, Access JWTs, OAuth credentials, production request/response payloads, client prompt history or genuine private files. Use `.gitignore` and manual secret scanning. Keep the original logo file and any approved square icon export; do not replace the user-provided artwork with an AI-generated approximation.

### 3.3 Apache License 2.0

- Obtain the full unmodified **Apache License, Version 2.0** text from https://www.apache.org/licenses/LICENSE-2.0 and commit it as `LICENSE`.
- Put `"license": "Apache-2.0"` in `package.json` and use that SPDX identifier in any package/registry metadata where allowed.
- Use an appropriate copyright notice for the actual owner and year; don't guess the owner's legal name or copyright holder.
- Add `NOTICE` where applicable, including notices that must be preserved from included code; it is **not** automatically mandatory for every freshly authored Apache-licensed project.
- Apache-2.0 permits commercial redistribution with conditions, requires preservation of notices and statement of significant changes in modified files where applicable, and includes an express patent license. It **does not** grant rights to use a project's trademarks. Keep branding/third-party assets rights separate from the source-code license.
- Inventory dependencies and check third-party license obligations before release. A license declaration in `package.json` is **not** a substitute for committing the license file.
- Do not reuse external branded artwork without suitable rights. Confirm the rights to distribute the approved original PARE logo.

### 3.4 Required repository disclosure

The initial README should state: what PARE does; which inputs are supported; deterministic, heuristic optimization; draft review limitation; tokenizer encoding and estimation caveat; no automatic monitoring of chat history; no PDF support; privacy/no application storage with Cloudflare platform qualification; protected beta access; tested client and version; how to run tests; support/security channels. No fake “works in all ChatGPT accounts” or “saves X% on average” claims.

---

## 4. Cloudflare environments and deployment topology

### 4.1 One codebase, two isolated deployments

```text
                         GitHub personal repository
                                  │
                     npm ci → typecheck → Vitest
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                staging Worker             production Worker
                separate host              separate host
                Access app/audience         Access app/audience
                test identities             approved identities
                     │                         │
           GET / (public static)     GET / (public static)
           POST /api/analyze         POST /api/analyze
           /mcp (protected)          /mcp (protected in beta)
                     └─────── shared tested TypeScript core ───────┘
```

Cloudflare Wrangler named environments create **separately deployed Workers**; they are *not* separate servers within one Worker. Production may initially remain undeployed while staging is validated. Environment-specific Access policies, audiences, secret bindings, DNS/routing, logs and controls must remain distinct.

### 4.2 Hostname policy

- **Staging:** Use a verified protected `*.workers.dev` name if Cloudflare Access can cover every path and alternate hostname. Prefer a separate staging hostname rather than publishing an unprotected preview link.
- **Production:** Start with an approved Worker hostname behind HTTPS; consider a custom domain **after PARE name/trademark and domain ownership checks**. A durable domain is strongly preferable before submitting to a public directory, but don't buy a domain solely for this document.
- **Alternative hosts:** Inventory preview/version URLs, `workers.dev`, custom routes, aliases and deployment previews. Each route reaching protected handlers must enforce equivalent access; otherwise disable it. An Access policy tied to only one custom hostname does not automatically protect every route to the Worker.
- Use a **real stable HTTPS URL** in public registry/directory metadata. Never publish illustrative `example.com` URLs as if they were live.

### 4.3 Example Wrangler configuration (review before executing)

This is a **configuration proposal**, not proof of installation or successful deployment. Cross-check `main`, `assets`, selected SDK/runtime, `compatibility_date`, and named-env behavior with pinned Wrangler and actual Cloudflare plan:

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
  },
  "env": {
    "staging": {
      "name": "pare-mcp-staging",
      "vars": { "APP_ENV": "staging" }
    },
    "production": {
      "name": "pare-mcp-production",
      "vars": { "APP_ENV": "production" }
    }
  }
}
```

**Important:** Wrangler non-inheritable settings and environment-specific bindings may require explicit repetition in each `env` object; verify resolved config in a dry-run and deployed smoke checks. `vars` must contain **only non-secret strings**, not tokens or identity secrets. No guessed Worker plan or rate-limit configuration is asserted. An acceptable alternative is `run_worker_first: true` if testing proves path-pattern matching insufficient, at the cost of invoking the Worker for all assets.

### 4.4 Server-side router requirements

| Route | Intended visibility | Expected handling |
|---|---|---|
| `GET /` and approved static asset GETs | Public | Static asset response; MIME and cache policy appropriate to asset |
| `POST /api/analyze` | Access-approved beta users | Origin/CSRF defenses as applicable; JWT verification; validated, bounded JSON; no-store result |
| `/mcp` | Access-approved beta users | Auth verification **before** SDK; SDK handles valid Streamable HTTP methods and negotiation; no-store data |
| `/mcp/*` | Only if SDK actually needs them | Worker first, enforce same Access policy; unknown routes fail closed |
| Unknown `/api/*` | No public API access | Safe 404/405 JSON, no asset fallback |
| `/api/health` | Optional dev/staging only | No secret diagnostics or public internal details |

Reject malformed methods, bodies, unsafe origins, unknown paths and excessive inputs before expensive work; do not write a custom JSON-RPC implementation. Protect the `POST`, `GET`, `DELETE` and preflight/metadata paths as required by the actual SDK and OAuth flows, without indiscriminately blocking legitimate protocol handshakes. Do not assume CORS makes an endpoint authenticated.

---

## 5. Local development, staging, and production commands

### 5.1 Prerequisites

1. A personal GitHub account with repository creation rights.
2. A Cloudflare account with Workers and Cloudflare Access eligibility for the chosen configuration. Check limits/cost/managed OAuth availability in the actual plan.
3. Locally installed supported Node.js and npm; pinned compatible `wrangler`, TypeScript, MCP SDK v2, Zod, and Vitest. Record versions in the lockfile.
4. Approved source tree and original PARE logo, synthetically generated test fixtures, release docs.
5. A designated maintainer capable of Access policy configuration, identity revocation, and rollbacks.

### 5.2 Local validation

```bash
npm ci
npm run typecheck
npm test
npx wrangler deploy --dry-run
npx wrangler dev
```

These commands assume the package scripts are implemented, as specified in Document 05; they are **not** evidence that PARE already has a running app. Test static routing, `tools/list`, all three tool calls, `includeDraft` gating, diff review, invalid input, and tokenizer canary. Use local synthetic fixtures only.

### 5.3 Staging deployment

```bash
# Authenticate Cloudflare CLI interactively without committing credentials.
npx wrangler login

# After checking the resolved environment and bindings:
npx wrangler deploy --env staging
```

Then provision the matching **staging** Cloudflare Access application and route/path policy, enable Managed OAuth if selected for MCP, and configure identity allowlist and Cloudflare-managed rate controls through the platform. Do not test invitation flows using credentials placed in source code or static assets. All secrets are managed through Cloudflare secrets/platform settings; values are not echoed into CI logs.

Staging smoke checks must establish:

- `GET /` returns the correct public website and logo without an Access challenge.
- An unauthenticated request to `/api/analyze` or `/mcp` fails appropriately and executes **no** analysis code.
- Wrong issuer, audience, expired/revoked JWT, forged `Cf-Access-Jwt-Assertion`, alternate host and path variants cannot bypass protection.
- Valid Access-authenticated MCP Inspector and Cursor sessions can discover and call exactly three tools. If the authentication flow cannot be completed, mark compatibility **blocked**; do not silently switch to shared keys.
- `Cache-Control: no-store`, log-redaction rules, Cloudflare WAF/rate-limiting controls, bounded performance and size limits work against synthetic probes.
- Public website cannot access raw server source, `.env`, `.dev.vars`, or other protected artifacts.

### 5.4 Production beta promotion

**Do not promote to production simply because staging deployed.** Apply Document 10's acceptance checklist, capture redacted evidence, obtain maintainer signoff, snapshot tested commit SHA/configuration, verify staging Access policy and cloud quota settings, and prepare rollback/revocation.

```bash
# Only after the explicit release gate and production Access controls are ready:
npx wrangler deploy --env production
```

Repeat the **same** smoke matrix against real production hostname(s) using approved test identities. Private login flows must not make the public landing page inaccessible. Public beta launch means public website availability, **not** public anonymous analysis.

### 5.5 Exact operational values still undecided

Set these **from measured staging benchmarks** and plan capabilities, not guessed numbers:

| Configuration | Must be measured or approved |
|---|---|
| Maximum UTF-8 input bytes | Peak Worker memory/CPU behavior and abuse risk |
| Maximum lines, paragraphs and findings | Linear scanning bound and response-size cap |
| Maximum optional task description | Privacy and CPU budget |
| Maximum comparison output size | Response and browser-diff cost |
| Maximum requests per tester and IP | Cloudflare plan feature, shared-network effects |
| Request CPU/deadline | Cloudflare plan plus tested safety margin |
| Tokenizer bundle/cold start | `js-tiktoken` Worker runtime compatibility |
| Actual Cloudflare billing | Plan, traffic, Access quotas, WAF features |

Store non-secret values in validated environment configuration and record them in change notes; do not invent a marketing latency/SLA before measurement.

---

## 6. Cloudflare Access, MCP OAuth, and beta admission

### 6.1 Approved beta posture

The *site is public*, but the analyzer API and MCP tool execution require invitation and verified identity. Cloudflare Access is the owner-selected authentication platform. Access **Managed OAuth** supports MCP clients using OAuth 2.0, but connection is client-dependent; the MCP server must validate the Access JWT Cloudflare sends (not blindly trust a request header). Configure accepted issuer, audience, signature, expiry and per-route access. Use separate Access apps/audiences for staging and production.

Cloudflare's maintained Managed OAuth instructions specifically require validation of the `Cf-Access-Jwt-Assertion` JWT when its MCP Access OAuth flow is enabled. Validate via trusted JWKS/token library and configured issuer/audience rather than accepting arbitrary bearer tokens or unverified client-provided headers. Do not expose Access tokens in query strings, browser local storage, logs, repos, screenshots or shared documentation.

### 6.2 Browser analyzer access

Public UI displays clear “Beta access required” copy when the protected `/api/analyze` rejects an anonymous user. Approved testers use the configured Cloudflare Access browser flow. Define same-origin access, no dangerous wildcard CORS, appropriate Origin/CSRF behavior for cookie-authenticated requests, `no-store` results, and generic denial errors. A public frontend bundle **cannot safely carry a shared API secret**.

### 6.3 Fallback policy if Cursor/OAuth compatibility fails

Release **blocked**, or owner decides a narrower explicitly tested launch. Do **not** silently switch from Access to a weak shared bearer token, strip authentication to satisfy a registry, or claim Cursor support without a real test. A different design requires a written amendment to Documents 06, 09, 10, and 11, with new adversarial tests.

### 6.4 Public installation transition (separate approval)

Invite-only Access policy serves beta testers but does not automatically serve all GitHub Registry or ChatGPT users. Before broad discovery, decide whether eligible users may self-authorize via a public OAuth flow or whether the directory entry must explicitly describe restricted beta access. Test legitimate sign-up, identity controls, abuse resistance and the provider review flow **before** advertising a one-click install. Maintain the private beta separately until this change is approved.

---

## 7. GitHub release process and Apache-2.0 publication

### 7.1 Before making the repository public

- [ ] Owner confirms the personal GitHub username, repository name and rights to the original PARE logo.
- [ ] Search exact and confusingly similar **PARE** names and marks in relevant jurisdictions/classes; check GitHub/npm/domain availability if those names are to be used. The common English word “pare” is **not** automatically an exclusive software brand.
- [ ] `LICENSE` contains the correct Apache-2.0 text and metadata uses SPDX `Apache-2.0`; appropriate notices are present.
- [ ] `README.md` reflects actual features, current beta restrictions and validated client support.
- [ ] `PRIVACY.md`, `SECURITY.md`, a contact path and, when needed, `TERMS.md` have truthful information and real operator identity.
- [ ] No secrets, synthetic fixtures accidentally containing real PII, private content, test account details, .env files, or tokens in files **or Git history**.
- [ ] Original logo has appropriate ownership/license clearance and approved square export for directory listings.
- [ ] `npm ci`, typecheck, Vitest, Worker build/dry-run and dependency/license review pass.
- [ ] GitHub branch protection and required PR checks are set where account capabilities support them.

### 7.2 Suggested GitHub workflow

1. Initialize a private repository under the **personal** GitHub account.
2. Commit source, `package-lock.json`, docs, Apache license, README, contribution and security guidance; use safe fake values in examples.
3. Run CI on pull requests; use GitHub secrets or preferably OIDC/short-lived scoped credentials where Cloudflare deployment supports them. Never echo `CLOUDFLARE_API_TOKEN`.
4. Tag first tested beta source release `v0.1.0-beta.1` (proposed, not an existing release). Note that this is not the MCP Registry version until published metadata matches.
5. Publish the repository when the redaction, license and source-review gates pass. A public repo may precede a publicly usable remote service as long as README clearly discloses access restrictions.
6. Create GitHub Release notes showing feature scope, tested commit, compatibility, safety limitations and issue-reporting channels.

**Proposed versioning:** SemVer for public software; `0.x` for evolving interface; MCP tool schema `schemaVersion: "1.0"` remains stable until a separately approved breaking-change policy. Updating a registry server version, README and production deployment must be coordinated. No automatic major schema changes.

### 7.3 Minimal CI (conceptual)

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24' # Confirm supported Node LTS / project .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npx wrangler deploy --dry-run
```

Pin action commit SHAs and dependency versions for high-assurance CI when implementing; `@v4` is illustrative. **CI must not automatically deploy production for every push.** Use explicit protected environment approval and deploy only the tested artifact/commit. Security and review gates outrank green cosmetic tests.

---

## 8. Official MCP Registry publishing — remote server

### 8.1 Terminology and eligibility

The **official MCP Registry** is hosted at `registry.modelcontextprotocol.io` and maintained by the MCP ecosystem. **GitHub's MCP Registry/catalog** is a separate discovery surface; publishing in the official registry does **not** guarantee immediate inclusion in GitHub's curated listing. The official Registry remains labeled **preview** in its documentation as of this writing; API/schema rules can change.

The remote Registry metadata may point to a hosted Streamable HTTP endpoint and does **not** require an npm package. It requires a remote URL accessible from the public Internet (even if properly authenticated) and proof of namespace ownership. PARE's beta-only invitation requirement may prevent broad client onboarding; do not imply everyone can connect just because registry metadata exists.

### 8.2 Provisional `server.json` example

The official Registry's published examples currently use the `2025-12-11` **registry JSON schema URL**, which is a **metadata schema** and not a statement that PARE's SDK or MCP transport uses that older protocol version. Confirm current schema before real publishing.

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.YOUR_USERNAME/pare-mcp",
  "title": "PARE",
  "description": "Analyze AI context, detect potentially wasted tokens, and suggest safe, reviewable improvements.",
  "version": "0.1.0",
  "remotes": [
    {
      "type": "streamable-http",
      "url": "https://YOUR_VERIFIED_PRODUCTION_HOST/mcp"
    }
  ]
}
```

**Placeholders are intentionally invalid for real publication.** Confirm the title/description/version/remote object against the schema when running `mcp-publisher validate`. Do not put private Access credentials into `server.json`, the README or the client configuration. If a marketplace requires compatible authorization discovery fields, provide only fields supported by its current standard and confirmed in deployed tests; don't guess them in JSON.

### 8.3 Publisher authentication and CLI sequence

The GitHub namespace for an individual is `io.github.<username>/<server>`, and publication through GitHub login requires controlling that **exact username**. Current Registry docs distinguish individual GitHub auth and organization namespace paths; our approved personal account avoids organization publishing complexity.

**After installing the official `mcp-publisher` binary using verified release instructions** (or another supported installation method), run:

```bash
mcp-publisher init
# Edit the generated server.json with the REAL account and endpoint.
mcp-publisher validate
mcp-publisher login github
mcp-publisher publish ./server.json
```

Run `mcp-publisher --help` and check actual CLI version if the generated path or supported flags differ; some guides use `./config/server.json` instead. Validate rather than assuming a fixed path. The binary installation instructions and command syntax are maintained at:

- https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx
- https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md

**Do not publish before:** a stable deployed endpoint exists, ownership is proven, no untested access path is advertised, release version is aligned, and the schema passes validation. Initial successful CLI completion is not evidence that all third-party clients can authenticate.

### 8.4 Verify the official registry record

1. Query the Registry's published API using the actual registered name and the currently documented encoded path/search endpoint (do not assume a copied command remains stable during preview).
2. Confirm record name, version, title, description and actual `remotes` HTTPS URL.
3. Check actual MCP handshake and tool discovery from outside the Cloudflare account using an invited client.
4. Confirm GitHub catalog/VS Code installation availability **separately**; don't write “listed in GitHub” until the page and its installation path have been observed.
5. On updates, repeat validation and registry publication with matching version metadata; preserve backward compatibility or document breaking changes.

### 8.5 What if registry discovery requires a more public service?

Do **not** remove Access solely to pass indexing. Either defer registry publicity until onboarding is approved, or publish accurate remote metadata while clearly labeling restricted beta use if current rules permit it. If access conflicts with official Registry validation or client behavior, stop and record the blocker; the identity-onboarding design belongs in an explicit owner-reviewed public-launch revision.

---

## 9. ChatGPT: private connection versus public plugin submission

### 9.1 Separate installation paths

**Private/custom connection:** Eligible ChatGPT accounts/workspaces may add a supported remote MCP server, subject to the plan, workspace controls, feature availability and authentication support at connection time. This is **not** created by GitHub registration. Confirm the current account-specific UI and capabilities from OpenAI documentation rather than promising all users a custom connector.

**Public OpenAI Plugin Directory:** A different review and release process under https://developers.openai.com/plugins/ . An open GitHub repo and valid official MCP Registry metadata are useful evidence but **not sufficient** for public listing or OpenAI endorsement. OpenAI approval and subsequent user eligibility are independent.

### 9.2 Current remote MCP submission prerequisites (verify before applying)

OpenAI's current public documentation specifies, among other things:

- A **real, stable, publicly reachable HTTPS remote MCP endpoint**, not localhost or a private testing tunnel; it must be reachable for review and domain verification.
- Individual verification in the OpenAI Platform Dashboard to publish under a person's name, or business verification to publish under a business name. **Personal GitHub ownership does not satisfy OpenAI identity verification automatically.**
- Required permission to submit and manage the plugin within the relevant OpenAI account/workspace.
- A correct remote MCP configuration, supported authentication, successful **Scan Tools**, accurate tool metadata and schema annotations.
- Public listing name, square logo/icon, description, company/author data, website, support, privacy policy, terms URLs, review prompts/responses and any localization requested by the current portal.
- Actual remote MCP tools must match their annotation. Since PARE performs analysis and proposes but does not persist server-side modifications, **`readOnlyHint: true`** is a reasonable annotation to evaluate for each tool; confirm its full semantics and deployment behavior before claiming compliance.
- A complete OpenAI review and approval process. Submission is not guaranteed acceptance.

The portal connection flow currently supports **no auth**, **OAuth**, and **mixed unauthenticated/OAuth**; it does **not** provide an arbitrary bearer-token entry field for public submission. Our Cloudflare Access path must therefore demonstrate working supported OAuth integration and reviewer onboarding—or public submission is **blocked**. A private Access allowlist of only our beta testers will not automatically authorize reviewers or future installs. Do not embed shared API keys in a plugin ZIP or static UI.

OpenAI documentation:

- https://developers.openai.com/plugins/deploy/app-review
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/deploy/connect-chatgpt

### 9.3 Submission checklist specific to PARE

- [ ] Actual PARE domain/hostname identity and ownership verified.
- [ ] Personal individual identity verification completed in the relevant OpenAI portal.
- [ ] A real, stable remote `/mcp` endpoint is reachable and works under the supported configured OAuth flow.
- [ ] Managed OAuth/Access JWT validation works *for the reviewer and target eligible user*, not just for a special local tester session.
- [ ] Three MCP tools scanned; schemas, descriptions, annotations and tool behavior match Document 07.
- [ ] No remote code execution, hidden conversation interception, unsafe prompt exfiltration or unapproved persistent storage.
- [ ] Logo approved for use as square primary app icon; correct image dimensions/format and rights confirmed.
- [ ] Privacy, support, terms and web URLs return real production pages; no placeholders.
- [ ] Review prompts/responses use **synthetic** sample input and do not contain confidential data.
- [ ] Tool-result data handling and app privacy notice match actual behavior; platform logs independently reviewed.
- [ ] Live client support and plan eligibility stated accurately, with no “available to everyone” claim.
- [ ] Submission completed; status recorded as **submitted**, **needs changes**, or **approved** only after portal confirmation.

### 9.4 Public visibility vs beta privacy

PARE's current protected beta can be tested privately. **Public submission is a future release milestone**, not a step to execute during invite-only staging unless the reviewer can authenticate through a supported, explicitly authorized flow and OpenAI's then-current rules permit it. Opening OAuth onboarding beyond invited accounts may require a new abuse/privacy review even without storing data.

---

## 10. GitHub Actions, secrets and promotion controls

### 10.1 CI permissions and credentials

Use repository-level least-privilege permissions. Tests on untrusted pull requests must not receive Cloudflare deployment secrets or Access credentials. Keep deployment jobs on protected trusted branches/environment approval; use short-lived/appropriately scoped authentication where offered. Never write Cloudflare tokens or Access JWT to logs, artifact archives, screenshots or Markdown.

For each deploy record: commit SHA, package lock hash, Cloudflare Worker environment, emitted bundle version, Wrangler version, Cloudflare deployment ID/version, verifier, check results and sanitized rollback reference.

### 10.2 Two-stage promotion pipeline

```text
PR → npm ci → TypeScript → Vitest → Worker build
  → maintainer review → stage deploy → synthetic smoke tests
  → real MCP Inspector/Cursor OAuth test → security/limits check
  → manual release approval → production deploy → repeat smoke suite
  → tag/release notes → optional registry publish → optional ChatGPT submission
```

Do not conflate *deploying source* with *publishing to registries*. Registry publication should use a pre-approved metadata version; directory submission requires separate final evidence.

### 10.3 Dependency and supply-chain controls

- Commit the lockfile and run `npm ci` in CI; avoid unreviewed `latest` dependencies.
- Review package provenance, licenses, vulnerability reports and transitive dependency changes.
- Pin GitHub Action versions/SHAs in the final implementation.
- Use official, checksummed `mcp-publisher` release artifacts when possible.
- Ensure no untrusted pull-request code can trigger a privileged deploy.
- Confirm Cloudflare Worker bundle size and tokenizer behavior as part of the staging canary.

---

## 11. Mandatory release gates: stop/go matrix

**Strict blocking policy (Document 10):** any authentication bypass, prompt/body leakage, unsafe edit, unbounded resource use, cache leak or comparable critical regression prevents release. Additional functional failures affecting an advertised primary feature also block release; minor cosmetic issues can be tracked for later.

| Gate | Required evidence | Block if |
|---|---|---|
| G01 Build | `npm ci`, strict TypeScript, Vitest, Wrangler dry-run green | Build/test or dependency issue affecting release |
| G02 Tokenizer | One named encoding works in deployed Worker, transparent accuracy label | Runtime fails or counts fabricated |
| G03 Contracts | Exactly three discoverable read-only tools, valid Zod/output responses, correct `schemaVersion` | Protocol/schema mismatch |
| G04 Safe edits | Only exact duplicate standalone prose can be deleted; original untouched; draft opt-in | Code, JSON, logs or unique text silently rewritten |
| G05 Review UI | Actual draft and valid counts before comparison; full diff reviewed before copy | Unsafe bypass or misleading metrics |
| G06 Access | Protected API/MCP, verified Cloudflare Access JWT, revocation works | Auth bypass, untrusted identity, host alias bypass |
| G07 OAuth clients | MCP Inspector and Cursor tested in staging | Unverified target integration advertised as supported |
| G08 Privacy | No prompt bodies in app logs/cache; platform logs assessed; disclosures accurate | Secret/content leak or false privacy claim |
| G09 Abuse | Measured request/output/CPU limits and Cloudflare rate controls | Unbounded work/ineffective protection |
| G10 Frontend | Seven file types, appropriate rejection of binary/oversize, accessibility and XSS checks | Dangerous rendering or unsupported access |
| G11 Recovery | Rollback and tester revocation rehearsed | No viable containment |
| G12 Operations | Named maintainer signoff; support/security contact and license | Unowned critical risks |
| G13 Registry | Real remote URL, namespace, metadata validation, user onboarding truthfulness | Invalid/unsupported claim |
| G14 ChatGPT review | Verified publisher, working reviewer OAuth, listing/legal docs, scan and submit | Cannot complete review path |

**Do not mark these gates passed from specifications alone.** Store dated, sanitized results and mark each `planned`, `passed`, `failed`, `blocked`, or `not_applicable`. No beta release if any G01–G12 critical gate is blocked. G13–G14 apply only when actually performing those publication milestones.

---

## 12. Deployment rollback, identity revocation and incident response

### 12.1 Incident triggers

- Any path can invoke tool code without required auth.
- Cloudflare or Worker logs/telemetry reveal prompt bodies, API tokens, secrets or user source code.
- A draft can silently mutate protected content or bypass mandatory diff review.
- Cache shares one user's result with another.
- Tokenizer/SDK causes repeated crashes, resource exhaustion or broad 5xx spikes.
- External MCP auth unexpectedly fails after release, or incorrect metadata causes unsafe client behavior.

### 12.2 Immediate containment (prioritized)

1. Stop publicity/publishing and inform the maintainer.
2. If identity/credential issue: revoke the relevant Access users/tokens, rotate compromised credentials, and tighten/disable affected Access routes (including aliases).
3. If Worker deployment regression: **roll back** to the last known-good version using Cloudflare dashboard, or use current documented Wrangler `rollback` command with correct environment/version arguments verified via CLI help.
4. If an older Worker still exposes sensitive processing: use Cloudflare route disable/block controls rather than assuming rollback alone fixes an authentication policy/configuration mistake. Access, WAF and DNS settings may be external to Worker code.
5. Verify all hostnames, `/api/analyze`, `/mcp`, static public homepage, cached responses and logging settings after rollback.
6. Record a sanitized incident ticket with timeline, impact, root cause, corrective actions and regression tests; determine applicable privacy/notification duties.

### 12.3 Rollback runbook

- **Before deploy:** record stable Worker version/deployment ID and old asset version; verify a recovery operator has access.
- **Via dashboard:** Workers & Pages → target Worker → Deployments → choose previous known-good version → Rollback, subject to current UI.
- **Via Wrangler:** `npx wrangler rollback --help`, then perform the command appropriate to the **exact** target environment and version. Avoid guessing a version ID in this document.
- **After rollback:** smoke all protected paths, test Access JWT validation/revocation, verify a real authorized client, check web assets for version skew. Cloudflare notes that pages loaded before rollback can request newer static assets.
- Rollback of Worker code does **not** automatically undo changed external resources, rate policies, credentials, DNS or Access apps. Those need their own recorded recovery actions.
- If there is any doubt about user-content exposure, disable analysis until verification. A public static informational page can remain available safely if it does not expose the affected API.

### 12.4 Security reporting

Publish `SECURITY.md` containing a maintained contact/reporting channel, supported versions, explicit avoidance of posting exploit details or real user content in public issues, and a realistic disclosure process. Do not invent a promised response SLA.

---

## 13. Privacy statement and legal copy requirements

A concise *draft concept* for future privacy wording (subject to actual platform audit and operator/legal review):

> “PARE analyzes content you explicitly submit to its website analyzer or MCP tools. PARE v1 does not intentionally save prompt text or analysis history in an application database, and does not send submitted content to a third-party LLM for rewriting. Requests are processed on Cloudflare infrastructure. Authentication and operational security systems may process technical metadata; our production policy will describe their actual retention and access. Do not submit secrets or confidential content unless permitted by your organization.”

Do **not** claim “zero data collection” or “nothing is ever retained”; Cloudflare Access, WAF, network logs and end users' AI clients may have independent behavior and retention. The website should disclose supported inputs, approximate tokenizer-model coverage, deterministic rules, limited semantic guarantees, and conservative draft review. No fabricated cost savings claims or promise that cleaned prompts preserve meaning in every task.

Privacy/legal pages needed for public ChatGPT submission must use **real, live HTTPS URLs**, not GitHub placeholder links, and identify an actual accountable operator and contact. Whether the GitHub repo is public has no bearing on whether a live service's data processing requires a truthful privacy notice.

---

## 14. Release verification matrix by stage

| Stage | Accessible to | Verification to record | Public copy allowed |
|---|---|---|---|
| Local development | Maintainer | Unit/contract tests | “In development” |
| Cloudflare staging | Invited testers | Real auth/Worker/SDK/tokenizer smoke suite | “Private beta testing” only after passing |
| Protected production beta | Public site; invited analysis users | Production smoke, revocation, actual limits, support contact | “Website live; analysis invite-only” |
| Public GitHub repository | Anyone | Apache-2.0 files, history scan, README and version tag | “Open source on GitHub” after made public |
| Official MCP Registry | Discoverability | Actual registry record and usable remote URL | “Published to official MCP Registry” after confirmation |
| GitHub catalog | Supported catalog users | Actual visible catalog entry and install flow | “Available in GitHub MCP Registry” only when observed |
| Private ChatGPT connection | Eligible connected users | Account/plan-specific real OAuth and MCP tool test | “Tested with [specific plan/client/version]” only after verified |
| Public ChatGPT plugin | Approved/eligible users | Successful OpenAI review and live directory listing | “Available in ChatGPT” only after approval and actual listing |

For each claim, maintain a simple `docs/release-evidence.md` with date, version, client/platform, synthetic fixture IDs, redacted results and current status. Don't publish client credentials, internal Access policies or personal identity details in a public evidence artifact.

---

## 15. Practical launch order (lightweight, no premature services)

**Phase A — Code and legal preparation:** finalize PARE name rights and logo distribution, commit Apache-2.0 license and truthful README/privacy/security docs; implement and lock the approved three-tool shared-core Worker. No registry publication.

**Phase B — Protected staging:** deploy a single staging Worker with static assets, configure invite-only Cloudflare Access, JWT verification, WAF/rate limits, and run synthetic Vitest, MCP Inspector and Cursor tests. Measure quotas and record a rollback target.

**Phase C — Production beta:** manual approval; separately deployed production Worker, public static website and protected analyzer/MCP. Keep invitations limited; verify support and clear beta banner.

**Phase D — Public GitHub release:** publish personal repository and a tagged beta release after secret/licensing verification. The repo can be public even if service access remains invited-only, provided onboarding limitations are stated.

**Phase E — Official registry:** when a stable remote endpoint and supported onboarding can be advertised, prepare and validate `server.json`, authenticate the actual personal GitHub namespace, publish metadata and confirm the record. GitHub catalog listing requires separate observation.

**Phase F — ChatGPT public directory (optional later):** confirm OpenAI individual verification, current feature eligibility, live OAuth and reviewer access, website/privacy/terms/support URLs, icon, tool annotations and submission form. Submit for review, address findings, and advertise public availability only after approval. This **must not** force v1 to add a database or unnecessary framework.

---

## 16. Unresolved decisions and owner approvals after Document 11

The owner has selected Apache-2.0 and personal GitHub ownership. These practical values were **not provided** and are intentionally left undecided:

| ID | Decision needed | Why | Recommended default |
|---|---|---|---|
| D11-01 | **Resolved:** `ayushcmd/pare`, owned by Ayush Raj | Namespace and URLs are known; registry authentication remains to be verified | Use actual account at publishing time |
| D11-02 | PARE name clearance and logo distribution rights | Trademark and third-party rights | Preliminary searches, then relevant formal review before public branding |
| D11-03 | Production hostname/custom domain | Stable endpoint, DNS and public directory verification | Staging on protected workers.dev; domain decision after name clearance |
| D11-04 | Cloudflare Workers/Access plan and actual rate-control entitlement | Features/cost and abuse controls | Select smallest plan that meets tested controls |
| D11-05 | Measured byte/token/line/CPU/output caps | Safe and predictable service | Benchmark synthetic staging fixtures and approve numbers |
| D11-06 | Access application ID, audience, identities, JWT verification library/config | Protected route correctness | Separate staging/production audiences, tested managed OAuth |
| D11-07 | Cursor + MCP Inspector connection status | Beta eligibility | Block compatibility claim until passed |
| D11-08 | Public invitation/onboarding strategy | Registry usefulness vs private beta | Remain invite-only until separately approved |
| D11-09 | **Partial:** owner is Ayush Raj and security contact is the provided IITP email; publisher verification remains | GitHub, privacy, OpenAI review | Verify publisher identity before public service launch |
| D11-10 | Privacy/Terms URLs and platform logging retention findings | Truthful public service disclosures | Audit real settings and publish accurate pages |
| D11-11 | Square logo/icon export | Directory dimensions and crisp display | Export original logo with proper padding, do not redraw |
| D11-12 | Final CI environment, deployment credentials, manual release approver | Least privilege and repeatable release | GitHub Actions CI, gated manual production deploy |
| D11-13 | Official Registry server name/version and MCP schema compatibility | Valid remote metadata | Validate current schema at actual publishing time |
| D11-14 | ChatGPT account/workspace eligibility and publisher verification | Submission capability varies | Test in actual authorized OpenAI account; no promises |

**Only major owner-facing questions before implementation/public launch:** (1) What personal GitHub username/repo slug will own PARE? (2) Is there an approved brand domain and support contact? (3) When should protected beta become public onboarding, if ever? (4) Are the tested Cloudflare plan and limits acceptable? Everything else should be resolved through the specified canaries and checklists, not speculative infrastructure.

---

## 17. Final release checklist (sign off, don't assume)

### Source and brand

- [ ] PARE trademark/name collision and original logo rights assessed.
- [ ] Apache License 2.0 text, SPDX metadata and applicable notices committed.
- [ ] No secrets or real private content in repository or history.
- [ ] README, CONTRIBUTING, SECURITY, privacy and necessary legal pages accurate.
- [ ] GitHub account/slug and public release tag confirmed.

### Cloudflare and product

- [ ] Staging/production environments and Access audiences isolated.
- [ ] Public landing page and protected analyzer/MCP routes tested, including aliases.
- [ ] `assets.run_worker_first` protects `/api/*` and `/mcp` from asset bypass.
- [ ] Verified Access JWT and Managed OAuth end-to-end with intended clients.
- [ ] Cloudflare rate controls, input budgets and timeout/bundle caps measured.
- [ ] Three MCP tools conform to locked schema and deterministic engine behavior.
- [ ] Exact duplicate standalone prose draft only; original unchanged; mandatory full diff review.
- [ ] App logs contain no prompt/task bodies; platform retention assessed.
- [ ] Synthetic test suite and strict security gates passed; rollback rehearsed.

### Publication

- [ ] Personal GitHub repo public with Apache-2.0 and honest installation notes.
- [ ] Correct stable production HTTPS remote deployed; access eligibility accurately described.
- [ ] Official MCP Registry `server.json` validates and name ownership is verified.
- [ ] Registry publication confirmed by querying actual record.
- [ ] GitHub catalog inclusion only claimed after actually visible.
- [ ] ChatGPT submission made only with working reviewer-facing OAuth, valid brand/privacy URLs, verified identity and passing tool scan.
- [ ] OpenAI approval/visibility only claimed after official confirmation.

**Release authorization:** Maintainer: Ayush Raj; commit/release: `TBD`; staging evidence: `TBD`; final go/no-go: `TBD`. No checkboxes are pre-checked.

---

## 18. External references verified on 18 November 2026

The following references support the **current mechanisms** described above. They do *not* prove the PARE deployment or accounts exist. Official pages may change; re-check them on release day.

1. Cloudflare Workers Wrangler configuration and static-assets worker-first routing — https://developers.cloudflare.com/workers/wrangler/configuration/
2. Cloudflare Wrangler named environments — https://developers.cloudflare.com/workers/wrangler/environments/
3. Cloudflare Worker rollbacks — https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
4. Cloudflare Access Managed OAuth for MCP — https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/
5. Cloudflare secure MCP servers and JWT validation — https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/
6. Cloudflare Workers limits — https://developers.cloudflare.com/workers/platform/limits/
7. Official MCP Registry publishing quickstart — https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx
8. Official Registry remote servers — https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/remote-servers.mdx
9. Official Registry authentication and namespace ownership — https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx
10. MCP publisher command reference — https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md
11. GitHub Copilot MCP Registry client documentation — https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/extend-copilot-chat-with-mcp
12. OpenAI remote MCP app review requirements — https://developers.openai.com/plugins/deploy/app-review
13. OpenAI plugin submission guide — https://developers.openai.com/plugins/deploy/submission
14. OpenAI build MCP server guide — https://developers.openai.com/plugins/build/mcp-server
15. Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0
16. SPDX license identifier — https://spdx.org/licenses/Apache-2.0.html

## 19. Final governance note

**The complete PARE v1 design set is Documents 01–11.** The eleven files are specifications and checklists, **not evidence of implemented or deployed software**. Before implementation, assign a maintainer, resolve placeholders, prioritize and implement the approved v1 scope, and keep changes cross-referenced. Any future change to auth, file support, cleanup safety, token counting, MCP tool behavior or persistence must be deliberately approved and reflected in affected documents, tests and public disclosures.

**End of Document 11.**
