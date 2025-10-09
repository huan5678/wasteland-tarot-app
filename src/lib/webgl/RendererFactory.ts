/**
 * Renderer Factory
 *
 * Automatically selects the best available renderer based on:
 * 1. WebGL 2.0 support → WebGLQuadDonutRenderer (best performance)
 * 2. WebGL 1.0 support → WebGLQuadDonutRenderer (good performance)
 * 3. Canvas 2D → DonutRenderer (fallback)
 * 4. Static fallback → Returns null (caller should use static ASCII art)
 */

import { DonutRendererConfig } from '../donutConfig';
import { DonutRenderer } from '../donutRenderer';
import { WebGLQuadDonutRenderer } from './WebGLQuadDonutRenderer';
import { isWebGLSupported } from './webglUtils';

/**
 * Renderer types
 */
export enum RendererType {
  WEBGL_QUAD = 'webgl-quad',
  CANVAS_2D = 'canvas-2d',
  STATIC = 'static',
}

/**
 * Renderer interface
 *
 * Common interface for all renderers
 */
export interface IDonutRenderer {
  render(angleA: number, angleB: number): string;
  dispose(): void;
  getCanvas?(): HTMLCanvasElement; // Optional: for WebGL renderers
}

/**
 * Renderer creation result
 */
export interface RendererResult {
  renderer: IDonutRenderer | null;
  type: RendererType;
  reason: string;
}

/**
 * Renderer Factory
 *
 * Creates the best available renderer for the current environment
 */
export class RendererFactory {
  /**
   * Create the best available renderer
   *
   * @param config - Renderer configuration
   * @param options - Creation options
   * @returns Renderer result with type and reason
   */
  static create(
    config: DonutRendererConfig,
    options: {
      preferWebGL?: boolean;
      forceType?: RendererType;
    } = {}
  ): RendererResult {
    const { preferWebGL = true, forceType } = options;

    // If type is forced, use it
    if (forceType) {
      return this.createSpecific(config, forceType);
    }

    // Auto-select best renderer
    if (preferWebGL) {
      // Try WebGL first
      if (this.isWebGLAvailable()) {
        try {
          const renderer = new WebGLQuadDonutRenderer(config);
          console.log('[RendererFactory] Created WebGL quad renderer');
          return {
            renderer,
            type: RendererType.WEBGL_QUAD,
            reason: 'WebGL 2.0/1.0 supported, using GPU-accelerated quad rendering',
          };
        } catch (error) {
          console.warn('[RendererFactory] WebGL quad renderer failed:', error);
          // Fall through to Canvas 2D
        }
      }
    }

    // Fallback to Canvas 2D
    try {
      const renderer = new DonutRenderer(config);
      console.log('[RendererFactory] Created Canvas 2D renderer');
      return {
        renderer,
        type: RendererType.CANVAS_2D,
        reason: preferWebGL
          ? 'WebGL not available, using Canvas 2D fallback'
          : 'Canvas 2D preferred',
      };
    } catch (error) {
      console.error('[RendererFactory] Canvas 2D renderer failed:', error);
      // Fall through to static
    }

    // Last resort: static fallback
    console.warn('[RendererFactory] All renderers failed, using static fallback');
    return {
      renderer: null,
      type: RendererType.STATIC,
      reason: 'All renderers failed, use static ASCII art',
    };
  }

  /**
   * Create a specific renderer type
   *
   * @param config - Renderer configuration
   * @param type - Renderer type to create
   * @returns Renderer result
   */
  private static createSpecific(
    config: DonutRendererConfig,
    type: RendererType
  ): RendererResult {
    switch (type) {
      case RendererType.WEBGL_QUAD:
        try {
          const renderer = new WebGLQuadDonutRenderer(config);
          return {
            renderer,
            type: RendererType.WEBGL_QUAD,
            reason: 'WebGL quad renderer (forced)',
          };
        } catch (error) {
          console.error('[RendererFactory] Forced WebGL quad renderer failed:', error);
          return {
            renderer: null,
            type: RendererType.STATIC,
            reason: `WebGL quad renderer failed: ${error}`,
          };
        }

      case RendererType.CANVAS_2D:
        try {
          const renderer = new DonutRenderer(config);
          return {
            renderer,
            type: RendererType.CANVAS_2D,
            reason: 'Canvas 2D renderer (forced)',
          };
        } catch (error) {
          console.error('[RendererFactory] Forced Canvas 2D renderer failed:', error);
          return {
            renderer: null,
            type: RendererType.STATIC,
            reason: `Canvas 2D renderer failed: ${error}`,
          };
        }

      case RendererType.STATIC:
        return {
          renderer: null,
          type: RendererType.STATIC,
          reason: 'Static fallback (forced)',
        };

      default:
        console.error('[RendererFactory] Unknown renderer type:', type);
        return {
          renderer: null,
          type: RendererType.STATIC,
          reason: 'Unknown renderer type',
        };
    }
  }

  /**
   * Check if WebGL is available
   *
   * @returns true if WebGL 2.0 or 1.0 is supported
   */
  private static isWebGLAvailable(): boolean {
    // Check WebGL 2.0
    if (isWebGLSupported(true)) {
      return true;
    }

    // Check WebGL 1.0
    if (isWebGLSupported(false)) {
      return true;
    }

    return false;
  }

  /**
   * Get renderer capabilities
   *
   * @returns Capabilities information
   */
  static getCapabilities(): {
    webGL2: boolean;
    webGL1: boolean;
    canvas2D: boolean;
    recommended: RendererType;
  } {
    const webGL2 = isWebGLSupported(true);
    const webGL1 = !webGL2 && isWebGLSupported(false);
    const canvas2D = typeof document !== 'undefined' && !!document.createElement('canvas').getContext('2d');

    let recommended: RendererType;
    if (webGL2 || webGL1) {
      recommended = RendererType.WEBGL_QUAD;
    } else if (canvas2D) {
      recommended = RendererType.CANVAS_2D;
    } else {
      recommended = RendererType.STATIC;
    }

    return {
      webGL2,
      webGL1,
      canvas2D,
      recommended,
    };
  }

  /**
   * Get performance estimate for a renderer type
   *
   * @param type - Renderer type
   * @param deviceType - Device type ('desktop' | 'mobile')
   * @returns Estimated FPS
   */
  static getPerformanceEstimate(
    type: RendererType,
    deviceType: 'desktop' | 'mobile' = 'desktop'
  ): number {
    switch (type) {
      case RendererType.WEBGL_QUAD:
        return deviceType === 'desktop' ? 60 : 40;

      case RendererType.CANVAS_2D:
        return deviceType === 'desktop' ? 24 : 1.5;

      case RendererType.STATIC:
        return 0; // Static, no animation

      default:
        return 0;
    }
  }
}
