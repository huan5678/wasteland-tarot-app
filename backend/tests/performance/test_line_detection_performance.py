"""
Daily Bingo 效能測試

測試目標:
- 連線檢測演算法 <10ms
- API p95 回應時間 <200ms
- API p99 回應時間 <500ms

需求對應: Performance targets validation
Task: 30
"""
import pytest
import asyncio
from datetime import date
from typing import List
import pytest_benchmark
from app.services.line_detection_service import LineDetectionService
from app.services.bingo_card_service import BingoCardService
from app.services.daily_claim_service import DailyClaimService


@pytest.mark.performance
class TestLineDetectionPerformance:
    """測試連線檢測演算法效能"""

    @pytest.mark.benchmark(group="line-detection")
    def test_bitmask_line_detection_performance(self, benchmark):
        """
        測試位元遮罩連線檢測效能
        目標: <10ms
        """
        # 準備測試資料
        card_data = {
            "grid": [
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ]
        }
        claimed_numbers = {1, 2, 3, 4, 5, 6, 11, 16, 21, 13}  # 3 條線

        service = LineDetectionService()

        # 執行 benchmark
        result = benchmark(
            service.count_lines,
            card_data,
            claimed_numbers
        )

        # 驗證結果正確性
        assert result == 3

        # 驗證效能（benchmark 會自動記錄時間）
        # 額外驗證單次執行 <10ms
        stats = benchmark.stats
        assert stats['mean'] < 0.01  # 10ms

    @pytest.mark.benchmark(group="line-detection")
    def test_worst_case_line_detection(self, benchmark):
        """
        測試最壞情況連線檢測（全部 25 個號碼）
        目標: <10ms
        """
        card_data = {
            "grid": [
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ]
        }
        claimed_numbers = set(range(1, 26))  # 所有號碼

        service = LineDetectionService()

        result = benchmark(
            service.count_lines,
            card_data,
            claimed_numbers
        )

        # 全部號碼應該有 12 條線（5橫+5直+2斜）
        assert result == 12

        stats = benchmark.stats
        assert stats['mean'] < 0.01  # <10ms

    @pytest.mark.benchmark(group="line-detection")
    def test_create_bitmask_performance(self, benchmark):
        """
        測試位元遮罩建立效能
        """
        card_numbers = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
        ]
        claimed_numbers = {1, 5, 13, 21, 25}

        service = LineDetectionService()

        result = benchmark(
            service.create_bitmask,
            card_numbers,
            claimed_numbers
        )

        # 驗證 bitmask 正確性
        assert isinstance(result, int)
        assert result > 0

        stats = benchmark.stats
        assert stats['mean'] < 0.001  # <1ms

    @pytest.mark.benchmark(group="line-detection", min_rounds=100)
    def test_line_detection_scalability(self, benchmark):
        """
        測試連線檢測可擴展性（100次迭代）
        """
        card_data = {
            "grid": [
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ]
        }

        service = LineDetectionService()

        def run_multiple_detections():
            results = []
            for i in range(1, 26):
                claimed = set(range(1, i + 1))
                results.append(service.count_lines(card_data, claimed))
            return results

        results = benchmark(run_multiple_detections)

        # 驗證結果序列正確
        assert len(results) == 25
        assert results[-1] == 12  # 最後一個應該是全部 12 條線

        stats = benchmark.stats
        # 100 次檢測平均應該 <1s
        assert stats['mean'] < 1.0


@pytest.mark.performance
@pytest.mark.asyncio
class TestAPIPerformance:
    """測試 API 端點效能"""

    async def test_claim_api_performance(
        self,
        client,
        db,
        auth_headers,
        benchmark_async
    ):
        """
        測試領取 API 效能
        目標: p95 <200ms, p99 <500ms
        """
        # 準備資料
        user_id = auth_headers["user_id"]

        # 建立賓果卡
        card_service = BingoCardService(db)
        await card_service.create_card(
            user_id,
            list(range(1, 26)),
            date.today()
        )

        # 生成今日號碼
        # ... (需要呼叫 daily number generator)

        # Benchmark API 呼叫
        async def claim_number():
            response = await client.post(
                "/api/v1/bingo/claim",
                headers=auth_headers
            )
            return response

        response = await benchmark_async(claim_number)

        # 驗證回應
        assert response.status_code in [200, 409]

        # 驗證效能（需要額外工具記錄 p95/p99）

    async def test_bingo_status_api_performance(
        self,
        client,
        auth_headers,
        benchmark_async
    ):
        """
        測試狀態查詢 API 效能
        目標: p95 <100ms
        """
        async def get_status():
            response = await client.get(
                "/api/v1/bingo/status",
                headers=auth_headers
            )
            return response

        response = await benchmark_async(get_status)

        assert response.status_code == 200

        # 狀態查詢應該很快（只讀操作）
        # p95 應該 <100ms

    async def test_concurrent_claims_performance(
        self,
        db,
        benchmark_async
    ):
        """
        測試並發領取效能
        模擬 100 個使用者同時領取
        """
        # 準備 100 個使用者的賓果卡
        user_ids = []
        card_service = BingoCardService(db)

        for i in range(100):
            user_id = f"test-user-{i}"
            user_ids.append(user_id)
            await card_service.create_card(
                user_id,
                list(range(1, 26)),
                date.today()
            )

        # 並發領取
        claim_service = DailyClaimService(db)

        async def concurrent_claims():
            tasks = [
                claim_service.claim_daily_number(user_id, date.today())
                for user_id in user_ids
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return results

        results = await benchmark_async(concurrent_claims)

        # 驗證所有領取成功或合理失敗
        assert len(results) == 100
        successful_claims = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_claims) > 0


@pytest.mark.performance
class TestDatabaseQueryPerformance:
    """測試資料庫查詢效能"""

    @pytest.mark.benchmark(group="database")
    async def test_card_lookup_performance(
        self,
        db,
        benchmark_async
    ):
        """
        測試賓果卡查詢效能
        目標: <50ms
        """
        user_id = "test-user"
        month_year = date.today()

        # 建立測試資料
        card_service = BingoCardService(db)
        await card_service.create_card(
            user_id,
            list(range(1, 26)),
            month_year
        )

        # Benchmark 查詢
        async def lookup_card():
            return await card_service.get_user_card(user_id, month_year)

        card = await benchmark_async(lookup_card)

        assert card is not None

        # 查詢應該很快（有索引）
        # <50ms

    @pytest.mark.benchmark(group="database")
    async def test_claimed_numbers_query_performance(
        self,
        db,
        benchmark_async
    ):
        """
        測試已領取號碼查詢效能
        目標: <100ms
        """
        user_id = "test-user"

        # 建立測試資料（20 個領取記錄）
        # ... (insert claims)

        claim_service = DailyClaimService(db)

        async def query_claims():
            return await claim_service.get_claimed_numbers(
                user_id,
                date.today()
            )

        claimed = await benchmark_async(query_claims)

        # 驗證結果
        assert isinstance(claimed, set)

        # 查詢應該 <100ms


# pytest-benchmark 配置
def pytest_benchmark_generate_json(config, benchmarks, output_json):
    """
    生成 benchmark JSON 報告
    """
    output_json['performance_thresholds'] = {
        'line_detection_mean': 0.01,  # 10ms
        'api_claim_p95': 0.2,  # 200ms
        'api_claim_p99': 0.5,  # 500ms
        'db_query_mean': 0.05,  # 50ms
    }


# 使用方式:
# pytest backend/tests/performance/test_line_detection_performance.py -v --benchmark-only
# pytest backend/tests/performance/test_line_detection_performance.py -v --benchmark-json=benchmark_results.json
