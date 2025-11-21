# Wasteland Tarot - Professional Code Review & Architectural Analysis

**Date:** 2025-11-21
**Reviewer:** Gemini CLI Agent

## Executive Summary

The codebase represents a modern, high-quality Next.js application. It demonstrates a strong command of the React ecosystem (App Router, Zustand, Radix UI, Tailwind). The "Wasteland/Fallout" theme is integrated deeply and consistently, not just visually but also in the code structure (naming conventions, component design).

However, like many evolving projects, it shows signs of architectural transitions, particularly in the API communication layer. Addressing these now will prevent technical debt from accumulating.

## 1. Architectural Highlights (Strengths)

### 1.1 Component Design (`SuitCard.tsx`)
The `src/components/cards/SuitCard.tsx` file is an exemplary component that should serve as a template for the rest of the project.
*   **Separation of Concerns:** Logic, UI, and Metadata are cleanly separated.
*   **Accessibility (a11y):** It goes beyond basics with proper ARIA labels, keyboard event handling (`onKeyDown`), and decorative icon handling.
*   **Responsiveness:** Uses standard Tailwind breakpoints effectively.
*   **Type Safety:** Strong typing with JSDoc comments explaining *why*, not just *what*.

### 1.2 State Management
The shift to **Zustand** (e.g., `src/lib/authStore.ts`) is a positive architectural choice, moving away from complex React Context providers for global state. This simplifies the component tree and improves render performance.

### 1.3 File Structure
The project follows a clear feature-based structure in `src/components` (e.g., `cards/`, `readings/`), which scales better than grouping by file type.

## 2. Areas for Optimization (Code Smells & Refactoring)

### 2.1 Redundant API Layers
**Severity:** High
**Location:** `src/lib/api.ts` vs `src/lib/apiClient.ts`

*   **Issue:** There are two distinct ways to interact with the backend.
    *   `api.ts`: Contains specific business logic (`cardsAPI`, `readingsAPI`) mixed with low-level fetch wrappers and token mutex logic.
    *   `apiClient.ts`: A cleaner, generic, class-based client that offers a better developer experience but seems underutilized.
*   **Recommendation:** Consolidate into a Service Repository pattern.
    *   Keep `apiClient.ts` as the low-level HTTP transport (handling Auth headers, generic errors).
    *   Refactor `api.ts` into domain-specific services (e.g., `services/CardService.ts`, `services/ReadingService.ts`) that import and use the `api` instance from `apiClient.ts`.
    *   Move the robust `refreshToken` mutex logic from `api.ts` into `apiClient.ts` to ensure it benefits all requests.

### 2.2 Legacy/Duplicate Files
**Severity:** Low (Cleanup in progress)
**Location:** Root and `lib/` folders
*   **Issue:** Presence of `*.backup`, `*.deprecated`, and cleanup scripts (`cleanup_dupes.py`) suggests a recent large refactor.
*   **Action Taken:** Removed `sessionManager.ts.deprecated` and `readingsStore.ts.backup`.
*   **Recommendation:** Continue to aggressively prune unused files. `api.ts` should be the next major cleanup target after refactoring.

### 2.3 Type Definitions
**Severity:** Medium
*   **Issue:** `src/lib/api.ts` defines types (like `User`, `TarotCard`) internally.
*   **Recommendation:** Centralize all shared domain types in `src/types/` (e.g., `src/types/user.ts`, `src/types/tarot.ts`) to prevent circular dependencies and ensure consistency across frontend and backend interfaces.

## 3. "Clean Code" Checklist for Future Development

When creating new features, developers should adhere to the **SuitCard Standard**:
- [ ] **Strict Typing:** No `any`. Define interfaces in `src/types`.
- [ ] **Accessibility First:** Interactive elements must have `aria-label` and keyboard support.
- [ ] **Mobile First:** Define base styles for mobile, then use `md:` and `lg:` for expansion.
- [ ] **Co-location:** Keep related assets (sub-components, specific constants) close to the main component if they aren't shared.
- [ ] **Performance:** Use `next/image` and dynamic imports (`lazyComponents.tsx`) for heavy assets.

---
*End of Report*
