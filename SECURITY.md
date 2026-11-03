# Security policy

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub's
[private vulnerability reporting](https://github.com/Yassinos-coder/watchdog/security/advisories/new).
Do not open a public issue.

Include what you found, how to reproduce it, and the impact you expect. You will get an acknowledgement as soon as a maintainer can respond, and updates as the fix progresses. Please give us reasonable time to release a fix before disclosing details.

## Supported versions

Watchdog is in early development. Security fixes land on the latest release only.

## Operating Watchdog safely

- Set a strong, random `WATCHDOG_SECRET_KEY` (`openssl rand -hex 32`) and keep it stable; it encrypts authenticator secrets and integration credentials.
- Set `SETUP_TOKEN` and complete the first-run setup immediately after deploying.
- Serve Watchdog over HTTPS and set `APP_URL` to the public https URL.
- Enable two-step verification (authenticator app or passkey) for every administrator.
- Set `TRUST_PROXY` to the number of reverse proxies in front of Watchdog so client IPs are accurate.
