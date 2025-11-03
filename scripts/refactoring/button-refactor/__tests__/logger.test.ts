/**
 * Tests for Logger System
 *
 * Purpose: Test logging functionality for refactoring tool
 * Requirement: 6.5 (Logging system)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { Logger } from '../logger';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Logger', () => {
  const testLogDir = path.join(__dirname, '__test-logs__');
  let logger: Logger;

  beforeEach(() => {
    // Create test log directory
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Logger Initialization', () => {
    it('should create a logger instance with default log file', () => {
      const logFile = path.join(testLogDir, 'test.log');
      logger = new Logger(logFile);

      expect(logger).toBeDefined();
      expect(logger.getLogFile()).toBe(logFile);
    });

    it('should create log directory if it does not exist', () => {
      const logFile = path.join(testLogDir, 'nested', 'test.log');
      logger = new Logger(logFile);

      expect(fs.existsSync(path.dirname(logFile))).toBe(true);
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      const logFile = path.join(testLogDir, 'test.log');
      logger = new Logger(logFile);
    });

    it('should log INFO level messages', () => {
      logger.info('Test info message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });

    it('should log WARN level messages', () => {
      logger.warn('Test warning message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Test warning message');
    });

    it('should log ERROR level messages', () => {
      logger.error('Test error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Test error message');
    });

    it('should log DEBUG level messages when verbose mode is enabled', () => {
      const verboseLogger = new Logger(path.join(testLogDir, 'verbose.log'), true);
      verboseLogger.debug('Test debug message');

      const logs = verboseLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Test debug message');
    });

    it('should NOT log DEBUG messages when verbose mode is disabled', () => {
      logger.debug('Test debug message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should log messages with context data', () => {
      logger.info('Test with context', { batchId: 1, fileCount: 10 });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toEqual({ batchId: 1, fileCount: 10 });
    });
  });

  describe('File Writing', () => {
    beforeEach(() => {
      const logFile = path.join(testLogDir, 'test.log');
      logger = new Logger(logFile);
    });

    it('should write logs to file', () => {
      logger.info('Log message 1');
      logger.warn('Log message 2');
      logger.error('Log message 3');

      logger.flush();

      const logFile = logger.getLogFile();
      expect(fs.existsSync(logFile)).toBe(true);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain('INFO');
      expect(content).toContain('WARN');
      expect(content).toContain('ERROR');
      expect(content).toContain('Log message 1');
      expect(content).toContain('Log message 2');
      expect(content).toContain('Log message 3');
    });

    it('should format log entries with timestamps', () => {
      logger.info('Test message');
      logger.flush();

      const content = fs.readFileSync(logger.getLogFile(), 'utf-8');
      // Check for ISO timestamp format
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should append to existing log file', () => {
      logger.info('First message');
      logger.flush();

      logger.info('Second message');
      logger.flush();

      const content = fs.readFileSync(logger.getLogFile(), 'utf-8');
      expect(content).toContain('First message');
      expect(content).toContain('Second message');
    });
  });

  describe('Log Retrieval', () => {
    beforeEach(() => {
      const logFile = path.join(testLogDir, 'test.log');
      logger = new Logger(logFile);
    });

    it('should return all logs in chronological order', () => {
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 1');
      expect(logs[1].message).toBe('Message 2');
      expect(logs[2].message).toBe('Message 3');
    });

    it('should filter logs by level', () => {
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const errorLogs = logger.getLogsByLevel('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');

      const warnLogs = logger.getLogsByLevel('warn');
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].level).toBe('warn');
    });

    it('should clear logs', () => {
      logger.info('Message 1');
      logger.warn('Message 2');

      expect(logger.getLogs()).toHaveLength(2);

      logger.clear();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle write errors gracefully', () => {
      const invalidPath = '/invalid/path/that/does/not/exist/test.log';
      const invalidLogger = new Logger(invalidPath);

      // Should not throw
      expect(() => {
        invalidLogger.info('Test message');
        invalidLogger.flush();
      }).not.toThrow();
    });
  });
});
