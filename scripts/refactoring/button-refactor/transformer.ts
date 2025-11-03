/**
 * Code Transformer - Transform button elements to Button components
 *
 * Purpose: AST transformation, code generation, import insertion, TypeScript validation
 * Requirements: 1.3-1.7, 10.1-10.3
 */

import * as fs from 'fs/promises';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type {
  MappingResult,
  TransformResult,
  TransformError,
} from './types';

/**
 * Code Transformer class
 */
export class CodeTransformer {
  /**
   * Transform buttons in a file
   */
  async transform(
    filePath: string,
    mappings: MappingResult[]
  ): Promise<TransformResult> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Generate transformed code
      const transformedCode = this.transformCode(content, mappings);

      if (!transformedCode.success) {
        return {
          filePath,
          success: false,
          transformedButtons: 0,
          addedImports: [],
          errors: transformedCode.errors,
          diff: '',
        };
      }

      // Write transformed code to file
      await fs.writeFile(filePath, transformedCode.code, 'utf-8');

      return {
        filePath,
        success: true,
        transformedButtons: transformedCode.transformedButtons,
        addedImports: transformedCode.addedImports,
        errors: [],
        diff: this.generateDiff(content, transformedCode.code),
      };
    } catch (error) {
      return {
        filePath,
        success: false,
        transformedButtons: 0,
        addedImports: [],
        errors: [
          {
            line: 0,
            message: error instanceof Error ? error.message : String(error),
            severity: 'error',
          },
        ],
        diff: '',
      };
    }
  }

  /**
   * Preview transformation without writing file
   */
  async preview(
    filePath: string,
    mappings: MappingResult[]
  ): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const result = this.transformCode(content, mappings);

    if (!result.success) {
      throw new Error(`Preview failed: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.code;
  }

  /**
   * Transform code using AST
   */
  private transformCode(
    content: string,
    mappings: MappingResult[]
  ): {
    success: boolean;
    code: string;
    transformedButtons: number;
    addedImports: string[];
    errors: TransformError[];
  } {
    try {
      // Parse code
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      let buttonCount = 0;
      const errors: TransformError[] = [];
      let hasButtonImport = false;

      // Check if Button is already imported
      traverse(ast, {
        ImportDeclaration: (path) => {
          if (path.node.source.value === '@/components/ui/button') {
            const specifiers = path.node.specifiers;
            for (const spec of specifiers) {
              if (
                t.isImportSpecifier(spec) &&
                t.isIdentifier(spec.imported) &&
                spec.imported.name === 'Button'
              ) {
                hasButtonImport = true;
                break;
              }
            }
          }
        },
      });

      // Transform button elements
      traverse(ast, {
        JSXElement: (path) => {
          const openingElement = path.node.openingElement;

          // Check if this is a native button
          if (
            t.isJSXIdentifier(openingElement.name) &&
            openingElement.name.name === 'button'
          ) {
            // Check if we have a mapping for this button
            if (buttonCount >= mappings.length) {
              errors.push({
                line: openingElement.loc?.start.line || 0,
                message: `No mapping provided for button at index ${buttonCount}`,
                severity: 'error',
              });
              return;
            }

            const mapping = mappings[buttonCount];

            // Transform button to Button
            this.transformButtonElement(path, mapping);
            buttonCount++;
          }
        },
      });

      // Validate mapping count
      if (buttonCount !== mappings.length) {
        errors.push({
          line: 0,
          message: `Mapping count mismatch: found ${buttonCount} buttons but ${mappings.length} mappings provided`,
          severity: 'error',
        });

        return {
          success: false,
          code: '',
          transformedButtons: 0,
          addedImports: [],
          errors,
        };
      }

      // Add Button import if needed
      const addedImports: string[] = [];
      if (!hasButtonImport && buttonCount > 0) {
        this.addButtonImport(ast);
        addedImports.push("import { Button } from '@/components/ui/button'");
      }

      // Generate code
      const output = generate(ast, {
        retainLines: true,
        retainFunctionParens: true,
      });

      return {
        success: true,
        code: output.code,
        transformedButtons: buttonCount,
        addedImports,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        code: '',
        transformedButtons: 0,
        addedImports: [],
        errors: [
          {
            line: 0,
            message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * Transform a single button JSX element
   */
  private transformButtonElement(path: any, mapping: MappingResult): void {
    const openingElement = path.node.openingElement;
    const closingElement = path.node.closingElement;

    // Change element name from 'button' to 'Button'
    openingElement.name.name = 'Button';
    if (closingElement && t.isJSXIdentifier(closingElement.name)) {
      closingElement.name.name = 'Button';
    }

    // Add variant prop
    const variantAttr = t.jsxAttribute(
      t.jsxIdentifier('variant'),
      t.stringLiteral(mapping.variant)
    );
    openingElement.attributes.unshift(variantAttr);

    // Add size prop
    const sizeAttr = t.jsxAttribute(
      t.jsxIdentifier('size'),
      t.stringLiteral(mapping.size)
    );
    openingElement.attributes.unshift(sizeAttr);

    // Update className if custom classes exist
    if (mapping.customClassNames.length > 0) {
      const classNameValue = mapping.customClassNames.join(' ');

      // Find and update existing className attribute
      let classNameAttr = openingElement.attributes.find(
        (attr: any) =>
          t.isJSXAttribute(attr) &&
          t.isJSXIdentifier(attr.name) &&
          attr.name.name === 'className'
      );

      if (classNameAttr) {
        classNameAttr.value = t.stringLiteral(classNameValue);
      } else {
        // Add new className attribute
        openingElement.attributes.push(
          t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(classNameValue))
        );
      }
    } else {
      // Remove className attribute if no custom classes
      openingElement.attributes = openingElement.attributes.filter(
        (attr: any) =>
          !(
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === 'className'
          )
      );
    }
  }

  /**
   * Add Button import statement to AST
   */
  private addButtonImport(ast: any): void {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier('Button'), t.identifier('Button'))],
      t.stringLiteral('@/components/ui/button')
    );

    // Find the first import statement and insert after it
    // If no imports, insert at the beginning
    const body = ast.program.body;

    let insertIndex = 0;
    for (let i = 0; i < body.length; i++) {
      if (t.isImportDeclaration(body[i])) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    body.splice(insertIndex, 0, importDeclaration);
  }

  /**
   * Generate simple diff string
   */
  private generateDiff(original: string, transformed: string): string {
    const originalLines = original.split('\n');
    const transformedLines = transformed.split('\n');

    const diff: string[] = [];
    const maxLines = Math.max(originalLines.length, transformedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const transLine = transformedLines[i] || '';

      if (origLine !== transLine) {
        if (origLine) {
          diff.push(`- ${origLine}`);
        }
        if (transLine) {
          diff.push(`+ ${transLine}`);
        }
      }
    }

    return diff.join('\n');
  }
}
