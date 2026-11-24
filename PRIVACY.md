# Privacy

This describes the current PARE source code and local development flow, not a deployed public service. It will be reviewed before any hosted release.

The website analyzes pasted or selected text in the browser by default. The local stdio MCP server processes text explicitly sent by the connected client on the user's machine. PARE does not intentionally save analysis history, send text to an external AI API, or use an application database. The host AI client, browser, operating system, and package manager may have their own storage or telemetry behavior outside PARE's control.

The code also contains Cloudflare Worker routes for a remote JSON API and MCP endpoint. They are not yet publicly deployed or approved for private content. If deployed later, submitted content would be processed on the hosting provider's infrastructure, and authentication and operational systems may process metadata. A production policy must document actual logging, retention, and access controls before launch.

Avoid submitting secrets or confidential material to a client or deployment unless you are authorized to do so. Report a suspected exposure through [SECURITY.md](SECURITY.md).
