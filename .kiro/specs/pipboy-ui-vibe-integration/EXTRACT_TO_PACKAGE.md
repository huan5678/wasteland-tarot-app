# 提取 PipBoy UI 為獨立套件指南

## 目標

將 `src/components/ui/pipboy/` 目錄下的元件提取為獨立的 npm 套件 `@wasteland-tarot/pipboy-ui`。

---

## 步驟 1：創建新的 Git 倉庫

```bash
# 在 GitHub 創建新倉庫
# https://github.com/huan5678/pipboy-ui-vibe

# Clone 到本地
git clone https://github.com/huan5678/pipboy-ui-vibe.git
cd pipboy-ui-vibe
```

---

## 步驟 2：初始化 TypeScript 套件

```bash
# 初始化 package.json
npm init -y

# 安裝開發依賴
npm install -D typescript @types/react @types/react-dom
npm install -D tsup # 打包工具
npm install -D @changesets/cli # 版本管理

# 安裝 peer dependencies（不打包進套件）
npm install --save-peer react react-dom
npm install --save-peer class-variance-authority
npm install --save-peer @radix-ui/react-dialog
npm install --save-peer @radix-ui/react-select
npm install --save-peer @radix-ui/react-label
```

---

## 步驟 3：複製元件檔案

```bash
# 從 wasteland-tarot-app 複製
cp -r ../wasteland-tarot-app/src/components/ui/pipboy/PipBoy*.tsx ./src/
cp -r ../wasteland-tarot-app/src/components/ui/pipboy/__tests__ ./src/
cp ../wasteland-tarot-app/src/components/ui/pipboy/index.ts ./src/
cp ../wasteland-tarot-app/src/components/ui/pipboy/README.md ./
cp ../wasteland-tarot-app/src/components/ui/pipboy/MIGRATION.md ./docs/
```

---

## 步驟 4：設定 package.json

```json
{
  "name": "@wasteland-tarot/pipboy-ui",
  "version": "1.0.0",
  "description": "Pip-Boy 風格 React UI 元件系統",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest",
    "lint": "eslint src",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-label": "^2.0.0"
  },
  "keywords": [
    "react",
    "ui",
    "components",
    "pipboy",
    "fallout",
    "design-system"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/huan5678/pipboy-ui-vibe.git"
  },
  "license": "MIT"
}
```

---

## 步驟 5：設定 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.tsx"]
}
```

---

## 步驟 6：設定 tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'class-variance-authority',
    '@radix-ui/react-dialog',
    '@radix-ui/react-select',
    '@radix-ui/react-label',
  ],
})
```

---

## 步驟 7：調整 import 路徑

```typescript
// 移除專案特定的 imports
// ❌ import { cn } from '@/lib/utils'
// ✅ 內部實作 cn 函式或要求使用者提供

// ❌ import { useAudioEffect } from '@/hooks/audio/useAudioEffect'
// ✅ 移除音效功能或作為可選 callback

// ❌ import { PixelIcon } from '@/components/ui/icons'
// ✅ 改為 children prop 或移除圖示依賴
```

---

## 步驟 8：建立文檔網站（選用）

```bash
# 使用 Nextra 或 Storybook
npm install -D storybook
npx storybook init

# 或使用 Nextra
npm install nextra nextra-theme-docs
```

---

## 步驟 9：發布到 npm

```bash
# 登入 npm
npm login

# 發布（第一次）
npm publish --access public

# 後續更新
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
npm publish
```

---

## 步驟 10：在 wasteland-tarot-app 中使用套件

```bash
# 移除本地元件
rm -rf src/components/ui/pipboy/PipBoy*.tsx

# 安裝套件
npm install @wasteland-tarot/pipboy-ui

# 更新 imports
# ❌ import { PipBoyButton } from '@/components/ui/pipboy'
# ✅ import { PipBoyButton } from '@wasteland-tarot/pipboy-ui'
```

---

## 優點與缺點權衡

### ✅ 提取為獨立套件的優點

1. **可重用性**：可在多個專案中使用
2. **版本控制**：獨立的語意化版本
3. **關注分離**：元件開發與業務邏輯分離
4. **社群貢獻**：開源後可接受 PR
5. **專業形象**：展示設計系統能力

### ❌ 提取為獨立套件的缺點

1. **維護成本**：需要獨立的 CI/CD、測試、文檔
2. **更新流程**：修改元件需要發布新版本
3. **依賴管理**：需要處理 peer dependencies
4. **打包複雜度**：需要設定 TypeScript、tsup
5. **API 穩定性**：需要更謹慎的 breaking changes

---

## 建議決策標準

### 🟢 應該提取為獨立套件（如果符合以下任一條件）

- [ ] 計劃在 3+ 個專案中使用
- [ ] 希望開源並接受社群貢獻
- [ ] 團隊有資源維護獨立套件
- [ ] 元件系統已經成熟穩定
- [ ] 希望建立設計系統品牌

### 🟡 可以考慮提取（中性）

- [ ] 在 2 個專案中使用
- [ ] 元件系統接近穩定
- [ ] 有基本的維護資源

### 🔴 不建議提取（當前狀態更好）

- [ ] 只在 1 個專案中使用 ← **當前狀況**
- [ ] 元件仍在快速迭代
- [ ] 沒有維護資源
- [ ] 與專案業務邏輯緊密耦合

---

## 當前建議

基於目前的情況，我建議：

**保持在專案內**（選項 A）✅

**原因**：
1. 只在 wasteland-tarot-app 使用
2. 元件與專案邏輯有耦合（音效、圖示）
3. 仍在快速迭代階段
4. 維護成本較低

**未來考慮提取的時機**：
- 需要在第 2 個專案中使用時
- 元件 API 穩定後（v1.0.0）
- 移除專案特定依賴後（音效、圖示）

---

## 混合方案（推薦）

保持元件在專案內，但組織成**易於提取**的結構：

```
src/components/ui/pipboy/
├── core/              # 核心元件（無外部依賴）
│   ├── PipBoyButton.tsx
│   ├── PipBoyCard.tsx
│   └── ...
├── integrations/      # 專案特定整合
│   ├── withAudio.tsx  # 音效 HOC
│   └── withIcon.tsx   # 圖示 HOC
├── index.ts           # 統一匯出
└── package.json       # 內部 package（可選）
```

這樣未來要提取時只需要複製 `core/` 目錄。

---

**最後更新**：2025-10-30
