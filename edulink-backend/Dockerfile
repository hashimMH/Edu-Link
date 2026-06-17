# ── Build stage ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Runtime stage ────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 app && adduser -u 1001 -G app -D app

# Copy production deps from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy app source
COPY . .

# Switch to non-root
USER app

# Expose port (DO sets PORT env var)
EXPOSE 8080

# Start with migrations + server
# DATABASE_URL should be set via environment (e.g. postgresql://user:pass@host:5432/edulink)
CMD node migrations/run.js && node src/index.js
