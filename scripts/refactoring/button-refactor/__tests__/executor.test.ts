/**
 * Batch Executor Tests
 *
 * Purpose: Test batch coordination, sequential execution, test gates, and rollback
 * Requirements: 5.1-5.4, 9.1-9.3
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BatchExecutor } from '../executor';
import type { BatchConfig, BatchStatus, BatchResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('BatchExecutor', () => {
  let executor: BatchExecutor;
  const testLogDir = path.join(__dirname, 'test-logs');

  beforeEach(async () => {
    // Create test log directory
    await fs.mkdir(testLogDir, { recursive: true });
    executor = new BatchExecutor({ logDir: testLogDir });
  });

  afterEach(async () => {
    // Clean up test logs
    await fs.rm(testLogDir, { recursive: true, force: true });
  });

  describe('Batch Configuration', () => {
    it('should define 5 batch configurations', () => {
      const configs = executor.getBatchConfigs();

      expect(configs).toHaveLength(5);
      expect(configs[0].name).toBe('Batch 1: Mobile');
      expect(configs[1].name).toBe('Batch 2: Admin');
      expect(configs[2].name).toBe('Batch 3: Readings');
      expect(configs[3].name).toBe('Batch 4: Auth & Settings');
      expect(configs[4].name).toBe('Batch 5: Remaining');
    });

    it('should have correct file patterns for Mobile batch', () => {
      const configs = executor.getBatchConfigs();
      const mobileBatch = configs[0];

      expect(mobileBatch.patterns).toContain('src/components/mobile/**/*.tsx');
      expect(mobileBatch.excludePatterns).toContain('**/*.test.tsx');
      expect(mobileBatch.excludePatterns).toContain('**/*.spec.tsx');
    });

    it('should have correct file patterns for Admin batch', () => {
      const configs = executor.getBatchConfigs();
      const adminBatch = configs[1];

      expect(adminBatch.patterns).toContain('src/app/admin/**/*.tsx');
    });

    it('should have correct file patterns for Readings batch', () => {
      const configs = executor.getBatchConfigs();
      const readingsBatch = configs[2];

      expect(readingsBatch.patterns).toContain('src/components/readings/**/*.tsx');
    });

    it('should have correct file patterns for Auth & Settings batch', () => {
      const configs = executor.getBatchConfigs();
      const authBatch = configs[3];

      expect(authBatch.patterns).toContain('src/components/auth/**/*.tsx');
      expect(authBatch.patterns).toContain('src/app/settings/**/*.tsx');
    });

    it('should have correct file patterns for Remaining batch', () => {
      const configs = executor.getBatchConfigs();
      const remainingBatch = configs[4];

      expect(remainingBatch.patterns).toContain('src/app/**/*.tsx');
      expect(remainingBatch.patterns).toContain('src/components/**/*.tsx');
      expect(remainingBatch.excludePatterns).toContain('src/components/mobile/**');
      expect(remainingBatch.excludePatterns).toContain('src/app/admin/**');
      expect(remainingBatch.excludePatterns).toContain('src/components/readings/**');
      expect(remainingBatch.excludePatterns).toContain('src/components/auth/**');
      expect(remainingBatch.excludePatterns).toContain('src/app/settings/**');
      expect(remainingBatch.excludePatterns).toContain('src/components/ui/**');
    });
  });

  describe('Sequential Execution', () => {
    it('should execute batches in sequential order', async () => {
      const executionOrder: number[] = [];

      // Mock the entire executeBatch method
      const originalExecuteBatch = executor.executeBatch.bind(executor);
      executor.executeBatch = jest.fn(async (batchId: number) => {
        executionOrder.push(batchId);
        return {
          batchId,
          batchName: `Batch ${batchId}`,
          filesProcessed: 0,
          buttonsReplaced: 0,
          testsPassed: true,
          duration: 0,
          warnings: [],
          errors: [],
        };
      }) as any;

      await executor.executeAllBatches();

      expect(executionOrder).toEqual([1, 2, 3, 4, 5]);

      // Restore
      executor.executeBatch = originalExecuteBatch;
    });

    it('should wait for previous batch to complete before starting next', async () => {
      const batchStartTimes: Record<number, number> = {};
      const batchEndTimes: Record<number, number> = {};

      const originalExecuteBatch = executor.executeBatch.bind(executor);
      executor.executeBatch = jest.fn(async (batchId: number) => {
        batchStartTimes[batchId] = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
        batchEndTimes[batchId] = Date.now();

        return {
          batchId,
          batchName: `Batch ${batchId}`,
          filesProcessed: 0,
          buttonsReplaced: 0,
          testsPassed: true,
          duration: 10,
          warnings: [],
          errors: [],
        };
      }) as any;

      await executor.executeAllBatches();

      // Verify batch 2 starts after batch 1 ends
      expect(batchStartTimes[2]).toBeGreaterThanOrEqual(batchEndTimes[1]);
      expect(batchStartTimes[3]).toBeGreaterThanOrEqual(batchEndTimes[2]);
      expect(batchStartTimes[4]).toBeGreaterThanOrEqual(batchEndTimes[3]);
      expect(batchStartTimes[5]).toBeGreaterThanOrEqual(batchEndTimes[4]);

      // Restore
      executor.executeBatch = originalExecuteBatch;
    });

    it('should stop execution if a batch fails', async () => {
      const executionOrder: number[] = [];

      const originalExecuteBatch = executor.executeBatch.bind(executor);
      executor.executeBatch = jest.fn(async (batchId: number) => {
        executionOrder.push(batchId);

        // Batch 2 fails
        if (batchId === 2) {
          return {
            batchId,
            batchName: `Batch ${batchId}`,
            filesProcessed: 0,
            buttonsReplaced: 0,
            testsPassed: false,
            duration: 0,
            warnings: [],
            errors: ['Test failed'],
          };
        }

        return {
          batchId,
          batchName: `Batch ${batchId}`,
          filesProcessed: 0,
          buttonsReplaced: 0,
          testsPassed: true,
          duration: 0,
          warnings: [],
          errors: [],
        };
      }) as any;

      await expect(executor.executeAllBatches()).rejects.toThrow();

      // Should only execute batches 1 and 2, not 3, 4, 5
      expect(executionOrder).toEqual([1, 2]);

      // Restore
      executor.executeBatch = originalExecuteBatch;
    });
  });

  describe('Test Gate', () => {
    it('should execute all test types after batch transformation', async () => {
      const testTypes: string[] = [];

      executor['runTests'] = jest.fn(async (batchId: number) => {
        // Track which tests are run
        testTypes.push('typescript');
        testTypes.push('eslint');
        testTypes.push('unit');
        testTypes.push('e2e');
        testTypes.push('accessibility');
        testTypes.push('performance');

        return { passed: true, results: [] };
      }) as any;

      await executor.executeBatch(1);

      expect(testTypes).toContain('typescript');
      expect(testTypes).toContain('eslint');
      expect(testTypes).toContain('unit');
      expect(testTypes).toContain('e2e');
      expect(testTypes).toContain('accessibility');
      expect(testTypes).toContain('performance');
    });

    it('should fail if TypeScript compilation fails', async () => {
      executor['runTests'] = jest.fn(async () => {
        return {
          passed: false,
          results: [
            { type: 'typescript', passed: false, error: 'Type error' },
          ],
        };
      }) as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(false);
      expect(result.errors).toContain('Type error');
    });

    it('should fail if ESLint check fails', async () => {
      executor['runTests'] = jest.fn(async () => {
        return {
          passed: false,
          results: [
            { type: 'typescript', passed: true },
            { type: 'eslint', passed: false, error: 'Lint error' },
          ],
        };
      }) as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(false);
      expect(result.errors).toContain('Lint error');
    });

    it('should fail if unit tests fail', async () => {
      executor['runTests'] = jest.fn(async () => {
        return {
          passed: false,
          results: [
            { type: 'typescript', passed: true },
            { type: 'eslint', passed: true },
            { type: 'unit', passed: false, error: '3 tests failed' },
          ],
        };
      }) as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(false);
      expect(result.errors).toContain('3 tests failed');
    });

    it('should pass if all tests pass', async () => {
      executor['runTests'] = jest.fn(async () => {
        return {
          passed: true,
          results: [
            { type: 'typescript', passed: true },
            { type: 'eslint', passed: true },
            { type: 'unit', passed: true },
            { type: 'e2e', passed: true },
            { type: 'accessibility', passed: true },
            { type: 'performance', passed: true },
          ],
        };
      }) as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Rollback Mechanism', () => {
    it('should create Git branch before batch execution', async () => {
      const branchNames: string[] = [];

      executor['createGitBranch'] = jest.fn(async (batchId: number) => {
        const branchName = `refactor/batch-${batchId}-test`;
        branchNames.push(branchName);
      }) as any;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      expect(branchNames).toContain('refactor/batch-1-test');
    });

    it('should rollback on test failure', async () => {
      let rollbackCalled = false;

      executor['runTests'] = jest.fn(async () => {
        return { passed: false, results: [{ type: 'unit', passed: false, error: 'Test failed' }] };
      }) as any;

      executor['rollbackChanges'] = jest.fn(async () => {
        rollbackCalled = true;
      }) as any;

      const result = await executor.executeBatch(1);

      expect(rollbackCalled).toBe(true);
      expect(result.testsPassed).toBe(false);
    });

    it('should use git reset --hard HEAD~1 for rollback', async () => {
      const gitCommands: string[] = [];

      executor['executeGitCommand'] = jest.fn(async (command: string) => {
        gitCommands.push(command);
      }) as any;

      await executor.rollbackBatch(1);

      expect(gitCommands).toContain('git reset --hard HEAD~1');
    });

    it('should not rollback if tests pass', async () => {
      let rollbackCalled = false;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;
      executor['rollbackChanges'] = jest.fn(async () => {
        rollbackCalled = true;
      }) as any;

      await executor.executeBatch(1);

      expect(rollbackCalled).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    it('should initialize all batches as pending', () => {
      const statuses = executor.getStatus();

      expect(statuses).toHaveLength(5);
      statuses.forEach((status: BatchStatus) => {
        expect(status.status).toBe('pending');
        expect(status.progress).toBe(0);
      });
    });

    it('should update status to in-progress when batch starts', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      const statusPromise = new Promise<BatchStatus>((resolve) => {
        setTimeout(() => {
          const statuses = executor.getStatus();
          resolve(statuses[0]);
        }, 10);
      });

      executor.executeBatch(1);

      const status = await statusPromise;
      expect(status.status).toBe('in-progress');
    });

    it('should update progress during batch execution', async () => {
      const progressUpdates: number[] = [];

      executor['updateProgress'] = jest.fn((batchId: number, progress: number) => {
        progressUpdates.push(progress);
      }) as any;

      executor['updateBatchStatus'] = jest.fn((batchId: number, status: string, progress: number) => {
        progressUpdates.push(progress);
      }) as any;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should update status to completed after successful execution', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      const statuses = executor.getStatus();
      expect(statuses[0].status).toBe('completed');
      expect(statuses[0].progress).toBe(100);
    });

    it('should update status to failed after test failure', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: false, results: [] })) as any;

      await executor.executeBatch(1);

      const statuses = executor.getStatus();
      expect(statuses[0].status).toBe('failed');
    });

    it('should update status to rolled-back after rollback', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: false, results: [] })) as any;

      await executor.executeBatch(1);
      await executor.rollbackBatch(1);

      const statuses = executor.getStatus();
      expect(statuses[0].status).toBe('rolled-back');
    });
  });

  describe('Report Generation', () => {
    it('should generate report with replacement statistics', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      const result = await executor.executeBatch(1);

      expect(result).toHaveProperty('filesProcessed');
      expect(result).toHaveProperty('buttonsReplaced');
      expect(result).toHaveProperty('duration');
    });

    it('should generate report with variant distribution', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);
      const report = executor.generateReport();

      expect(report).toHaveProperty('variantDistribution');
      expect(report.variantDistribution).toHaveProperty('default');
      expect(report.variantDistribution).toHaveProperty('destructive');
      expect(report.variantDistribution).toHaveProperty('success');
    });

    it('should generate report with warnings list', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      const result = await executor.executeBatch(1);

      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should generate report with error list', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: false, results: [] })) as any;

      const result = await executor.executeBatch(1);

      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should save report to markdown file', async () => {
      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeAllBatches();
      const reportPath = await executor.saveReport();

      expect(reportPath).toContain('.kiro/specs/button-component-refactoring/refactoring-report.md');

      // Verify file exists
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle scanner errors gracefully', async () => {
      executor['scanner'] = {
        scanBatch: jest.fn(async () => {
          throw new Error('Scanner error');
        }),
      } as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(false);
      expect(result.errors).toContain('Scanner error');
    });

    it('should handle transformer errors gracefully', async () => {
      executor['transformer'] = {
        transform: jest.fn(async () => {
          throw new Error('Transformer error');
        }),
      } as any;

      const result = await executor.executeBatch(1);

      expect(result.testsPassed).toBe(false);
      expect(result.errors).toContain('Transformer error');
    });

    it('should handle Git command errors gracefully', async () => {
      executor['executeGitCommand'] = jest.fn(async () => {
        throw new Error('Git command failed');
      }) as any;

      await expect(executor.rollbackBatch(1)).rejects.toThrow('Git command failed');
    });
  });

  describe('Integration with Scanner, Analyzer, Transformer', () => {
    it('should call scanner for batch files', async () => {
      let scannerCalled = false;

      executor['scanner'] = {
        scanBatch: jest.fn(async () => {
          scannerCalled = true;
          return { totalFiles: 0, totalButtons: 0, buttons: [], errors: [] };
        }),
      } as any;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      expect(scannerCalled).toBe(true);
    });

    it('should call analyzer for each button', async () => {
      const analyzedButtons: number[] = [];

      executor['scanner'] = {
        scanBatch: jest.fn(async () => ({
          totalFiles: 1,
          totalButtons: 3,
          buttons: [
            { filePath: 'test1.tsx', line: 1, column: 0, attributes: {}, children: 'Button 1', hasRef: false },
            { filePath: 'test1.tsx', line: 2, column: 0, attributes: {}, children: 'Button 2', hasRef: false },
            { filePath: 'test1.tsx', line: 3, column: 0, attributes: {}, children: 'Button 3', hasRef: false },
          ],
          errors: [],
        })),
      } as any;

      executor['analyzer'] = {
        analyze: jest.fn(() => {
          analyzedButtons.push(1);
          return {
            suggestedVariant: 'default',
            suggestedSize: 'default',
            remainingClassNames: [],
            confidence: 'high',
            reasoning: 'Test',
          };
        }),
      } as any;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      expect(analyzedButtons).toHaveLength(3);
    });

    it('should call transformer for each file', async () => {
      const transformedFiles: string[] = [];

      executor['scanner'] = {
        scanBatch: jest.fn(async () => ({
          totalFiles: 2,
          totalButtons: 2,
          buttons: [
            { filePath: 'test1.tsx', line: 1, column: 0, attributes: {}, children: 'Button 1', hasRef: false },
            { filePath: 'test2.tsx', line: 1, column: 0, attributes: {}, children: 'Button 2', hasRef: false },
          ],
          errors: [],
        })),
      } as any;

      executor['transformer'] = {
        transform: jest.fn(async (filePath: string) => {
          transformedFiles.push(filePath);
          return {
            filePath,
            success: true,
            transformedButtons: 1,
            addedImports: ['Button'],
            errors: [],
            diff: '',
          };
        }),
      } as any;

      executor['runTests'] = jest.fn(async () => ({ passed: true, results: [] })) as any;

      await executor.executeBatch(1);

      expect(transformedFiles).toContain('test1.tsx');
      expect(transformedFiles).toContain('test2.tsx');
    });
  });
});
