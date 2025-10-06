"""
Reading Performance Tests
Comprehensive performance testing for reading creation, AI interpretation,
and card drawing operations in the Wasteland Tarot system.
"""

import pytest
import asyncio
import time
import statistics
from unittest.mock import AsyncMock, patch
from typing import Dict, Any, List
from datetime import datetime
import psutil
import gc

from app.models.user import User
from app.models.reading_enhanced import Reading, UserProfile
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.reading_service import ReadingService
from app.services.wasteland_card_service import WastelandCardService


class TestReadingPerformance:
    """Performance tests for reading operations"""

    @pytest.fixture
    def performance_user(self) -> User:
        """Create a user for performance testing"""
        user = User(
            id="perf_user",
            username="performance_tester",
            email="perf@test.com",
            karma_score=70,
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=100,
            is_active=True,
            is_premium=True
        )

        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            total_readings=100
        )

        user.profile = profile
        return user

    @pytest.fixture
    def large_card_deck(self) -> List[WastelandCard]:
        """Create a full 78-card deck for performance testing"""
        cards = []

        # Major Arcana (22 cards)
        for i in range(22):
            card = WastelandCard(
                id=f"major_{i:02d}",
                name=f"Major Arcana {i}",
                english_name=f"Major Arcana {i}",
                arcana_type="major",
                number=i,
                description=f"Major arcana card number {i} with detailed description for testing performance",
                radiation_level=0.1 + (i * 0.04),
                keywords=[f"keyword_{i}_1", f"keyword_{i}_2", f"keyword_{i}_3"]
            )
            cards.append(card)

        # Minor Arcana (56 cards)
        suits = ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]
        for suit in suits:
            for number in range(1, 15):  # Ace through King
                card = WastelandCard(
                    id=f"{suit}_{number:02d}",
                    name=f"{suit.replace('_', ' ').title()} {number}",
                    english_name=f"{suit.replace('_', ' ').title()} {number}",
                    arcana_type="minor",
                    number=number,
                    suit=suit,
                    description=f"Minor arcana {suit} {number} with performance testing description",
                    radiation_level=0.2 + (number * 0.05),
                    keywords=[f"{suit}_keyword_1", f"{suit}_keyword_2"]
                )
                cards.append(card)

        return cards

    @pytest.fixture
    def performance_baseline(self) -> Dict[str, float]:
        """Performance baseline expectations (in seconds)"""
        return {
            "single_reading_creation": 1.0,
            "three_card_reading": 1.5,
            "seven_card_reading": 2.0,
            "ai_interpretation_generation": 0.5,
            "card_shuffle_operation": 0.2,
            "database_query": 0.1,
            "user_statistics_calculation": 0.3,
            "reading_history_retrieval": 0.2
        }

    def measure_execution_time(self, func):
        """Decorator to measure function execution time"""
        async def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            result = await func(*args, **kwargs)
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            return result, execution_time
        return wrapper

    def measure_memory_usage(self):
        """Get current memory usage in MB"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024

    @pytest.mark.asyncio
    async def test_single_reading_creation_performance(
        self,
        db_session,
        performance_user,
        large_card_deck,
        performance_baseline
    ):
        """
        測試單張牌占卜創建的效能

        效能指標：
        - 執行時間 < 1秒
        - 記憶體使用穩定
        - CPU 使用合理
        - 無記憶體洩漏
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Warm up
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:1]):
            await reading_service._generate_interpretation(
                user=performance_user,
                cards=large_card_deck[:1],
                question="預熱測試",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Performance test
        execution_times = []
        memory_before = self.measure_memory_usage()

        for i in range(10):
            start_time = time.perf_counter()

            with patch.object(reading_service, '_get_user_with_validation', return_value=performance_user), \
                 patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:1]), \
                 patch.object(reading_service, '_check_daily_reading_limit'):

                reading_data = {
                    "user_id": performance_user.id,
                    "question": f"效能測試問題 {i}",
                    "reading_type": "single_card",
                    "num_cards": 1,
                    "character_voice": CharacterVoice.PIP_BOY,
                    "radiation_factor": 0.5
                }

                reading = await reading_service.create_reading(reading_data)

            end_time = time.perf_counter()
            execution_time = end_time - start_time
            execution_times.append(execution_time)

            # Verify reading was created successfully
            assert reading is not None
            assert reading.interpretation is not None

        memory_after = self.measure_memory_usage()

        # Performance assertions
        avg_time = statistics.mean(execution_times)
        max_time = max(execution_times)
        memory_growth = memory_after - memory_before

        assert avg_time < performance_baseline["single_reading_creation"], f"Average time {avg_time:.3f}s exceeds baseline {performance_baseline['single_reading_creation']}s"
        assert max_time < performance_baseline["single_reading_creation"] * 2, f"Max time {max_time:.3f}s too high"
        assert memory_growth < 50, f"Memory growth {memory_growth:.1f}MB too high"

        print(f"Single Reading Performance:")
        print(f"  Average time: {avg_time:.3f}s")
        print(f"  Max time: {max_time:.3f}s")
        print(f"  Memory growth: {memory_growth:.1f}MB")

    @pytest.mark.asyncio
    async def test_multi_card_reading_performance(
        self,
        db_session,
        performance_user,
        large_card_deck,
        performance_baseline
    ):
        """
        測試多張牌占卜的效能

        效能指標：
        - 3張牌 < 1.5秒
        - 7張牌 < 2.0秒
        - 線性擴展性
        - 記憶體效率
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        card_counts = [1, 3, 7]
        performance_results = {}

        for num_cards in card_counts:
            execution_times = []

            for i in range(5):  # 5 iterations per card count
                start_time = time.perf_counter()

                with patch.object(reading_service, '_get_user_with_validation', return_value=performance_user), \
                     patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:num_cards]), \
                     patch.object(reading_service, '_check_daily_reading_limit'):

                    reading_data = {
                        "user_id": performance_user.id,
                        "question": f"多張牌效能測試 {num_cards} 張",
                        "reading_type": "brotherhood_council" if num_cards == 7 else "vault_tec_spread" if num_cards == 3 else "single_card",
                        "num_cards": num_cards,
                        "character_voice": CharacterVoice.PIP_BOY,
                        "radiation_factor": 0.6
                    }

                    reading = await reading_service.create_reading(reading_data)

                end_time = time.perf_counter()
                execution_time = end_time - start_time
                execution_times.append(execution_time)

                # Verify reading quality scales with card count
                assert len(reading.cards_drawn) == num_cards
                assert len(reading.interpretation) > 50 * num_cards  # Interpretation should scale

            avg_time = statistics.mean(execution_times)
            performance_results[num_cards] = avg_time

            print(f"{num_cards} Card Reading: {avg_time:.3f}s average")

        # Performance assertions
        assert performance_results[3] < performance_baseline["three_card_reading"]
        assert performance_results[7] < performance_baseline["seven_card_reading"]

        # Test linear scalability (should be roughly proportional)
        scalability_ratio = performance_results[7] / performance_results[1]
        assert scalability_ratio < 10, f"Performance doesn't scale well: {scalability_ratio:.2f}x"

    @pytest.mark.asyncio
    async def test_ai_interpretation_generation_performance(
        self,
        db_session,
        performance_user,
        large_card_deck,
        performance_baseline
    ):
        """
        測試 AI 解釋生成的效能

        效能指標：
        - 基本解釋 < 0.5秒
        - 複雜解釋 < 1.0秒
        - 批量生成效率
        - 快取機制效果
        """
        reading_service = ReadingService(db_session)

        # Test basic interpretation performance
        basic_times = []
        for i in range(10):
            start_time = time.perf_counter()

            interpretation = await reading_service._generate_interpretation(
                user=performance_user,
                cards=large_card_deck[:1],
                question=f"基本解釋測試 {i}",
                character_voice=CharacterVoice.PIP_BOY
            )

            end_time = time.perf_counter()
            basic_times.append(end_time - start_time)

            assert len(interpretation) > 50

        # Test complex interpretation performance
        complex_times = []
        for i in range(5):
            start_time = time.perf_counter()

            interpretation = await reading_service._generate_interpretation(
                user=performance_user,
                cards=large_card_deck[:7],
                question=f"複雜解釋測試 {i} - 需要深度分析多張牌卡的相互關係和綜合意義",
                character_voice=CharacterVoice.PIP_BOY
            )

            end_time = time.perf_counter()
            complex_times.append(end_time - start_time)

            assert len(interpretation) > 200

        # Performance assertions
        avg_basic_time = statistics.mean(basic_times)
        avg_complex_time = statistics.mean(complex_times)

        assert avg_basic_time < performance_baseline["ai_interpretation_generation"]
        assert avg_complex_time < performance_baseline["ai_interpretation_generation"] * 2

        print(f"AI Interpretation Performance:")
        print(f"  Basic: {avg_basic_time:.3f}s average")
        print(f"  Complex: {avg_complex_time:.3f}s average")

    @pytest.mark.asyncio
    async def test_card_shuffle_algorithm_performance(
        self,
        db_session,
        large_card_deck,
        performance_baseline
    ):
        """
        測試牌卡洗牌演算法效能

        效能指標：
        - 78張牌洗牌 < 0.2秒
        - 不同輻射係數的影響
        - 記憶體使用穩定
        - 隨機性品質維持
        """
        card_service = WastelandCardService(db_session)

        radiation_factors = [0.1, 0.5, 0.9]
        shuffle_results = {}

        for radiation_factor in radiation_factors:
            shuffle_times = []

            for i in range(10):
                start_time = time.perf_counter()

                shuffled_deck = await card_service._apply_radiation_shuffle(
                    cards=large_card_deck.copy(),
                    radiation_factor=radiation_factor
                )

                end_time = time.perf_counter()
                shuffle_times.append(end_time - start_time)

                # Verify shuffle quality
                assert len(shuffled_deck) == len(large_card_deck)
                assert set(card.id for card in shuffled_deck) == set(card.id for card in large_card_deck)

            avg_time = statistics.mean(shuffle_times)
            shuffle_results[radiation_factor] = avg_time

            print(f"Shuffle (radiation {radiation_factor}): {avg_time:.4f}s average")

        # Performance assertions
        for radiation_factor, avg_time in shuffle_results.items():
            assert avg_time < performance_baseline["card_shuffle_operation"], f"Shuffle too slow for radiation {radiation_factor}: {avg_time:.4f}s"

        # Verify radiation factor doesn't significantly impact performance
        time_variance = max(shuffle_results.values()) - min(shuffle_results.values())
        assert time_variance < 0.1, f"Too much variance in shuffle times: {time_variance:.4f}s"

    @pytest.mark.asyncio
    async def test_database_query_performance(
        self,
        db_session,
        performance_user,
        performance_baseline
    ):
        """
        測試資料庫查詢效能

        效能指標：
        - 用戶查詢 < 0.1秒
        - 歷史記錄查詢 < 0.2秒
        - 統計查詢 < 0.3秒
        - 批量查詢效率
        """
        reading_service = ReadingService(db_session)

        # Create test data
        test_readings = []
        for i in range(50):
            reading = Reading(
                id=f"perf_reading_{i}",
                user_id=performance_user.id,
                question=f"效能測試問題 {i}",
                spread_type="single_card",
                cards_drawn=[{"id": f"card_{i}", "name": f"Card {i}"}],
                interpretation=f"效能測試解釋 {i}",
                character_voice=CharacterVoice.PIP_BOY.value,
                accuracy_rating=4 + (i % 2),
                created_at=datetime.utcnow()
            )
            test_readings.append(reading)
            db_session.add(reading)

        await db_session.commit()

        # Test user reading history query
        history_times = []
        for i in range(10):
            start_time = time.perf_counter()

            history = await reading_service.get_user_reading_history(
                user_id=performance_user.id,
                limit=20,
                offset=i * 2
            )

            end_time = time.perf_counter()
            history_times.append(end_time - start_time)

            assert len(history) > 0

        # Test statistics calculation
        stats_times = []
        for i in range(5):
            start_time = time.perf_counter()

            stats = await reading_service.get_reading_statistics(performance_user.id)

            end_time = time.perf_counter()
            stats_times.append(end_time - start_time)

            assert stats["total_readings"] > 0

        # Performance assertions
        avg_history_time = statistics.mean(history_times)
        avg_stats_time = statistics.mean(stats_times)

        assert avg_history_time < performance_baseline["reading_history_retrieval"]
        assert avg_stats_time < performance_baseline["user_statistics_calculation"]

        print(f"Database Query Performance:")
        print(f"  History: {avg_history_time:.4f}s average")
        print(f"  Statistics: {avg_stats_time:.4f}s average")

    @pytest.mark.asyncio
    async def test_concurrent_reading_creation_performance(
        self,
        db_session,
        large_card_deck
    ):
        """
        測試並發占卜創建效能

        效能指標：
        - 10個並發請求完成時間
        - 資源競爭最小化
        - 錯誤率 < 1%
        - 記憶體使用線性增長
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create multiple users for concurrent testing
        users = []
        for i in range(10):
            user = User(
                id=f"concurrent_user_{i}",
                username=f"concurrent_{i}",
                email=f"concurrent{i}@test.com",
                karma_score=50 + i,
                is_active=True
            )
            users.append(user)
            db_session.add(user)

        await db_session.commit()

        # Concurrent reading creation
        async def create_reading_for_user(user, index):
            try:
                with patch.object(reading_service, '_get_user_with_validation', return_value=user), \
                     patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:1]), \
                     patch.object(reading_service, '_check_daily_reading_limit'):

                    reading_data = {
                        "user_id": user.id,
                        "question": f"並發測試問題 {index}",
                        "reading_type": "single_card",
                        "num_cards": 1,
                        "character_voice": CharacterVoice.PIP_BOY,
                        "radiation_factor": 0.5
                    }

                    reading = await reading_service.create_reading(reading_data)
                    return reading, None

            except Exception as e:
                return None, e

        # Measure concurrent execution
        memory_before = self.measure_memory_usage()
        start_time = time.perf_counter()

        tasks = [create_reading_for_user(user, i) for i, user in enumerate(users)]
        results = await asyncio.gather(*tasks)

        end_time = time.perf_counter()
        memory_after = self.measure_memory_usage()

        # Analyze results
        successful_readings = [result[0] for result in results if result[0] is not None]
        errors = [result[1] for result in results if result[1] is not None]

        total_time = end_time - start_time
        success_rate = len(successful_readings) / len(users)
        memory_growth = memory_after - memory_before

        # Performance assertions
        assert total_time < 5.0, f"Concurrent operations too slow: {total_time:.2f}s"
        assert success_rate >= 0.99, f"Too many errors: {success_rate:.2%} success rate"
        assert memory_growth < 100, f"Memory growth too high: {memory_growth:.1f}MB"

        print(f"Concurrent Performance:")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Success rate: {success_rate:.2%}")
        print(f"  Memory growth: {memory_growth:.1f}MB")
        print(f"  Errors: {len(errors)}")

    @pytest.mark.asyncio
    async def test_memory_usage_patterns(
        self,
        db_session,
        performance_user,
        large_card_deck
    ):
        """
        測試記憶體使用模式

        效能指標：
        - 無記憶體洩漏
        - 垃圾回收效率
        - 大數據處理穩定性
        - 長時間運行穩定性
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        memory_snapshots = []
        initial_memory = self.measure_memory_usage()
        memory_snapshots.append(initial_memory)

        # Simulate long-running session with many readings
        for cycle in range(5):
            cycle_memory_before = self.measure_memory_usage()

            # Create multiple readings in this cycle
            for i in range(10):
                with patch.object(reading_service, '_get_user_with_validation', return_value=performance_user), \
                     patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:3]), \
                     patch.object(reading_service, '_check_daily_reading_limit'):

                    reading_data = {
                        "user_id": performance_user.id,
                        "question": f"記憶體測試 cycle {cycle} reading {i}",
                        "reading_type": "three_card",
                        "num_cards": 3,
                        "character_voice": CharacterVoice.PIP_BOY,
                        "radiation_factor": 0.5
                    }

                    reading = await reading_service.create_reading(reading_data)
                    assert reading is not None

                    # Manually trigger garbage collection
                    if i % 3 == 0:
                        gc.collect()

            cycle_memory_after = self.measure_memory_usage()
            memory_snapshots.append(cycle_memory_after)

            cycle_growth = cycle_memory_after - cycle_memory_before
            print(f"Cycle {cycle}: {cycle_growth:.1f}MB growth")

        final_memory = self.measure_memory_usage()
        total_growth = final_memory - initial_memory

        # Memory usage assertions
        assert total_growth < 200, f"Total memory growth too high: {total_growth:.1f}MB"

        # Check for memory leaks (growth should stabilize)
        recent_growths = [
            memory_snapshots[i] - memory_snapshots[i-1]
            for i in range(-3, 0)  # Last 3 cycles
        ]

        avg_recent_growth = statistics.mean(recent_growths)
        assert avg_recent_growth < 50, f"Memory leak detected: {avg_recent_growth:.1f}MB per cycle"

        print(f"Memory Usage Analysis:")
        print(f"  Initial: {initial_memory:.1f}MB")
        print(f"  Final: {final_memory:.1f}MB")
        print(f"  Total growth: {total_growth:.1f}MB")
        print(f"  Average recent growth: {avg_recent_growth:.1f}MB/cycle")

    @pytest.mark.asyncio
    async def test_large_deck_handling_performance(
        self,
        db_session,
        performance_user
    ):
        """
        測試大牌組處理效能

        效能指標：
        - 擴展到更大牌組的效能
        - 複雜查詢的處理
        - 記憶體效率
        - 算法複雜度驗證
        """
        card_service = WastelandCardService(db_session)

        # Create progressively larger decks
        deck_sizes = [78, 156, 312]  # 1x, 2x, 4x standard deck
        performance_results = {}

        for deck_size in deck_sizes:
            # Create large deck
            large_deck = []
            for i in range(deck_size):
                card = WastelandCard(
                    id=f"large_deck_card_{i}",
                    name=f"Large Deck Card {i}",
                    arcana_type="major" if i % 22 < 22 else "minor",
                    number=i % 22,
                    description=f"Large deck test card {i}",
                    radiation_level=0.1 + (i * 0.001) % 0.9
                )
                large_deck.append(card)

            # Measure shuffle performance
            shuffle_times = []
            for _ in range(3):  # Fewer iterations for large decks
                start_time = time.perf_counter()

                shuffled = await card_service._apply_radiation_shuffle(
                    cards=large_deck.copy(),
                    radiation_factor=0.5
                )

                end_time = time.perf_counter()
                shuffle_times.append(end_time - start_time)

                assert len(shuffled) == deck_size

            avg_shuffle_time = statistics.mean(shuffle_times)
            performance_results[deck_size] = avg_shuffle_time

            print(f"Deck size {deck_size}: {avg_shuffle_time:.4f}s shuffle time")

        # Analyze scalability
        baseline_time = performance_results[78]
        for deck_size in [156, 312]:
            scaling_factor = deck_size / 78
            time_factor = performance_results[deck_size] / baseline_time

            # Should scale roughly linearly or better
            assert time_factor < scaling_factor * 2, f"Poor scaling for deck size {deck_size}: {time_factor:.2f}x vs {scaling_factor:.2f}x expected"

        print(f"Scalability Analysis:")
        for deck_size, time in performance_results.items():
            scaling = time / baseline_time
            print(f"  {deck_size} cards: {scaling:.2f}x time")

    @pytest.mark.asyncio
    async def test_api_response_time_under_load(
        self,
        db_session,
        performance_user,
        large_card_deck
    ):
        """
        測試負載下的 API 響應時間

        效能指標：
        - 持續負載下的響應時間
        - 95th percentile < 2秒
        - 99th percentile < 5秒
        - 吞吐量穩定性
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        response_times = []
        error_count = 0

        # Simulate sustained load
        for request_num in range(50):
            try:
                start_time = time.perf_counter()

                with patch.object(reading_service, '_get_user_with_validation', return_value=performance_user), \
                     patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:1]), \
                     patch.object(reading_service, '_check_daily_reading_limit'):

                    reading_data = {
                        "user_id": performance_user.id,
                        "question": f"負載測試請求 {request_num}",
                        "reading_type": "single_card",
                        "num_cards": 1,
                        "character_voice": CharacterVoice.PIP_BOY,
                        "radiation_factor": 0.5
                    }

                    reading = await reading_service.create_reading(reading_data)

                end_time = time.perf_counter()
                response_time = end_time - start_time
                response_times.append(response_time)

                assert reading is not None

                # Add small delay to simulate realistic load
                await asyncio.sleep(0.01)

            except Exception as e:
                error_count += 1
                print(f"Error in request {request_num}: {e}")

        # Calculate percentiles
        response_times.sort()
        p50 = response_times[len(response_times) // 2]
        p95 = response_times[int(len(response_times) * 0.95)]
        p99 = response_times[int(len(response_times) * 0.99)]

        avg_response_time = statistics.mean(response_times)
        error_rate = error_count / 50

        # Performance assertions
        assert avg_response_time < 1.0, f"Average response time too high: {avg_response_time:.3f}s"
        assert p95 < 2.0, f"95th percentile too high: {p95:.3f}s"
        assert p99 < 5.0, f"99th percentile too high: {p99:.3f}s"
        assert error_rate < 0.02, f"Error rate too high: {error_rate:.2%}"

        print(f"Load Test Results:")
        print(f"  Average: {avg_response_time:.3f}s")
        print(f"  50th percentile: {p50:.3f}s")
        print(f"  95th percentile: {p95:.3f}s")
        print(f"  99th percentile: {p99:.3f}s")
        print(f"  Error rate: {error_rate:.2%}")
        print(f"  Total requests: {len(response_times)}")

    @pytest.mark.asyncio
    async def test_performance_regression_detection(
        self,
        db_session,
        performance_user,
        large_card_deck,
        performance_baseline
    ):
        """
        測試效能回歸偵測

        效能指標：
        - 與baseline的比較
        - 效能趨勢分析
        - 異常偵測
        - 效能報告生成
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Test each operation type
        operations = {
            "single_reading": ("single_reading_creation", 1),
            "three_card_reading": ("three_card_reading", 3),
            "seven_card_reading": ("seven_card_reading", 7)
        }

        performance_report = {}

        for operation_name, (baseline_key, num_cards) in operations.items():
            execution_times = []

            for i in range(5):
                start_time = time.perf_counter()

                with patch.object(reading_service, '_get_user_with_validation', return_value=performance_user), \
                     patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=large_card_deck[:num_cards]), \
                     patch.object(reading_service, '_check_daily_reading_limit'):

                    reading_data = {
                        "user_id": performance_user.id,
                        "question": f"回歸測試 {operation_name} {i}",
                        "reading_type": "brotherhood_council" if num_cards == 7 else "vault_tec_spread" if num_cards == 3 else "single_card",
                        "num_cards": num_cards,
                        "character_voice": CharacterVoice.PIP_BOY,
                        "radiation_factor": 0.5
                    }

                    reading = await reading_service.create_reading(reading_data)

                end_time = time.perf_counter()
                execution_time = end_time - start_time
                execution_times.append(execution_time)

            avg_time = statistics.mean(execution_times)
            baseline_time = performance_baseline[baseline_key]
            performance_ratio = avg_time / baseline_time

            performance_report[operation_name] = {
                "avg_time": avg_time,
                "baseline_time": baseline_time,
                "performance_ratio": performance_ratio,
                "status": "PASS" if performance_ratio <= 1.5 else "WARN" if performance_ratio <= 2.0 else "FAIL"
            }

            # Performance regression check
            assert performance_ratio <= 2.0, f"Performance regression detected for {operation_name}: {performance_ratio:.2f}x baseline"

        # Generate performance report
        print(f"\nPerformance Regression Report:")
        print(f"{'Operation':<20} {'Current':<10} {'Baseline':<10} {'Ratio':<8} {'Status'}")
        print("-" * 60)

        for operation, results in performance_report.items():
            print(f"{operation:<20} {results['avg_time']:<10.3f} {results['baseline_time']:<10.3f} {results['performance_ratio']:<8.2f} {results['status']}")

        # Overall performance score
        overall_ratio = statistics.mean([r['performance_ratio'] for r in performance_report.values()])
        print(f"\nOverall Performance Ratio: {overall_ratio:.2f}x baseline")

        if overall_ratio <= 1.2:
            print("Performance Status: EXCELLENT")
        elif overall_ratio <= 1.5:
            print("Performance Status: GOOD")
        elif overall_ratio <= 2.0:
            print("Performance Status: ACCEPTABLE")
        else:
            print("Performance Status: NEEDS OPTIMIZATION")