# Technical Design: Fallout Utilitarian Design System

## Overview

This technical design document outlines the implementation approach for a comprehensive design system that merges Fallout's retrofuturistic aesthetic with utilitarian design principles. The design system will formalize and extend existing Fallout-themed visual elements (colors, typography, animations) into a structured, documentation-driven framework that prioritizes function, accessibility, and developer efficiency.

**Core Philosophy**: Every visual element serves a clear functional purpose (information hierarchy, user guidance, or interaction feedback) while maintaining the iconic post-apocalyptic atmosphere of the Fallout universe through subtle effects, intentional color usage, and terminal-inspired interfaces.

**Implementation Scope**: This is a documentation and refinement project that organizes existing CSS variables, Tailwind utilities, and component patterns into a cohesive design system, with minimal new code beyond documentation files and token organization.

## Requirements Mapping

### Design Component Traceability

Each design component addresses specific requirements from requirements.md:

- **Design Philosophy Documentation** → Req 1: Core Design Philosophy Documentation
- **Typography Scale & Token System** → Req 2: Typography System, Req 11: Design Token System
- **Functional Color Palette Organization** → Req 3: Functional Color System, Req 11: Design Token System
- **Spacing & Layout Grid** → Req 4: Grid and Layout System, Req 11: Design Token System
- **Component Pattern Library** → Req 5: Component Design Standards, Req 12: Documentation and Design Resources
- **Icon System Guidelines** → Req 6: Iconography and Visual Elements
- **Animation Standards** → Req 7: Motion and Animation Principles
- **Accessibility Framework** → Req 8: Accessibility Integration
- **Responsive Patterns** → Req 9: Responsive Design Standards
- **Performance Guidelines** → Req 10: Performance and Optimization Standards
- **Documentation Portal** → Req 12: Documentation and Design Resources

### User Story Coverage

1. **Developer Efficiency** (Req 1, 5, 11, 12): Quick-start guides, component examples, and centralized token system reduce implementation time
2. **User Readability** (Req 2, 8): Typography system with WCAG AA contrast ensures efficient information consumption
3. **Designer Consistency** (Req 3, 6): Purpose-driven color palette and icon system maintain visual coherence
4. **Frontend Developer Productivity** (Req 4, 11): Flexible grid system and design tokens enable rapid layout construction
5. **UI Developer Speed** (Req 5, 12): Standardized component patterns with documented variants accelerate interface building
6. **Motion Sensitivity** (Req 7): Subtle, purposeful animations respect user preferences
7. **Accessibility Compliance** (Req 8, 9): WCAG 2.1 AA standards and responsive patterns ensure inclusive design
8. **Performance** (Req 10): Optimized assets and GPU-accelerated animations maintain fast load times
9. **Team Onboarding** (Req 12): Comprehensive documentation enables quick team member integration

## Architecture

### System Structure

```mermaid
graph TB
    subgraph "Design System Foundation"
        A[Design Tokens<br/>CSS Variables]
        B[Tailwind Config<br/>tailwind.config.ts]
        C[Global Styles<br/>globals.css]
    end

    subgraph "Component Layer"
        D[UI Primitives<br/>src/components/ui/]
        E[Layout Components<br/>src/components/layout/]
        F[Domain Components<br/>src/components/{domain}/]
    end

    subgraph "Documentation Layer"
        G[Philosophy & Principles<br/>design-system/00-philosophy.md]
        H[Token Reference<br/>design-system/01-tokens.md]
        I[Component Library<br/>design-system/02-components.md]
        J[Pattern Catalog<br/>design-system/03-patterns.md]
        K[Quick Start Guide<br/>design-system/04-quick-start.md]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F

    G --> H
    H --> I
    I --> J
    J --> K

    A -.token reference.-> H
    D -.component docs.-> I
    F -.pattern examples.-> J
```

### Technology Stack

**Frontend Foundation** (Existing - No Changes Required):
- **Framework**: Next.js 15.1.7 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4.1.13 with PostCSS 8
- **Component Primitives**: Radix UI (buttons, selects, labels)
- **Fonts**: JetBrains Mono (monospace), Doto (numerics via `--font-doto`)

**Design System Tooling** (Documentation Only):
- **Token Management**: CSS Custom Properties (already implemented in `globals.css`)
- **Documentation Format**: Markdown files in `.kiro/specs/fallout-utilitarian-design/design-system/`
- **Diagram Generation**: Mermaid (for architecture and flow diagrams)
- **Code Examples**: TypeScript/TSX snippets with syntax highlighting

### Architecture Decision Rationale

**Why Documentation-First Approach**:
- **Current State**: Existing codebase already has robust Fallout theming (200+ CSS variables, Tailwind config, themed components)
- **Research Finding**: Design systems succeed through "clear communication, comprehensive documentation, and collaborative approach" (Howik, 2025)
- **Implementation Strategy**: Organize and document existing patterns rather than rewrite code, reducing risk and development time

**Why CSS Custom Properties for Tokens**:
- **Tailwind v4 Native Support**: "Use @theme when you want a design token to map directly to a utility class" - tokens already defined as CSS variables
- **Runtime Flexibility**: Design tokens available at runtime enable theme switching and dynamic updates
- **Performance**: Zero JavaScript overhead; CSS variables are native browser features

**Why Modular Documentation Structure**:
- **Developer Efficiency**: Separate files for philosophy, tokens, components, patterns enable quick reference without context switching
- **Maintainability**: Each document has single responsibility, easier to update as system evolves
- **Onboarding**: Progressive disclosure - developers can start with quick-start and dive deeper as needed

**Why 8px Base Unit**:
- **Industry Standard**: Aligns with common design system practices (Material Design, Ant Design, Tailwind default)
- **Mathematical Simplicity**: Easy mental math for spacing calculations (2 units = 16px, 3 units = 24px)
- **Existing Alignment**: Current Tailwind config already uses 4px increments compatible with 8px base

## Documentation Structure

### File Organization

```
.kiro/specs/fallout-utilitarian-design/design-system/
├── 00-philosophy.md           # Utilitarian Fallout design principles
├── 01-tokens.md               # Complete token reference
│   ├── Color tokens
│   ├── Typography tokens
│   ├── Spacing tokens
│   ├── Border tokens
│   └── Shadow tokens
├── 02-components.md           # Component library documentation
│   ├── Buttons (7 variants)
│   ├── Forms (inputs, selects, labels)
│   ├── Cards & Containers
│   ├── Navigation
│   └── Feedback (toasts, modals)
├── 03-patterns.md             # Common UI patterns
│   ├── Page layouts
│   ├── Form patterns
│   ├── Data display patterns
│   └── Navigation patterns
├── 04-quick-start.md          # Developer quick reference
│   ├── Installation (N/A - already in project)
│   ├── First component in 5 minutes
│   ├── Common recipes
│   └── Troubleshooting
└── 05-accessibility.md        # Accessibility guidelines
    ├── WCAG compliance checklist
    ├── Keyboard navigation patterns
    ├── Screen reader considerations
    └── Color contrast reference
```

## Design Token System

### Token Categories and Structure

Based on research findings: "The most important design tokens to start with are colors, typography, and spacing" (Howik, 2025)

#### Color Tokens (Already Implemented in `globals.css`)

**Organization Strategy**: Functional categorization rather than just aesthetic naming

```typescript
// Token structure (documentation, not new code)
interface ColorTokenSystem {
  // Semantic Status Colors (Req 3.2)
  status: {
    success: 'var(--color-success)',        // #00ff88 (Pip-Boy green)
    warning: 'var(--color-warning)',        // #ffdd00 (Warning yellow)
    error: 'var(--color-error)',            // #ff4444 (Error red)
    info: 'var(--color-info)',              // #0088ff (Vault blue variant)
  },

  // Interactive Element Colors (Req 3.3)
  interactive: {
    default: 'var(--color-btn-primary-bg)',
    hover: 'var(--color-btn-primary-hover)',
    active: 'var(--color-btn-primary-active)',
    focus: 'var(--color-btn-primary-focus)',
    disabled: 'var(--color-text-disabled)',
  },

  // Navigation & Wayfinding (Req 3.1)
  navigation: {
    link: 'var(--color-link)',
    linkHover: 'var(--color-link-hover)',
    linkVisited: 'var(--color-link-visited)',
    linkActive: 'var(--color-link-active)',
  },

  // Informational Backgrounds (Req 3.1)
  backgrounds: {
    primary: 'var(--color-bg-primary)',
    secondary: 'var(--color-bg-secondary)',
    tertiary: 'var(--color-bg-tertiary)',
    overlay: 'var(--color-bg-overlay)',
    interactive: 'var(--color-bg-interactive)',
  },
}
```

**Accessibility Enhancement** (Req 3.4):
- WCAG AAA variants already exist: `--color-text-high-contrast`, `--color-text-enhanced-secondary`
- High contrast mode support via `@media (prefers-contrast: high)` in `globals.css:485-494`

#### Typography Tokens (Req 2)

**Scale Definition** (Based on research: 1.2 ratio - minor third scale, 16px minimum)

```typescript
// Typography scale documentation
interface TypographyTokens {
  // Font Families (Req 2.1, 2.2)
  fontFamily: {
    mono: 'JetBrains Mono, Consolas, Monaco, Courier New, monospace',
    doto: 'var(--font-doto), monospace', // Numeric displays
  },

  // Font Sizes - Minor Third Scale (1.2 ratio, 4px rounding)
  // Research: "Font sizes can use a ratio of 1.2...rounded to a multiple of 4px"
  fontSize: {
    xs: '12px',      // 0.75rem - small labels
    sm: '14px',      // 0.875rem - secondary text
    base: '16px',    // 1rem - body text (WCAG minimum)
    lg: '20px',      // 1.25rem - emphasized text
    xl: '24px',      // 1.5rem - H6
    '2xl': '28px',   // 1.75rem - H5
    '3xl': '32px',   // 2rem - H4
    '4xl': '40px',   // 2.5rem - H3
    '5xl': '48px',   // 3rem - H2
    '6xl': '56px',   // 3.5rem - H1
  },

  // Line Heights (Req 2.3, 2.5)
  lineHeight: {
    tight: '1.2',    // Headings
    normal: '1.5',   // Body text
    relaxed: '1.75', // Long-form content
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.05em',  // Doto numeric font
  },
}
```

**Implementation Note**: Typography classes already exist in `globals.css:517-573` (`.numeric`, `.stat-number`, `.counter`)

#### Spacing Tokens (Req 4.2, 4.4)

**8px Base Unit System** (Already in Tailwind config)

```typescript
// Spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128px)
const spacingTokens = {
  0.5: '4px',   // 0.25rem
  1: '8px',     // 0.5rem - base unit
  1.5: '12px',  // 0.75rem
  2: '16px',    // 1rem
  3: '24px',    // 1.5rem
  4: '32px',    // 2rem
  6: '48px',    // 3rem
  8: '64px',    // 4rem
  12: '96px',   // 6rem
  16: '128px',  // 8rem
}
```

#### Border & Shadow Tokens (Req 5.3)

```css
/* Border tokens (minimal, utilitarian) */
--border-width-thin: 1px;
--border-width-default: 2px;
--border-width-thick: 3px;

/* Border radius (subtle, functional) */
--radius: 0.5rem;        /* 8px - default */
--radius-sm: 0.25rem;    /* 4px - small */
--radius-md: 0.375rem;   /* 6px - medium */
--radius-lg: 0.5rem;     /* 8px - large */

/* Shadows (Pip-Boy glow aesthetic, not realistic shadows) */
--shadow-glow-green: 0 0 10px var(--color-glow-green);
--shadow-glow-orange: 0 0 10px var(--color-glow-orange);
--shadow-glow-yellow: 0 0 10px var(--color-glow-yellow);
```

### Token Naming Convention (Req 11.5)

**Established Pattern** (Already in use):
```
--{category}-{element}-{variant}
--color-btn-primary-bg
--color-text-secondary
--color-border-focus
```

**Semantic over Literal**: `--color-success` (semantic) instead of `--color-green-500` (literal)

## Component Design Standards

### Button Component (Req 5.1)

**Existing Implementation**: `src/components/ui/button.tsx` (lines 8-43)

**Documented Variants**:

| Variant | Use Case | Visual Treatment | Accessibility |
|---------|----------|------------------|---------------|
| `default` | Primary actions | Pip-Boy green bg, black text, glow effect | WCAG AAA contrast |
| `destructive` | Delete/remove | Red bg, radiation warning aesthetic | High contrast |
| `outline` | Secondary actions | Transparent bg, green border | 3px focus outline |
| `secondary` | Tertiary actions | Dark bg, green text | Visible states |
| `ghost` | Minimal impact | Transparent, hover bg change | Clear affordance |
| `link` | Inline navigation | Underline on hover, green text | Underline + color |
| `warning` | Caution actions | Yellow bg, dark text | High visibility |

**Size Standards** (Req 5.1, 8.5):

```typescript
// Documented sizes (already implemented)
const buttonSizes = {
  sm: { height: '32px', padding: '0.5rem 0.75rem', minTouchTarget: '44px' },
  default: { height: '36px', padding: '0.5rem 1rem', minTouchTarget: '44px' },
  lg: { height: '40px', padding: '0.5rem 1.5rem', minTouchTarget: '44px' },
  icon: { size: '36px', minTouchTarget: '44px' }, // Square button
}
```

**State Requirements** (Req 5.2, 3.3):

1. **Default**: Base appearance with clear affordance
2. **Hover**: 10%+ luminance change, subtle animation (100-200ms)
3. **Active**: Visual press feedback
4. **Focus**: 3px outline, 2px offset (WCAG 2.4.7)
5. **Disabled**: 50% opacity, pointer-events: none

**Audio Feedback** (Req 5.4): Web Audio API integration already implemented (button.tsx:58-64)

### Form Input Component (Req 5.2)

**Existing Primitives**: `src/components/ui/input.tsx`, `src/components/ui/label.tsx`

**Visual States Documentation**:

```css
/* Input state token mapping */
.input-default {
  background: var(--color-input-bg);
  color: var(--color-input-fg);
  border: 1px solid var(--color-input-border);
}

.input-focus {
  border-color: var(--color-input-border-focus);
  outline: 2px solid var(--color-input-border-focus);
  outline-offset: 1px;
  box-shadow: 0 0 0 3px var(--color-input-focus-ring);
}

.input-error {
  border-color: var(--color-input-border-error);
  /* Supplemented with error icon and text (Req 3.5) */
}

.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
}

.input-success {
  border-color: var(--color-success-border);
  /* Supplemented with checkmark icon (Req 3.5) */
}
```

**Helper Text Pattern**:

```tsx
// Documented pattern for accessible form fields
<div className="form-field">
  <label htmlFor="input-id" className="text-text-primary">
    Field Label
  </label>
  <input
    id="input-id"
    aria-describedby="input-helper input-error"
    className="input-default focus:input-focus"
  />
  <p id="input-helper" className="text-sm text-text-muted">
    Helper text for guidance
  </p>
  {error && (
    <p id="input-error" className="text-sm text-error" role="alert">
      <ErrorIcon aria-hidden="true" /> {errorMessage}
    </p>
  )}
</div>
```

### Card/Container Component (Req 5.3)

**Design Standards**:

```css
/* Utilitarian card pattern */
.card-wasteland {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius);
  padding: var(--spacing-4); /* 32px */
}

.card-wasteland-interactive {
  transition: all 200ms ease;
}

.card-wasteland-interactive:hover {
  border-color: var(--color-border-primary);
  background: var(--color-bg-tertiary);
}
```

**Content Hierarchy Template**:

```tsx
// Documented card structure
<div className="card-wasteland">
  <header className="interface-header"> {/* Defined in globals.css:337 */}
    CARD TITLE
  </header>
  <div className="space-y-3"> {/* 24px vertical spacing */}
    <p className="text-text-primary">Primary content</p>
    <p className="text-text-secondary">Secondary content</p>
  </div>
  <footer className="border-t border-border-muted pt-3">
    Actions or metadata
  </footer>
</div>
```

## Layout System (Req 4)

### Responsive Grid

**Breakpoint System** (Req 4.1) - Already in Tailwind config:

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape, small tablets
  md: '768px',   // Tablets portrait
  lg: '1024px',  // Tablets landscape, small desktops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

**12-Column Grid** (Native Tailwind):

```html
<!-- Example: Responsive 3-column layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### Container Max Widths (Req 4.3)

```css
/* Container patterns */
.container-prose {
  max-width: 640px;   /* Optimal reading line length */
  margin-inline: auto;
  padding-inline: var(--spacing-4);
}

.container-standard {
  max-width: 1024px;  /* Standard content width */
  margin-inline: auto;
  padding-inline: var(--spacing-6);
}

.container-wide {
  max-width: 1280px;  /* Wide layouts */
  margin-inline: auto;
  padding-inline: var(--spacing-8);
}

.container-immersive {
  max-width: 100%;    /* Full viewport */
  padding-inline: var(--spacing-4);
}
```

## Iconography System (Req 6)

### Icon Standards

**Source**: Lucide React (already in dependencies: `"lucide-react": "^0.544.0"`)

**Standardized Sizes** (Req 6.1):

```typescript
const iconSizes = {
  xs: 16,   // Inline text icons
  sm: 20,   // Button icons, form field icons
  md: 24,   // Default size
  lg: 32,   // Section headers
  xl: 48,   // Hero icons, empty states
}
```

**Usage Pattern** (Req 6.2):

```tsx
import { Check, AlertTriangle, Info } from 'lucide-react'

// With text label (preferred)
<button className="btn-pip-boy">
  <Check size={20} />
  <span>Confirm Action</span>
</button>

// Icon-only with tooltip (space-constrained)
<button className="btn-pip-boy size-9" aria-label="Close dialog">
  <X size={20} />
</button>
```

**Status Icons** (Req 6.4) - Color + Shape Coding:

```tsx
// Success: Green checkmark
<Check className="text-success" size={20} aria-hidden="true" />

// Warning: Yellow triangle
<AlertTriangle className="text-warning" size={20} aria-hidden="true" />

// Error: Red X
<XCircle className="text-error" size={20} aria-hidden="true" />

// Info: Blue info circle
<Info className="text-info" size={20} aria-hidden="true" />
```

### Custom Fallout Icons (Req 6.3)

**Design Principles**:
- Simple, recognizable shapes working at 16px minimum
- Outlined style matching Lucide React aesthetic
- Monochromatic with functional color coding
- SVG format for scalability

**Example Custom Icons**:
- Bottle Cap (currency/rewards)
- Radiation Symbol (warnings/status)
- Pip-Boy Device (settings/profile)
- Vault Door (access/security)

## Animation Standards (Req 7)

### Duration Guidelines (Req 7.1)

```typescript
const animationDurations = {
  instant: '100ms',      // UI feedback (button press, toggle)
  fast: '200ms',         // Hover states, color transitions
  normal: '300ms',       // Default transitions
  slow: '600ms',         // Page transitions, complex animations

  // Fallout-specific effects
  scanline: '2s',        // Background scanline effect
  terminalCursor: '1s',  // Blinking cursor
  radiationPulse: '1.5s', // Radiation glow pulse
}
```

**Implementation** (Already in tailwind.config.ts:190-207):

```css
/* Existing animations in tailwind config */
animation-text-flicker: text-flicker 2s ease-in-out infinite;
animation-radiation-pulse: radiation-pulse 1.5s ease-in-out infinite;
animation-terminal-cursor: terminal-cursor 1s ease-in-out infinite;
animation-card-hover: card-hover 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Motion Principles (Req 7.2, 7.3)

**Subtle Entry/Exit** (max 20px movement):

```css
/* Fade + slide effect */
.enter-from-bottom {
  animation: slide-up 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Reduced Motion Support** (Req 7.4) - Already implemented in `globals.css:471-482`:

```css
@media (prefers-reduced-motion: reduce) {
  .particle,
  .scan-lines,
  .wasteland-grid {
    animation: none;
  }

  .btn-pip-boy,
  .interactive-element {
    transition: none;
  }
}
```

### Background Effects (Req 7.5)

**Opacity Limit**: Max 30% to preserve readability

```css
/* Existing background effects (globals.css:211-298) */
.radiation-particles {
  opacity: 0.3; /* Max 30% */
}

.wasteland-grid {
  opacity: 0.1; /* Subtle grid */
}

.scan-lines {
  opacity: 0.3; /* Scanline effect */
}
```

## Accessibility Framework (Req 8)

### WCAG 2.1 AA Compliance Checklist

**Color Contrast** (Req 8.1, 2.4):

```typescript
// Documented contrast ratios (already meeting WCAG AA)
const contrastRatios = {
  // Body text (minimum 4.5:1)
  'text-primary on bg-primary': '7.4:1',      // ✅ AAA
  'text-secondary on bg-primary': '6.8:1',    // ✅ AAA
  'text-muted on bg-primary': '4.6:1',        // ✅ AA

  // Large text (minimum 3:1)
  'heading on bg-primary': '7.4:1',           // ✅ AAA

  // Interactive elements (minimum 3:1)
  'btn-primary-bg on bg-primary': '14.2:1',   // ✅ AAA
  'border-primary on bg-primary': '7.4:1',    // ✅ AAA
}
```

**Keyboard Navigation** (Req 8.2):

```typescript
// Focus indicator standards (already in button.tsx:9)
const focusStyles = {
  outline: '3px solid var(--color-border-focus)',
  outlineOffset: '2px',
  boxShadow: '0 0 0 1px var(--color-border-focus-ring)',
}
```

**Tab Order**: Follow visual hierarchy, left-to-right, top-to-bottom

**Screen Reader Support** (Req 8.3):

```tsx
// Pattern for dynamic content
<div role="status" aria-live="polite">
  {loadingMessage}
</div>

// Pattern for error messages
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Pattern for images
<img src="tarot-card.png" alt="The Wanderer - Major Arcana 0" />

// Pattern for decorative images
<img src="wasteland-texture.png" alt="" role="presentation" />
```

**High Contrast Mode** (Req 8.4) - Already in `globals.css:485-494`:

```css
@media (prefers-contrast: high) {
  :root {
    --color-text-primary: #ffffff;
    --color-text-secondary: #ffffff;
    --color-text-muted: #cccccc;
    --color-border-focus: #ffffff;
    --color-btn-primary-fg: #000000;
    --color-bg-primary: #000000;
  }
}
```

**Touch Targets** (Req 8.5): All buttons minimum 44x44px with 8px spacing

## Responsive Design Patterns (Req 9)

### Mobile-First Strategy (Req 9.1)

**Pattern**: Design for mobile, progressively enhance for larger screens

```css
/* Mobile first (default) */
.navigation {
  flex-direction: column;
  gap: var(--spacing-2);
}

/* Tablet and above */
@media (min-width: 768px) {
  .navigation {
    flex-direction: row;
    gap: var(--spacing-4);
  }
}
```

### Content Reflow (Req 9.2)

**Graceful Degradation** - No content loss across breakpoints

```tsx
// Responsive grid pattern
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content automatically reflows */}
</div>
```

### Complex Component Alternatives (Req 9.3)

**Data Tables** - Mobile-optimized patterns:

```tsx
// Desktop: Traditional table
<table className="hidden md:table">
  <thead>...</thead>
  <tbody>...</tbody>
</table>

// Mobile: Stacked cards
<div className="md:hidden space-y-4">
  {data.map(row => (
    <div key={row.id} className="card-wasteland">
      <div><strong>Label:</strong> {row.value}</div>
    </div>
  ))}
</div>
```

### Progressive Disclosure (Req 9.4)

**Collapsible Sections** for space-constrained screens:

```tsx
import { Collapsible } from '@radix-ui/react-collapsible'

<Collapsible>
  <CollapsibleTrigger className="btn-pip-boy">
    Show Details
  </CollapsibleTrigger>
  <CollapsibleContent>
    Detailed content...
  </CollapsibleContent>
</Collapsible>
```

## Performance & Optimization (Req 10)

### Font Loading Strategy (Req 10.1)

**Implementation** (Next.js Font Optimization):

```typescript
// Font already optimized via Next.js (no changes needed)
// JetBrains Mono and Doto loaded with font-display: swap
```

**Subset Characters**: Limit to Latin + numerals + common symbols

**Fallback Stack**: `monospace` system fonts prevent FOIT (Flash of Invisible Text)

### Animation Performance (Req 10.2)

**GPU-Accelerated Properties**:

```css
/* ✅ Performant (transform, opacity) */
.smooth-animation {
  transform: translateX(0);
  opacity: 1;
  transition: transform 200ms, opacity 200ms;
}

/* ❌ Avoid (layout-triggering) */
.avoid-this {
  width: 100px; /* Triggers layout */
  left: 10px;   /* Triggers layout */
}
```

**will-change Usage**: Sparingly, only for frequently animated elements

```css
.frequently-animated {
  will-change: transform;
}
```

### Background Effects (Req 10.3)

**CSS Gradients over Images** (Already implemented):

```css
/* Existing wasteland background (globals.css:211-222) */
.wasteland-background {
  background: linear-gradient(
    135deg,
    var(--color-wasteland-darker) 0%,
    var(--color-wasteland-dark) 25%,
    var(--color-wasteland-medium) 50%,
    var(--color-wasteland-dark) 75%,
    var(--color-wasteland-darker) 100%
  );
}
```

**SVG Patterns**: Grid texture generated via CSS, not images

### Critical CSS (Req 10.4)

**Next.js Automatic Optimization**:
- Critical CSS automatically inlined by Next.js
- Non-critical styles deferred
- No manual intervention required

### Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Lighthouse Performance | >90 | To be measured |
| Lighthouse Accessibility | >90 | To be measured |
| First Contentful Paint | <1.5s | To be measured |
| Time to Interactive | <3.5s | To be measured |
| Cumulative Layout Shift | <0.1 | To be measured |

## Testing Strategy

### Risk Matrix

| Area | Risk | Must Have | Optional | Ref |
|------|------|-----------|----------|-----|
| Color Contrast | H | Automated WCAG tests | Manual AAA validation | Req 8.1, 8.4 |
| Keyboard Navigation | H | Tab order verification | Screen reader testing | Req 8.2, 8.3 |
| Responsive Layouts | M | Visual regression tests (3 breakpoints) | All 5 breakpoints | Req 9.1, 9.2 |
| Component Variants | M | Unit tests for all states | Visual QA of all combinations | Req 5.1-5.5 |
| Animation Performance | L | FPS monitoring (main animations) | Comprehensive perf profiling | Req 10.2 |

### Testing by Layer

**Documentation Validation**:
- [ ] All code examples compile and run without errors
- [ ] Token references match actual CSS variables in `globals.css`
- [ ] Component examples match implementations in `src/components/ui/`
- [ ] Mermaid diagrams render correctly

**Accessibility Testing** (Req 8.1):
- **Automated**: axe-core via `@axe-core/playwright` (already in devDependencies)
- **Manual**: Keyboard navigation through all interactive elements
- **Screen Reader**: NVDA/VoiceOver spot checks on critical flows

**Visual Regression** (Req 9.2):
- **Tool**: Percy (already in devDependencies: `@percy/cypress`)
- **Coverage**: 3 breakpoints (mobile 375px, tablet 768px, desktop 1280px)
- **Components**: All button variants, form states, card layouts

**Performance Testing** (Req 10):
- **Tool**: Lighthouse CI (`@lhci/cli` in devDependencies)
- **Frequency**: Pre-deployment
- **Thresholds**: Performance >90, Accessibility >90

### CI Gates

| Stage | Tests | Gate | SLA |
|-------|-------|------|-----|
| Documentation Validation | Link checks, code syntax | Fail = block PR | <2min |
| Accessibility (Automated) | axe-core tests | Fail = block PR | <5min |
| Visual Regression | Percy snapshots | Fail = review required | <10min |
| Performance | Lighthouse CI | Regression > 5 points = review | <5min |

### Exit Criteria

- ✅ All documentation files created and validated
- ✅ Zero accessibility violations (automated tests)
- ✅ Visual regression tests pass (or approved deviations)
- ✅ Lighthouse Performance & Accessibility >90
- ✅ Manual keyboard navigation successful on sample components
- ✅ Design system adopted in 1+ new feature (proof of concept)

## Implementation Plan Summary

### Phase 1: Documentation Foundation (Week 1)

**Deliverables**:
1. `00-philosophy.md` - Utilitarian Fallout design principles
2. `01-tokens.md` - Complete token reference (map existing CSS vars)
3. `04-quick-start.md` - Developer quick reference with code examples

**Acceptance**: Developers can reference token documentation and understand philosophy

### Phase 2: Component Library Documentation (Week 2)

**Deliverables**:
1. `02-components.md` - Document all UI components with variants, states, examples
2. `03-patterns.md` - Common UI patterns (layouts, forms, data display)
3. `05-accessibility.md` - WCAG compliance guidelines and checklists

**Acceptance**: Developers can implement new features using documented patterns

### Phase 3: Validation & Refinement (Week 3)

**Deliverables**:
1. Accessibility test suite (automated + manual checklist)
2. Visual regression test coverage (Percy snapshots)
3. Performance baseline (Lighthouse CI)
4. Sample implementation (1 new feature using design system)

**Acceptance**: All tests passing, design system proven in production code

### Phase 4: Adoption & Iteration (Ongoing)

**Activities**:
- Team training on design system usage
- Gather feedback from developers
- Iterate on documentation based on real-world usage
- Track success metrics (developer efficiency, consistency, accessibility)

**Success Metrics** (From requirements.md):
- Developer efficiency improves 40% (measured via time tracking)
- 100% accessibility test pass rate
- <5% visual inconsistency in QA reviews
- User task completion 30% faster (usability testing)
- Lighthouse scores >90
- 90% adoption rate within 3 months

## Conclusion

This design system formalizes existing Fallout-themed visual patterns into a comprehensive, documentation-driven framework that balances aesthetic appeal with functional excellence. By organizing 200+ existing CSS variables, documenting component patterns, and establishing clear guidelines, this system will improve developer efficiency, ensure design consistency, and maintain WCAG 2.1 AA accessibility compliance—all while preserving the unique post-apocalyptic atmosphere that defines the Wasteland Tarot platform.

The implementation focuses on documentation and refinement rather than new code, minimizing risk and accelerating delivery. Success will be measured through improved development velocity, accessibility compliance, visual consistency, and adoption rate across the development team.
