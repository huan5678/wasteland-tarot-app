# Wasteland Tarot - Project Context & Instructions

This file serves as the primary context and instruction guide for AI agents working on the Wasteland Tarot project.

## 1. Project Overview

**Name:** Wasteland Tarot
**Description:** A post-apocalyptic themed tarot card reading application inspired by the Fallout universe. It reimagines traditional tarot cards with Fallout lore and imagery, providing an immersive digital fortune-telling experience.
**Target Audience:** Fallout fans, tarot enthusiasts, and gamers seeking atmospheric web experiences.

## 2. Technical Stack

### Frontend (Root Directory)
*   **Framework:** Next.js 15.1.7 (App Router)
*   **Language:** TypeScript 5+
*   **Styling:** Tailwind CSS v4
*   **State Management:** Zustand
*   **Animation:** Framer Motion (`motion`), `tw-animate-css`
*   **Form Handling:** React Hook Form + Zod
*   **Package Manager:** Bun (preferred) or npm
*   **Icons:** Remixicon
*   **3D/Graphics:** Three.js (via `@react-three/fiber` implied or direct usage)

### Backend (`/backend` directory)
*   **Framework:** FastAPI (Python)
*   **Database:** PostgreSQL (via Supabase), SQLite (local dev)
*   **ORM:** SQLAlchemy
*   **Auth:** JWT

### Infrastructure & Tools
*   **Database & Auth:** Supabase
*   **Deployment:** Zeabur (Docker-based)
*   **Testing:**
    *   **Unit:** Vitest + React Testing Library
    *   **E2E:** Playwright
    *   **Accessibility:** axe-core
*   **Linting/Formatting:** ESLint, Prettier

## 3. Development Workflow

### Key Commands (Run from Root)
*   **Install Dependencies:** `bun install`
*   **Start Dev Server:** `bun dev` (starts Next.js on localhost:3000)
*   **HTTPS Dev Server:** `bun run dev:https` (uses `server.mjs`)
*   **Build Production:** `bun run build`
*   **Start Production:** `bun start`
*   **Run Unit Tests:** `bun test` (Vitest)
*   **Run E2E Tests:** `bun run test:playwright`
*   **Check Types:** `tsc --noEmit` (implied, or via build)
*   **Lint:** `bun run lint`

### Directory Structure
```
/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── cards/              # Card browsing & details
│   │   ├── auth/               # Login/Register pages
│   │   └── dashboard/          # User dashboard
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI atoms (buttons, inputs)
│   │   ├── cards/              # Card-specific components
│   │   └── layout/             # Layout components (Header, Footer)
│   ├── lib/                    # Utilities, API clients, helpers
│   ├── stores/                 # Zustand state stores
│   └── types/                  # TypeScript type definitions
├── backend/                    # Python FastAPI backend
├── public/                     # Static assets (images, fonts)
├── tests/                      # Test files (E2E, visual, accessibility)
├── .ai-rules/                  # AI behavior guidelines (Product, Tech, Structure)
└── supabase/                   # Supabase configuration & SQL
```

## 4. Coding Conventions

### General
*   **Language:** strict TypeScript. No `any` types unless absolutely necessary.
*   **Style:** Functional components with Hooks.
*   **Imports:** Use absolute imports (alias `@/` configured in `tsconfig.json` usually points to `./src`).

### CSS & Styling
*   **Tailwind:** Use Tailwind utility classes for 99% of styling.
*   **Custom CSS:** Put global overrides in `src/app/globals.css`.
*   **Theming:** Adhere to the "Pip-Boy" green/amber aesthetic and "Wasteland" gritty texture.
*   **Responsiveness:** Mobile-first approach. Ensure layouts work on 375px+ widths.

### State Management
*   Use **Zustand** for global client state (user session, preferences).
*   Use **React Query** (if available) or `useEffect`/`fetch` pattern in `src/lib/api.ts` for server state.
*   Keep state logic separate from UI components where possible.

### Testing
*   **Unit Tests:** Co-located with components or in `__tests__` folders. Focus on logic and interactions.
*   **E2E Tests:** Located in `tests/e2e` or `playwright/`. Cover critical user flows (Login -> Draw Card -> Read Result).
*   **Visual Tests:** Ensure the specific "dithered" and "CRT" effects render correctly.

## 5. Key Features & Implementation Details

*   **Card System:** 
    *   Suits: Major Arcana, Nuka-Cola (Cups), Combat Weapons (Swords), Bottle Caps (Pentacles), Radiation Rods (Wands).
    *   Images: Handled via Next.js `Image` component with optimized formats.
*   **Readings:**
    *   Users can perform spreads (e.g., Celtic Cross, 3-Card).
    *   Results are saved to Supabase/PostgreSQL.
*   **Accessibility:**
    *   Strict WCAG 2.1 AA compliance.
    *   Semantic HTML, ARIA labels, keyboard navigation.

## 6. Deployment (Zeabur)

*   **Config:** `zeabur.yaml` and `docker-compose.yml` govern deployment.
*   **Process:** Push to main branch triggers build.
*   **Environment Variables:** Managed in Zeabur dashboard, mirrored in `.env.local` for local dev.

## 7. AI Agent Behavior Guidelines

*   **Context First:** Always read `.ai-rules/product.md` and `.ai-rules/tech.md` before making architectural decisions.
*   **Safety:** Never commit secrets. Use `dither-background-test.png` or similar placeholders for visual assets if needed.
*   **Consistency:** maintain the "Fallout" tone in UI copy (e.g., "Initiating protocols...", "Radiation levels stable").
