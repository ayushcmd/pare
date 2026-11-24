# Registry readiness

**Checked:** 24 November 2026. This is preparation evidence, not a claim of publication.

## Official MCP Registry

`server.json` describes the local stdio package under `io.github.ayushcmd/pare`. The official validation endpoint accepted it. Next, authenticate to public npm as the publisher, release `pare-mcp`, then publish the exact metadata using the official publisher and GitHub namespace login.

## GitHub MCP catalog for Copilot

No PARE listing has been verified. Check catalog discovery separately after official publication. Manual MCP configuration can be tested independently.

## OpenAI plugin directory

For a remote listing, deploy a stable public HTTPS MCP endpoint with production access, privacy/support/terms URLs, verified developer identity, domain verification, tool scan, and reviewer test cases.

For a local desktop listing, confirm partner allowlisting and package a desktop-only plugin. A working local stdio server alone is insufficient.

The release PR removes the npm package's `private` guard and pins public npm as the publish registry. The package name `pare-mcp` was not found in the public npm registry during a lookup on 24 November 2026, but that does not reserve it. The local npm session returned `ayushcmd`; the package is not published yet. The Cloudflare Worker has only passed a dry-run; no remote URL should be advertised in `server.json`.

`server.json` is a package-based draft for the current local distribution. On 24 November 2026, `POST https://registry.modelcontextprotocol.io/v0.1/validate` returned `{"valid":true,"issues":[]}`. Before publication, confirm package version and `mcpName` marker, owner authentication, and the actual published package. Do not add a remote entry until the endpoint is deployed and tested. OpenAI submission is separate from MCP Registry publication.
