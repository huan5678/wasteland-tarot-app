/**
 * Integration Tests for Button Refactoring System
 *
 * Purpose: Test end-to-end workflow and cross-module integration
 * Requirements: 1.1-1.7, 2.1-2.12, 5.1-5.4, 8.1, 8.2, 8.5
 *
 * Test Coverage:
 * 1. Simple button replacement workflow
 * 2. Complex variant mapping scenarios
 * 3. Accessibility enhancement integration
 * 4. Import statement handling
 * 5. Error propagation across modules
 * 6. Full batch execution simulation
 * 7. Rollback scenario validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ButtonScanner } from '../scanner';
import { StyleAnalyzer } from '../analyzer';
import { VariantMapper } from '../mapper';
import { CodeTransformer } from '../transformer';
import { AccessibilityEnhancer } from '../enhancer';
import { BatchExecutor } from '../executor';
import type { BatchConfig, MappingResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';

describe('Integration Tests - Button Refactoring System', () => {
  let tempDir: string;
  let scanner: ButtonScanner;
  let analyzer: StyleAnalyzer;
  let mapper: VariantMapper;
  let transformer: CodeTransformer;
  let enhancer: AccessibilityEnhancer;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'button-refactor-integration-'));
    scanner = new ButtonScanner();
    analyzer = new StyleAnalyzer();
    mapper = new VariantMapper();
    transformer = new CodeTransformer();
    enhancer = new AccessibilityEnhancer();
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End Workflow: Simple Button Replacement', () => {
    it('should complete full workflow for simple button', async () => {
      // Step 1: Create test file with simple button
      const testFile = path.join(tempDir, 'SimpleButton.tsx');
      const originalCode = `
export const SimpleButton = () => {
  return <button className="bg-green-500 hover:bg-green-600">Click Me</button>;
}`;
      await writeFile(testFile, originalCode);

      // Step 2: Scan file
      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };
      const scanResult = await scanner.scanBatch(config);

      expect(scanResult.totalButtons).toBe(1);
      expect(scanResult.buttons[0].className).toBe('bg-green-500 hover:bg-green-600');

      // Step 3: Analyze styles
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);

      expect(analysis.suggestedVariant).toBe('success');
      expect(analysis.confidence).toBe('high');

      // Step 4: Map to variant
      const mapping = mapper.map(analysis);

      expect(mapping.variant).toBe('success');
      expect(mapping.size).toBe('default');

      // Step 5: Enhance accessibility (should be no-op for button with text)
      const a11yAttrs = enhancer.enhance(button, mapping);

      expect(a11yAttrs.ariaLabel).toBeUndefined(); // Has text content

      // Step 6: Transform code
      const transformResult = await transformer.transform(testFile, [mapping]);

      expect(transformResult.success).toBe(true);
      expect(transformResult.transformedButtons).toBe(1);
      expect(transformResult.addedImports).toContain('@/components/ui/button');

      // Step 7: Verify transformed code
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('import { Button }');
      expect(transformedCode).toContain('<Button variant="success"');
      expect(transformedCode).toContain('>Click Me</Button>');
      expect(transformedCode).not.toContain('<button');
    });

    it('should preserve layout classes during transformation', async () => {
      const testFile = path.join(tempDir, 'LayoutButton.tsx');
      const originalCode = `
export const LayoutButton = () => {
  return (
    <button className="bg-red-500 flex items-center gap-2 mt-4">
      Delete
    </button>
  );
}`;
      await writeFile(testFile, originalCode);

      // Execute full workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      // Layout classes should be preserved in customClassNames
      expect(mapping.customClassNames).toContain('flex');
      expect(mapping.customClassNames).toContain('items-center');
      expect(mapping.customClassNames).toContain('gap-2');
      expect(mapping.customClassNames).toContain('mt-4');

      // Transform and verify
      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('variant="destructive"');
      expect(transformedCode).toContain('className="flex items-center gap-2 mt-4"');
    });
  });

  describe('Complex Variant Mapping Integration', () => {
    it('should handle multiple buttons with different variants in same file', async () => {
      const testFile = path.join(tempDir, 'MultipleButtons.tsx');
      const originalCode = `
export const MultipleButtons = () => {
  return (
    <div>
      <button className="bg-green-500">Save</button>
      <button className="bg-red-500">Delete</button>
      <button className="border">Cancel</button>
      <button className="text-blue-500">Learn More</button>
    </div>
  );
}`;
      await writeFile(testFile, originalCode);

      // Execute workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);

      expect(scanResult.totalButtons).toBe(4);

      // Analyze all buttons
      const mappings = scanResult.buttons.map((button) => {
        const analysis = analyzer.analyze(button);
        return mapper.map(analysis);
      });

      expect(mappings[0].variant).toBe('success'); // Save button
      expect(mappings[1].variant).toBe('destructive'); // Delete button
      expect(mappings[2].variant).toBe('outline'); // Cancel button
      expect(mappings[3].variant).toBe('link'); // Learn More button

      // Transform file
      await transformer.transform(testFile, mappings);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Verify all variants are present
      expect(transformedCode).toContain('variant="success"');
      expect(transformedCode).toContain('variant="destructive"');
      expect(transformedCode).toContain('variant="outline"');
      expect(transformedCode).toContain('variant="link"');
      expect(transformedCode).toContain('import { Button }');
    });

    it('should apply heuristic analysis when className is ambiguous', async () => {
      const testFile = path.join(tempDir, 'HeuristicButton.tsx');
      const originalCode = `
export const HeuristicButton = () => {
  const handleDelete = () => {};
  return <button onClick={handleDelete}>Remove Item</button>;
}`;
      await writeFile(testFile, originalCode);

      // Execute workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];

      // Should infer destructive variant from onClick name and children text
      const analysis = analyzer.analyze(button);

      expect(analysis.suggestedVariant).toBe('destructive');
      expect(analysis.reasoning).toContain('delete');

      const mapping = mapper.map(analysis);
      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('variant="destructive"');
    });

    it('should handle icon-only buttons with size inference', async () => {
      const testFile = path.join(tempDir, 'IconButton.tsx');
      const originalCode = `
import { PixelIcon } from '@/components/ui/icons';

export const IconButton = () => {
  return (
    <button className="w-8 h-8 bg-gray-100" aria-label="Close">
      <PixelIcon name="close" />
    </button>
  );
}`;
      await writeFile(testFile, originalCode);

      // Execute workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      // Should detect icon size from w-8 h-8
      expect(mapping.size).toBe('icon');

      // Should enhance accessibility for icon button
      const a11yAttrs = enhancer.enhance(button, mapping);
      expect(a11yAttrs.ariaLabel).toBe('Close'); // Should preserve existing aria-label

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('size="icon"');
      expect(transformedCode).toContain('aria-label="Close"');
    });
  });

  describe('Accessibility Enhancement Integration', () => {
    it('should add aria-label to icon-only button without existing label', async () => {
      const testFile = path.join(tempDir, 'IconOnlyButton.tsx');
      const originalCode = `
import { PixelIcon } from '@/components/ui/icons';

export const IconOnlyButton = () => {
  return (
    <button>
      <PixelIcon name="settings" />
    </button>
  );
}`;
      await writeFile(testFile, originalCode);

      // Execute workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);
      const a11yAttrs = enhancer.enhance(button, mapping);

      // Should generate aria-label from icon name
      expect(a11yAttrs.ariaLabel).toBe('settings');

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('aria-label="settings"');
    });

    it('should add aria-disabled for disabled buttons', async () => {
      const testFile = path.join(tempDir, 'DisabledButton.tsx');
      const originalCode = `
export const DisabledButton = ({ isDisabled }) => {
  return <button disabled={isDisabled}>Submit</button>;
}`;
      await writeFile(testFile, originalCode);

      // Execute workflow
      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);
      const a11yAttrs = enhancer.enhance(button, mapping);

      expect(a11yAttrs.ariaDisabled).toBe(true);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('disabled={isDisabled}');
      expect(transformedCode).toContain('aria-disabled={isDisabled}');
    });
  });

  describe('Import Statement Handling', () => {
    it('should add import when none exists', async () => {
      const testFile = path.join(tempDir, 'NoImport.tsx');
      const originalCode = `
export const NoImport = () => {
  return <button>Click</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Should add import at the top
      const lines = transformedCode.split('\n');
      const importLine = lines.find((line) => line.includes('import { Button }'));
      expect(importLine).toBeDefined();
      expect(importLine).toContain('@/components/ui/button');
    });

    it('should not duplicate import if already exists', async () => {
      const testFile = path.join(tempDir, 'ExistingImport.tsx');
      const originalCode = `
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';

export const ExistingImport = () => {
  return (
    <>
      <Button>Already using Button</Button>
      <button>Native button to convert</button>
    </>
  );
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);

      // Should only find native button (not Button component)
      expect(scanResult.totalButtons).toBe(1);

      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Count import statements
      const importCount = (transformedCode.match(/import { Button }/g) || []).length;
      expect(importCount).toBe(1); // Should not duplicate
    });

    it('should preserve import order when adding Button import', async () => {
      const testFile = path.join(tempDir, 'ImportOrder.tsx');
      const originalCode = `
import React from 'react';
import { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';

export const ImportOrder = () => {
  return <button>Click</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Button import should be near other component imports
      const lines = transformedCode.split('\n').filter((l) => l.trim());
      const reactImportIndex = lines.findIndex((l) => l.includes('from \'react\''));
      const buttonImportIndex = lines.findIndex((l) => l.includes('from \'@/components/ui/button\''));
      const pixelIconImportIndex = lines.findIndex((l) => l.includes('from \'@/components/ui/icons\''));

      expect(reactImportIndex).toBeLessThan(buttonImportIndex);
      expect(buttonImportIndex).toBeLessThan(pixelIconImportIndex);
    });
  });

  describe('Error Handling and Propagation', () => {
    it('should handle syntax errors gracefully and continue processing', async () => {
      const errorFile = path.join(tempDir, 'SyntaxError.tsx');
      const validFile = path.join(tempDir, 'Valid.tsx');

      await writeFile(errorFile, 'invalid syntax {{{');
      await writeFile(validFile, 'export const Valid = () => <button>Click</button>');

      const config: BatchConfig = {
        name: 'Test',
        patterns: [path.join(tempDir, '*.tsx')],
      };

      const scanResult = await scanner.scanBatch(config);

      expect(scanResult.errors).toHaveLength(1);
      expect(scanResult.errors[0].filePath).toBe(errorFile);
      expect(scanResult.totalButtons).toBe(1); // Valid file should still be processed
    });

    it('should report transformation errors without crashing', async () => {
      const testFile = path.join(tempDir, 'TransformError.tsx');
      // Create a file that will parse but may cause transformation issues
      const originalCode = `
export const TransformError = () => {
  return <button className={dynamicClass}>Click</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      const transformResult = await transformer.transform(testFile, [mapping]);

      // Should complete even if there are warnings
      expect(transformResult.success).toBe(true);
    });

    it('should propagate warnings from low confidence mappings', async () => {
      const testFile = path.join(tempDir, 'LowConfidence.tsx');
      const originalCode = `
export const LowConfidence = () => {
  return <button className="custom-style">Click</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);

      // Should have low confidence for unrecognized className
      expect(analysis.confidence).toBe('low');

      const mapping = mapper.map(analysis);

      // Should propagate warning
      expect(mapping.warnings.length).toBeGreaterThan(0);
      expect(mapping.warnings[0]).toContain('Low confidence');
    });
  });

  describe('Batch Executor Integration', () => {
    it('should track batch status through execution', () => {
      const executor = new BatchExecutor({
        logDir: path.join(tempDir, 'logs'),
        rootDir: tempDir,
      });

      const initialStatus = executor.getStatus();

      expect(initialStatus).toHaveLength(5);
      initialStatus.forEach((status) => {
        expect(status.status).toBe('pending');
        expect(status.progress).toBe(0);
      });
    });

    it('should generate report with correct structure', () => {
      const executor = new BatchExecutor({
        logDir: path.join(tempDir, 'logs'),
        rootDir: tempDir,
      });

      const report = executor.generateReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('batches');
      expect(report).toHaveProperty('variantDistribution');
      expect(report).toHaveProperty('sizeDistribution');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('manualReviewRequired');

      // Verify all variants are tracked
      expect(Object.keys(report.variantDistribution)).toContain('default');
      expect(Object.keys(report.variantDistribution)).toContain('destructive');
      expect(Object.keys(report.variantDistribution)).toContain('success');

      // Verify all sizes are tracked
      expect(Object.keys(report.sizeDistribution)).toContain('default');
      expect(Object.keys(report.sizeDistribution)).toContain('icon');
      expect(Object.keys(report.sizeDistribution)).toContain('sm');
    });

    it('should have correct batch configurations for all 5 batches', () => {
      const executor = new BatchExecutor({
        logDir: path.join(tempDir, 'logs'),
        rootDir: tempDir,
      });

      const configs = executor.getBatchConfigs();

      expect(configs).toHaveLength(5);
      expect(configs[0].name).toBe('Batch 1: Mobile');
      expect(configs[1].name).toBe('Batch 2: Admin');
      expect(configs[2].name).toBe('Batch 3: Readings');
      expect(configs[3].name).toBe('Batch 4: Auth & Settings');
      expect(configs[4].name).toBe('Batch 5: Remaining');

      // All batches should exclude test files
      configs.forEach((config) => {
        expect(config.excludePatterns).toContain('**/*.test.tsx');
        expect(config.excludePatterns).toContain('**/*.spec.tsx');
        expect(config.excludePatterns).toContain('**/__tests__/**');
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle form submission button correctly', async () => {
      const testFile = path.join(tempDir, 'FormButton.tsx');
      const originalCode = `
export const FormButton = () => {
  const handleSubmit = () => {};

  return (
    <form>
      <button type="submit" onClick={handleSubmit} className="bg-blue-500">
        Submit Form
      </button>
    </form>
  );
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Should preserve type="submit"
      expect(transformedCode).toContain('type="submit"');
      expect(transformedCode).toContain('onClick={handleSubmit}');
      expect(transformedCode).toContain('<Button');
    });

    it('should handle ref forwarding correctly', async () => {
      const testFile = path.join(tempDir, 'RefButton.tsx');
      const originalCode = `
import { useRef } from 'react';

export const RefButton = () => {
  const buttonRef = useRef(null);

  return <button ref={buttonRef}>Click</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);
      const button = scanResult.buttons[0];

      expect(button.hasRef).toBe(true);

      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Should preserve ref (React 19 ref-as-prop)
      expect(transformedCode).toContain('ref={buttonRef}');
      expect(transformedCode).toContain('<Button');
    });

    it('should handle conditional rendering of buttons', async () => {
      const testFile = path.join(tempDir, 'ConditionalButtons.tsx');
      const originalCode = `
export const ConditionalButtons = ({ isPrimary }) => {
  return (
    <div>
      {isPrimary ? (
        <button className="bg-blue-500">Primary Action</button>
      ) : (
        <button className="border">Secondary Action</button>
      )}
    </div>
  );
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);

      expect(scanResult.totalButtons).toBe(2);

      const mappings = scanResult.buttons.map((button) => {
        const analysis = analyzer.analyze(button);
        return mapper.map(analysis);
      });

      expect(mappings[0].variant).toBe('default'); // Primary button
      expect(mappings[1].variant).toBe('outline'); // Secondary button

      await transformer.transform(testFile, mappings);
      const transformedCode = await readFile(testFile, 'utf-8');

      expect(transformedCode).toContain('variant="default"');
      expect(transformedCode).toContain('variant="outline"');
    });

    it('should handle buttons with spread props', async () => {
      const testFile = path.join(tempDir, 'SpreadProps.tsx');
      const originalCode = `
export const SpreadProps = (props) => {
  return <button {...props} className="bg-green-500">Save</button>;
}`;
      await writeFile(testFile, originalCode);

      const config: BatchConfig = { name: 'Test', patterns: [testFile] };
      const scanResult = await scanner.scanBatch(config);

      expect(scanResult.totalButtons).toBe(1);

      const button = scanResult.buttons[0];
      const analysis = analyzer.analyze(button);
      const mapping = mapper.map(analysis);

      await transformer.transform(testFile, [mapping]);
      const transformedCode = await readFile(testFile, 'utf-8');

      // Should preserve spread props
      expect(transformedCode).toContain('{...props}');
      expect(transformedCode).toContain('variant="success"');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch with multiple files efficiently', async () => {
      // Create 10 test files
      const files = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const filePath = path.join(tempDir, `Component${i}.tsx`);
          await writeFile(
            filePath,
            `export const Component${i} = () => <button>Button ${i}</button>`
          );
          return filePath;
        })
      );

      const config: BatchConfig = {
        name: 'Test Batch',
        patterns: [path.join(tempDir, '*.tsx')],
        maxConcurrency: 5,
      };

      const startTime = Date.now();
      const scanResult = await scanner.scanBatch(config);
      const scanDuration = Date.now() - startTime;

      expect(scanResult.totalFiles).toBe(10);
      expect(scanResult.totalButtons).toBe(10);
      expect(scanDuration).toBeLessThan(5000); // Should complete in under 5 seconds

      // Transform all files
      const transformStart = Date.now();
      for (const button of scanResult.buttons) {
        const analysis = analyzer.analyze(button);
        const mapping = mapper.map(analysis);
        await transformer.transform(button.filePath, [mapping]);
      }
      const transformDuration = Date.now() - transformStart;

      expect(transformDuration).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });
});
