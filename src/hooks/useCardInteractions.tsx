/**
 * Card Interactions Hook
 * Manages bookmarks, notes, study progress, and personal card data
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DetailedTarotCard } from '@/components/tarot/CardDetailModal'

export interface CardBookmark {
  cardId: string
  isBookmarked: boolean
  bookmarkedAt: Date
  notes: string
  tags: string[]
}

export interface CardStudyProgress {
  cardId: string
  timesViewed: number
  studyProgress: number // 0-100
  lastViewed: Date
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  quizScores: number[]
}

export interface CardPersonalData {
  cardId: string
  personalMeaning: string
  personalKeywords: string[]
  personalExperiences: string[]
  emotionalConnection: number // 1-5
  accuracyRating: number // 1-5
}

export interface UseCardInteractionsProps {
  userId?: string
  enableLocalStorage?: boolean
  onDataSync?: (data: any) => Promise<void>
}

export interface UseCardInteractionsReturn {
  // Bookmarks
  bookmarks: Map<string, CardBookmark>
  isBookmarked: (cardId: string) => boolean
  toggleBookmark: (card: DetailedTarotCard) => Promise<void>
  addBookmark: (card: DetailedTarotCard, notes?: string) => Promise<void>
  removeBookmark: (cardId: string) => Promise<void>
  updateBookmarkNotes: (cardId: string, notes: string) => Promise<void>

  // Study Progress
  studyData: Map<string, CardStudyProgress>
  getStudyProgress: (cardId: string) => CardStudyProgress
  updateStudyProgress: (cardId: string, progress: Partial<CardStudyProgress>) => Promise<void>
  markAsViewed: (cardId: string) => Promise<void>
  updateMasteryLevel: (cardId: string, level: CardStudyProgress['masteryLevel']) => Promise<void>

  // Personal Data
  personalData: Map<string, CardPersonalData>
  getPersonalData: (cardId: string) => CardPersonalData
  updatePersonalData: (cardId: string, data: Partial<CardPersonalData>) => Promise<void>

  // Statistics
  getTotalBookmarks: () => number
  getTotalStudyTime: () => number
  getAverageAccuracy: () => number
  getMostViewedCards: (limit?: number) => Array<{ cardId: string; views: number }>

  // Export/Import
  exportData: () => string
  importData: (jsonData: string) => Promise<void>

  // Sync
  syncWithServer: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

const STORAGE_KEYS = {
  bookmarks: 'wasteland_tarot_bookmarks',
  studyData: 'wasteland_tarot_study_data',
  personalData: 'wasteland_tarot_personal_data'
}

export function useCardInteractions({
  userId,
  enableLocalStorage = true,
  onDataSync
}: UseCardInteractionsProps = {}): UseCardInteractionsReturn {

  const [bookmarks, setBookmarks] = useState<Map<string, CardBookmark>>(new Map())
  const [studyData, setStudyData] = useState<Map<string, CardStudyProgress>>(new Map())
  const [personalData, setPersonalData] = useState<Map<string, CardPersonalData>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    if (!enableLocalStorage) {
      setIsLoading(false)
      return
    }

    try {
      // Load bookmarks
      const savedBookmarks = localStorage.getItem(STORAGE_KEYS.bookmarks)
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks)
        const bookmarkMap = new Map()
        Object.entries(parsed).forEach(([cardId, data]: [string, any]) => {
          bookmarkMap.set(cardId, {
            ...data,
            bookmarkedAt: new Date(data.bookmarkedAt)
          })
        })
        setBookmarks(bookmarkMap)
      }

      // Load study data
      const savedStudyData = localStorage.getItem(STORAGE_KEYS.studyData)
      if (savedStudyData) {
        const parsed = JSON.parse(savedStudyData)
        const studyMap = new Map()
        Object.entries(parsed).forEach(([cardId, data]: [string, any]) => {
          studyMap.set(cardId, {
            ...data,
            lastViewed: new Date(data.lastViewed)
          })
        })
        setStudyData(studyMap)
      }

      // Load personal data
      const savedPersonalData = localStorage.getItem(STORAGE_KEYS.personalData)
      if (savedPersonalData) {
        const parsed = JSON.parse(savedPersonalData)
        const personalMap = new Map()
        Object.entries(parsed).forEach(([cardId, data]: [string, any]) => {
          personalMap.set(cardId, data)
        })
        setPersonalData(personalMap)
      }

    } catch (err) {
      console.error('Failed to load card interaction data:', err)
      setError(err instanceof Error ? err : new Error('Failed to load data'))
    } finally {
      setIsLoading(false)
    }
  }, [enableLocalStorage])

  // Save data to localStorage
  const saveToLocalStorage = useCallback((key: string, data: Map<string, any>) => {
    if (!enableLocalStorage) return

    try {
      const obj: any = {}
      data.forEach((value, cardId) => {
        obj[cardId] = value
      })
      localStorage.setItem(key, JSON.stringify(obj))
    } catch (err) {
      console.error(`Failed to save ${key}:`, err)
      setError(err instanceof Error ? err : new Error('Failed to save data'))
    }
  }, [enableLocalStorage])

  // Bookmark methods
  const isBookmarked = useCallback((cardId: string): boolean => {
    return bookmarks.has(cardId) && bookmarks.get(cardId)!.isBookmarked
  }, [bookmarks])

  const toggleBookmark = useCallback(async (card: DetailedTarotCard): Promise<void> => {
    const cardId = card.id.toString()
    const currentBookmark = bookmarks.get(cardId)

    if (currentBookmark?.isBookmarked) {
      await removeBookmark(cardId)
    } else {
      await addBookmark(card)
    }
  }, [bookmarks])

  const addBookmark = useCallback(async (card: DetailedTarotCard, notes = ''): Promise<void> => {
    const cardId = card.id.toString()
    const bookmark: CardBookmark = {
      cardId,
      isBookmarked: true,
      bookmarkedAt: new Date(),
      notes,
      tags: []
    }

    const newBookmarks = new Map(bookmarks)
    newBookmarks.set(cardId, bookmark)
    setBookmarks(newBookmarks)
    saveToLocalStorage(STORAGE_KEYS.bookmarks, newBookmarks)

    if (onDataSync) {
      await onDataSync({ type: 'bookmark_added', cardId, bookmark })
    }
  }, [bookmarks, saveToLocalStorage, onDataSync])

  const removeBookmark = useCallback(async (cardId: string): Promise<void> => {
    const newBookmarks = new Map(bookmarks)
    newBookmarks.delete(cardId)
    setBookmarks(newBookmarks)
    saveToLocalStorage(STORAGE_KEYS.bookmarks, newBookmarks)

    if (onDataSync) {
      await onDataSync({ type: 'bookmark_removed', cardId })
    }
  }, [bookmarks, saveToLocalStorage, onDataSync])

  const updateBookmarkNotes = useCallback(async (cardId: string, notes: string): Promise<void> => {
    const bookmark = bookmarks.get(cardId)
    if (!bookmark) return

    const updatedBookmark = { ...bookmark, notes }
    const newBookmarks = new Map(bookmarks)
    newBookmarks.set(cardId, updatedBookmark)
    setBookmarks(newBookmarks)
    saveToLocalStorage(STORAGE_KEYS.bookmarks, newBookmarks)

    if (onDataSync) {
      await onDataSync({ type: 'bookmark_updated', cardId, notes })
    }
  }, [bookmarks, saveToLocalStorage, onDataSync])

  // Study progress methods
  const getStudyProgress = useCallback((cardId: string): CardStudyProgress => {
    return studyData.get(cardId) || {
      cardId,
      timesViewed: 0,
      studyProgress: 0,
      lastViewed: new Date(),
      masteryLevel: 'beginner',
      quizScores: []
    }
  }, [studyData])

  const updateStudyProgress = useCallback(async (
    cardId: string,
    progress: Partial<CardStudyProgress>
  ): Promise<void> => {
    const current = getStudyProgress(cardId)
    const updated = { ...current, ...progress }

    const newStudyData = new Map(studyData)
    newStudyData.set(cardId, updated)
    setStudyData(newStudyData)
    saveToLocalStorage(STORAGE_KEYS.studyData, newStudyData)

    if (onDataSync) {
      await onDataSync({ type: 'study_progress_updated', cardId, progress })
    }
  }, [studyData, getStudyProgress, saveToLocalStorage, onDataSync])

  const markAsViewed = useCallback(async (cardId: string): Promise<void> => {
    const current = getStudyProgress(cardId)
    await updateStudyProgress(cardId, {
      timesViewed: current.timesViewed + 1,
      lastViewed: new Date()
    })
  }, [getStudyProgress, updateStudyProgress])

  const updateMasteryLevel = useCallback(async (
    cardId: string,
    level: CardStudyProgress['masteryLevel']
  ): Promise<void> => {
    await updateStudyProgress(cardId, { masteryLevel: level })
  }, [updateStudyProgress])

  // Personal data methods
  const getPersonalData = useCallback((cardId: string): CardPersonalData => {
    return personalData.get(cardId) || {
      cardId,
      personalMeaning: '',
      personalKeywords: [],
      personalExperiences: [],
      emotionalConnection: 3,
      accuracyRating: 3
    }
  }, [personalData])

  const updatePersonalData = useCallback(async (
    cardId: string,
    data: Partial<CardPersonalData>
  ): Promise<void> => {
    const current = getPersonalData(cardId)
    const updated = { ...current, ...data }

    const newPersonalData = new Map(personalData)
    newPersonalData.set(cardId, updated)
    setPersonalData(newPersonalData)
    saveToLocalStorage(STORAGE_KEYS.personalData, newPersonalData)

    if (onDataSync) {
      await onDataSync({ type: 'personal_data_updated', cardId, data })
    }
  }, [personalData, getPersonalData, saveToLocalStorage, onDataSync])

  // Statistics
  const getTotalBookmarks = useCallback((): number => {
    return Array.from(bookmarks.values()).filter(b => b.isBookmarked).length
  }, [bookmarks])

  const getTotalStudyTime = useCallback((): number => {
    return Array.from(studyData.values()).reduce((total, data) => {
      return total + data.timesViewed * 2 // Assume 2 minutes per view
    }, 0)
  }, [studyData])

  const getAverageAccuracy = useCallback((): number => {
    const ratings = Array.from(personalData.values())
      .map(data => data.accuracyRating)
      .filter(rating => rating > 0)

    if (ratings.length === 0) return 0
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }, [personalData])

  const getMostViewedCards = useCallback((limit = 10): Array<{ cardId: string; views: number }> => {
    return Array.from(studyData.entries())
      .map(([cardId, data]) => ({ cardId, views: data.timesViewed }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  }, [studyData])

  // Export/Import
  const exportData = useCallback((): string => {
    const data = {
      bookmarks: Object.fromEntries(bookmarks),
      studyData: Object.fromEntries(studyData),
      personalData: Object.fromEntries(personalData),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    return JSON.stringify(data, null, 2)
  }, [bookmarks, studyData, personalData])

  const importData = useCallback(async (jsonData: string): Promise<void> => {
    try {
      const data = JSON.parse(jsonData)

      if (data.bookmarks) {
        const bookmarkMap = new Map()
        Object.entries(data.bookmarks).forEach(([cardId, bookmark]: [string, any]) => {
          bookmarkMap.set(cardId, {
            ...bookmark,
            bookmarkedAt: new Date(bookmark.bookmarkedAt)
          })
        })
        setBookmarks(bookmarkMap)
        saveToLocalStorage(STORAGE_KEYS.bookmarks, bookmarkMap)
      }

      if (data.studyData) {
        const studyMap = new Map()
        Object.entries(data.studyData).forEach(([cardId, study]: [string, any]) => {
          studyMap.set(cardId, {
            ...study,
            lastViewed: new Date(study.lastViewed)
          })
        })
        setStudyData(studyMap)
        saveToLocalStorage(STORAGE_KEYS.studyData, studyMap)
      }

      if (data.personalData) {
        const personalMap = new Map()
        Object.entries(data.personalData).forEach(([cardId, personal]: [string, any]) => {
          personalMap.set(cardId, personal)
        })
        setPersonalData(personalMap)
        saveToLocalStorage(STORAGE_KEYS.personalData, personalMap)
      }

    } catch (err) {
      throw new Error('Invalid import data format')
    }
  }, [saveToLocalStorage])

  // Sync with server
  const syncWithServer = useCallback(async (): Promise<void> => {
    if (!onDataSync) return

    try {
      setIsLoading(true)
      await onDataSync({
        type: 'full_sync',
        bookmarks: Object.fromEntries(bookmarks),
        studyData: Object.fromEntries(studyData),
        personalData: Object.fromEntries(personalData)
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sync failed'))
    } finally {
      setIsLoading(false)
    }
  }, [onDataSync, bookmarks, studyData, personalData])

  return {
    // Bookmarks
    bookmarks,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    updateBookmarkNotes,

    // Study Progress
    studyData,
    getStudyProgress,
    updateStudyProgress,
    markAsViewed,
    updateMasteryLevel,

    // Personal Data
    personalData,
    getPersonalData,
    updatePersonalData,

    // Statistics
    getTotalBookmarks,
    getTotalStudyTime,
    getAverageAccuracy,
    getMostViewedCards,

    // Export/Import
    exportData,
    importData,

    // Sync
    syncWithServer,
    isLoading,
    error
  }
}

export default useCardInteractions