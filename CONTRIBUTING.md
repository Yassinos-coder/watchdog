# Contributing to Watchdog

Thanks for helping make Watchdog better. This guide explains how to report problems, request features and send code.

## Reporting bugs

Open a [bug report](../../issues/new?template=bug_report.yml). Include the version or image tag, how you run Watchdog, and steps to reproduce. Never paste secrets, DSN keys or upload tokens.

Security issues: please use [private vulnerability reporting](../../security/advisories/new). See [SECURITY.md](SECURITY.md).

## Requesting features

1. **Loose idea or question?** Start a thread in [Discussions](../../discussions). Other people can weigh in before it becomes work.
2. **Concrete request?** Open a [feature request](../../issues/new?template=feature_request.yml). Describe the *problem* first, then the change you would like. Tell us if you want to build it.
3. **Triage.** A maintainer labels the issue. `accepted` means the direction is agreed and a pull request is welcome. `needs-discussion` means we have open questions. `wontfix` comes with an explanation.
4. **Build it.** Only issues labeled `accepted` should become pull requests. This avoids wasted effort on features that do not fit the project. Comment on the issue to claim it, then open a pull request that says `Closes #<number>`.

Small fixes (typos, obvious bugs, docs) do not need an issue first.

## Development setup

You need [Bun](https://bun.sh) 1.4+, Node 26+ and Docker.

```bash
git clone https://github.com/Yassinos-coder/watchdog.git
cd watchdog
cp .env.example .env
# put a random value in WATCHDOG_SECRET_KEY, for example: openssl rand -hex 32
docker compose up -d postgres redis
bun install
bun run db:generate
bun run --cwd apps/server db:deploy
bun run dev
```

The dev database listens on port **5433** to avoid clashing with a local PostgreSQL.

Useful commands:

| Command | What it does |
| --- | --- |
| `bun run typecheck` | Type-check every package |
| `bun run build` | Build every package |
| `bun run test` | Unit tests |
| `bun run --cwd apps/server test:e2e` | Integration tests against a throwaway database |
| `bun run --cwd apps/server db:migrate` | Create a migration after changing `schema.prisma` |

## Code conventions

- TypeScript everywhere. Keep it simple: no abstractions before a second consumer exists.
- Colocate code that changes together; one file holds one concept and its private helpers.
- Backend flow is Controller → Service → Repository. Controllers only handle HTTP, repositories only touch the database.
- Types live in `interfaces/`, validation in `validators/`, pure helpers as static-method classes.
- No comments or JSDoc: make names do the explaining.
- Use early returns and Nest's built-in exceptions.
- Log through Nest's `Logger`; it is wired to Winston globally. Never log secrets, tokens, DSN keys or passwords.
- Every screen must work on phone, tablet and desktop widths.

## Pull requests

- Branch from `main` and keep the change focused.
- Add or update tests; CI runs typecheck, build, unit tests, integration tests and a Docker build.
- Database changes need a Prisma migration.
- Fill in the pull request template, and add screenshots (including a mobile width) for UI changes.
- A code-owner review is required to merge.

## Releasing

Releases are automatic. All packages and the Docker image share one version.

1. **Describe your change.** When it affects people who use Watchdog, run `bunx changeset`, choose patch, minor or major, and write one sentence. Commit the generated file in `.changeset/` with your change.
2. **Push to `main`.** The **Release** workflow opens (or updates) a pull request called "Release" that bumps every version, updates `CHANGELOG.md` and syncs the version numbers in the code.
3. **Merge the Release pull request.** The workflow then builds, tests and verifies the packages, publishes `@watchdog-sdk/core`, `browser`, `node`, `react` and `cli` to npm with provenance, tags `vX.Y.Z`, creates a GitHub release and pushes the Docker image to GHCR.

You can also bump the versions in every `package.json` yourself and push to `main`. Any version that is not on npm yet is published, and versions that already exist are skipped, so a failed run can simply be re-run.

Set up once by a maintainer:

- Repository secret `NPM_TOKEN`: an npm automation token (or a granular token with write access to the `@watchdog-sdk` scope that can bypass two-factor authentication).
- Repository variable `NPM_PUBLISH_ENABLED` set to `true`. Until then the workflow prepares releases but does not publish.
- Settings → Actions → General → Workflow permissions: allow Actions to create pull requests.

Check what a release would do without publishing: `DRY_RUN=1 bun run release`.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
