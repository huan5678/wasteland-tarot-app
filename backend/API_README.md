# 🃏 廢土塔羅 API 文件

## 🚀 快速開始

### 啟動 Swagger UI 演示

```bash
# 進入後端目錄
cd backend

# 啟動虛擬環境
source .venv/bin/activate

# 啟動 API 服務器
python swagger_demo.py
```

### 🌐 訪問 Swagger UI

服務器啟動後，請訪問以下網址：

- **Swagger UI (互動式API文件)**: http://localhost:8000/docs
- **ReDoc (替代文件格式)**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 📊 API 概覽

### 🎯 主要功能

| 功能類別 | 端點 | 描述 |
|---------|------|------|
| 🃏 **卡牌管理** | `/api/v1/cards` | 獲取、搜索、篩選78張廢土塔羅卡牌 |
| 🎯 **牌陣系統** | `/api/v1/spreads` | 管理各種塔羅牌陣模板 |
| 📖 **閱讀會話** | `/api/v1/readings` | 創建和管理占卜會話 |
| 🎭 **角色系統** | `/api/v1/voices` | Fallout角色聲音解讀 |
| 🔧 **系統狀態** | `/health` | 系統健康檢查 |

### 🃏 卡牌系統特色

- **78張完整卡牌**: 22張大阿爾克那 + 56張小阿爾克那
- **Fallout主題**: 每張卡牌都融入廢土世界觀
- **多重篩選**: 花色、業力、輻射等級篩選
- **角色解讀**: 8個不同Fallout角色的獨特視角

## 🎮 API 使用範例

### 1. 獲取所有卡牌
```bash
curl http://localhost:8000/api/v1/cards
```

### 2. 獲取特定卡牌詳情
```bash
curl http://localhost:8000/api/v1/cards/major_0
```

### 3. 抽取隨機卡牌
```bash
curl "http://localhost:8000/api/v1/cards/random?count=3"
```

### 4. 創建占卜會話
```bash
curl -X POST "http://localhost:8000/api/v1/readings?spread_id=three_card&question=我的未來會如何？"
```

### 5. 獲取角色聲音列表
```bash
curl http://localhost:8000/api/v1/voices
```

## 🎭 角色聲音系統

我們的API支援8個不同的Fallout角色視角：

| 角色 | 特色 | 解讀風格 |
|------|------|---------|
| 🤖 **Pip-Boy** | 科技分析 | 數據驅動、理性分析 |
| 👹 **超級變種人** | 直接暴力 | 簡單粗暴、一針見血 |
| 💀 **屍鬼** | 睿智經驗 | 豐富閱歷、黑色幽默 |
| 🔫 **掠奪者** | 實用主義 | 求生導向、機會主義 |
| 📚 **兄弟會書記員** | 學術研究 | 知識淵博、技術專精 |
| 🏠 **避難所居民** | 樂觀希望 | 純真樂觀、充滿希望 |
| 🎩 **Codsworth** | 禮貌服務 | 優雅禮貌、忠誠服務 |
| 💰 **廢土商人** | 商業機會 | 商業頭腦、機會敏感 |

## 🎯 牌陣系統

### 可用牌陣模板

1. **廢土三卡牌陣** (難度: ⭐)
   - 卡牌數量: 3張
   - 適合: 日常指導、簡單問題

2. **廢土凱爾特十字** (難度: ⭐⭐⭐⭐)
   - 卡牌數量: 10張
   - 適合: 複雜問題、深度分析

## 📖 Swagger UI 功能特色

### 🌟 互動式API探索
- **實時測試**: 直接在網頁上測試所有API端點
- **參數調整**: 輕鬆修改請求參數和查看結果
- **響應展示**: 查看完整的API響應格式

### 📚 完整文件
- **詳細描述**: 每個端點都有完整的功能說明
- **參數說明**: 清楚的參數類型和限制說明
- **範例資料**: 豐富的請求和響應範例

### 🎨 Fallout主題設計
- **沉浸式體驗**: 完整的廢土世界觀整合
- **主題一致**: 所有API響應都保持Fallout風格
- **角色化錯誤**: 連錯誤訊息都充滿廢土風味

## 🛠️ 開發者資訊

### 技術棧
- **FastAPI**: 現代Python Web框架
- **Pydantic**: 數據驗證和序列化
- **Swagger/OpenAPI 3.0**: 自動API文件生成
- **Uvicorn**: ASGI服務器

### 環境需求
- Python 3.11+
- FastAPI
- Pydantic
- Uvicorn

### API版本
- **當前版本**: v3.0.0
- **API路徑**: `/api/v1/`
- **文件版本**: OpenAPI 3.0

## 🎮 特色功能

### ☢️ 輻射系統
每張卡牌都有輻射因子 (0.0-1.0)，影響隨機抽卡和解讀深度。

### ⚖️ 業力系統
支援善良、中立、邪惡三種業力對齊，影響卡牌解讀角度。

### 🎯 威脅等級
每張卡牌都有威脅等級 (1-10)，反映其在廢土中的危險程度。

## 🔗 相關連結

- **前端應用**: http://localhost:3000
- **API基礎地址**: http://localhost:8000
- **健康檢查**: http://localhost:8000/health
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

> 戰爭...戰爭從不改變。但現在你有了完整的API文件來指引你在廢土中的塔羅之旅！ ☢️🔮