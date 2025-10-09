# Bingo API Developer Checklist

## 🎯 Purpose

This checklist ensures the FastAPI Developer implements all API endpoints correctly according to TDD principles and passes all test cases.

---

## 📋 Pre-Implementation Checklist

### Environment Setup

- [ ] Backend virtual environment activated (`.venv`)
- [ ] All dependencies installed (`uv sync`)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Test database configured
- [ ] Redis cache running (if needed)

### Review Requirements

- [ ] Read `requirements.md` (feature requirements)
- [ ] Read `design.md` (technical design)
- [ ] Review `tasks.md` (Tasks 13-16)
- [ ] Understand test expectations in `test_bingo_endpoints.py`
- [ ] Review `BINGO_TEST_REVIEW.md` (test coverage gaps)

---

## 🛠️ Implementation Checklist

### Task 13: Bingo Card Endpoints

#### File: `backend/app/api/v1/endpoints/bingo.py`

**POST /api/v1/bingo/card**

- [ ] Create router with JWT authentication dependency
- [ ] Import `BingoCardManagerService`
- [ ] Parse request body (`BingoCardCreate` schema)
- [ ] Call `service.create_card(user_id, numbers)`
- [ ] Return `BingoCardResponse` (201 Created)
- [ ] Handle `CardAlreadyExistsError` → 409 Conflict
- [ ] Handle `InvalidCardNumbersError` → 400 Bad Request
- [ ] Handle Pydantic validation errors → 422 Unprocessable Entity
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestBingoCardCreation -v`

**GET /api/v1/bingo/card**

- [ ] Get current user from JWT
- [ ] Call `service.get_user_card(user_id)`
- [ ] Return `BingoCardResponse` (200 OK)
- [ ] Handle `NoCardFoundError` → 404 Not Found
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestGetBingoCard -v`

**GET /api/v1/bingo/status**

- [ ] Get current user from JWT
- [ ] Fetch user's bingo card (if exists)
- [ ] Fetch today's daily number (if exists)
- [ ] Fetch user's claimed numbers for current month
- [ ] Fetch line count using `LineDetectionService`
- [ ] Check if reward issued
- [ ] Check if today already claimed
- [ ] Return `BingoStatusResponse` (200 OK)
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestBingoStatus -v`

---

### Task 14: Daily Claim Endpoint

#### File: `backend/app/api/v1/endpoints/bingo.py`

**POST /api/v1/bingo/claim**

- [ ] Get current user from JWT
- [ ] Get today's date
- [ ] Call `DailyClaimService.claim_daily_number(user_id, today)`
- [ ] Service should:
  - [ ] Verify user has bingo card
  - [ ] Verify daily number exists
  - [ ] Verify not already claimed today
  - [ ] Create claim record
  - [ ] Check if number on card
  - [ ] Calculate line count (using `LineDetectionService`)
  - [ ] Issue reward if 3+ lines and not issued before
- [ ] Return `ClaimResponse` (200 OK)
- [ ] Handle `NoCardFoundError` → 404 Not Found
- [ ] Handle `NoDailyNumberError` → 404 Not Found
- [ ] Handle `AlreadyClaimedError` → 409 Conflict
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestDailyClaim -v`

**Critical Logic**:
```python
# Pseudocode for claim endpoint
async def claim_daily_number(user_id: str, today: date):
    # 1. Get user's card (or 404)
    # 2. Get today's daily number (or 404)
    # 3. Check already claimed (or 409)
    # 4. Create claim record
    # 5. Check if number on card
    # 6. Get line count
    # 7. If line_count >= 3 and no reward yet:
    #      issue reward
    # 8. Return ClaimResponse
```

---

### Task 15: Query Endpoints

#### File: `backend/app/api/v1/endpoints/bingo.py`

**GET /api/v1/bingo/daily-number**

- [ ] Get today's date
- [ ] Query `DailyBingoNumber` for today
- [ ] Return `DailyNumberResponse` (200 OK)
- [ ] Handle not found → 404 Not Found
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestGetDailyNumber -v`

**GET /api/v1/bingo/lines**

- [ ] Get current user from JWT
- [ ] Get user's bingo card (or 404)
- [ ] Get user's claimed numbers
- [ ] Call `LineDetectionService.check_lines(card, claims)`
- [ ] Return `LineCheckResult` (200 OK)
- [ ] Handle `NoCardFoundError` → 404 Not Found
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestGetLines -v`

**GET /api/v1/bingo/history/{month}**

- [ ] Get current user from JWT
- [ ] Parse month parameter (validate format YYYY-MM)
- [ ] Query `UserBingoCardHistory` for user + month
- [ ] Query `UserNumberClaimHistory` for user + month
- [ ] Query `BingoRewardHistory` for user + month
- [ ] Calculate line count from historical data
- [ ] Return `BingoHistoryResponse` (200 OK)
- [ ] Handle invalid month format → 400 Bad Request
- [ ] Handle no data → 404 Not Found (or 200 with empty)
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestGetHistory -v`

**GET /api/v1/bingo/rewards**

- [ ] Get current user from JWT
- [ ] Query `BingoReward` for user (all months)
- [ ] Return `List[RewardResponse]` (200 OK)
- [ ] Empty list if no rewards
- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestGetRewards -v`

---

### Task 16: Error Handling

#### File: `backend/app/core/exceptions.py`

**Custom Exceptions** (Already defined ✅)

- [x] `CardAlreadyExistsError` (409)
- [x] `NoCardFoundError` (404)
- [x] `InvalidCardNumbersError` (400)
- [x] `AlreadyClaimedError` (409)
- [x] `PastDateClaimError` (400)
- [x] `NoDailyNumberError` (404)

#### File: `backend/app/main.py` or `backend/app/api/v1/__init__.py`

**Global Exception Handler**

- [ ] Register exception handlers for all custom exceptions
- [ ] Map exceptions to HTTP status codes
- [ ] Ensure error messages in Traditional Chinese
- [ ] Return consistent error format:
  ```json
  {
    "error": "ERROR_CODE",
    "message": "錯誤訊息（繁體中文）",
    "timestamp": "2025-10-02T12:34:56Z",
    "path": "/api/v1/bingo/card"
  }
  ```
- [ ] Handle Pydantic validation errors (422)
- [ ] Handle unexpected errors (500) without leaking internals

**Example Handler**:
```python
@app.exception_handler(CardAlreadyExistsError)
async def handle_card_exists(request: Request, exc: CardAlreadyExistsError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path)
        }
    )
```

- [ ] Test: `pytest tests/api/test_bingo_endpoints.py::TestErrorHandling -v`

---

## 🧪 Testing Checklist

### Run Tests Incrementally

```bash
# Task 13: Card endpoints
pytest tests/api/test_bingo_endpoints.py::TestBingoCardCreation -v
pytest tests/api/test_bingo_endpoints.py::TestGetBingoCard -v
pytest tests/api/test_bingo_endpoints.py::TestBingoStatus -v

# Task 14: Claim endpoint
pytest tests/api/test_bingo_endpoints.py::TestDailyClaim -v

# Task 15: Query endpoints
pytest tests/api/test_bingo_endpoints.py::TestGetDailyNumber -v
pytest tests/api/test_bingo_endpoints.py::TestGetLines -v
pytest tests/api/test_bingo_endpoints.py::TestGetHistory -v
pytest tests/api/test_bingo_endpoints.py::TestGetRewards -v

# Task 16: Error handling
pytest tests/api/test_bingo_endpoints.py::TestErrorHandling -v

# Enhanced tests
pytest tests/api/test_bingo_endpoints_enhanced.py::TestAuthentication -v
pytest tests/api/test_bingo_endpoints_enhanced.py::TestAuthorization -v
pytest tests/api/test_bingo_endpoints_enhanced.py::TestInputValidationEdgeCases -v
pytest tests/api/test_bingo_endpoints_enhanced.py::TestConcurrency -v
pytest tests/api/test_bingo_endpoints_enhanced.py::TestLineDetection -v
```

### Run All Tests

```bash
# All bingo tests
pytest tests/api/test_bingo_endpoints*.py -v

# With coverage
pytest tests/api/test_bingo_endpoints*.py --cov=app.api.v1.endpoints.bingo --cov-report=html

# With coverage report
open htmlcov/index.html
```

### Test Success Criteria

- [ ] All tests pass (0 failures)
- [ ] Coverage >85%
- [ ] No skipped tests (unless marked intentionally)
- [ ] No flaky tests (run 3 times, all pass)
- [ ] Performance tests pass (<200ms p95)

---

## 🔍 Code Review Checklist

### Code Quality

- [ ] Follows FastAPI best practices
- [ ] Uses dependency injection
- [ ] Proper async/await usage
- [ ] No N+1 query problems
- [ ] Proper transaction management
- [ ] Database session cleanup
- [ ] Error handling comprehensive
- [ ] Logging implemented (INFO, ERROR levels)

### Security

- [ ] JWT authentication on all endpoints
- [ ] User can only access own data
- [ ] Input validation (Pydantic)
- [ ] SQL injection prevention (SQLAlchemy ORM)
- [ ] No sensitive data in error messages
- [ ] Rate limiting (if needed)

### API Design

- [ ] RESTful conventions followed
- [ ] Correct HTTP status codes
- [ ] Proper request/response schemas
- [ ] Consistent error format
- [ ] API versioning (/api/v1)
- [ ] OpenAPI/Swagger docs generated

### Database

- [ ] UNIQUE constraints enforced
- [ ] Foreign keys properly set
- [ ] Indexes on query fields
- [ ] Proper cascade deletes
- [ ] Migrations reversible
- [ ] No data loss scenarios

---

## 📝 Documentation Checklist

### Code Documentation

- [ ] Docstrings on all endpoints
- [ ] Type hints on all functions
- [ ] Complex logic commented
- [ ] Service layer documented

### API Documentation

- [ ] OpenAPI spec generated
- [ ] Example requests/responses
- [ ] Error codes documented
- [ ] Authentication explained
- [ ] Swagger UI accessible at `/docs`

### Example Docstring:

```python
@router.post("/card", response_model=BingoCardResponse, status_code=201)
async def create_bingo_card(
    card_data: BingoCardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new bingo card for the current user.

    Creates a 5x5 bingo card with numbers 1-25 for the current month.
    Each user can only have one card per month.

    Args:
        card_data: BingoCardCreate schema with 5x5 number grid
        current_user: Authenticated user (from JWT)
        db: Database session

    Returns:
        BingoCardResponse: Created card with ID and metadata

    Raises:
        CardAlreadyExistsError (409): User already has card this month
        InvalidCardNumbersError (400): Numbers don't meet requirements
        HTTPException (401): Unauthenticated
        HTTPException (422): Invalid request body

    Example:
        POST /api/v1/bingo/card
        {
            "numbers": [
                [1, 6, 11, 16, 21],
                [2, 7, 12, 17, 22],
                ...
            ]
        }
    """
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests pass in CI/CD
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets properly stored
- [ ] Logs reviewed (no errors)
- [ ] Performance tested
- [ ] Security scan passed

### Deployment

- [ ] Database backup created
- [ ] Run migrations on production DB
- [ ] Deploy API server
- [ ] Verify health check endpoint
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Monitor response times

### Post-Deployment

- [ ] Smoke tests passed
- [ ] User acceptance testing
- [ ] Monitor logs for errors
- [ ] Check database performance
- [ ] Verify caching works
- [ ] Collect performance metrics

---

## 📊 Performance Benchmarks

### Response Time Targets

- [ ] GET /card: <100ms (p95)
- [ ] POST /card: <150ms (p95)
- [ ] POST /claim: <200ms (p95)
- [ ] GET /status: <150ms (p95)
- [ ] GET /lines: <100ms (p95)
- [ ] Line detection: <10ms

### Load Testing

- [ ] 100 concurrent users supported
- [ ] Database connection pool sized correctly
- [ ] No memory leaks
- [ ] Graceful degradation under load

---

## 🐛 Common Issues & Solutions

### Issue 1: Tests fail with "User not found"

**Solution**: Ensure test fixtures create users correctly and JWT tokens are valid.

### Issue 2: Tests fail with "Card already exists"

**Solution**: Ensure database cleanup between tests (use transaction rollback).

### Issue 3: Line detection tests fail

**Solution**: Double-check bitmask calculation logic in `LineDetectionService`.

### Issue 4: Concurrency tests fail randomly

**Solution**: Ensure proper database locking and transaction isolation.

### Issue 5: Error messages in English

**Solution**: Check `exceptions.py` messages are in Traditional Chinese.

---

## ✅ Final Sign-off

### Developer Confirmation

I confirm that:

- [ ] All API endpoints implemented
- [ ] All tests pass (74+ test cases)
- [ ] Code reviewed and approved
- [ ] Documentation complete
- [ ] Security requirements met
- [ ] Performance benchmarks met
- [ ] Error handling comprehensive
- [ ] Database migrations applied
- [ ] Ready for production deployment

**Developer Name**: ________________
**Date**: ________________
**Signature**: ________________

---

## 📞 Need Help?

### Resources

- **Test Review**: `BINGO_TEST_REVIEW.md`
- **Test Summary**: `TESTING_SUMMARY.md`
- **Requirements**: `.kiro/specs/daily-bingo-checkin/requirements.md`
- **Design**: `.kiro/specs/daily-bingo-checkin/design.md`
- **Tasks**: `.kiro/specs/daily-bingo-checkin/tasks.md`

### Questions?

Contact:
- **pytest Testing Specialist**: Review test expectations
- **Backend Lead**: Architecture questions
- **Product Owner**: Requirements clarification

---

**Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Ready for Implementation
