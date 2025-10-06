"""
Phase 4: Edge Cases and Error Handling Tests
Testing boundary conditions, error scenarios, and system limits
"""

import pytest
import asyncio
from typing import Dict, Any, List
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from app.services.user_service import UserService, AuthenticationService
from app.services.wasteland_card_service import WastelandCardService
from app.services.reading_service import ReadingService
from app.models.user import User
from app.models.wasteland_card import WastelandCard, WastelandSuit, KarmaAlignment
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    ReadingLimitExceededError,
    InsufficientPermissionsError,
    UserNotFoundError
)


@pytest.mark.edge_cases
class TestUserEdgeCases:
    """Test edge cases for user operations"""

    @pytest.mark.asyncio
    async def test_duplicate_username_registration(self, db_session: AsyncSession):
        """Test registering with duplicate username"""
        auth_service = AuthenticationService(db_session)

        # Create first user
        user_data = {
            "username": "duplicate_test",
            "email": "user1@example.com",
            "password": "SecurePassword123!"
        }
        await auth_service.register_user(user_data)

        # Try to create second user with same username
        duplicate_data = {
            "username": "duplicate_test",  # Same username
            "email": "user2@example.com",  # Different email
            "password": "SecurePassword123!"
        }

        with pytest.raises(UserAlreadyExistsError):
            await auth_service.register_user(duplicate_data)

    @pytest.mark.asyncio
    async def test_duplicate_email_registration(self, db_session: AsyncSession):
        """Test registering with duplicate email"""
        auth_service = AuthenticationService(db_session)

        # Create first user
        user_data = {
            "username": "user1",
            "email": "duplicate@example.com",
            "password": "SecurePassword123!"
        }
        await auth_service.register_user(user_data)

        # Try to create second user with same email
        duplicate_data = {
            "username": "user2",  # Different username
            "email": "duplicate@example.com",  # Same email
            "password": "SecurePassword123!"
        }

        with pytest.raises(UserAlreadyExistsError):
            await auth_service.register_user(duplicate_data)

    @pytest.mark.asyncio
    async def test_login_with_invalid_credentials(self, db_session: AsyncSession):
        """Test login with wrong password"""
        auth_service = AuthenticationService(db_session)

        # Create user
        user_data = {
            "username": "login_test",
            "email": "login@example.com",
            "password": "CorrectPassword123!"
        }
        await auth_service.register_user(user_data)

        # Try to login with wrong password
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login_user("login_test", "WrongPassword123!")

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, db_session: AsyncSession):
        """Test login with non-existent username"""
        auth_service = AuthenticationService(db_session)

        with pytest.raises(InvalidCredentialsError):
            await auth_service.login_user("nonexistent_user", "AnyPassword123!")

    @pytest.mark.asyncio
    async def test_account_lockout_after_failed_attempts(self, db_session: AsyncSession):
        """Test account lockout after multiple failed login attempts"""
        auth_service = AuthenticationService(db_session)

        # Create user
        user_data = {
            "username": "lockout_test",
            "email": "lockout@example.com",
            "password": "CorrectPassword123!"
        }
        await auth_service.register_user(user_data)

        # Attempt multiple failed logins
        for i in range(5):
            with pytest.raises(InvalidCredentialsError):
                await auth_service.login_user("lockout_test", "WrongPassword123!")

        # Account should now be locked
        from app.core.exceptions import AccountLockedError
        with pytest.raises(AccountLockedError):
            await auth_service.login_user("lockout_test", "CorrectPassword123!")

    @pytest.mark.asyncio
    async def test_inactive_user_login(self, db_session: AsyncSession):
        """Test login attempt for inactive user"""
        user_service = UserService(db_session)
        auth_service = AuthenticationService(db_session)

        # Create and then deactivate user
        user_data = {
            "username": "inactive_test",
            "email": "inactive@example.com",
            "password": "SecurePassword123!"
        }
        result = await auth_service.register_user(user_data)
        user = await user_service.get_user_by_id(result["user"]["id"])
        await user_service.deactivate_user(user.id)

        # Try to login
        from app.core.exceptions import AccountInactiveError
        with pytest.raises(AccountInactiveError):
            await auth_service.login_user("inactive_test", "SecurePassword123!")


@pytest.mark.edge_cases
class TestReadingEdgeCases:
    """Test edge cases for reading operations"""

    @pytest.mark.asyncio
    async def test_reading_with_invalid_user(self, db_session: AsyncSession):
        """Test creating reading with non-existent user"""
        reading_service = ReadingService(db_session)

        reading_data = {
            "user_id": "nonexistent_user_id",
            "question": "Test question",
            "reading_type": "single_card",
            "cards_drawn": ["test_card"],
            "interpretations": {"card": "Test interpretation"}
        }

        with pytest.raises(UserNotFoundError):
            await reading_service.create_reading(reading_data)

    @pytest.mark.asyncio
    async def test_empty_question_reading(self, db_session: AsyncSession):
        """Test creating reading with empty question"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create user
        user = await user_service.create_user({
            "username": "empty_question_test",
            "email": "empty@example.com",
            "password": "SecurePassword123!"
        })

        # Try to create reading with empty question
        reading_data = {
            "user_id": user.id,
            "question": "",  # Empty question
            "reading_type": "single_card",
            "cards_drawn": ["test_card"],
            "interpretations": {"card": "Test interpretation"}
        }

        # This should either raise an error or handle gracefully
        # Depending on validation requirements
        reading = await reading_service.create_reading(reading_data)
        assert reading.question == ""

    @pytest.mark.asyncio
    async def test_reading_with_very_long_question(self, db_session: AsyncSession):
        """Test creating reading with extremely long question"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create user
        user = await user_service.create_user({
            "username": "long_question_test",
            "email": "long@example.com",
            "password": "SecurePassword123!"
        })

        # Create reading with very long question (1000+ characters)
        long_question = "What does the future hold? " * 50  # ~1250 characters

        reading_data = {
            "user_id": user.id,
            "question": long_question,
            "reading_type": "single_card",
            "cards_drawn": ["test_card"],
            "interpretations": {"card": "Test interpretation"}
        }

        reading = await reading_service.create_reading(reading_data)
        assert reading.question == long_question
        assert len(reading.question) > 1000

    @pytest.mark.asyncio
    async def test_reading_with_special_characters(self, db_session: AsyncSession):
        """Test creating reading with special characters and unicode"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create user
        user = await user_service.create_user({
            "username": "unicode_test",
            "email": "unicode@example.com",
            "password": "SecurePassword123!"
        })

        # Question with special characters and unicode
        special_question = "What does 💀☢️🔮 the future hold for me? äöü测试中文🎭"

        reading_data = {
            "user_id": user.id,
            "question": special_question,
            "reading_type": "single_card",
            "cards_drawn": ["test_card"],
            "interpretations": {"card": "Test interpretation"}
        }

        reading = await reading_service.create_reading(reading_data)
        assert reading.question == special_question


@pytest.mark.edge_cases
class TestCardServiceEdgeCases:
    """Test edge cases for card service operations"""

    @pytest.mark.asyncio
    async def test_drawing_cards_with_empty_deck(self, db_session: AsyncSession):
        """Test drawing cards when no cards exist in database"""
        card_service = WastelandCardService(db_session)

        # Try to draw cards from empty deck
        drawn_cards = await card_service.draw_cards_with_radiation_shuffle(num_cards=5)
        assert drawn_cards == []

    @pytest.mark.asyncio
    async def test_drawing_more_cards_than_available(self, db_session: AsyncSession):
        """Test drawing more cards than exist in deck"""
        card_service = WastelandCardService(db_session)

        # Add only one card
        card = WastelandCard(
            id="single_card",
            name="Only Card",
            suit=WastelandSuit.MAJOR_ARCANA.value,
            upright_meaning="The only card available",
            reversed_meaning="Still the only card",
            radiation_level=1.0,
            threat_level=1
        )
        db_session.add(card)
        await db_session.commit()

        # Try to draw more cards than available
        drawn_cards = await card_service.draw_cards_with_radiation_shuffle(num_cards=10)
        assert len(drawn_cards) == 1  # Should only get the one available card

    @pytest.mark.asyncio
    async def test_extreme_radiation_factor(self, db_session: AsyncSession):
        """Test card drawing with extreme radiation factors"""
        card_service = WastelandCardService(db_session)

        # Add test card
        card = WastelandCard(
            id="radiation_test",
            name="Radiation Test Card",
            suit=WastelandSuit.RADIATION_RODS.value,
            upright_meaning="Highly radioactive",
            reversed_meaning="Nuclear chaos",
            radiation_level=10.0,
            threat_level=10
        )
        db_session.add(card)
        await db_session.commit()

        # Test with extreme radiation factors
        # Should handle gracefully without crashing
        drawn_cards_high = await card_service.draw_cards_with_radiation_shuffle(
            num_cards=1, radiation_factor=100.0
        )
        assert len(drawn_cards_high) == 1

        drawn_cards_negative = await card_service.draw_cards_with_radiation_shuffle(
            num_cards=1, radiation_factor=-50.0
        )
        assert len(drawn_cards_negative) == 1

    @pytest.mark.asyncio
    async def test_card_statistics_with_no_cards(self, db_session: AsyncSession):
        """Test deck statistics calculation with empty deck"""
        card_service = WastelandCardService(db_session)

        stats = await card_service.calculate_deck_statistics()

        assert stats["total_cards"] == 0
        assert stats["major_arcana_count"] == 0
        assert stats["minor_arcana_count"] == 0
        assert stats["average_radiation"] == 0.0
        assert stats["average_threat_level"] == 0.0
        assert stats["suit_distribution"] == {}


@pytest.mark.edge_cases
class TestAPIEdgeCases:
    """Test API edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_unauthenticated_access_to_protected_endpoints(self, async_client: AsyncClient):
        """Test accessing protected endpoints without authentication"""
        # Try to access user readings without auth
        response = await async_client.get("/api/v1/readings/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Try to create reading without auth
        reading_data = {
            "question": "Test question",
            "reading_type": "single_card"
        }
        response = await async_client.post("/api/v1/readings/", json=reading_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Try to access user profile without auth
        response = await async_client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_malformed_json_requests(self, async_client: AsyncClient):
        """Test API handling of malformed JSON"""
        # Test malformed registration request
        response = await async_client.post(
            "/api/v1/auth/register",
            content="invalid json content",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_invalid_content_type(self, async_client: AsyncClient):
        """Test API handling of invalid content types"""
        # Test registration with wrong content type
        user_data = {
            "username": "test_user",
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }

        response = await async_client.post(
            "/api/v1/auth/register",
            data=str(user_data),  # Send as string instead of JSON
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_nonexistent_endpoints(self, async_client: AsyncClient):
        """Test accessing non-existent endpoints"""
        response = await async_client.get("/api/v1/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        response = await async_client.post("/api/v1/invalid/endpoint")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_method_not_allowed(self, async_client: AsyncClient):
        """Test using wrong HTTP methods on endpoints"""
        # Try to POST to GET-only endpoint
        response = await async_client.post("/api/v1/cards/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # Try to GET on POST-only endpoint
        response = await async_client.get("/api/v1/auth/register")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.edge_cases
class TestConcurrencyEdgeCases:
    """Test concurrent operations and race conditions"""

    @pytest.mark.asyncio
    async def test_concurrent_user_registration(self, db_session: AsyncSession):
        """Test concurrent registration attempts with same username"""
        auth_service = AuthenticationService(db_session)

        async def register_user(suffix: str):
            user_data = {
                "username": "concurrent_test",  # Same username
                "email": f"user{suffix}@example.com",
                "password": "SecurePassword123!"
            }
            try:
                return await auth_service.register_user(user_data)
            except UserAlreadyExistsError:
                return None

        # Attempt concurrent registration
        tasks = [register_user(str(i)) for i in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Only one should succeed, others should fail
        successful_registrations = [r for r in results if r is not None and not isinstance(r, Exception)]
        assert len(successful_registrations) == 1

    @pytest.mark.asyncio
    async def test_concurrent_reading_creation(self, db_session: AsyncSession):
        """Test concurrent reading creation for same user"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create user
        user = await user_service.create_user({
            "username": "concurrent_reading_test",
            "email": "concurrent@example.com",
            "password": "SecurePassword123!"
        })

        async def create_reading(index: int):
            reading_data = {
                "user_id": user.id,
                "question": f"Question {index}",
                "reading_type": "single_card",
                "cards_drawn": [f"card_{index}"],
                "interpretations": {"card": f"Interpretation {index}"}
            }
            try:
                return await reading_service.create_reading(reading_data)
            except Exception as e:
                return e

        # Create multiple readings concurrently
        tasks = [create_reading(i) for i in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # All should succeed unless hitting daily limits
        successful_readings = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_readings) >= 1  # At least one should succeed


@pytest.mark.edge_cases
class TestDataIntegrityEdgeCases:
    """Test data integrity and validation edge cases"""

    @pytest.mark.asyncio
    async def test_sql_injection_attempts(self, db_session: AsyncSession):
        """Test that SQL injection attempts are handled safely"""
        user_service = UserService(db_session)

        # Attempt SQL injection in username
        malicious_username = "'; DROP TABLE users; --"

        user_data = {
            "username": malicious_username,
            "email": "hacker@example.com",
            "password": "SecurePassword123!"
        }

        # Should create user safely without executing SQL injection
        user = await user_service.create_user(user_data)
        assert user.username == malicious_username

        # Verify user can be retrieved (table wasn't dropped)
        retrieved_user = await user_service.get_user_by_username(malicious_username)
        assert retrieved_user is not None
        assert retrieved_user.username == malicious_username

    @pytest.mark.asyncio
    async def test_extremely_long_field_values(self, db_session: AsyncSession):
        """Test handling of extremely long field values"""
        user_service = UserService(db_session)

        # Create user with very long display name
        long_name = "A" * 1000

        user_data = {
            "username": "long_field_test",
            "email": "long@example.com",
            "password": "SecurePassword123!",
            "display_name": long_name
        }

        user = await user_service.create_user(user_data)
        assert user.display_name == long_name

    @pytest.mark.asyncio
    async def test_null_and_none_value_handling(self, db_session: AsyncSession):
        """Test handling of null and None values"""
        user_service = UserService(db_session)

        # Create user with minimal required fields
        user_data = {
            "username": "minimal_test",
            "email": "minimal@example.com",
            "password": "SecurePassword123!",
            "display_name": None,  # Explicitly None
            "vault_number": None,
            "wasteland_location": None
        }

        user = await user_service.create_user(user_data)
        assert user.username == "minimal_test"
        assert user.display_name == "minimal_test"  # Should default to username
        assert user.vault_number is None
        assert user.wasteland_location is None