#!/usr/bin/env bun
/**
 * Execute Batch 1 - Mobile Components
 *
 * Task: 2 - Refactor Mobile Components batch
 */

import { BatchExecutor } from './executor';
import { CLI } from './cli';

async function main() {
  console.log('🚀 Starting Batch 1 - Mobile Components Refactoring\n');

  const cli = new CLI();
  const options = cli.applyDefaults({
    batch: 1,
    preview: process.argv.includes('--preview'),
    autoRollback: true,
    verbose: process.argv.includes('--verbose'),
  });

  const executor = new BatchExecutor(options);

  if (options.preview) {
    console.log('📋 Preview Mode - No files will be modified\n');
  }

  const result = await executor.executeBatch(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Batch 1 Results:');
  console.log('='.repeat(60));
  console.log(`Status: ${result.testsPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Files Processed: ${result.filesProcessed}`);
  console.log(`Buttons Replaced: ${result.buttonsReplaced}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
    result.warnings.slice(0, 5).forEach((w) => console.log(`   ${w}`));
    if (result.warnings.length > 5) {
      console.log(`   ... and ${result.warnings.length - 5} more`);
    }
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`   ${e}`));
  }

  console.log('='.repeat(60) + '\n');

  if (!result.testsPassed) {
    console.error('❌ Batch 1 failed. Changes have been rolled back.');
    process.exit(1);
  }

  console.log('✅ Batch 1 completed successfully!');
  console.log('📝 Review the changes and run tests manually if needed.');
  console.log('\nNext steps:');
  console.log('  1. Commit changes: git add . && git commit -m "refactor(mobile): replace native buttons with Button component"');
  console.log('  2. Merge to main: git checkout main && git merge refactor/batch-1-mobile');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
