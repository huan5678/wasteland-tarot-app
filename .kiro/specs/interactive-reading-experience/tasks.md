# Implementation Plan

## Task Format Template

Tasks are organized by domain with parallel execution opportunities identified where applicable. Each task includes requirement mappings and detailed implementation steps.

---

## Implementation Tasks

### Phase 1: Core Algorithms & Accessibility Hooks

- [ ] 1. (P) Implement Fisher-Yates shuffle algorithm hook
  - Create `useFisherYatesShuffle` hook with Durstenfeld optimization
  - Implement pure shuffle function (O(n) time, O(1) space)
  - Provide both `shuffle` (immutable) and `shuffleInPlace` (mutable) variants
  - Add input validation (non-empty array check)
  - Ensure mathematical correctness (1/n! probability for each permutation)
  - Write unit tests verifying shuffle properties (length preservation, element presence, distribution uniformity)
  - _Requirements: 1.3_

- [ ] 2. (P) Implement reduced motion detection hook
  - Create `usePrefersReducedMotion` hook with SSR safety
  - Set default value to `true` for SSR phase
  - Use `window.matchMedia('(prefers-reduced-motion: reduce)')` for client-side detection
  - Monitor media query changes with `change` event listener
  - Return `prefersReducedMotion` boolean and `isLoading` state
  - Handle browser compatibility (graceful degradation for missing API)
  - Write tests for SSR safety and dynamic updates
  - _Requirements: 8.8, 8.9_

### Phase 2: Interactive Card Drawing Experience

- [ ] 3. Build interactive card draw component
- [ ] 3.1 (P) Create base InteractiveCardDraw component structure
  - Define component props interface (spreadType, positionsMeta, callbacks)
  - Implement state management (drawingState, shuffledDeck, drawnCards, revealedIndices)
  - Integrate `useFisherYatesShuffle` for card shuffling
  - Integrate `usePrefersReducedMotion` for animation control
  - Add spread type validation
  - Implement prevention of animation overlap using `useRef`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.2 Create shuffle animation with Framer Motion
  - Configure LazyMotion with `domAnimation` features
  - Verify animation capabilities (transform, opacity, basic transitions)
  - Implement 1.5-2s shuffle animation using only `transform` and `opacity`
  - Add Pip-Boy style radiation visual effects
  - Integrate Geiger counter sound effect
  - Ensure 60 FPS target with performance monitoring
  - Implement automatic degradation to fade effect if FPS < 30
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 3.3 Implement card spread layout system
  - Create card layout calculation based on spread type (1/3/5/10 cards)
  - Position cards according to spread template
  - Implement card expansion animation after shuffle
  - Add hover effects with radiation glow (respecting reduced motion)
  - Support touch interactions for mobile devices
  - _Requirements: 1.6, 1.12_

- [ ] 3.4 Build card flip animation system
  - Implement flip animation using CSS `rotateY` transform
  - Add 0.5s flip duration with perspective effect
  - Display card back initially, front after flip
  - Play Geiger counter sound on flip
  - Disable other card clicks during flip animation
  - Track revealed cards state
  - Auto-advance to interpretation when all cards flipped
  - _Requirements: 1.7, 1.8, 1.9, 1.11_

- [ ] 3.5 (P) Add session recovery for incomplete readings
  - Store drawing state in sessionStorage
  - Detect incomplete readings on page load
  - Display "Continue incomplete reading" prompt
  - Restore shuffled deck and revealed cards state
  - Clear session data when reading completes
  - _Requirements: 1.10_

- [ ] 3.6* Test interactive card draw component
  - Write unit tests for state transitions
  - Test shuffle algorithm integration
  - Test animation trigger conditions
  - Test reduced motion mode behavior
  - Verify accessibility (keyboard navigation, screen reader)
  - Test mobile gesture support
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13_

### Phase 3: AI Interpretation Streaming Enhancement

- [ ] 4. Enhance AI interpretation streaming experience
- [ ] 4.1 (P) Optimize typewriter effect rendering
  - Implement 30-50 characters/second display speed
  - Add ±20% random variation to simulate human typing
  - Use batch rendering (10 chars per batch) if FPS < 30
  - Ensure first batch renders within 200ms of receiving data
  - Add pause, speed up (2x), and skip controls
  - _Requirements: 2.3, 2.12_

- [ ] 4.2 (P) Integrate character voice styling into interpretation
  - Map character voices (Mr. Handy, Brotherhood Scribe) to AI prompts
  - Apply voice-specific tone and vocabulary adjustments
  - Integrate Karma alignment (Very Good to Very Evil) into prompts
  - Integrate faction affinity (Brotherhood, NCR, Raiders, Vault-Tec) into prompts
  - _Requirements: 2.4, 2.5, 2.6_

- [ ] 4.3 Implement streaming controls UI
  - Add "Terminal loading" animation while waiting for AI
  - Display typewriter effect with streaming text
  - Add pause/resume button
  - Add 2x speed button
  - Add "Skip to full content" button
  - Show "Interpretation complete" notification when done
  - Enable "Save to Holotape Archive" button on completion
  - _Requirements: 2.1, 2.7, 2.10_

- [ ] 4.4 (P) Enhance Web Speech API integration
  - Implement voice narration for completed interpretations
  - Support play/pause/resume controls
  - Allow speed adjustment
  - Support segment re-reading
  - Handle browser compatibility (show warning for unsupported browsers)
  - _Requirements: 2.11_

- [ ] 4.5* Verify streaming error handling and recovery
  - Test SSE connection interruption scenarios
  - Verify Exponential Backoff retry mechanism (already implemented in `useStreamingText`)
  - Test maximum 5 retry attempts with appropriate delays
  - Verify friendly error messages ("Radiation interference, please try again")
  - Test retry button functionality
  - Verify timeout handling (>30 seconds)
  - _Requirements: 2.8, 2.9_

### Phase 4: Reading History with Virtual Scrolling

- [ ] 5. Build reading history dashboard (Holotape Archive)
- [ ] 5.1 (P) Install and configure TanStack Virtual
  - Add `@tanstack/react-virtual` dependency (~6kb)
  - Create basic virtualized list wrapper component
  - Configure `useVirtualizer` with overscan settings
  - Test with 100+ reading records
  - _Requirements: 3.7_

- [ ] 5.2 Implement variable height virtual scroll
  - Create `estimateSize` function based on card count
  - Calculate height: 60px (header) + cardCount × 40px + 40px (footer) + 20px (padding)
  - Set `overscan: 5` to reduce white screen during scroll
  - Implement graceful degradation if scroll jumping occurs
  - Test with 500+ records for performance validation
  - _Requirements: 3.7, 3.14_

- [ ] 5.3 Create reading list item component
  - Display reading date, spread type, character voice
  - Show question/theme if available
  - Display card thumbnails (horizontal row)
  - Show tags as chips
  - Show category badge
  - Add expand/collapse functionality
  - Implement skeleton loading state
  - _Requirements: 3.1, 3.2, 3.8_

- [ ] 5.4 Build reading detail view
  - Display full interpretation text
  - Show all drawn cards with positions
  - Display Karma and faction status at reading time
  - Show creation timestamp
  - Add favorite toggle
  - Integrate tag and category editors
  - Show reading statistics (if available)
  - _Requirements: 3.3_

- [ ] 5.5 Implement reading history API endpoints
  - Create GET `/api/v1/readings` with pagination support
  - Support query parameters (page, limit, search, tags, category_id, favorite_only, archived, sort_by, sort_order)
  - Implement search functionality (searches question and interpretation text)
  - Add filtering by tags (OR logic)
  - Add filtering by categories (OR logic)
  - Return total count and paginated results
  - Optimize database queries with proper indexes
  - _Requirements: 3.1, 3.4_

- [ ] 5.6* Test virtualized reading list
  - Test rendering performance with 500+ records
  - Verify scroll smoothness (>30 FPS target)
  - Test expand/collapse functionality
  - Test loading states (skeleton screen)
  - Test mobile card view layout
  - Verify accessibility (keyboard navigation, ARIA labels)
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.13_

### Phase 5: Search and Filter System

- [ ] 6. Build advanced search and filtering system
- [ ] 6.1 (P) Create search input with debounce
  - Implement search input component
  - Add 300ms debounce to prevent excessive queries
  - Search across question and interpretation text
  - Show search results count
  - Clear search button
  - _Requirements: 3.4_

- [ ] 6.2 (P) Implement filter chips UI
  - Create Chips/Pills component for active filters
  - Display selected tags as removable chips
  - Display selected categories as removable chips
  - Display date range as chip
  - Add "Clear all filters" button
  - Update chip display when filters change
  - _Requirements: 3.5_

- [ ] 6.3 Create filter panel with item counts
  - Build filter sidebar/panel component
  - Display available tags with counts (e.g., "Love (12)")
  - Display available categories with counts
  - Add date range picker
  - Add favorite-only toggle
  - Add archived-only toggle
  - Show "0 results" warning if filter combination yields no results
  - _Requirements: 3.5, 3.6_

- [ ] 6.4 (P) Implement filter state management
  - Create filter criteria interface (searchQuery, dateRange, tags, categories, favoriteOnly, archivedOnly, spreadTypes)
  - Integrate React Hook Form for filter form
  - Add Zod validation schema for date ranges
  - Implement filter change callback
  - Persist filter state in URL query parameters
  - _Requirements: 3.4, 3.5_

- [ ] 6.5* Test search and filter functionality
  - Test search debounce timing
  - Test filter combination logic
  - Test chip removal
  - Test "Clear all" functionality
  - Test item count accuracy
  - Test URL parameter persistence
  - _Requirements: 3.4, 3.5, 3.6_

### Phase 6: Tags and Categories System

- [ ] 7. Implement tags and categories management
- [ ] 7.1 (P) Create database schema for tags
  - Add `reading_tags` table with columns (id, reading_id, tag, created_at)
  - Create unique constraint on (reading_id, tag)
  - Add indexes on reading_id and tag columns
  - Create trigger function `check_tag_limit` to enforce 20 tags maximum
  - Add `category_id` column to `readings` table
  - Create `reading_categories` table (id, user_id, name, color, description, icon)
  - Run database migration
  - _Requirements: 4.1, 4.3_

- [ ] 7.2 (P) Build tag manager component
  - Create tag input with autocomplete suggestions
  - Display existing tags as chips
  - Implement add tag functionality
  - Implement remove tag functionality
  - Show warning when approaching 20 tag limit
  - Validate tag length (1-50 characters)
  - Prevent duplicate tags
  - _Requirements: 4.1, 4.6_

- [ ] 7.3 (P) Create category selector component
  - Build category dropdown with predefined categories (Love, Career, Health, Survival, Faction Relations)
  - Allow custom category creation
  - Display category badge with color
  - Show category statistics (total readings, average Karma impact)
  - _Requirements: 4.3, 4.4_

- [ ] 7.4 (P) Implement tag management utilities
  - Create tag merging functionality (merge multiple tags into one)
  - Create tag renaming functionality
  - Create bulk tag operations (delete, merge)
  - Add tag usage statistics query
  - _Requirements: 4.7_

- [ ] 7.5 Build tag and category API endpoints
  - Create PATCH `/api/v1/readings/{id}/tags` endpoint
  - Implement tag validation (length, count limit)
  - Create GET `/api/v1/readings/tags` endpoint (list all user tags with counts)
  - Create GET `/api/v1/readings/categories` endpoint (list categories)
  - Create POST `/api/v1/readings/categories` endpoint (create category)
  - Add error handling (400 for validation, 409 for conflicts)
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7.6* Test tags and categories system
  - Test tag CRUD operations
  - Test 20 tag limit enforcement
  - Test tag autocomplete
  - Test tag merging and renaming
  - Test category assignment
  - Test category statistics calculation
  - Verify database constraints
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

### Phase 7: Flow Integration and Navigation

- [ ] 8. Integrate reading flow and navigation
- [ ] 8.1 (P) Create reading flow navigation component
  - Build top navigation bar showing current stage (Select Spread → Drawing → Interpretation → Complete)
  - Highlight active stage
  - Support clicking previous stages (with confirmation if current incomplete)
  - Show progress indicator
  - _Requirements: 5.7_

- [ ] 8.2 Build reading completion quick actions
  - Create action button group at bottom of completed reading page
  - Add "Draw Again" button (navigates to spread selection, preserves voice and category settings)
  - Add "View History" button (navigates to Holotape Archive, scrolls to latest reading)
  - Add "Share Reading" button (opens share dialog)
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8.3 Implement history to new reading flow
  - Add "Start New Reading" button in Holotape Archive header
  - Preserve active filters in URL when navigating away
  - Restore filters when returning to history page
  - _Requirements: 5.4_

- [ ] 8.4 Add browser back button handling
  - Implement `useEffect` with `beforeunload` event listener
  - Show confirmation dialog: "Are you sure you want to leave? Incomplete reading will not be saved"
  - Allow cancel to prevent navigation
  - Clear confirmation after reading completes
  - _Requirements: 5.5_

- [ ] 8.5 (P) Implement reading generation resume
  - Store ongoing interpretation in sessionStorage
  - Detect incomplete interpretation on page load
  - Restore streaming position and continue from last received token
  - Show "Resuming interpretation..." notification
  - _Requirements: 5.6_

- [ ] 8.6* Test flow integration
  - Test navigation between all stages
  - Test quick actions functionality
  - Test setting preservation across navigation
  - Test back button confirmation
  - Test mobile swipe gestures (if implemented)
  - Verify smooth transitions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

### Phase 8: Personalization Engine

- [ ] 9. (P) Build personalization engine
  - Analyze user reading history (when count >= 10)
  - Identify preferred spread types (frequency analysis)
  - Identify common question categories (tag/category frequency)
  - Track Karma changes over 30 days
  - Calculate faction affinity trends
  - _Requirements: 6.1, 6.3_

- [ ] 10. (P) Create personalized recommendations UI
  - Display recommended spread type on spread selection page
  - Show explanation: "Based on your history, we recommend..."
  - Display Karma change notification if significant change detected (>20 points in 30 days)
  - Suggest character voice based on faction affinity (>80)
  - _Requirements: 6.2, 6.4_

- [ ] 11. (P) Build personalization dashboard
  - Create dashboard showing reading statistics
  - Display Karma trend chart (last 30/60/90 days)
  - Display faction affinity trend chart
  - Show most frequently drawn cards (top 10)
  - Show reading topic distribution (category breakdown)
  - Add privacy toggle for enabling/disabling personalization
  - _Requirements: 6.5, 6.6, 6.7_

- [ ] 12.* Test personalization engine
  - Test with various user history sizes
  - Verify recommendation accuracy
  - Test privacy controls
  - Test dashboard data visualization
  - Verify data remains private (no cross-user leakage)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

### Phase 9: Performance Optimization

- [ ] 13. Implement performance optimizations
- [ ] 13.1 (P) Optimize page load performance
  - Implement code splitting for reading pages
  - Lazy load card images with Next.js Image component
  - Preload critical fonts and assets
  - Optimize bundle size with LazyMotion (34kb → 6kb)
  - Target: FCP < 2s desktop, < 3s mobile
  - _Requirements: 7.1_

- [ ] 13.2 (P) Optimize animation performance
  - Monitor animation FPS using `requestAnimationFrame`
  - Implement automatic degradation when FPS < 30
  - Use `will-change` CSS hint sparingly
  - Avoid animating layout-triggering properties
  - Target: 60 FPS for shuffle animation
  - _Requirements: 7.2_

- [ ] 13.3 (P) Optimize API response times
  - Add database query indexes for common filters
  - Implement response caching where appropriate
  - Optimize AI streaming first token time
  - Target: API response < 5s, first token < 5s
  - _Requirements: 7.3_

- [ ] 13.4 (P) Optimize history list performance
  - Threshold: Use simple list if records < 100, virtual scroll if >= 100
  - Implement skeleton screen loading
  - Optimize item height estimation to reduce recalculation
  - Target: Load 500 records in < 5s
  - _Requirements: 7.4_

- [ ] 13.5 (P) Implement low-bandwidth optimizations
  - Detect slow network speed (< 1 Mbps)
  - Reduce animation quality automatically
  - Load lower resolution images
  - Prioritize functional content over visual effects
  - _Requirements: 7.5_

- [ ] 13.6 (P) Add resource management for inactive tabs
  - Detect tab visibility change using Page Visibility API
  - Pause animations when tab inactive
  - Pause audio playback when tab inactive
  - Resume when tab becomes active
  - _Requirements: 7.6_

- [ ] 13.7* Performance testing and validation
  - Run Lighthouse audits (target: >90 performance score)
  - Test FCP, LCP, TTI, CLS metrics
  - Test on low-end devices
  - Test on slow network (3G simulation)
  - Verify virtual scroll performance with 500+ records
  - Monitor animation FPS during complex interactions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

### Phase 10: Accessibility and Device Support

- [ ] 14. Implement comprehensive accessibility features
- [ ] 14.1 (P) Add screen reader support
  - Add ARIA labels to all interactive elements
  - Provide voice prompts for card draw actions
  - Add live regions for dynamic content updates
  - Test with NVDA/JAWS screen readers
  - _Requirements: 8.1_

- [ ] 14.2 (P) Implement keyboard navigation
  - Support Tab key for focus cycling
  - Support Enter/Space for activation
  - Support Escape for dialog dismissal
  - Add visible focus indicators
  - Test complete reading flow with keyboard only
  - _Requirements: 8.2_

- [ ] 14.3 (P) Optimize touch interactions
  - Ensure minimum 44×44px touch targets
  - Add touch feedback (visual response on tap)
  - Support swipe gestures for card browsing
  - Test on various mobile devices
  - _Requirements: 8.3_

- [ ] 14.4 (P) Implement responsive layouts
  - Create mobile card view for reading history
  - Optimize interpretation display for small screens
  - Adjust spread layout for portrait/landscape modes
  - Test on tablets and phones (various sizes)
  - _Requirements: 8.4, 8.13_

- [ ] 14.5 (P) Add high contrast and dark mode support
  - Ensure WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
  - Test all UI elements in dark mode
  - Test with high contrast mode enabled
  - Verify card visibility in all modes
  - _Requirements: 8.5_

- [ ] 14.6 (P) Enhance voice narration controls
  - Add playback speed control (0.5x to 2x)
  - Support pause/resume functionality
  - Allow re-reading of specific paragraphs
  - Show visual playback progress
  - _Requirements: 8.6_

- [ ] 14.7 (P) Implement reduced motion mode
  - Detect `prefers-reduced-motion: reduce` system setting
  - Disable all transform animations (position, scale, rotation)
  - Preserve opacity and backgroundColor transitions
  - Set animation durations to 0ms
  - Show "Reduce animations" toggle in settings
  - _Requirements: 8.7, 8.8, 8.9_

- [ ] 14.8 (P) Add orientation change handling
  - Detect orientation changes using media queries
  - Adjust layout automatically without reload
  - Reposition cards in spread layout
  - Test smooth transitions
  - _Requirements: 8.10_

- [ ] 14.9* Accessibility testing and validation
  - Run axe-core automated tests
  - Perform manual WCAG AA compliance checks
  - Test with multiple screen readers
  - Test keyboard-only navigation
  - Test touch interactions on mobile devices
  - Verify reduced motion behavior
  - Test responsive layouts on various devices
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_

### Phase 11: Error Handling and Resilience

- [ ] 15. Implement comprehensive error handling
- [ ] 15.1 (P) Add API timeout handling
  - Show timeout error after 30 seconds
  - Display message: "Radiation interference, connection interrupted. Please try again"
  - Provide retry button
  - Log timeout events for monitoring
  - _Requirements: 9.1_

- [ ] 15.2 (P) Implement offline detection
  - Detect network disconnection using Navigator.onLine
  - Show offline notification: "Offline detected, some features unavailable"
  - Queue failed requests for retry when online
  - Restore functionality when connection returns
  - _Requirements: 9.2_

- [ ] 15.3 (P) Add LocalStorage fallback for save failures
  - Catch 500 errors during reading save
  - Store reading data in LocalStorage
  - Display notification: "Saved locally, will sync when connection restored"
  - Auto-retry save when connection resumes
  - Clear LocalStorage after successful save
  - _Requirements: 9.3_

- [ ] 15.4 (P) Implement input validation with friendly errors
  - Validate search input (1-50 characters)
  - Show message for invalid input: "Please enter valid keywords (1-50 characters)"
  - Validate date ranges (start <= end)
  - Sanitize special characters to prevent injection
  - _Requirements: 9.4_

- [ ] 15.5 (P) Add browser compatibility warnings
  - Detect Web Speech API support
  - Show warning for unsupported features: "Your browser doesn't support voice narration. Recommend using Chrome or Edge"
  - Provide alternative options (text-only reading)
  - _Requirements: 9.5_

- [ ] 15.6 (P) Implement rate limiting protection
  - Detect rapid repeated actions (>10 clicks in 1 second)
  - Temporarily disable action
  - Show message: "Please wait before trying again"
  - Re-enable after cooldown period
  - _Requirements: 9.6_

- [ ] 15.7 (P) Add comprehensive error logging
  - Create error log structure (timestamp, userId, errorType, message, stackTrace, context)
  - Implement Error Boundary for React components
  - Capture unhandled promise rejections
  - Log errors to backend for monitoring
  - Include component name, action, and metadata
  - _Requirements: 9.7_

- [ ] 15.8 (P) Implement graceful error recovery for history page
  - Catch data loading failures
  - Show "Reload" button
  - Preserve current filters and sort settings
  - Display partial data if some records loaded successfully
  - _Requirements: 9.8_

- [ ] 15.9* Test error handling scenarios
  - Test timeout recovery
  - Test offline/online transitions
  - Test LocalStorage save and sync
  - Test input validation edge cases
  - Test error logging
  - Test graceful degradation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

### Phase 12: Social Sharing and Privacy

- [ ] 16. Build social sharing features
- [ ] 16.1 (P) Create share dialog component
  - Build modal with share options
  - Add social media buttons (Facebook, Twitter/X)
  - Add "Copy Link" button
  - Add "Export as Image" button
  - _Requirements: 10.1_

- [ ] 16.2 (P) Implement anonymous share link generation
  - Generate unique UUID for each shared reading
  - Create share URL format: `https://wasteland-tarot.com/share/{uuid}`
  - Strip personal information (user ID, Karma, faction data)
  - Store share record in database
  - _Requirements: 10.2, 10.3_

- [ ] 16.3 (P) Add password protection for shares
  - Add "Require Password" checkbox in share dialog
  - Prompt for 4-8 digit password
  - Hash password before storing
  - Require password input for visitors
  - Show error for incorrect password
  - _Requirements: 10.4_

- [ ] 16.4 (P) Implement image export functionality
  - Generate 1200×630px social media image
  - Include card images and interpretation summary
  - Apply Fallout aesthetic styling
  - Trigger browser download
  - _Requirements: 10.5_

- [ ] 16.5 (P) Build share link management UI
  - Create "Manage Shares" section in user settings
  - List all active share links
  - Show access count for each link
  - Add "Revoke" button for each link
  - Show confirmation before revoking
  - _Requirements: 10.6, 10.8_

- [ ] 16.6 (P) Implement share revocation
  - Mark share link as inactive in database
  - Show message to visitors: "This reading has been revoked by the owner"
  - Remove link from active shares list
  - _Requirements: 10.7_

- [ ] 16.7 (P) Add social media sharing functionality
  - Pre-fill share text: "I drew these cards on Wasteland Tarot!"
  - Allow user to customize share text
  - Open share dialog for selected platform
  - _Requirements: 10.9_

- [ ] 16.8 Create share API endpoints
  - Create POST `/api/v1/readings/{id}/share` endpoint (generate share link)
  - Support password protection option
  - Create GET `/api/v1/share/{uuid}` endpoint (view shared reading)
  - Create DELETE `/api/v1/share/{uuid}` endpoint (revoke share)
  - Create GET `/api/v1/readings/{id}/shares` endpoint (list user's shares)
  - Track access count for each share
  - _Requirements: 10.2, 10.6, 10.7, 10.8_

- [ ] 16.9* Test sharing functionality
  - Test share link generation
  - Test password protection
  - Test image export
  - Test share revocation
  - Test access tracking
  - Verify privacy (no PII in shared content)
  - Test social media integration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

### Phase 13: Non-Functional Requirements Implementation

- [ ] 17. (P) Implement security measures
  - Enforce HTTPS in production
  - Implement JWT token authentication with 30-minute expiration
  - Add automatic redirect to login on token expiration
  - Implement row-level security in Supabase
  - Add CORS configuration for allowed origins
  - Validate all user inputs with Zod schemas
  - Sanitize SQL queries through SQLAlchemy ORM
  - Remove PII from shared readings
  - _Requirements: NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4, NFR-3.5, NFR-3.6, NFR-3.7_

- [ ] 18. (P) Implement scalability measures
  - Design stateless API architecture for horizontal scaling
  - Implement connection pooling for database
  - Add caching layer for frequently accessed data
  - Configure Zeabur auto-scaling for frontend and backend
  - Optimize database queries with indexes
  - _Requirements: NFR-4.1, NFR-4.2, NFR-4.5_

- [ ] 19. (P) Implement maintainability features
  - Create JSON configuration for spread types (avoid hardcoding)
  - Implement Factory Pattern for AI providers
  - Add comprehensive logging for debugging
  - Document all API endpoints with OpenAPI
  - Add JSDoc/docstrings for complex functions
  - _Requirements: NFR-4.1, NFR-4.2, NFR-4.4_

- [ ] 20. (P) Verify browser compatibility
  - Test on Chrome (latest)
  - Test on Firefox (latest)
  - Test on Safari (latest)
  - Test on Edge (latest)
  - Show upgrade prompt for Chrome < 90
  - Show JavaScript required message if disabled
  - Test on iOS 15+ and Android 12+ mobile browsers
  - _Requirements: NFR-5.1, NFR-5.2, NFR-5.3, NFR-5.4_

- [ ] 21.* Test non-functional requirements
  - Verify performance metrics (FCP, TTI, API response time)
  - Test security measures (authentication, CORS, input validation)
  - Test scalability under load
  - Test browser compatibility across versions
  - Verify maintainability (code organization, documentation)
  - _Requirements: NFR-1.1, NFR-1.2, NFR-1.3, NFR-1.4, NFR-1.5, NFR-1.6, NFR-2.1, NFR-2.2, NFR-2.3, NFR-2.4, NFR-2.5, NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4, NFR-3.5, NFR-3.6, NFR-3.7, NFR-4.1, NFR-4.2, NFR-4.3, NFR-4.4, NFR-4.5, NFR-5.1, NFR-5.2, NFR-5.3, NFR-5.4_

### Phase 14: End-to-End Integration and Testing

- [ ] 22. Conduct comprehensive integration testing
- [ ] 22.1* Complete reading flow E2E test
  - Test: Select spread → Shuffle → Draw cards → Flip cards → View interpretation → Save reading
  - Verify state transitions at each step
  - Verify animations trigger correctly
  - Verify API calls at appropriate times
  - Test with reduced motion enabled
  - Test on mobile devices
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3_

- [ ] 22.2* History management E2E test
  - Test: View history → Search/filter → Expand reading → Edit tags → Delete reading
  - Verify virtual scroll performance
  - Verify filter combinations work correctly
  - Test tag and category operations
  - Test export and share functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3_

- [ ] 22.3* Personalization E2E test
  - Create 10+ readings with varied spreads and categories
  - Verify recommendations appear
  - Verify Karma change notifications
  - Verify dashboard statistics accuracy
  - Test privacy toggle functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 22.4* Error recovery E2E test
  - Simulate API timeout during interpretation
  - Simulate offline condition during save
  - Test LocalStorage recovery
  - Test retry mechanisms
  - Verify graceful degradation
  - _Requirements: 9.1, 9.2, 9.3, 9.7, 9.8_

- [ ] 22.5* Cross-browser compatibility test
  - Run all E2E tests on Chrome, Firefox, Safari, Edge
  - Verify consistent behavior across browsers
  - Test mobile browsers (iOS Safari, Chrome Mobile)
  - Document any browser-specific issues
  - _Requirements: NFR-5.1, NFR-5.2, NFR-5.3_

- [ ] 22.6* Performance validation under load
  - Test with 500+ reading history records
  - Measure FCP, LCP, TTI, CLS metrics
  - Test animation FPS during shuffle
  - Test AI streaming first token time
  - Verify all metrics meet targets
  - _Requirements: NFR-1.1, NFR-1.2, NFR-1.3, NFR-1.4, NFR-1.5, 7.1, 7.2, 7.3, 7.4_

---

## Requirements Coverage Summary

All requirements from requirements.md have been mapped to implementation tasks:

- **Requirement 1 (Interactive Card Draw)**: Tasks 1, 2, 3.1-3.6
- **Requirement 2 (AI Streaming)**: Tasks 4.1-4.5
- **Requirement 3 (Reading History)**: Tasks 5.1-5.6, 6.1-6.5
- **Requirement 4 (Tags & Categories)**: Tasks 7.1-7.6
- **Requirement 5 (Flow Integration)**: Tasks 8.1-8.6
- **Requirement 6 (Personalization)**: Tasks 9-12
- **Requirement 7 (Performance)**: Tasks 13.1-13.7
- **Requirement 8 (Accessibility)**: Tasks 14.1-14.9
- **Requirement 9 (Error Handling)**: Tasks 15.1-15.9
- **Requirement 10 (Social Sharing)**: Tasks 16.1-16.9
- **NFR-1 (Performance Metrics)**: Tasks 13.1-13.7, 22.6
- **NFR-2 (Usability)**: Covered throughout UI tasks
- **NFR-3 (Security)**: Task 17
- **NFR-4 (Maintainability)**: Tasks 18, 19
- **NFR-5 (Compatibility)**: Tasks 20, 22.5

**Total Tasks**: 22 major tasks, 88 sub-tasks (12 optional test tasks marked with `*`)

---

**Document Version**: 1.0
**Generated**: 2025-11-11
**Language**: zh-TW (Traditional Chinese)
**Status**: Ready for Implementation
