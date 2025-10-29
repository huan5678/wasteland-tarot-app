# Implementation Plan

## Task Format Template

This implementation plan addresses authentication token errors on Bingo and Achievement pages by aligning token handling with the existing httpOnly cookie architecture. All tasks focus on refactoring existing stores to remove legacy localStorage token retrieval and use browser-native cookie transmission.

---

## Implementation Tasks

- [x] 1. Refactor Bingo Store Authentication Mechanism
  - Remove legacy localStorage token retrieval functions that attempt to access non-existent tokens
  - Update API request function to use credentials for automatic httpOnly cookie transmission
  - Eliminate all manual Authorization header construction logic (cookies are automatic)
  - Add error handling for 401 Unauthorized responses with login page redirection
  - Distinguish between missing token ('auth_required') and expired token ('session_expired') scenarios
  - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 5.1-5.6, 8.1-8.5_

- [x] 1.1 Update bingoStore.ts API request function for httpOnly cookies
  - Replace apiRequest function to use credentials-based fetch implementation
  - Ensure credentials: 'include' is set in all fetch calls to enable cookie transmission
  - Remove Authorization header construction (browser automatically attaches httpOnly cookie)
  - Preserve existing Content-Type header for JSON payloads
  - Maintain existing network check and timedFetch integration
  - _Requirements: 2.1, 2.3, 3.2_

- [x] 1.2 Implement 401 error handling with login redirection
  - Detect 401 Unauthorized responses in apiRequest error handling
  - Parse response status text to distinguish token expiry from missing token
  - Redirect to /auth/login?reason=session_expired when token is expired
  - Redirect to /auth/login?reason=auth_required when token is missing
  - Log all 401 errors to errorStore with full context (endpoint, method, timestamp)
  - _Requirements: 3.3, 3.4, 5.1, 5.2, 9.1, 9.2_

- [x] 1.3 Add defensive error handling for all API calls
  - Wrap all fetch calls in try-catch blocks to prevent ReferenceError crashes
  - Handle network offline errors by updating errorStore network status
  - Catch and log ReferenceErrors related to undefined token variables
  - Ensure no undefined or null token references throw uncaught errors
  - Validate all error objects before accessing properties (optional chaining)
  - _Requirements: 8.1-8.5, 9.3, 9.5_

- [x] 1.4 Enhance error logging and monitoring for Bingo store
  - Log all API errors with full context: endpoint, method, status code, timestamp
  - Include component name '[BingoStore]' in error logs for easier debugging
  - Log warning when token is unexpectedly null or undefined
  - Capture error stack traces for ReferenceErrors
  - Push all errors to errorStore with source 'api' and relevant details
  - _Requirements: 9.1-9.5_

- [x] 2. Refactor Achievement Store Authentication Mechanism
  - Remove legacy localStorage token retrieval functions (identical to Bingo store)
  - Update API request function to use credentials for httpOnly cookie transmission
  - Eliminate all manual Authorization header construction logic
  - Add error handling for 401 Unauthorized responses with login page redirection
  - Distinguish between missing token and expired token redirect reasons
  - _Requirements: 1.1-1.5, 2.1-2.5, 4.1-4.6, 5.1-5.6, 8.1-8.5_

- [x] 2.1 Update achievementStore.ts API request function for httpOnly cookies
  - Replace apiRequest function with credentials-based implementation (same pattern as bingoStore)
  - Ensure credentials: 'include' is set in all fetch calls
  - Remove Authorization header construction (cookies are automatic)
  - Preserve existing Content-Type header for JSON payloads
  - Maintain existing network check and timedFetch integration
  - _Requirements: 2.1, 2.3, 4.2_

- [x] 2.2 Implement 401 error handling with login redirection
  - Detect 401 Unauthorized responses in apiRequest error handling
  - Parse response status text to distinguish token expiry from missing token
  - Redirect to /auth/login?reason=session_expired when token is expired
  - Redirect to /auth/login?reason=auth_required when token is missing
  - Log all 401 errors to errorStore with full context (endpoint, method, timestamp)
  - _Requirements: 4.3, 4.4, 5.1, 5.2, 9.1, 9.2_

- [x] 2.3 Add defensive error handling for all API calls
  - Wrap all fetch calls in try-catch blocks to prevent crashes
  - Handle network offline errors by updating errorStore network status
  - Catch and log ReferenceErrors specifically for 'token is not defined' error
  - Ensure no undefined or null token references throw uncaught errors
  - Validate all error objects before accessing properties (optional chaining)
  - _Requirements: 4.5, 8.1-8.5, 9.3, 9.5_

- [x] 2.4 Enhance error logging and monitoring for Achievement store
  - Log all API errors with full context: endpoint, method, status code, timestamp
  - Include component name '[AchievementStore]' in error logs for easier debugging
  - Log warning when token is unexpectedly null or undefined
  - Capture error stack traces for ReferenceErrors
  - Push all errors to errorStore with source 'api' and relevant details
  - _Requirements: 9.1-9.5_

- [x] 3. Enhance Login Page Redirection User Experience
  - Parse query parameter 'reason' on login page mount to determine redirect cause
  - Display user-friendly Traditional Chinese message for 'auth_required' reason
  - Display session expiry message for 'session_expired' reason
  - Store originally requested URL in sessionStorage before redirect
  - Redirect user back to original page after successful login
  - _Requirements: 5.3-5.6_

- [x] 3.1 Implement login page reason parameter handling
  - Parse URL query parameter 'reason' using Next.js router
  - Map 'auth_required' to "請先登入以存取此功能" (Please login to access this feature)
  - Map 'session_expired' to "您的登入已過期，請重新登入" (Your session has expired, please login again)
  - Display message in visible UI element (Fallout-styled alert/banner)
  - Clear reason parameter from URL after message is displayed
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 3.2 Add post-login return navigation
  - Store original requested URL in sessionStorage before 401 redirect
  - Retrieve stored URL after successful login completion
  - Redirect user to stored URL (or default dashboard if none stored)
  - Clear stored URL from sessionStorage after successful redirect
  - Handle edge case where stored URL is no longer valid (fallback to dashboard)
  - _Requirements: 5.6_

- [x] 4. Comprehensive Testing Suite
  - Write unit tests for updated apiRequest functions in both stores
  - Write integration tests for authentication flows on Bingo and Achievement pages
  - Write E2E tests for critical user paths (login → page access → data load)
  - Verify performance metrics remain unchanged (no degradation)
  - _Requirements: 10.1-10.5_

- [x] 4.1 Unit tests for bingoStore authentication changes
  - Test apiRequest function includes credentials: 'include' in fetch options
  - Test 401 response triggers login redirect with correct reason parameter
  - Test errors are logged to errorStore with full context (endpoint, method, status)
  - Verify getAuthToken and createAuthHeaders functions are removed (code audit)
  - Test network offline handling sets errorStore network status to false
  - _Requirements: 10.1_
  - _Files: src/lib/stores/__tests__/bingoStore.auth.test.ts (already exists from Task 1)_

- [x] 4.2 Unit tests for achievementStore authentication changes
  - Test apiRequest function includes credentials: 'include' (same pattern as bingoStore)
  - Test 401 response triggers login redirect with correct reason parameter
  - Test errors are logged to errorStore with full context
  - Verify getAuthToken and createAuthHeaders functions are removed (code audit)
  - Test ReferenceError handling prevents 'token is not defined' crashes
  - _Requirements: 10.1_
  - _Files: src/lib/stores/__tests__/achievementStore.test.ts (already exists from Task 2)_

- [x] 4.3 Integration tests for Bingo page authentication flow
  - Test successful page load with valid httpOnly cookie (mock cookie present)
  - Test redirect to login when no httpOnly cookie exists (mock cookie absent)
  - Test redirect to login when httpOnly cookie is expired (mock 401 response)
  - Test daily number claim succeeds with valid authentication
  - Test offline error display and retry functionality
  - _Requirements: 10.2, 10.3, 10.4_
  - _Files: src/app/bingo/__tests__/bingo-page-auth-integration.test.tsx_

- [x] 4.4 Integration tests for Achievement page authentication flow
  - Test successful page load with valid httpOnly cookie (mock cookie present)
  - Test redirect to login when no httpOnly cookie exists (mock cookie absent)
  - Test redirect to login when httpOnly cookie is expired (mock 401 response)
  - Test achievement reward claim succeeds with valid authentication
  - Test 'already claimed' error handling (409 Conflict response)
  - _Requirements: 10.2, 10.3, 10.4_
  - _Files: src/app/achievements/__tests__/achievement-page-auth-integration.test.tsx_

- [x] 4.5 E2E tests for critical authentication paths
  - Test login → Bingo page → claim daily number complete flow
  - Test login → Achievement page → claim reward complete flow
  - Test session expiry handling (simulate expired cookie scenario)
  - Test offline/online transition with retry button functionality
  - Verify post-login return navigation redirects to originally requested page
  - _Requirements: 10.3_
  - _Files: tests/e2e/auth-token-error-fix.spec.ts_

- [x] 4.6 Performance validation tests
  - Benchmark /api/v1/bingo/status response time with valid cookie (target <100ms)
  - Benchmark /api/v1/achievements/progress response time with valid cookie (target <200ms)
  - Measure 401 redirect overhead (target <50ms for window.location.href)
  - Verify errorStore logging overhead remains <10ms
  - Confirm no performance degradation compared to baseline (before fix)
  - _Requirements: 10.5_
  - _Files: src/lib/stores/__tests__/auth-performance.test.ts_

- [x] 5. Code Review and Validation
  - Verify all legacy localStorage token code removed from codebase
  - Confirm httpOnly cookie mechanism preserved and working correctly
  - Validate backward compatibility with existing authentication flows
  - Check TypeScript compilation succeeds without errors
  - Review error handling coverage for all edge cases (offline, expired, missing)
  - _Requirements: All requirements (validation phase)_

- [x] 5.1 Code audit for removed legacy patterns
  - Search codebase for localStorage.getItem('pip-boy-token') (should return zero results)
  - Search for manual Authorization header construction in bingoStore and achievementStore (should be removed)
  - Verify getAuthToken and createAuthHeaders functions deleted from both stores
  - Confirm no hardcoded token variables or direct token references remain
  - _Requirements: 1.1-1.5, 8.1-8.5_

- [x] 5.2 Validation of httpOnly cookie integration
  - Verify all API requests in both stores use credentials: 'include'
  - Test browser automatically attaches httpOnly cookie to API requests
  - Confirm backend correctly extracts and validates cookie via get_current_user_from_cookie()
  - Validate authStore remains unchanged (no modifications needed)
  - Test token expiry monitoring still works correctly via startTokenExpiryMonitor()
  - _Requirements: 6.1-6.5, 7.1-7.5_

- [x] 5.3 TypeScript and linting validation
  - Run TypeScript compiler (bun tsc --noEmit) and resolve all errors
  - Run ESLint (bun lint) and fix any new warnings
  - Verify no 'any' types introduced in refactored code
  - Confirm all function signatures remain unchanged (backward compatible interfaces)
  - _Requirements: All requirements (code quality)_

- [ ] 6. Deployment and Monitoring
  - Deploy updated stores to production environment
  - Monitor error logs for reduction in 401 errors
  - Verify Bingo and Achievement pages load successfully for authenticated users
  - Track user reports for authentication issues
  - Validate rollback plan if critical issues arise
  - _Requirements: All requirements (deployment phase)_

- [x] 6.1 Production deployment preparation
  - Build Next.js application (bun build) and verify no build errors
  - Test deployment in staging environment (if available)
  - Prepare rollback plan: document git revert command and previous commit hash
  - Document deployment steps and validation checkpoints
  - _Requirements: All requirements (deployment readiness)_

- [ ] 6.2 Post-deployment monitoring (first 24 hours)
  - Monitor error logs for "No access token provided" errors (target: zero occurrences)
  - Monitor for "ReferenceError: token is not defined" errors (target: zero occurrences)
  - Track Bingo page load success rate (target: 100% for authenticated users)
  - Track Achievement page load success rate (target: 100% for authenticated users)
  - Verify 401 redirect flow works correctly in production (redirect to login with reason)
  - _Requirements: 9.1-9.5, All requirements (monitoring)_

- [ ] 6.3 User impact validation
  - Check user reports/support tickets for authentication-related issues
  - Verify no increase in other error types (network, server, etc.)
  - Confirm API request success rate increases after deployment
  - Validate no performance degradation in API response times
  - Document any unexpected issues for rapid response
  - _Requirements: All requirements (user experience validation)_

---

## Task Summary

- **Total Major Tasks**: 6
- **Total Sub-Tasks**: 22
- **Estimated Timeline**: 2-3 days (including testing and 24-hour monitoring)
- **Risk Level**: Low (only refactoring existing stores, no new features or backend changes)
- **Rollback Time**: <5 minutes (git revert, no database migrations)

## Requirements Coverage

All 10 requirements are fully covered across the task hierarchy:

- **Req 1-2**: Tasks 1, 1.1, 2, 2.1 (Token retrieval and header management)
- **Req 3**: Tasks 1, 1.1-1.4 (Bingo page resolution)
- **Req 4**: Tasks 2, 2.1-2.4 (Achievement page resolution)
- **Req 5**: Tasks 3, 3.1-3.2 (Error handling and redirection)
- **Req 6-7**: Tasks 5.2 (Global auth state consistency and validation)
- **Req 8**: Tasks 1.3, 2.3 (Defensive error handling)
- **Req 9**: Tasks 1.4, 2.4, 6.2 (Audit and logging)
- **Req 10**: Tasks 4, 4.1-4.6 (Testing and validation)

---

## Critical Success Factors

1. **Zero localStorage Token Access**: All legacy token retrieval code must be completely removed
2. **Consistent Credentials Usage**: Every API request must use credentials: 'include'
3. **Robust 401 Handling**: All 401 errors must redirect to login with clear reason parameter
4. **No Crashes**: Defensive error handling must prevent all ReferenceErrors
5. **Performance Maintained**: API response times must not degrade (removing localStorage lookups may even improve performance slightly)

---

*Generated: 2025-10-29*
*Phase: Implementation Planning*
*Language: English (as specified in spec.json)*
