/**
 * Tests for CLI Interface
 *
 * Purpose: Test command-line interface for refactoring tool
 * Requirement: 6.7 (CLI interface with batch selection, preview, rollback)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CLI } from '../cli';
import type { CLIOptions } from '../types';

describe('CLI', () => {
  let cli: CLI;

  beforeEach(() => {
    cli = new CLI();
  });

  describe('CLI Initialization', () => {
    it('should create a CLI instance', () => {
      expect(cli).toBeDefined();
    });

    it('should parse batch option', () => {
      const options = cli.parseArgs(['--batch', '1']);
      expect(options.batch).toBe(1);
    });

    it('should parse "all" batch option', () => {
      const options = cli.parseArgs(['--batch', 'all']);
      expect(options.batch).toBe('all');
    });

    it('should parse preview flag', () => {
      const options = cli.parseArgs(['--preview']);
      expect(options.preview).toBe(true);
    });

    it('should parse auto-rollback flag', () => {
      const options = cli.parseArgs(['--auto-rollback']);
      expect(options.autoRollback).toBe(true);
    });

    it('should parse verbose flag', () => {
      const options = cli.parseArgs(['--verbose']);
      expect(options.verbose).toBe(true);
    });

    it('should parse log-file option', () => {
      const options = cli.parseArgs(['--log-file', '/path/to/log.txt']);
      expect(options.logFile).toBe('/path/to/log.txt');
    });

    it('should parse multiple options', () => {
      const options = cli.parseArgs([
        '--batch',
        '2',
        '--preview',
        '--verbose',
        '--log-file',
        'test.log',
      ]);

      expect(options.batch).toBe(2);
      expect(options.preview).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.logFile).toBe('test.log');
    });
  });

  describe('Help Display', () => {
    it('should display help message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      cli.showHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const helpText = consoleSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(helpText).toContain('Button Component Refactoring Tool');
      expect(helpText).toContain('--batch');
      expect(helpText).toContain('--preview');
      expect(helpText).toContain('--auto-rollback');
      expect(helpText).toContain('--verbose');
      expect(helpText).toContain('--log-file');

      consoleSpy.mockRestore();
    });

    it('should show help when --help flag is provided', () => {
      const options = cli.parseArgs(['--help']);
      expect(options.help).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate batch number is between 1-5', () => {
      expect(() => cli.validateOptions({ batch: 0 })).toThrow();
      expect(() => cli.validateOptions({ batch: 6 })).toThrow();
      expect(() => cli.validateOptions({ batch: 1 })).not.toThrow();
      expect(() => cli.validateOptions({ batch: 5 })).not.toThrow();
    });

    it('should allow "all" as batch option', () => {
      expect(() => cli.validateOptions({ batch: 'all' })).not.toThrow();
    });

    it('should allow missing batch option (defaults to all)', () => {
      expect(() => cli.validateOptions({})).not.toThrow();
    });

    it('should validate log file path is not empty', () => {
      expect(() => cli.validateOptions({ logFile: '' })).toThrow();
      expect(() => cli.validateOptions({ logFile: 'valid.log' })).not.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should use default values when options not provided', () => {
      const options = cli.parseArgs([]);

      expect(options.batch).toBeUndefined();
      expect(options.preview).toBe(false);
      expect(options.autoRollback).toBe(false);
      expect(options.verbose).toBe(false);
      expect(options.logFile).toBeUndefined();
    });

    it('should apply defaults via applyDefaults method', () => {
      const options = cli.applyDefaults({});

      expect(options.batch).toBe('all');
      expect(options.preview).toBe(false);
      expect(options.autoRollback).toBe(true);
      expect(options.verbose).toBe(false);
      expect(options.logFile).toMatch(/refactoring-.*\.log$/);
    });

    it('should not override provided options when applying defaults', () => {
      const options = cli.applyDefaults({
        batch: 2,
        preview: true,
        verbose: true,
        logFile: 'custom.log',
      });

      expect(options.batch).toBe(2);
      expect(options.preview).toBe(true);
      expect(options.verbose).toBe(true);
      expect(options.logFile).toBe('custom.log');
    });
  });
});
