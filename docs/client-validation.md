# Local MCP client validation

**Date:** 24 November 2026  
**Maintainer:** Ayush Raj (`ayushcmd`)  
**Client:** Codex CLI `0.171.0-alpha.13` on Windows  
**Server:** local `dist/mcp/stdio.js` from PARE `0.1.0`

An ephemeral, read-only Codex CLI session loaded PARE through a one-session MCP configuration override. Codex called `pare/analyze_context` successfully and reported the returned `o200k_base` count (26 tokens), zero findings, and `not_requested` draft status for a short synthetic input. This verifies a named AI client can launch and call the local server. It does not show token savings, automatic invocation for other prompts, or support in other clients.

The input repeated a sentence on one line. PARE's safe draft rule requires an exact duplicate standalone paragraph, so zero findings was expected. The separate installed-tarball smoke test verifies both tools through the official MCP client transport.

To configure a local build in Codex CLI after `npm run build:mcp`, use an absolute path to the built file:

```bash
codex mcp add pare -- node /absolute/path/to/pare/dist/mcp/stdio.js
codex mcp list
```

The commands above describe normal persistent setup; the validation used a temporary config override and did not change the user's global MCP configuration. Codex's [MCP configuration guide](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) describes local stdio servers and shared CLI configuration.

## Publication gate

The prospective public npm name is `pare-mcp`. A public registry lookup returned no published version on 24 November 2026, but this does not reserve the name. `npm whoami --registry=https://registry.npmjs.org` returned 401, so npm account ownership and publishing are unverified. Keep `private: true` until Ayush Raj signs into an npm account that can publish this name, the final package contents are reviewed, and a release is explicitly approved.
