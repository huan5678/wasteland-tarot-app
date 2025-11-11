/**
 * Input Validation Utilities
 * Provides validation and sanitization for user inputs
 *
 * Features:
 * - Search input validation
 * - Date range validation
 * - XSS prevention through sanitization
 * - Clear error messages
 */

/**
 * Validate search input
 * @param input User search input
 * @returns Error message or null if valid
 */
export function validateSearchInput(input: string): string | null {
  if (input.length === 0) {
    return null; // Empty is allowed
  }

  if (input.length > 50) {
    return '請輸入有效關鍵字（1-50 字元）';
  }

  // Check for disallowed characters
  const hasDisallowedChars = /[<>]/.test(input);
  if (hasDisallowedChars) {
    return '包含不允許的字元';
  }

  return null;
}

/**
 * Validate date range
 * @param start Start date
 * @param end End date
 * @returns Error message or null if valid
 */
export function validateDateRange(start: Date, end: Date): string | null {
  if (start > end) {
    return '開始日期不能晚於結束日期';
  }

  // Check if dates are too far in the future
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);

  if (start > maxFutureDate || end > maxFutureDate) {
    return '日期範圍過於遙遠';
  }

  return null;
}

/**
 * Sanitize input by removing potentially dangerous characters
 * @param input Raw user input
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Validate tag input
 * @param tag Tag name
 * @returns Error message or null if valid
 */
export function validateTag(tag: string): string | null {
  if (tag.length === 0) {
    return '標籤不能為空';
  }

  if (tag.length > 20) {
    return '標籤長度不能超過 20 字元';
  }

  const hasDisallowedChars = /[<>\/\\]/.test(tag);
  if (hasDisallowedChars) {
    return '標籤包含不允許的字元';
  }

  return null;
}

/**
 * Validate category name
 * @param category Category name
 * @returns Error message or null if valid
 */
export function validateCategory(category: string): string | null {
  if (category.length === 0) {
    return '分類不能為空';
  }

  if (category.length > 30) {
    return '分類名稱不能超過 30 字元';
  }

  const hasDisallowedChars = /[<>\/\\]/.test(category);
  if (hasDisallowedChars) {
    return '分類名稱包含不允許的字元';
  }

  return null;
}
