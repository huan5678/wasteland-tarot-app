'use client'
import React, { useState, useCallback } from 'react'
import { useReadingsStore, ReadingNote } from '@/lib/readingsStore'
import { PixelIcon } from '@/components/ui/icons'

interface Props {
  readingId: string
  onClose?: () => void
}

const NOTE_TYPES = [
  {
    id: 'note',
    name: '一般筆記',
    icon: FileText,
    color: 'text-pip-boy-green',
    bgColor: 'bg-pip-boy-green/5',
    borderColor: 'border-pip-boy-green/30',
    description: '記錄想法和觀察'
  },
  {
    id: 'insight',
    name: '深層洞察',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/5',
    borderColor: 'border-yellow-400/30',
    description: '重要的領悟和啟發'
  },
  {
    id: 'reflection',
    name: '內在反思',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/5',
    borderColor: 'border-pink-400/30',
    description: '情感和內心的反應'
  },
  {
    id: 'follow_up',
    name: '後續追蹤',
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/5',
    borderColor: 'border-blue-400/30',
    description: '需要持續關注的事項'
  }
] as const

export function ReadingNotesSystem({ readingId, onClose }: Props) {
  const { byId, addNote, updateNote, deleteNote } = useReadingsStore()
  const reading = byId[readingId]
  const notes = reading?.detailed_notes || []

  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<ReadingNote | null>(null)
  const [formData, setFormData] = useState({
    content: '',
    type: 'note' as ReadingNote['type']
  })

  const resetForm = () => {
    setFormData({ content: '', type: 'note' })
    setIsCreating(false)
    setEditingNote(null)
  }

  const handleSave = useCallback(async () => {
    if (!formData.content.trim()) return

    try {
      if (editingNote) {
        await updateNote(readingId, editingNote.id, formData.content)
      } else {
        await addNote(readingId, {
          content: formData.content.trim(),
          type: formData.type
        })
      }
      resetForm()
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }, [formData, editingNote, readingId, addNote, updateNote])

  const handleDelete = useCallback(async (noteId: string) => {
    if (!window.confirm('確定要刪除這個筆記嗎？')) return

    try {
      await deleteNote(readingId, noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }, [readingId, deleteNote])

  const startEdit = (note: ReadingNote) => {
    setEditingNote(note)
    setFormData({ content: note.content, type: note.type })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setFormData({ content: '', type: 'note' })
    setEditingNote(null)
  }

  const getNoteTypeInfo = (type: ReadingNote['type']) => {
    return NOTE_TYPES.find(t => t.id === type) || NOTE_TYPES[0]
  }

  const groupedNotes = notes.reduce((acc, note) => {
    const type = note.type || 'note'
    if (!acc[type]) acc[type] = []
    acc[type].push(note)
    return acc
  }, {} as Record<string, ReadingNote[]>)

  if (!reading) {
    return (
      <div className="text-center py-8">
        <div className="text-pip-boy-green/70">找不到占卜記錄</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-pip-boy-green">占卜筆記</h3>
          <p className="text-pip-boy-green/70 text-sm">
            "{reading.question}"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startCreate}
            className="px-3 py-1 border border-pip-boy-green/30 text-pip-boy-green text-sm
                     hover:border-pip-boy-green/60 flex items-center gap-2"
          >
            < PixelIcon name="plus" className="w-4 h-4" />
            新增筆記
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-pip-boy-green/70 hover:text-pip-boy-green"
            >
              < PixelIcon name="x" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Note Creation/Edit Form */}
      {(isCreating || editingNote) && (
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-pip-boy-green">
              {editingNote ? '編輯筆記' : '新增筆記'}
            </h4>
          </div>

          {/* Note Type Selection */}
          <div className="space-y-2">
            <label className="block text-pip-boy-green text-sm font-bold">筆記類型</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {NOTE_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = formData.type === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 border-2 transition-colors text-left ${
                      isSelected
                        ? `${type.borderColor} ${type.bgColor}`
                        : 'border-pip-boy-green/20 hover:border-pip-boy-green/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? type.color : 'text-pip-boy-green/60'}`} />
                      <span className={`text-sm ${isSelected ? type.color : 'text-pip-boy-green/80'}`}>
                        {type.name}
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? type.color.replace('text-', 'text-') + '/80' : 'text-pip-boy-green/50'}`}>
                      {type.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <label className="block text-pip-boy-green text-sm font-bold">筆記內容</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="在此輸入你的筆記..."
              rows={6}
              maxLength={2000}
              className="w-full px-3 py-3 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                       focus:border-pip-boy-green focus:outline-none resize-none"
            />
            <div className="text-xs text-pip-boy-green/60">
              <span className="numeric tabular-nums">{formData.content.length}</span>/<span className="numeric tabular-nums">2000</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green/70 text-sm
                       hover:border-pip-boy-green/60 flex items-center gap-2"
            >
              < PixelIcon name="x" className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.content.trim()}
              className="px-4 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green text-sm
                       hover:bg-pip-boy-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              < PixelIcon name="save" className="w-4 h-4" />
              {editingNote ? '更新' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* Notes Display */}
      <div className="space-y-4">
        {NOTE_TYPES.map(noteType => {
          const notesOfType = groupedNotes[noteType.id] || []
          if (notesOfType.length === 0) return null

          const Icon = noteType.icon

          return (
            <div key={noteType.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${noteType.color}`} />
                <h4 className={`font-bold ${noteType.color}`}>
                  {noteType.name}
                </h4>
                <span className="text-pip-boy-green/60 text-sm">
                  ({notesOfType.length})
                </span>
              </div>

              <div className="space-y-3">
                {notesOfType
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(note => (
                    <div
                      key={note.id}
                      className={`border-2 ${noteType.borderColor} ${noteType.bgColor} p-4`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${noteType.color}`} />
                          <span className="text-xs text-pip-boy-green/60">
                            {new Date(note.created_at).toLocaleString()}
                            {note.updated_at && note.updated_at !== note.created_at && (
                              <span className="ml-2">(已編輯)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1 text-pip-boy-green/60 hover:text-pip-boy-green"
                            title="編輯筆記"
                          >
                            < PixelIcon name="edit-2" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-pip-boy-green/60 hover:text-red-400"
                            title="刪除筆記"
                          >
                            < PixelIcon name="trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className={`${noteType.color} text-sm leading-relaxed whitespace-pre-wrap`}>
                        {note.content}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )
        })}

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center py-12 border-2 border-pip-boy-green/30">
            < PixelIcon name="message-square" className="w-12 h-12 mx-auto mb-4 text-pip-boy-green/40" />
            <div className="text-lg font-bold text-pip-boy-green/70 mb-2">
              尚無筆記
            </div>
            <div className="text-sm text-pip-boy-green/50 mb-4">
              為這個占卜添加你的想法和感悟
            </div>
            <button
              onClick={startCreate}
              className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green text-sm
                       hover:border-pip-boy-green/60 flex items-center gap-2 mx-auto"
            >
              < PixelIcon name="plus" className="w-4 h-4" />
              建立第一個筆記
            </button>
          </div>
        )}
      </div>

      {/* Notes Summary */}
      {notes.length > 0 && (
        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3 flex items-center gap-4 text-sm text-pip-boy-green/70">
          <div>總共 <span className="numeric tabular-nums">{notes.length}</span> 個筆記</div>
          {NOTE_TYPES.map(type => {
            const count = groupedNotes[type.id]?.length || 0
            if (count === 0) return null
            const Icon = type.icon
            return (
              <div key={type.id} className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${type.color}`} />
                <span>{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}