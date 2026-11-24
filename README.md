<p align="center">
  <img src="https://raw.githubusercontent.com/ayushcmd/pare/main/assets/pare-logo-original.png" alt="PARE logo" width="160" />
</p>

<h1 align="center">PARE</h1>

<p align="center"><strong>Keep what matters. Cut the rest.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/pare-mcp/v/1.0.0">npm package</a> |
  <a href="https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ayushcmd%2Fpare/versions/1.0.0">MCP Registry</a> |
  <a href="https://github.com/ayushcmd/pare/releases/tag/v1.0.0">v1.0.0 release</a>
</p>

PARE is an open-source tool for inspecting the text you plan to give an AI assistant. It counts tokens, points out structural repetition and oversized inputs, and offers conservative suggestions you can review. It does not read your other chats, monitor prompts in the background, or decide what information is safe to remove.

The released MCP package runs locally through stdio. The repository also includes a browser-based analyzer and Cloudflare Worker code. No public hosted MCP endpoint has been released.

## The problem

Prompts and supporting context often accumulate repeated prose, long logs, large JSON collections, and verbose tool descriptions. These can make an input harder to inspect and may consume more tokens than needed. Removing text without understanding the task can also discard important evidence.

PARE makes that tradeoff visible. It reports what it found and where, counts an original and a proposed revision with the same tokenizer, and leaves the final edit to you.

## Features

- **Token accounting:** Counts supplied text with `o200k_base` through `gpt-tokenizer`.
- **Explainable findings:** Flags exact duplicate prose paragraphs, large context, long logs, large JSON arrays, and verbose MCP tool metadata. Findings include line references, confidence, risk, and a recommendation.
- **Reviewable draft:** When requested, removes only later copies of exact duplicate standalone prose paragraphs from eligible plain text. It never silently applies the draft.
- **Before-and-after comparison:** Measures an original and a candidate with the same tokenizer and reports the token difference.
- **Task-aware guidance:** An optional task description adjusts log and JSON recommendations using simple keyword rules. It never authorizes automatic deletion.
- **Local workflows:** Use the npm MCP package in a compatible local client or run the website in your browser. The core does not require an external AI API or an application database.

## How it works

1. You explicitly supply text to the website or an MCP tool.
2. PARE counts tokens and checks for defined structural patterns.
3. It returns findings and recommendations. For an eligible plain-text input, `includeDraft: true` can also return a proposed deduplicated draft.
4. You inspect the full draft or provide your own candidate to `compare_content`.
5. You decide what, if anything, to send to your AI assistant.

PARE uses deterministic rules, not a language model. A shorter input is not guaranteed to preserve meaning, improve answer quality, reduce latency, or lower a bill.

## Get started with the MCP package

You need Node.js 22 or newer and an MCP client that can launch a local stdio server. Add this entry to the client's MCP configuration:

```json
{
  "mcpServers": {
    "pare": {
      "command": "npx",
      "args": ["-y", "pare-mcp@1.0.0"]
    }
  }
}
```

Some Windows clients require `npx.cmd` instead of `npx`. Client configuration formats vary; adapt the entry to your client. The [client validation notes](https://github.com/ayushcmd/pare/blob/main/docs/client-validation.md) document a tested Codex CLI connection. The official registry name is `io.github.ayushcmd/pare`.

After connecting, ask your assistant to call a PARE tool with the text you want inspected. For example:

> Use `analyze_context` on the following context. Show the findings and line references. Do not rewrite it automatically.

PARE cannot inspect hidden conversation context. Your MCP client must pass the text to the tool.

### MCP tools

| Tool              | Required input          | Optional input                       | Result                                                                      |
| ----------------- | ----------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `analyze_context` | `text`                  | `sourceKind`, `task`, `includeDraft` | Token count, findings, warnings, and possibly a review-required draft.      |
| `compare_content` | `original`, `candidate` | None                                 | Counts for both inputs, token difference, and a reminder to review meaning. |

`sourceKind` defaults to `plain_text` and also accepts `markdown`, `json`, `javascript`, `typescript`, `python`, `log`, and `mcp_tool_schema`. `includeDraft` defaults to `false`. A draft is available only when an eligible plain-text input contains a safe exact duplicate paragraph. Code, JSON, logs, and Markdown structure are not automatically rewritten.

Example analysis arguments:

```json
{
  "text": "Paste the exact text to inspect here.",
  "sourceKind": "plain_text",
  "task": "Prepare a concise context for debugging",
  "includeDraft": true
}
```

Example comparison arguments:

```json
{
  "original": "The original text.",
  "candidate": "A proposed revision."
}
```

Both tools return a readable summary and structured MCP content. Their inputs are bounded; see the [input schemas](https://github.com/ayushcmd/pare/blob/main/src/core/contracts.ts) for the current limits and response fields.

## Run the website and source code locally

Clone the repository, then install and start the development server:

```bash
git clone https://github.com/ayushcmd/pare.git
cd pare
npm ci
npm run dev
```

Open the local URL printed by Vite. Paste text or choose a UTF-8 `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, or `.log` file. The default website flow analyzes text in your browser; selected code is not executed.

To build the local stdio server from source:

```bash
npm run build:mcp
node dist/mcp/stdio.js
```

An MCP client must launch `dist/mcp/stdio.js` and communicate over stdio. Running that command directly in a terminal will wait for protocol input rather than show an interactive prompt.

## Architecture and tech stack

| Component         | Technology                                                 | Role                                                                   |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Browser interface | HTML, CSS, TypeScript, Vite                                | Framework-free local analyzer.                                         |
| Shared core       | TypeScript, `gpt-tokenizer`, Zod                           | Token counting, findings, draft rules, schemas, and comparison.        |
| Local MCP package | Official MCP TypeScript server SDK, Node.js stdio, esbuild | Two read-only tools distributed through npm.                           |
| Remote code       | Cloudflare Workers, Streamable HTTP, Wrangler              | JSON API and MCP routes in source; no public endpoint is deployed.     |
| Quality checks    | Vitest, Biome, TypeScript, GitHub Actions                  | Tests, formatting, type checks, build checks, and package smoke tests. |

The browser, Worker, and local MCP server use the same deterministic analysis core. The [implementation baseline](https://github.com/ayushcmd/pare/blob/main/plan-docs/00-implementation-baseline.md) records architectural decisions and pinned dependency versions are in [package.json](https://github.com/ayushcmd/pare/blob/main/package.json) and [package-lock.json](https://github.com/ayushcmd/pare/blob/main/package-lock.json).

## Development and verification

```bash
npm run lint
npm run typecheck
npm test
npm run check
npm run test:package
```

`npm run check` includes the web, MCP, and Worker builds; the Worker step is a dry run, not a deployment. `npm run test:package` installs a locally built tarball in a temporary directory and calls both MCP tools. Pull requests run the project checks in GitHub Actions. The public `1.0.0` npm package was also launched and called through an independent MCP client after publication.

## Privacy, safety, and limits

- PARE processes only text provided to its website or tools. The website analyzes in the browser by default; the published stdio server runs on the user's machine.
- PARE does not intentionally save analysis history, use an application database, or send text to an external AI API. Your browser, MCP client, operating system, and package manager can handle data separately.
- Token counts use `o200k_base`. They do not include every provider's message framing or guarantee a matching bill.
- Findings are structural suggestions. A draft is deliberately narrow and always requires review; `compare_content` measures tokens but cannot prove semantic equivalence.
- The Cloudflare Worker routes have not been approved or deployed as a public service. Do not treat the repository's remote endpoint code as a hosted integration.

Read the [privacy notice](https://github.com/ayushcmd/pare/blob/main/PRIVACY.md) and [security policy](https://github.com/ayushcmd/pare/blob/main/SECURITY.md) for more detail.

## Availability and roadmap

| Surface                                     | Status                                               |
| ------------------------------------------- | ---------------------------------------------------- |
| npm package                                 | `pare-mcp@1.0.0` published.                          |
| Official MCP Registry                       | `io.github.ayushcmd/pare@1.0.0` active.              |
| GitHub release                              | `v1.0.0` published.                                  |
| Public hosted MCP endpoint                  | Not deployed.                                        |
| GitHub Copilot catalog and OpenAI directory | Separate listing processes; no inclusion is claimed. |

Current follow-up work includes production authentication and limits for hosted routes, additional client compatibility checks, and platform-specific directory review. See [registry readiness](https://github.com/ayushcmd/pare/blob/main/docs/registry-readiness.md) for the release gates.

## Contributing and support

PARE is maintained by Ayush Raj. Contributions and reproducible bug reports are welcome; see [CONTRIBUTING.md](https://github.com/ayushcmd/pare/blob/main/CONTRIBUTING.md), [SUPPORT.md](https://github.com/ayushcmd/pare/blob/main/SUPPORT.md), and the [code of conduct](https://github.com/ayushcmd/pare/blob/main/CODE_OF_CONDUCT.md). Use synthetic examples rather than private prompts or credentials. Report vulnerabilities through [SECURITY.md](https://github.com/ayushcmd/pare/blob/main/SECURITY.md).

PARE is licensed under [Apache-2.0](https://github.com/ayushcmd/pare/blob/main/LICENSE).
