# Security Policy

## Scope

Inside the Prompt is a fully static site: three files of vanilla HTML, CSS and
JavaScript served from GitHub Pages. It has no backend, no accounts, no
cookies, no analytics, and it never transmits or stores anything a visitor
types — the prompt is processed entirely in the browser and discarded on
reload.

That makes the attack surface small, but not zero. Reports we care about
include:

- Cross-site scripting via the prompt input or URL
- Ways the page could be made to leak visitor input off the device
- Supply-chain issues in the repository or its GitHub Actions/Pages setup
- Clickjacking or content-injection concerns specific to the deployment

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub's private vulnerability reporting](https://github.com/ne0vo1d/inside-the-prompt/security/advisories/new)
rather than opening a public issue.

Include what you found, steps to reproduce, and the impact you believe it has.
You can expect an acknowledgement within a week. Please allow time for a fix
to be published before disclosing publicly.

## Supported versions

Only the latest deployment (the `main` branch, as served on GitHub Pages) is
supported.
