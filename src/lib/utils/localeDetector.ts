/**
 * LocaleDetector - 多層次語系偵測工具
 * 
 * 優先順序:
 * 1. localStorage 儲存的使用者偏好
 * 2. URL 參數 (?lang=zh-TW 或 ?locale=zh-TW)
 * 3. 瀏覽器語言設定
 * 4. 時區推測（輔助判斷）
 * 
 * @example
 * ```ts
 * const detector = LocaleDetector.getInstance();
 * const locale = await detector.detect();
 * console.log('偵測到的語系:', locale);
 * 
 * const formattedDate = detector.formatDate(new Date());
 * ```
 */

export class LocaleDetector {
  private static instance: LocaleDetector;
  private locale: string | null = null;
  private readonly STORAGE_KEY = 'userLocale';

  private constructor() {}

  /**
   * 取得 Singleton 實例
   */
  static getInstance(): LocaleDetector {
    if (!LocaleDetector.instance) {
      LocaleDetector.instance = new LocaleDetector();
    }
    return LocaleDetector.instance;
  }

  /**
   * 時區到語系的映射表
   */
  private readonly timeZoneToLocale: Record<string, string> = {
    'Asia/Taipei': 'zh-TW',
    'Asia/Tokyo': 'ja-JP',
    'America/New_York': 'en-US',
    'America/Los_Angeles': 'en-US',
    'America/Chicago': 'en-US',
    'Europe/London': 'en-GB',
    'Europe/Paris': 'fr-FR',
    'Europe/Berlin': 'de-DE',
    'Asia/Shanghai': 'zh-CN',
    'Asia/Hong_Kong': 'zh-HK',
    'Asia/Seoul': 'ko-KR',
    'Australia/Sydney': 'en-AU',
  };

  /**
   * 從多個來源偵測語系
   * 
   * 優先順序:
   * 1. localStorage 儲存的偏好
   * 2. URL 參數
   * 3. 瀏覽器語言
   * 4. 時區推測（作為參考）
   */
  async detect(): Promise<string> {
    // 優先順序 1: 使用者已儲存的偏好
    this.locale = this.getStoredLocale();
    if (this.locale) {
      return this.locale;
    }

    // 優先順序 2: URL 參數
    this.locale = this.getURLLocale();
    if (this.locale) {
      this.saveLocale(this.locale);
      return this.locale;
    }

    // 優先順序 3: 瀏覽器語言
    this.locale = this.getBrowserLocale();

    // 優先順序 4: 時區推測（作為參考）
    const timeZoneLocale = this.getTimeZoneLocale();

    // 如果瀏覽器是英文但時區在亞洲中文區，使用時區推測的語系
    if (this.locale.startsWith('en') && timeZoneLocale?.startsWith('zh')) {
      this.locale = timeZoneLocale;
    }

    this.saveLocale(this.locale);
    return this.locale;
  }

  /**
   * 從 localStorage 取得儲存的語系偏好
   */
  private getStoredLocale(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * 從 URL 參數取得語系 (?lang=zh-TW 或 ?locale=zh-TW)
   */
  private getURLLocale(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('lang') || params.get('locale');
    } catch {
      return null;
    }
  }

  /**
   * 從瀏覽器取得語言設定
   */
  private getBrowserLocale(): string {
    if (typeof navigator === 'undefined') return 'en-US';
    return navigator.language || (navigator.languages && navigator.languages[0]) || 'en-US';
  }

  /**
   * 根據時區推測語系
   */
  private getTimeZoneLocale(): string | undefined {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.timeZoneToLocale[timeZone];
    } catch {
      return undefined;
    }
  }

  /**
   * 儲存語系偏好到 localStorage
   */
  private saveLocale(locale: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, locale);
    } catch (error) {
      console.warn('[LocaleDetector] Failed to save locale:', error);
    }
  }

  /**
   * 取得當前偵測到的語系
   */
  getLocale(): string {
    return this.locale || 'en-US';
  }

  /**
   * 手動設定語系
   */
  setLocale(locale: string): void {
    this.locale = locale;
    this.saveLocale(locale);
  }

  /**
   * 格式化日期
   * 
   * @param date - Date 物件或日期字串
   * @param options - Intl.DateTimeFormat 選項
   */
  formatDate(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = this.locale || 'en-US';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return dateObj.toLocaleString(locale, options || defaultOptions);
  }

  /**
   * 格式化數字
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.locale || 'en-US';
    return value.toLocaleString(locale, options);
  }

  /**
   * 格式化貨幣
   */
  formatCurrency(
    value: number,
    currency: string = 'USD',
    options?: Intl.NumberFormatOptions
  ): string {
    const locale = this.locale || 'en-US';
    return value.toLocaleString(locale, {
      style: 'currency',
      currency,
      ...options,
    });
  }
}

/**
 * 取得全域 LocaleDetector 實例
 */
export const getLocaleDetector = () => LocaleDetector.getInstance();

/**
 * 快速格式化日期
 */
export const formatLocalDate = (date: Date | string): string => {
  return getLocaleDetector().formatDate(date);
};
