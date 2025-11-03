# Requirements Document

## Introduction

This specification addresses critical authentication failures in the Dashboard page's gamification components. When authenticated users access the Dashboard, the Karma, Tasks, and Achievement stores fail to retrieve or transmit Supabase authentication tokens, resulting in API request failures. This bug blocks users from accessing their gamification data (karma summary/logs, daily/weekly tasks, and achievement progress) despite successful login.

The root cause stems from improper authentication token retrieval and transmission in the `makeAuthenticatedRequest` utility function, affecting three Zustand stores: `karmaStore.ts`, `tasksStore.ts`, and `achievementStore.ts`.

## Requirements

### Requirement 1: Authentication Token Retrieval
**Objective:** As an authenticated user, I want the Dashboard gamification stores to correctly retrieve my Supabase access token, so that API requests include valid authentication credentials.

#### Acceptance Criteria
1. WHEN Dashboard page loads AND user is authenticated THEN Authentication Module SHALL retrieve current Supabase session access token
2. WHERE user session exists THE Authentication Module SHALL extract `access_token` from Supabase session object
3. IF Supabase session is null or undefined THEN Authentication Module SHALL reject with authentication error
4. WHEN token retrieval succeeds THEN Authentication Module SHALL pass token to authenticated request handler

### Requirement 2: Authenticated API Request Transmission
**Objective:** As a gamification store, I want to transmit valid authentication tokens in API request headers, so that backend endpoints can verify user identity.

#### Acceptance Criteria
1. WHEN making authenticated API request THEN API Client SHALL include `Authorization: Bearer {token}` header
2. WHERE token is available THE API Client SHALL attach token to all gamification-related requests
3. IF token is missing or invalid THEN API Client SHALL throw authentication error before sending request
4. WHEN request is sent THEN API Client SHALL include CORS credentials configuration

### Requirement 3: Karma Store Authentication Fix
**Objective:** As a Dashboard user, I want to view my karma summary and logs without authentication errors, so that I can track my wasteland karma status.

#### Acceptance Criteria
1. WHEN `karmaStore.fetchSummary()` is called THEN Karma Store SHALL retrieve valid access token before API call
2. WHEN `karmaStore.fetchLogs()` is called THEN Karma Store SHALL retrieve valid access token before API call
3. IF token retrieval fails THEN Karma Store SHALL set error state with "Unauthorized: Please login first" message
4. WHEN API request succeeds THEN Karma Store SHALL update state with response data
5. WHERE user is unauthenticated THE Karma Store SHALL display login prompt instead of making API request

### Requirement 4: Tasks Store Authentication Fix
**Objective:** As a Dashboard user, I want to view my daily and weekly tasks without authentication errors, so that I can complete gamification objectives.

#### Acceptance Criteria
1. WHEN `tasksStore.fetchDailyTasks()` is called THEN Tasks Store SHALL retrieve valid access token before API call
2. WHEN `tasksStore.fetchWeeklyTasks()` is called THEN Tasks Store SHALL retrieve valid access token before API call
3. IF token retrieval fails THEN Tasks Store SHALL set error state with "Unauthorized: Please login first" message
4. WHEN API request succeeds THEN Tasks Store SHALL update state with task data
5. WHERE user is unauthenticated THE Tasks Store SHALL display login prompt instead of making API request

### Requirement 5: Achievement Store Authentication Fix
**Objective:** As a Dashboard user, I want to view my achievement progress without Zod validation errors, so that I can track my unlocked badges and titles.

#### Acceptance Criteria
1. WHEN `achievementStore.fetchUserProgress()` is called THEN Achievement Store SHALL retrieve valid access token before API call
2. IF token is undefined THEN Achievement Store SHALL handle error before attempting Zod schema validation
3. WHEN API response is received THEN Achievement Store SHALL validate response structure with Zod schema
4. IF Zod validation fails due to undefined token THEN Achievement Store SHALL display authentication error instead of Zod error
5. WHERE user is unauthenticated THE Achievement Store SHALL display login prompt instead of making API request

### Requirement 6: Error Handling and User Feedback
**Objective:** As a Dashboard user, I want clear error messages when authentication fails, so that I understand what action to take.

#### Acceptance Criteria
1. WHEN authentication token is missing THEN System SHALL display "未認證：請先登入" (Unauthenticated: Please login first) error message
2. WHEN authentication token is expired THEN System SHALL display "登入已過期：請重新登入" (Session expired: Please login again) error message
3. WHERE authentication error occurs THE System SHALL provide login button or redirect to login page
4. IF network error occurs THEN System SHALL distinguish between authentication errors and network errors
5. WHEN error is displayed THEN System SHALL log error details to console for debugging

### Requirement 7: Authentication State Synchronization
**Objective:** As a developer, I want authentication state to be synchronized across all gamification stores, so that token retrieval logic is consistent and maintainable.

#### Acceptance Criteria
1. WHEN any gamification store needs authentication THEN Store SHALL use shared authentication utility function
2. WHERE token retrieval logic exists THE System SHALL centralize logic in single reusable function
3. IF authentication state changes THEN All gamification stores SHALL react to state updates
4. WHEN user logs out THEN System SHALL clear all gamification store data and reset authentication state

### Requirement 8: Backward Compatibility with Existing Authentication
**Objective:** As a system architect, I want the authentication fix to maintain compatibility with existing Zustand authStore and Supabase Auth integration, so that no other features break.

#### Acceptance Criteria
1. WHEN implementing authentication fix THEN System SHALL use existing `authStore` from `@/lib/authStore`
2. WHERE Supabase client is needed THE System SHALL use existing Supabase configuration
3. IF authentication flow changes THEN System SHALL maintain compatibility with login/register pages
4. WHEN fix is deployed THEN Existing authentication features SHALL continue functioning without regression

### Requirement 9: Testing and Verification
**Objective:** As a quality assurance engineer, I want comprehensive test coverage for authentication fixes, so that regressions can be detected early.

#### Acceptance Criteria
1. WHEN authentication fix is implemented THEN System SHALL include unit tests for token retrieval logic
2. WHERE API request transmission occurs THE System SHALL include integration tests for authenticated requests
3. IF authentication error occurs THEN System SHALL include tests verifying correct error handling and user feedback
4. WHEN all stores are fixed THEN System SHALL include E2E tests covering full Dashboard gamification flow with authentication

### Requirement 10: Performance and User Experience
**Objective:** As a Dashboard user, I want authentication checks to be fast and non-blocking, so that gamification data loads quickly.

#### Acceptance Criteria
1. WHEN Dashboard loads THEN Authentication token retrieval SHALL complete within 100ms
2. WHERE multiple stores fetch data concurrently THE System SHALL avoid redundant token retrieval calls
3. IF token is already cached THEN System SHALL reuse cached token instead of retrieving again
4. WHEN authentication succeeds THEN Gamification data SHALL begin loading immediately without additional delay
5. WHILE authentication check is in progress THE System SHALL display loading indicators instead of error states
