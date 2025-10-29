# Deployment Checklist - Auth Token Error Fix

## Quick Reference Checklist

Use this checklist during actual deployment. For detailed procedures, see `DEPLOYMENT_PLAN.md`.

---

## Pre-Deployment (10 min)

### Build Verification
- [x] Run `bun build` successfully
- [x] Verify 56 pages generated
- [x] No build errors or warnings
- [x] Check bundle size acceptable

### Code Review
- [x] All localStorage token code removed
- [x] All API requests use `credentials: 'include'`
- [x] 401 error handling implemented
- [x] Error logging enhanced

### Rollback Preparation
- [x] Document current commit: `b3d43c7`
- [x] Document previous commit: `d0a16ce`
- [x] Rollback command ready: `git revert b3d43c7`

### Team Notification
- [ ] Notify team in Slack #engineering
- [ ] Set deployment start time: `__________`
- [ ] Confirm monitoring channels active

---

## Deployment (5 min)

### Git Operations
- [ ] Verify on branch: `claude/auth-token-error-fix`
- [ ] Create backup tag: `git tag deployment-backup-$(date +%Y%m%d-%H%M%S)`
- [ ] Push to remote: `git push origin claude/auth-token-error-fix`

### Zeabur Deployment
- [ ] Monitor Zeabur dashboard for deployment start
- [ ] Wait for deployment status: "Running"
- [ ] Verify deployment logs clean (no errors)
- [ ] Note deployment completion time: `__________`

---

## Post-Deployment Validation (10 min)

### Smoke Test 1: Bingo Page (Authenticated)
- [ ] Navigate to: `https://[production-url]/bingo`
- [ ] Page loads successfully
- [ ] Bingo data displayed
- [ ] No console errors
- [ ] No 401 responses in Network tab

### Smoke Test 2: Achievement Page (Authenticated)
- [ ] Navigate to: `https://[production-url]/achievements`
- [ ] Page loads successfully
- [ ] Achievement data displayed
- [ ] No "ReferenceError: token is not defined"
- [ ] No console errors

### Smoke Test 3: Unauthenticated Redirect
- [ ] Clear cookies (logout)
- [ ] Navigate to: `https://[production-url]/bingo`
- [ ] Redirects to: `/auth/login?reason=auth_required`
- [ ] Correct message displayed: "請先登入以存取此功能"

### Browser DevTools Verification
- [ ] **Console**: Zero errors related to token
- [ ] **Network**: Cookies automatically attached
- [ ] **Network**: No manual "Authorization" headers
- [ ] **Network**: All API calls 200 OK or 401 with redirect

### API Verification
- [ ] Check `/api/v1/bingo/status` response time: `_____ms` (target: <100ms)
- [ ] Check `/api/v1/achievements/progress` response time: `_____ms` (target: <200ms)
- [ ] Verify httpOnly cookie present in requests

---

## Monitoring Setup (5 min)

### Real-Time Monitoring
- [ ] Open Zeabur logs dashboard
- [ ] Check error rate: `_____` (target: near zero)
- [ ] Monitor for "No access token provided": `_____` (target: 0)
- [ ] Monitor for "ReferenceError: token": `_____` (target: 0)

### Alert Configuration
- [ ] High 401 error rate alert active
- [ ] JavaScript error spike alert active
- [ ] API response time alert active

---

## Checkpoint 1: After 1 Hour

**Time**: `__________`

### Metrics Check
- [ ] "No access token provided" errors: `_____` (target: 0)
- [ ] "ReferenceError: token" errors: `_____` (target: 0)
- [ ] Bingo page success rate: `_____%` (target: 100%)
- [ ] Achievement page success rate: `_____%` (target: 100%)
- [ ] No unexpected errors: `_____` (target: 0)

### Decision Point
- [ ] ✅ All metrics good → Continue monitoring
- [ ] ⚠️ Minor issues detected → Document and monitor
- [ ] ❌ Critical issues → **EXECUTE ROLLBACK**

---

## Checkpoint 2: After 6 Hours

**Time**: `__________`

### Metrics Check
- [ ] 401 error rate: `_____%` (target: <1%)
- [ ] API success rate: `_____%` (maintained/improved)
- [ ] User reports: `_____` (target: 0)
- [ ] Performance: `_____` (stable)

### Data Recording
```
Before Fix:
- Bingo 401 errors: _____
- Achievement crashes: _____

After Fix (6 hours):
- Bingo 401 errors: _____ (authenticated users)
- Achievement crashes: _____
- New errors: _____
```

### Decision Point
- [ ] ✅ All metrics good → Continue to 24-hour check
- [ ] ⚠️ Issues detected → Plan fix or rollback
- [ ] ❌ Critical issues → **EXECUTE ROLLBACK**

---

## Checkpoint 3: After 24 Hours

**Time**: `__________`

### Final Validation
- [ ] All error metrics acceptable
- [ ] No authentication-related tickets
- [ ] User feedback positive
- [ ] Performance stable

### Success Criteria (All Must Pass)
1. [ ] Zero "No access token provided" (authenticated users)
2. [ ] Zero "ReferenceError: token is not defined"
3. [ ] Bingo/Achievement 100% functional
4. [ ] No performance degradation
5. [ ] No new unrelated errors

### Deployment Status
- [ ] ✅ **SUCCESS** → Mark complete in tasks.md
- [ ] ⚠️ **PARTIAL** → Document issues and plan fix
- [ ] ❌ **FAILED** → Rollback and investigate

---

## Rollback Procedure (Emergency)

### Rollback Trigger Conditions
Execute rollback immediately if:
- ❌ Any page completely broken
- ❌ Data loss or corruption
- ❌ Authentication completely broken
- ❌ Error rate spike >50%

### Rollback Steps (5 minutes)
```bash
# 1. Revert commit
git revert b3d43c7 --no-edit

# 2. Build
bun build

# 3. Deploy
git push origin claude/auth-token-error-fix

# 4. Verify
curl -I https://[production-url]/bingo

# 5. Notify team
# (Post in Slack #engineering)
```

### Post-Rollback
- [ ] Document rollback reason
- [ ] Analyze root cause
- [ ] Create fix plan
- [ ] Schedule re-deployment

---

## Communication Log

### Pre-Deployment Message
**Channel**: Slack #engineering
**Sent**: `__________`
```
Starting deployment of auth-token-error-fix at [TIME].
Expected duration: 15-20 minutes.
Monitoring for first 24 hours.
```

### Deployment Progress Updates
- [ ] "Deployment started" - Time: `__________`
- [ ] "Build completed" - Time: `__________`
- [ ] "Zeabur deployment in progress" - Time: `__________`
- [ ] "Smoke tests passed" - Time: `__________`
- [ ] "Deployment complete" - Time: `__________`

### Post-Deployment Message
**Channel**: Slack #general
**Sent**: `__________`
```
✅ Auth token error fix deployed successfully.
Bingo and Achievement pages now load without errors.
Monitoring for next 24 hours.
```

---

## Notes & Issues

### Deployment Notes
```
[Record any observations during deployment]
-
-
-
```

### Issues Encountered
```
[Record any issues and resolutions]
- Issue:
  Resolution:

- Issue:
  Resolution:
```

### Lessons Learned
```
[Record lessons for future deployments]
-
-
-
```

---

**Deployment Date**: `__________`
**Deployed By**: `__________`
**Completion Status**: [ ] Success / [ ] Partial / [ ] Failed / [ ] Rolled Back
**Final Sign-Off**: `__________`

---

**Last Updated**: 2025-10-29
