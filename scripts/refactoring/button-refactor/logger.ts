/**
 * Logger System for Button Refactoring Tool
 *
 * Purpose: Centralized logging with file output and in-memory storage
 * Requirements: 6.5 (Logging system), 6.7 (Tool infrastructure)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { LogEntry, LogLevel } from './types';

/**
 * Logger class for refactoring tool
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - File output
 * - In-memory log storage
 * - Verbose mode control
 * - Log filtering and retrieval
 */
export class Logger {
  private logs: LogEntry[] = [];
  private logFile: string;
  private verbose: boolean;

  /**
   * Create a new Logger instance
   *
   * @param logFile - Path to log file
   * @param verbose - Enable verbose (debug) logging
   */
  constructor(logFile: string, verbose: boolean = false) {
    this.logFile = logFile;
    this.verbose = verbose;

    // Ensure log directory exists (best effort)
    try {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      // Handle directory creation errors gracefully
      console.warn(`Warning: Could not create log directory for ${logFile}:`, error);
    }
  }

  /**
   * Get the current log file path
   */
  getLogFile(): string {
    return this.logFile;
  }

  /**
   * Log a debug message (only if verbose mode enabled)
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.verbose) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log an info message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Internal log method
   *
   * @param level - Log level
   * @param message - Log message
   * @param context - Optional context data
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    this.logs.push(entry);
  }

  /**
   * Get all logs in chronological order
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   *
   * @param level - Log level to filter by
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((entry) => entry.level === level);
  }

  /**
   * Clear all in-memory logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Flush logs to file
   *
   * Writes all in-memory logs to the log file in append mode.
   * Handles write errors gracefully (logs error to console but does not throw).
   */
  flush(): void {
    try {
      const logLines = this.logs.map((entry) => this.formatLogEntry(entry));
      const content = logLines.join('\n') + '\n';

      fs.appendFileSync(this.logFile, content, 'utf-8');
    } catch (error) {
      // Handle write errors gracefully - log to console but don't throw
      console.error(`Failed to write logs to ${this.logFile}:`, error);
    }
  }

  /**
   * Format a log entry as a string
   *
   * @param entry - Log entry to format
   * @returns Formatted log string
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;

    let formatted = `[${timestamp}] ${level} ${message}`;

    if (entry.context) {
      formatted += ` | ${JSON.stringify(entry.context)}`;
    }

    return formatted;
  }
}
