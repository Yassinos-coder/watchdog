# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
