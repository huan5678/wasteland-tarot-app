# Requirements Document

## Project Description (Input)
修復認證 token 錯誤：(1) 賓果頁面出現 'No access token provided' 錯誤，導致無法正常載入賓果資料；(2) 成就系統頁面出現 'ReferenceError: token is not defined' 錯誤，導致頁面崩潰。這兩個錯誤都是因為前端未正確處理 Supabase 認證 token 的取得與傳遞。需要確保所有需要認證的頁面都能正確從 Supabase Auth 取得 access token，並在 API 請求中正確帶入 Authorization header。修復應該包含錯誤處理機制，當 token 不存在時應導向登入頁面而非顯示錯誤。

## Introduction
This specification addresses critical authentication token handling errors affecting the Bingo (賓果) and Achievement (成就) system pages in the Wasteland Tarot platform. These errors prevent users from accessing protected features and cause page crashes, degrading the user experience. The root cause is improper token retrieval from Supabase Auth and inconsistent Authorization header handling in frontend API requests. This fix ensures robust authentication token management across all protected pages with proper error handling and user redirection flows.

## Requirements

### Requirement 1: Token Retrieval from Supabase Auth
**Objective:** As a frontend developer, I want a centralized and reliable method to retrieve Supabase access tokens, so that all protected pages can authenticate API requests consistently.

#### Acceptance Criteria
1. WHEN the application initializes THEN Frontend Authentication Module SHALL retrieve the current Supabase session using `supabase.auth.getSession()`
2. IF the session exists and is valid THEN Frontend Authentication Module SHALL extract the access token from session.access_token
3. IF the session does not exist or is expired THEN Frontend Authentication Module SHALL return null for the access token
4. WHEN a page component mounts and requires authentication THEN Frontend Authentication Module SHALL provide a reactive hook to access the current access token
5. WHERE token state changes (login, logout, refresh) THE Frontend Authentication Module SHALL notify all dependent components of the token state change

### Requirement 2: Authorization Header Management
**Objective:** As a frontend API client, I want all authenticated API requests to include proper Authorization headers, so that backend endpoints can verify user identity and authorization.

#### Acceptance Criteria
1. WHEN making an API request to a protected endpoint THEN API Client Module SHALL include `Authorization: Bearer {access_token}` header
2. IF access token is null or empty THEN API Client Module SHALL not include Authorization header
3. WHEN token is available THEN API Client Module SHALL apply Authorization header to all requests in `/api/v1/*` routes
4. WHERE multiple API calls are made concurrently THE API Client Module SHALL use the same current valid token for all requests
5. IF token refresh occurs during pending requests THEN API Client Module SHALL retry failed requests with the new token

### Requirement 3: Bingo Page Token Error Resolution
**Objective:** As a user accessing the Bingo page, I want the page to load successfully with my bingo data, so that I can interact with the daily check-in feature without encountering 'No access token provided' errors.

#### Acceptance Criteria
1. WHEN user navigates to the Bingo page (`/bingo`) THEN Bingo Page Component SHALL retrieve the current access token before making API requests
2. IF access token is available THEN Bingo Page Component SHALL fetch bingo data with proper Authorization header
3. IF access token is not available THEN Bingo Page Component SHALL redirect user to login page (`/auth/login`)
4. WHEN bingo API request returns 401 Unauthorized THEN Bingo Page Component SHALL clear auth state and redirect to login page
5. WHILE bingo data is loading THE Bingo Page Component SHALL display a loading indicator

### Requirement 4: Achievement System Token Error Resolution
**Objective:** As a user accessing the Achievement page, I want to view my achievements without page crashes caused by 'ReferenceError: token is not defined', so that I can track my progress in the gamification system.

#### Acceptance Criteria
1. WHEN user navigates to the Achievement page (`/achievements`) THEN Achievement Page Component SHALL retrieve the current access token before accessing achievement data
2. IF access token is available THEN Achievement Page Component SHALL fetch achievement data with proper Authorization header
3. IF access token is not available THEN Achievement Page Component SHALL redirect user to login page (`/auth/login`)
4. WHEN achievement API request returns 401 Unauthorized THEN Achievement Page Component SHALL clear auth state and redirect to login page
5. IF token retrieval fails with ReferenceError THEN Achievement Page Component SHALL catch the error, log it, and redirect to login page
6. WHILE achievement data is loading THE Achievement Page Component SHALL display a loading indicator

### Requirement 5: Error Handling and User Redirection
**Objective:** As a user encountering authentication issues, I want to be automatically redirected to the login page with a clear message, so that I understand why I was redirected and can take corrective action.

#### Acceptance Criteria
1. WHEN any protected page detects missing or invalid token THEN Error Handling Module SHALL redirect user to `/auth/login` with query parameter `?reason=auth_required`
2. WHEN authentication API request fails with 401 status THEN Error Handling Module SHALL redirect user to `/auth/login` with query parameter `?reason=session_expired`
3. WHEN user is redirected to login page with reason parameter THEN Login Page SHALL display user-friendly message explaining the reason
4. IF reason is 'auth_required' THEN Login Page SHALL display "請先登入以存取此功能" (Please login to access this feature)
5. IF reason is 'session_expired' THEN Login Page SHALL display "您的登入已過期，請重新登入" (Your session has expired, please login again)
6. WHEN user successfully logs in after redirection THEN Application SHALL redirect user back to the originally requested page

### Requirement 6: Global Authentication State Consistency
**Objective:** As a frontend state management system, I want authentication state to be consistent across all components, so that token availability is predictable and reliable throughout the application.

#### Acceptance Criteria
1. WHEN user logs in successfully THEN Zustand Auth Store SHALL persist access token and user session data
2. WHEN user logs out THEN Zustand Auth Store SHALL clear all authentication state including access token
3. IF token refresh occurs THEN Zustand Auth Store SHALL update the stored access token atomically
4. WHERE components access auth state THE Zustand Auth Store SHALL provide real-time access to current token status
5. WHEN token expires THEN Zustand Auth Store SHALL detect expiration and clear auth state

### Requirement 7: Token Validation and Refresh
**Objective:** As an authentication system, I want to validate token expiry and attempt token refresh before making API requests, so that users experience seamless authenticated sessions without unnecessary login prompts.

#### Acceptance Criteria
1. WHEN access token is about to be used THEN Token Validation Module SHALL check token expiration timestamp
2. IF token is expired or will expire within 5 minutes THEN Token Validation Module SHALL attempt to refresh token using Supabase `refreshSession()`
3. IF token refresh succeeds THEN Token Validation Module SHALL update Zustand Auth Store with new token
4. IF token refresh fails THEN Token Validation Module SHALL clear auth state and return null token
5. WHEN token is validated as current and non-expired THEN Token Validation Module SHALL return the token for API request use

### Requirement 8: Defensive Error Handling for Token Variables
**Objective:** As a page component, I want to handle all possible token-related errors defensively, so that undefined or null token references never cause ReferenceError crashes.

#### Acceptance Criteria
1. WHEN accessing token variables THEN Component Code SHALL use optional chaining (`?.`) or null checks before token usage
2. IF token is undefined or null THEN Component Code SHALL handle the case gracefully without throwing ReferenceError
3. WHEN token retrieval function is called THEN Function SHALL always return a defined value (token string or null)
4. WHERE token is used in string interpolation THE Code SHALL validate token is truthy before interpolation
5. IF token access throws any error THEN Error Boundary SHALL catch and handle the error without crashing the page

### Requirement 9: Audit and Logging for Authentication Failures
**Objective:** As a developer, I want detailed logging of authentication failures and token errors, so that I can monitor auth issues and debug problems efficiently.

#### Acceptance Criteria
1. WHEN token retrieval fails THEN Logging Module SHALL log error with context (page, timestamp, error message)
2. WHEN API request fails with 401 status THEN Logging Module SHALL log failed endpoint, token status, and user ID (if available)
3. WHEN token is null or undefined unexpectedly THEN Logging Module SHALL log warning with component name and call stack
4. WHERE token refresh fails THE Logging Module SHALL log refresh attempt details and failure reason
5. IF ReferenceError occurs related to token THEN Logging Module SHALL capture full error stack trace and component state

### Requirement 10: Testing and Validation
**Objective:** As a QA engineer, I want comprehensive tests covering all token error scenarios, so that authentication token handling is reliable and regression-free.

#### Acceptance Criteria
1. WHEN running unit tests THEN Test Suite SHALL verify token retrieval from Supabase Auth in success and failure cases
2. WHEN running integration tests THEN Test Suite SHALL simulate 401 responses and verify correct redirection behavior
3. WHEN running E2E tests THEN Test Suite SHALL verify Bingo and Achievement pages load correctly with valid authentication
4. IF token is missing or invalid in test scenario THEN Test Suite SHALL verify pages redirect to login without crashing
5. WHEN testing token refresh THEN Test Suite SHALL verify expired tokens are refreshed before API requests

