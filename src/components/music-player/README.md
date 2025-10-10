# Music Player Error Handling Implementation

## Overview

This document describes the error handling implementation for the Playlist Music Player feature, covering Tasks 29, 30, and 31 from Phase 7.

## Components

### 1. ErrorToast Component

**Location**: `/src/components/music-player/ErrorToast.tsx`

**Purpose**: Display user-friendly error messages with Pip-Boy styling

**Usage**:

```tsx
import { ErrorToast, useErrorToast } from '@/components/music-player/ErrorToast';

function MyComponent() {
  const { error, showError, dismissError, retryCallback } = useErrorToast();

  const handleOperation = async () => {
    try {
      await someRiskyOperation();
    } catch (err) {
      showError(err as Error, () => {
        // Retry callback
        handleOperation();
      });
    }
  };

  return (
    <>
      {/* Your component JSX */}
      <ErrorToast
        error={error}
        onRetry={retryCallback}
        onDismiss={dismissError}
        autoDismissMs={5000}
      />
    </>
  );
}
```

**Features**:
- Auto-dismiss after 5 seconds (configurable)
- Retry button for recoverable errors
- Pip-Boy green styling
- CRT scanline effects
- Progress bar showing auto-dismiss countdown

### 2. ErrorHandler (Enhanced)

**Location**: `/src/lib/audio/errorHandler.ts`

**Purpose**: Centralized error handling with retry mechanism and error rate monitoring

**Task 29 Features**:
- Retry mechanism (up to 3 times, exponential backoff)
- Error rate monitoring (30% threshold)
- Automatic music player disabling when error rate exceeds threshold

**Usage**:

```typescript
import { getErrorHandler, MusicPlayerErrorType, createMusicPlayerError } from '@/lib/audio/errorHandler';

const errorHandler = getErrorHandler();

// Retry operation with exponential backoff
try {
  await errorHandler.retry(
    async () => {
      // Your risky operation
      await loadMusicMode('synthwave');
    },
    {
      maxRetries: 3,
      backoffMs: 200,
      onRetry: (attempt, error) => {
        console.log(`Retrying (${attempt}/3)...`);
      },
    }
  );
} catch (error) {
  // Handle final failure
  const musicError = createMusicPlayerError(
    MusicPlayerErrorType.MODE_LOAD_FAILED,
    'Failed to load music mode',
    true,
    error as Error
  );
  errorHandler.handleError(musicError);
}

// Check error metrics
const metrics = ErrorHandler.getMetrics();
if (metrics.isAboveThreshold) {
  console.warn('Error rate exceeds 30%, disabling music player');
}
```

### 3. playlistStore (Enhanced)

**Location**: `/src/stores/playlistStore.ts`

**Task 30: localStorage Quota Exceeded Handling**

**Features**:
- Automatic cleanup of oldest playlists when quota exceeded
- Retry mechanism (up to 3 attempts)
- User notification via lastError state

**Implementation**:
```typescript
// In createPlaylist action
createPlaylist: (name: string, modes: MusicMode[] = []) => {
  // Automatically handles QuotaExceededError
  // 1. Removes oldest playlist
  // 2. Retries operation
  // 3. Repeats up to 3 times
  // 4. Throws MusicPlayerError if all retries fail
}
```

**Task 31: Playlist Corruption Recovery**

**Features**:
- Automatic validation on localStorage rehydration
- Filters out corrupted playlists
- Logs errors to ErrorHandler
- Sets lastError state for UI notification

**Implementation**:
```typescript
// In persist middleware's onRehydrateStorage
onRehydrateStorage: () => (state) => {
  // 1. Validates all playlists
  // 2. Filters out invalid entries
  // 3. Logs removed count
  // 4. Sets lastError if corruption detected
  // 5. Clears all playlists if fatal error
}
```

**Validation Rules**:
- Playlist ID must be string
- Playlist name: 1-50 characters
- Modes array: 1-20 items
- All modes must be valid MusicMode values
- createdAt/updatedAt must be valid dates

## Error Types

```typescript
enum MusicPlayerErrorType {
  ENGINE_INIT_FAILED       // Task 29: Music engine initialization failed
  MODE_LOAD_FAILED         // Task 29: Music mode loading failed
  AUDIO_CONTEXT_SUSPENDED  // Browser suspended audio context
  STORAGE_WRITE_FAILED     // Task 30: localStorage quota exceeded
  PLAYLIST_CORRUPTED       // Task 31: Playlist data corrupted
}
```

## Error Flow

### Task 29: Audio Loading Failure

```
User clicks play
  → musicPlayerStore.playMode()
    → ErrorHandler.retry() (max 3 times, exponential backoff)
      → Success: Update state
      → Failure: Create MusicPlayerError
        → ErrorHandler.handleError()
        → Set lastError in store
        → UI shows ErrorToast with retry button
```

### Task 30: localStorage Quota Exceeded

```
User creates playlist
  → playlistStore.createPlaylist()
    → Attempt to write to localStorage
      → QuotaExceededError thrown
        → Remove oldest playlist (sorted by createdAt)
        → Retry createPlaylist (recursive, up to 3 times)
          → Success: Playlist created
          → Failure: Throw STORAGE_WRITE_FAILED error
            → UI shows ErrorToast
```

### Task 31: Playlist Corruption Recovery

```
Page loads
  → Zustand persist middleware rehydrates state
    → onRehydrateStorage hook
      → validatePlaylists() checks all playlists
        → For each playlist:
          - Validate id, name, modes
          - Validate modes array (1-20, valid MusicMode values)
          - Parse dates (handle both string and Date objects)
          - Filter out invalid playlists
        → If corruption detected:
          - Log warning with removed count
          - Create PLAYLIST_CORRUPTED error
          - Set lastError in store
          - UI can show ErrorToast on mount
        → If fatal error:
          - Clear all playlists
          - Set PLAYLIST_CORRUPTED error (non-recoverable)
```

## UI Integration Example

```tsx
'use client';

import { useEffect } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { ErrorToast, useErrorToast } from '@/components/music-player/ErrorToast';
import { ErrorHandler } from '@/lib/audio/errorHandler';

export function MusicPlayerContainer() {
  const { lastError: musicPlayerError, clearError: clearMusicError } = useMusicPlayerStore();
  const { lastError: playlistError, clearError: clearPlaylistError } = usePlaylistStore();

  const { error, showError, dismissError, retryCallback } = useErrorToast();

  // Show error toast when store errors occur
  useEffect(() => {
    if (musicPlayerError) {
      showError(musicPlayerError, () => {
        // Retry callback (optional)
        clearMusicError();
      });
    }
  }, [musicPlayerError, showError, clearMusicError]);

  useEffect(() => {
    if (playlistError) {
      showError(playlistError);
    }
  }, [playlistError, showError]);

  // Monitor error rate
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = ErrorHandler.getMetrics();
      if (metrics.isAboveThreshold) {
        console.warn('Error rate threshold exceeded, music player may be disabled');
        // Optionally disable music player UI
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Music player UI */}
      <ErrorToast
        error={error}
        onRetry={retryCallback}
        onDismiss={dismissError}
        autoDismissMs={5000}
      />
    </>
  );
}
```

## Testing

### Unit Tests

**ErrorHandler Tests**: `/src/lib/audio/__tests__/errorHandler.integration.test.ts`
- Retry mechanism (3 attempts, exponential backoff)
- Error rate calculation
- Error tracking
- Singleton pattern

**playlistStore Tests**: `/src/stores/__tests__/playlistStore.errors.test.ts`
- localStorage quota exceeded handling
- Playlist corruption recovery
- Validation logic
- Error recovery flow

### Running Tests

```bash
# Run all error handling tests
bun test errorHandler.integration.test.ts
bun test playlistStore.errors.test.ts

# Run with coverage
bun test --coverage
```

## Configuration

### Error Thresholds

```typescript
// ErrorHandler (src/lib/audio/errorHandler.ts)
const MAX_RETRIES = 3;                    // Max retry attempts
const ERROR_RATE_THRESHOLD = 0.3;         // 30% error rate threshold
const ERROR_HISTORY_WINDOW = 60000;       // 1 minute window for error tracking

// playlistStore (src/stores/playlistStore.ts)
const MAX_RETRY_ATTEMPTS = 3;             // Max retry attempts for localStorage
```

### Validation Constraints

```typescript
// Playlist name: 1-50 characters
// Modes array: 1-20 items
// Valid MusicMode values: 'synthwave' | 'divination' | 'lofi' | 'ambient'
```

## Troubleshooting

### Error Rate Exceeds 30%

**Symptoms**: Music player stops working after repeated errors

**Solutions**:
1. Reset error metrics: `ErrorHandler.resetMetrics()`
2. Check browser console for specific error types
3. Verify ProceduralMusicEngine initialization
4. Check AudioContext state (may be suspended by browser)

### localStorage Quota Exceeded

**Symptoms**: Cannot create new playlists, error toast shows quota exceeded

**Solutions**:
1. Manually delete old playlists via UI
2. Clear browser data for this site
3. Check localStorage size: `localStorage.getItem('wasteland-tarot-playlists').length`
4. Reduce number of playlists (automatic cleanup will trigger)

### Playlist Data Corrupted

**Symptoms**: Playlists disappear after page reload, error toast shows corruption

**Solutions**:
1. Check browser console for validation errors
2. Inspect localStorage: `localStorage.getItem('wasteland-tarot-playlists')`
3. Clear corrupted data: `localStorage.removeItem('wasteland-tarot-playlists')`
4. Playlists will be reset to empty (automatic recovery)

## Future Improvements

1. **Manual Storage Cleanup UI**: Add settings page with storage usage display and manual cleanup button
2. **Error Analytics**: Track error types and frequencies for debugging
3. **Offline Support**: Handle offline scenarios gracefully
4. **Export/Import**: Allow users to backup/restore playlists
5. **Cloud Sync**: Sync playlists across devices (requires backend)

## Related Files

- `/src/lib/audio/errorHandler.ts` - ErrorHandler implementation
- `/src/stores/musicPlayerStore.ts` - Music player store with error handling
- `/src/stores/playlistStore.ts` - Playlist store with quota/corruption handling
- `/src/components/music-player/ErrorToast.tsx` - Error display component
- `/src/lib/audio/playlistTypes.ts` - Type definitions and validation

## Requirements Mapping

- **Task 29**: Requirements 10.1, 10.2, 10.3 (Error handling, retry mechanism, error rate monitoring)
- **Task 30**: Requirements 10.1, 10.3 (localStorage error handling)
- **Task 31**: Requirements 10.1, 10.4 (Playlist corruption recovery)
