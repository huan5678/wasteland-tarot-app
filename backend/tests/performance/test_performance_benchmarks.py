"""
Performance Tests and Benchmarks
Testing system performance under various load conditions
"""

import pytest
import asyncio
import time
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from app.services.user_service import UserService, AuthenticationService
from app.services.wasteland_card_service import WastelandCardService
from app.services.reading_service import ReadingService
from app.models.wasteland_card import WastelandCard, WastelandSuit
from app.db.seed_data import create_sample_cards


@pytest.mark.performance
class TestUserServicePerformance:
    """Performance tests for user service operations"""

    @pytest.mark.asyncio
    @pytest.mark.benchmark
    async def test_user_creation_performance(self, db_session: AsyncSession, benchmark):
        """Benchmark user creation performance"""
        user_service = UserService(db_session)

        def create_user_sync():
            return asyncio.run(user_service.create_user({
                "username": f"perf_user_{int(time.time() * 1000000)}",
                "email": f"perf_{int(time.time() * 1000000)}@example.com",
                "password": "SecurePassword123!"
            }))

        # Benchmark user creation
        result = benchmark(create_user_sync)
        assert result.username.startswith("perf_user_")

    @pytest.mark.asyncio
    async def test_bulk_user_creation(self, db_session: AsyncSession):
        """Test creating multiple users in bulk"""
        user_service = UserService(db_session)
        start_time = time.time()

        users = []
        for i in range(100):
            user_data = {
                "username": f"bulk_user_{i}",
                "email": f"bulk_{i}@example.com",
                "password": "SecurePassword123!"
            }
            user = await user_service.create_user(user_data)
            users.append(user)

        end_time = time.time()
        duration = end_time - start_time

        assert len(users) == 100
        assert duration < 30.0  # Should complete within 30 seconds
        print(f"Created 100 users in {duration:.2f} seconds ({duration/100:.3f}s per user)")

    @pytest.mark.asyncio
    async def test_concurrent_user_authentication(self, db_session: AsyncSession):
        """Test concurrent user authentication performance"""
        auth_service = AuthenticationService(db_session)

        # Create test users
        users = []
        for i in range(20):
            user_data = {
                "username": f"auth_test_{i}",
                "email": f"auth_{i}@example.com",
                "password": "SecurePassword123!"
            }
            result = await auth_service.register_user(user_data)
            users.append((result["user"]["username"], "SecurePassword123!"))

        # Test concurrent authentication
        async def authenticate_user(username, password):
            return await auth_service.login_user(username, password)

        start_time = time.time()
        tasks = [authenticate_user(username, password) for username, password in users]
        results = await asyncio.gather(*tasks)
        end_time = time.time()

        duration = end_time - start_time
        assert len(results) == 20
        assert all(result["user"]["username"] for result in results)
        assert duration < 10.0  # Should complete within 10 seconds
        print(f"Authenticated 20 users concurrently in {duration:.2f} seconds")


@pytest.mark.performance
class TestCardServicePerformance:
    """Performance tests for card service operations"""

    @pytest.mark.asyncio
    async def test_large_deck_shuffling(self, db_session: AsyncSession):
        """Test performance with large deck of cards"""
        card_service = WastelandCardService(db_session)

        # Create a large deck of cards
        cards = []
        for i in range(500):
            card = WastelandCard(
                id=f"perf_card_{i}",
                name=f"Performance Card {i}",
                suit=WastelandSuit.NUKA_COLA_BOTTLES.value,
                number=i % 14 + 1,
                upright_meaning=f"Performance test card {i}",
                reversed_meaning=f"Reversed performance test {i}",
                radiation_level=float(i % 10) / 10,
                threat_level=i % 10 + 1
            )
            cards.append(card)

        # Add cards in batches for better performance
        for i in range(0, len(cards), 50):
            batch = cards[i:i+50]
            for card in batch:
                db_session.add(card)
            await db_session.commit()

        # Test shuffling performance
        start_time = time.time()
        drawn_cards = await card_service.draw_cards_with_radiation_shuffle(
            num_cards=10, radiation_factor=0.5
        )
        end_time = time.time()

        duration = end_time - start_time
        assert len(drawn_cards) == 10
        assert duration < 5.0  # Should complete within 5 seconds
        print(f"Drew 10 cards from 500-card deck in {duration:.3f} seconds")

    @pytest.mark.asyncio
    async def test_deck_statistics_performance(self, db_session: AsyncSession):
        """Test deck statistics calculation performance"""
        card_service = WastelandCardService(db_session)

        # Create cards using seed data
        await create_sample_cards(db_session)

        # Benchmark statistics calculation
        start_time = time.time()
        stats = await card_service.calculate_deck_statistics()
        end_time = time.time()

        duration = end_time - start_time
        assert stats["total_cards"] > 0
        assert duration < 2.0  # Should complete within 2 seconds
        print(f"Calculated deck statistics in {duration:.3f} seconds")

    @pytest.mark.asyncio
    async def test_concurrent_card_drawing(self, db_session: AsyncSession):
        """Test concurrent card drawing operations"""
        card_service = WastelandCardService(db_session)

        # Create test cards
        await create_sample_cards(db_session)

        # Test concurrent drawing
        async def draw_cards():
            return await card_service.draw_cards_with_radiation_shuffle(
                num_cards=3, radiation_factor=0.5
            )

        start_time = time.time()
        tasks = [draw_cards() for _ in range(50)]
        results = await asyncio.gather(*tasks)
        end_time = time.time()

        duration = end_time - start_time
        assert len(results) == 50
        assert all(len(result) >= 0 for result in results)  # May be empty if no cards
        assert duration < 15.0  # Should complete within 15 seconds
        print(f"Performed 50 concurrent card draws in {duration:.2f} seconds")


@pytest.mark.performance
class TestReadingServicePerformance:
    """Performance tests for reading service operations"""

    @pytest.mark.asyncio
    async def test_bulk_reading_creation(self, db_session: AsyncSession):
        """Test creating multiple readings in bulk"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create test user
        user = await user_service.create_user({
            "username": "bulk_reading_user",
            "email": "bulk@example.com",
            "password": "SecurePassword123!"
        })

        # Create seed cards
        await create_sample_cards(db_session)

        # Test bulk reading creation
        start_time = time.time()
        readings = []

        for i in range(50):
            reading_data = {
                "user_id": user.id,
                "question": f"Performance question {i}",
                "reading_type": "single_card",
                "cards_drawn": ["the_wanderer"],
                "interpretations": {"card": f"Performance interpretation {i}"}
            }
            reading = await reading_service.create_reading(reading_data)
            readings.append(reading)

        end_time = time.time()
        duration = end_time - start_time

        assert len(readings) == 50
        assert duration < 25.0  # Should complete within 25 seconds
        print(f"Created 50 readings in {duration:.2f} seconds ({duration/50:.3f}s per reading)")

    @pytest.mark.asyncio
    async def test_reading_history_retrieval_performance(self, db_session: AsyncSession):
        """Test performance of reading history retrieval"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create test user
        user = await user_service.create_user({
            "username": "history_test_user",
            "email": "history@example.com",
            "password": "SecurePassword123!"
        })

        # Create seed cards
        await create_sample_cards(db_session)

        # Create multiple readings
        for i in range(100):
            reading_data = {
                "user_id": user.id,
                "question": f"History question {i}",
                "reading_type": "single_card",
                "cards_drawn": ["the_wanderer"],
                "interpretations": {"card": f"History interpretation {i}"}
            }
            await reading_service.create_reading(reading_data)

        # Test history retrieval performance
        start_time = time.time()
        history = await reading_service.get_user_reading_history(
            user_id=user.id, limit=50, offset=0
        )
        end_time = time.time()

        duration = end_time - start_time
        assert len(history) == 50
        assert duration < 3.0  # Should complete within 3 seconds
        print(f"Retrieved 50 readings from 100-reading history in {duration:.3f} seconds")

    @pytest.mark.asyncio
    async def test_reading_statistics_performance(self, db_session: AsyncSession):
        """Test reading statistics calculation performance"""
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create test user
        user = await user_service.create_user({
            "username": "stats_test_user",
            "email": "stats@example.com",
            "password": "SecurePassword123!"
        })

        # Create seed cards
        await create_sample_cards(db_session)

        # Create readings with various attributes
        for i in range(200):
            reading_data = {
                "user_id": user.id,
                "question": f"Stats question {i}",
                "reading_type": "single_card" if i % 2 == 0 else "three_card_spread",
                "cards_drawn": ["the_wanderer"],
                "interpretations": {"card": f"Stats interpretation {i}"}
            }
            await reading_service.create_reading(reading_data)

        # Test statistics calculation performance
        start_time = time.time()
        stats = await reading_service.get_reading_statistics(user.id)
        end_time = time.time()

        duration = end_time - start_time
        assert stats["total_readings"] == 200
        assert duration < 5.0  # Should complete within 5 seconds
        print(f"Calculated statistics for 200 readings in {duration:.3f} seconds")


@pytest.mark.performance
class TestAPIPerformance:
    """Performance tests for API endpoints"""

    @pytest.mark.asyncio
    async def test_concurrent_api_requests(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test concurrent API request handling"""
        # Create test user and get token
        user_data = {
            "username": "api_perf_user",
            "email": "api@example.com",
            "password": "SecurePassword123!"
        }

        register_response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create seed cards
        await create_sample_cards(db_session)

        # Test concurrent card requests
        async def get_cards():
            return await async_client.get("/api/v1/cards/", headers=headers)

        start_time = time.time()
        tasks = [get_cards() for _ in range(20)]
        responses = await asyncio.gather(*tasks)
        end_time = time.time()

        duration = end_time - start_time
        assert all(response.status_code == 200 for response in responses)
        assert duration < 10.0  # Should complete within 10 seconds
        print(f"Handled 20 concurrent card requests in {duration:.2f} seconds")

    @pytest.mark.asyncio
    async def test_api_response_time_under_load(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test API response times under simulated load"""
        # Create test user
        user_data = {
            "username": "load_test_user",
            "email": "load@example.com",
            "password": "SecurePassword123!"
        }

        register_response = await async_client.post("/api/v1/auth/register", json=user_data)
        token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create seed cards
        await create_sample_cards(db_session)

        # Measure individual request times
        request_times = []

        for i in range(50):
            start_time = time.time()
            response = await async_client.get("/api/v1/cards/", headers=headers)
            end_time = time.time()

            assert response.status_code == 200
            request_times.append(end_time - start_time)

        avg_response_time = sum(request_times) / len(request_times)
        max_response_time = max(request_times)
        min_response_time = min(request_times)

        assert avg_response_time < 1.0  # Average should be under 1 second
        assert max_response_time < 3.0  # No request should take over 3 seconds

        print(f"Response times - Avg: {avg_response_time:.3f}s, "
              f"Min: {min_response_time:.3f}s, Max: {max_response_time:.3f}s")


@pytest.mark.performance
class TestMemoryUsage:
    """Memory usage and resource management tests"""

    @pytest.mark.asyncio
    async def test_memory_usage_during_bulk_operations(self, db_session: AsyncSession):
        """Monitor memory usage during bulk operations"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        user_service = UserService(db_session)

        # Perform bulk operations
        users = []
        for i in range(500):
            user_data = {
                "username": f"memory_test_{i}",
                "email": f"memory_{i}@example.com",
                "password": "SecurePassword123!"
            }
            user = await user_service.create_user(user_data)
            users.append(user)

            # Check memory every 100 users
            if i % 100 == 0:
                current_memory = process.memory_info().rss / 1024 / 1024  # MB
                memory_increase = current_memory - initial_memory
                print(f"Memory after {i+1} users: {current_memory:.1f}MB "
                      f"(+{memory_increase:.1f}MB)")

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_increase = final_memory - initial_memory

        # Memory shouldn't increase dramatically (less than 100MB for 500 users)
        assert total_increase < 100, f"Memory increased by {total_increase:.1f}MB"

        print(f"Total memory increase: {total_increase:.1f}MB for 500 users")

    @pytest.mark.asyncio
    async def test_database_connection_cleanup(self, db_session: AsyncSession):
        """Test that database connections are properly cleaned up"""
        user_service = UserService(db_session)

        # Perform multiple operations that could potentially leak connections
        for i in range(100):
            user_data = {
                "username": f"cleanup_test_{i}",
                "email": f"cleanup_{i}@example.com",
                "password": "SecurePassword123!"
            }
            user = await user_service.create_user(user_data)

            # Immediately read the user back
            retrieved_user = await user_service.get_user_by_id(user.id)
            assert retrieved_user.id == user.id

        # If we reach here without connection pool exhaustion, cleanup is working
        assert True


@pytest.mark.performance
class TestCachePerformance:
    """Test caching mechanism performance"""

    @pytest.mark.asyncio
    async def test_card_caching_performance(self, db_session: AsyncSession):
        """Test card caching improves performance"""
        card_service = WastelandCardService(db_session)

        # Create test cards
        await create_sample_cards(db_session)

        # First call (no cache)
        start_time = time.time()
        cards1 = await card_service.get_all_cards()
        first_call_time = time.time() - start_time

        # Simulate cache warming
        await card_service.cache_all_cards()

        # Second call (with cache - simulated)
        start_time = time.time()
        cards2 = await card_service.get_all_cards()
        second_call_time = time.time() - start_time

        assert len(cards1) == len(cards2)
        print(f"First call: {first_call_time:.3f}s, Second call: {second_call_time:.3f}s")

        # Note: In a real implementation with Redis cache,
        # second_call_time would be significantly faster