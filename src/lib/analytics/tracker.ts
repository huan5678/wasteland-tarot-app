/**
 * Analytics Tracker
 * Client-side behavior tracking for personalization
 */

interface AnalyticsEvent {
  event_type: string;
  event_category: string;
  event_action: string;
  event_data?: Record<string, any>;
  session_id?: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  duration?: number;
}

interface SessionData {
  session_id: string;
  start_time: number;
  last_active: number;
  page_views: number;
  events: AnalyticsEvent[];
}

class AnalyticsTracker {
  private session: SessionData | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private flushIntervalTime = 10000; // 10 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSession();
      this.startFlushInterval();
      this.setupEventListeners();
    }
  }

  /**
   * Initialize or restore session
   */
  private initSession() {
    const stored = sessionStorage.getItem('analytics_session');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Check if session is still valid
        if (now - parsed.last_active < this.sessionTimeout) {
          this.session = {
            ...parsed,
            last_active: now,
          };
          this.saveSession();
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
      }
    }

    // Create new session
    this.session = {
      session_id: this.generateSessionId(),
      start_time: Date.now(),
      last_active: Date.now(),
      page_views: 0,
      events: [],
    };
    this.saveSession();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save session to sessionStorage
   */
  private saveSession() {
    if (this.session && typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session', JSON.stringify(this.session));
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    if (typeof window === 'undefined') {
      return { device_type: 'unknown', browser: 'unknown', platform: 'unknown' };
    }

    const ua = navigator.userAgent;

    // Detect device type
    let device_type = 'desktop';
    if (/mobile/i.test(ua)) device_type = 'mobile';
    else if (/tablet|ipad/i.test(ua)) device_type = 'tablet';

    // Detect browser
    let browser = 'unknown';
    if (ua.indexOf('Firefox') > -1) browser = 'firefox';
    else if (ua.indexOf('Chrome') > -1) browser = 'chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'safari';
    else if (ua.indexOf('Edge') > -1) browser = 'edge';

    // Detect platform
    const platform = navigator.platform || 'unknown';

    return { device_type, browser, platform };
  }

  /**
   * Track an event
   */
  track(
    event_type: string,
    event_category: string,
    event_action: string,
    event_data?: Record<string, any>,
    duration?: number
  ) {
    if (!this.session) {
      this.initSession();
    }

    const deviceInfo = this.getDeviceInfo();

    const event: AnalyticsEvent = {
      event_type,
      event_category,
      event_action,
      event_data,
      session_id: this.session?.session_id,
      ...deviceInfo,
      duration,
    };

    this.eventQueue.push(event);

    if (this.session) {
      this.session.last_active = Date.now();
      this.session.events.push(event);
      this.saveSession();
    }

    // Flush immediately for important events
    if (event_category === 'critical' || this.eventQueue.length >= 10) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if (this.session) {
      this.session.page_views++;
      this.saveSession();
    }

    this.track(
      'page_viewed',
      'navigation',
      'view',
      { path, title }
    );
  }

  /**
   * Track reading creation
   */
  trackReadingCreated(data: {
    spread_type: string;
    character_voice: string;
    question_length: number;
    card_ids: string[];
  }) {
    this.track(
      'reading_created',
      'reading',
      'create',
      data
    );
  }

  /**
   * Track reading completion
   */
  trackReadingCompleted(data: {
    reading_id: string;
    duration: number;
    satisfaction?: number;
  }) {
    this.track(
      'reading_completed',
      'reading',
      'complete',
      { reading_id: data.reading_id, satisfaction: data.satisfaction },
      data.duration
    );
  }

  /**
   * Track card interaction
   */
  trackCardInteraction(action: 'viewed' | 'flipped' | 'favorited' | 'studied', card_id: string, duration?: number) {
    this.track(
      `card_${action}`,
      'card',
      action,
      { card_id },
      duration
    );
  }

  /**
   * Track social interaction
   */
  trackSocialInteraction(action: 'shared' | 'commented' | 'liked', target_id: string, target_type: string) {
    this.track(
      `${target_type}_${action}`,
      'social',
      action,
      { target_id, target_type }
    );
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, data?: Record<string, any>) {
    this.track(
      `feature_${action}`,
      'feature',
      action,
      { feature, ...data }
    );
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track(
      'error_occurred',
      'error',
      'error',
      {
        message: error.message,
        stack: error.stack,
        ...context,
      }
    );
  }

  /**
   * Flush events to server
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // User not authenticated, skip tracking
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        // Re-queue events if request failed
        this.eventQueue.unshift(...events);
        console.error('Failed to send analytics events');
      }
    } catch (error) {
      // Re-queue events if request failed
      this.eventQueue.unshift(...events);
      console.error('Error sending analytics events:', error);
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalTime);
  }

  /**
   * Stop flush interval
   */
  private stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush(); // Flush when user leaves page
      } else {
        if (this.session) {
          this.session.last_active = Date.now();
          this.saveSession();
        }
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track page navigation (for SPAs)
    if (typeof window !== 'undefined' && 'navigation' in window) {
      // @ts-ignore - Navigation API is experimental
      window.navigation?.addEventListener('navigate', (e: any) => {
        this.trackPageView(e.destination.url);
      });
    }
  }

  /**
   * End current session
   */
  endSession() {
    if (!this.session) return;

    const duration = Math.floor((Date.now() - this.session.start_time) / 1000);

    this.track(
      'session_ended',
      'session',
      'end',
      {
        duration,
        page_views: this.session.page_views,
        event_count: this.session.events.length,
      },
      duration
    );

    this.flush(); // Send all remaining events
    this.stopFlushInterval();

    sessionStorage.removeItem('analytics_session');
    this.session = null;
  }

  /**
   * Get current session info
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    if (!this.session) return 0;
    return Math.floor((Date.now() - this.session.start_time) / 1000);
  }
}

// Export singleton instance
export const analytics = new AnalyticsTracker();

// Export types
export type { AnalyticsEvent, SessionData };
