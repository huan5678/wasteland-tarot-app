/**
 * Enhanced Card Modal Integration Utilities
 * Provides initialization and integration functions for the complete card modal system
 */

import React from 'react'
import { initializeSpeechHandler, cleanupSpeechHandler } from './speechHandler'

// Types for the enhanced card modal system
export interface EnhancedCardModalConfig {
  enableAudio: boolean
  enableMobileOptimization: boolean
  enableAnalytics: boolean
  apiEndpoint?: string
  userId?: string
  enableOfflineMode: boolean
}

export interface CardModalAnalytics {
  cardViews: Map<string, number>
  sessionDuration: number
  interactionCounts: {
    bookmarks: number
    shares: number
    studySessions: number
    voicePlaybacks: number
  }
  mostViewedCards: string[]
  averageSessionTime: number
}

class EnhancedCardModalSystem {
  private config: EnhancedCardModalConfig
  private analytics: CardModalAnalytics
  private isInitialized = false
  private sessionStartTime: Date | null = null

  constructor(config: EnhancedCardModalConfig) {
    this.config = config
    this.analytics = {
      cardViews: new Map(),
      sessionDuration: 0,
      interactionCounts: {
        bookmarks: 0,
        shares: 0,
        studySessions: 0,
        voicePlaybacks: 0
      },
      mostViewedCards: [],
      averageSessionTime: 0
    }
  }

  // Initialize the enhanced card modal system
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.warn('Enhanced Card Modal System already initialized')
      return true
    }

    try {
      console.log('Initializing Enhanced Card Modal System...')

      // Initialize speech system
      if (this.config.enableAudio) {
        const speechInitialized = initializeSpeechHandler()
        if (speechInitialized) {
          console.log('✅ Speech synthesis initialized')
        } else {
          console.warn('⚠️  Speech synthesis not available')
        }
      }

      // Initialize analytics tracking
      if (this.config.enableAnalytics) {
        this.setupAnalyticsTracking()
        console.log('✅ Analytics tracking initialized')
      }

      // Initialize offline mode
      if (this.config.enableOfflineMode) {
        this.setupOfflineSupport()
        console.log('✅ Offline support initialized')
      }

      // Setup mobile optimizations
      if (this.config.enableMobileOptimization) {
        this.setupMobileOptimizations()
        console.log('✅ Mobile optimizations initialized')
      }

      this.sessionStartTime = new Date()
      this.isInitialized = true
      console.log('🎉 Enhanced Card Modal System fully initialized')
      return true

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Card Modal System:', error)
      return false
    }
  }

  // Track card interactions
  trackCardInteraction(cardId: string, interactionType: 'view' | 'bookmark' | 'share' | 'study' | 'voice') {
    if (!this.config.enableAnalytics) return

    switch (interactionType) {
      case 'view':
        const currentViews = this.analytics.cardViews.get(cardId) || 0
        this.analytics.cardViews.set(cardId, currentViews + 1)
        this.updateMostViewedCards()
        break
      case 'bookmark':
        this.analytics.interactionCounts.bookmarks++
        break
      case 'share':
        this.analytics.interactionCounts.shares++
        break
      case 'study':
        this.analytics.interactionCounts.studySessions++
        break
      case 'voice':
        this.analytics.interactionCounts.voicePlaybacks++
        break
    }

    // Log to console for development
    console.log(`📊 Card interaction tracked: ${cardId} - ${interactionType}`)
  }

  // Setup analytics tracking
  private setupAnalyticsTracking() {
    // Track page visibility for session duration
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSessionTimer()
      } else {
        this.resumeSessionTimer()
      }
    })

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.finalizeSession()
    })
  }

  // Setup offline support
  private setupOfflineSupport() {
    // Register service worker for offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-card-modal.js')
        .then(registration => {
          console.log('Service Worker registered for card modal caching')
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error)
        })
    }

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored - syncing data')
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost - enabling offline mode')
    })
  }

  // Setup mobile optimizations
  private setupMobileOptimizations() {
    // Prevent zoom on input focus (iOS)
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
      )
    }

    // Optimize touch interactions
    document.addEventListener('touchstart', () => {}, { passive: true })
    document.addEventListener('touchmove', () => {}, { passive: true })

    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
    })
  }

  // Update most viewed cards
  private updateMostViewedCards() {
    this.analytics.mostViewedCards = Array.from(this.analytics.cardViews.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([cardId]) => cardId)
  }

  // Session timer methods
  private pauseSessionTimer() {
    if (this.sessionStartTime) {
      this.analytics.sessionDuration += Date.now() - this.sessionStartTime.getTime()
    }
  }

  private resumeSessionTimer() {
    this.sessionStartTime = new Date()
  }

  private finalizeSession() {
    if (this.sessionStartTime) {
      this.analytics.sessionDuration += Date.now() - this.sessionStartTime.getTime()
      this.analytics.averageSessionTime = this.analytics.sessionDuration
    }
  }

  // Sync offline data when connection is restored
  private async syncOfflineData() {
    if (!this.config.apiEndpoint || !this.config.userId) return

    try {
      // Get offline stored data
      const offlineData = localStorage.getItem('cardModalOfflineData')
      if (!offlineData) return

      // Sync with server
      const response = await fetch(`${this.config.apiEndpoint}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.userId}`
        },
        body: offlineData
      })

      if (response.ok) {
        localStorage.removeItem('cardModalOfflineData')
        console.log('✅ Offline data synced successfully')
      }
    } catch (error) {
      console.error('❌ Failed to sync offline data:', error)
    }
  }

  // Get analytics data
  getAnalytics(): CardModalAnalytics {
    return { ...this.analytics }
  }

  // Export analytics data
  exportAnalytics(): string {
    return JSON.stringify({
      ...this.analytics,
      cardViews: Object.fromEntries(this.analytics.cardViews),
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionStartTime?.getTime() || 0
    }, null, 2)
  }

  // Cleanup system
  cleanup() {
    if (!this.isInitialized) return

    console.log('🧹 Cleaning up Enhanced Card Modal System...')
    
    // Cleanup speech handler
    if (this.config.enableAudio) {
      cleanupSpeechHandler()
    }

    // Finalize analytics
    if (this.config.enableAnalytics) {
      this.finalizeSession()
    }

    // Reset state
    this.isInitialized = false
    this.sessionStartTime = null
    
    console.log('✅ Enhanced Card Modal System cleanup complete')
  }

  // Check if system is ready
  isReady(): boolean {
    return this.isInitialized
  }
}

// Global instance
let globalSystem: EnhancedCardModalSystem | null = null

// Initialize the global system
export function initializeEnhancedCardModal(config: EnhancedCardModalConfig): Promise<boolean> {
  if (globalSystem) {
    console.warn('Enhanced Card Modal System already exists')
    return Promise.resolve(globalSystem.isReady())
  }

  globalSystem = new EnhancedCardModalSystem(config)
  return globalSystem.initialize()
}

// Get the global system instance
export function getEnhancedCardModalSystem(): EnhancedCardModalSystem | null {
  return globalSystem
}

// Track card interaction (convenience function)
export function trackCardInteraction(
  cardId: string, 
  interactionType: 'view' | 'bookmark' | 'share' | 'study' | 'voice'
) {
  globalSystem?.trackCardInteraction(cardId, interactionType)
}

// Cleanup global system
export function cleanupEnhancedCardModal() {
  if (globalSystem) {
    globalSystem.cleanup()
    globalSystem = null
  }
}

// Default configuration
export const DEFAULT_CONFIG: EnhancedCardModalConfig = {
  enableAudio: true,
  enableMobileOptimization: true,
  enableAnalytics: true,
  enableOfflineMode: true
}

// React hook for system integration
export function useEnhancedCardModal(config: Partial<EnhancedCardModalConfig> = {}) {
  const [isReady, setIsReady] = React.useState(false)
  const [system, setSystem] = React.useState<EnhancedCardModalSystem | null>(null)

  React.useEffect(() => {
    const fullConfig = { ...DEFAULT_CONFIG, ...config }
    
    initializeEnhancedCardModal(fullConfig).then(ready => {
      setIsReady(ready)
      setSystem(getEnhancedCardModalSystem())
    })

    return () => {
      cleanupEnhancedCardModal()
    }
  }, [])

  return {
    isReady,
    system,
    trackInteraction: trackCardInteraction
  }
}

export default EnhancedCardModalSystem
