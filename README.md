# Watchdog

Open source, self-hosted error tracking, performance tracing and session replay. Free forever, runs on your own infrastructure.

Status: early development.

## Stack

- NestJS + Prisma + PostgreSQL + Redis
- React + Vite + Tailwind + shadcn/ui
- Bun workspaces + Turborepo

## Development

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d postgres redis
bun install
bun run db:generate
bun run --cwd apps/server db:migrate
bun run dev
```

## License

MIT
