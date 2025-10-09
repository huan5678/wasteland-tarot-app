# Bingo API Tests - Comprehensive Review & Enhancement Plan

## Executive Summary

The existing `test_bingo_endpoints.py` provides a solid TDD foundation with **~40 test cases** covering the main happy paths and error scenarios. However, several critical test cases and best practices enhancements are needed to achieve bulletproof coverage.

**Current Coverage**: ~70%
**Target Coverage**: >90%
**Status**: NEEDS ENHANCEMENT ⚠️

---

## 1. Test Coverage Analysis

### ✅ What's Already Covered (Strengths)

#### Task 13: Bingo Card Endpoints
- ✅ POST /card success (201)
- ✅ POST /card duplicate (409)
- ✅ POST /card invalid numbers (400)
- ✅ GET /card success (200)
- ✅ GET /card not found (404)
- ✅ GET /status various states

#### Task 14: Daily Claim Endpoint
- ✅ POST /claim success (200)
- ✅ POST /claim already claimed (409)
- ✅ POST /claim no card (404)
- ✅ POST /claim no daily number (404)

#### Task 15: Query Endpoints
- ✅ GET /daily-number success/not found
- ✅ GET /lines various line counts
- ✅ GET /history success/not found
- ✅ GET /rewards success/empty

#### Task 16: Error Handling
- ✅ Basic error format validation
- ✅ Traditional Chinese message validation

---

### ⚠️ What's Missing (Critical Gaps)

#### 1. Authentication & Authorization Tests
```python
# MISSING: Comprehensive auth tests
- ❌ Unauthenticated requests (401)
- ❌ Expired token (401)
- ❌ Invalid token (401)
- ❌ Wrong user accessing another user's data (403)
- ❌ JWT token validation
```

#### 2. Input Validation Edge Cases
```python
# MISSING: Boundary value tests
- ❌ Empty card data []
- ❌ Null values in card
- ❌ Very large numbers (>25)
- ❌ Negative numbers
- ❌ Float numbers (1.5)
- ❌ String numbers ("1")
- ❌ Mixed types in array
```

#### 3. Concurrency & Race Conditions
```python
# MISSING: Concurrent request tests
- ❌ Multiple simultaneous card creation
- ❌ Multiple simultaneous claims
- ❌ Reward issued only once under concurrent claims
- ❌ Database constraint violations handling
```

#### 4. Line Detection Logic Tests
```python
# MISSING: Comprehensive line detection
- ❌ Test all 12 line types (5 rows, 5 cols, 2 diagonals)
- ❌ Test exact 3-line scenario (triggers reward)
- ❌ Test 4, 5 lines (no duplicate reward)
- ❌ Test bitmask calculation accuracy
- ❌ Test line detection performance (<10ms)
```

#### 5. Month Boundary & Transition Tests
```python
# MISSING: Time-based edge cases
- ❌ Creating card on last day of month
- ❌ Claiming on month transition (11:59 PM -> 12:00 AM)
- ❌ Accessing previous month card after reset
- ❌ History query for current month
```

#### 6. Reward Issuance Tests
```python
# MISSING: Reward logic tests
- ❌ Reward issued exactly once per month
- ❌ Attempting duplicate reward issuance
- ❌ Reward metadata validation
- ❌ Reward history archiving
```

#### 7. Database State Verification
```python
# MISSING: Database assertion tests
- ❌ Verify claim record created in DB
- ❌ Verify card state updated correctly
- ❌ Verify reward record persisted
- ❌ Verify UNIQUE constraints work
- ❌ Verify foreign key cascades
```

#### 8. Response Schema Validation
```python
# MISSING: Pydantic schema tests
- ❌ Response matches BingoCardResponse schema
- ❌ ClaimResponse schema validation
- ❌ Error response schema consistency
- ❌ All required fields present
- ❌ Optional fields handled correctly
```

#### 9. Performance & Load Tests
```python
# MISSING: Performance benchmarks
- ❌ API response time <200ms (p95)
- ❌ Line detection <10ms
- ❌ 100+ concurrent users
- ❌ Large dataset queries (history)
```

#### 10. Error Message i18n Tests
```python
# MISSING: Comprehensive i18n tests
- ❌ All error codes have Chinese messages
- ❌ No English leaking in error responses
- ❌ Proper encoding (UTF-8)
- ❌ Character set validation
```

---

## 2. Test Quality Issues

### Issue 1: Incomplete Fixtures

**Problem**: Missing critical fixtures for comprehensive testing

```python
# MISSING FIXTURES

@pytest_asyncio.fixture
async def auth_headers(test_user: Dict[str, Any]) -> Dict[str, str]:
    """Generate actual JWT token for testing"""
    # TODO: Implement real JWT generation
    pass

@pytest_asyncio.fixture
async def expired_auth_headers() -> Dict[str, str]:
    """Generate expired JWT token for 401 testing"""
    pass

@pytest_asyncio.fixture
async def user_with_one_line(db_session: AsyncSession) -> UserBingoCard:
    """User with exactly 1 complete line"""
    pass

@pytest_asyncio.fixture
async def user_with_two_lines(db_session: AsyncSession) -> UserBingoCard:
    """User with exactly 2 complete lines"""
    pass

@pytest_asyncio.fixture
async def different_user_card(db_session: AsyncSession) -> UserBingoCard:
    """Another user's card for 403 testing"""
    pass
```

**Recommendation**: Add these fixtures to enable comprehensive testing.

---

### Issue 2: Test Isolation Problems

**Problem**: Some tests may have side effects

```python
# PROBLEM: Shared database state

async def test_create_card_success(self, ...):
    # Creates a card
    # But doesn't clean up!
    # Next test may fail due to existing card

# SOLUTION: Use transaction rollback

@pytest_asyncio.fixture(autouse=True)
async def rollback_after_test(db_session: AsyncSession):
    """Ensure each test starts with clean state"""
    yield
    await db_session.rollback()
```

---

### Issue 3: Assertion Quality

**Problem**: Weak assertions that don't verify actual business logic

```python
# BAD: Only checks status code
assert response.status_code == 200

# GOOD: Checks status + data structure + values
assert response.status_code == 200
data = response.json()
assert data["line_count"] == 3
assert "row-0" in data["line_types"]
assert data["has_three_lines"] is True
assert data["reward_issued"] is True
```

**Recommendation**: Add specific value assertions in all tests.

---

### Issue 4: Missing AAA Pattern

**Problem**: Some tests don't follow Arrange-Act-Assert clearly

```python
# BAD: Unclear structure
async def test_something(self, client, db_session):
    response = await client.post(...)
    claim = UserNumberClaim(...)
    db_session.add(claim)
    assert response.status_code == 200

# GOOD: Clear AAA structure
async def test_something(self, client, db_session):
    # Arrange
    claim = UserNumberClaim(...)
    db_session.add(claim)
    await db_session.commit()

    # Act
    response = await client.post(...)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
```

---

## 3. Missing Test Scenarios

### Critical Scenario 1: Complete 3-Line Reward Flow

```python
@pytest.mark.asyncio
async def test_complete_three_line_reward_flow(
    client: AsyncClient,
    db_session: AsyncSession,
    valid_card_numbers: List[List[int]]
):
    """
    Test complete flow from card creation to reward issuance

    Scenario:
    1. User creates card
    2. User claims numbers over multiple days
    3. On day X, user completes 3rd line
    4. System automatically issues reward
    5. User cannot receive duplicate reward
    """
    # Arrange: Create card
    await client.post("/api/v1/bingo/card", json={"numbers": valid_card_numbers})

    # Arrange: Create daily numbers that will complete 3 lines
    # Row 0: [1, 6, 11, 16, 21]
    # Col 0: [1, 2, 3, 4, 5]
    # Diagonal: [1, 7, 13, 19, 25]
    # Overlapping numbers: 1 (in all three)
    # Unique numbers needed: [1,6,11,16,21, 2,3,4,5, 7,13,19,25] = 13 numbers

    numbers_to_claim = [1, 6, 11, 16, 21, 2, 3, 4, 5, 7, 13, 19, 25]

    for i, num in enumerate(numbers_to_claim):
        # Create daily number
        daily = DailyBingoNumber(
            date=date.today() + timedelta(days=i),
            number=num,
            cycle_number=1
        )
        db_session.add(daily)
        await db_session.commit()

        # Claim number
        response = await client.post("/api/v1/bingo/claim")
        assert response.status_code == 200

        data = response.json()

        # First 12 claims: no reward
        if i < 12:
            assert data["has_reward"] is False
        # 13th claim: completes 3rd line, issues reward
        else:
            assert data["line_count"] >= 3
            assert data["has_reward"] is True
            assert data["reward"] is not None

    # Verify reward in database
    result = await db_session.execute(
        select(BingoReward).where(BingoReward.user_id == "test-user-123")
    )
    reward = result.scalar_one()
    assert reward is not None
    assert len(reward.line_types) >= 3

    # Attempt to issue duplicate reward (should fail)
    # Claim another number
    daily = DailyBingoNumber(
        date=date.today() + timedelta(days=14),
        number=24,
        cycle_number=1
    )
    db_session.add(daily)
    await db_session.commit()

    response = await client.post("/api/v1/bingo/claim")
    data = response.json()

    # Should still report has_reward=True but reward=None (already issued)
    assert data["has_reward"] is True
    assert data["reward"] is None  # No new reward issued

    # Verify only ONE reward exists
    result = await db_session.execute(
        select(func.count()).select_from(BingoReward).where(BingoReward.user_id == "test-user-123")
    )
    count = result.scalar()
    assert count == 1
```

---

### Critical Scenario 2: Number Not On Card

```python
@pytest.mark.asyncio
async def test_claim_number_not_on_card(
    client: AsyncClient,
    db_session: AsyncSession
):
    """
    Test claiming a number that doesn't exist on user's card

    Expected: Claim succeeds but is_on_card=False, no line progress
    """
    # Arrange: Create card without number 13
    card_numbers = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 14, 15, 16],  # Skip 13
        [17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26]  # Invalid for testing
    ]

    await client.post("/api/v1/bingo/card", json={"numbers": card_numbers})

    # Arrange: Create daily number 13 (not on card)
    daily = DailyBingoNumber(date=date.today(), number=13, cycle_number=1)
    db_session.add(daily)
    await db_session.commit()

    # Act
    response = await client.post("/api/v1/bingo/claim")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["daily_number"] == 13
    assert data["is_on_card"] is False
    assert data["line_count"] == 0  # No line progress

    # Verify claim still recorded in DB
    result = await db_session.execute(
        select(UserNumberClaim).where(UserNumberClaim.number == 13)
    )
    claim = result.scalar_one()
    assert claim is not None
```

---

### Critical Scenario 3: Concurrent Card Creation

```python
@pytest.mark.asyncio
async def test_concurrent_card_creation_prevents_duplicate(
    client: AsyncClient,
    db_session: AsyncSession,
    valid_card_numbers: List[List[int]]
):
    """
    Test that concurrent card creation is prevented by DB constraint

    Expected: One succeeds (201), others fail (409)
    """
    import asyncio

    # Act: Send 5 simultaneous card creation requests
    tasks = [
        client.post("/api/v1/bingo/card", json={"numbers": valid_card_numbers})
        for _ in range(5)
    ]

    responses = await asyncio.gather(*tasks, return_exceptions=True)

    # Assert: Exactly one success
    success_count = sum(
        1 for r in responses
        if hasattr(r, 'status_code') and r.status_code == 201
    )
    conflict_count = sum(
        1 for r in responses
        if hasattr(r, 'status_code') and r.status_code == 409
    )

    assert success_count == 1, "Exactly one card creation should succeed"
    assert conflict_count == 4, "Four should fail with 409 Conflict"

    # Verify only ONE card exists in DB
    result = await db_session.execute(
        select(func.count()).select_from(UserBingoCard)
        .where(UserBingoCard.user_id == "test-user-123")
    )
    count = result.scalar()
    assert count == 1
```

---

## 4. Enhanced Fixtures Needed

```python
# /backend/tests/conftest.py

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> Dict[str, Any]:
    """Create test user with proper user model"""
    from app.models.user import User

    user = User(
        id="test-user-123",
        email="vault101@wasteland.com",
        username="vault_dweller_101",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username
    }


@pytest_asyncio.fixture
async def auth_headers(test_user: Dict[str, Any]) -> Dict[str, str]:
    """Generate valid JWT token"""
    from app.core.security import create_access_token

    token = create_access_token(data={"sub": test_user["id"]})

    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


@pytest_asyncio.fixture
async def expired_auth_headers() -> Dict[str, str]:
    """Generate expired JWT token for 401 testing"""
    from app.core.security import create_access_token
    from datetime import timedelta

    # Create token that expired 1 hour ago
    token = create_access_token(
        data={"sub": "test-user-123"},
        expires_delta=timedelta(hours=-1)
    )

    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


@pytest_asyncio.fixture
async def user_with_complete_row(
    db_session: AsyncSession,
    test_user: Dict[str, Any]
) -> UserBingoCard:
    """User with complete first row (5 numbers)"""
    card_numbers = [
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24],
        [5, 10, 15, 20, 25]
    ]

    card = UserBingoCard(
        user_id=test_user["id"],
        month_year=date.today().replace(day=1),
        card_data=card_numbers,
        is_active=True
    )
    db_session.add(card)
    await db_session.commit()
    await db_session.refresh(card)

    # Create claims for first row: [1, 6, 11, 16, 21]
    for num in [1, 6, 11, 16, 21]:
        claim = UserNumberClaim(
            user_id=test_user["id"],
            card_id=card.id,
            daily_number_id=f"daily-{num}",
            claim_date=date.today() - timedelta(days=25-num),
            number=num
        )
        db_session.add(claim)

    await db_session.commit()
    return card


@pytest_asyncio.fixture
async def daily_numbers_for_cycle(db_session: AsyncSession) -> List[DailyBingoNumber]:
    """Create 25 daily numbers for a complete cycle"""
    import random

    numbers = list(range(1, 26))
    random.shuffle(numbers)

    daily_numbers = []
    for i, num in enumerate(numbers):
        daily = DailyBingoNumber(
            date=date.today() - timedelta(days=24-i),
            number=num,
            cycle_number=1
        )
        db_session.add(daily)
        daily_numbers.append(daily)

    await db_session.commit()
    return daily_numbers
```

---

## 5. Parametrized Test Examples

```python
import pytest

@pytest.mark.parametrize("invalid_numbers,expected_error", [
    # Duplicate numbers
    ([[1,1,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]], "unique"),
    # Out of range (0)
    ([[0,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]], "between 1 and 25"),
    # Out of range (26)
    ([[1,2,3,4,26],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]], "between 1 and 25"),
    # Wrong size (4x4)
    ([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]], "exactly 5 rows"),
    # Missing numbers
    ([[1,2,3,4],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]], "exactly 5 numbers"),
])
@pytest.mark.asyncio
async def test_create_card_validation(
    client: AsyncClient,
    auth_headers: Dict[str, str],
    invalid_numbers: List[List[int]],
    expected_error: str
):
    """Parametrized test for all card validation scenarios"""
    response = await client.post(
        "/api/v1/bingo/card",
        json={"numbers": invalid_numbers},
        headers=auth_headers
    )

    assert response.status_code in [400, 422]
    data = response.json()

    # Verify error message contains expected substring
    error_message = data.get("message") or data.get("detail", "")
    assert expected_error.lower() in str(error_message).lower()
```

---

## 6. Performance Testing

```python
import pytest
import time

@pytest.mark.performance
@pytest.mark.asyncio
async def test_claim_endpoint_performance(
    client: AsyncClient,
    auth_headers: Dict[str, str],
    test_user_card: UserBingoCard,
    test_daily_number: DailyBingoNumber
):
    """Test that claim endpoint responds within 200ms (p95)"""
    response_times = []

    for _ in range(20):
        start = time.perf_counter()
        response = await client.post("/api/v1/bingo/claim", headers=auth_headers)
        end = time.perf_counter()

        response_times.append((end - start) * 1000)  # Convert to ms

        # Only first claim succeeds, rest are 409
        if response.status_code == 409:
            break

    # Calculate p95
    response_times.sort()
    p95_index = int(len(response_times) * 0.95)
    p95 = response_times[p95_index]

    print(f"\nClaim endpoint p95: {p95:.2f}ms")
    assert p95 < 200, f"p95 response time {p95:.2f}ms exceeds 200ms threshold"


@pytest.mark.performance
@pytest.mark.asyncio
async def test_line_detection_performance(
    client: AsyncClient,
    auth_headers: Dict[str, str],
    user_with_complete_row: UserBingoCard
):
    """Test that line detection completes within 10ms"""
    response_times = []

    for _ in range(10):
        start = time.perf_counter()
        response = await client.get("/api/v1/bingo/lines", headers=auth_headers)
        end = time.perf_counter()

        response_times.append((end - start) * 1000)

    avg_time = sum(response_times) / len(response_times)

    print(f"\nLine detection average: {avg_time:.2f}ms")
    assert avg_time < 10, f"Line detection {avg_time:.2f}ms exceeds 10ms threshold"
```

---

## 7. Action Items

### Immediate (Priority 1) ⚠️

1. **Add Authentication Tests**
   - Implement proper JWT fixtures
   - Test 401 Unauthorized scenarios
   - Test 403 Forbidden scenarios

2. **Complete Input Validation Tests**
   - Add parametrized tests for all invalid inputs
   - Test boundary values (0, 26, null, etc.)

3. **Add Database Verification**
   - Assert DB state after mutations
   - Verify constraints work correctly

### Short-term (Priority 2) 📋

4. **Add Line Detection Tests**
   - Test all 12 line patterns
   - Test exact 3-line scenario
   - Test performance (<10ms)

5. **Add Concurrency Tests**
   - Test concurrent card creation
   - Test concurrent claims
   - Test reward idempotency

6. **Add Month Boundary Tests**
   - Test transitions at midnight
   - Test history queries

### Long-term (Priority 3) 🎯

7. **Add Performance Tests**
   - Load testing (100+ concurrent users)
   - Response time benchmarks
   - Database query optimization

8. **Add Integration Tests**
   - Complete user journey tests
   - Multi-day claim scenarios
   - Monthly reset simulation

---

## 8. Test Execution Plan

### Running Tests

```bash
# Run all bingo tests
cd backend
source .venv/bin/activate
pytest tests/api/test_bingo_endpoints.py -v

# Run with coverage
pytest tests/api/test_bingo_endpoints.py --cov=app.api.v1.endpoints.bingo --cov-report=html

# Run performance tests only
pytest tests/api/test_bingo_endpoints.py -m performance

# Run slow tests
pytest tests/api/test_bingo_endpoints.py -m slow

# Run specific test class
pytest tests/api/test_bingo_endpoints.py::TestDailyClaim -v
```

### Coverage Target

```
Minimum Coverage: 90%
Current Coverage: ~70% (estimated)

Gap: 20% → ~15 additional test cases needed
```

---

## 9. Test Documentation

### Naming Convention

```python
# GOOD: Descriptive test names
async def test_claim_success_when_number_on_card_and_completes_first_line()

# BAD: Vague test names
async def test_claim()
async def test_claim_works()
```

### Docstrings

```python
async def test_name(self, ...):
    """
    Test Description: What is being tested

    Scenario:
    - Setup condition 1
    - Setup condition 2

    Expected Behavior:
    - Outcome 1
    - Outcome 2

    Edge Cases:
    - Edge case 1
    - Edge case 2
    """
```

---

## 10. Recommended Test Structure

```
tests/api/test_bingo_endpoints.py (current)
tests/api/test_bingo_line_detection.py (NEW - dedicated line detection tests)
tests/api/test_bingo_concurrency.py (NEW - concurrency tests)
tests/api/test_bingo_performance.py (NEW - performance benchmarks)
tests/integration/test_bingo_flow.py (NEW - E2E integration tests)
```

---

## Conclusion

The existing test suite provides a solid foundation but requires significant enhancements to achieve production-ready quality. Focus on:

1. ✅ **Authentication testing** (Priority 1)
2. ✅ **Input validation** (Priority 1)
3. ✅ **Database verification** (Priority 1)
4. ✅ **Line detection logic** (Priority 2)
5. ✅ **Concurrency handling** (Priority 2)

**Next Steps**:
1. Implement Priority 1 action items
2. Run coverage report
3. Add missing test cases iteratively
4. Achieve >90% coverage before considering Tasks 13-16 complete

**Estimated Effort**: 8-12 hours of focused testing work

---

## Appendix: Test Checklist

Use this checklist when implementing API endpoints:

- [ ] Happy path (200/201) with valid data
- [ ] All error paths (400, 401, 403, 404, 409)
- [ ] Authentication required (401)
- [ ] Authorization (403 if accessing other user's data)
- [ ] Input validation (400/422 for invalid data)
- [ ] Database state verification after mutation
- [ ] Response schema validation
- [ ] Error message in Traditional Chinese
- [ ] Idempotency (where applicable)
- [ ] Concurrency safety
- [ ] Performance benchmarks
- [ ] Edge cases (boundary values, null, empty)

**Status**: Ready for implementation review! 🚀
