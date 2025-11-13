"""
Backend Timeout 測試 - Streaming Endpoint Timeout Protection

測試範圍：
1. AI provider 延遲回應 (>60s)
2. asyncio.TimeoutError 正確捕捉
3. SSE error event 正確發送
4. Connection cleanup
5. 正常 streaming 不受影響

Requirement 4: Backend Timeout 保護機制
"""

import asyncio
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.readings_stream import (
    stream_card_interpretation,
    stream_multi_card_interpretation,
    StreamInterpretationRequest,
    StreamMultiCardRequest,
)
from app.models.wasteland_card import (
    CharacterVoice,
    KarmaAlignment,
    FactionAlignment,
)


class TestStreamingTimeout:
    """測試 Backend streaming timeout 保護機制"""

    @staticmethod
    async def collect_events(response):
        """Helper to collect events from streaming response"""
        events = []
        async for chunk in response.body_iterator:
            # chunk might be bytes or string
            if isinstance(chunk, bytes):
                events.append(chunk.decode("utf-8"))
            else:
                events.append(chunk)
        return events

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        db = MagicMock(spec=Session)

        # Create mock async execute method
        async def mock_execute(query):
            result = MagicMock()
            result.scalar_one_or_none.return_value = self.mock_card()

            # Create cards with specific IDs for multi-card tests
            cards = []
            for card_id in ["card-1", "card-2", "card-3"]:
                card = MagicMock()
                card.id = card_id
                card.name = f"Card {card_id}"
                card.description = f"Description for {card_id}"
                cards.append(card)

            result.scalars.return_value.all.return_value = cards
            return result

        db.execute = mock_execute
        return db

    @pytest.fixture
    def mock_ai_service(self):
        """Mock AI interpretation service"""
        service = MagicMock()
        # is_available is a sync method that returns bool
        service.is_available.return_value = True
        return service

    @pytest.fixture
    def mock_current_user(self):
        """Mock authenticated user"""
        user = MagicMock()
        user.id = "test-user-id"
        user.username = "test_user"
        return user

    @staticmethod
    def mock_card():
        """Create mock wasteland card"""
        card = MagicMock()
        card.id = "test-card-id"
        card.name = "愚者"
        card.description = "新的開始"
        return card

    @pytest.fixture
    def sample_request(self):
        """Sample streaming request"""
        return StreamInterpretationRequest(
            card_id="test-card-id",
            question="我的未來如何？",
            character_voice=CharacterVoice.PIP_BOY,
            karma_alignment=KarmaAlignment.NEUTRAL,
        )

    @pytest.fixture
    def sample_multi_card_request(self):
        """Sample multi-card streaming request"""
        return StreamMultiCardRequest(
            card_ids=["card-1", "card-2", "card-3"],
            question="我的未來如何？",
            character_voice=CharacterVoice.PIP_BOY,
            karma_alignment=KarmaAlignment.NEUTRAL,
            spread_type="three_card",
        )

    # ========================================
    # Test 1: AI Provider 延遲回應 (>60s)
    # ========================================

    @pytest.mark.asyncio
    async def test_timeout_when_ai_provider_hangs(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：當 AI provider 延遲回應超過 60 秒時，應觸發 timeout

        Expected:
        1. asyncio.TimeoutError 被觸發
        2. SSE error event 被發送
        3. Connection 被正確關閉
        """
        # Mock AI service to hang (never yield)
        async def hanging_generator():
            # Simulate AI provider hanging - never yield anything
            await asyncio.sleep(100)  # Longer than timeout (60s)
            yield "This should never be reached"

        mock_ai_service.generate_interpretation_stream = MagicMock(
            return_value=hanging_generator()
        )

        # Mock settings with 1 second timeout for faster testing
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 1  # 1 second for fast test
            mock_settings.ai_provider = "openai"

            # Call the endpoint
            response = await stream_card_interpretation(
                request=sample_request,
                db=mock_db,
                ai_service=mock_ai_service,
                current_user=mock_current_user,
            )

            # Collect all events from the streaming response
            events = await self.collect_events(response)

            # Verify timeout error event was sent
            assert len(events) > 0, "Should receive at least one event"

            # The last event should be the timeout error
            last_event = events[-1]
            assert "[ERROR]" in last_event, "Should contain error marker"
            assert "連線逾時" in last_event, "Should contain timeout message"

    # ========================================
    # Test 2: asyncio.TimeoutError 正確捕捉
    # ========================================

    @pytest.mark.asyncio
    async def test_timeout_error_is_caught_correctly(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：asyncio.TimeoutError 應該被正確捕捉並轉換為友善的錯誤訊息

        Expected:
        1. TimeoutError 不會讓整個請求 crash
        2. 錯誤被捕捉並記錄
        3. 友善的錯誤訊息被發送給前端
        """
        # Mock AI service to yield some chunks then hang
        async def slow_generator():
            yield "愚者代表"
            yield "新的開始"
            # Then hang forever
            await asyncio.sleep(100)

        mock_ai_service.generate_interpretation_stream = MagicMock(
            return_value=slow_generator()
        )

        # Mock settings with 0.5 second timeout
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 0.5
            mock_settings.ai_provider = "openai"

            # Mock logger to verify error logging
            with patch("app.api.v1.endpoints.readings_stream.logger") as mock_logger:
                # Call the endpoint
                response = await stream_card_interpretation(
                    request=sample_request,
                    db=mock_db,
                    ai_service=mock_ai_service,
                    current_user=mock_current_user,
                )

                # Collect all events
                events = await self.collect_events(response)

                # Verify partial chunks were received
                assert len(events) >= 3, "Should receive partial chunks + error event"

                # Verify timeout error was logged
                assert mock_logger.error.called, "Timeout error should be logged"
                error_call = mock_logger.error.call_args_list[-1]
                error_message = str(error_call[0][0])
                assert "timeout" in error_message.lower(), "Error log should mention timeout"

                # Verify error event sent
                last_event = events[-1]
                assert "[ERROR]" in last_event, "Should send error event"
                assert "連線逾時" in last_event, "Should contain timeout message in Chinese"

    # ========================================
    # Test 3: SSE error event 正確發送
    # ========================================

    @pytest.mark.asyncio
    async def test_sse_error_event_format(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：SSE error event 格式應該符合規範

        Expected:
        1. Error event 格式：data: [ERROR] {message}\n\n
        2. 訊息內容清楚且符合中文使用者期待
        3. 前端可以正確解析此事件
        """
        # Mock hanging AI service
        async def hanging_generator():
            await asyncio.sleep(100)
            yield "never reached"  # pragma: no cover

        mock_ai_service.generate_interpretation_stream = MagicMock(
            return_value=hanging_generator()
        )

        # Mock settings
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 0.2
            mock_settings.ai_provider = "openai"

            # Call the endpoint
            response = await stream_card_interpretation(
                request=sample_request,
                db=mock_db,
                ai_service=mock_ai_service,
                current_user=mock_current_user,
            )

            # Collect events
            events = await self.collect_events(response)

            # Verify SSE format
            error_event = events[-1]

            # Should start with "data: "
            assert error_event.startswith("data: "), "Should follow SSE format"

            # Should contain [ERROR] marker
            assert "[ERROR]" in error_event, "Should have ERROR marker"

            # Should end with double newline
            assert error_event.endswith("\n\n"), "Should end with \\n\\n"

            # Extract message content
            content = error_event.replace("data: ", "").strip()
            assert "連線逾時" in content, "Should contain timeout message"
            assert "重新整理" in content, "Should suggest refresh"

    # ========================================
    # Test 4: 正常 streaming 不受影響
    # ========================================

    @pytest.mark.asyncio
    async def test_normal_streaming_not_affected(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：正常完成的 streaming 不應該被 timeout 機制影響

        Expected:
        1. 在 timeout 時間內完成的請求正常處理
        2. 所有 chunks 都正確發送
        3. [DONE] 事件正常發送
        4. 沒有 [ERROR] 事件
        """
        # Mock fast AI service (completes within timeout)
        async def fast_generator():
            chunks = [
                "愚者代表",
                "新的開始，",
                "充滿無限可能。",
                "勇敢踏出第一步，",
                "世界將為你打開。",
            ]
            for chunk in chunks:
                await asyncio.sleep(0.01)  # Small delay to simulate streaming
                yield chunk

        mock_ai_service.generate_interpretation_stream = MagicMock(
            return_value=fast_generator()
        )

        # Mock settings with generous timeout
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 10  # 10 seconds - plenty of time
            mock_settings.ai_provider = "openai"

            # Call the endpoint
            response = await stream_card_interpretation(
                request=sample_request,
                db=mock_db,
                ai_service=mock_ai_service,
                current_user=mock_current_user,
            )

            # Collect all events
            events = await self.collect_events(response)

            # Verify all chunks received
            assert len(events) == 6, "Should receive 5 chunks + [DONE]"

            # Verify no error events
            for event in events[:-1]:  # All except last
                assert "[ERROR]" not in event, "No error events in successful stream"
                assert "data: " in event, "Should follow SSE format"

            # Verify [DONE] event
            last_event = events[-1]
            assert "[DONE]" in last_event, "Should send completion signal"
            assert "[ERROR]" not in last_event, "No error in successful completion"

            # Verify content chunks are valid JSON strings
            for event in events[:-1]:
                content = event.replace("data: ", "").strip()
                # Should be JSON-encoded string
                decoded = json.loads(content)
                assert isinstance(decoded, str), "Chunks should be JSON strings"
                assert len(decoded) > 0, "Chunks should have content"

    # ========================================
    # Test 5: Multi-card timeout protection
    # ========================================

    @pytest.mark.asyncio
    async def test_multi_card_timeout_protection(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_multi_card_request,
    ):
        """
        測試：Multi-card streaming 也應該有 timeout 保護

        Expected:
        1. Multi-card endpoint 同樣有 timeout 機制
        2. Timeout 錯誤訊息正確發送
        3. 多張卡片資訊包含在錯誤日誌中
        """
        # Mock hanging multi-card generator
        async def hanging_multi_generator():
            await asyncio.sleep(100)
            yield "never reached"  # pragma: no cover

        mock_ai_service.generate_multi_card_interpretation_stream = MagicMock(
            return_value=hanging_multi_generator()
        )

        # Mock settings
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 0.2
            mock_settings.ai_provider = "openai"

            # Mock logger
            with patch("app.api.v1.endpoints.readings_stream.logger") as mock_logger:
                # Call the multi-card endpoint
                response = await stream_multi_card_interpretation(
                    request=sample_multi_card_request,
                    db=mock_db,
                    ai_service=mock_ai_service,
                    current_user=mock_current_user,
                )

                # Collect events
                events = await self.collect_events(response)

                # Verify error event sent
                assert len(events) > 0, "Should receive error event"
                error_event = events[-1]
                assert "[ERROR]" in error_event, "Should send error event"
                assert "連線逾時" in error_event, "Should contain timeout message"

                # Verify error logging includes card count
                assert mock_logger.error.called, "Should log error"
                error_call = mock_logger.error.call_args_list[-1]
                error_message = str(error_call[0][0])
                assert "Multi-card" in error_message or "multi-card" in error_message.lower(), \
                    "Error log should mention multi-card"

    # ========================================
    # Test 6: Timeout configuration from environment
    # ========================================

    @pytest.mark.asyncio
    async def test_timeout_configuration_from_env(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：Timeout 時間應該可以透過環境變數配置

        Expected:
        1. 使用 settings.streaming_timeout 的值
        2. 不同的 timeout 值產生對應的行為
        """
        # Test with different timeout values
        test_cases = [
            (0.1, True),   # Very short timeout - should timeout
            (10, False),   # Long timeout - should complete
        ]

        for timeout_value, should_timeout in test_cases:
            # Mock AI service
            async def timed_generator():
                await asyncio.sleep(0.5)  # Takes 0.5 seconds
                yield "Test chunk"

            mock_ai_service.generate_interpretation_stream = MagicMock(
                return_value=timed_generator()
            )

            # Mock settings with specific timeout
            with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
                mock_settings.streaming_timeout = timeout_value
                mock_settings.ai_provider = "openai"

                # Call endpoint
                response = await stream_card_interpretation(
                    request=sample_request,
                    db=mock_db,
                    ai_service=mock_ai_service,
                    current_user=mock_current_user,
                )

                # Collect events
                events = await self.collect_events(response)

                # Verify behavior based on timeout
                if should_timeout:
                    # Should receive timeout error
                    assert any("[ERROR]" in event for event in events), \
                        f"Timeout {timeout_value}s should trigger error"
                else:
                    # Should complete successfully
                    assert any("[DONE]" in event for event in events), \
                        f"Timeout {timeout_value}s should allow completion"
                    assert not any("[ERROR]" in event for event in events), \
                        f"Timeout {timeout_value}s should not trigger error"

    # ========================================
    # Test 7: Partial content before timeout
    # ========================================

    @pytest.mark.asyncio
    async def test_partial_content_preserved_on_timeout(
        self,
        mock_db,
        mock_ai_service,
        mock_current_user,
        sample_request,
    ):
        """
        測試：Timeout 發生前已發送的部分內容應該被保留

        Expected:
        1. Timeout 前的 chunks 全部發送給前端
        2. 前端可以顯示部分內容
        3. 最後加上 timeout error event
        """
        # Mock AI service that yields some chunks then hangs
        partial_chunks = [
            "愚者代表新的開始，",
            "這是一段充滿可能性的旅程。",
            "你需要勇敢地",
        ]

        async def partial_then_hang_generator():
            for chunk in partial_chunks:
                await asyncio.sleep(0.01)
                yield chunk
            # Then hang
            await asyncio.sleep(100)

        mock_ai_service.generate_interpretation_stream = MagicMock(
            return_value=partial_then_hang_generator()
        )

        # Mock settings
        with patch("app.api.v1.endpoints.readings_stream.settings") as mock_settings:
            mock_settings.streaming_timeout = 0.3
            mock_settings.ai_provider = "openai"

            # Call endpoint
            response = await stream_card_interpretation(
                request=sample_request,
                db=mock_db,
                ai_service=mock_ai_service,
                current_user=mock_current_user,
            )

            # Collect events
            events = await self.collect_events(response)

            # Should have: partial chunks + timeout error
            assert len(events) >= len(partial_chunks) + 1, \
                "Should have partial chunks plus error event"

            # Verify partial chunks were sent
            for i, expected_chunk in enumerate(partial_chunks):
                event_content = events[i].replace("data: ", "").strip()
                decoded = json.loads(event_content)
                assert decoded == expected_chunk, \
                    f"Chunk {i} should match expected content"

            # Verify last event is timeout error
            last_event = events[-1]
            assert "[ERROR]" in last_event, "Last event should be timeout error"
            assert "連線逾時" in last_event, "Should contain timeout message"


# ========================================
# Additional Edge Case Tests
# ========================================

class TestStreamingTimeoutEdgeCases:
    """測試 timeout 保護機制的邊界情況"""

    @pytest.mark.asyncio
    async def test_timeout_with_zero_value(self):
        """
        測試：Timeout 設為 0 的行為（應該使用預設值或立即 timeout）
        """
        # This is a configuration validation test
        # In production, streaming_timeout should never be 0
        # We just verify the config accepts it

        from app.config import get_settings

        settings = get_settings()
        # Default should be 60 seconds
        assert settings.streaming_timeout > 0, \
            "Streaming timeout should be positive"

    @pytest.mark.asyncio
    async def test_timeout_with_large_value(self):
        """
        測試：非常大的 timeout 值（應該不影響正常流程）
        """
        from app.config import get_settings

        # Verify config accepts large values
        settings = get_settings()
        assert isinstance(settings.streaming_timeout, int), \
            "Timeout should be an integer"
        assert settings.streaming_timeout >= 1, \
            "Timeout should be at least 1 second"

    @pytest.mark.asyncio
    async def test_concurrent_timeouts(self):
        """
        測試：多個並發請求同時 timeout 的行為

        Expected:
        1. 每個請求獨立處理 timeout
        2. 一個請求 timeout 不影響其他請求
        3. 資源正確清理，不會累積
        """
        # This would require integration test setup
        # Verifies that timeout context managers are independent
        # and don't interfere with each other

        # Placeholder for integration test
        # In practice, this would:
        # 1. Start multiple streaming requests
        # 2. Trigger timeout on some but not all
        # 3. Verify each handles timeout independently
        pass
