# Contributing to PARE

Thanks for helping make AI context analysis clearer and safer. PARE is maintained by Ayush Raj (`ayushcmd`). Read the [code of conduct](CODE_OF_CONDUCT.md) before participating.

## Before you start

- Search existing issues and pull requests. For a substantial feature or a change to tool schemas, open an issue first so the behavior can be agreed on.
- Report vulnerabilities through [the security policy](SECURITY.md), not a public issue.
- Use synthetic examples. Do not put real prompts, credentials, private logs, customer data, or access tokens in issues, tests, screenshots, or pull requests.

## Make a change

Requires Node.js 22 or newer. From a feature branch based on `main`:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build:web
npm run build:worker
npm run test:package
```

The Worker command is a dry-run build; it does not deploy. Add focused tests for behavior changes, especially draft safety, token accounting, MCP contracts, and input limits. Update README or `plan-docs/00-implementation-baseline.md` when user-visible behavior or implementation decisions change.

Keep the shared core deterministic and free of network, filesystem, DOM, database, and AI API dependencies. Draft changes must remain opt-in and review-required. Do not silently rewrite code, structured data, logs, or unique content.

## Pull requests

Open a pull request into `main`; the maintainer merges manually. Give the PR a specific title and explain the behavior, why it helps, tests run, and any safety or compatibility tradeoffs. Use descriptive commit messages such as `Tailor JSON recommendations to lookup tasks`, rather than phase numbers or vague implementation labels. Keep unrelated changes in separate PRs.

By submitting a contribution, you agree that it can be distributed under the repository's Apache-2.0 license. The planning documents under `plan-docs/` carry their own MIT license.
