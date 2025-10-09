# Enhanced Logging & Monitoring Guide

## 概述

本專案實作了完整的 logging 和 monitoring 系統，涵蓋前端和後端：

### 前端功能
- ✅ 結構化的錯誤追蹤
- ✅ Web Vitals 效能監控
- ✅ 使用者行為追蹤
- ✅ API 呼叫監控
- ✅ 記憶體使用監控
- ✅ Long Task 和 Layout Shift 偵測

### 後端功能
- ✅ 結構化 JSON logging
- ✅ Request context tracking
- ✅ 效能監控和 baseline 管理
- ✅ 錯誤聚合和統計
- ✅ Slow request 偵測
- ✅ API endpoints 監控

---

## 前端使用方式

### 1. 初始化 Monitoring

在應用程式啟動時初始化（例如在 `_app.tsx` 或 `layout.tsx`）：

```typescript
import { initMetrics } from '@/lib/metrics'
import { startBatchLogging, setUserId } from '@/lib/logger'

// 在 useEffect 或 component mount 時
useEffect(() => {
  // 初始化 metrics
  initMetrics()

  // 啟動批次 logging (production only)
  if (process.env.NODE_ENV === 'production') {
    startBatchLogging()
  }

  // 設定使用者 ID (登入後)
  if (user) {
    setUserId(user.id)
  }
}, [])
```

### 2. 錯誤追蹤

```typescript
import { logError, logCritical } from '@/lib/logger'

try {
  // 你的程式碼
  dangerousOperation()
} catch (error) {
  // 一般錯誤
  logError(error, {
    component: 'CardDraw',
    action: 'draw_card',
    cardId: card.id
  })

  // 嚴重錯誤（會觸發額外處理）
  logCritical(error, {
    component: 'PaymentProcessor',
    transactionId: txId
  })
}
```

### 3. 使用者行為追蹤

```typescript
import { logUserAction, markUserAction } from '@/lib/logger'

// 追蹤使用者動作
const handleCardClick = (cardId: string) => {
  logUserAction('card_clicked', {
    cardId,
    position: index,
    spread: currentSpread
  })
}

// 簡化版本
markUserAction('reading_started', { spreadType: 'celtic-cross' })
```

### 4. 效能監控

```typescript
import { measurePerformance, measurePerformanceAsync } from '@/lib/logger'

// 同步函數
const result = measurePerformance('expensive_calculation', () => {
  return expensiveCalculation()
})

// 非同步函數
const data = await measurePerformanceAsync('fetch_reading', async () => {
  return await fetchReading(id)
})
```

### 5. API 呼叫監控

使用 `timedFetch` 替代原生 `fetch`：

```typescript
import { timedFetch } from '@/lib/metrics'

// 自動記錄 API 效能
const response = await timedFetch('/api/readings', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### 6. 查看監控數據

```typescript
import {
  getErrorStats,
  getPerformanceStats,
  getPerformanceSummary
} from '@/lib/logger'
import { getWebVitalsSnapshot } from '@/lib/metrics'

// 錯誤統計
const errorStats = getErrorStats()
console.log('Errors:', errorStats)

// 效能統計
const perfStats = getPerformanceStats()
console.log('Performance:', perfStats)

// Web Vitals
const vitals = getWebVitalsSnapshot()
console.log('Web Vitals:', vitals)

// 完整效能摘要
const summary = getPerformanceSummary()
console.log('Summary:', summary)
```

---

## 後端使用方式

### 1. 設定 Logging

在 `main.py` 中設定：

```python
from app.core.logging_config import setup_logging
from pathlib import Path

# 設定 logging
setup_logging(
    level="INFO",
    log_dir=Path("logs"),
    enable_json=True,  # Production 使用 JSON
    enable_file=True
)
```

### 2. 加入 Middleware

```python
from app.core.logging_middleware import (
    RequestLoggingMiddleware,
    PerformanceMonitoringMiddleware
)

app = FastAPI()

# Request logging
app.add_middleware(
    RequestLoggingMiddleware,
    log_request_body=False,  # Set True for debugging
    log_response_body=False,
    exclude_paths=['/health', '/metrics']
)

# Performance monitoring
app.add_middleware(
    PerformanceMonitoringMiddleware,
    slow_threshold_ms=1000,
    very_slow_threshold_ms=3000
)
```

### 3. 在程式碼中使用 Logger

```python
from app.core.logging_config import get_logger, log_performance

logger = get_logger(__name__)

async def some_operation():
    logger.info("Starting operation")

    try:
        # 你的程式碼
        result = await do_something()
        logger.debug(f"Operation result: {result}")
        return result
    except Exception as e:
        logger.error(f"Operation failed: {e}", exc_info=True)
        raise
```

### 4. 效能監控

```python
from app.monitoring.performance import monitor_performance, monitor_endpoint

# 使用 context manager
async def read_data():
    async with monitor_performance(endpoint="read_data", user_id=user_id):
        data = await fetch_from_db()
        return data

# 使用 decorator
@monitor_endpoint
async def create_reading(reading: ReadingCreate):
    return await reading_service.create(reading)
```

### 5. 手動記錄效能

```python
from app.core.logging_config import log_performance

import time

start = time.time()
result = expensive_operation()
duration_ms = (time.time() - start) * 1000

log_performance(logger, "expensive_operation", duration_ms, extra_data="...")
```

### 6. 錯誤聚合

```python
from app.core.logging_config import error_aggregator

# 錯誤會自動聚合，也可以手動加入
error_aggregator.add_error(
    error_type="ValidationError",
    message="Invalid reading data",
    context={"reading_id": reading_id}
)

# 取得錯誤統計
summary = error_aggregator.get_error_summary()
```

---

## API Endpoints

### 監控 Endpoints

```bash
# Health check
GET /api/v1/monitoring/health

# 效能 metrics
GET /api/v1/monitoring/metrics

# 平均 metrics (5分鐘預設)
GET /api/v1/monitoring/metrics/averages?minutes=5

# 錯誤列表
GET /api/v1/monitoring/errors?limit=50

# 錯誤統計
GET /api/v1/monitoring/errors/summary

# 清除錯誤 (admin only)
POST /api/v1/monitoring/errors/clear

# 效能報告
GET /api/v1/monitoring/performance/report

# 接收前端 logs (自動)
POST /api/v1/monitoring/logs/batch
POST /api/v1/monitoring/logs/errors
```

### 使用範例

```bash
# 查看當前 metrics
curl http://localhost:8000/api/v1/monitoring/metrics

# 查看最近的錯誤
curl http://localhost:8000/api/v1/monitoring/errors?limit=10

# 取得效能報告
curl http://localhost:8000/api/v1/monitoring/performance/report
```

---

## Log 格式

### 後端 JSON Log 範例

```json
{
  "timestamp": "2025-01-15T10:30:45.123456",
  "level": "INFO",
  "logger": "app.api.readings",
  "message": "Reading created successfully",
  "module": "readings",
  "function": "create_reading",
  "line": 45,
  "request_id": "abc123",
  "user_id": "user_456",
  "extra": {
    "reading_id": "reading_789",
    "spread_type": "celtic_cross"
  },
  "duration_ms": 234.56
}
```

### 前端 Log Event 範例

```javascript
{
  id: "x7k2n",
  name: "user_action:card_clicked",
  payload: {
    cardId: "card_123",
    position: 2,
    spread: "three_card"
  },
  ts: 1705315845123,
  type: "user_action",
  level: "info",
  user_id: "user_456",
  session_id: "session_abc"
}
```

---

## 效能閾值

### 前端

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | ≤ 800ms | ≤ 1.8s | > 1.8s |

### 後端

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| API Response | < 200ms | < 500ms | > 1000ms |
| Database Query | < 50ms | < 100ms | > 300ms |
| Memory Usage | < 100MB | < 200MB | > 500MB |
| CPU Usage | < 20% | < 50% | > 80% |

---

## 最佳實踐

### 1. 錯誤處理

```typescript
// ❌ 不好
try {
  await operation()
} catch (e) {
  console.error(e) // 只有 console
}

// ✅ 好
try {
  await operation()
} catch (e) {
  logError(e, {
    component: 'MyComponent',
    action: 'specific_action',
    additionalContext: '...'
  })
  // 顯示使用者友善的錯誤訊息
  showErrorToast('操作失敗，請稍後再試')
}
```

### 2. 效能監控

```typescript
// ❌ 過度監控
logPerf('button_click', 0.1) // 太頻繁

// ✅ 監控重要操作
const data = await measurePerformanceAsync('fetch_readings', async () => {
  return await fetchReadings()
})
```

### 3. 使用者行為追蹤

```typescript
// ✅ 追蹤關鍵使用者行為
logUserAction('reading_completed', {
  spreadType: 'celtic_cross',
  duration: readingDuration,
  satisfaction: rating
})

// 追蹤轉換事件
trackConversion('reading_purchase', 9.99, {
  spreadType: 'premium'
})
```

### 4. Context 管理

```python
# 在 middleware 中自動設定
set_request_context(request_id, user_id)

# 在操作結束時清除
clear_request_context()
```

---

## 除錯技巧

### 1. 查看 Buffer 內容

```typescript
// 前端
import { getBufferedEvents, getBufferedErrors } from '@/lib/logger'

console.log('Events:', getBufferedEvents())
console.log('Errors:', getBufferedErrors())
```

### 2. 查看效能統計

```typescript
import { getPerformanceStats } from '@/lib/logger'

const stats = getPerformanceStats()
console.log('Avg:', stats.avg, 'P95:', stats.p95)
```

### 3. 查看 Web Vitals

```typescript
import { getWebVitalsSnapshot } from '@/lib/metrics'

const vitals = getWebVitalsSnapshot()
vitals.forEach(v => {
  console.log(`${v.name}: ${v.value} (${v.rating})`)
})
```

### 4. 後端錯誤查詢

```bash
# 查看錯誤統計
curl http://localhost:8000/api/v1/monitoring/errors/summary | jq

# 查看最近錯誤
curl http://localhost:8000/api/v1/monitoring/errors?limit=5 | jq '.data'
```

---

## 生產環境設定

### 前端

```typescript
// 只在 production 啟用批次傳送
if (process.env.NODE_ENV === 'production') {
  startBatchLogging() // 每 30 秒傳送一次
}
```

### 後端

```python
# 使用環境變數控制
import os

setup_logging(
    level=os.getenv("LOG_LEVEL", "INFO"),
    enable_json=os.getenv("ENV") == "production",
    enable_file=True
)
```

### 環境變數

```bash
# .env
LOG_LEVEL=INFO
ENABLE_JSON_LOGGING=true
LOG_DIR=/var/log/wasteland-tarot
SLOW_REQUEST_THRESHOLD_MS=1000
```

---

## 與外部服務整合

### Sentry (前端)

```typescript
// 在 logger.ts 中的 sendErrorToExternalService
import * as Sentry from '@sentry/nextjs'

async function sendErrorToExternalService(errorEvent: LogEvent) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(errorEvent.stack, {
      extra: errorEvent.payload
    })
  }
}
```

### DataDog / New Relic (後端)

在 `logging_config.py` 加入自訂 handler：

```python
# 範例：加入 DataDog handler
from datadog import initialize, statsd

def setup_datadog_logging():
    initialize(
        api_key=os.getenv('DATADOG_API_KEY'),
        app_key=os.getenv('DATADOG_APP_KEY')
    )

    # 在 log_performance 中發送 metrics
    statsd.increment('api.request.count')
    statsd.histogram('api.request.duration', duration_ms)
```

---

## 總結

### 已完成功能 ✅

#### 前端
- Client-side error tracking with context
- Performance monitoring (Web Vitals)
- User action tracking
- API call monitoring
- Memory usage monitoring
- Long task detection
- Batch logging to backend

#### 後端
- Structured JSON logging
- Request context tracking
- Performance metrics collection
- Error aggregation and statistics
- Slow request detection
- Monitoring API endpoints
- Log file rotation

### 使用重點
1. **初始化**: 在 app 啟動時呼叫 `initMetrics()`
2. **錯誤**: 使用 `logError()` 追蹤所有錯誤
3. **效能**: 使用 `measurePerformanceAsync()` 包裝關鍵操作
4. **使用者**: 使用 `logUserAction()` 追蹤使用者行為
5. **監控**: 定期查看 `/api/v1/monitoring/metrics` endpoint

有問題請參考本文件或檢查 console logs！
