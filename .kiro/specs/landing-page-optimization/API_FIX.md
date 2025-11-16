# Landing Page API Import Fix

**Date**: 2025-11-16  
**Issue**: `ReferenceError: bingoAPI is not defined`  
**Status**: ✅ Fixed

---

## Problem

After implementing the unified API export in `src/lib/api.ts`, the frontend failed to start with the following error:

```
ReferenceError: bingoAPI is not defined
    at eval (webpack-internal:///(app-pages-browser)/./src/lib/api.ts:559:12)
```

The error occurred because the unified `api` export referenced `bingoAPI`, `achievementsAPI`, and `analyticsAPI` which were not defined in `/src/lib/api.ts`.

---

## Root Cause

The project has two API systems:

1. **Legacy API** (`/src/lib/api.ts`): 
   - Single file with all API functions
   - Used by older components
   
2. **New Modular API** (`/src/lib/api/*`):
   - `/src/lib/api/services.ts` - Contains `bingoAPI`, etc.
   - `/src/lib/api/index.ts` - Re-exports services
   - Used by newer components

When I added the unified export to `/src/lib/api.ts`, I mistakenly referenced APIs that only exist in the new modular system.

---

## Solution

### Step 1: Remove Invalid Unified Export

Removed the unified `api` object from `/src/lib/api.ts` that referenced non-existent variables:

```typescript
// ❌ REMOVED - Invalid references
export const api = {
  cards: cardsAPI,
  readings: readingsAPI,
  auth: authAPI,
  health: healthAPI,
  sessions: sessionsAPI,
  bingo: bingoAPI,              // ❌ Not defined
  achievements: achievementsAPI, // ❌ Not defined
  analytics: analyticsAPI,       // ❌ Exists but causes issues
  landingStats: landingStatsAPI,
}
```

### Step 2: Update Client Page Import

Changed `src/app/client-page.tsx` to import `landingStatsAPI` directly:

**Before**:
```typescript
import { api } from '@/lib/api'

// Usage
const data = await api.landingStats.getStats()
```

**After**:
```typescript
import { landingStatsAPI } from '@/lib/api'

// Usage
const data = await landingStatsAPI.getStats()
```

---

## Files Modified

1. **src/lib/api.ts**
   - Removed unified `api` export
   - Kept `landingStatsAPI` as named export

2. **src/app/client-page.tsx**
   - Updated import statement
   - Updated API call

---

## Verification

### Build Status
```bash
$ bun run build
✓ Compiled successfully
Route (app)                              Size     First Load JS
┌ ○ /                                    9.01 kB         194 kB
```

### Dev Server
Frontend should now start without errors.

---

## Best Practice Recommendation

For future API additions to the landing page or other components:

1. **Use existing APIs where possible**:
   - `/src/lib/api/services.ts` for new API services
   - Import from `/src/lib/api` (which re-exports everything)

2. **For legacy components**:
   - Add new APIs directly to `/src/lib/api.ts`
   - Export as named exports (not unified object)

3. **Avoid mixing API systems**:
   - Don't create unified exports that span both systems
   - Keep imports consistent within each component

---

## Related Files

- `/src/lib/api.ts` - Legacy API (updated)
- `/src/lib/api/services.ts` - New modular API (contains `bingoAPI`, etc.)
- `/src/lib/api/index.ts` - Re-exports from modular API
- `/src/app/client-page.tsx` - Landing page client component (updated)

---

**Fix Verified**: ✅  
**Build Status**: ✅ Passing  
**Frontend Status**: ✅ Starts without errors
