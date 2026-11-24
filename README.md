# PARE

**Keep what matters. Cut the rest.**

PARE is a local-first, explainable AI context auditor. It counts supplied text with a documented tokenizer, detects structural waste, and can propose narrowly scoped prose deduplication that always requires review.

Maintained by Ayush Raj at [ayushcmd/pare](https://github.com/ayushcmd/pare).

Community: [contributing](https://github.com/ayushcmd/pare/blob/main/CONTRIBUTING.md), [support](https://github.com/ayushcmd/pare/blob/main/SUPPORT.md), [security](https://github.com/ayushcmd/pare/blob/main/SECURITY.md), [privacy](https://github.com/ayushcmd/pare/blob/main/PRIVACY.md), and [code of conduct](https://github.com/ayushcmd/pare/blob/main/CODE_OF_CONDUCT.md).

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

## Connect an MCP client locally

Build the stdio server, then configure a client that supports local MCP servers to launch the built JavaScript file with Node.js:

```bash
npm run build:mcp
```

Example client configuration (replace the path with the absolute path on your computer):

```json
{
  "mcpServers": {
    "pare": {
      "command": "node",
      "args": ["C:/absolute/path/to/pare/dist/mcp/stdio.js"]
    }
  }
}
```

MCP clients use different configuration shapes; adapt the `command` and `args` fields to your client. Ask the AI to call `analyze_context` with the exact text when you want suggestions, and set `includeDraft: true` when you want a reviewable prose draft. `compare_content` measures an original and a candidate you provide. PARE does not intercept other messages automatically. This repository is not yet an npm-published package or a hosted MCP service.

The optional `task` field changes guidance for recognized diagnostic, success/performance, JSON aggregate, and lookup tasks. It uses simple keyword rules; it does not determine what information is safe to delete. Repeated prose findings are restricted to plain text that passes the conservative prose classifier.

The local npm tarball can be inspected with `npm pack --dry-run --json`, and `npm run test:package` installs it into a temporary directory and calls both MCP tools through the installed CLI. Its contents are limited to the CLI bundle, README, package metadata, `NOTICE`, and the root Apache-2.0 license. Publishing remains disabled until npm account ownership and release checks are complete.

Codex CLI `0.171.0-alpha.13` was tested with a local PARE tool call on Windows. See [client validation](https://github.com/ayushcmd/pare/blob/main/docs/client-validation.md) for the exact scope and setup command.

The website supports `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, and `.log` as text. Uploaded code is never executed.

## Important limits

PARE detects structural patterns. A smaller input is not guaranteed to preserve meaning, improve model quality, reduce latency, or lower a bill. Review every proposed draft before using it.

## Status

Initial implementation. Local stdio protocol calls are tested, and CI checks every PR. Registry metadata, npm publishing, production authentication, measured Worker limits, and public deployment remain release work.
