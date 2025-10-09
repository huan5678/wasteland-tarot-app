# Project Structure Steering

> **Inclusion Mode**: Always Included
> **Purpose**: File organization and code patterns for consistent development

## Root Directory Organization

```
tarot-card-nextjs-app/
├── src/                      # Frontend source code (Next.js + React)
├── backend/                  # Backend source code (FastAPI + Python)
├── .kiro/                    # Kiro spec-driven development files
├── .claude/                  # Claude Code configuration
├── .ai-rules/                # Legacy AI rules (superseded by .kiro/steering/)
├── docs/                     # Project documentation
├── tests/                    # Frontend E2E and accessibility tests
├── cypress/                  # Cypress E2E tests
├── scripts/                  # Build and utility scripts
├── public/                   # Static assets (Next.js convention)
└── [config files]            # Root-level configuration files
```

### Configuration Files (Root)
```
package.json              # Frontend dependencies (bun)
tsconfig.json            # TypeScript configuration
next.config.ts           # Next.js configuration
tailwind.config.ts       # Tailwind CSS v4 configuration
jest.config.js           # Jest test configuration
playwright.config.ts     # Playwright E2E configuration
playwright.accessibility.config.ts  # Accessibility test config
cypress.config.ts        # Cypress E2E configuration
eslint.config.js         # ESLint configuration
.gitignore              # Git ignore patterns
README.md               # Project overview
CLAUDE.md               # Claude Code instructions
```

## Frontend Structure (`src/`)

### Complete Frontend Tree
```
src/
├── app/                           # Next.js App Router pages
│   ├── api/                      # API routes (if any)
│   │   └── hello/                # Example API routes
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── cards/                    # Card browsing page
│   ├── dashboard/                # User dashboard
│   ├── profile/                  # User profile
│   ├── readings/                 # Reading pages
│   │   └── new/                  # New reading creation
│   ├── test-*/                   # Development test pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                    # React components (organized by domain)
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── __tests__/           # Component tests
│   ├── cards/                    # Card-related components
│   │   └── __tests__/
│   ├── common/                   # Shared components
│   │   ├── CardStateIndicators.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── GlobalErrorDisplay.tsx
│   │   └── Toast.tsx
│   ├── kokonutui/               # Third-party component library
│   ├── layout/                  # Layout components
│   │   ├── ClientLayout.tsx
│   │   ├── DitherBackground.tsx
│   │   ├── DynamicBackground.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── MobileCardModal.tsx
│   │   ├── ResponsiveContainer.tsx
│   │   ├── WastelandBackground.tsx
│   │   └── __tests__/
│   ├── mobile/                  # Mobile-specific components
│   │   ├── MobileNavigation.tsx
│   │   ├── MobileReadingInterface.tsx
│   │   ├── MobileSpreadSelector.tsx
│   │   └── MobileTarotCard.tsx
│   ├── providers/               # React context providers
│   │   └── ZustandAuthProvider.tsx
│   ├── readings/                # Reading-related components
│   │   ├── AdvancedSearchFilter.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── ExportShareTools.tsx
│   │   ├── ReadingDetailModal.tsx
│   │   ├── ReadingHistory.tsx
│   │   ├── ReadingMetaEditor.tsx
│   │   ├── ReadingNotesSystem.tsx
│   │   ├── ReadingStatsDashboard.tsx
│   │   ├── ReadingTemplates.tsx
│   │   ├── SpreadInteractiveDraw.tsx
│   │   ├── SpreadLayoutPreview.tsx
│   │   ├── SpreadSelector.tsx
│   │   ├── StreamingInterpretation.tsx
│   │   └── TagsManager.tsx
│   ├── system/                  # System-level components
│   │   └── MetricsInitializer.tsx
│   ├── tarot/                   # Tarot card components
│   │   ├── CardDetailModal.tsx
│   │   ├── CardDraw.tsx
│   │   ├── CardRelationships.tsx
│   │   ├── CardShare.tsx
│   │   ├── StudyMode.tsx
│   │   ├── TarotCard.tsx
│   │   └── __tests__/
│   ├── ui/                      # shadcn/ui components (Fallout themed)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── morphing-dialog.tsx
│   │   ├── select.tsx
│   │   └── __tests__/
│   ├── Dither.tsx              # Dither effect component
│   └── PixelBlast.tsx          # Pixel animation component
│
├── hooks/                        # Custom React hooks
│   ├── useAdvancedGestures.ts
│   ├── useAuth.ts
│   ├── useCardInteractions.tsx
│   ├── useClickOutside.tsx
│   ├── useMobilePerformance.ts
│   ├── useStreamingText.ts
│   ├── useTextToSpeech.tsx
│   ├── useTouchInteractions.ts
│   └── __tests__/
│
├── lib/                          # Core libraries and utilities
│   ├── actionTracker.ts         # User action tracking
│   ├── api.ts                   # API client
│   ├── authStore.ts             # Authentication Zustand store
│   ├── errorStore.ts            # Error state management
│   ├── interpretationEngine.ts  # AI interpretation logic
│   ├── logger.ts                # Logging utility
│   ├── metrics.ts               # Metrics and analytics
│   ├── readingsStore.ts         # Readings Zustand store
│   ├── spreadLayouts.ts         # Spread layout definitions
│   ├── spreadMapping.ts         # Spread configuration
│   ├── spreadTemplatesStore.ts  # Spread templates store
│   ├── uiStore.ts               # UI state store
│   └── utils.ts                 # General utilities
│
├── data/                         # Static data files
│   └── enhancedCards.ts         # Wasteland card data
│
├── types/                        # TypeScript type definitions
│   └── database.ts              # Database types
│
├── utils/                        # Utility functions
│   ├── enhancedCardModalIntegration.ts
│   ├── mobileAccessibility.ts
│   └── speechHandler.ts
│
├── test/                         # Test utilities and mocks
│   ├── mocks/                   # MSW mock handlers
│   │   ├── data.ts
│   │   ├── handlers.ts
│   │   ├── server.ts
│   │   └── handlers/
│   │       ├── auth.ts
│   │       ├── cards.ts
│   │       ├── readings.ts
│   │       └── users.ts
│   ├── setup.ts                 # Test setup
│   ├── setupPolyfills.ts        # Browser polyfills for tests
│   └── __mocks__/               # Jest mocks
│
├── styles/                       # Global styles (if any)
│
├── __tests__/                    # Top-level integration tests
│   └── enhanced-card-modal.test.tsx
│
├── APITester.tsx                 # Development API testing component
├── App.tsx                       # Legacy app component
├── frontend.tsx                  # Frontend entry point
├── index.tsx                     # Main entry point
└── bun-env.d.ts                  # Bun environment types
```

### Key Frontend Patterns

#### Component Organization
- **Domain-based folders**: Components grouped by feature (`auth/`, `readings/`, `tarot/`)
- **Co-located tests**: `__tests__/` subdirectories next to components
- **Shared components**: `common/` for cross-cutting concerns
- **UI primitives**: `ui/` for shadcn/ui components

#### State Management Pattern
```typescript
// Zustand stores in lib/
lib/
├── authStore.ts          # Authentication state
├── readingsStore.ts      # Readings and interpretations
├── spreadTemplatesStore.ts  # Spread configurations
├── errorStore.ts         # Global error handling
└── uiStore.ts            # UI state (modals, loading, etc.)
```

#### Hooks Pattern
```typescript
// Custom hooks in hooks/ directory
hooks/
├── useAuth.ts                # Authentication hook
├── useStreamingText.ts       # AI streaming hook
├── useTextToSpeech.tsx       # TTS hook
├── useCardInteractions.tsx   # Card interaction logic
└── useMobilePerformance.ts   # Mobile optimization
```

## Backend Structure (`backend/`)

### Complete Backend Tree
```
backend/
├── app/                          # FastAPI application
│   ├── api/                     # API routes
│   │   ├── v1/                  # API version 1
│   │   │   ├── endpoints/       # Route endpoints
│   │   │   │   ├── cards.py
│   │   │   │   ├── readings.py
│   │   │   │   ├── readings_stream.py
│   │   │   │   ├── social.py
│   │   │   │   ├── spreads.py
│   │   │   │   ├── voices.py
│   │   │   │   └── __init__.py
│   │   │   ├── api.py           # V1 router aggregation
│   │   │   └── __init__.py
│   │   ├── auth.py              # Authentication routes
│   │   ├── cards.py             # Card routes
│   │   ├── karma.py             # Karma system routes
│   │   ├── monitoring.py        # Monitoring endpoints
│   │   ├── readings.py          # Reading routes
│   │   ├── readings_enhanced.py # Enhanced reading routes
│   │   ├── social.py            # Social features routes
│   │   ├── spreads.py           # Spread routes
│   │   └── __init__.py
│   │
│   ├── core/                    # Core configuration
│   │   ├── dependencies.py      # Dependency injection
│   │   ├── exceptions.py        # Custom exceptions
│   │   ├── security.py          # Security utilities
│   │   └── __init__.py
│   │
│   ├── db/                      # Database utilities
│   │   ├── database.py          # Database connection
│   │   ├── session.py           # Session management
│   │   ├── seed_data.py         # Seed data scripts
│   │   ├── *_seed.py            # Various seed scripts
│   │   └── __init__.py
│   │
│   ├── models/                  # SQLAlchemy models
│   │   ├── base.py              # Base model
│   │   ├── reading_enhanced.py  # Enhanced reading model
│   │   ├── social_features.py   # Social models
│   │   ├── user.py              # User model
│   │   ├── wasteland_card.py    # Card model
│   │   └── __init__.py
│   │
│   ├── schemas/                 # Pydantic schemas
│   │   ├── cards.py             # Card schemas
│   │   ├── readings.py          # Reading schemas
│   │   ├── social.py            # Social schemas
│   │   ├── spreads.py           # Spread schemas
│   │   ├── voices.py            # Voice schemas
│   │   └── __init__.py
│   │
│   ├── services/                # Business logic services
│   │   ├── ai_interpretation_service.py  # AI interpretation
│   │   ├── ai_providers/        # AI provider implementations
│   │   │   ├── base.py          # Base provider interface
│   │   │   ├── factory.py       # Provider factory
│   │   │   ├── anthropic_provider.py
│   │   │   ├── gemini_provider.py
│   │   │   ├── openai_provider.py
│   │   │   └── __init__.py
│   │   ├── karma_service.py     # Karma system
│   │   ├── reading_enhanced_service.py
│   │   ├── reading_service.py   # Reading logic
│   │   ├── social_service.py    # Social features
│   │   ├── user_service.py      # User management
│   │   ├── wasteland_card_service.py
│   │   └── __init__.py
│   │
│   ├── monitoring/              # Monitoring and metrics
│   │   └── performance.py
│   │
│   ├── config.py                # Application configuration
│   ├── main.py                  # FastAPI application entry
│   ├── main_simple.py           # Simplified main
│   └── __init__.py
│
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   │   ├── test_*.py
│   │   └── __init__.py
│   ├── integration/             # Integration tests
│   │   ├── test_*.py
│   │   └── __init__.py
│   ├── api/                     # API endpoint tests
│   │   ├── test_*_endpoints.py
│   │   └── __init__.py
│   ├── edge_cases/              # Edge case tests
│   │   └── __init__.py
│   ├── performance/             # Performance tests
│   │   ├── test_*_performance.py
│   │   └── __init__.py
│   ├── conftest.py              # Pytest configuration
│   ├── factories.py             # Test factories
│   └── __init__.py
│
├── .venv/                       # Virtual environment (uv)
├── pyproject.toml               # Python project config (uv)
├── uv.lock                      # Dependency lock file (uv)
├── README.md                    # Backend documentation
└── [utility scripts]            # Various dev/seed scripts
```

### Key Backend Patterns

#### Service Layer Pattern
```python
# Services contain business logic
services/
├── reading_service.py           # Reading CRUD and logic
├── ai_interpretation_service.py # AI interpretation coordination
├── karma_service.py             # Karma calculation
├── user_service.py              # User management
└── wasteland_card_service.py    # Card operations
```

#### AI Provider Factory Pattern
```python
# Multi-provider AI support
services/ai_providers/
├── base.py                      # Abstract base provider
├── factory.py                   # Provider selection logic
├── anthropic_provider.py        # Claude implementation
├── openai_provider.py           # GPT implementation
└── gemini_provider.py           # Gemini implementation
```

#### API Versioning Pattern
```python
# Version 1 API
api/v1/
├── api.py                       # V1 router aggregation
└── endpoints/                   # V1 endpoint implementations
    ├── readings.py
    ├── readings_stream.py       # Streaming endpoints
    └── voices.py
```

#### Model-Schema Separation
```python
# SQLAlchemy models (database)
models/
├── user.py
├── wasteland_card.py
└── reading_enhanced.py

# Pydantic schemas (validation & serialization)
schemas/
├── cards.py
├── readings.py
└── spreads.py
```

## Spec-Driven Development Structure (`.kiro/`)

```
.kiro/
├── steering/                    # Always-included project context
│   ├── product.md              # Product overview and goals
│   ├── tech.md                 # Technology stack
│   └── structure.md            # This file
│
└── specs/                      # Feature specifications
    └── [feature-name]/         # One folder per feature
        ├── requirements.md     # Requirements document
        ├── design.md           # Technical design
        └── tasks.md            # Implementation tasks
```

### Specification Workflow
1. **Requirements** (`requirements.md`): What needs to be built
2. **Design** (`design.md`): How it will be built
3. **Tasks** (`tasks.md`): Step-by-step implementation plan
4. **Implementation**: Follow tasks to build feature

## Documentation Structure (`docs/`)

```
docs/
├── 00-README.md                 # Documentation index
├── 01-product/                  # Product documentation
│   └── PRD.md                   # Product Requirements Document
├── 02-design/                   # Design documentation
│   └── design-system.md         # UI/UX design system
├── 03-technical/                # Technical documentation
│   ├── API.md                   # API documentation
│   ├── architecture.md          # System architecture
│   ├── development-roadmap.md   # Roadmap
│   ├── development-specifications.md
│   ├── fastapi-backend-development-plan.md
│   ├── hybrid-architecture.md
│   └── testing-strategy.md
├── 04-ux/                       # User experience
│   └── interaction-flows.md
├── 05-content/                  # Content strategy
│   └── content-strategy.md
├── 06-deployment/               # Deployment documentation
│   └── deployment.md
├── STREAMING_IMPLEMENTATION.md  # Streaming feature docs
└── STREAMING_QUICK_REFERENCE.md
```

## Testing Structure

### Frontend Tests (`tests/`, `src/*/__tests__/`)
```
tests/
├── e2e/                         # End-to-end tests (Playwright)
│   ├── 01-localization.spec.ts
│   ├── 02-navigation-functionality.spec.ts
│   ├── 03-auth-functionality.spec.ts
│   ├── 04-interactive-elements.spec.ts
│   ├── 05-responsive-design.spec.ts
│   ├── 06-performance-loading.spec.ts
│   ├── 07-user-experience.spec.ts
│   ├── background-*.spec.ts     # Background effect tests
│   ├── global-setup.ts
│   └── global-teardown.ts
│
├── accessibility/               # Accessibility tests (Playwright + axe)
│   ├── color-contrast.spec.ts
│   ├── wcag-aa-compliance.spec.ts
│   ├── color-blindness-simulation.spec.ts
│   ├── keyboard-navigation.spec.ts
│   ├── screen-reader-compatibility.spec.ts
│   ├── multi-environment-testing.spec.ts
│   ├── automated-reporting.spec.ts
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   └── README.md
│
└── mobile/                      # Mobile-specific tests
    └── MobileGestures.test.ts

src/components/*/__tests__/      # Component unit tests (Jest)
src/hooks/__tests__/             # Hook tests (Jest)
```

### Backend Tests (`backend/tests/`)
```
backend/tests/
├── unit/                        # Unit tests
│   ├── test_ai_interpretation.py
│   ├── test_karma_system.py
│   ├── test_security.py
│   ├── test_streaming.py
│   └── test_wasteland_cards.py
│
├── integration/                 # Integration tests
│   ├── test_auth_flow.py
│   ├── test_end_to_end_workflows.py
│   ├── test_holotape_archive.py
│   ├── test_personalization_engine.py
│   ├── test_reading_with_auth.py
│   ├── test_streaming_api.py
│   └── test_wasteland_divination.py
│
├── api/                         # API endpoint tests
│   ├── test_auth_endpoints.py
│   ├── test_cards_endpoints.py
│   ├── test_readings_endpoints.py
│   └── test_error_handling.py
│
├── performance/                 # Performance tests
│   ├── test_api_performance.py
│   ├── test_performance_benchmarks.py
│   └── test_reading_performance.py
│
├── edge_cases/                  # Edge case tests
│   ├── test_fallout_theme_integrity.py
│   └── test_phase4_edge_cases.py
│
├── conftest.py                  # Pytest fixtures
└── factories.py                 # Test data factories
```

## Import Organization

### Frontend Import Order
```typescript
// 1. React and Next.js imports
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { motion } from 'motion';
import { useForm } from 'react-hook-form';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { TarotCard } from '@/components/tarot/TarotCard';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';
import { useStreamingText } from '@/hooks/useStreamingText';

// 5. Utilities and types
import { cn } from '@/lib/utils';
import type { WastelandCard } from '@/types/database';
```

### Backend Import Order
```python
# 1. Standard library
import asyncio
from datetime import datetime
from typing import List, Optional

# 2. Third-party libraries
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# 3. Application imports
from app.core.dependencies import get_db
from app.models.user import User
from app.schemas.readings import ReadingResponse
from app.services.reading_service import ReadingService
```

## File Naming Conventions

### Frontend
- **Components**: PascalCase (`TarotCard.tsx`, `ReadingHistory.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useStreamingText.ts`)
- **Utilities**: camelCase (`api.ts`, `utils.ts`)
- **Types**: camelCase or PascalCase (`database.ts`, `WastelandCard.ts`)
- **Tests**: `*.test.tsx` or `*.spec.ts`

### Backend
- **Modules**: snake_case (`reading_service.py`, `wasteland_card.py`)
- **Classes**: PascalCase (`ReadingService`, `WastelandCard`)
- **Functions**: snake_case (`get_reading`, `create_user`)
- **Tests**: `test_*.py`

## Code Organization Principles

### 1. Domain-Driven Structure
Organize code by domain/feature rather than technical layer:
- ✅ `components/readings/`, `components/tarot/`, `components/auth/`
- ❌ `components/forms/`, `components/buttons/`, `components/inputs/`

### 2. Co-located Tests
Keep tests close to the code they test:
- ✅ `components/tarot/TarotCard.tsx` + `components/tarot/__tests__/TarotCard.test.tsx`
- ❌ Separate `test/` directory far from implementation

### 3. Clear Separation of Concerns
- **Components**: UI rendering only
- **Hooks**: Reusable stateful logic
- **Services**: Business logic and API calls
- **Stores**: Global state management
- **Utils**: Pure utility functions

### 4. Feature-First Development
When adding a new feature:
1. Create spec in `.kiro/specs/[feature-name]/`
2. Add models if needed (`backend/app/models/`)
3. Add schemas (`backend/app/schemas/`)
4. Add services (`backend/app/services/`)
5. Add API routes (`backend/app/api/`)
6. Add frontend components (`src/components/[domain]/`)
7. Add tests for all layers

### 5. Consistent Module Structure
Each module should follow predictable patterns:
```
[domain]/
├── Component.tsx           # Main component
├── Component.module.css    # Styles (if not using Tailwind)
├── types.ts                # Local types
├── utils.ts                # Local utilities
├── index.ts                # Public exports
└── __tests__/              # Tests
    └── Component.test.tsx
```

## Key Architectural Principles

### 1. Server Components by Default (Next.js)
- Use server components unless interactivity is needed
- Add `"use client"` only when necessary
- Fetch data in server components when possible

### 2. API Route Convention
```
GET    /api/v1/readings          # List readings
POST   /api/v1/readings          # Create reading
GET    /api/v1/readings/{id}     # Get reading
PUT    /api/v1/readings/{id}     # Update reading
DELETE /api/v1/readings/{id}     # Delete reading
```

### 3. Streaming Endpoints
```
GET /api/v1/readings/{id}/stream  # SSE stream for AI interpretation
```

### 4. Authentication Flow
- JWT tokens stored in httpOnly cookies
- Zustand store for auth state
- Supabase Auth as backend
- Protected routes check auth state

### 5. Error Handling
- **Frontend**: Error boundaries + global error store
- **Backend**: Custom exceptions + FastAPI exception handlers
- **API**: Consistent error response format

---

*Last Updated: 2025-10-01*
*Project Version: MVP in Active Development*
