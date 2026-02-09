# Stage 1: Build frontend
FROM node:22-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=/classroom/api
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.25-bookworm AS backend
WORKDIR /app

# Copy Go module files first for caching
COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build into the embed location
COPY --from=frontend /app/dist ./backend/cmd/server/dist/

# Build with CGO for sqlite3
RUN cd backend && CGO_ENABLED=1 go build -o /server ./cmd/server

# Stage 3: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=backend /server /server

EXPOSE 8080
ENV PORT=8080
ENV DATABASE_PATH=/data/classroom.db

VOLUME /data

CMD ["/server"]
