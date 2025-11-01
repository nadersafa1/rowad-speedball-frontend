FROM oven/bun:1.2.19-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
