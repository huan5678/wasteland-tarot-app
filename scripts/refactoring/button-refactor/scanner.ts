/**
 * Button Scanner - File scanning and button identification
 *
 * Purpose: Scan files, parse AST, identify native button elements, extract attributes
 * Requirements: 1.1, 1.2
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { glob } from 'glob';
import type {
  BatchConfig,
  ScanResult,
  ButtonInfo,
  ScanError,
} from './types';

/**
 * Button Scanner class
 */
export class ButtonScanner {
  /**
   * Scan a batch of files for native button elements
   */
  async scanBatch(config: BatchConfig): Promise<ScanResult> {
    const startTime = Date.now();
    const maxConcurrency = config.maxConcurrency || 10;

    // Find all files matching patterns
    const files = await this.findFiles(config.patterns, config.excludePatterns);

    // Process files in parallel with concurrency limit
    const results = await this.processFilesInParallel(files, maxConcurrency);

    // Aggregate results
    const buttons: ButtonInfo[] = [];
    const errors: ScanError[] = [];

    results.forEach(result => {
      if (result.type === 'success') {
        buttons.push(...result.buttons);
      } else {
        errors.push(result.error);
      }
    });

    return {
      totalFiles: files.length,
      totalButtons: buttons.length,
      buttons,
      errors,
    };
  }

  /**
   * Find files matching glob patterns
   */
  private async findFiles(
    patterns: string[],
    excludePatterns?: string[]
  ): Promise<string[]> {
    const allFiles: Set<string> = new Set();

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: excludePatterns || [],
        absolute: true,
      });
      files.forEach(file => allFiles.add(file));
    }

    return Array.from(allFiles);
  }

  /**
   * Process files in parallel with concurrency limit
   */
  private async processFilesInParallel(
    files: string[],
    maxConcurrency: number
  ): Promise<Array<{ type: 'success'; buttons: ButtonInfo[] } | { type: 'error'; error: ScanError }>> {
    const results: Array<{ type: 'success'; buttons: ButtonInfo[] } | { type: 'error'; error: ScanError }> = [];

    // Process in chunks
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const chunk = files.slice(i, i + maxConcurrency);
      const chunkResults = await Promise.all(
        chunk.map(file => this.scanFile(file))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Scan a single file for button elements
   */
  private async scanFile(
    filePath: string
  ): Promise<{ type: 'success'; buttons: ButtonInfo[] } | { type: 'error'; error: ScanError }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const buttons = this.parseButtons(filePath, content);
      return { type: 'success', buttons };
    } catch (error) {
      return {
        type: 'error',
        error: {
          filePath,
          line: 0,
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
        },
      };
    }
  }

  /**
   * Parse file content and extract button information
   */
  private parseButtons(filePath: string, content: string): ButtonInfo[] {
    const buttons: ButtonInfo[] = [];

    try {
      // Parse file as TypeScript/JSX
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      // Traverse AST to find button elements
      traverse(ast, {
        JSXElement: (path) => {
          const openingElement = path.node.openingElement;

          // Check if this is a native <button> element (not <Button>)
          if (
            openingElement.name.type === 'JSXIdentifier' &&
            openingElement.name.name === 'button'
          ) {
            const buttonInfo = this.extractButtonInfo(
              filePath,
              openingElement,
              path
            );
            buttons.push(buttonInfo);
          }
        },
      });
    } catch (error) {
      // If parse fails, throw error which will be caught by scanFile
      throw new Error(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return buttons;
  }

  /**
   * Extract button information from JSX element
   */
  private extractButtonInfo(
    filePath: string,
    openingElement: any,
    path: any
  ): ButtonInfo {
    const attributes: Record<string, any> = {};
    let className: string | undefined;
    let onClick: string | undefined;
    let hasRef = false;

    // Extract attributes
    openingElement.attributes.forEach((attr: any) => {
      if (attr.type === 'JSXAttribute') {
        const name = attr.name.name;

        // Extract className
        if (name === 'className') {
          className = this.extractAttributeValue(attr.value);
        }

        // Extract onClick handler name
        if (name === 'onClick') {
          onClick = this.extractHandlerName(attr.value);
        }

        // Check for ref
        if (name === 'ref') {
          hasRef = true;
        }

        // Store all attributes
        attributes[name] = this.extractAttributeValue(attr.value);
      } else if (attr.type === 'JSXSpreadAttribute') {
        // Handle {...props} spread
        attributes['...spread'] = true;
      }
    });

    // Extract children text content
    const children = this.extractChildren(path.node.children);

    // Get location
    const loc = openingElement.loc;
    const line = loc?.start.line || 0;
    const column = loc?.start.column || 0;

    return {
      filePath,
      line,
      column,
      attributes,
      className,
      children,
      hasRef,
      onClick,
    };
  }

  /**
   * Extract attribute value from JSX attribute
   */
  private extractAttributeValue(value: any): any {
    if (!value) return true; // Boolean attribute like "disabled"

    if (value.type === 'StringLiteral') {
      return value.value;
    }

    if (value.type === 'JSXExpressionContainer') {
      const expr = value.expression;

      if (expr.type === 'BooleanLiteral') {
        return expr.value;
      }

      if (expr.type === 'StringLiteral') {
        return expr.value;
      }

      if (expr.type === 'NumericLiteral') {
        return expr.value;
      }

      // For complex expressions, return a placeholder
      return '{expression}';
    }

    return undefined;
  }

  /**
   * Extract handler function name from onClick attribute
   */
  private extractHandlerName(value: any): string | undefined {
    if (!value || value.type !== 'JSXExpressionContainer') {
      return undefined;
    }

    const expr = value.expression;

    // Handle simple identifier: onClick={handleClick}
    if (expr.type === 'Identifier') {
      return expr.name;
    }

    // Handle arrow function or other expressions
    return undefined;
  }

  /**
   * Extract text content from children nodes
   */
  private extractChildren(children: any[]): string {
    const texts: string[] = [];

    children.forEach((child: any) => {
      if (child.type === 'JSXText') {
        const text = child.value.trim();
        if (text) {
          texts.push(text);
        }
      } else if (child.type === 'JSXExpressionContainer') {
        // Handle {variable} expressions
        if (child.expression.type === 'StringLiteral') {
          texts.push(child.expression.value);
        }
      } else if (child.type === 'JSXElement') {
        // Recursively extract from nested elements
        const nestedText = this.extractChildren(child.children);
        if (nestedText) {
          texts.push(nestedText);
        }
      }
    });

    return texts.join(' ');
  }
}
