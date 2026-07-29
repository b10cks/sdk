# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests or
Discord.**

Report them privately through
[GitHub Security Advisories](https://github.com/b10cks/sdk/security/advisories/new). If you cannot
use that form, email <security@b10cks.com> instead.

Please include as much of the following as you can – it helps us reproduce and triage faster:

- The affected package(s) and version(s)
- The type of issue (token leakage, XSS, prototype pollution, supply chain, …)
- Steps to reproduce, ideally a minimal proof of concept
- The impact you believe an attacker could achieve

## What to expect

| Stage                         | Target                                                |
| ----------------------------- | ----------------------------------------------------- |
| Acknowledgement of the report | within 3 business days                                |
| Initial assessment            | within 7 business days                                |
| Fix released                  | depends on severity – critical issues are prioritised |

We will keep you updated as we work on a fix, and we will credit you in the advisory and release
notes unless you ask us not to.

Please give us a reasonable window to ship a fix before disclosing the issue publicly. We publish a
GitHub Security Advisory for every confirmed vulnerability once a patched version is available.

## Scope

In scope are the packages published from this repository:

`@b10cks/client`, `@b10cks/mgmt-client`, `@b10cks/cli`, `@b10cks/mcp-server`, `@b10cks/richtext`,
`@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`, `@b10cks/next`.

Only the **latest released version** of each package receives security fixes. Backports to older
majors are considered case by case.

Vulnerabilities in the b10cks hosted platform or Management API itself are out of scope here –
report those to <security@b10cks.com> or via [b10cks.com](https://www.b10cks.com).

## Handling access tokens

Most reports we expect concern credentials, so to set expectations:

- The **access token** passed to `@b10cks/client` (and therefore to `@b10cks/vue`, `@b10cks/react`,
  `@b10cks/svelte`, `@b10cks/nuxt` and `@b10cks/next`) is a **public, read-only Data API token**. It
  is shipped to the browser by design – in Nuxt it lives in `runtimeConfig.public.b10cks`.
- **Management API tokens** (used by `@b10cks/mgmt-client`, `@b10cks/cli` and `@b10cks/mcp-server`)
  are privileged and must never reach the browser. The CLI stores them in `~/.netrc` with `0600`
  permissions.
- Putting a Management API token into a client-side SDK config is a misconfiguration, not a
  vulnerability in these packages. A path by which a _public_ token grants write access, or by which
  a _management_ token is exposed by our code, absolutely is – please report it.
