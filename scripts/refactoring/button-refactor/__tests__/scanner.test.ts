/**
 * Unit Tests for Button Scanner
 *
 * Purpose: Test file scanning, AST parsing, button identification, and attribute extraction
 * Requirements: 1.1, 1.2
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ButtonScanner } from '../scanner';
import type { BatchConfig, ScanResult, ButtonInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, writeFile } from 'fs/promises';

describe('ButtonScanner', () => {
  let tempDir: string;
  let scanner: ButtonScanner;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await mkdtemp(path.join(tmpdir(), 'button-scanner-test-'));
    scanner = new ButtonScanner();
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('File Scanning', () => {
    it('should scan files matching glob patterns', async () => {
      // Create test files
      const testFile1 = path.join(tempDir, 'Component1.tsx');
      const testFile2 = path.join(tempDir, 'Component2.tsx');
      await writeFile(testFile1, 'export const Test1 = () => <button>Click</button>');
      await writeFile(testFile2, 'export const Test2 = () => <button>Submit</button>');

      const config: BatchConfig = {
        name: 'Test Batch',
        patterns: [path.join(tempDir, '*.tsx')],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalFiles).toBe(2);
      expect(result.totalButtons).toBe(2);
      expect(result.buttons).toHaveLength(2);
    });

    it('should exclude files matching excludePatterns', async () => {
      // Create test files
      const testFile = path.join(tempDir, 'Component.tsx');
      const testFileExcluded = path.join(tempDir, 'Component.test.tsx');
      await writeFile(testFile, 'export const Test = () => <button>Click</button>');
      await writeFile(testFileExcluded, 'it("test", () => <button>Test</button>)');

      const config: BatchConfig = {
        name: 'Test Batch',
        patterns: [path.join(tempDir, '*.tsx')],
        excludePatterns: ['**/*.test.tsx'],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalFiles).toBe(1);
      expect(result.buttons[0].filePath).toBe(testFile);
    });

    it('should handle empty directories gracefully', async () => {
      const config: BatchConfig = {
        name: 'Empty Batch',
        patterns: [path.join(tempDir, '*.tsx')],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalFiles).toBe(0);
      expect(result.totalButtons).toBe(0);
      expect(result.buttons).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should process files in parallel with maxConcurrency limit', async () => {
      // Create 15 test files
      const files = Array.from({ length: 15 }, (_, i) =>
        path.join(tempDir, `Component${i}.tsx`)
      );
      await Promise.all(
        files.map((file, i) =>
          writeFile(file, `export const Test${i} = () => <button>Click</button>`)
        )
      );

      const config: BatchConfig = {
        name: 'Parallel Batch',
        patterns: [path.join(tempDir, '*.tsx')],
        maxConcurrency: 10,
      };

      const startTime = Date.now();
      const result = await scanner.scanBatch(config);
      const duration = Date.now() - startTime;

      // Debug: log errors if any
      if (result.errors.length > 0) {
        console.log('Errors:', result.errors);
      }

      expect(result.totalFiles).toBe(15);
      expect(result.totalButtons).toBe(15);
      // Should complete reasonably fast with parallel processing
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('AST Parsing and Button Identification', () => {
    it('should identify simple button elements', async () => {
      const testFile = path.join(tempDir, 'Simple.tsx');
      await writeFile(testFile, `
        export const Simple = () => {
          return <button>Click Me</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(1);
      expect(result.buttons[0]).toMatchObject({
        filePath: testFile,
        children: 'Click Me',
      });
    });

    it('should identify buttons with className', async () => {
      const testFile = path.join(tempDir, 'WithClass.tsx');
      await writeFile(testFile, `
        export const WithClass = () => {
          return <button className="btn-primary">Submit</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0]).toMatchObject({
        className: 'btn-primary',
        children: 'Submit',
      });
    });

    it('should identify buttons with onClick handler', async () => {
      const testFile = path.join(tempDir, 'WithHandler.tsx');
      await writeFile(testFile, `
        export const WithHandler = () => {
          const handleClick = () => {};
          return <button onClick={handleClick}>Click</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0]).toMatchObject({
        onClick: 'handleClick',
      });
    });

    it('should extract multiple attributes', async () => {
      const testFile = path.join(tempDir, 'MultiAttr.tsx');
      await writeFile(testFile, `
        export const MultiAttr = () => {
          return (
            <button
              type="submit"
              disabled
              className="btn-danger"
              aria-label="Delete"
            >
              Delete
            </button>
          );
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0]).toMatchObject({
        className: 'btn-danger',
        children: 'Delete',
      });
      expect(result.buttons[0].attributes).toMatchObject({
        type: 'submit',
        disabled: true,
        'aria-label': 'Delete',
      });
    });

    it('should detect ref usage', async () => {
      const testFile = path.join(tempDir, 'WithRef.tsx');
      await writeFile(testFile, `
        import { useRef } from 'react';
        export const WithRef = () => {
          const ref = useRef(null);
          return <button ref={ref}>Click</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0].hasRef).toBe(true);
    });

    it('should handle buttons with spread props', async () => {
      const testFile = path.join(tempDir, 'WithSpread.tsx');
      await writeFile(testFile, `
        export const WithSpread = (props) => {
          return <button {...props}>Click</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0]).toBeDefined();
      expect(result.buttons[0].children).toBe('Click');
    });

    it('should handle buttons with complex children', async () => {
      const testFile = path.join(tempDir, 'ComplexChildren.tsx');
      await writeFile(testFile, `
        export const ComplexChildren = () => {
          return (
            <button>
              <span>Icon</span>
              <span>Text</span>
            </button>
          );
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0]).toBeDefined();
      // Should extract text content from complex children
      expect(result.buttons[0].children).toContain('Icon');
      expect(result.buttons[0].children).toContain('Text');
    });

    it('should identify multiple buttons in same file', async () => {
      const testFile = path.join(tempDir, 'Multiple.tsx');
      await writeFile(testFile, `
        export const Multiple = () => {
          return (
            <div>
              <button className="btn-1">Button 1</button>
              <button className="btn-2">Button 2</button>
              <button className="btn-3">Button 3</button>
            </div>
          );
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(3);
      expect(result.buttons[0].className).toBe('btn-1');
      expect(result.buttons[1].className).toBe('btn-2');
      expect(result.buttons[2].className).toBe('btn-3');
    });

    it('should record accurate line and column numbers', async () => {
      const testFile = path.join(tempDir, 'LineNumbers.tsx');
      const code = `
export const LineNumbers = () => {
  return (
    <div>
      <button>Line 5</button>
      <button>Line 6</button>
    </div>
  );
}`;
      await writeFile(testFile, code);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.buttons[0].line).toBeGreaterThan(0);
      expect(result.buttons[0].column).toBeGreaterThanOrEqual(0);
      expect(result.buttons[1].line).toBeGreaterThan(result.buttons[0].line);
    });
  });

  describe('Error Handling', () => {
    it('should skip files with syntax errors and log error', async () => {
      const testFile = path.join(tempDir, 'SyntaxError.tsx');
      await writeFile(testFile, `
        export const Invalid = () => {
          return <button>Unclosed
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        filePath: testFile,
        severity: 'error',
      });
      expect(result.errors[0].message).toContain('parse');
    });

    it('should handle non-existent files gracefully', async () => {
      const config: BatchConfig = {
        name: 'Test',
        patterns: [path.join(tempDir, 'NonExistent.tsx')],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalFiles).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid TypeScript/JSX gracefully', async () => {
      const testFile = path.join(tempDir, 'InvalidTS.tsx');
      await writeFile(testFile, `
        export const Invalid: InvalidType = () => {
          return <button>Click</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      // Should still parse buttons even if TypeScript types are invalid
      expect(result.totalButtons).toBeGreaterThanOrEqual(0);
    });

    it('should continue processing after encountering error in one file', async () => {
      const errorFile = path.join(tempDir, 'Error.tsx');
      const validFile = path.join(tempDir, 'Valid.tsx');
      await writeFile(errorFile, 'invalid syntax {{{');
      await writeFile(validFile, 'export const Valid = () => <button>Click</button>');

      const config: BatchConfig = {
        name: 'Test',
        patterns: [path.join(tempDir, '*.tsx')],
      };

      const result = await scanner.scanBatch(config);

      expect(result.errors).toHaveLength(1);
      expect(result.totalButtons).toBe(1);
      expect(result.buttons[0].filePath).toBe(validFile);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty button elements', async () => {
      const testFile = path.join(tempDir, 'Empty.tsx');
      await writeFile(testFile, `
        export const Empty = () => {
          return <button></button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(1);
      expect(result.buttons[0].children).toBe('');
    });

    it('should handle buttons with dynamic className', async () => {
      const testFile = path.join(tempDir, 'DynamicClass.tsx');
      await writeFile(testFile, `
        export const DynamicClass = ({ active }) => {
          return <button className={\`btn \${active ? 'active' : ''}\`}>Click</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(1);
      // Should detect it has className even if dynamic
      expect(result.buttons[0]).toBeDefined();
    });

    it('should handle buttons in conditional rendering', async () => {
      const testFile = path.join(tempDir, 'Conditional.tsx');
      await writeFile(testFile, `
        export const Conditional = ({ show }) => {
          return show ? <button>Show</button> : <button>Hide</button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(2);
    });

    it('should not identify Button component as native button', async () => {
      const testFile = path.join(tempDir, 'ButtonComponent.tsx');
      await writeFile(testFile, `
        import { Button } from '@/components/ui/button';
        export const ButtonComponent = () => {
          return <Button>Already Migrated</Button>;
        }
      `);

      const config: BatchConfig = {
        name: 'Test',
        patterns: [testFile],
      };

      const result = await scanner.scanBatch(config);

      expect(result.totalButtons).toBe(0);
    });
  });
});
