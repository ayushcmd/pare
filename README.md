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

For a stdio MCP client, launch the published package with npm:

```json
{
  "mcpServers": {
    "pare": {
      "command": "npx",
      "args": ["-y", "pare-mcp@0.1.0"]
    }
  }
}
```

On Windows, some clients require `npx.cmd` as the command. The client must support installing and running a local stdio MCP server.

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

MCP clients use different configuration shapes; adapt the `command` and `args` fields to your client. Ask the AI to call `analyze_context` with the exact text when you want suggestions, and set `includeDraft: true` when you want a reviewable prose draft. `compare_content` measures an original and a candidate you provide. PARE does not intercept other messages automatically. The npm package provides a local stdio server; there is no hosted MCP service yet.

The optional `task` field changes guidance for recognized diagnostic, success/performance, JSON aggregate, and lookup tasks. It uses simple keyword rules; it does not determine what information is safe to delete. Repeated prose findings are restricted to plain text that passes the conservative prose classifier.

The [public npm package](https://www.npmjs.com/package/pare-mcp) can be launched locally with `npx -y pare-mcp@0.1.0` in an MCP client that supports stdio. The tarball contains the CLI bundle, README, package metadata, `NOTICE`, and the root Apache-2.0 license. `npm run test:package` installs a local tarball into a temporary directory and calls both MCP tools through the installed CLI.

Codex CLI `0.171.0-alpha.13` was tested with a local PARE tool call on Windows. See [client validation](https://github.com/ayushcmd/pare/blob/main/docs/client-validation.md) for the exact scope and setup command.

The website supports `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, and `.log` as text. Uploaded code is never executed.

## Important limits

PARE detects structural patterns. A smaller input is not guaranteed to preserve meaning, improve model quality, reduce latency, or lower a bill. Review every proposed draft before using it.

## Status

Initial implementation. Local stdio protocol calls are tested, and CI checks every PR. `pare-mcp@0.1.0` is published on npm, and `io.github.ayushcmd/pare@0.1.0` is active in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ayushcmd%2Fpare/versions/0.1.0). Production authentication, measured Worker limits, public deployment, GitHub catalog discovery, and OpenAI directory review remain release work.
