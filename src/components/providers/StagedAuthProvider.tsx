'use client'

/**
 * StagedAuthProvider - 分階段 Auth 初始化
 *
 * 設計理念（基於用戶選擇：分階段初始化 - 最小化後擴充）：
 * 1. Stage 1 (Fast Check) - 快速檢查本地 token，不阻擋渲染
 * 2. Stage 2 (Full Validation) - 完整驗證，背景執行
 *
 * 解決的問題：
 * - 移除 pathname 依賴，避免 useEffect 循環
 * - 使用 ref 追蹤初始化狀態，避免重複執行
 * - 不阻擋頁面渲染，先顯示內容再驗證
 */

import React, { useEffect, useRef, ReactNode } from 'react'
import { useAuthStore } from '@/lib/authStore'

interface StagedAuthProviderProps {
  children: ReactNode
  /**
   * 是否需要完整初始化
   * - true: 執行完整 auth 初始化（用於需要 auth 的頁面）
   * - false: 只執行快速檢查（用於公開頁面）
   */
  requireAuth?: boolean
}

/**
 * StagedAuthProvider - 分階段 Auth 初始化
 *
 * 階段 1: 快速檢查（不阻擋渲染）
 * - 檢查 localStorage 是否有 token
 * - 設定基本狀態
 * - 允許頁面立即顯示
 *
 * 階段 2: 完整驗證（背景執行）
 * - 驗證 token 有效性
 * - 載入用戶資料
 * - 更新 UI 狀態
 */
export function StagedAuthProvider({ children, requireAuth = true }: StagedAuthProviderProps) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)

  // 使用 ref 追蹤初始化狀態，避免重複執行
  const hasInitialized = useRef(false)
  const isInitializing = useRef(false)

  useEffect(() => {
    // 如果已經初始化過或正在初始化，跳過
    if (hasInitialized.current || isInitializing.current) {
      return
    }

    // 如果不需要 auth，也跳過初始化
    if (!requireAuth) {
      return
    }

    // 標記正在初始化
    isInitializing.current = true

    // 執行分階段初始化
    initialize(() => {
      // Progress callback - 可以用於顯示進度（如果需要）
      // 但不應該阻擋渲染
    }).finally(() => {
      // 初始化完成
      hasInitialized.current = true
      isInitializing.current = false
    })
  }, [initialize, requireAuth])

  // 關鍵改變：直接渲染 children，不等待初始化完成
  // Auth 狀態會在背景更新，UI 會自動反應
  return <>{children}</>
}

/**
 * useAuthReady - Hook 讓組件知道 Auth 是否已準備好
 *
 * 使用場景：
 * - 需要等待 auth 狀態的組件（例如保護的內容）
 * - 條件性顯示（登入/登出狀態）
 *
 * 不使用場景：
 * - 公開頁面（不需要等待）
 * - 404 頁面（不需要 auth）
 */
export function useAuthReady() {
  const isInitialized = useAuthStore(s => s.isInitialized)
  const user = useAuthStore(s => s.user)

  return {
    isReady: isInitialized,
    isAuthenticated: !!user,
    user
  }
}
