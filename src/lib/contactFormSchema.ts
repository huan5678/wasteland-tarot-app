import { z } from 'zod';

/**
 * Contact Form Category Options
 * 聯絡表單問題類別選項
 */
export const CONTACT_CATEGORIES = [
  '技術問題',
  '帳號問題',
  '建議回饋',
  '其他',
] as const;

export type ContactCategory = typeof CONTACT_CATEGORIES[number];

/**
 * Contact Form Validation Schema
 * 聯絡表單驗證 Schema
 *
 * @description
 * Validates contact form data with the following rules:
 * - Name: 2-50 characters, Chinese/English/spaces only
 * - Email: RFC 5322 format, max 100 characters
 * - Category: One of predefined categories (技術問題, 帳號問題, 建議回饋, 其他)
 * - Message: 20-1000 characters, must contain at least one non-whitespace character
 *
 * @example
 * ```typescript
 * import { contactFormSchema } from '@/lib/contactFormSchema';
 *
 * const result = contactFormSchema.safeParse({
 *   name: '艾莉亞',
 *   email: 'aliya@wasteland-tarot.vault',
 *   category: '技術問題',
 *   message: '我想詢問關於 Karma 系統的問題...'
 * });
 *
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.log('Validation errors:', result.error.errors);
 * }
 * ```
 */
export const contactFormSchema = z.object({
  /**
   * Name field validation
   * 姓名欄位驗證
   *
   * Rules:
   * - Required
   * - 2-50 characters
   * - Chinese, English letters, and spaces only
   */
  name: z
    .string({ required_error: '請輸入您的姓名' })
    .min(1, '請輸入您的姓名')
    .min(2, '姓名必須為 2-50 個字元')
    .max(50, '姓名必須為 2-50 個字元')
    .regex(
      /^[\u4e00-\u9fa5a-zA-Z\s·\-]+$/,
      '姓名僅能包含中文、英文字母、空格、間隔號與連字號'
    ),

  /**
   * Email field validation
   * 電子郵件欄位驗證
   *
   * Rules:
   * - Required
   * - Valid RFC 5322 email format
   * - Max 100 characters
   */
  email: z
    .string({ required_error: '請輸入您的電子郵件' })
    .min(1, '請輸入您的電子郵件')
    .email('請輸入有效的電子郵件地址')
    .max(100, '電子郵件地址不得超過 100 個字元'),

  /**
   * Category field validation
   * 問題類別欄位驗證
   *
   * Rules:
   * - Required
   * - Must be one of: 技術問題, 帳號問題, 建議回饋, 其他
   */
  category: z
    .string({ required_error: '請選擇問題類別' })
    .min(1, '請選擇問題類別')
    .refine(
      (val): val is ContactCategory => CONTACT_CATEGORIES.includes(val as ContactCategory),
      { message: '請選擇有效的問題類別' }
    ),

  /**
   * Message field validation
   * 訊息內容欄位驗證
   *
   * Rules:
   * - Required
   * - 20-1000 characters
   * - Must contain at least one non-whitespace character
   */
  message: z
    .string({ required_error: '請輸入您的訊息' })
    .min(1, '請輸入您的訊息')
    .min(20, '訊息內容必須為 20-1000 個字元')
    .max(1000, '訊息內容必須為 20-1000 個字元')
    .refine(
      (val) => val.trim().length > 0,
      { message: '訊息內容至少需包含一個非空白字元' }
    ),
});

/**
 * TypeScript type inferred from contactFormSchema
 * 從 contactFormSchema 推導的 TypeScript 型別
 */
export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Validates contact form data and returns typed result
 * 驗證聯絡表單資料並回傳型別化結果
 *
 * @param data - Raw form data to validate
 * @returns Zod validation result with success/error states
 *
 * @example
 * ```typescript
 * const result = validateContactForm({
 *   name: '測試用戶',
 *   email: 'test@example.com',
 *   category: '技術問題',
 *   message: '這是一個測試訊息...'
 * });
 *
 * if (result.success) {
 *   // result.data is ContactFormData type
 *   await sendContactEmail(result.data);
 * } else {
 *   // result.error contains validation errors
 *   console.error(result.error.errors);
 * }
 * ```
 */
export function validateContactForm(data: unknown) {
  return contactFormSchema.safeParse(data);
}
