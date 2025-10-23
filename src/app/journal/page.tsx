/**
 * Journal Page
 * Main page for viewing and managing user's tarot journals
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJournalStore } from '@/stores/journalStore'
import { JournalList } from '@/components/journal/JournalList'
import { JournalEditor } from '@/components/journal/JournalEditor'
import { PixelIcon } from '@/components/ui/icons'
import type { Journal } from '@/stores/journalStore'

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20

// ============================================================================
// Component
// ============================================================================

export default function JournalPage() {
  const router = useRouter()

  // ========== State ==========
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null)

  // ========== Store ==========
  const {
    journals,
    pagination,
    isLoading,
    error,
    fetchJournals,
    deleteJournal,
    clearError,
  } = useJournalStore()

  // ========== Effects ==========

  useEffect(() => {
    const skip = (currentPage - 1) * PAGE_SIZE
    fetchJournals(skip, PAGE_SIZE)
  }, [currentPage, fetchJournals])

  // ========== Handlers ==========

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedJournal(null)
  }

  const handleCancelEdit = () => {
    setIsCreating(false)
    setSelectedJournal(null)
  }

  const handleSaveNew = async (data: any) => {
    // This will be implemented when we add "create from reading" flow
    // For now, show an error message
    alert('請從占卜結果頁面建立日記')
    setIsCreating(false)
  }

  const handleJournalClick = (journal: Journal) => {
    setSelectedJournal(journal)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteJournal = async (journalId: string) => {
    if (!confirm('確定要刪除此日記嗎？此操作無法復原。')) {
      return
    }

    try {
      await deleteJournal(journalId)
      // Refresh the list
      const skip = (currentPage - 1) * PAGE_SIZE
      await fetchJournals(skip, PAGE_SIZE)
    } catch (error) {
      console.error('Failed to delete journal:', error)
    }
  }

  // ========== Render ==========

  return (
    <div className="min-h-screen bg-wasteland-dark py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pip-boy-green">
          <h1 className="text-3xl font-cubic text-pip-boy-green flex items-center gap-3">
            <PixelIcon name="book-open" sizePreset="md" decorative />
            塔羅日記
          </h1>

          {!isCreating && !selectedJournal && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 bg-pip-boy-green text-wasteland-dark font-cubic text-sm hover:bg-pip-boy-green/90 transition-colors flex items-center gap-2"
              aria-label="新增日記"
            >
              <PixelIcon name="add" sizePreset="xs" decorative />
              新增日記
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-900/20 border border-red-500 text-red-500 font-cubic text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PixelIcon name="alert" sizePreset="xs" decorative />
              <span>{error.message}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="hover:opacity-70 transition-opacity"
              aria-label="關閉錯誤訊息"
            >
              <PixelIcon name="close" sizePreset="xs" decorative />
            </button>
          </div>
        )}

        {/* Main Content */}
        {isCreating ? (
          /* Create New Journal Form */
          <div className="bg-wasteland-dark/50 border border-pip-boy-green p-6">
            <div className="mb-4 pb-4 border-b border-pip-boy-green">
              <h2 className="text-xl font-cubic text-pip-boy-green">新增日記</h2>
              <p className="text-sm font-cubic text-pip-boy-green/70 mt-2">
                注意：日記必須關聯到一個占卜結果。請從占卜結果頁面建立日記。
              </p>
            </div>
            <JournalEditor
              onSave={handleSaveNew}
              onCancel={handleCancelEdit}
            />
          </div>
        ) : selectedJournal ? (
          /* View/Edit Selected Journal */
          <div className="bg-wasteland-dark/50 border border-pip-boy-green p-6">
            <div className="mb-4 pb-4 border-b border-pip-boy-green flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="text-sm font-cubic text-pip-boy-green hover:text-pip-boy-green/70 transition-colors flex items-center gap-2"
                aria-label="返回列表"
              >
                <PixelIcon name="chevron-left" sizePreset="xs" decorative />
                返回列表
              </button>

              <button
                type="button"
                onClick={() => handleDeleteJournal(selectedJournal.id)}
                className="text-sm font-cubic text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                aria-label="刪除日記"
              >
                <PixelIcon name="trash" sizePreset="xs" decorative />
                刪除
              </button>
            </div>

            {/* TODO: Show journal details/editor here */}
            <div className="text-pip-boy-green font-cubic">
              <p className="text-xs text-pip-boy-green/70 mb-4">
                建立時間：{new Date(selectedJournal.created_at).toLocaleString('zh-TW')}
              </p>
              <div className="prose prose-invert prose-green max-w-none">
                <pre className="whitespace-pre-wrap">{selectedJournal.content}</pre>
              </div>
              {selectedJournal.mood_tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-pip-boy-green">
                  <p className="text-xs text-pip-boy-green/70 mb-2">心情標籤：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJournal.mood_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-pip-boy-green/20 text-pip-boy-green border border-pip-boy-green/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Journal List */
          <JournalList
            journals={journals}
            total={pagination?.total || 0}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onJournalClick={handleJournalClick}
          />
        )}
      </div>
    </div>
  )
}
