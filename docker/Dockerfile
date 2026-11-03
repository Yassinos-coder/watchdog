FROM oven/bun:1.4.3 AS build
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY apps ./apps
RUN bunx turbo run build --filter=@watchdog/server --filter=@watchdog/web

FROM node:26-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV WEB_DIST_PATH=/app/apps/web/dist

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/prisma ./apps/server/prisma
COPY --from=build /app/apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/server
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
