# Deployment Plan - Auth Token Error Fix

## Executive Summary

**Feature**: Authentication Token Error Fix (auth-token-error-fix)
**Deploy Date**: Ready for deployment
**Risk Level**: Low (refactoring only, no new features or backend changes)
**Rollback Time**: <5 minutes
**Estimated Downtime**: None (zero-downtime deployment)

## Pre-Deployment Checklist

### Build Verification ✅

- [x] **Production Build**: Successful (`bun build`)
  - Build completed without errors
  - 56 pages generated successfully
  - All routes properly compiled
  - Bundle size within acceptable limits

- [x] **Code Changes Validated**:
  - All legacy localStorage token retrieval code removed
  - All API requests use `credentials: 'include'`
  - 401 error handling with login redirection implemented
  - Error logging enhanced with full context

- [x] **Test Coverage**:
  - Tasks 1-5 completed with comprehensive tests
  - Unit tests for bingoStore and achievementStore
  - Integration tests for authentication flows
  - E2E tests for critical user paths

### Files Modified

**Frontend Changes Only**:
```
src/lib/stores/bingoStore.ts          # Refactored token handling
src/lib/stores/achievementStore.ts    # Refactored token handling
src/app/auth/login/page.tsx           # Enhanced redirection UX
```

**Test Files Added**:
```
src/lib/stores/__tests__/bingoStore.auth.test.ts
src/lib/stores/__tests__/achievementStore.test.ts
src/app/bingo/__tests__/bingo-page-auth-integration.test.tsx
src/app/achievements/__tests__/achievement-page-auth-integration.test.tsx
tests/e2e/auth-token-error-fix.spec.ts
src/lib/stores/__tests__/auth-performance.test.ts
```

### Rollback Preparation ✅

**Current Commit**: `b3d43c7` - fix(auth): 修復認證 token 錯誤並重構 httpOnly cookie 機制
**Previous Stable Commit**: `d0a16ce` - feat(ui): 新增 CRT 掃描線背景效果並優化頁面顯示

**Rollback Command**:
```bash
# If critical issues arise, execute:
git revert b3d43c7
bun build
# Deploy reverted build
```

**Alternative Rollback** (if revert fails):
```bash
git reset --hard d0a16ce
git push --force origin claude/auth-token-error-fix
bun build
# Deploy previous build
```

## Deployment Steps

### Phase 1: Pre-Deployment Validation (10 minutes)

1. **Verify Current Production State**
   ```bash
   # Check production health
   curl -I https://your-production-url.com/api/health

   # Verify current error rate in logs
   # (should show "No access token provided" errors)
   ```

2. **Backup Current Configuration**
   ```bash
   # Create deployment snapshot
   git tag deployment-backup-$(date +%Y%m%d-%H%M%S)
   git push --tags
   ```

3. **Notify Stakeholders**
   - Inform team of deployment start time
   - Expected duration: 15-20 minutes
   - Monitor channels: [specify monitoring tools]

### Phase 2: Deployment Execution (5 minutes)

**Platform**: Zeabur (Frontend deployment)

1. **Trigger Build**
   ```bash
   # On local machine (already completed):
   bun build

   # Verify build output:
   ls -lah .next/
   ```

2. **Deploy to Zeabur**
   ```bash
   # Push to deployment branch
   git push origin claude/auth-token-error-fix

   # Zeabur auto-deploys from branch
   # Monitor deployment progress in Zeabur dashboard
   ```

3. **Wait for Deployment Completion**
   - Monitor Zeabur deployment logs
   - Expected time: 3-5 minutes
   - Verify deployment status shows "Running"

### Phase 3: Post-Deployment Validation (10 minutes)

1. **Smoke Tests** (Critical Paths)

   **Test 1: Bingo Page Authentication**
   ```
   Action: Navigate to /bingo with valid authentication
   Expected: Page loads successfully without errors
   Validation: Check browser console for zero 401 errors
   ```

   **Test 2: Achievement Page Authentication**
   ```
   Action: Navigate to /achievements with valid authentication
   Expected: Page loads successfully with achievement data
   Validation: Verify no "ReferenceError: token is not defined" errors
   ```

   **Test 3: Unauthenticated Access**
   ```
   Action: Navigate to /bingo without authentication
   Expected: Redirect to /auth/login?reason=auth_required
   Validation: Verify login page displays correct message
   ```

2. **Browser Console Verification**
   ```javascript
   // Open browser DevTools Console
   // Navigate to /bingo and /achievements
   // Expected: No errors related to:
   //   - "No access token provided"
   //   - "ReferenceError: token is not defined"
   //   - Failed API requests with 401 status
   ```

3. **Network Tab Verification**
   ```
   // Open DevTools Network tab
   // Navigate to /bingo
   // Expected:
   //   - API requests include "Cookie: auth_token=..." header
   //   - No manual "Authorization: Bearer ..." header
   //   - All API calls return 200 OK (with valid auth)
   //   - 401 responses properly redirect to login
   ```

### Phase 4: Monitoring Setup (5 minutes)

1. **Enable Real-Time Monitoring**
   ```bash
   # Monitor production logs (adjust for your logging system)
   # Zeabur provides real-time logs in dashboard

   # Key metrics to track:
   # - 401 error rate (should approach zero)
   # - "No access token provided" errors (should be zero)
   # - "ReferenceError: token is not defined" (should be zero)
   # - API response times (should remain stable)
   ```

2. **Set Up Alerts** (if not already configured)
   - High 401 error rate (>10 per minute)
   - Spike in JavaScript errors
   - API response time degradation (>5 seconds)

## Monitoring Plan (First 24 Hours)

### Checkpoint 1: After 1 Hour

**Metrics to Check**:
- [ ] Zero "No access token provided" errors in backend logs
- [ ] Zero "ReferenceError: token is not defined" in frontend logs
- [ ] Bingo page load success rate: 100% for authenticated users
- [ ] Achievement page load success rate: 100% for authenticated users
- [ ] No unexpected errors introduced

**Action if Issues**:
- If any critical errors detected: Execute rollback
- If minor issues: Document and schedule fix for next release

### Checkpoint 2: After 6 Hours

**Metrics to Check**:
- [ ] 401 error rate < 1% (only from truly unauthenticated users)
- [ ] API request success rate maintained or improved
- [ ] No user reports of authentication issues
- [ ] Performance metrics stable (no degradation)

**Data Points**:
```
Before Fix:
- Bingo page 401 errors: [baseline count]
- Achievement page crashes: [baseline count]

After Fix (6 hours):
- Bingo page 401 errors: [target: 0 for authenticated users]
- Achievement page crashes: [target: 0]
- Unexpected new errors: [target: 0]
```

### Checkpoint 3: After 24 Hours

**Final Validation**:
- [ ] All error metrics within acceptable ranges
- [ ] No increase in support tickets related to authentication
- [ ] User feedback positive (if any)
- [ ] Performance metrics stable or improved

**Success Criteria** (All must pass):
1. Zero "No access token provided" errors for authenticated users
2. Zero "ReferenceError: token is not defined" errors
3. Bingo and Achievement pages 100% functional
4. No performance degradation (<100ms API response times)
5. No new unrelated errors introduced

**If All Criteria Met**:
- Mark deployment as successful
- Close monitoring phase
- Update task status in tasks.md
- Document lessons learned

## Rollback Triggers

Execute immediate rollback if any of these conditions are met:

### Critical (Immediate Rollback)
- ❌ **Any page completely broken** (white screen, crash)
- ❌ **Data loss or corruption** detected
- ❌ **Authentication completely broken** (no users can login)
- ❌ **Error rate spike >50%** in first 10 minutes

### Major (Rollback within 1 hour)
- ⚠️ **Critical feature broken** (Bingo or Achievement pages non-functional)
- ⚠️ **Performance degradation >50%** (API response times)
- ⚠️ **Multiple user reports** of authentication issues

### Minor (Fix Forward or Rollback within 24 hours)
- ⚠️ **Non-critical UI issues** (styling, minor UX problems)
- ⚠️ **Edge case errors** affecting <5% of users
- ⚠️ **Performance degradation <20%** (acceptable)

## Rollback Procedure

### Emergency Rollback (5 minutes)

```bash
# Step 1: Revert commit
cd /path/to/tarot-card-nextjs-app
git revert b3d43c7 --no-edit

# Step 2: Build reverted code
bun build

# Step 3: Deploy to Zeabur
git push origin claude/auth-token-error-fix

# Step 4: Monitor deployment
# (Zeabur auto-deploys, monitor logs)

# Step 5: Verify rollback success
curl -I https://your-production-url.com/bingo
# Expected: Previous behavior (with known errors)

# Step 6: Notify team
echo "Rollback completed. Investigating issues..."
```

### Post-Rollback Actions

1. **Document the Issue**
   ```markdown
   ## Rollback Report
   - Deployment Time: [timestamp]
   - Rollback Time: [timestamp]
   - Duration of Issue: [duration]
   - Root Cause: [detailed description]
   - Affected Users: [count or percentage]
   - Resolution Plan: [next steps]
   ```

2. **Analyze Root Cause**
   - Review deployment logs
   - Check error messages
   - Identify what was missed in testing

3. **Plan Fix**
   - Create new branch for fix
   - Add tests for missed scenario
   - Schedule re-deployment

## Success Metrics

### Deployment Success Criteria

**Technical Metrics**:
- ✅ Build succeeds without errors
- ✅ Zero TypeScript errors in production code
- ✅ All critical tests pass
- ✅ API response times <100ms (bingo/status, achievements/progress)

**Business Metrics**:
- ✅ User satisfaction maintained (no negative feedback)
- ✅ Feature adoption unchanged (Bingo and Achievement usage)
- ✅ Zero authentication-related support tickets

**Operational Metrics**:
- ✅ Deployment completed in <20 minutes
- ✅ Zero unplanned rollbacks
- ✅ Monitoring alerts not triggered

## Communication Plan

### Pre-Deployment
- **Audience**: Development team
- **Channel**: Slack #engineering
- **Message**: "Starting deployment of auth-token-error-fix at [time]. Expected duration: 15-20 minutes. Monitoring for first 24 hours."

### During Deployment
- **Audience**: Development team + stakeholders
- **Channel**: Slack #engineering, #product
- **Updates**:
  - "Deployment started"
  - "Build completed"
  - "Zeabur deployment in progress"
  - "Smoke tests passed"
  - "Deployment complete"

### Post-Deployment Success
- **Audience**: All stakeholders
- **Channel**: Slack #general, email
- **Message**: "Auth token error fix deployed successfully. Bingo and Achievement pages now load without errors. Monitoring for next 24 hours."

### Post-Deployment Failure (if rollback)
- **Audience**: All stakeholders
- **Channel**: Slack #general, email
- **Message**: "Deployment rolled back due to [issue]. System restored to previous state. No user impact. Fix scheduled for [date]."

## Notes

**Why This Deployment is Low Risk**:
1. **No Backend Changes**: Only frontend store modifications
2. **No Database Migrations**: Zero schema changes
3. **Existing Pattern**: Aligns with established httpOnly cookie architecture
4. **Comprehensive Testing**: All tasks tested and validated
5. **Fast Rollback**: Single commit revert, no data cleanup needed

**Post-Deployment Tasks** (After 24 hours):
- [ ] Update tasks.md to mark Task 6 as complete
- [ ] Archive deployment logs for future reference
- [ ] Document lessons learned in postmortem (if needed)
- [ ] Share success metrics with team

---

**Prepared By**: Claude Code (AI Agent)
**Approved By**: [To be filled by human reviewer]
**Deployment Date**: [To be scheduled]
**Last Updated**: 2025-10-29
