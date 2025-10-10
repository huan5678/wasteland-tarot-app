'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createWebGLContext,
  createProgram,
  getAttribLocation,
  getUniformLocation,
  createBuffer,
  checkError,
} from '@/lib/webgl/webglUtils';
import {
  generateCharacterAtlas,
  createTextureFromAtlas,
} from '@/lib/webgl/textureAtlas';
import { getShaderSources } from '@/lib/webgl/shaders';

/**
 * WebGL ASCII Donut PoC Demo Page
 *
 * Proof of Concept to verify:
 * - WebGL context creation
 * - Character texture atlas generation
 * - Shader compilation and linking
 * - GPU-accelerated ASCII rendering
 */
export default function TestWebGLDonutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [fps, setFps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Step 1: Create WebGL context
      setStatus('Creating WebGL context...');
      const contextResult = createWebGLContext(canvas, {
        preferWebGL2: true,
        alpha: false,
        antialias: false,
      });

      if (!contextResult) {
        throw new Error('WebGL is not supported');
      }

      const { gl, version, isWebGL2 } = contextResult;
      setStatus(`WebGL ${version}.0 context created`);

      // Step 2: Generate character texture atlas
      setStatus('Generating character atlas...');
      const atlas = generateCharacterAtlas({
        characters: '.,-~:;=!*#$@',
        charWidth: 16,
        charHeight: 16,
        fontSize: 14,
        color: '#00ff00', // Pip-Boy green
        backgroundColor: 'transparent',
      });

      const charTexture = createTextureFromAtlas(gl, atlas);
      if (!charTexture) {
        throw new Error('Failed to create texture from atlas');
      }
      setStatus('Character atlas uploaded to GPU');

      // Step 3: Compile shaders
      setStatus('Compiling shaders...');
      const shaderSources = getShaderSources(version);
      const program = createProgram(
        gl,
        shaderSources.vertexShader,
        shaderSources.fragmentShader
      );

      if (!program) {
        throw new Error('Failed to create shader program');
      }
      setStatus('Shaders compiled and linked');

      // Step 4: Get attribute and uniform locations
      const a_torusCoord = getAttribLocation(gl, program, 'a_torusCoord');
      const u_angleA = getUniformLocation(gl, program, 'u_angleA');
      const u_angleB = getUniformLocation(gl, program, 'u_angleB');
      const u_R1 = getUniformLocation(gl, program, 'u_R1');
      const u_R2 = getUniformLocation(gl, program, 'u_R2');
      const u_K1 = getUniformLocation(gl, program, 'u_K1');
      const u_K2 = getUniformLocation(gl, program, 'u_K2');
      const u_lightDir = getUniformLocation(gl, program, 'u_lightDir');
      const u_charTexture = getUniformLocation(gl, program, 'u_charTexture');
      const u_charCount = getUniformLocation(gl, program, 'u_charCount');
      const u_color = getUniformLocation(gl, program, 'u_color');
      const u_canvasSize = getUniformLocation(gl, program, 'u_canvasSize');

      // Step 5: Create torus geometry (parametric coordinates)
      setStatus('Creating torus geometry...');
      const thetaSteps = 50; // Number of steps around the tube
      const phiSteps = 100; // Number of steps around the torus
      const vertices: number[] = [];

      for (let i = 0; i < thetaSteps; i++) {
        const theta = (i / thetaSteps) * Math.PI * 2;
        for (let j = 0; j < phiSteps; j++) {
          const phi = (j / phiSteps) * Math.PI * 2;
          vertices.push(theta, phi);
        }
      }

      const vertexBuffer = createBuffer(
        gl,
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
      );

      if (!vertexBuffer) {
        throw new Error('Failed to create vertex buffer');
      }

      const vertexCount = vertices.length / 2;
      setStatus(`Torus geometry created (${vertexCount} vertices)`);

      // Step 6: Setup rendering
      gl.useProgram(program);

      // Bind vertex buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(a_torusCoord);
      gl.vertexAttribPointer(a_torusCoord, 2, gl.FLOAT, false, 0, 0);

      // Set constant uniforms
      gl.uniform1f(u_R1, 1.0); // Torus tube radius
      gl.uniform1f(u_R2, 2.0); // Distance from center to tube
      gl.uniform1f(u_K1, 100.0); // Projection distance
      gl.uniform1f(u_K2, 5.0); // Observer distance
      gl.uniform3f(u_lightDir, 0, 0.7071, -0.7071); // Light direction
      gl.uniform1i(u_charCount, atlas.charCount);
      gl.uniform3f(u_color, 0, 1, 0); // Pip-Boy green (RGB)
      gl.uniform2f(u_canvasSize, canvas.width, canvas.height); // CRITICAL: Canvas size for clip space calculation

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, charTexture);
      gl.uniform1i(u_charTexture, 0);

      // Setup viewport
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1); // Black background

      // Enable blending for transparent characters
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      checkError(gl, 'Setup');

      // Step 7: Animation loop
      setStatus('Rendering...');
      let angleA = 0;
      let angleB = 0;
      let lastTime = performance.now();
      let frameCount = 0;
      let fpsTime = lastTime;

      const animate = (currentTime: number) => {
        // Clear canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Update rotation angles
        gl.uniform1f(u_angleA, angleA);
        gl.uniform1f(u_angleB, angleB);

        // Draw torus as points
        gl.drawArrays(gl.POINTS, 0, vertexCount);

        checkError(gl, 'Render');

        // Update angles
        angleA += 0.04;
        angleB += 0.02;

        // Calculate FPS
        frameCount++;
        const elapsed = currentTime - fpsTime;
        if (elapsed >= 1000) {
          const currentFps = (frameCount / elapsed) * 1000;
          setFps(Math.round(currentFps * 10) / 10);
          frameCount = 0;
          fpsTime = currentTime;
        }

        animationIdRef.current = requestAnimationFrame(animate);
      };

      animationIdRef.current = requestAnimationFrame(animate);
      setStatus('✅ WebGL rendering active');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setStatus('❌ Error occurred');
      console.error('[WebGL PoC]', err);
    }

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-pip-boy-green p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl mb-4 text-center">
          WebGL ASCII Donut - Proof of Concept
        </h1>

        <div className="mb-4 p-4 bg-black border border-pip-boy-green rounded">
          <h2 className="text-xl mb-2">Status</h2>
          <p className="text-sm">{status}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded">
              <p className="text-red-500 text-sm">Error: {error}</p>
            </div>
          )}
        </div>

        <div className="mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-pip-boy-green"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-black border border-pip-boy-green rounded">
            <h3 className="text-sm mb-2">Performance</h3>
            <p className="text-2xl">{fps} FPS</p>
          </div>

          <div className="p-4 bg-black border border-pip-boy-green rounded">
            <h3 className="text-sm mb-2">Tech Stack</h3>
            <ul className="text-xs space-y-1">
              <li>✅ WebGL Context</li>
              <li>✅ Character Atlas</li>
              <li>✅ GLSL Shaders</li>
              <li>✅ GPU Rendering</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-black border border-pip-boy-green rounded">
          <h3 className="text-sm mb-2">PoC Goals</h3>
          <ul className="text-xs space-y-1 text-pip-boy-green/70">
            <li>1. Verify WebGL context creation (WebGL 2.0 → 1.0 fallback)</li>
            <li>2. Validate character texture atlas approach</li>
            <li>3. Confirm shader compilation and execution</li>
            <li>4. Measure GPU rendering performance vs Canvas 2D</li>
            <li>5. Test on desktop (target: 60 FPS)</li>
          </ul>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <a
            href="/test-donut"
            className="bg-pip-boy-green text-black px-6 py-3 rounded"
          >
            ← Canvas 2D Version
          </a>
          <a
            href="/"
            className="bg-pip-boy-green text-black px-6 py-3 rounded"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
