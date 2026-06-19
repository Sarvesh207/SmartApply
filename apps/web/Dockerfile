# Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root and package manifests
COPY package*.json tsconfig.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared first then web
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

# Production runtime Nginx container
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Custom Nginx config to support React Router HTML5 History mode fallback
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
