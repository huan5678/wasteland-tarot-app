# WaveNet 代碼清理指南 (Task 5.2)

## 概述

當 Chirp 3:HD 已經穩定運行且不需要 WaveNet fallback 時，可以清理 WaveNet 特定代碼。**重要**: 我們保留代碼但標記為 deprecated，以便在緊急情況下可以快速恢復。

---

## 清理原則

### 不刪除，只標記

- ✅ **保留代碼**: 所有 WaveNet 代碼保留在代碼庫中
- ✅ **標記為 deprecated**: 添加 `@deprecated` 註解
- ✅ **添加註釋**: 說明保留原因和恢復方法
- ❌ **不刪除**: 不刪除任何代碼，只添加標記

### 原因

1. **緊急回滾**: 如果 Chirp 3:HD 出現嚴重問題，可以快速恢復
2. **歷史參考**: 保留代碼作為歷史參考和比較基準
3. **測試需要**: 可能需要 WaveNet 進行 A/B 測試

---

## 需要標記的代碼

### 1. WaveNet 語音映射

**位置**: `backend/app/services/tts_service.py`

```python
# ============================================================================
# WaveNet Voice Mapping (DEPRECATED - Kept for emergency rollback)
# ============================================================================
#
# ⚠️ DEPRECATED: This mapping is kept for emergency rollback purposes.
#
# To re-enable WaveNet:
# 1. Set CHIRP3_ENABLED=false
# 2. Update VoiceModelRouter to use WaveNet by default
# 3. Remove deprecated markers
#
# Last used: [日期]
# Reason for deprecation: Chirp 3:HD fully rolled out and stable
#
VOICE_MAPPING = {
    # ... existing mapping ...
}
```

### 2. WaveNet 合成方法

**位置**: `backend/app/services/tts_service.py`

```python
def _synthesize_wavenet(
    self,
    text: str,
    character_key: str,
    language_code: str = "zh-TW"
) -> Dict[str, Any]:
    """
    使用 WaveNet 模型合成語音（DEPRECATED）

    ⚠️ DEPRECATED: This method is kept for emergency rollback purposes.

    After Chirp 3:HD has been stable for 1+ week without fallback,
    this method is deprecated but preserved for emergency recovery.

    To re-enable:
    1. Update synthesize_speech() to call this method
    2. Remove deprecated markers
    3. Ensure VOICE_MAPPING is active

    Args:
        text: 要合成的文字
        character_key: 角色識別碼
        language_code: 語言代碼

    Returns:
        合成結果字典

    Raises:
        Exception: TTS 合成失敗
    """
    # ... existing implementation ...
```

### 3. SSML 生成方法

**位置**: `backend/app/services/tts_service.py`

```python
def generate_ssml(
    self,
    text: str,
    character_key: str,
    pitch_adjustment: Optional[float] = None,
    rate_adjustment: Optional[float] = None
) -> str:
    """
    生成 SSML 標記（DEPRECATED - WaveNet 專用）

    ⚠️ DEPRECATED: This method is kept for WaveNet compatibility.

    Chirp 3:HD uses its own markup format (not SSML).
    This method is preserved for WaveNet fallback scenarios.

    Args:
        text: 要合成的文字
        character_key: 角色識別碼
        pitch_adjustment: 音高調整（覆寫預設值）
        rate_adjustment: 語速調整（覆寫預設值）

    Returns:
        SSML 格式字串
    """
    # ... existing implementation ...
```

---

## 恢復 WaveNet 的步驟

如果需要緊急恢復 WaveNet：

### 步驟 1: 更新環境變數

```bash
CHIRP3_ENABLED=false
CHIRP3_ROLLOUT_PERCENTAGE=0
CHIRP3_FALLBACK_TO_WAVENET=true
```

### 步驟 2: 修改代碼（如果已標記為 deprecated）

1. 移除 `@deprecated` 標記
2. 確保 `_synthesize_wavenet()` 在 `synthesize_speech()` 中被調用
3. 確保 `VOICE_MAPPING` 可用

### 步驟 3: 重啟服務

```bash
# 根據部署平台重啟
```

### 步驟 4: 驗證

```bash
python scripts/verify_deployment.py
```

---

## 代碼標記範例

### Python 函數標記

```python
@deprecated("Use _synthesize_chirp3() instead. Kept for emergency rollback.")
def _synthesize_wavenet(self, ...):
    """
    ⚠️ DEPRECATED: WaveNet synthesis method.

    This method is deprecated but preserved for emergency rollback scenarios.
    Do not use in new code. Use _synthesize_chirp3() instead.

    To re-enable:
    1. Set CHIRP3_ENABLED=false
    2. Remove @deprecated decorator
    3. Update synthesize_speech() routing logic
    """
    pass
```

### 常數標記

```python
# ⚠️ DEPRECATED: WaveNet voice mapping
# Kept for emergency rollback. See CHIRP3_VOICE_MAPPING for active mapping.
# Last active: [日期]
# To re-enable: Set CHIRP3_ENABLED=false
VOICE_MAPPING = {
    # ... mapping ...
}
```

---

## 測試更新

更新測試以反映 deprecated 狀態：

```python
@pytest.mark.skip(reason="WaveNet deprecated - kept for emergency rollback")
def test_wavenet_synthesis(self):
    """Test WaveNet synthesis (deprecated but preserved)"""
    # ... test code ...
```

---

## 文檔更新

### 更新主文檔

在相關文檔中添加說明：

```markdown
## WaveNet Support

⚠️ **DEPRECATED**: WaveNet support has been deprecated in favor of Chirp 3:HD.
All WaveNet code is preserved for emergency rollback scenarios.

See `WAVENET_CODE_CLEANUP_GUIDE.md` for details on re-enabling WaveNet.
```

---

## 清理檢查清單

### 代碼標記

- [ ] 標記 `VOICE_MAPPING` 為 deprecated
- [ ] 標記 `_synthesize_wavenet()` 為 deprecated
- [ ] 標記 `generate_ssml()` 為 deprecated（如果僅用於 WaveNet）
- [ ] 添加恢復說明註釋

### 測試更新

- [ ] 更新 WaveNet 測試為 skip 或 deprecated
- [ ] 添加註釋說明保留原因
- [ ] 更新測試文檔

### 文檔更新

- [ ] 更新 API 文檔
- [ ] 更新服務文檔
- [ ] 創建恢復指南
- [ ] 更新遷移指南

---

## 檔案清單

需要標記為 deprecated 的檔案：

1. `backend/app/services/tts_service.py`
   - `VOICE_MAPPING` 常數
   - `_synthesize_wavenet()` 方法
   - `generate_ssml()` 方法（如果僅用於 WaveNet）

---

## 緊急恢復程序

如果需要恢復 WaveNet：

1. **快速恢復** (< 5 分鐘):
   ```bash
   # 設置環境變數
   export CHIRP3_ENABLED=false
   # 重啟服務
   ```

2. **完整恢復** (< 30 分鐘):
   - 移除 deprecated 標記
   - 更新路由邏輯
   - 驗證功能
   - 部署代碼

詳細步驟見 `CHIRP3_ROLLBACK_PROCEDURE.md`

---

**最後更新**: 2025-11-04
