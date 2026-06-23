FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Copy root and package manifests
COPY package*.json tsconfig.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ai/package*.json ./packages/ai/
COPY apps/api/package*.json ./apps/api/

# Install workspace dependencies
RUN npm ci

# Copy package source code
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/ai ./packages/ai
COPY apps/api ./apps/api

# Generate database schemas and build TypeScript files
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build -w packages/shared
RUN npm run build -w packages/database
RUN npm run build -w packages/ai
RUN npm run build -w apps/api

# Runner stage
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV PORT=5000
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/ai ./packages/ai
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
