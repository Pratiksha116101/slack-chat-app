# Multi-stage Dockerfile to build frontend and backend and serve both from Express
# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy frontend, install and build
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json backend/
WORKDIR /app/backend
RUN npm ci --silent
COPY backend/ .

# Final stage: copy built frontend into backend and install only prod deps
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy backend source
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend build into backend/public (we serve from backend/server.js using frontend/dist)
COPY --from=builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
# Install production dependencies
RUN npm ci --only=production --silent

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
