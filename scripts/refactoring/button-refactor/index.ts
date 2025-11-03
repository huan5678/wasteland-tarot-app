#!/usr/bin/env bun
/**
 * Entry Point for Button Refactoring Tool
 *
 * Purpose: Main executable for running the refactoring tool
 * Requirements: 5.1 (Batch execution), 6.5 (Logging), 6.7 (Tool infrastructure)
 */

import { CLI } from './cli';
import { Logger } from './logger';

/**
 * Main function - entry point for CLI
 */
async function main(): Promise<void> {
  const cli = new CLI();

  // Parse arguments
  const args = process.argv.slice(2);
  const parsedOptions = cli.parseArgs(args);

  // Show help and exit
  if (parsedOptions.help) {
    cli.showHelp();
    process.exit(0);
  }

  try {
    // Validate options
    cli.validateOptions(parsedOptions);

    // Apply defaults
    const options = cli.applyDefaults(parsedOptions);

    // Initialize logger
    const logger = new Logger(options.logFile, options.verbose);

    logger.info('Button Component Refactoring Tool Started', {
      batch: options.batch,
      preview: options.preview,
      autoRollback: options.autoRollback,
      verbose: options.verbose,
    });

    // Log configuration
    logger.debug('Configuration', options);

    // TODO: Implement batch execution
    // This will be implemented in subsequent tasks
    logger.warn('Batch execution not yet implemented - this is Task 1 scaffolding only');

    logger.info('Tool initialization completed successfully');
    logger.flush();

    console.log('✓ Refactoring tool initialized successfully');
    console.log(`  Log file: ${options.logFile}`);

    if (options.preview) {
      console.log('  Mode: PREVIEW (dry-run)');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
