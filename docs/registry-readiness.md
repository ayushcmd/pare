# Registry readiness

**Checked:** 24 November 2026. npm and official MCP Registry publication were verified; other destinations remain separate work.

## Official MCP Registry

`pare-mcp@0.1.0` is public on npm. The official publisher validated `server.json` and published `io.github.ayushcmd/pare@0.1.0` using the `ayushcmd` GitHub namespace. The [public registry record](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ayushcmd%2Fpare/versions/0.1.0) reports `status: active` and `isLatest: true`.

## GitHub MCP catalog for Copilot

No PARE listing has been verified in GitHub's separate catalog. Check discovery separately. Manual MCP configuration can be tested independently.

## OpenAI plugin directory

For a remote listing, deploy a stable public HTTPS MCP endpoint with production access, privacy/support/terms URLs, verified developer identity, domain verification, tool scan, and reviewer test cases.

For a local desktop listing, confirm partner allowlisting and package a desktop-only plugin. A working local stdio server alone is insufficient.

The published npm metadata exposes `pare-mcp` as a CLI and carries `mcpName: io.github.ayushcmd/pare`. The Cloudflare Worker has only passed a dry-run; no remote URL is advertised in `server.json`.

`server.json` is package-based metadata for the current local distribution. On 24 November 2026, `POST https://registry.modelcontextprotocol.io/v0.1/validate` returned `{"valid":true,"issues":[]}`, and the publisher completed registration. Do not add a remote entry until the endpoint is deployed and tested. OpenAI submission is separate from MCP Registry publication.
