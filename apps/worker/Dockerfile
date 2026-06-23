FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Copy root and package manifests
COPY package*.json tsconfig.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ai/package*.json ./packages/ai/
COPY apps/worker/package*.json ./apps/worker/

# Install workspace dependencies
RUN npm ci

# Copy package source code
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/ai ./packages/ai
COPY apps/worker ./apps/worker
COPY services/scraper ./services/scraper

# Generate database schemas and build TypeScript files
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build -w packages/shared
RUN npm run build -w packages/database
RUN npm run build -w packages/ai
RUN npm run build -w apps/worker

# Runner stage
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Install python and pip to allow worker to launch python scraper subprocess
RUN apk add --no-update python3 py3-pip python3-dev build-base postgresql-dev openssl

# Install python packages in worker container
COPY services/scraper/requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/ai ./packages/ai
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/services/scraper ./services/scraper

# Make sure Python points to virtual env path in the execution env
ENV PATH="/opt/venv/bin:$PATH"

CMD ["node", "apps/worker/dist/worker.js"]
