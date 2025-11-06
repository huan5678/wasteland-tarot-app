/**
 * Type definitions for Button Refactoring Tool
 *
 * Purpose: Define all interfaces and types used by the refactoring tool
 * Requirements: 5.1 (Batch execution), 6.5 (Logging), 6.7 (Tool infrastructure)
 */

/**
 * Batch configuration for processing groups of files
 */
export interface BatchConfig {
  /** Batch name for display purposes */
  name: string;
  /** Glob patterns for matching files to process */
  patterns: string[];
  /** Glob patterns to exclude from processing */
  excludePatterns?: string[];
  /** Maximum concurrent file processing (default: 10) */
  maxConcurrency?: number;
}

/**
 * Information about a single button element found in code
 */
export interface ButtonInfo {
  /** Absolute file path */
  filePath: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (0-indexed) */
  column: number;
  /** Button HTML attributes */
  attributes: Record<string, any>;
  /** className string */
  className?: string;
  /** Button text content */
  children: string;
  /** Whether button uses ref */
  hasRef: boolean;
  /** onClick handler name (e.g., "handleClick") */
  onClick?: string;
}

/**
 * Error encountered during scanning
 */
export interface ScanError {
  /** File path where error occurred */
  filePath: string;
  /** Line number (if applicable) */
  line: number;
  /** Error message */
  message: string;
  /** Error severity level */
  severity: 'error' | 'warning';
}

/**
 * Result of scanning a batch of files
 */
export interface ScanResult {
  /** Total number of files scanned */
  totalFiles: number;
  /** Total number of buttons found */
  totalButtons: number;
  /** List of all button information */
  buttons: ButtonInfo[];
  /** List of errors encountered */
  errors: ScanError[];
}

/**
 * Button variant types from shadcn/ui button component
 */
export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'destructive'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'
  | 'info';

/**
 * Button size types from shadcn/ui button component
 */
export type ButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl' | 'icon';

/**
 * Confidence level for variant mapping
 */
export type MappingConfidence = 'high' | 'medium' | 'low';

/**
 * Result of style analysis for a button
 */
export interface StyleAnalysis {
  /** Suggested variant based on className analysis */
  suggestedVariant: ButtonVariant;
  /** Suggested size based on className analysis */
  suggestedSize: ButtonSize;
  /** Remaining classNames that should not be mapped to variant (layout styles) */
  remainingClassNames: string[];
  /** Confidence level of the mapping */
  confidence: MappingConfidence;
  /** Reasoning for the suggestion (for debugging/logging) */
  reasoning: string;
}

/**
 * Mapping rule for className to variant
 */
export interface MappingRule {
  /** Rule priority (higher number = higher priority) */
  priority: number;
  /** Matcher function to check if rule applies */
  matcher: (className: string, onClick?: string) => boolean;
  /** Target variant if rule matches */
  variant: ButtonVariant;
}

/**
 * Result of variant mapping
 */
export interface MappingResult {
  /** Final variant to use */
  variant: ButtonVariant;
  /** Final size to use */
  size: ButtonSize;
  /** Custom classNames to preserve (non-variant related) */
  customClassNames: string[];
  /** Warnings for manual review */
  warnings: string[];
}

/**
 * Accessibility attributes to add/enhance
 */
export interface AccessibilityAttributes {
  /** Generated or enhanced aria-label */
  ariaLabel?: string;
  /** aria-disabled based on disabled prop */
  ariaDisabled?: boolean;
  /** ARIA role (rarely needed) */
  role?: string;
  /** Reasoning for attribute generation */
  reasoning: string;
}

/**
 * Error during transformation
 */
export interface TransformError {
  /** Line number where error occurred */
  line: number;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'error' | 'warning';
}

/**
 * Result of transforming a single file
 */
export interface TransformResult {
  /** File path that was transformed */
  filePath: string;
  /** Whether transformation was successful */
  success: boolean;
  /** Number of buttons transformed */
  transformedButtons: number;
  /** Import statements added */
  addedImports: string[];
  /** Errors encountered during transformation */
  errors: TransformError[];
  /** Code diff for manual review */
  diff: string;
}

/**
 * Batch execution status
 */
export type BatchExecutionStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'rolled-back';

/**
 * Status of a batch
 */
export interface BatchStatus {
  /** Batch ID (1-5) */
  batchId: number;
  /** Batch name */
  batchName: string;
  /** Current status */
  status: BatchExecutionStatus;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Result of executing a batch
 */
export interface BatchResult {
  /** Batch ID */
  batchId: number;
  /** Batch name */
  batchName: string;
  /** Number of files processed */
  filesProcessed: number;
  /** Number of buttons replaced */
  buttonsReplaced: number;
  /** Whether tests passed */
  testsPassed: boolean;
  /** Execution duration in milliseconds */
  duration: number;
  /** Warnings for manual review */
  warnings: string[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Log levels for logging system
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  /** Timestamp */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * CLI options for the refactoring tool
 */
export interface CLIOptions {
  /** Batch ID to execute (1-5) or 'all' */
  batch?: number | 'all';
  /** Preview mode (dry-run, no file writes) */
  preview?: boolean;
  /** Enable rollback if tests fail */
  autoRollback?: boolean;
  /** Verbose logging */
  verbose?: boolean;
  /** Output log file path */
  logFile?: string;
}
