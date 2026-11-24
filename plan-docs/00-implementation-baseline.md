# PARE — Implementation Baseline

**Version:** 0.1.0  
**Approved:** 23 November 2026  
**Status:** Active implementation authority

This document records the owner-approved changes made after comparing PARE with current prompt-compression, context-management, repository-packing, and MCP projects. It supersedes conflicting implementation details in Documents 01–11 while preserving their product, safety, brand, privacy, and release requirements.

## Locked architecture

- **Local-first website:** framework-free HTML and CSS with TypeScript compiled by Vite. Website analysis runs in the browser by default; pasted text and selected files are not sent to PARE's Worker in this flow.
- **Shared core:** one pure deterministic TypeScript core is imported by the browser, Worker JSON API, remote MCP server, and local MCP package. It has no filesystem, network, database, or DOM dependency.
- **Remote runtime:** one Cloudflare Worker serves static assets, `POST /api/analyze`, and `/mcp`. Remote analysis remains available for programmatic use and compatible hosted clients.
- **MCP transport:** official `@modelcontextprotocol/server` v2 with Streamable HTTP remotely and stdio locally. The SDK's web-standard `createMcpHandler` is used directly; the additional Cloudflare Agents framework is unnecessary for the current stateless server.
- **Two tools:** `analyze_context` and `compare_content`. Recommendations are part of `analyze_context`; the former `suggest_optimizations` surface duplicated that behavior. `compare_content` replaces the earlier `compare_tokens` name and requires explicit original and candidate strings.
- **Tokenization:** one bundled `o200k_base` implementation through `gpt-tokenizer`. Counts describe that encoding only; provider billing and message framing can differ.
- **Cleanup:** only exact duplicate standalone prose paragraphs can produce an opt-in, review-required draft. Code, JSON, logs, Markdown structure, MCP schemas, and unique content are never automatically rewritten in v1.
- **Task guidance:** optional task keywords tailor log and JSON recommendations; they never authorize deletion. Duplicate prose findings require the same plain-text eligibility check as safe drafts.
- **Storage:** no application database, accounts, saved history, or third-party AI API.

## Current source layout

```text
src/core/       deterministic contracts, tokenizer, detection, draft and comparison
src/mcp/        shared two-tool MCP server and local stdio entry
src/worker/     Cloudflare routes, JSON API and remote MCP handler
web/            framework-free browser application
tests/core/     deterministic safety and comparison fixtures
```

## Initial dependency baseline

| Package | Version | Purpose |
| --- | ---: | --- |
| `@modelcontextprotocol/server` | `2.4.0` | MCP v2 server, HTTP handler and stdio transport |
| `gpt-tokenizer` | `4.1.2` | Browser/Worker/Node-compatible `o200k_base` counting |
| `zod` | `4.6.7` | Runtime input and output contracts |
| `vite` | `8.3.8` | Website build only |
| `vitest` | `5.1.1` | Deterministic tests |
| `wrangler` | `4.166.0` | Worker development and deployment |
| `typescript` | `7.0.2` | Strict shared language toolchain |
| `biome` | `2.6.8` | Formatting and linting |

These versions are locked in `package-lock.json`. Upgrade through reviewed dependency changes and repeat all builds/tests.

## Initial measured build status

- Strict TypeScript passes.
- Nine core tests and one real stdio MCP client contract test pass.
- Vite production build passes; the initial page script is small and the tokenizer/analyzer loads on first analysis.
- The primary website flow was exercised in Brave: local analysis, duplicate detection, measured draft savings, and the disabled-until-reviewed copy control all behaved as designed.
- Local stdio MCP bundle builds and answers both tools through the official client transport.
- A minimal `pare-mcp` npm tarball is built, installed into an isolated temporary directory, and verified with MCP tool discovery and both calls; GitHub CI checks pull requests.
- Codex CLI `0.171.0-alpha.13` called the local `analyze_context` tool in an ephemeral test on Windows; the result and limits are recorded in `docs/client-validation.md`.
- Wrangler Worker dry-run bundles successfully.
- Both declared and actual JSON request bytes are capped before Worker analysis.
- Community guidance and reporting are maintained in root `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `SECURITY.md`, and `PRIVACY.md`.
- `pare-mcp@0.1.0` was published to npm, and package-based `server.json` metadata was published to the official MCP Registry under `io.github.ayushcmd/pare@0.1.0` on 24 November 2026. The public registry record reports active status. An independent MCP client launched the public npm package and called `analyze_context` successfully.
- `pare-mcp@1.0.0` was published to npm, `io.github.ayushcmd/pare@1.0.0` became active in the official MCP Registry, and GitHub release `v1.0.0` was published from the merged main commit on 24 November 2026. A public-package MCP client smoke test discovered both tools and called `analyze_context` successfully.

This is local build and package-registry evidence, not a deployed-service, remote authentication, browser-compatibility, or semantic-equivalence claim.

## Remaining release work

- MCP Inspector and additional named AI-client installation checks beyond the tested Codex CLI invocation.
- Cross-browser/mobile QA and Web Worker performance evaluation for tokenization.
- Test-derived production limits and Cloudflare authentication/rate controls.
- Public npm installation verification in additional named clients and future GitHub Actions OIDC publishing.
- Stable domain, hosted privacy/support/terms URLs, GitHub catalog discovery, and platform-specific directory verification.
- Public hosted privacy wording still requires a deployment and platform logging audit.
