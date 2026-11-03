# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-03

### Added
- Bun and Turborepo monorepo with a NestJS server and a React dashboard
- Server health endpoints for liveness and database readiness
- Prisma schema and migration pipeline on PostgreSQL
- Rate limiting and auto-ban on every route through nestjs-shield
- Single-image Docker build that runs migrations on startup and serves the dashboard
- Docker Compose setup with PostgreSQL and Redis
- MIT license
