# Multi-stage Dockerfile to build frontend and backend and serve both from Express
# Builder stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy frontend, install and build
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

FROM node:18-slim AS runtime
WORKDIR /app

# Copy backend dependencies and install
COPY backend/package*.json backend/
WORKDIR /app/backend
RUN npm ci --only=production --silent

# Copy backend source
COPY backend/ .

# Copy frontend build into backend/public (we serve from backend/server.js using frontend/dist)
COPY --from=builder /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
