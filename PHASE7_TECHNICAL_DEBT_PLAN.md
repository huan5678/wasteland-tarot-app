# Phase 7: 技術債務清理計劃

**日期**: 2025-10-10
**狀態**: 🔄 規劃中

---

## 問題總結

### 1. Cypress TypeScript 錯誤 (50+ 錯誤)

#### 主要問題類型：

**A. 缺少方法類型定義** (`.tab()`, `.or()`)
```typescript
// 錯誤範例：
cypress/e2e/auth-flow.cy.ts(252,22): error TS2339: Property 'tab' does not exist
cypress/e2e/card-library.cy.ts(43,10): error TS2339: Property 'or' does not exist
```

**B. 自定義命令類型缺失**
```typescript
// 錯誤範例：
error TS2339: Property 'screenshotVault' does not exist
error TS2339: Property 'registerNewVaultDweller' does not exist
error TS2339: Property 'logPipBoyStatus' does not exist
```

#### 解決方案：

##### A. 修復 `.tab()` 方法
問題：測試中使用了 `cy.get('body').tab()` 但缺少類型定義

**方案 1**: 安裝 `cypress-plugin-tab` 包
```bash
bun add -D cypress-plugin-tab
```

**方案 2**: 使用原生 Cypress `.type('{tab}')` 替代
```typescript
// 修改前
cy.get('body').tab()

// 修改後
cy.get('body').type('{tab}')
```

##### B. 修復 `.or()` 方法
問題：使用了不存在的 `.or()` 方法

**解決**: 重構為標準 Cypress 語法
```typescript
// 修改前
cy.get('[data-testid="card"]').or('[data-testid="fallback"]')

// 修改後
cy.get('[data-testid="card"], [data-testid="fallback"]')
// 或使用
cy.get('[data-testid="card"]').then(($el) => {
  if ($el.length === 0) {
    cy.get('[data-testid="fallback"]')
  }
})
```

##### C. 修復自定義命令類型
問題：`cypress/support/types.ts` 已經定義但未被正確載入

**解決**: 確保 tsconfig.json 包含 Cypress 類型
```json
{
  "compilerOptions": {
    "types": ["cypress", "@percy/cypress", "cypress-axe"]
  },
  "include": [
    "cypress/**/*.ts",
    "cypress.config.ts"
  ]
}
```

---

### 2. Vitest Import 錯誤

#### 檢查狀態：
```bash
# 檢查是否有 Vitest 配置
ls -la vitest.config.* 2>/dev/null

# 檢查 package.json 中的 vitest 依賴
grep "vitest" package.json
```

#### 可能問題：
- Vitest 未安裝但被引用
- 測試文件 import 路徑錯誤
- 配置檔案缺失

#### 解決方案（待確認）：
1. 如果專案使用 Vitest，安裝並配置：
```bash
bun add -D vitest @vitest/ui
```

2. 如果不使用，移除相關 import

---

### 3. TypeScript 類型錯誤

#### 主要錯誤來源：
從 `bun run tsc --noEmit` 輸出來看，主要是 Cypress 相關錯誤

#### 其他可能的類型錯誤：
- 前端組件的 `any` 類型濫用
- 缺少第三方庫的類型定義
- Props 類型不完整

---

## 執行計劃

### Phase 7.1: Cypress 測試修復 ⚡ Priority: P0

**預估時間**: 1-2 小時

#### 步驟：

1. **創建 cypress/tsconfig.json**
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["cypress", "@percy/cypress", "cypress-axe"],
    "isolatedModules": false,
    "esModuleInterop": true
  },
  "include": [
    "**/*.ts",
    "../cypress.config.ts"
  ]
}
```

2. **修復 .tab() 使用**
```bash
# 搜尋所有使用 .tab() 的檔案
grep -r "\.tab()" cypress/e2e/

# 替換為 .type('{tab}')
```

影響檔案：
- `cypress/e2e/auth-flow.cy.ts:252`
- `cypress/e2e/auth-flow.cy.ts:255`
- `cypress/e2e/auth-flow.cy.ts:258`
- `cypress/e2e/card-library.cy.ts:324`

3. **修復 .or() 使用**
```bash
# 搜尋所有使用 .or() 的檔案
grep -r "\.or()" cypress/e2e/
```

影響檔案：
- `cypress/e2e/card-library.cy.ts:43`
- `cypress/e2e/card-library.cy.ts:70`

4. **驗證自定義命令類型載入**
```bash
# 檢查 cypress/support/e2e.ts 是否正確 import types
grep -A 5 "import.*types" cypress/support/e2e.ts
```

5. **執行測試驗證**
```bash
# 檢查 TypeScript 錯誤
bun run tsc --noEmit

# 執行 Cypress 測試（headless）
npx cypress run

# 或開啟 Cypress UI
npx cypress open
```

---

### Phase 7.2: Vitest 配置檢查 ⚡ Priority: P1

**預估時間**: 30分鐘

#### 步驟：

1. **檢查是否使用 Vitest**
```bash
find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v cypress | grep -v node_modules
```

2. **決定：安裝或移除**
- 如果有測試文件 → 安裝並配置 Vitest
- 如果沒有 → 確認沒有錯誤的 import

3. **如果安裝 Vitest**
```bash
bun add -D vitest @vitest/ui

# 創建 vitest.config.ts
```

---

### Phase 7.3: 其他 TypeScript 錯誤 ⚡ Priority: P2

**預估時間**: 2-3 小時

#### 步驟：

1. **收集非 Cypress 錯誤**
```bash
bun run tsc --noEmit | grep -v "cypress/" > typescript-errors.txt
```

2. **分類錯誤**
- 組件 Props 類型錯誤
- API 回應類型錯誤
- 第三方庫類型缺失
- `any` 類型濫用

3. **逐一修復**
- 從最常見的錯誤開始
- 優先修復 P0/P1 的組件

---

### Phase 7.4: Critical Bugs (from spec) ⚡ Priority: P0

參考 `.kiro/specs/critical-bugs-fix/` spec 文件

**主要問題**：
1. 缺失的註冊 API
2. 音檔 404 錯誤
3. API 路徑錯誤
4. 路由問題

**處理方式**：
- 使用 `/kiro:spec-status critical-bugs-fix` 檢查進度
- 如果 spec 已完成，執行實作
- 如果 spec 未完成，先完成 spec

---

## 檢查清單

### Phase 7.1 完成條件：
- [ ] Cypress TypeScript 錯誤 = 0
- [ ] 所有測試可以執行（可以失敗但不能有類型錯誤）
- [ ] `bun run tsc --noEmit` Cypress 相關錯誤 = 0

### Phase 7.2 完成條件：
- [ ] Vitest 配置正確或已移除相關 import
- [ ] 無 Vitest 相關 import 錯誤

### Phase 7.3 完成條件：
- [ ] 主要組件無類型錯誤
- [ ] `any` 類型使用減少 50%
- [ ] 核心 API 回應有完整類型

### Phase 7.4 完成條件：
- [ ] Critical bugs spec 完成
- [ ] 所有 P0 bugs 修復
- [ ] 測試通過

---

## 快速開始

### 立即執行 Phase 7.1：

```bash
# 1. 創建 Cypress tsconfig
cat > cypress/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["cypress", "@percy/cypress", "cypress-axe"],
    "isolatedModules": false
  },
  "include": ["**/*.ts"]
}
EOF

# 2. 替換 .tab() 為 .type('{tab}')
find cypress/e2e -name "*.ts" -exec sed -i '' 's/\.tab()/\.type("{tab}")/g' {} \;

# 3. 驗證
bun run tsc --noEmit | grep cypress
```

---

## 相關文件

- Cypress 配置: `cypress.config.ts`
- Cypress 類型: `cypress/support/types.ts`
- Cypress 命令: `cypress/support/commands.ts`
- Critical Bugs Spec: `.kiro/specs/critical-bugs-fix/`

---

## 下一步

完成 Phase 7 後：
- ✅ 測試框架穩定
- ✅ 類型安全提升
- ✅ Critical bugs 修復
- ➡️ 可以開始 Phase 8 (功能完善)

---

**建立時間**: 2025-10-10 18:45
**預計完成時間**: 2025-10-11 (4-6 hours)
