# Use the official Node.js image as the base image
FROM node:22-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set the working directory inside the container
WORKDIR /app

# Copy root package.json and package-lock.json for workspace setup
COPY package.json package-lock.json ./

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies for the workspace
RUN npm install

# Copy the frontend application code
COPY apps/frontend ./apps/frontend

# Build the frontend application
WORKDIR /app/apps/frontend
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Command to start your application
CMD ["dumb-init", "--", "npm", "start"]
