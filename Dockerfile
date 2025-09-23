# syntax=docker/dockerfile:1

# Use Bun's official Alpine image
ARG BUN_VERSION=1.2.19-alpine
FROM oven/bun:${BUN_VERSION} AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S bunjs && \
    adduser -S speedball -u 1001

# Copy package files for dependency installation
COPY package.json bun.lockb* ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js application
RUN bun run build

# Production stage
FROM oven/bun:${BUN_VERSION} AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S bunjs && \
    adduser -S speedball -u 1001

# Copy package files for production dependencies
COPY package.json bun.lockb* ./

# Install all dependencies (needed for Next.js runtime)
RUN bun install --frozen-lockfile

# Copy the entire built application from base stage
COPY --from=base --chown=speedball:bunjs /app .

# Change ownership of the app directory to the speedball user
RUN chown -R speedball:bunjs /app
USER speedball

# Expose the port your app runs on
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the Next.js application
CMD ["bun", "run", "start"]