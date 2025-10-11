# CLAUDE.md

## 最重要的指導原則：

- DO NOT OVERDESIGN! DO NOT OVERENGINEER!
- 不要過度設計！不要過度工程化！

## 🚫 絕對禁止使用的套件

**嚴格禁止使用 `lucide-react`**：
- ❌ 不要 `import` 任何 lucide-react 的圖示
- ❌ 不要安裝或建議安裝 lucide-react
- ✅ 只使用 `<PixelIcon>` 元件 (`@/components/ui/icons`)
- 📖 查看可用圖示：訪問 `/icon-showcase` 或參考下方 Icon System 章節

## 在開始任何任務之前

- 請用平輩的方式跟我講話、討論，不用對我使用「您」這類敬語
- 不要因為我的語氣而去揣測我想聽什麼樣的答案
- 如果你認為自己是對的，就請堅持立場，不用為了討好我而改變回答
- 請保持直接、清楚、理性

### 重要！請善用 MCP 工具！

- 如果要呼叫函式庫但不確定使用方式，請使用 context7 工具取得最新的文件和程式碼範例。

### 套件管理工具
- 前端請使用 bun
- 後端請使用 uv (虛擬環境於 '/backend/.venv')

# Claude Code Spec-Driven Development

Kiro-style Spec Driven Development implementation using claude code slash commands, hooks and agents.

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Commands: `.claude/commands/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

#### Current Specifications
- **reading-save-resume**: Reading save and resume functionality with automatic saving, session recovery, and reading history integration
- **web-audio-system**: Sound effects system utilizing Web Audio APIs for audio generation, playback, and real-time processing
- **daily-bingo-checkin**: Daily login bingo game with monthly card setup, system number generation (1-25 cycle), and reward system for three-line matches
- **fallout-utilitarian-design**: Design system combining Fallout aesthetic with Utilitarian design principles for website visual identity
- **critical-bugs-fix**: Fix critical P0 bugs identified in testing: missing registration API, audio file 404s, API path errors, and routing issues
- **swagger-ui-zh-tw-localization**: Localize all Swagger UI descriptions, parameter names, and documentation to Traditional Chinese (zh-TW)
- **frontend-backend-architecture-refactor**: Refactor frontend-backend architecture to eliminate direct Supabase access from frontend, ensuring all data flows through backend API layer
- **cards-page-refactor**: Frontend cards page refactoring with suit selection, paginated card browsing, and detailed card information pages
- **homepage-quick-reading-demo**: Homepage quick reading demo with 5 fixed Major Arcana cards in carousel layout, including mocked interpretation results and voice reading functionality
- **static-info-pages**: Static information pages (About Us, Privacy Policy, Terms of Service, Contact Support) with Fallout-themed content and Taiwan privacy law compliance
- **custom-scrollbar-styling**: Custom scrollbar styling with colors that match the website's design theme for improved visual consistency
- **hero-section-dynamic-titles**: Homepage Hero section dynamic titles with multiple science-meets-mysticism themed headlines, Fallout aesthetic styling, JSON data storage, and text typing animation effects
- **3d-card-tilt-effects**: 3D card tilt effects with mouse hover interactions and mobile gyroscope support for immersive card display
- **ascii-donut-loading**: ASCII 3D spinning donut animation for loading page using mathematical torus rendering with rotation matrices and z-buffer depth handling
- **playlist-music-player**: User-controlled playlist music system with Fallout Pip-Boy styled player interface, replacing automatic scene-based background music
- **cubic-11-font-integration**: Apply Cubic_11.woff2 font as the primary typeface across the entire website for consistent typography
- **pixel-icon-replacement**: Replace lucide-react icon system with pixelarticons package (486 pixel-style icons) for consistent Fallout aesthetic with TypeScript support and accessibility compliance. **⚠️ lucide-react 已完全移除，只使用 PixelIcon**

## Font Integration (Cubic 11 Pixel Font)

**📖 完整使用指南請參考**: [`.kiro/specs/cubic-11-font-integration/USAGE.md`](.kiro/specs/cubic-11-font-integration/USAGE.md)

### 快速摘要

**字體名稱**: Cubic 11 (11×11 像素點陣字體)
**字元支援**: 4808+ 繁體中文 + 完整拉丁字母
**檔案位置**: `/public/fonts/Cubic_11.woff2` (400KB)

### 核心原則

```tsx
// ✅ 推薦：什麼都不用做，自動繼承
<div className="text-pip-boy-green">
  這段文字會自動使用 Cubic 11 字體
</div>

// ❌ 不要硬編碼字體
<div className="font-mono text-pip-boy-green">  // 不要這樣做
  這會覆蓋全域字體設定
</div>
```

### 整合策略
- **全域應用**: `layout.tsx` 的 body 元素使用 `font-cubic` className
- **自動繼承**: 所有子元件自動繼承，無需手動指定
- **CSS 變數**: 自訂樣式使用 `font-family: inherit` 或 `var(--font-cubic)`

### 參考文件
- **使用指南**: `.kiro/specs/cubic-11-font-integration/USAGE.md` ⭐
- **詳細設計**: `.kiro/specs/cubic-11-font-integration/design.md`
- **實作計畫**: `.kiro/specs/cubic-11-font-integration/tasks.md`

## Icon System (PixelIcon) - Phase 6: Visual Polish ✨

**📖 完整使用指南請參考**: [`src/components/ui/icons/README.md`](src/components/ui/icons/README.md)

### ⚠️ 重要提醒：絕對不要使用 Lucide Icons

**🚫 禁止使用**: `lucide-react` 套件已完全被 PixelIcon 取代
**✅ 唯一正確**: 全站統一使用 `<PixelIcon>` 元件

```tsx
// ❌ 絕對禁止！不要再使用 lucide-react
import { Home, User, Settings } from 'lucide-react'  // 已棄用且移除

// ✅ 唯一正確的方式
import { PixelIcon } from '@/components/ui/icons'
<PixelIcon name="home" />
<PixelIcon name="user" />
<PixelIcon name="settings" />
```

### 快速摘要

**圖示套件**: pixelarticons (486 個像素風格圖示)
**基準尺寸**: 24×24px (支援 16-96px)
**授權**: MIT License
**Phase 6 新功能**: 動畫效果、語意化顏色、尺寸預設 🎨
**重要**: 絕對不要使用 lucide-react，只使用 PixelIcon

### 核心原則

```tsx
// ✅ 唯一正確：使用 PixelIcon 元件
import { PixelIcon } from '@/components/ui/icons'

// ❌ 嚴格禁止：不要使用 lucide-react
import { Home } from 'lucide-react'  // 絕對不要這樣做！

// ✅ Phase 6 推薦：使用增強功能
// 載入中圖示（動畫 + 語意化顏色）
<PixelIcon
  name="loader"
  sizePreset="md"
  variant="primary"
  animation="spin"
  decorative
/>

// 錯誤訊息（搖晃動畫 + 錯誤色）
<PixelIcon
  name="alert-triangle"
  sizePreset="xs"
  variant="error"
  animation="wiggle"
  aria-label="錯誤"
/>

// 成功狀態（成功色）
<PixelIcon
  name="check"
  sizePreset="sm"
  variant="success"
  aria-label="成功"
/>

// ⚠️ 舊語法仍可用，但強烈建議升級
<PixelIcon name="close" size={24} className="text-red-500" />  // 可用但不推薦
```

### Phase 6 新功能

#### 🎬 動畫效果 (7種)
```tsx
animation="pulse"    // 脈衝 - 載入、通知
animation="spin"     // 旋轉 - 載入、同步
animation="bounce"   // 彈跳 - 提示、警告
animation="ping"     // Ping - 通知點
animation="fade"     // 淡入淡出 - 切換
animation="wiggle"   // 搖晃 - 錯誤、警告
animation="float"    // 懸浮 - 提示
```

#### 🎨 語意化顏色 (8種，高對比度)
```tsx
variant="default"    // 繼承當前顏色
variant="primary"    // Pip-Boy Green (#00ff88)
variant="secondary"  // Radiation Orange (#ff8800)
variant="success"    // Bright Green (#00ff41)
variant="warning"    // Warning Yellow (#ffdd00)
variant="error"      // Deep Red (#ef4444)
variant="info"       // Vault Blue (#0055aa)
variant="muted"      // Gray (#6b7280)
```

#### 📏 尺寸預設 (6種)
```tsx
sizePreset="xs"   // 16px - 小型圖示、表單錯誤
sizePreset="sm"   // 24px - 中型按鈕、控制項
sizePreset="md"   // 32px - 標準圖示
sizePreset="lg"   // 48px - 大型圖示、空狀態
sizePreset="xl"   // 72px - 超大圖示、警告
sizePreset="xxl"  // 96px - 巨大圖示、展示
```

### 實際應用範例

```tsx
// 載入狀態
<PixelIcon name="loader" animation="spin" variant="primary" sizePreset="md" decorative />

// 錯誤警告
<PixelIcon name="alert" animation="wiggle" variant="error" sizePreset="md" decorative />

// 成功訊息
<PixelIcon name="check" variant="success" sizePreset="md" decorative />

// 網路離線
<PixelIcon name="wifi-off" animation="pulse" variant="warning" sizePreset="xs" decorative />

// 播放中按鈕
<PixelIcon
  name={isPlaying ? "pause" : "play"}
  variant="primary"
  sizePreset="sm"
  aria-label={isPlaying ? "暫停" : "播放"}
/>

// 刪除操作
<PixelIcon name="trash" variant="error" sizePreset="xs" aria-label="刪除" />
```

### 整合策略
- **🚫 絕對禁止**: 不要使用 `lucide-react`，該套件已完全移除
- **✅ 統一元件**: 全站只使用 `<PixelIcon>`，無例外
- **📖 圖示預覽**: 訪問 `/icon-showcase` 查看所有動畫、顏色和尺寸組合 (336種組合)
- **♿ 無障礙優先**: 互動式圖示必須提供 `aria-label`，裝飾性圖示使用 `decorative` prop
- **⚡ 效能優化**: 內建快取機制，關鍵圖示已預載 (< 10KB bundle)
- **🎬 動畫性能**: 支援 `prefers-reduced-motion`，自動為需要的用戶停用動畫
- **🎨 語意化優先**: 使用 `variant` 和 `sizePreset` 取代硬編碼的 className 和 size

### 最佳實踐

```tsx
// ❌ 絕對禁止：使用 lucide-react
import { AlertTriangle } from 'lucide-react'
<AlertTriangle className="text-red-500" />  // 不要這樣做！

// ✅ 推薦：使用 PixelIcon 語意化 API
import { PixelIcon } from '@/components/ui/icons'
<PixelIcon name="alert-triangle" variant="error" sizePreset="xs" animation="wiggle" />

// ⚠️ 不推薦：硬編碼樣式（但仍可用）
<PixelIcon name="alert" size={16} className="text-red-500 animate-bounce" />

// ✅ 推薦：條件動畫
<PixelIcon
  name="music"
  variant="primary"
  animation={isPlaying ? 'pulse' : undefined}
/>

// ✅ 推薦：狀態驅動的顏色
<PixelIcon
  name="shuffle"
  variant={shuffleEnabled ? 'primary' : 'muted'}
/>
```

### 🚫 圖示系統禁止事項

1. **不要安裝 lucide-react**: 該套件已從 dependencies 中完全移除
2. **不要 import lucide 圖示**: 所有 `import { X } from 'lucide-react'` 都是錯誤的
3. **不要使用其他圖示庫**: 統一使用 PixelIcon
4. **找不到圖示時**: 查看 `/icon-showcase` 或 [pixelarticons.com](https://pixelarticons.com/)

### ✅ 正確的開發流程

當你需要使用圖示時：

1. **只使用 PixelIcon**: `import { PixelIcon } from '@/components/ui/icons'`
2. **查找圖示名稱**: 訪問 `/icon-showcase` 或參考 486 個可用圖示
3. **使用語意化 API**: 優先使用 `variant`、`sizePreset`、`animation`
4. **確保無障礙**: 互動式圖示加上 `aria-label`，裝飾性加上 `decorative`

### 參考文件
- **使用指南**: `src/components/ui/icons/README.md` ⭐
- **功能展示**: `/icon-showcase` - 互動式展示頁面 🎨
- **遷移指南**: `src/components/ui/icons/MIGRATION.md`
- **詳細設計**: `.kiro/specs/pixel-icon-replacement/design.md`
- **實作計畫**: `.kiro/specs/pixel-icon-replacement/tasks.md`
- **工具函式**: `src/components/ui/icons/iconUtils.ts`

## Development Guidelines
- 以英文思考，但以繁體中文生成回應（Think in English, generate in Traditional Chinese）

## Workflow

### Phase 0: Steering (Optional)
`/kiro:steering` - Create/update steering documents
`/kiro:steering-custom` - Create custom steering for specialized contexts

Note: Optional for new features or small additions. You can proceed directly to spec-init.

### Phase 1: Specification Creation
1. `/kiro:spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro:spec-requirements [feature]` - Generate requirements document
3. `/kiro:spec-design [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
4. `/kiro:spec-tasks [feature]` - Interactive: Confirms both requirements and design review

### Phase 2: Progress Tracking
`/kiro:spec-status [feature]` - Check current progress and phases

## Development Rules
1. **Consider steering**: Run `/kiro:steering` before major development (optional for new features)
2. **Follow 3-phase approval workflow**: Requirements → Design → Tasks → Implementation
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro:steering` after significant changes
7. **Check spec compliance**: Use `/kiro:spec-status` to verify alignment

## Steering Configuration

### Current Steering Files
Managed by `/kiro:steering` command. Updates here reflect command changes.

### Active Steering Files
- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro:steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes
- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., "*.test.js")
- **Manual**: Reference with `@filename.md` syntax

