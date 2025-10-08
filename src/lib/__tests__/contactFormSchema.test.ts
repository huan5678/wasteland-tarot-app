import { describe, it, expect } from 'bun:test';
import { contactFormSchema } from '../contactFormSchema';

/**
 * Helper function to get first error message from validation result
 */
function getFirstErrorMessage(result: { success: false; error: any }): string {
  return result.error.issues[0]?.message || '';
}

describe('contactFormSchema', () => {
  describe('name field validation', () => {
    it('should accept valid Chinese and English names', () => {
      const validNames = [
        { name: '張三', email: 'test@example.com', category: '技術問題', message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。' },
        { name: 'John Doe', email: 'test@example.com', category: '技術問題', message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。' },
        { name: '王小明', email: 'test@example.com', category: '技術問題', message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。' },
        { name: 'Alice Wang', email: 'test@example.com', category: '技術問題', message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。' },
      ];

      validNames.forEach(data => {
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept names with spaces', () => {
      const data = {
        name: '王 小明',
        email: 'test@example.com',
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject names shorter than 2 characters', () => {
      const data = {
        name: 'A',
        email: 'test@example.com',
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('姓名必須為 2-50 個字元');
      }
    });

    it('should reject names longer than 50 characters', () => {
      const data = {
        name: 'A'.repeat(51),
        email: 'test@example.com',
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('姓名必須為 2-50 個字元');
      }
    });

    it('should reject names with special characters or numbers', () => {
      const invalidNames = ['張三123', 'John@Doe', '王_小明', 'Test#User'];

      invalidNames.forEach(name => {
        const data = {
          name,
          email: 'test@example.com',
          category: '技術問題',
          message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
        };
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
          expect(result.error.issues[0].message).toContain('姓名僅能包含');
        }
      });
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        email: 'test@example.com',
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('請輸入您的姓名');
      }
    });
  });

  describe('email field validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const data = {
          name: '測試用戶',
          email,
          category: '技術問題',
          message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
        };
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user name@example.com',
      ];

      invalidEmails.forEach(email => {
        const data = {
          name: '測試用戶',
          email,
          category: '技術問題',
          message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
        };
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(getFirstErrorMessage(result)).toContain('請輸入有效的電子郵件地址');
        }
      });
    });

    it('should reject emails longer than 100 characters', () => {
      const longEmail = 'a'.repeat(90) + '@example.com'; // Total > 100
      const data = {
        name: '測試用戶',
        email: longEmail,
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('電子郵件地址不得超過 100 個字元');
      }
    });

    it('should reject empty email', () => {
      const data = {
        name: '測試用戶',
        email: '',
        category: '技術問題',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('請輸入您的電子郵件');
      }
    });
  });

  describe('category field validation', () => {
    it('should accept all valid category options', () => {
      const validCategories = ['技術問題', '帳號問題', '建議回饋', '其他'];

      validCategories.forEach(category => {
        const data = {
          name: '測試用戶',
          email: 'test@example.com',
          category,
          message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
        };
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid category', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '無效類別',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toBeDefined();
      }
    });

    it('should reject empty category', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '',
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('請選擇問題類別');
      }
    });
  });

  describe('message field validation', () => {
    it('should accept valid messages', () => {
      const validMessages = [
        '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
        '我想詢問關於 Karma 系統的運作方式，能否提供更詳細的說明？',
        'This is a test message that has at least twenty characters to pass validation.',
      ];

      validMessages.forEach(message => {
        const data = {
          name: '測試用戶',
          email: 'test@example.com',
          category: '技術問題',
          message,
        };
        const result = contactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject messages shorter than 20 characters', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '技術問題',
        message: 'Too short',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('訊息內容必須為 20-1000 個字元');
      }
    });

    it('should reject messages longer than 1000 characters', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '技術問題',
        message: 'A'.repeat(1001),
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('訊息內容必須為 20-1000 個字元');
      }
    });

    it('should reject messages with only whitespace', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '技術問題',
        message: '                              ',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('訊息內容至少需包含一個非空白字元');
      }
    });

    it('should reject empty message', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '技術問題',
        message: '',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result)).toContain('請輸入您的訊息');
      }
    });
  });

  describe('full form validation', () => {
    it('should accept a complete valid form', () => {
      const data = {
        name: '艾莉亞·輻射',
        email: 'aliya@wasteland-tarot.vault',
        category: '建議回饋',
        message: '我非常喜歡這個廢土塔羅專案！希望未來能加入更多 Fallout 陣營的解讀角色。',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('艾莉亞·輻射');
        expect(result.data.email).toBe('aliya@wasteland-tarot.vault');
        expect(result.data.category).toBe('建議回饋');
        expect(result.data.message).toBe(
          '我非常喜歡這個廢土塔羅專案！希望未來能加入更多 Fallout 陣營的解讀角色。'
        );
      }
    });

    it('should reject form with multiple invalid fields', () => {
      const data = {
        name: 'A',
        email: 'invalid-email',
        category: '無效類別',
        message: 'Too short',
      };
      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });

    it('should provide TypeScript type inference', () => {
      const data = {
        name: '測試用戶',
        email: 'test@example.com',
        category: '技術問題' as const,
        message: '這是一個測試訊息，至少需要二十個字元才能通過驗證規則。',
      };
      const result = contactFormSchema.safeParse(data);
      if (result.success) {
        // Type inference test - should not throw TypeScript error
        const name: string = result.data.name;
        const email: string = result.data.email;
        const category: string = result.data.category;
        const message: string = result.data.message;

        expect(typeof name).toBe('string');
        expect(typeof email).toBe('string');
        expect(typeof category).toBe('string');
        expect(typeof message).toBe('string');
      }
    });
  });
});
