# Security Policy

## Supported versions

PARE is in active development. The current `main` branch receives security fixes, and `pare-mcp@1.0.0` is the current npm release. Version `0.1.0` is superseded and does not receive separate backports. No hosted production service has been released.

## Report a vulnerability privately

Email Ayush Raj at [ayush_24a12res897@iitp.ac.in](mailto:ayush_24a12res897@iitp.ac.in) with `PARE security report` in the subject. Include a concise description, affected commit or version, reproduction steps using synthetic data, and the potential impact. Please do not send real credentials, private prompts, or customer data. Do not open a public issue or pull request with exploit details.

The maintainer will review the report and coordinate a fix and disclosure when appropriate. No response-time or bounty promise is made. For ordinary bugs and usage questions, use [GitHub issues](https://github.com/ayushcmd/pare/issues) and [SUPPORT.md](SUPPORT.md).

Security-sensitive areas include untrusted input handling, draft safety, MCP tool contracts, authentication for future hosted endpoints, prompt or task text in logs, cache behavior, and denial of service. The remote Worker is not yet an approved public service.
