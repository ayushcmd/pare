# PARE

**Keep what matters. Cut the rest.**

PARE helps you inspect text before sending it to an AI assistant. It counts tokens, identifies structural repetition, and offers conservative cleanup suggestions that you review before use. It works with text you explicitly provide; it does not read other chats or intercept prompts.

[npm package](https://www.npmjs.com/package/pare-mcp/v/1.0.0) · [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ayushcmd%2Fpare/versions/1.0.0) · [GitHub release](https://github.com/ayushcmd/pare/releases/tag/v1.0.0)

Maintained by Ayush Raj at [ayushcmd/pare](https://github.com/ayushcmd/pare). Licensed under [Apache-2.0](https://github.com/ayushcmd/pare/blob/main/LICENSE).

## Use PARE with an MCP client

Requires Node.js 22 or newer and an MCP client that can launch local stdio servers. Add PARE to the client's MCP configuration:

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

Some Windows clients require `npx.cmd` in place of `npx`. Configuration formats vary by client. The [client validation notes](https://github.com/ayushcmd/pare/blob/main/docs/client-validation.md) include a tested Codex CLI setup.

Once connected, ask your assistant to use PARE on text you supply. For example: “Use `analyze_context` on the following context and show me the findings before changing anything.” Request `includeDraft: true` only when you want to inspect a cleaned prose draft.

PARE exposes two read-only tools:

| Tool              | Purpose                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `analyze_context` | Count supplied text and report structural findings; an optional draft removes only exact duplicate standalone prose paragraphs. |
| `compare_content` | Count an original and a candidate with the same tokenizer and report the difference.                                            |

The optional `task` input adjusts recommendations for recognized diagnostic, performance, JSON aggregate, and lookup tasks. It does not authorize deleting information. Both tools return a readable summary and structured results.

## Run from source

```bash
npm ci
npm run dev
```

The website runs analysis in the browser by default. It accepts pasted text and local `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, and `.log` files; selected code is not executed. To build the local MCP server and run project checks:

```bash
npm run build:mcp
npm run check
npm run test:package
```

To launch a source build from an MCP client, use `node` as the command and the absolute path to `dist/mcp/stdio.js` as its argument. The repository also contains Cloudflare Worker routes for a JSON API and remote MCP transport, but no public hosted endpoint has been released.

## How to interpret results

PARE uses `gpt-tokenizer` with `o200k_base`. Counts describe that encoding, not a provider's bill or complete message framing. Findings are structural suggestions; a smaller input is not guaranteed to preserve meaning or improve answer quality. Inspect every proposed draft and comparison before sending revised text.

Local browser analysis and the stdio server do not intentionally save prompt history, use an application database, or send text to an external AI API. Your browser, MCP client, operating system, and package manager may handle data separately. See the [privacy policy](https://github.com/ayushcmd/pare/blob/main/PRIVACY.md).

## Release and support

`pare-mcp@1.0.0` is available on npm and active in the official MCP Registry. This does not imply a listing in GitHub's separate Copilot catalog or OpenAI's plugin directory. A hosted MCP service remains future work.

For help or changes, see [support](https://github.com/ayushcmd/pare/blob/main/SUPPORT.md), [contributing](https://github.com/ayushcmd/pare/blob/main/CONTRIBUTING.md), and the [code of conduct](https://github.com/ayushcmd/pare/blob/main/CODE_OF_CONDUCT.md). Report vulnerabilities through the [security policy](https://github.com/ayushcmd/pare/blob/main/SECURITY.md).
