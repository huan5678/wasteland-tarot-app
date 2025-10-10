# Phase 4: Frontend Type Fixes

## 問題總結

後端 Phase 1-3 修改了以下結構：
1. **User model**: `username` → `name` (display name 用途)
2. **ReadingSession model** (原名 `SessionSave`): 代表 **未完成的** session (save/resume feature)
   - 欄位: `selected_cards`, `current_position`, `session_data`
   - 表名: `reading_sessions`
3. **CompletedReading model** (原名 `ReadingSession`): 代表 **已完成的** reading
   - 表名: `completed_readings`
4. **SessionEvent model**: 新的 event tracking table

## 前端類型問題

### 1. `/src/types/database.ts`

**User interface (Line 185-217)**:
- ❌ Line 188: `username: string` - 應為 `name: string`
- 實際欄位名稱在後端已從 `username` 改為 `name`

**ReadingSession interface (Line 342-364)**:
- ⚠️ **名稱誤導**: 這個 interface 實際上對應 `completed_readings` 表
- ⚠️ **欄位不匹配**: 後端 CompletedReading model 有不同的欄位結構
- 建議重新命名為 `CompletedReading` 以符合後端

**缺少的類型**:
- ❌ 缺少對應 `reading_sessions` 表的類型 (SavedSession/InProgressSession)
- ❌ 缺少對應 `session_events` 表的類型 (SessionEvent)

### 2. `/src/types/api.ts`

**UserSchema (Line 157-176)**:
- ✅ Line 159: `username: z.string().optional()` - 標記為"向後相容"，正確
- ✅ Line 160: `name: z.string()` - 已經有正確的欄位

**ReadingSchema (Line 125-139)**:
- ⚠️ 需要確認這是對應 `completed_readings` 還是 `reading_sessions`

## 修復計劃

### Step 1: 更新 User interface in database.ts
```typescript
export interface User {
  id: string;
  email: string;
  name: string;  // Changed from username
  display_name?: string;
  // ... rest of fields
}
```

### Step 2: 重新命名並更新 ReadingSession → CompletedReading
```typescript
export interface CompletedReading {
  id: string;
  user_id: string;
  question: string;
  spread_template_id?: string;
  focus_area?: string;  // NEW
  character_voice_used: CharacterVoice;
  karma_context?: string;
  privacy_level: 'private' | 'friends' | 'public';  // NEW
  allow_public_sharing: boolean;  // NEW
  tags: string[];  // NEW
  // ... updated fields
}
```

### Step 3: 添加新的 SavedSession interface
```typescript
export interface SavedSession {
  id: string;
  user_id: string;
  spread_type: string;
  question?: string;
  selected_cards: any[];  // JSONB
  current_position: number;
  session_data: Record<string, any>;  // JSONB
  status: 'active' | 'paused' | 'complete';
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### Step 4: 添加 SessionEvent interface
```typescript
export interface SessionEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;  // JSONB
  card_position?: number;
  timestamp: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}
```

### Step 5: 更新所有使用這些類型的文件
- Store files
- API client files
- Component files
- Test files

## 向後兼容性

為了不破壞現有代碼：
1. 保留 `User.username` 作為 `name` 的 alias (deprecated)
2. 保留 `ReadingSession` 類型作為 `CompletedReading` 的 alias (deprecated)
3. 添加註釋標記棄用的欄位

## 測試計劃

1. TypeScript 編譯測試
2. API client 測試
3. Component 單元測試
4. E2E 測試

## 檔案清單

需要修改的檔案：
- [ ] `/src/types/database.ts` - 主要類型定義
- [ ] `/src/types/api.ts` - API schemas (檢查是否需要更新)
- [ ] `/src/lib/readingsStore.ts` - Reading store
- [ ] `/src/lib/quickReadingStorage.ts` - Quick reading storage
- [ ] 任何使用這些類型的 components
- [ ] 測試文件

## 執行順序

1. 先更新 `database.ts` 核心類型
2. 執行 TypeScript 編譯，找出所有錯誤
3. 逐一修復編譯錯誤
4. 執行測試
5. 更新文檔
