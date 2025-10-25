# Multi-stage production-ready Dockerfile for Next.js
# Optimized for Dokploy deployment with database migrations

# Stage 1: Install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN npm install --production --no-package-lock

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --no-package-lock

# Copy source code
COPY . .

# Build Next.js application
# Next.js will use standalone output mode (configured in next.config.js)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy database migration files and config
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy production dependencies for migrations
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy and make entrypoint script executable
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check - verify the app is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start the application
CMD ["./docker-entrypoint.sh"]
