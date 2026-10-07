# CAFFT API. Node runs the TypeScript sources directly (type stripping), so
# there is no build step: the image is the sources plus production deps.
FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY migrations ./migrations

# The database lives on a volume mounted here; the image runs as the
# unprivileged `node` user, so the volume directory must be writable by it.
RUN mkdir -p /data && chown node:node /data
USER node

ENV DB_PATH=/data/cafft.db \
    HOST=0.0.0.0 \
    PORT=3001

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "src/index.ts"]
