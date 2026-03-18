# Security Policy

## Supported Versions

This project is still early and does not currently maintain multiple supported release lines.

Security fixes, when they are made, are expected to land on the latest version of the repository.

## Reporting a Vulnerability

Please do not report security issues in a public issue.

If you discover a vulnerability, report it privately to the repository maintainer with:

- a clear description of the issue
- the impact you believe it has
- reproduction steps
- any proof of concept, logs, or screenshots that help verify it
- any suggested fix or mitigation, if you have one

If you are maintaining this repository, replace this section with the preferred private contact channel before publishing the project more widely.

## Scope

Areas most likely to matter for security in this project include:

- API key handling and local persistence
- outbound HTTP requests to the Flavortown API
- Tauri permissions and capability configuration
- desktop bundling and platform-specific defaults

## Good Disclosure Practice

When reporting an issue:

- avoid including real personal API keys
- rotate any exposed key immediately
- share the smallest proof of concept needed to reproduce the issue
- give maintainers reasonable time to investigate before public disclosure
