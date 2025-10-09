# CLAUDE.md

## 最重要的指導原則：

- DO NOT OVERDESIGN! DO NOT OVERENGINEER!
- 不要過度設計！不要過度工程化！

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
- **doto-font-numbers**: Apply Google Font Doto to all numeric displays across the frontend UI
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

