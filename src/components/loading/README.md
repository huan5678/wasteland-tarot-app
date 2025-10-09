# AsciiDonutLoading Component

A Fallout-themed loading screen featuring an animated 3D ASCII donut (torus) with automatic performance optimization and accessibility support.

## Features

- **3D Rendering**: Real-time 3D torus rendering using mathematical transformations
- **Performance Optimized**: Auto-degrades to static mode when FPS drops below 15
- **Accessible**: Full ARIA support and `prefers-reduced-motion` compliance
- **Customizable**: Configurable size, rotation speed, and ASCII character set
- **Fallout Aesthetic**: Pip-Boy green color scheme with monospace font

## Quick Start

### Basic Usage

```tsx
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';

function MyLoadingScreen() {
  return <AsciiDonutLoading />;
}
```

### Custom Message

```tsx
<AsciiDonutLoading message="LOADING VAULT-TEC DATA..." />
```

### Custom Configuration

```tsx
<AsciiDonutLoading
  config={{
    width: 60,
    height: 20,
    thetaSpacing: 0.1,
    phiSpacing: 0.03,
    luminanceChars: '.:-=+*#%@',
  }}
/>
```

### Force Static Fallback

```tsx
<AsciiDonutLoading forceFallback={true} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `"INITIALIZING VAULT RESIDENT STATUS..."` | Loading message text |
| `forceFallback` | `boolean` | `false` | Force static fallback mode |
| `config` | `Partial<DonutRendererConfig>` | `DEFAULT_DONUT_CONFIG` | Custom renderer configuration |

## Configuration Options

### DonutRendererConfig

```typescript
interface DonutRendererConfig {
  width: number;           // ASCII output width (characters)
  height: number;          // ASCII output height (lines)
  R1: number;              // Torus cross-section radius
  R2: number;              // Torus center distance
  K1: number;              // Perspective projection distance
  K2: number;              // Observer distance
  thetaSpacing: number;    // Theta angle step (density control)
  phiSpacing: number;      // Phi angle step (density control)
  luminanceChars: string;  // ASCII brightness character set
}
```

### Default Configuration

```typescript
export const DEFAULT_DONUT_CONFIG: DonutRendererConfig = {
  width: 80,
  height: 24,
  R1: 1,
  R2: 2,
  K1: 30,
  K2: 5,
  thetaSpacing: 0.07,
  phiSpacing: 0.02,
  luminanceChars: '.,-~:;=!*#$@',
};
```

### Low Performance Configuration

For devices with limited resources:

```typescript
export const LOW_PERFORMANCE_CONFIG: Partial<DonutRendererConfig> = {
  width: 60,
  height: 18,
  thetaSpacing: 0.14,  // 2x step size = lower density
  phiSpacing: 0.04,    // 2x step size = lower density
};
```

## Performance

### Target FPS
- **Default**: 24 FPS
- **Auto-degradation**: Switches to static mode when FPS < 15
- **Frame Skipping**: Uses `requestAnimationFrame` with time-based frame limiting

### Optimization Features
1. **Trigonometric Caching**: Pre-computes `sin(angleA)`, `cos(angleA)`, etc.
2. **Z-buffer Algorithm**: Efficient depth testing for correct occlusion
3. **Frame Skipping**: Only renders when sufficient time has elapsed
4. **FPS Monitoring**: Tracks performance every 60 frames
5. **Lazy Degradation**: Auto-switches to static fallback on low FPS

### Performance Metrics

Development mode shows FPS counter (removed in production):

```tsx
{process.env.NODE_ENV !== 'production' && currentFPS > 0 && (
  <p className="font-mono text-pip-boy-green/50 text-xs mt-2">
    FPS: {currentFPS.toFixed(1)}
  </p>
)}
```

## Accessibility

### ARIA Attributes
- `role="status"`: Indicates loading status to screen readers
- `aria-live="polite"`: Announces changes without interrupting
- `aria-label="Loading animation"`: Labels the animation element

### Motion Preferences
Automatically detects and respects `prefers-reduced-motion`:

```typescript
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mediaQuery.matches) {
  setUseFallback(true);  // Switch to static mode
}
```

### Keyboard Navigation
- No focus traps
- Does not interfere with keyboard navigation
- Screen reader friendly

## Mathematical Background

### Torus Parametric Equations

The donut (torus) is defined by two circles:

```
circle_x = R2 + R1 * cos(theta)
circle_y = R1 * sin(theta)
```

Where:
- `R1`: Radius of the torus cross-section (tube)
- `R2`: Distance from the torus center to the tube center
- `theta`: Angle around the cross-section (0 to 2π)
- `phi`: Angle around the torus (0 to 2π)

### 3D Rotation

Points are rotated using rotation matrices:

1. **X-axis rotation** (angleA):
   ```
   [ 1    0         0      ]
   [ 0    cos(A)   -sin(A) ]
   [ 0    sin(A)    cos(A) ]
   ```

2. **Z-axis rotation** (angleB):
   ```
   [ cos(B)  -sin(B)   0 ]
   [ sin(B)   cos(B)   0 ]
   [ 0        0        1 ]
   ```

### Perspective Projection

3D coordinates are projected to 2D screen space:

```typescript
screenX = (width / 2) + (K1 * (1/z) * x)
screenY = (height / 2) - (K1 * (1/z) * y)
```

Where:
- `K1`: Projection distance (larger = more perspective)
- `z`: Depth coordinate
- `1/z`: Inverse depth (used for z-buffer)

### Lighting (Lambertian Reflectance)

Surface brightness is calculated using dot product:

```typescript
luminance = (N · L + 1) / 2
```

Where:
- `N`: Surface normal vector
- `L`: Light direction vector `(0, 0.7071, -0.7071)`
- Result normalized to [0, 1]

## Testing

### Unit Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/components/loading/__tests__/AsciiDonutLoading.test.tsx

# Run with coverage
bun test --coverage
```

### Test Files
- `src/lib/__tests__/donutConfig.test.ts` (15 tests)
- `src/lib/__tests__/donutRenderer.test.ts` (16 tests)
- `src/components/loading/__tests__/AsciiDonutLoading.test.tsx` (16 tests)
- `src/components/providers/__tests__/ZustandAuthProvider.test.tsx` (6 tests)

**Total**: 53 tests, all passing ✓

## File Structure

```
src/
├── components/
│   ├── loading/
│   │   ├── AsciiDonutLoading.tsx        # Main component
│   │   ├── __tests__/
│   │   │   └── AsciiDonutLoading.test.tsx
│   │   └── README.md                     # This file
│   └── providers/
│       ├── ZustandAuthProvider.tsx       # Integration example
│       └── __tests__/
│           └── ZustandAuthProvider.test.tsx
└── lib/
    ├── donutConfig.ts                    # Configuration management
    ├── donutRenderer.ts                  # Core 3D rendering engine
    └── __tests__/
        ├── donutConfig.test.ts
        └── donutRenderer.test.ts
```

## Integration Example

### With Auth Provider

```tsx
// src/components/providers/ZustandAuthProvider.tsx
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <AsciiDonutLoading message="INITIALIZING VAULT RESIDENT STATUS..." />;
  }

  return <>{children}</>;
}
```

### With Suspense

```tsx
import { Suspense } from 'react';
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';

function App() {
  return (
    <Suspense fallback={<AsciiDonutLoading />}>
      <YourAsyncComponent />
    </Suspense>
  );
}
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ✅ Respects `prefers-reduced-motion`

## Troubleshooting

### Low FPS / Stuttering

1. **Check CPU Usage**: The animation is CPU-intensive
2. **Enable Fallback**: Set `forceFallback={true}` for static mode
3. **Reduce Density**: Increase `thetaSpacing` and `phiSpacing`
4. **Reduce Size**: Decrease `width` and `height`

### Not Animating

1. **Check `forceFallback`**: Should be `false` (default)
2. **Check `prefers-reduced-motion`**: Browser setting may disable animation
3. **Check Console**: Look for FPS degradation warnings

### Accessibility Issues

1. **Screen Reader**: Ensure `aria-live` is not overridden
2. **Focus Management**: Component should not trap focus
3. **Motion Sickness**: Fallback mode activates for `prefers-reduced-motion`

## Credits

- **Algorithm**: Based on [a1k0n's donut.c](https://www.a1k0n.net/2011/07/20/donut-math.html)
- **Design**: Fallout/Pip-Boy aesthetic
- **Implementation**: Wasteland Tarot Team

## License

MIT License (see project root)

## Related Files

- [DonutRenderer Source](../../lib/donutRenderer.ts)
- [DonutConfig Source](../../lib/donutConfig.ts)
- [Component Source](./AsciiDonutLoading.tsx)
- [Tasks Document](../../../.kiro/specs/ascii-donut-loading/tasks.md)
