# PARE

**Keep what matters. Cut the rest.**

PARE is a local-first, explainable AI context auditor. It counts supplied text with a documented tokenizer, detects structural waste, and can propose narrowly scoped prose deduplication that always requires review.

## Current implementation

- Framework-free browser analyzer; analysis stays in the browser by default.
- Shared deterministic TypeScript core.
- Cloudflare Worker JSON API and remote Streamable HTTP MCP endpoint.
- Two read-only MCP tools: `analyze_context` and `compare_content`.
- `o200k_base` token counting through `gpt-tokenizer`.
- No database, accounts, saved analysis history, or external AI API.

## Develop

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Run all local checks:

```bash
npm run check
```

The website supports `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, and `.log` as text. Uploaded code is never executed.

## Important limits

PARE detects structural patterns. A smaller input is not guaranteed to preserve meaning, improve model quality, reduce latency, or lower a bill. Review every proposed draft before using it.

## Status

Initial implementation. Registry metadata, local npm packaging, production authentication, measured Worker limits, and public deployment remain release work.
