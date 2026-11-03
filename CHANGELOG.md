# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-11-03

### Fixed
- The source map upload command in the dashboard, the documentation and the READMEs now runs `bunx @watchdog-sdk/cli`. The old `bunx watchdog` command downloaded an unrelated package of the same name when the CLI was not installed

## [0.5.1] - 2026-11-03

### Added
- Owners and admins see a notice in the dashboard when a newer Watchdog version is published, with a link to what changed. Turn it off with `UPDATE_CHECK=false`

### Changed
- The issues list, the overview's recent issues and the project stats now refresh every 15 seconds and when you switch back to the tab, so new issues appear without reloading the page

## [0.5.0] - 2026-11-03

### Added
- Performance monitoring: transactions with spans, custom metrics (counters, gauges, distributions) and dashboards with configurable widgets
- Session replay: the browser SDK can record sessions (optional `@rrweb/record`), and a Replays page plays them back, linking replays to the errors that happened during them
- React Native and Expo SDK (`@watchdog-sdk/react-native`) reporting uncaught JavaScript errors, unhandled promise rejections, breadcrumbs, navigation, tracing and metrics
- Team management: invite people by email or link, with owner, admin and member roles that can only manage people ranked below them
- Sign in with Google or GitHub for existing users and pending invites, with two-step verification still enforced
- Automatic data retention for events, performance data and replays, configurable with `RETENTION_*` settings
- Documentation site built with VitePress, deployed to GitHub Pages, plus new guides for tracing, replay, mobile, team, OAuth, retention and configuration
- Railway template support: `railway.json` for the Dockerfile build and health check, and a maintainer guide for publishing the template

### Changed
- The Dockerfile copies the new docs workspace so locked installs keep working
- Hermes stack frames now resolve to the bundle file name, so source maps match for React Native

## [0.4.4] - 2026-11-03

### Fixed
- Updated build and release tooling: Bun 1.4.4, newer Docker and checkout GitHub Actions, jsdom 30 and recharts 3.10

## [0.4.3] - 2026-11-03

### Fixed
- The release workflow no longer prints scary-looking npm 404 messages when it checks whether a version is already published

## [0.4.2] - 2026-11-03

### Added
- Automated releases: a pull request bumps every version and writes the changelog, and merging it publishes the packages to npm with provenance, creates a GitHub release and pushes the Docker image
- Publishing stays off until the NPM_PUBLISH_ENABLED repository variable is set to true, so the first release is always a deliberate choice

## [0.4.1] - 2026-11-03

### Added
- npm publishing for the five SDK packages under the @watchdog-sdk scope, with provenance, a package README and licence file each
- Release workflow that publishes the packages when a version tag is pushed, and skips versions that are already published
- Package verification that checks contents, resolved dependencies, exports and types, run in CI and before every release
- Release process documented in CONTRIBUTING

### Changed
- SDK packages renamed from @watchdog/* to @watchdog-sdk/*, including all docs and setup snippets

## [0.4.0] - 2026-11-03

### Added
- Alerts to Slack, Discord, Telegram and email, with channels shared across projects and credentials encrypted at rest
- Per-project alert rules for new issues, regressions and spikes, with severity and environment filters and a quiet period
- Integrations page to manage channels, send test alerts and review every delivery attempt with its failure reason
- SMTP settings in the dashboard so administrators can use their own mail server, with environment variables as a fallback
- Alerts page per project to create, edit, pause and delete rules
- Setup guide links next to every integration form, pointing at the new documentation
- Documentation for alerts, authentication and source maps
- Public configuration endpoint exposing the version and documentation location

### Security
- Webhook addresses are restricted to the provider's own hosts, so alerts cannot be used to reach internal services
- Alert delivery never blocks error collection, and failures are recorded instead of raised

### Changed
- Email sign-in codes now use the SMTP settings saved in the dashboard when present

## [0.3.0] - 2026-11-03

### Added
- Dashboard with first-run setup, sign-in, second-step verification, recovery codes and security settings
- Project overview with event totals, an events-over-time chart, top releases and environments
- Issue list with status, search and sort, and an issue page that leads with the failing code and highlights the exact line
- Stack traces with collapsible frames, library frames hidden by default, and a "Source mapped" marker
- Breadcrumb timeline, event details and per-event inspection on every issue
- Project settings with keys and DSNs, setup guide snippets, source map releases and upload token management
- Browser, React, Node.js and NestJS SDKs with automatic error capture, breadcrumbs and retrying delivery
- Command line tool that uploads source maps from your build
- Light and dark themes, self-hosted fonts and a layout that works from phones to wide desktops
- Security settings API to list and remove passkeys and methods, and an anonymous-safe session endpoint

### Fixed
- Issues now keep the newest last-seen time and release when events arrive out of order
- Code lines keep their indentation so the failing line lines up with its neighbours
- Source maps with the same file name in different folders no longer overwrite each other
- Recovery codes are no longer skipped when the first two-step method is set up
- Disabling a project key takes effect immediately instead of after a cache delay
- Passwords containing a very short email name are no longer rejected
- Ignored error patterns now also match the bare error message

### Changed
- Docker image builds from the full workspace and serves the dashboard with a strict content security policy
- Dependabot no longer proposes major upgrades of TypeScript and Prisma

## [0.2.0] - 2026-11-03

### Added
- First-run setup wizard API protected by a setup token, creating the owner account
- Email and password sign-in with argon2id hashing, account lockout and recovery codes
- Required two-step verification for administrators: authenticator app, passkeys or emailed codes
- Projects with DSN keys, key rotation and a per-project upload token
- Event ingestion endpoint with per-project rate limiting, CORS for browsers and sendBeacon support
- Automatic error grouping into issues with regression detection and an unresolved / resolved / ignored workflow
- Source map upload and symbolication that shows original file, line and surrounding code for every frame
- Issue, event and statistics APIs including time series, top releases and environments
- Structured Winston logging across the whole app with secret redaction and JSON output in production
- Unit and integration test suites running against a throwaway database
- GitHub setup: CI, image release workflow, code owners, branch ruleset, issue forms, feature request flow, security and contributing guides

### Changed
- Docker Compose file moved to the repository root and now refuses to start without a secret key
- Responses from the API are marked no-store and no longer advertise the server framework
- Request validation rejects unknown fields
- Public URL is detected automatically on Railway, Render, Fly and Koyeb

## [0.1.0] - 2026-11-03

### Added
- Bun and Turborepo monorepo with a NestJS server and a React dashboard
- Server health endpoints for liveness and database readiness
- Prisma schema and migration pipeline on PostgreSQL
- Rate limiting and auto-ban on every route through nestjs-shield
- Single-image Docker build that runs migrations on startup and serves the dashboard
- Docker Compose setup with PostgreSQL and Redis
- MIT license
