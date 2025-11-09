'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { remark } from 'remark'
import stripMarkdown from 'strip-markdown'
import { PixelIcon } from '@/components/ui/icons'

/**
 * MarkdownEditor Props
 */
export interface MarkdownEditorProps {
  /** 初始 Markdown 內容 */
  initialContent?: string

  /** 內容變更回調 */
  onChange?: (content: string) => void

  /** 字數上限（純文字長度） */
  maxLength: number

  /** 提交按鈕文字 */
  submitButtonText?: string

  /** 提交回調 */
  onSubmit?: (content: string) => Promise<void>

  /** 載入狀態 */
  isLoading?: boolean

  /** Placeholder 文字 */
  placeholder?: string

  /** 是否顯示取消按鈕 */
  showCancelButton?: boolean

  /** 取消回調 */
  onCancel?: () => void
}

/**
 * Markdown 工具列按鈕配置
 */
const TOOLBAR_BUTTONS = [
  { id: 'bold', icon: 'bold', label: '粗體', syntax: '**', placeholder: '粗體文字' },
  { id: 'italic', icon: 'italic', label: '斜體', syntax: '*', placeholder: '斜體文字' },
  { id: 'list', icon: 'list-unordered', label: '清單', syntax: '- ', placeholder: '清單項目', newLine: true },
  { id: 'link', icon: 'link', label: '連結', syntax: '[', suffix: '](url)', placeholder: '連結文字' },
  { id: 'code', icon: 'code-box-line', label: '程式碼區塊', syntax: '```\n', suffix: '\n```', placeholder: '程式碼' },
  { id: 'quote', icon: 'double-quotes-l', label: '引用區塊', syntax: '> ', placeholder: '引用內容', newLine: true },
] as const

/**
 * 計算純文字長度（移除 Markdown 語法）
 */
async function getPlainTextLength(markdown: string): Promise<number> {
  if (!markdown.trim()) return 0

  try {
    const processed = await remark()
      .use(stripMarkdown)
      .process(markdown)

    return processed.toString().trim().length
  } catch (error) {
    console.error('[MarkdownEditor] 計算純文字長度時發生錯誤:', error)
    // 降級處理：返回原始文字長度
    return markdown.length
  }
}

/**
 * MarkdownEditor 元件
 *
 * **功能**:
 * - 上方編輯區：多行文字輸入框
 * - 下方預覽區：即時 Markdown 渲染
 * - Markdown 工具列：快速插入語法
 * - 即時字數統計：計算純文字長度（延遲 200ms）
 * - 字數警告：超過限制時顯示紅色警告
 * - 提交按鈕：呼叫 onSubmit 回調
 *
 * **使用範例**:
 * ```tsx
 * <MarkdownEditor
 *   maxLength={500}
 *   onSubmit={async (content) => {
 *     await wishlistStore.submitWish(content)
 *   }}
 *   placeholder="分享你的願望..."
 * />
 * ```
 */
export default function MarkdownEditor({
  initialContent = '',
  onChange,
  maxLength,
  submitButtonText = '提交',
  onSubmit,
  isLoading = false,
  placeholder = '在此輸入 Markdown 格式的內容...',
  showCancelButton = false,
  onCancel,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [plainTextLength, setPlainTextLength] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // 更新字數統計（延遲 200ms）
  const updateCharCount = useCallback((text: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      const length = await getPlainTextLength(text)
      setPlainTextLength(length)
    }, 200)
  }, [])

  // 內容變更處理
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    onChange?.(value)
    updateCharCount(value)
  }, [onChange, updateCharCount])

  // 初始化字數統計
  useEffect(() => {
    updateCharCount(initialContent)
  }, [initialContent, updateCharCount])

  // 清理 debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 工具列按鈕點擊處理
  const handleToolbarClick = useCallback((button: typeof TOOLBAR_BUTTONS[number]) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const hasSelection = selectedText.length > 0

    let newText = ''
    let cursorPosition = start

    if (button.newLine) {
      // 清單、引用等需要換行的語法
      const beforeCursor = content.substring(0, start)
      const afterCursor = content.substring(end)
      const needsNewLineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      const prefix = needsNewLineBefore ? '\n' : ''

      if (hasSelection) {
        // 包裹選取的文字
        newText = `${beforeCursor}${prefix}${button.syntax}${selectedText}${afterCursor}`
        cursorPosition = start + prefix.length + button.syntax.length + selectedText.length
      } else {
        // 插入語法與 placeholder
        newText = `${beforeCursor}${prefix}${button.syntax}${button.placeholder}${afterCursor}`
        cursorPosition = start + prefix.length + button.syntax.length
      }
    } else if (button.suffix) {
      // 有前綴和後綴的語法（如連結、程式碼區塊）
      const beforeCursor = content.substring(0, start)
      const afterCursor = content.substring(end)

      if (hasSelection) {
        // 包裹選取的文字
        newText = `${beforeCursor}${button.syntax}${selectedText}${button.suffix}${afterCursor}`
        cursorPosition = start + button.syntax.length + selectedText.length
      } else {
        // 插入語法與 placeholder
        newText = `${beforeCursor}${button.syntax}${button.placeholder}${button.suffix}${afterCursor}`
        cursorPosition = start + button.syntax.length
      }
    } else {
      // 一般的包裹語法（如粗體、斜體）
      const beforeCursor = content.substring(0, start)
      const afterCursor = content.substring(end)

      if (hasSelection) {
        // 包裹選取的文字
        newText = `${beforeCursor}${button.syntax}${selectedText}${button.syntax}${afterCursor}`
        cursorPosition = start + button.syntax.length + selectedText.length
      } else {
        // 插入語法與 placeholder
        newText = `${beforeCursor}${button.syntax}${button.placeholder}${button.syntax}${afterCursor}`
        cursorPosition = start + button.syntax.length
      }
    }

    handleContentChange(newText)

    // 延遲設定游標位置（確保 textarea 已更新）
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPosition, cursorPosition)
    }, 0)
  }, [content, handleContentChange])

  // 提交處理
  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      alert('內容不可為空白')
      return
    }

    if (plainTextLength > maxLength) {
      alert(`內容超過字數限制（${plainTextLength}/${maxLength}）`)
      return
    }

    if (onSubmit) {
      await onSubmit(content)
    }
  }, [content, plainTextLength, maxLength, onSubmit])

  // 字數警告狀態
  const isOverLimit = plainTextLength > maxLength
  const isNearLimit = plainTextLength > maxLength * 0.9

  return (
    <div className="flex flex-col gap-4">
      {/* Markdown 工具列 */}
      <div className="flex items-center gap-2 border-b border-pip-boy-green/30 pb-3">
        <span className="text-sm text-pip-boy-green/70">工具列：</span>
        {TOOLBAR_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => handleToolbarClick(button)}
            className="group flex items-center justify-center w-8 h-8 rounded border border-pip-boy-green/50 hover:bg-pip-boy-green/10 transition-colors"
            aria-label={button.label}
            title={button.label}
          >
            <PixelIcon
              name={button.icon}
              sizePreset="sm"
              variant="primary"
              className="group-hover:scale-110 transition-transform"
            />
          </button>
        ))}
      </div>

      {/* 上方編輯區 */}
      <div className="flex flex-col gap-2">
        <label htmlFor="markdown-editor" className="text-sm font-bold text-pip-boy-green">
          編輯區
        </label>
        <textarea
          id="markdown-editor"
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-48 px-4 py-3 bg-black/50 border border-pip-boy-green/50 rounded text-pip-boy-green placeholder-pip-boy-green/30 focus:outline-none focus:border-pip-boy-green resize-none"
          role="textbox"
          aria-multiline="true"
          aria-label="Markdown 編輯區"
        />

        {/* 字數統計 */}
        <div className="flex items-center justify-between text-sm">
          <span className={`${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-pip-boy-green/70'}`}>
            {plainTextLength} / {maxLength} 字
            {isOverLimit && ` (超過 ${plainTextLength - maxLength} 字)`}
          </span>
          {isOverLimit && (
            <span className="text-red-500 text-xs">
              <PixelIcon name="error-warning" sizePreset="xs" variant="error" decorative className="inline mr-1" />
              超過字數限制
            </span>
          )}
        </div>
      </div>

      {/* 下方預覽區 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-pip-boy-green">
          預覽區
        </label>
        <div
          className="w-full min-h-48 max-h-96 overflow-y-auto px-4 py-3 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded"
          role="region"
          aria-label="Markdown 預覽"
        >
          {content.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize, rehypeHighlight]}
              className="prose prose-invert prose-sm max-w-none text-pip-boy-green/90"
            >
              {content}
            </ReactMarkdown>
          ) : (
            <p className="text-pip-boy-green/30 text-sm italic">預覽區將顯示渲染後的內容...</p>
          )}
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !content.trim() || isOverLimit}
          className="flex items-center gap-2 px-6 py-2 bg-pip-boy-green text-black font-bold rounded hover:bg-pip-boy-green/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <PixelIcon name="loader-4" animation="spin" sizePreset="sm" decorative />
              <span>提交中...</span>
            </>
          ) : (
            <>
              <PixelIcon name="send" sizePreset="sm" decorative />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>

        {showCancelButton && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-pip-boy-green/50 text-pip-boy-green rounded hover:bg-pip-boy-green/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}
