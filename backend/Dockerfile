# Zeabur Production Dockerfile for FastAPI Backend
# Optimized with uv for 10-100x faster dependency installation

# Stage 1: Base with uv
FROM python:3.11-slim AS base

# Install uv (faster than pip)
RUN pip install --no-cache-dir uv

WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies using uv
# Use --system to install directly (not in venv)
RUN uv pip install --system --no-cache-dir -e .

# Stage 3: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install runtime dependencies (curl for health check)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini
COPY ./main.py ./main.py
COPY ./start-zeabur.sh ./start-zeabur.sh

# Create non-root user for security
RUN useradd -m -u 1001 fastapi && \
    chmod +x /app/start-zeabur.sh && \
    chown -R fastapi:fastapi /app

USER fastapi

EXPOSE 8000

# Health check endpoint (use /health for better Zeabur compatibility)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Use startup script for Zeabur compatibility
CMD ["/bin/bash", "/app/start-zeabur.sh"]
