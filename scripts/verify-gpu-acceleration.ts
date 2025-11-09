#!/usr/bin/env tsx

/**
 * GPU Acceleration Verification Script
 * Verifies that all animations use GPU-accelerated properties
 *
 * GPU-Accelerated properties:
 * - transform (translate, rotate, scale)
 * - opacity
 *
 * Non-GPU-accelerated (avoid):
 * - top, left, right, bottom
 * - width, height
 * - margin, padding
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface AnimationIssue {
  file: string;
  line: number;
  property: string;
  context: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

const NON_GPU_PROPERTIES = [
  'top', 'left', 'right', 'bottom',
  'width', 'height',
  'margin', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom',
  'padding', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom'
];

const GPU_PROPERTIES = ['transform', 'opacity', 'filter'];

const ANIMATION_PATTERNS = [
  // CSS animations
  /@keyframes\s+[\w-]+\s*{[^}]*}/g,
  /animation(?:-name)?:\s*[\w-]+/g,

  // CSS transitions
  /transition(?:-property)?:\s*([^;]+)/g,

  // Motion/Framer Motion
  /animate\s*=\s*{[^}]*}/g,
  /initial\s*=\s*{[^}]*}/g,
  /exit\s*=\s*{[^}]*}/g,
  /transition\s*=\s*{[^}]*}/g,

  // React Spring
  /useSpring\s*\([^)]*\)/g,
  /animated\.\w+/g,

  // GSAP
  /gsap\.\w+\([^)]*\)/g,
  /TweenMax\.\w+\([^)]*\)/g
];

const SUGGESTIONS: Record<string, string> = {
  'top': 'Use transform: translateY() instead',
  'left': 'Use transform: translateX() instead',
  'right': 'Use transform: translateX() instead',
  'bottom': 'Use transform: translateY() instead',
  'width': 'Use transform: scaleX() instead, or pre-render at different sizes',
  'height': 'Use transform: scaleY() instead, or pre-render at different sizes',
  'margin': 'Use transform: translate() instead',
  'padding': 'Avoid animating padding. Use transform or opacity instead'
};

/**
 * Check if file should be scanned
 */
function shouldScanFile(filePath: string): boolean {
  const ignoredDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
  const allowedExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'];

  // Check if in ignored directory
  if (ignoredDirs.some(dir => filePath.includes(`/${dir}/`))) {
    return false;
  }

  // Check extension
  return allowedExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * Scan file for non-GPU-accelerated animations
 */
function scanFile(filePath: string): AnimationIssue[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: AnimationIssue[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check for animation-related code
    const hasAnimation = ANIMATION_PATTERNS.some(pattern => {
      const matches = line.match(pattern);
      return matches && matches.length > 0;
    });

    if (!hasAnimation) return;

    // Check for non-GPU properties in animation context
    NON_GPU_PROPERTIES.forEach(prop => {
      const propPattern = new RegExp(`['"\`]?${prop}['"\`]?\\s*[:=]`, 'i');

      if (propPattern.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          property: prop,
          context: trimmedLine.substring(0, 100),
          severity: 'error',
          suggestion: SUGGESTIONS[prop] || 'Use GPU-accelerated properties (transform, opacity)'
        });
      }
    });

    // Check for will-change usage
    if (/will-change/.test(line) && !/will-change:\s*(transform|opacity)/.test(line)) {
      const willChangeMatch = line.match(/will-change:\s*([^;,}]+)/);
      if (willChangeMatch) {
        const props = willChangeMatch[1].trim();
        if (!GPU_PROPERTIES.some(p => props.includes(p))) {
          issues.push({
            file: filePath,
            line: lineNumber,
            property: 'will-change',
            context: trimmedLine.substring(0, 100),
            severity: 'warning',
            suggestion: 'will-change should only be used with transform/opacity'
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Check if GPU acceleration hints are present
 */
function checkGPUHints(filePath: string): { hasTransformZ: boolean; hasWillChange: boolean; hasBackfaceHidden: boolean } {
  const content = fs.readFileSync(filePath, 'utf-8');

  return {
    hasTransformZ: /transform:\s*translateZ\(0\)|transform:\s*translate3d/.test(content),
    hasWillChange: /will-change:\s*(transform|opacity)/.test(content),
    hasBackfaceHidden: /backface-visibility:\s*hidden/.test(content)
  };
}

/**
 * Main function
 */
function main() {
  console.log('🎨 GPU Acceleration Verification');
  console.log('=================================\n');

  const srcDir = path.join(process.cwd(), 'src');
  const componentFiles = glob.sync(`${srcDir}/**/*.{tsx,ts,jsx,js,css,scss}`, {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
  });

  console.log(`Scanning ${componentFiles.length} files...\n`);

  const allIssues: AnimationIssue[] = [];
  const filesWithGPUHints: string[] = [];
  const filesWithAnimations: string[] = [];

  for (const file of componentFiles) {
    if (!shouldScanFile(file)) continue;

    const issues = scanFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
      filesWithAnimations.push(file);
    }

    // Check for GPU hints
    const hints = checkGPUHints(file);
    if (hints.hasTransformZ || hints.hasWillChange || hints.hasBackfaceHidden) {
      filesWithGPUHints.push(file);
    }
  }

  // Print results
  console.log('📊 Results:');
  console.log(`  Files scanned:            ${componentFiles.length}`);
  console.log(`  Files with animations:    ${filesWithAnimations.length}`);
  console.log(`  Files with GPU hints:     ${filesWithGPUHints.length}`);
  console.log(`  Total issues found:       ${allIssues.length}\n`);

  if (allIssues.length > 0) {
    console.log('❌ Issues Found:\n');

    // Group by file
    const issuesByFile: Record<string, AnimationIssue[]> = {};
    allIssues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });

    Object.entries(issuesByFile).forEach(([file, issues]) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📄 ${relativePath}`);

      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '  ❌' : '  ⚠️';
        console.log(`${icon} Line ${issue.line}: ${issue.property}`);
        console.log(`     Context: ${issue.context}`);
        console.log(`     💡 ${issue.suggestion}`);
        console.log('');
      });
    });

    console.log('=================================');
    console.log('❌ GPU acceleration verification FAILED');
    console.log(`Found ${allIssues.length} issues that may cause performance problems\n`);

    process.exit(1);
  } else {
    console.log('✅ All animations use GPU-accelerated properties!\n');
    console.log('GPU Optimization Summary:');
    console.log(`  ✓ No non-GPU properties in animations`);
    console.log(`  ✓ ${filesWithGPUHints.length} files use GPU acceleration hints`);
    console.log(`  ✓ All transitions use transform/opacity\n`);

    process.exit(0);
  }
}

try {
  main();
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
