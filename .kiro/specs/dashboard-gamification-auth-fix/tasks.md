# Implementation Tasks

## Overview
This document outlines implementation tasks for fixing critical authentication failures in Dashboard gamification components (Karma, Tasks, Achievement stores). The fix centralizes authentication token retrieval into a reusable utility module, eliminating code duplication and ensuring consistent httpOnly cookie-based authentication across all stores.

## Tasks

- [x] 1. Create centralized authentication utility module
  - Implement `makeAuthenticatedRequest()` function in new `src/lib/authUtils.ts` file
  - Follow achievementStore's proven httpOnly cookie pattern with `credentials: 'include'`
  - Support generic return type `<T>` for type-safe API responses
  - Include `Content-Type: application/json` header by default
  - Accept optional `RequestInit` for custom request configuration
  - _Requirements: 1.1-1.4, 2.1-2.4, 7.1-7.2_

- [x] 1.1 Implement core authenticated request function
  - Create `makeAuthenticatedRequest<T>(endpoint: string, options?: RequestInit): Promise<T>` function
  - Configure fetch with `credentials: 'include'` for httpOnly cookie transmission
  - Merge provided options with default headers (`Content-Type: application/json`)
  - Return parsed JSON response as typed Promise
  - _Requirements: 1.1-1.4, 2.1-2.4_

- [x] 1.2 Implement network error detection and handling
  - Check `navigator.onLine` before making request
  - Throw `NetworkError` when offline
  - Integrate with errorStore using `useErrorStore.getState().pushError()`
  - Set network offline state via `errorStore.setNetworkOnline(false)`
  - Log network errors with endpoint context to console
  - _Requirements: 6.4, 10.5_

- [x] 1.3 Implement authentication error handling (401 responses)
  - Detect 401 Unauthorized responses from API
  - Save current URL to `sessionStorage.setItem('auth-return-url', window.location.pathname)`
  - Push authentication error to errorStore with reason (`auth_required` or `session_expired`)
  - Redirect user to `/auth/login?reason={reason}` for re-authentication
  - Set local error message: "未認證：請先登入" or "登入已過期：請重新登入"
  - _Requirements: 6.1-6.3, 7.3_

- [x] 1.4 Implement generic API error handling (4xx, 5xx responses)
  - Parse error detail from response body (handle both string and object formats)
  - Extract user-friendly error message from response
  - Push error to errorStore with endpoint, method, and status code context
  - Throw error with parsed message for caller handling
  - Log full error details to console for debugging
  - _Requirements: 6.4-6.5_

- [x] 2. Refactor karmaStore to use centralized authentication
  - Import `makeAuthenticatedRequest` from `@/lib/authUtils`
  - Remove duplicated `getAccessToken()` function from karmaStore
  - Remove duplicated internal `makeAuthenticatedRequest()` function
  - Update `fetchSummary()` to use centralized utility function
  - Update `fetchLogs()` to use centralized utility function
  - Maintain existing error handling integration with errorStore
  - _Requirements: 3.1-3.5, 7.1-7.4_

- [x] 2.1 Update fetchSummary action
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<KarmaSummary>()`
  - Call `/api/v1/karma/summary` endpoint using utility function
  - Handle successful response by updating `summary` state
  - Catch and handle errors (authentication, network, API errors)
  - Set loading state before request and clear after completion
  - _Requirements: 3.1, 3.3-3.4_

- [x] 2.2 Update fetchLogs action with pagination support
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<KarmaLogsResponse>()`
  - Call `/api/v1/karma/logs` with pagination query parameters
  - Handle successful response by updating `logs` and pagination state
  - Catch and handle errors with proper state cleanup
  - Set loading state management correctly
  - _Requirements: 3.2, 3.3-3.4_

- [x] 3. Refactor tasksStore to use centralized authentication
  - Import `makeAuthenticatedRequest` from `@/lib/authUtils`
  - Remove duplicated `getAccessToken()` function from tasksStore
  - Remove duplicated internal `makeAuthenticatedRequest()` function
  - Update all task-related actions to use centralized utility
  - Maintain backward compatibility with existing public API
  - _Requirements: 4.1-4.5, 7.1-7.4_

- [x] 3.1 Update fetchDailyTasks action
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<DailyTasksData>()`
  - Call `/api/v1/tasks/daily` endpoint using utility function
  - Handle successful response by updating `dailyTasks` state
  - Catch and handle errors with proper error state management
  - Set loading state before request and clear after completion
  - _Requirements: 4.1, 4.3-4.4_

- [x] 3.2 Update fetchWeeklyTasks action
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<WeeklyTasksData>()`
  - Call `/api/v1/tasks/weekly` endpoint using utility function
  - Handle successful response by updating `weeklyTasks` state
  - Catch and handle errors with proper error state management
  - Set loading state correctly
  - _Requirements: 4.2, 4.3-4.4_

- [x] 3.3 Update claimDailyTaskReward action
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<ClaimRewardResponse>()`
  - Send POST request to `/api/v1/tasks/daily/{taskId}/claim` with utility function
  - Handle successful reward claim by refreshing daily tasks
  - Update per-task claiming state in `isClaimingDaily` map
  - Catch and handle errors including claim idempotency errors
  - _Requirements: 4.1, 4.3-4.4_

- [x] 3.4 Update claimWeeklyTaskReward action
  - Replace internal authentication logic with `authUtils.makeAuthenticatedRequest<ClaimRewardResponse>()`
  - Send POST request to `/api/v1/tasks/weekly/{taskId}/claim` with utility function
  - Handle successful reward claim by refreshing weekly tasks
  - Update per-task claiming state in `isClaimingWeekly` map
  - Catch and handle errors with proper state cleanup
  - _Requirements: 4.2, 4.3-4.4_

- [ ] 4. Verify achievementStore authentication pattern
  - Review achievementStore's existing `apiRequest()` helper implementation
  - Confirm it uses `credentials: 'include'` for httpOnly cookie transmission
  - Verify integration with errorStore for error handling
  - Confirm 401 errors redirect to login page correctly
  - Document as reference implementation (no code changes needed)
  - _Requirements: 5.1-5.5, 8.1-8.4_

- [ ] 5. Implement comprehensive unit tests for authUtils
  - Test successful API request returns typed response data
  - Test 401 error triggers redirect to login with saved return URL
  - Test network error throws NetworkError and integrates with errorStore
  - Test generic API errors throw with proper error messages
  - Verify `credentials: 'include'` is present in all fetch calls
  - _Requirements: 9.1-9.4_

- [ ] 5.1 Write success case tests
  - Mock successful 200 OK response with sample data
  - Verify function returns correctly typed response object
  - Confirm `credentials: 'include'` in fetch options
  - Verify `Content-Type: application/json` header included
  - Test with different response types (summary, logs, tasks)
  - _Requirements: 9.1, 10.1_

- [ ] 5.2 Write authentication error tests
  - Mock 401 Unauthorized response from API
  - Verify `sessionStorage.setItem('auth-return-url')` called with current path
  - Confirm redirect to `/auth/login?reason=session_expired`
  - Verify error pushed to errorStore with correct reason
  - Test both "auth_required" and "session_expired" scenarios
  - _Requirements: 6.1-6.3, 9.3_

- [ ] 5.3 Write network error tests
  - Mock `navigator.onLine === false` condition
  - Verify NetworkError thrown with appropriate message
  - Confirm errorStore.setNetworkOnline(false) called
  - Verify error pushed to errorStore with network context
  - Test fetch network failure scenario (timeout, DNS failure)
  - _Requirements: 6.4, 9.3_

- [ ] 5.4 Write generic API error tests
  - Mock various 4xx errors (400, 403, 404, 422, 429)
  - Mock various 5xx errors (500, 502, 503)
  - Verify error detail parsing from response body (string and object formats)
  - Confirm error pushed to errorStore with endpoint and status code
  - Verify error thrown with user-friendly message
  - _Requirements: 6.4-6.5, 9.3_

- [ ] 6. Implement unit tests for refactored karmaStore
  - Test fetchSummary calls makeAuthenticatedRequest with correct endpoint
  - Test fetchLogs handles pagination parameters correctly
  - Test error handling sets local error state and integrates with errorStore
  - Test loading state management (isLoading set before request, cleared after)
  - Test reset clears all state to initial values
  - _Requirements: 9.1-9.4_

- [ ] 6.1 Write fetchSummary tests
  - Mock makeAuthenticatedRequest to return sample karma summary
  - Verify summary state updated with response data
  - Test loading state transitions (true → false)
  - Verify error state cleared on successful request
  - Test error handling when makeAuthenticatedRequest throws
  - _Requirements: 3.1, 3.4, 9.1_

- [ ] 6.2 Write fetchLogs tests
  - Mock makeAuthenticatedRequest to return paginated logs response
  - Verify logs and pagination state updated correctly
  - Test different page parameter values
  - Verify loading state management
  - Test error handling with proper state cleanup
  - _Requirements: 3.2, 3.4, 9.1_

- [ ] 7. Implement unit tests for refactored tasksStore
  - Test fetchDailyTasks calls makeAuthenticatedRequest with correct endpoint
  - Test claimDailyTaskReward POST request includes task ID
  - Test claiming state tracking in isClaimingDaily map
  - Test error handling and errorStore integration
  - Test reset clears all state including claiming maps
  - _Requirements: 9.1-9.4_

- [ ] 7.1 Write daily tasks tests
  - Mock makeAuthenticatedRequest for fetchDailyTasks endpoint
  - Verify dailyTasks state updated with response data
  - Test loading state transitions
  - Test error handling with proper state cleanup
  - _Requirements: 4.1, 4.4, 9.1_

- [ ] 7.2 Write weekly tasks tests
  - Mock makeAuthenticatedRequest for fetchWeeklyTasks endpoint
  - Verify weeklyTasks state updated with response data
  - Test loading state management
  - Test error handling integration
  - _Requirements: 4.2, 4.4, 9.1_

- [ ] 7.3 Write task claiming tests
  - Mock claimDailyTaskReward POST request
  - Verify claiming state (isClaimingDaily) updated during claim process
  - Test successful claim triggers task refresh
  - Test claim idempotency error handling (already claimed)
  - Verify error handling for failed claims
  - _Requirements: 4.1-4.2, 4.4, 9.1_

- [ ] 8. Implement integration tests for karma store
  - Test authenticated user fetches karma summary successfully
  - Test 401 error triggers redirect to login with saved return URL
  - Test network offline shows error and retry works when online
  - Test concurrent fetchSummary calls don't cause race conditions
  - _Requirements: 9.2-9.4_

- [ ] 8.1 Write karma happy path integration test
  - Simulate user with valid httpOnly cookie
  - Call karmaStore.fetchSummary()
  - Verify API request includes credentials
  - Verify karma summary state updated correctly
  - Verify no errors in errorStore
  - _Requirements: 3.1-3.4, 9.2_

- [ ] 8.2 Write karma authentication failure test
  - Simulate expired or missing httpOnly cookie (401 response)
  - Call karmaStore.fetchSummary()
  - Verify redirect to login page
  - Verify return URL saved to sessionStorage
  - Verify error displayed to user
  - _Requirements: 3.5, 6.1-6.3, 9.2_

- [ ] 9. Implement integration tests for tasks store
  - Test user claims daily task reward successfully
  - Test claim idempotency (attempting to claim already-claimed task)
  - Test weekly tasks refresh after weekly reset time
  - Test error recovery when claim request fails
  - _Requirements: 9.2-9.4_

- [ ] 9.1 Write task claiming flow integration test
  - Simulate authenticated user with valid cookie
  - Call tasksStore.claimDailyTaskReward(taskId)
  - Verify POST request sent with credentials
  - Verify karma updates in response
  - Verify tasks refreshed after claim
  - Verify claiming state cleared after completion
  - _Requirements: 4.1, 4.3-4.4, 9.2_

- [ ] 9.2 Write task error recovery integration test
  - Simulate network failure during claim request
  - Verify claiming state cleared
  - Verify error displayed to user
  - Verify task state not corrupted
  - Test retry mechanism works correctly
  - _Requirements: 4.3-4.5, 9.2_

- [ ] 10. Implement E2E tests for Dashboard gamification flow
  - Test authenticated user loads Dashboard without errors
  - Test session expiry during active use redirects to login
  - Test network interruption shows offline banner and auto-recovers
  - Test task completion and reward claiming full flow
  - _Requirements: 9.4, 10.1-10.5_

- [ ] 10.1 Write authenticated Dashboard loading E2E test
  - User logs in successfully
  - Navigate to Dashboard page
  - Verify karma summary loads without errors
  - Verify daily tasks load without errors
  - Verify weekly tasks load without errors
  - Verify achievement progress loads without errors
  - Verify all data displayed correctly in UI
  - _Requirements: 3.1-3.5, 4.1-4.5, 5.1-5.5, 9.4_

- [ ] 10.2 Write session expiry E2E test
  - User logs in and navigates to Dashboard
  - Simulate session expiry (token becomes invalid)
  - Trigger karma or tasks fetch
  - Verify redirect to login page
  - Verify return URL saved
  - User logs in again
  - Verify redirected back to Dashboard
  - Verify data loads correctly after re-login
  - _Requirements: 6.2, 7.3, 9.4_

- [ ] 10.3 Write network interruption E2E test
  - User loads Dashboard with active network
  - Simulate network offline
  - Verify offline banner displayed
  - Verify retry button available
  - Simulate network back online
  - Click retry button
  - Verify data refreshes automatically
  - Verify offline banner dismissed
  - _Requirements: 6.4, 9.4, 10.3_

- [ ] 10.4 Write task completion E2E test
  - User loads Dashboard with incomplete daily task
  - Verify task shows progress percentage
  - Simulate completing task action (e.g., reading)
  - Refresh tasks
  - Verify task marked as completed
  - Verify "Claim Reward" button enabled
  - Click claim reward button
  - Verify karma increased by reward amount
  - Verify task marked as claimed
  - Verify claim button disabled
  - _Requirements: 4.1-4.4, 9.4_

- [ ] 11. Implement performance tests for authentication
  - Measure httpOnly cookie transmission time (<10ms target)
  - Measure full API request round-trip time (<100ms for summary endpoints)
  - Measure 401 error detection and redirect time (<50ms target)
  - Test concurrent store initialization time (<500ms for all 3 stores)
  - _Requirements: 10.1-10.5_

- [ ] 11.1 Write cookie transmission performance test
  - Measure time for fetch with `credentials: 'include'`
  - Verify cookie automatically included in request
  - Verify transmission time < 10ms
  - Test across multiple requests to verify consistency
  - _Requirements: 10.1_

- [ ] 11.2 Write API request performance test
  - Measure round-trip time for karma summary endpoint
  - Measure round-trip time for daily tasks endpoint
  - Verify both complete within 100ms
  - Test with network throttling simulation
  - _Requirements: 10.2_

- [ ] 11.3 Write error detection performance test
  - Measure time from 401 response to redirect
  - Verify redirect completes within 50ms
  - Measure errorStore integration time
  - Verify no UI blocking during error handling
  - _Requirements: 10.1_

- [ ] 11.4 Write concurrent initialization performance test
  - Trigger fetchSummary, fetchDailyTasks, fetchWeeklyTasks in parallel
  - Measure total time for all requests to complete
  - Verify total time < 500ms
  - Verify no request blocking others
  - Verify all stores updated correctly
  - _Requirements: 10.2, 10.4_

- [ ] 12. Manual testing and validation
  - Test Dashboard gamification components in development environment
  - Verify all karma features work with centralized authentication
  - Verify all task features work correctly
  - Test error messages display correctly in zh-tw
  - Verify backward compatibility with existing authentication flow
  - _Requirements: 8.1-8.4, 9.1-9.4_

- [ ] 12.1 Manual karma feature testing
  - Load Dashboard and verify karma summary displays
  - Navigate to karma logs and verify pagination works
  - Test error scenarios (logout and try to access karma)
  - Verify error messages in Traditional Chinese
  - _Requirements: 3.1-3.5, 6.1-6.5_

- [ ] 12.2 Manual task feature testing
  - Load Dashboard and verify daily tasks display
  - Load weekly tasks and verify display
  - Claim available task reward and verify karma increases
  - Test claim idempotency (try claiming same task twice)
  - Verify error handling for various scenarios
  - _Requirements: 4.1-4.5, 6.1-6.5_

- [ ] 12.3 Manual authentication flow testing
  - Test login → Dashboard → data loads successfully
  - Test session expiry → redirect to login → return to Dashboard
  - Test network offline → offline banner → online → retry
  - Verify logout → attempt Dashboard access → redirect to login
  - _Requirements: 6.1-6.5, 7.1-7.4, 8.1-8.4_

## Implementation Notes

### Migration Strategy
Follow the phased approach outlined in design.md:
1. **Phase 1**: Create authUtils module (safe, no breaking changes)
2. **Phase 2**: Refactor karmaStore (isolated change)
3. **Phase 3**: Refactor tasksStore (isolated change)
4. **Phase 4**: Verify achievementStore (no code changes)
5. **Phase 5**: Integration testing and deployment

### Rollback Plan
Each phase has a clear rollback strategy:
- Phase 1: Delete authUtils.ts if issues found
- Phase 2: Restore karmaStore.ts from git
- Phase 3: Restore tasksStore.ts from git
- Phase 4: No changes to revert
- Phase 5: Revert all files to Phase 4 state

### Quality Gates
Before moving to next phase:
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Manual testing shows expected behavior
- ✅ No console errors in browser
- ✅ No TypeScript compilation errors

### Performance Targets
- Token retrieval: <10ms
- API request (summary): <100ms
- API request (logs): <200ms
- Error detection: <50ms
- Store initialization: <500ms (all 3 stores)

### Security Checklist
- ✅ No token values exposed in code or logs
- ✅ httpOnly cookies used for authentication
- ✅ No localStorage token parsing
- ✅ CORS properly configured
- ✅ 401 errors immediately redirect to login
