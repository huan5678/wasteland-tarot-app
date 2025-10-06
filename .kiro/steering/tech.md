# Technology Stack Steering

> **Inclusion Mode**: Always Included
> **Purpose**: Technical constraints and architectural decisions affecting all code generation

## Architecture

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Python 3.11+ │    │ • Anthropic     │
│ • TypeScript 5  │    │ • FastAPI       │    │ • OpenAI        │
│ • Tailwind v4   │    │ • SQLAlchemy    │    │ • Google Gemini │
│ • Bun runtime   │    │ • Supabase SDK  │    │ • Supabase      │
│ • Zustand       │    │ • uv env        │    │ • Zeabur        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Deployment Architecture
- **Hosting Platform**: Zeabur (前後端統一部署)
  - Frontend: Next.js 14 (CDN, SSL, auto-scaling)
  - Backend: FastAPI + Docker (auto-scaling)
- **Database**: Supabase (PostgreSQL + pg_cron + Edge Functions)
- **Scheduler**: Supabase pg_cron + Edge Functions (Deno)
- **AI Services**: Multi-provider (Anthropic Claude, OpenAI, Google Gemini)

## Frontend Technology Stack

### Core Technologies
- **Framework**: Next.js 15.1.7 (App Router)
- **Language**: TypeScript 5
- **Runtime**: Bun (package management and development)
- **React**: React 19 with React DOM 19
- **Styling**: Tailwind CSS v4.1.13 with PostCSS 8

### Key Frontend Dependencies

#### UI & Components
```json
{
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-slot": "^1.2.3",
  "lucide-react": "^0.544.0",
  "shadcn": "^3.3.1"
}
```

#### State Management & Forms
```json
{
  "zustand": "^4.5.7",
  "react-hook-form": "^7.62.0",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.1.9"
}
```

#### Animation & Interaction
```json
{
  "motion": "^12.23.22",
  "@react-spring/web": "^10.0.3",
  "@use-gesture/react": "^10.3.1",
  "react-zoom-pan-pinch": "^3.7.0"
}
```

#### 3D Graphics (Background Effects)
```json
{
  "@react-three/fiber": "^9.3.0",
  "@react-three/postprocessing": "^3.0.4",
  "three": "^0.180.0",
  "postprocessing": "^6.37.8"
}
```

#### Utility Libraries
```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "tailwindcss-animate": "^1.0.7"
}
```

### Development Dependencies

#### Testing Frameworks
```json
{
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
  "@types/jest": "^29.5.14"
}
```

#### E2E & Accessibility Testing
```json
{
  "@playwright/test": "^1.55.1",
  "@axe-core/playwright": "^4.10.2",
  "cypress": "^13.17.0",
  "axe-core": "^4.10.2"
}
```

#### Visual & Performance Testing
```json
{
  "@percy/cli": "^1.31.2",
  "@percy/cypress": "^3.1.3",
  "@lhci/cli": "^0.15.1"
}
```

#### API Mocking
```json
{
  "msw": "^2.6.8"
}
```

#### Build & Development Tools
```json
{
  "typescript": "^5",
  "eslint": "^8",
  "eslint-config-next": "15.1.7",
  "tsx": "^4.19.2",
  "@tailwindcss/postcss": "^4.1.13",
  "autoprefixer": "^10.4.21"
}
```

### Frontend Polyfills
```json
{
  "web-streams-polyfill": "^4.2.0",
  "whatwg-fetch": "^3.6.20"
}
```

## Backend Technology Stack

### Core Technologies
- **Framework**: FastAPI 0.104.0+
- **Language**: Python 3.11+
- **Package Manager**: uv (virtual environment: `/backend/.venv`)
- **ASGI Server**: Uvicorn[standard] 0.24.0+
- **ORM**: SQLAlchemy 2.0.23+ with Alembic 1.13.0+

### Key Backend Dependencies

#### Core Framework
```toml
fastapi = ">=0.104.0"
uvicorn[standard] = ">=0.24.0"
pydantic[email] = ">=2.5.0"
pydantic-settings = ">=2.1.0"
```

#### Database & ORM
```toml
sqlalchemy = ">=2.0.23"
alembic = ">=1.13.0"
asyncpg = ">=0.29.0"
psycopg[binary] = ">=3.1.0"
aiosqlite = ">=0.21.0"
```

#### Supabase Integration
```toml
supabase = ">=2.0.0"
postgrest = ">=0.13.0"
```

#### Authentication & Security
```toml
python-jose[cryptography] = ">=3.3.0"
passlib[bcrypt] = ">=1.7.4"
bcrypt = ">=4.0.0"
python-multipart = ">=0.0.6"
```

#### AI Service Providers
```toml
anthropic = ">=0.39.0"
openai = ">=1.54.0"
google-generativeai = ">=0.8.0"
```

#### HTTP & Utilities
```toml
httpx = ">=0.25.0"
python-dotenv = ">=1.0.0"
redis = ">=5.0.0"
psutil = ">=7.1.0"
```

### Testing Dependencies
```toml
[dependency-groups]
test = [
  "pytest>=8.4.2",
  "pytest-asyncio>=1.2.0",
  "pytest-cov>=7.0.0",
  "pytest-mock>=3.15.1",
  "pytest-httpx>=0.35.0",
  "pytest-benchmark>=5.1.0",
  "pytest-factoryboy>=2.8.1",
  "factory-boy>=3.3.3",
  "faker>=37.8.0",
  "responses>=0.25.8",
  "sqlalchemy-utils>=0.42.0"
]
```

## Development Environment

### Package Managers
- **Frontend**: Bun (not npm or yarn)
- **Backend**: uv (not pip or poetry)

### Common Commands

#### Frontend Commands
```bash
# Development
bun dev                    # Start development server
bun build                  # Production build
bun start                  # Start production server

# Testing
bun test                   # Run Jest unit tests
bun test:watch             # Jest watch mode
bun test:coverage          # Generate coverage report
bun test:playwright        # Run Playwright E2E tests
bun test:accessibility     # Run accessibility tests

# Quality Checks
bun lint                   # Run ESLint
```

#### Backend Commands
```bash
# Environment Setup
cd backend
uv sync                    # Install dependencies in .venv

# Development (from backend/)
uv run uvicorn app.main:app --reload --port 8000

# Testing (from backend/)
uv run pytest                               # Run all tests
uv run pytest tests/unit/                   # Unit tests only
uv run pytest tests/integration/            # Integration tests only
uv run pytest --cov=app --cov-report=html   # Coverage report

# Database (from backend/)
uv run alembic upgrade head                 # Apply migrations
uv run alembic revision --autogenerate -m "message"  # Generate migration
```

## Environment Variables

### Frontend Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_STREAMING=true
NEXT_PUBLIC_ENABLE_VOICE_FEATURES=true
```

### Backend Environment Variables
```bash
# Application
APP_NAME=Wasteland Tarot Backend
APP_VERSION=0.1.0
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-service-role-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GOOGLE_GEMINI_API_KEY=your-gemini-key

# Security
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
```

## Port Configuration

### Development Ports
- **Frontend**: `3000` (Next.js dev server)
- **Backend**: `8000` (FastAPI/Uvicorn)
- **Database**: `5432` (PostgreSQL via Supabase)
- **Redis**: `6379` (Local development cache)

### Production Ports
- **Frontend**: `80/443` (Zeabur managed with SSL)
- **Backend**: `8000` (Zeabur managed with auto-scaling)

## Key Architectural Decisions

### 1. Multi-Provider AI Strategy
**Decision**: Support multiple AI providers (Anthropic, OpenAI, Google Gemini)
**Rationale**:
- Cost optimization through provider switching
- Redundancy if one provider has outages
- Different models for different interpretation styles

**Implementation**:
- Factory pattern for AI provider selection
- Streaming support for real-time responses
- Character voice mapping to appropriate models

### 2. Supabase for Backend Services
**Decision**: Use Supabase for database, auth, and real-time features
**Rationale**:
- Managed PostgreSQL with excellent performance
- Built-in authentication system
- Real-time subscriptions for live features
- Reduces backend complexity

**Implementation**:
- SQLAlchemy for ORM on top of Supabase PostgreSQL
- Supabase Auth integrated with FastAPI JWT
- Row-level security for data isolation

### 3. Zustand for State Management
**Decision**: Use Zustand instead of Redux or Context API
**Rationale**:
- Minimal boilerplate compared to Redux
- Better performance than Context API
- TypeScript support out of the box
- Simpler learning curve

**Implementation**:
- Separate stores for auth, readings, UI, spreads
- Persist state to localStorage where appropriate
- Action tracking for karma system

### 4. Bun for Frontend Tooling
**Decision**: Use Bun instead of npm/yarn
**Rationale**:
- Significantly faster package installation
- Built-in TypeScript transpiler
- Drop-in npm replacement
- Modern JavaScript runtime

**Implementation**:
- All frontend dependencies managed by Bun
- Scripts use `bun` instead of `npm run`

### 5. uv for Backend Dependencies
**Decision**: Use uv instead of pip/poetry
**Rationale**:
- Faster dependency resolution
- Better virtual environment management
- Compatible with standard Python tooling
- Modern dependency management

**Implementation**:
- Virtual environment at `/backend/.venv`
- All dependencies in `pyproject.toml`
- Use `uv run` for command execution

### 6. App Router over Pages Router
**Decision**: Next.js App Router (not Pages Router)
**Rationale**:
- Server components for better performance
- Built-in layouts and loading states
- Better data fetching patterns
- Future-proof architecture

**Implementation**:
- All pages in `src/app/`
- Server and client components clearly separated
- Route groups for logical organization

### 7. Streaming AI Responses
**Decision**: Stream AI interpretations instead of waiting for complete response
**Rationale**:
- Better user experience (see text as it generates)
- Perceived performance improvement
- Handles long interpretations gracefully

**Implementation**:
- FastAPI streaming endpoints
- React hooks for streaming text display
- SSE (Server-Sent Events) or WebSocket support

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types except where absolutely necessary
- Explicit return types for functions
- Interface-based contracts

### Python
- Type hints required for all functions
- Black formatting (88 character line length)
- Isort for import organization
- MyPy for static type checking
- Ruff for linting

### Testing
- **Frontend**: 80%+ coverage target with Jest
- **Backend**: 85%+ coverage target with pytest
- E2E tests for critical user flows
- Accessibility tests for all pages

### Documentation
- JSDoc for complex TypeScript functions
- Docstrings for all Python functions
- README files for major subsystems
- API documentation via FastAPI OpenAPI

## Security Considerations

### Authentication
- JWT tokens with 30-minute expiration
- Refresh tokens with 7-day expiration
- Supabase Auth for user management
- Secure password hashing with bcrypt

### API Security
- CORS properly configured
- Rate limiting on API endpoints
- Input validation with Pydantic
- SQL injection prevention via SQLAlchemy

### Data Protection
- HTTPS enforced in production
- Environment variables for secrets
- Row-level security in Supabase
- No sensitive data in client-side code

## Performance Targets

### Frontend
- **Initial Load**: <3 seconds (Lighthouse)
- **First Contentful Paint**: <1.5 seconds
- **Time to Interactive**: <3.5 seconds
- **Cumulative Layout Shift**: <0.1

### Backend
- **API Response**: <5 seconds (including AI)
- **Database Query**: <100ms (average)
- **AI Streaming**: First token <2 seconds
- **Uptime**: 99.9% availability

### Monitoring
- Zeabur Analytics for frontend (內建)
- FastAPI middleware for API monitoring
- Sentry for error tracking (optional)
- Supabase logs for database and Edge Functions
- pg_cron job monitoring for scheduled tasks

---

*Last Updated: 2025-10-01*
*Tech Stack Version: Frontend (Bun + Next.js 15 + React 19), Backend (uv + FastAPI + Python 3.11)*
