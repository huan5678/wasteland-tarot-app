'use client'
import React, { useState } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'

interface Props {
  readingId: string
  onClose: () => void
}

export function ReadingMetaEditor({ readingId, onClose }: Props) {
  const reading = useReadingsStore(s => s.byId[readingId])
  const updateReading = useReadingsStore(s => s.updateReading)
  const [tags, setTags] = useState((reading?.tags || []).join(','))
  const [notes, setNotes] = useState(reading?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!reading) return null

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
    const prev = { tags: reading.tags, notes: reading.notes }
    // optimistic
    useReadingsStore.setState(state => ({
      readings: state.readings.map(r => r.id === readingId ? { ...r, tags: parsedTags, notes } : r),
      byId: { ...state.byId, [readingId]: { ...state.byId[readingId], tags: parsedTags, notes } }
    }))
    try {
      await updateReading(readingId, { tags: parsedTags, notes })
      import('@/lib/actionTracker').then(m=>m.track('reading:update_meta',{id: readingId, tags: parsedTags.length, hasNotes: !!notes}))
      onClose()
    } catch (e:any) {
      setError(e?.message || '更新失敗')
      // rollback
      useReadingsStore.setState(state => ({
        readings: state.readings.map(r => r.id === readingId ? { ...r, ...prev } : r),
        byId: { ...state.byId, [readingId]: { ...state.byId[readingId], ...prev } }
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-2 border-pip-boy-green/40 p-4 space-y-4 bg-pip-boy-green/5">
      <h4 className="font-mono text-pip-boy-green font-bold text-sm">編輯標籤 / 筆記</h4>
      <div className="space-y-2">
        <label className="font-mono text-xs text-pip-boy-green/70">標籤（逗號分隔）</label>
        <input
          value={tags}
          onChange={e=>setTags(e.target.value)}
          className="w-full px-2 py-1 bg-black border border-pip-boy-green text-pip-boy-green text-xs font-mono"
          placeholder="ex: 關係, 工作, 旅程"
        />
      </div>
      <div className="space-y-2">
        <label className="font-mono text-xs text-pip-boy-green/70">筆記 / 反思</label>
        <textarea
          value={notes}
          onChange={e=>setNotes(e.target.value)}
          rows={4}
          className="w-full px-2 py-1 bg-black border border-pip-boy-green text-pip-boy-green text-xs font-mono resize-none"
          placeholder="你的想法、驗證、後續行動..."
        />
      </div>
      {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1 border border-pip-boy-green/40 text-xs font-mono text-pip-boy-green hover:bg-pip-boy-green/10">取消</button>
        <button disabled={saving} onClick={handleSave} className="px-3 py-1 bg-pip-boy-green text-wasteland-dark text-xs font-mono font-bold disabled:opacity-50">{saving ? '儲存中...' : '儲存'}</button>
      </div>
    </div>
  )
}
