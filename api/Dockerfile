# syntax=docker/dockerfile:1

# ---- Build: install all deps and compile TypeScript ----
FROM node:24-alpine AS build
WORKDIR /app

# Lockfile first so the dependency layer is cached between code changes.
# --ignore-scripts: no install script is needed (and @scarf/scarf would send telemetry).
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Runtime: production deps + compiled output only ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist

# Non-root user shipped with the official Node image.
USER node

EXPOSE 3000

# Node runs as PID 1: server.ts handles SIGTERM/SIGINT itself for a graceful shutdown.
CMD ["node", "dist/server.js"]
