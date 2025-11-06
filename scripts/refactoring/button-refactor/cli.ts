/**
 * CLI Interface for Button Refactoring Tool
 *
 * Purpose: Command-line interface with batch selection, preview mode, and rollback
 * Requirements: 6.7 (CLI interface)
 */

import * as path from 'node:path';
import type { CLIOptions } from './types';

/**
 * CLI class for parsing and validating command-line arguments
 *
 * Features:
 * - Batch selection (1-5 or 'all')
 * - Preview mode (dry-run)
 * - Auto-rollback on test failure
 * - Verbose logging
 * - Custom log file path
 */
export class CLI {
  /**
   * Parse command-line arguments into CLIOptions
   *
   * @param args - Command-line arguments (typically process.argv.slice(2))
   * @returns Parsed CLI options
   */
  parseArgs(args: string[]): CLIOptions & { help?: boolean } {
    const options: CLIOptions & { help?: boolean } = {
      preview: false,
      autoRollback: false,
      verbose: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--help':
        case '-h':
          options.help = true;
          break;

        case '--batch':
        case '-b':
          const batchValue = args[++i];
          options.batch = batchValue === 'all' ? 'all' : parseInt(batchValue, 10);
          break;

        case '--preview':
        case '-p':
          options.preview = true;
          break;

        case '--auto-rollback':
        case '-r':
          options.autoRollback = true;
          break;

        case '--verbose':
        case '-v':
          options.verbose = true;
          break;

        case '--log-file':
        case '-l':
          options.logFile = args[++i];
          break;

        default:
          // Ignore unknown arguments
          break;
      }
    }

    return options;
  }

  /**
   * Validate CLI options
   *
   * @param options - CLI options to validate
   * @throws Error if validation fails
   */
  validateOptions(options: CLIOptions): void {
    // Validate batch number
    if (options.batch !== undefined && options.batch !== 'all') {
      if (typeof options.batch !== 'number' || options.batch < 1 || options.batch > 5) {
        throw new Error('Batch must be a number between 1-5 or "all"');
      }
    }

    // Validate log file path
    if (options.logFile !== undefined && options.logFile === '') {
      throw new Error('Log file path cannot be empty');
    }
  }

  /**
   * Apply default values to options
   *
   * @param options - Partial CLI options
   * @returns Complete CLI options with defaults applied
   */
  applyDefaults(options: Partial<CLIOptions>): Required<CLIOptions> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultLogFile = path.join(
      process.cwd(),
      '.kiro',
      'specs',
      'button-component-refactoring',
      'logs',
      `refactoring-${timestamp}.log`
    );

    return {
      batch: options.batch ?? 'all',
      preview: options.preview ?? false,
      autoRollback: options.autoRollback ?? true,
      verbose: options.verbose ?? false,
      logFile: options.logFile ?? defaultLogFile,
    };
  }

  /**
   * Display help message
   */
  showHelp(): void {
    console.log(`
Button Component Refactoring Tool
==================================

Automatically refactor native <button> elements to Button component.

Usage:
  bun run refactor [options]

Options:
  --batch, -b <number|all>    Execute specific batch (1-5) or all batches
                              Default: all

  --preview, -p               Preview mode (dry-run, no file writes)
                              Default: false

  --auto-rollback, -r         Automatically rollback if tests fail
                              Default: true

  --verbose, -v               Enable verbose (debug) logging
                              Default: false

  --log-file, -l <path>       Custom log file path
                              Default: .kiro/specs/button-component-refactoring/logs/refactoring-<timestamp>.log

  --help, -h                  Display this help message

Examples:
  # Execute all batches with default settings
  bun run refactor

  # Execute only Batch 1 (Mobile components)
  bun run refactor --batch 1

  # Preview changes without writing files
  bun run refactor --batch 2 --preview

  # Execute with verbose logging
  bun run refactor --verbose --log-file my-refactor.log

Batch Definitions:
  Batch 1: Mobile Components (MobileSpreadSelector, MobileReadingInterface, etc.)
  Batch 2: Admin Pages (admin/interpretations, admin/cards, admin/users)
  Batch 3: Readings Components (ReadingHistory, StreamingInterpretation, etc.)
  Batch 4: Auth & Settings (LoginForm, RegisterForm, ProfileSettings)
  Batch 5: Remaining Files (all other button-containing files)

Requirements Traceability:
  - Requirement 5.1: Batch execution strategy
  - Requirement 6.5: Logging system
  - Requirement 6.7: Tool infrastructure
    `);
  }
}
