/**
 * IncompleteSessionsList - Display and manage resumable sessions
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/lib/sessionStore'
import { Play, Trash2, Clock } from 'lucide-react'
import type { SessionMetadata } from '@/types/session'

export function IncompleteSessionsList() {
  const router = useRouter()
  const {
    incompleteSessions,
    totalSessions,
    isLoading,
    loadIncompleteSessions,
    resumeSession,
    deleteSession,
  } = useSessionStore()

  useEffect(() => {
    loadIncompleteSessions()
  }, [loadIncompleteSessions])

  const handleResume = async (id: string) => {
    try {
      await resumeSession(id)
      router.push('/readings/new')
    } catch (error) {
      console.error('恢復會話失敗:', error)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('確定要刪除此會話嗎？')) return

    try {
      await deleteSession(id)
    } catch (error) {
      console.error('刪除會話失敗:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} 天前`
    } else if (diffHours > 0) {
      return `${diffHours} 小時前`
    } else if (diffMins > 0) {
      return `${diffMins} 分鐘前`
    } else {
      return '剛剛'
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-pip-boy-green">載入會話...</p>
      </div>
    )
  }

  if (incompleteSessions.length === 0) {
    return (
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-pip-boy-green opacity-50" />
        <p className="text-pip-boy-green/70">
          目前沒有未完成的占卜會話
        </p>
        <p className="text-pip-boy-green/50 text-sm mt-2">
          開始新的占卜，系統會自動為你儲存進度
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-pip-boy-green">
          未完成的占卜 ({totalSessions})
        </h3>
      </div>

      <div className="space-y-3">
        {incompleteSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onResume={() => handleResume(session.id)}
            onDelete={(e) => handleDelete(session.id, e)}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  )
}

function SessionCard({
  session,
  onResume,
  onDelete,
  formatDate,
}: {
  session: SessionMetadata
  onResume: () => void
  onDelete: (e: React.MouseEvent) => void
  formatDate: (date: string) => string
}) {
  return (
    <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-pip-boy-green/20 border border-pip-boy-green/50 text-pip-boy-green text-xs rounded">
              {session.spread_type}
            </span>
            <span className="text-pip-boy-green/50 text-xs">
              {formatDate(session.updated_at)}
            </span>
          </div>

          <p className="text-pip-boy-green text-sm line-clamp-2 mb-2">
            {session.question}
          </p>

          <div className="flex items-center gap-2 text-xs text-pip-boy-green/70">
            <Clock className="w-3 h-3" />
            <span>建立於 {new Date(session.created_at).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 px-3 py-2 border border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/10 transition-colors text-sm"
            title="恢復會話"
          >
            <Play className="w-4 h-4" />
            <span>恢復</span>
          </button>

          <button
            onClick={onDelete}
            className="p-2 border border-red-400 text-red-400 hover:bg-red-400/10 transition-colors"
            title="刪除會話"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
