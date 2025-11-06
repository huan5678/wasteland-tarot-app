/**
 * Batch Executor Unit Tests (Simplified)
 *
 * Purpose: Test batch executor logic with minimal mocking
 * Requirements: 5.1-5.4, 9.1-9.3
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BatchExecutor } from '../executor';

describe('BatchExecutor - Unit Tests', () => {
  let executor: BatchExecutor;

  beforeEach(() => {
    executor = new BatchExecutor({ logDir: '/tmp/test-logs', rootDir: '/tmp/test-root' });
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

  describe('Status Tracking', () => {
    it('should initialize all batches as pending', () => {
      const statuses = executor.getStatus();

      expect(statuses).toHaveLength(5);
      statuses.forEach((status) => {
        expect(status.status).toBe('pending');
        expect(status.progress).toBe(0);
      });
    });

    it('should have correct batch names', () => {
      const statuses = executor.getStatus();

      expect(statuses[0].batchName).toBe('Batch 1: Mobile');
      expect(statuses[1].batchName).toBe('Batch 2: Admin');
      expect(statuses[2].batchName).toBe('Batch 3: Readings');
      expect(statuses[3].batchName).toBe('Batch 4: Auth & Settings');
      expect(statuses[4].batchName).toBe('Batch 5: Remaining');
    });

    it('should have correct batch IDs', () => {
      const statuses = executor.getStatus();

      expect(statuses[0].batchId).toBe(1);
      expect(statuses[1].batchId).toBe(2);
      expect(statuses[2].batchId).toBe(3);
      expect(statuses[3].batchId).toBe(4);
      expect(statuses[4].batchId).toBe(5);
    });
  });

  describe('Report Generation', () => {
    it('should generate empty report initially', () => {
      const report = executor.generateReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('batches');
      expect(report).toHaveProperty('variantDistribution');
      expect(report).toHaveProperty('sizeDistribution');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('manualReviewRequired');
    });

    it('should have variant distribution for all variants', () => {
      const report = executor.generateReport();

      expect(report.variantDistribution).toHaveProperty('default');
      expect(report.variantDistribution).toHaveProperty('outline');
      expect(report.variantDistribution).toHaveProperty('destructive');
      expect(report.variantDistribution).toHaveProperty('secondary');
      expect(report.variantDistribution).toHaveProperty('ghost');
      expect(report.variantDistribution).toHaveProperty('link');
      expect(report.variantDistribution).toHaveProperty('success');
      expect(report.variantDistribution).toHaveProperty('warning');
      expect(report.variantDistribution).toHaveProperty('info');
    });

    it('should have size distribution for all sizes', () => {
      const report = executor.generateReport();

      expect(report.sizeDistribution).toHaveProperty('xs');
      expect(report.sizeDistribution).toHaveProperty('sm');
      expect(report.sizeDistribution).toHaveProperty('default');
      expect(report.sizeDistribution).toHaveProperty('lg');
      expect(report.sizeDistribution).toHaveProperty('xl');
      expect(report.sizeDistribution).toHaveProperty('icon');
    });

    it('should initialize with zero counts', () => {
      const report = executor.generateReport();

      expect(report.summary.totalFiles).toBe(0);
      expect(report.summary.totalButtons).toBe(0);
      expect(report.summary.successRate).toBe(0);
      expect(report.batches).toHaveLength(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should have maxConcurrency set for all batches', () => {
      const configs = executor.getBatchConfigs();

      configs.forEach((config) => {
        expect(config.maxConcurrency).toBe(10);
      });
    });

    it('should exclude test files in all batches', () => {
      const configs = executor.getBatchConfigs();

      configs.forEach((config) => {
        expect(config.excludePatterns).toContain('**/*.test.tsx');
        expect(config.excludePatterns).toContain('**/*.spec.tsx');
      });
    });

    it('should exclude __tests__ directories in all batches', () => {
      const configs = executor.getBatchConfigs();

      configs.forEach((config) => {
        expect(config.excludePatterns).toContain('**/__tests__/**');
      });
    });

    it('should exclude UI components in Remaining batch only', () => {
      const configs = executor.getBatchConfigs();
      const remainingBatch = configs[4];

      expect(remainingBatch.excludePatterns).toContain('src/components/ui/**');

      // Other batches should not have this exclusion
      configs.slice(0, 4).forEach((config) => {
        expect(config.excludePatterns).not.toContain('src/components/ui/**');
      });
    });
  });

  describe('Batch Names', () => {
    it('should generate correct branch names', () => {
      const configs = executor.getBatchConfigs();

      // Test private method through reflection (for testing purposes)
      const getBranchName = (executor as any).getBranchName.bind(executor);

      expect(getBranchName(1)).toContain('batch-1');
      expect(getBranchName(2)).toContain('batch-2');
      expect(getBranchName(3)).toContain('batch-3');
      expect(getBranchName(4)).toContain('batch-4');
      expect(getBranchName(5)).toContain('batch-5');
    });

    it('should sanitize batch names in branch names', () => {
      const getBranchName = (executor as any).getBranchName.bind(executor);

      // Batch names contain spaces and special characters
      const branchName = getBranchName(1);

      // Should only contain lowercase letters, numbers, hyphens, and slashes
      expect(branchName).toMatch(/^[a-z0-9-\/]+$/);
      expect(branchName).not.toContain(' ');
      expect(branchName).not.toContain(':');
      expect(branchName).toContain('refactor/');
    });
  });
});
