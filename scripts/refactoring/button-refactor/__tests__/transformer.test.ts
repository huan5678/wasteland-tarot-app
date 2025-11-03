/**
 * Unit Tests for Code Transformer and Accessibility Enhancer
 *
 * Purpose: Test AST transformation, code generation, import insertion, ref forwarding, and accessibility enhancements
 * Requirements: 1.3-1.7, 4.1-4.7, 10.1-10.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CodeTransformer } from '../transformer';
import { AccessibilityEnhancer } from '../enhancer';
import type { MappingResult, TransformResult, ButtonInfo, AccessibilityAttributes } from '../types';
import * as path from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';

describe('CodeTransformer', () => {
  let tempDir: string;
  let transformer: CodeTransformer;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'transformer-test-'));
    transformer = new CodeTransformer();
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Button Replacement', () => {
    it('should replace native button with Button component', async () => {
      const testFile = path.join(tempDir, 'Simple.tsx');
      await writeFile(testFile, `
        export const Simple = () => {
          return <button>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);
      expect(result.transformedButtons).toBe(1);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('<Button');
      expect(content).toContain('variant="default"');
      expect(content).not.toContain('<button');
    });

    it('should preserve onClick handler', async () => {
      const testFile = path.join(tempDir, 'WithHandler.tsx');
      await writeFile(testFile, `
        export const WithHandler = () => {
          const handleClick = () => console.log('click');
          return <button onClick={handleClick}>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('onClick={handleClick}');
    });

    it('should preserve type attribute', async () => {
      const testFile = path.join(tempDir, 'WithType.tsx');
      await writeFile(testFile, `
        export const WithType = () => {
          return <button type="submit">Submit</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('type="submit"');
    });

    it('should map disabled attribute', async () => {
      const testFile = path.join(tempDir, 'WithDisabled.tsx');
      await writeFile(testFile, `
        export const WithDisabled = () => {
          return <button disabled>Disabled</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('disabled');
    });

    it('should preserve all attributes', async () => {
      const testFile = path.join(tempDir, 'MultiAttr.tsx');
      await writeFile(testFile, `
        export const MultiAttr = () => {
          return (
            <button
              type="submit"
              disabled
              data-testid="submit-btn"
              aria-label="Submit form"
            >
              Submit
            </button>
          );
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('type="submit"');
      expect(content).toContain('disabled');
      expect(content).toContain('data-testid="submit-btn"');
      expect(content).toContain('aria-label="Submit form"');
    });
  });

  describe('Props Mapping', () => {
    it('should add variant prop', async () => {
      const testFile = path.join(tempDir, 'Variant.tsx');
      await writeFile(testFile, `
        export const Variant = () => {
          return <button className="btn-destructive">Delete</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'destructive',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('variant="destructive"');
    });

    it('should add size prop', async () => {
      const testFile = path.join(tempDir, 'Size.tsx');
      await writeFile(testFile, `
        export const Size = () => {
          return <button className="h-8 px-3">Small</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'sm',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('size="sm"');
    });

    it('should preserve custom classNames', async () => {
      const testFile = path.join(tempDir, 'CustomClass.tsx');
      await writeFile(testFile, `
        export const CustomClass = () => {
          return <button className="btn-primary flex items-center gap-2">Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: ['flex', 'items-center', 'gap-2'],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('className="flex items-center gap-2"');
      expect(content).not.toContain('btn-primary');
    });
  });

  describe('Import Statement Insertion', () => {
    it('should add Button import if not present', async () => {
      const testFile = path.join(tempDir, 'NoImport.tsx');
      await writeFile(testFile, `
        export const NoImport = () => {
          return <button>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);
      expect(result.addedImports).toContain("import { Button } from '@/components/ui/button'");

      const content = await readFile(testFile, 'utf-8');
      expect(content).toMatch(/import.*Button.*from.*@\/components\/ui\/button/);
    });

    it('should not duplicate Button import', async () => {
      const testFile = path.join(tempDir, 'HasImport.tsx');
      await writeFile(testFile, `
        import { Button } from '@/components/ui/button';
        export const HasImport = () => {
          return <button>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);
      expect(result.addedImports).toHaveLength(0);

      const content = await readFile(testFile, 'utf-8');
      const importCount = (content.match(/import.*Button.*from.*button/g) || []).length;
      expect(importCount).toBe(1);
    });

    it('should preserve existing imports order', async () => {
      const testFile = path.join(tempDir, 'MultiImport.tsx');
      await writeFile(testFile, `
        import React from 'react';
        import { useState } from 'react';
        import { cn } from '@/lib/utils';

        export const MultiImport = () => {
          return <button>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      const lines = content.split('\n');
      const reactImportIdx = lines.findIndex(l => l.includes('import React'));
      const buttonImportIdx = lines.findIndex(l => l.includes('import { Button }'));

      expect(buttonImportIdx).toBeGreaterThan(reactImportIdx);
    });
  });

  describe('Ref Forwarding', () => {
    it('should handle ref attribute (React 19 ref-as-prop)', async () => {
      const testFile = path.join(tempDir, 'WithRef.tsx');
      await writeFile(testFile, `
        import { useRef } from 'react';
        export const WithRef = () => {
          const buttonRef = useRef(null);
          return <button ref={buttonRef}>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('ref={buttonRef}');
    });
  });

  describe('Multiple Buttons', () => {
    it('should transform multiple buttons in same file', async () => {
      const testFile = path.join(tempDir, 'Multiple.tsx');
      await writeFile(testFile, `
        export const Multiple = () => {
          return (
            <div>
              <button className="btn-primary">Submit</button>
              <button className="btn-danger">Delete</button>
              <button className="btn-outline">Cancel</button>
            </div>
          );
        }
      `);

      const mappings: MappingResult[] = [
        {
          variant: 'default',
          size: 'default',
          customClassNames: [],
          warnings: [],
        },
        {
          variant: 'destructive',
          size: 'default',
          customClassNames: [],
          warnings: [],
        },
        {
          variant: 'outline',
          size: 'default',
          customClassNames: [],
          warnings: [],
        },
      ];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);
      expect(result.transformedButtons).toBe(3);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('variant="default"');
      expect(content).toContain('variant="destructive"');
      expect(content).toContain('variant="outline"');
      expect(content).not.toContain('<button');
    });
  });

  describe('Code Generation', () => {
    it('should generate valid TypeScript code', async () => {
      const testFile = path.join(tempDir, 'Valid.tsx');
      await writeFile(testFile, `
        export const Valid = () => {
          const handleClick = () => {};
          return <button onClick={handleClick} type="submit">Submit</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      // Basic syntax check - should not have obvious errors
      expect(content).not.toContain('<<');
      expect(content).not.toContain('>>');
      expect(content.match(/{/g)?.length).toBe(content.match(/}/g)?.length);
    });

    it('should preserve code formatting', async () => {
      const testFile = path.join(tempDir, 'Formatted.tsx');
      const code = `
export const Formatted = () => {
  return (
    <button
      type="submit"
      className="btn-primary"
    >
      Submit
    </button>
  );
}`;
      await writeFile(testFile, code);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      // Should maintain reasonable indentation
      expect(content).toContain('  ');
    });
  });

  describe('Preview Mode', () => {
    it('should preview transformation without writing file', async () => {
      const testFile = path.join(tempDir, 'Preview.tsx');
      const originalCode = `
        export const Preview = () => {
          return <button>Click</button>;
        }
      `;
      await writeFile(testFile, originalCode);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const preview = await transformer.preview(testFile, mappings);

      expect(preview).toContain('<Button');
      expect(preview).toContain('variant="default"');

      // Original file should not be modified
      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe(originalCode);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const testFile = path.join(tempDir, 'SyntaxError.tsx');
      await writeFile(testFile, `
        export const Invalid = () => {
          return <button>Unclosed
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should handle mismatched mapping count', async () => {
      const testFile = path.join(tempDir, 'Mismatch.tsx');
      await writeFile(testFile, `
        export const Mismatch = () => {
          return <button>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [
        { variant: 'default', size: 'default', customClassNames: [], warnings: [] },
        { variant: 'destructive', size: 'default', customClassNames: [], warnings: [] },
      ];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should not modify file on transformation error', async () => {
      const testFile = path.join(tempDir, 'ErrorNoWrite.tsx');
      const originalCode = `
        export const ErrorNoWrite = () => {
          return <button>Click</button>;
        }
      `;
      await writeFile(testFile, originalCode);

      const mappings: MappingResult[] = [
        { variant: 'default', size: 'default', customClassNames: [], warnings: [] },
        { variant: 'destructive', size: 'default', customClassNames: [], warnings: [] },
      ];

      await transformer.transform(testFile, mappings);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe(originalCode);
    });
  });

  describe('Edge Cases', () => {
    it('should handle spread props', async () => {
      const testFile = path.join(tempDir, 'Spread.tsx');
      await writeFile(testFile, `
        export const Spread = (props) => {
          return <button {...props}>Click</button>;
        }
      `);

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('{...props}');
    });

    it('should handle complex children', async () => {
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

      const mappings: MappingResult[] = [{
        variant: 'default',
        size: 'default',
        customClassNames: [],
        warnings: [],
      }];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toContain('<span>Icon</span>');
      expect(content).toContain('<span>Text</span>');
    });

    it('should handle conditional rendering', async () => {
      const testFile = path.join(tempDir, 'Conditional.tsx');
      await writeFile(testFile, `
        export const Conditional = ({ show }) => {
          return show ? <button>Show</button> : <button>Hide</button>;
        }
      `);

      const mappings: MappingResult[] = [
        { variant: 'default', size: 'default', customClassNames: [], warnings: [] },
        { variant: 'outline', size: 'default', customClassNames: [], warnings: [] },
      ];

      const result = await transformer.transform(testFile, mappings);

      expect(result.success).toBe(true);
      expect(result.transformedButtons).toBe(2);
    });
  });
});

describe('AccessibilityEnhancer', () => {
  let enhancer: AccessibilityEnhancer;

  beforeEach(() => {
    enhancer = new AccessibilityEnhancer();
  });

  describe('aria-label Generation', () => {
    it('should add aria-label for icon-only buttons', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: '', // No text content
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeDefined();
      expect(attrs.reasoning.toLowerCase()).toContain('icon-only');
    });

    it('should not add aria-label if text content exists', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: 'Click Me',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeUndefined();
    });

    it('should not override existing aria-label', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { 'aria-label': 'Existing label' },
        children: '',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeUndefined();
    });

    it('should infer aria-label from onClick handler name', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: '',
        hasRef: false,
        onClick: 'handleClose',
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeDefined();
      expect(attrs.ariaLabel?.toLowerCase()).toContain('close');
    });

    it('should infer aria-label from className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'delete-button',
        children: '',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeDefined();
    });
  });

  describe('aria-disabled Mapping', () => {
    it('should add aria-disabled when disabled is true', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { disabled: true },
        children: 'Disabled',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaDisabled).toBe(true);
    });

    it('should not add aria-disabled when disabled is false', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { disabled: false },
        children: 'Enabled',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaDisabled).toBeUndefined();
    });

    it('should not add aria-disabled when disabled attribute is absent', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: 'Click',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaDisabled).toBeUndefined();
    });
  });

  describe('Context-based Inference', () => {
    it('should infer "Close" for close buttons', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'modal-close',
        children: '',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel?.toLowerCase()).toContain('close');
    });

    it('should infer "Delete" for delete buttons', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        onClick: 'handleDelete',
        children: '',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel?.toLowerCase()).toContain('delete');
    });

    it('should infer "Submit" for submit buttons', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { type: 'submit' },
        children: '',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel?.toLowerCase()).toContain('submit');
    });
  });

  describe('Reasoning Documentation', () => {
    it('should provide reasoning for all enhancements', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { disabled: true },
        children: '',
        hasRef: false,
        onClick: 'handleSave',
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.reasoning).toBeDefined();
      expect(attrs.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle buttons with only whitespace children', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: '   ',
        hasRef: false,
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs.ariaLabel).toBeDefined();
    });

    it('should handle buttons with complex onClick expressions', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: '',
        hasRef: false,
        onClick: '() => handleAction()',
      };

      const attrs = enhancer.enhance(buttonInfo);

      expect(attrs).toBeDefined();
    });
  });
});
