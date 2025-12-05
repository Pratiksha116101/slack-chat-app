# Multi-stage Dockerfile to build frontend and backend and serve both from Express
# Builder stage
FROM node:18-slim AS builder
WORKDIR /app

# Build frontend
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install --no-audit --prefer-offline --no-fund
COPY frontend/ .
RUN npm run build

# Install backend production dependencies in builder stage
WORKDIR /app
COPY backend/ /app/backend/
WORKDIR /app/backend
# Install production deps (package.json is present because we copied the backend)
RUN npm install --only=production --no-audit --prefer-offline --no-fund

# Final runtime image
FROM node:18-slim AS runtime
WORKDIR /app

# Copy backend (with node_modules installed in builder)
COPY --from=builder /app/backend /app/backend

# Copy frontend build into backend (served from backend/server.js)
COPY --from=builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
