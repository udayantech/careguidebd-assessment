# syntax=docker/dockerfile:1.6

# -------------------------------------------------------------
# Stage 1: Build & Dependencies
# -------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-alpine3.20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm prune --omit=dev

# -------------------------------------------------------------
# Stage 2: Final Minimal & Hardened Runtime
# -------------------------------------------------------------
FROM node:20-alpine3.20

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

LABEL org.opencontainers.image.title="devops-service-nodejs" \
      org.opencontainers.image.description="Cloud-native Node.js microservice" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/example/devops-service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /usr/src/app

# 1. Upgrade base OS packages to patch OpenSSL/libcrypto3
# 2. Install curl for healthcheck
# 3. Remove pre-bundled Yarn and npm from final image to clear bundled CVEs (tar)
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache curl && \
    rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /opt/yarn* /usr/local/bin/yarn*

# Copy production node_modules and app code from builder
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/src ./src
COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json

ENV NODE_ENV=production \
    APP_PORT=8080 \
    APP_VERSION=${VERSION}

# Run as non-root user
USER node

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["node", "src/server.js"]
