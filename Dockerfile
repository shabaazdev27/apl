# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend and backend
# npm run build executes: vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
RUN npm run build

# Stage 2: Production Image
FROM node:20-slim

WORKDIR /app

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Copy any required JSON data files if they are used by the server
COPY --from=builder /app/*.json ./

# Install only production dependencies
# esbuild was run with --packages=external, so we need the production deps
RUN npm install --omit=dev

# Cloud Run expects the application to listen on 8080 by default
ENV PORT 8080
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.cjs"]
