---
title: Project Structure
description: "File organization, naming conventions, and architectural patterns for the Wasteland Tarot project."
inclusion: always
---

# Wasteland Tarot - Project Structure

## Root Directory Organization

```
wasteland-tarot/
├── .ai-rules/          # AI agent steering files
├── backend/            # FastAPI backend application
├── docs/              # Project documentation
├── src/               # Next.js frontend source
├── cypress/           # E2E test suites
├── tests/             # Additional test files
├── specs/             # Feature specifications and roadmaps
└── scripts/           # Build and automation scripts
```

## Frontend Structure (`/src/`)

### App Router Architecture (`/src/app/`)
```
src/app/
├── globals.css                    # Global styles and CSS variables
├── layout.tsx                     # Root layout with providers
├── page.tsx                       # Homepage component
├── auth/
│   ├── login/page.tsx            # Login page
│   └── register/page.tsx         # Registration page
├── dashboard/page.tsx            # User dashboard
├── profile/page.tsx              # User profile management
├── cards/page.tsx                # Card collection browser
└── readings/
    ├── page.tsx                  # Reading history
    └── new/page.tsx              # New reading interface
```

### Component Architecture (`/src/components/`)
```
src/components/
├── ui/                           # Base UI components
│   ├── button.tsx               # Reusable button component
│   ├── card.tsx                 # Card container component
│   ├── input.tsx                # Form input component
│   └── label.tsx                # Form label component
├── auth/
│   └── LoginForm.tsx            # Authentication form logic
└── layout/
    ├── Header.tsx               # Navigation header
    ├── Footer.tsx               # Site footer
    ├── DitherBackground.tsx     # Wasteland visual effects
    ├── DynamicBackground.tsx    # Animated background system
    └── WastelandBackground.tsx  # Fallout-themed background
```

### Utilities & Configuration (`/src/lib/`)
```
src/lib/
└── api.ts                       # Centralized API client
```

## Backend Structure (`/backend/`)

### FastAPI Application
```
backend/
├── main.py                      # FastAPI application entry point
├── models.py                    # SQLAlchemy database models
├── auth.py                      # Authentication utilities
├── seed_cards.py               # Database seeding script
└── wasteland_tarot.db          # SQLite database file
```

## Documentation Structure (`/docs/`)

### Project Documentation
```
docs/
├── project-overview.md          # High-level project description
├── api-spec.md                 # API endpoint documentation
├── development-guide.md        # Development setup and workflow
└── FEATURES.md                 # Feature implementation status
```

## Specifications Structure (`/specs/`)

### Feature Specifications
```
specs/
└── wasteland-tarot-roadmap/
    ├── requirements.md          # User stories and requirements
    ├── design.md               # Technical design document
    └── tasks.md                # Detailed task breakdown
```

## Testing Structure

### Cypress E2E Tests (`/cypress/`)
```
cypress/
├── cypress.config.ts           # Cypress configuration
└── e2e/
    └── wasteland-tarot-core-flow.cy.ts  # Core user flow tests
```

### Additional Testing (`/tests/`)
```
tests/                          # Playwright and accessibility tests
├── accessibility/              # WCAG compliance tests
└── visual/                     # Visual regression tests
```

## Configuration Files

### Package Management
- `package.json` - Node.js dependencies and scripts
- `bun.lock` - Bun lockfile for reproducible builds

### Framework Configuration
- `next.config.ts` - Next.js build and runtime configuration
- `tailwind.config.ts` - Tailwind CSS customization
- `tsconfig.json` - TypeScript compiler configuration

### Testing Configuration
- `cypress.config.ts` - Cypress E2E test configuration
- `playwright.config.ts` - Playwright browser test configuration

## Naming Conventions

### File Naming
- **Pages**: `page.tsx` (App Router convention)
- **Components**: PascalCase (e.g., `LoginForm.tsx`)
- **Utilities**: camelCase (e.g., `api.ts`)
- **Styles**: kebab-case (e.g., `globals.css`)

### Component Naming
- **React Components**: PascalCase with descriptive names
- **Props Interfaces**: `ComponentNameProps`
- **Type Definitions**: PascalCase (e.g., `User`, `TarotCard`)

### API Conventions
- **Endpoints**: RESTful patterns (`/api/users`, `/api/cards`)
- **HTTP Methods**: GET, POST, PUT, DELETE following REST principles
- **Response Format**: Consistent JSON structure

## Import/Export Patterns

### Component Exports
```typescript
// Default exports for page components
export default function LoginPage() { ... }

// Named exports for utility components
export const Button = ({ ... }) => { ... }
```

### API Client Patterns
```typescript
// Centralized API functions
export const api = {
  auth: { login, register, logout },
  cards: { getAll, getById },
  readings: { create, getHistory }
}
```

## Asset Organization

### Public Assets (`/public/`)
- `logo.svg` - Application logo
- Static images and icons
- Favicon and PWA manifest files

### Styling Architecture
- **Global Styles**: `src/app/globals.css`
- **Component Styles**: Tailwind CSS classes
- **Theme Variables**: CSS custom properties for consistency

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `dev/feature-name` - Feature development branches
- PR-based workflow with code review

### Code Organization Principles
1. **Separation of Concerns**: Clear boundaries between UI, logic, and data
2. **Component Composition**: Reusable, composable component architecture
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Performance**: Lazy loading and code splitting patterns
5. **Maintainability**: Clear naming and documentation standards

## Future Expansion Guidelines

### Adding New Features
1. **Pages**: Add to `/src/app/` following App Router patterns
2. **Components**: Create in appropriate `/src/components/` subdirectory
3. **API Integration**: Extend `/src/lib/api.ts` with new endpoints
4. **Tests**: Add corresponding Cypress tests for new user flows

### Scaling Considerations
- **State Management**: Zustand integrated for global state management
- **Database**: Supabase PostgreSQL with pg_cron for scheduled tasks
- **Deployment**: Zeabur platform for unified frontend/backend deployment
- **Monitoring**: Zeabur Analytics + Sentry for comprehensive tracking