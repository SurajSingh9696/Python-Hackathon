FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @sahaj/web...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.base.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @sahaj/shared build && pnpm --filter @sahaj/web build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S sahaj && adduser -S sahaj -G sahaj
COPY --from=builder --chown=sahaj:sahaj /app/apps/web/.next/standalone ./
COPY --from=builder --chown=sahaj:sahaj /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=sahaj:sahaj /app/apps/web/public ./apps/web/public
USER sahaj
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
