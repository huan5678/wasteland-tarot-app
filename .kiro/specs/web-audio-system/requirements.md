# 需求文件 - Web Audio System

## 簡介

本規格定義 Wasteland Tarot 平台的進階音訊系統需求，使用 Web Audio API 實現沉浸式的 Fallout 主題音效體驗，並整合 **Synthwave Lofi 程序式音樂生成引擎**。系統將提供音效播放、語音合成、程序式背景音樂生成、音訊效果處理和音量控制功能，以增強使用者的廢土占卜體驗。

### 業務價值
- **提升沉浸感**：透過 Pip-Boy 音效、蓋革計數器聲、Vault 音效和即時生成的 synthwave lofi 背景音樂增強 Fallout 主題體驗
- **獨特音樂體驗**：程序式音樂生成確保每次訪問都有不重複的背景音樂，提升重訪價值
- **改善使用者體驗**：透過音訊回饋和動態音樂提供更直觀且情境化的互動反應
- **支援無障礙功能**：語音合成（TTS）支援視覺障礙使用者，視覺化工具輔助聽覺障礙使用者
- **效能優化**：音效快取、預載和智慧型資源管理確保流暢的使用者體驗
- **技術創新**：展示 Web Audio API 的進階應用（ADSR、濾波器、LFO、程序式合成）作為技術實力象徵

## 需求

### 需求 1：音效播放系統
**使用者故事**：作為一個廢土旅者，我希望在與平台互動時聽到 Fallout 主題音效，以獲得更沉浸式的體驗

#### 驗收標準

1. WHEN 使用者點擊按鈕或互動元素 THEN 系統 SHALL 播放對應的 Pip-Boy 音效（點擊聲、確認聲）
2. WHEN 頁面載入完成 THEN 系統 SHALL 播放 Vault 門開啟音效
3. WHEN 抽取塔羅牌時 THEN 系統 SHALL 播放卡牌翻轉音效
4. WHEN 輻射值變化時 THEN 系統 SHALL 播放蓋革計數器音效，音效強度對應輻射等級
5. WHEN 終端機輸入文字時 THEN 系統 SHALL 播放打字機音效
6. IF 音效檔案載入失敗 THEN 系統 SHALL 記錄錯誤並繼續運作而不中斷使用者體驗
7. WHERE 音效已預載 THE 系統 SHALL 在 100ms 內開始播放音效

### 需求 2：語音合成（Text-to-Speech）
**使用者故事**：作為一個視覺障礙使用者，我希望系統能朗讀塔羅牌解讀內容，讓我也能使用平台

#### 驗收標準

1. WHEN 使用者啟用語音播放功能 THEN 系統 SHALL 使用 Web Speech API 朗讀塔羅牌解讀文字
2. WHEN AI 串流解讀內容時 THEN 系統 SHALL 支援即時語音合成（streaming TTS）
3. IF 使用者選擇特定角色語音（如 Mr. Handy、Brotherhood Scribe）THEN 系統 SHALL 調整語音參數（音調、速度）以匹配角色風格
4. WHEN 語音播放進行中且使用者點擊暫停 THEN 系統 SHALL 立即暫停語音播放
5. WHEN 語音播放進行中且使用者點擊停止 THEN 系統 SHALL 停止語音播放並重置播放位置
6. IF 瀏覽器不支援 Web Speech API THEN 系統 SHALL 顯示友善的錯誤訊息並隱藏語音控制按鈕
7. WHILE 語音播放進行中 THE 系統 SHALL 顯示視覺指示器（波形或脈衝動畫）

### 需求 3：Synthwave Lofi 背景音樂系統
**使用者故事**：作為一個廢土旅者，我希望在使用平台時聽到具有 synthwave lofi 風格的程序式生成背景音樂，營造復古未來主義的廢土氛圍

#### 驗收標準

1. WHEN 使用者進入主頁面 THEN 系統 SHALL 使用 Web Audio API 程序式生成 synthwave lofi 風格的背景音樂
2. WHEN 音樂系統初始化時 THEN 系統 SHALL 建立包含 Oscillator、Filter、Envelope (ADSR) 和 Effects Chain 的音訊節點圖
3. WHEN 背景音樂播放時 THEN 系統 SHALL 使用多個 OscillatorNode (sine, square, sawtooth) 生成合成器音色
4. WHILE 音樂播放中 THE 系統 SHALL 自動生成和弦進行（如 Am-F-C-G 或 i-VI-III-VII）並循環播放
5. WHEN 使用者開始進行塔羅占卜 THEN 系統 SHALL 切換至更深沉的音樂模式（降低 BPM 至 60-80）
6. IF 使用者在設定中關閉背景音樂 THEN 系統 SHALL 平滑淡出並停止所有音訊節點
7. WHEN 背景音樂切換場景時 THEN 系統 SHALL 在 2-3 秒內完成 crossfade 轉場

### 需求 4：音量控制系統
**使用者故事**：作為一個平台使用者，我希望能獨立控制音效、音樂和語音的音量，以自訂我的音訊體驗

#### 驗收標準

1. WHEN 使用者在設定頁面 THEN 系統 SHALL 顯示三個獨立的音量滑桿（音效、音樂、語音）
2. WHEN 使用者調整音效音量滑桿 THEN 系統 SHALL 即時調整所有音效（按鈕聲、卡牌聲等）的音量
3. WHEN 使用者調整音樂音量滑桿 THEN 系統 SHALL 即時調整背景音樂的音量
4. WHEN 使用者調整語音音量滑桿 THEN 系統 SHALL 即時調整 TTS 語音的音量
5. IF 使用者將任何音量設為 0 THEN 系統 SHALL 靜音該類別的所有音訊
6. WHEN 使用者調整音量設定 THEN 系統 SHALL 將設定儲存至 localStorage 以便下次訪問時載入
7. IF 系統偵測到音訊輸出裝置變更（如插入耳機）THEN 系統 SHALL 保持當前音量設定

### 需求 5：音效快取和預載
**使用者故事**：作為一個平台使用者，我希望音效能快速播放而不延遲，提供流暢的互動體驗

#### 驗收標準

1. WHEN 應用程式初始化時 THEN 系統 SHALL 預載所有關鍵音效檔案（按鈕聲、卡牌聲、蓋革計數器）
2. WHEN 音效檔案下載完成 THEN 系統 SHALL 將音訊緩衝區快取在記憶體中
3. IF 記憶體使用超過 50MB THEN 系統 SHALL 清除最少使用的非關鍵音效快取
4. WHILE 頁面閒置超過 5 分鐘 THE 系統 SHALL 釋放部分音效快取以節省資源
5. WHEN 使用者首次點擊任何互動元素 THEN 系統 SHALL 解鎖 Web Audio Context（符合瀏覽器自動播放政策）
6. IF 網路連線緩慢（>3 秒載入時間）THEN 系統 SHALL 顯示載入指示器並延遲播放

### 需求 6：行動裝置音訊支援
**使用者故事**：作為一個行動裝置使用者，我希望音效系統在我的手機或平板上正常運作

#### 驗收標準

1. WHEN 使用者在行動裝置上首次互動（觸控任何元素）THEN 系統 SHALL 初始化並解鎖 Web Audio Context
2. IF 裝置處於靜音模式 THEN 系統 SHALL 偵測並在 UI 顯示靜音提示
3. WHEN 使用者切換應用程式（app 進入背景）THEN 系統 SHALL 暫停所有音訊播放
4. WHEN 使用者返回應用程式（app 回到前景）THEN 系統 SHALL 恢復之前的音訊播放狀態
5. IF iOS 裝置使用低電量模式 THEN 系統 SHALL 減少音效複雜度（降低採樣率或減少同時播放數）
6. WHILE 行動裝置電池低於 20% THE 系統 SHALL 自動降低背景音樂音量至 30%

### 需求 7：Synthwave Lofi 音訊效果處理
**使用者故事**：作為一個廢土旅者，我希望音效和音樂具有 synthwave lofi 特色的處理效果（如 gated reverb、tape saturation、pitch warble），營造復古未來主義氛圍

#### 驗收標準

1. WHEN 播放 synthwave 背景音樂 THEN 系統 SHALL 套用 Gated Reverb 效果到鼓組（使用 ConvolverNode + DynamicsCompressorNode）
2. WHEN 合成器主旋律播放時 THEN 系統 SHALL 套用 Ping-pong Delay 效果（使用 DelayNode + StereoPannerNode）
3. WHEN 和弦音色播放時 THEN 系統 SHALL 套用 Chorus 效果增加音色寬度（使用 LFO 調變的 DelayNode）
4. WHILE lofi 模式啟用 THE 系統 SHALL 持續套用 Pitch Warble 效果（0.1-0.3Hz 的低頻調變）模擬黑膠唱片或磁帶播放
5. WHEN lofi 效果啟用時 THEN 系統 SHALL 套用 Tape Saturation（使用 WaveShaperNode 模擬類比飽和）
6. IF 使用者啟用「經典 lofi 模式」THEN 系統 SHALL 套用 Bit Crushing 效果（降低位元深度至 8-12 bit）和降採樣（降至 22kHz）
7. WHEN 合成器音色需要 vintage 質感 THEN 系統 SHALL 套用 Flutter 效果（快速音高調變，3-7Hz）
8. WHEN 播放角色語音（Mr. Handy、Brotherhood Scribe）THEN 系統 SHALL 套用對應的音訊濾鏡（機械音、無線電效果）並結合 lofi 處理
9. WHEN 使用者在 Vault 場景中 THEN 系統 SHALL 對音效套用 Vintage Reverb（模擬 1980s 數位混響）
10. IF Web Audio API 不支援特定濾鏡 THEN 系統 SHALL 降級至基本播放而不套用進階效果

### 需求 8：錯誤處理和降級策略
**使用者故事**：作為一個平台使用者，即使我的瀏覽器不完全支援 Web Audio API，我仍希望能使用基本功能

#### 驗收標準

1. IF 瀏覽器不支援 Web Audio API THEN 系統 SHALL 降級使用 HTML5 `<audio>` 元素
2. IF 瀏覽器不支援 Web Speech API THEN 系統 SHALL 隱藏語音播放功能但保留其他音效功能
3. WHEN 音訊初始化失敗 THEN 系統 SHALL 記錄詳細錯誤資訊到 logger 並顯示使用者友善的訊息
4. IF 使用者拒絕音訊權限 THEN 系統 SHALL 靜默運作並不再嘗試播放音訊
5. WHEN 音訊檔案 404 或載入失敗 THEN 系統 SHALL 重試最多 3 次，失敗後跳過該音效
6. IF 系統偵測到音訊播放錯誤率超過 30% THEN 系統 SHALL 自動停用音效系統並通知使用者

### 需求 9：效能和資源管理
**使用者故事**：作為一個平台使用者，我希望音效系統不會影響應用程式的整體效能

#### 驗收標準

1. WHILE 應用程式運行中 THE 音效系統 SHALL 使用不超過 50MB 的記憶體
2. WHEN 同時播放多個音效時 THEN 系統 SHALL 限制最大並發播放數為 8 個
3. IF 頁面 FPS 低於 30 THEN 系統 SHALL 自動降低音效品質（降低採樣率或關閉效果處理）
4. WHEN 音效播放完成 THEN 系統 SHALL 在 1 秒內釋放對應的音訊資源
5. IF 偵測到記憶體洩漏（記憶體持續增長）THEN 系統 SHALL 重新初始化 Audio Context
6. WHILE 網頁處於背景分頁 THE 系統 SHALL 暫停所有非關鍵音訊處理

### 需求 10：程序式音樂生成引擎
**使用者故事**：作為一個廢土旅者，我希望系統能即時生成不重複的 synthwave lofi 音樂，提供獨特且動態的聆聽體驗

#### 驗收標準

1. WHEN 音樂引擎初始化時 THEN 系統 SHALL 建立 Synthesizer Engine，包含至少 3 個多音 (polyphonic) 合成器聲部（bass, pad, lead）
2. WHEN 合成器音色生成時 THEN 系統 SHALL 使用 ADSR Envelope（Attack-Decay-Sustain-Release）控制音量和濾波器截止頻率
3. WHEN Bass 聲部播放時 THEN 系統 SHALL 使用 Sawtooth 或 Square 波形搭配 Lowpass Filter（cutoff: 200-500Hz, resonance: 2-5）
4. WHEN Pad 聲部播放時 THEN 系統 SHALL 使用多個 detuned Sawtooth 振盪器（detune: -7 到 +7 cents）創造厚實音色
5. WHEN Lead 聲部播放時 THEN 系統 SHALL 使用 Pulse Wave 或 Triangle Wave 搭配 LFO (Low Frequency Oscillator) 調變濾波器
6. WHILE 音樂播放中 THE 系統 SHALL 使用音樂理論演算法生成和弦進行（支援小調、多利安調式、Phrygian 調式）
7. WHEN 和弦進行生成時 THEN 系統 SHALL 從預定義的 synthwave 和弦模式中選擇（如 i-VI-III-VII, i-iv-VII-VI）
8. WHEN 節奏模式生成時 THEN 系統 SHALL 支援可調整的 BPM（60-90 for lofi, 100-120 for upbeat synthwave）
9. IF 使用者停留在同一頁面超過 5 分鐘 THEN 系統 SHALL 自動切換至新的和弦進行和音色變化以保持新鮮感
10. WHEN 音樂參數需要自動化時 THEN 系統 SHALL 使用 AudioParam.linearRampToValueAtTime() 或 exponentialRampToValueAtTime() 實現平滑過渡

### 需求 11：Synthwave Lofi 鼓組和節奏
**使用者故事**：作為一個廢土旅者，我希望背景音樂包含符合 synthwave lofi 風格的鼓組和節奏，增強音樂的律動感

#### 驗收標準

1. WHEN 節奏引擎初始化時 THEN 系統 SHALL 使用 Web Audio API 程序式生成鼓組音色（kick, snare, hi-hat, clap）
2. WHEN Kick Drum 合成時 THEN 系統 SHALL 使用音高下降的 Sine Wave（起始頻率 150Hz → 40Hz，時長 150-200ms）加上 Noise burst
3. WHEN Snare Drum 合成時 THEN 系統 SHALL 混合 Noise（經過 Highpass Filter, cutoff: 200Hz）和 Sine Wave（200Hz）模擬鼓皮和響線
4. WHEN Hi-Hat 合成時 THEN 系統 SHALL 使用 Bandpass Filtered Noise（center: 8-12kHz）配合短促 Envelope（20-50ms）
5. WHILE 鼓組播放中 THE 系統 SHALL 套用微妙的 Swing（5-15%）和 Velocity Variation（±10-20%）增加人性化感覺
6. WHEN Synthwave 模式啟用時 THEN 系統 SHALL 在 Snare 上套用 Gated Reverb（reverb time: 0.5-1s, gate threshold: -20dB）
7. WHEN Lofi 模式啟用時 THEN 系統 SHALL 降低鼓組音量（-3 到 -6dB）並增加 Tape Saturation 營造溫暖感
8. IF 使用者在占卜模式 THEN 系統 SHALL 簡化節奏模式（移除部分 hi-hat 和裝飾音）並降低 BPM 至 60-70

### 需求 12：無障礙和使用者偏好
**使用者故事**：作為一個有特殊需求的使用者，我希望能完全控制音訊功能以符合我的需求

#### 驗收標準

1. WHEN 系統偵測到使用者的作業系統啟用「減少動態效果」偏好 THEN 系統 SHALL 預設停用所有音效和背景音樂
2. IF 使用者啟用鍵盤導航模式 THEN 系統 SHALL 為音量控制提供鍵盤快捷鍵（上下箭頭調整，M 靜音）
3. WHEN 音訊播放時 THEN 系統 SHALL 提供視覺替代方案（如音樂播放時的頻譜視覺化、音效播放時的圖示動畫）
4. IF 使用者使用螢幕閱讀器 THEN 系統 SHALL 提供 ARIA 標籤說明當前音訊狀態和音樂模式
5. WHEN 使用者首次訪問網站 THEN 系統 SHALL 顯示音訊權限說明和設定引導，包含 synthwave lofi 音樂系統的說明
6. IF 使用者在設定中選擇「完全靜音模式」THEN 系統 SHALL 停用所有音訊功能（包含程序式音樂引擎）並移除相關 UI 元素
7. WHEN 使用者調整音樂複雜度設定 THEN 系統 SHALL 提供「簡單」、「標準」、「豐富」三個等級（影響聲部數量和效果鏈複雜度）

## 非功能性需求

### 效能需求
- 音效播放延遲：<100ms（從觸發到開始播放）
- 音效檔案載入時間：<2 秒（關鍵音效）
- 記憶體使用：<80MB（所有音效快取 + 程序式音樂引擎）
- CPU 使用：<5%（閒置時），<20%（程序式音樂播放 + 音效），<10%（僅音效播放）
- 音訊延遲 (Audio Latency)：<50ms（Web Audio API 內部處理延遲）
- 合成器聲部數量：最多 8 個同時播放的音符（polyphony limit）
- 音樂引擎初始化時間：<500ms

### 相容性需求
- **支援瀏覽器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- **行動裝置**：iOS 14+、Android 10+
- **降級支援**：IE11 和舊版瀏覽器使用 HTML5 Audio

### 安全性需求
- 所有音訊檔案透過 HTTPS 傳輸
- 遵守瀏覽器自動播放政策（需使用者互動）
- 不收集音訊使用資料（符合隱私政策）

### 可維護性需求
- 音效檔案集中管理（單一設定檔）
- 程序式音樂參數集中管理（和弦進行、音色預設、BPM 範圍）
- 支援熱更新音效資源和音樂參數（無需重新部署）
- 提供詳細的錯誤日誌和監控
- 音訊節點圖可視覺化（開發模式）以便除錯

### 技術債務和未來擴展
- **音樂生成演算法升級**：未來可整合馬可夫鏈或機器學習模型生成更複雜的旋律
- **使用者自訂音樂**：允許使用者調整音樂風格參數（如調式、速度、複雜度）
- **音樂視覺化**：WebGL 音訊頻譜分析器與 Canvas 動畫整合
- **MIDI 輸出支援**：將程序式生成的音樂輸出為 MIDI 供進階使用者下載
- **Web Audio Worklet**：將部分音訊處理移至 AudioWorklet 以降低主執行緒負擔

## 附錄：Synthwave Lofi 音樂技術參考

### A. 音訊節點架構範例

```
AudioContext
  ├─ MasterGainNode (主音量控制)
  │   └─ MasterCompressorNode (最終壓縮器)
  │       └─ AudioDestination
  │
  ├─ MusicBus (音樂匯流排)
  │   ├─ BassVoice
  │   │   └─ OscillatorNode (Sawtooth) → LowpassFilter → ADSR Envelope → GainNode
  │   ├─ PadVoice
  │   │   └─ [3x OscillatorNode (detuned)] → ChorusEffect → ReverbNode → GainNode
  │   ├─ LeadVoice
  │   │   └─ OscillatorNode (Pulse) → LFO → BandpassFilter → PingPongDelay → GainNode
  │   └─ DrumBus
  │       ├─ Kick → WaveShaper (saturation) → GainNode
  │       ├─ Snare → GatedReverb → GainNode
  │       └─ HiHat → BandpassFilter → GainNode
  │
  ├─ SFXBus (音效匯流排)
  │   └─ [Dynamic SFX Nodes]
  │
  └─ VoiceBus (TTS 匯流排)
      └─ SpeechSynthesisNode → RadioEffect → GainNode
```

### B. Synthwave 和弦進行範例

| 調式 | 和弦進行 | 音符範例 (Am 為主音) |
|------|---------|---------------------|
| Aeolian (自然小調) | i - VI - III - VII | Am - F - C - G |
| Aeolian | i - iv - VII - VI | Am - Dm - G - F |
| Dorian | i - IV - VII - VI | Am - D - G - F |
| Phrygian | i - ♭II - ♭VII - i | Am - B♭ - G - Am |
| Modern Synthwave | i - ♭VI - ♭III - ♭VII | Am - F - C - G |

### C. ADSR Envelope 參考值

| 音色類型 | Attack | Decay | Sustain | Release |
|---------|--------|-------|---------|---------|
| Bass (Pluck) | 5ms | 100ms | 0.0 | 200ms |
| Bass (Sustained) | 20ms | 200ms | 0.7 | 300ms |
| Pad (Warm) | 500ms | 300ms | 0.6 | 800ms |
| Lead (Bright) | 10ms | 150ms | 0.5 | 200ms |
| Kick Drum | 2ms | 150ms | 0.0 | 50ms |
| Snare | 5ms | 100ms | 0.0 | 150ms |
| Hi-Hat | 2ms | 30ms | 0.0 | 50ms |

### D. Lofi 效果參數參考

| 效果類型 | 參數 | 建議值 |
|---------|------|--------|
| Pitch Warble | LFO Frequency | 0.1-0.3 Hz |
| Pitch Warble | Depth | 5-15 cents |
| Flutter | LFO Frequency | 3-7 Hz |
| Flutter | Depth | 2-5 cents |
| Bit Crushing | Bit Depth | 8-12 bit |
| Bit Crushing | Sample Rate | 16-22 kHz |
| Tape Saturation | Drive | 2-8 dB |
| Tape Saturation | Mix | 30-60% |
| Chorus | Delay Time | 20-30ms |
| Chorus | Depth | 3-7ms |
| Chorus | Rate | 0.3-1.5 Hz |

### E. 效果鏈處理順序 (Signal Flow)

**推薦的音訊處理順序**：

1. **Sound Source** (Oscillator / Sample)
2. **Filter** (Lowpass / Bandpass / Highpass)
3. **Distortion / Saturation** (WaveShaper)
4. **Modulation Effects** (Chorus / Phaser / Flanger)
5. **Pitch Effects** (Warble / Flutter)
6. **Delay** (Ping-pong / Stereo)
7. **Reverb** (Gated / Vintage)
8. **Dynamics** (Compressor / Limiter)
9. **Final Gain** (Output Level)

### F. Web Audio API 最佳實踐摘要

基於 MDN 和業界最佳實踐：

1. **使用 AudioContext.currentTime** 精確排程音訊事件，而非 setTimeout/setInterval
2. **重用 AudioBufferSourceNode**：預先建立並快取音訊緩衝區，避免重複解碼
3. **避免在音訊執行緒建立節點**：預先建立所有需要的節點並連接，播放時僅啟動/停止
4. **使用 exponentialRampToValueAtTime** 處理音量/頻率變化，避免突兀的參數跳躍
5. **AudioWorklet 優於 ScriptProcessorNode**：未來應使用 AudioWorklet 處理自訂音訊處理
6. **監控效能**：使用 `context.baseLatency` 和 Performance API 監控音訊延遲
7. **行動裝置解鎖策略**：在首次使用者互動時呼叫 `context.resume()` 解鎖 AudioContext

### G. 參考資源

- **MDN Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **MDN Best Practices**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- **Tone.js Framework**: https://tonejs.github.io/ (可作為架構參考，但本專案使用原生 Web Audio API)
- **Web Audio Weekly**: https://www.webaudioweekly.com/
- **Lofi Music Production Guide**: MusicTech - "Freeware Tutorial: Lo-fi processing for synthwave"
- **Synthwave Production**: EDMProd - "What is Synthwave? Here's Everything You Need to Know"

---

*文件版本*：2.0（新增 Synthwave Lofi 程序式音樂系統）
*建立日期*：2025-10-01
*最後更新*：2025-10-10
*語言*：繁體中文（zh-TW）
