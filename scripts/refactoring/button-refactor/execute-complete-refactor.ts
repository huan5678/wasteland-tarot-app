#!/usr/bin/env bun
/**
 * Execute Complete Button Refactoring - All 5 Batches
 *
 * Fresh execution of all batches in sequence
 */

import { BatchExecutor } from './executor';
import { CLI } from './cli';

async function main() {
  console.log('🚀 Starting Complete Button Refactoring (All 5 Batches)\n');

  const cli = new CLI();
  const options = cli.applyDefaults({
    batch: 'all',
    preview: false,
    autoRollback: true,
    verbose: process.argv.includes('--verbose'),
  });

  const executor = new BatchExecutor(options);

  const allBatches = [1, 2, 3, 4, 5];
  const batchNames = [
    'Mobile Components',
    'Admin Pages',
    'Readings Components',
    'Auth & Settings',
    'Remaining Files',
  ];

  const results: Array<{ batchId: number; success: boolean; stats: any }> = [];

  for (let i = 0; i < allBatches.length; i++) {
    const batchId = allBatches[i];
    const batchName = batchNames[i];

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔧 Executing Batch ${batchId}: ${batchName}`);
    console.log('='.repeat(70) + '\n');

    try {
      const result = await executor.executeBatch(batchId);

      console.log(`\n📊 Batch ${batchId} Results:`);
      console.log(`   Status: ${result.testsPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Files Processed: ${result.filesProcessed}`);
      console.log(`   Buttons Replaced: ${result.buttonsReplaced}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);

      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.length}`);
      }

      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`);
        result.errors.forEach((e) => console.log(`      - ${e}`));
      }

      results.push({
        batchId,
        success: result.testsPassed,
        stats: {
          files: result.filesProcessed,
          buttons: result.buttonsReplaced,
          warnings: result.warnings.length,
          errors: result.errors.length,
        },
      });

      if (!result.testsPassed) {
        console.error(`\n❌ Batch ${batchId} failed. Stopping execution.`);
        break;
      }
    } catch (error) {
      console.error(`\n❌ Batch ${batchId} threw an error:`, error);
      results.push({
        batchId,
        success: false,
        stats: { files: 0, buttons: 0, warnings: 0, errors: 1 },
      });
      break;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📈 Final Summary');
  console.log('='.repeat(70));

  const successCount = results.filter((r) => r.success).length;
  const totalFiles = results.reduce((sum, r) => sum + r.stats.files, 0);
  const totalButtons = results.reduce((sum, r) => sum + r.stats.buttons, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.stats.warnings, 0);

  console.log(`\nBatches Completed: ${successCount}/${allBatches.length}`);
  console.log(`Total Files Processed: ${totalFiles}`);
  console.log(`Total Buttons Replaced: ${totalButtons}`);
  console.log(`Total Warnings: ${totalWarnings}`);

  results.forEach((r, idx) => {
    const icon = r.success ? '✅' : '❌';
    console.log(
      `\n${icon} Batch ${r.batchId} (${batchNames[idx]}): ${r.stats.buttons} buttons in ${r.stats.files} files`
    );
  });

  console.log('\n' + '='.repeat(70));

  if (successCount === allBatches.length) {
    console.log('\n🎉 Complete refactoring finished successfully!');
    console.log('\nNext steps:');
    console.log('  1. Verify build: bun run build');
    console.log('  2. Review changes: git diff');
    console.log('  3. Commit: git add . && git commit -m "refactor: migrate all buttons to Button component"');
  } else {
    console.log('\n⚠️  Some batches failed. Please review errors above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
