/**
 * Admin Dashboard - 管理後台首頁
 *
 * 顯示系統統計資料和快速操作
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理後台 | 廢土塔羅 - 系統管理中心',
  description: '廢土塔羅管理後台首頁，查看系統統計資料、用戶分析、占卜數據與快速管理操作。僅供管理員使用。',
  robots: 'noindex, nofollow',
};

'use client'

import { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { useCharacters, useFactions } from '@/hooks/useCharacterVoices'
import { cardsAPI, interpretationsAPI } from '@/lib/api'

interface SystemStats {
  totalCharacters: number
  activeCharacters: number
  totalFactions: number
  activeFactions: number
  totalCards: number
  totalInterpretations: number
}

export default function AdminDashboard() {
  const { characters, isLoading: isLoadingCharacters } = useCharacters()
  const { factions, isLoading: isLoadingFactions } = useFactions()
  const [cardsCount, setCardsCount] = useState(0)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [interpretationsCount, setInterpretationsCount] = useState(0)
  const [isLoadingInterpretations, setIsLoadingInterpretations] = useState(true)

  // 載入卡牌數量
  useEffect(() => {
    const fetchCardsCount = async () => {
      try {
        const cards = await cardsAPI.getAll()
        setCardsCount(cards.length)
      } catch (error) {
        console.error('Failed to fetch cards:', error)
      } finally {
        setIsLoadingCards(false)
      }
    }

    fetchCardsCount()
  }, [])

  // 載入解讀統計
  useEffect(() => {
    const fetchInterpretationsStats = async () => {
      try {
        const stats = await interpretationsAPI.getStats()
        setInterpretationsCount(stats.total_interpretations)
      } catch (error) {
        console.error('Failed to fetch interpretations stats:', error)
      } finally {
        setIsLoadingInterpretations(false)
      }
    }

    fetchInterpretationsStats()
  }, [])

  const stats: SystemStats = {
    totalCharacters: characters?.length || 0,
    activeCharacters: characters?.filter(c => c.is_active).length || 0,
    totalFactions: factions?.length || 0,
    activeFactions: factions?.filter(f => f.is_active).length || 0,
    totalCards: cardsCount,
    totalInterpretations: interpretationsCount,
  }

  const isLoading = isLoadingCharacters || isLoadingFactions || isLoadingCards || isLoadingInterpretations

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入統計資料...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
          系統總覽
        </h2>
        <p className="text-pip-boy-green/70 text-sm uppercase tracking-wider">
          SYSTEM OVERVIEW
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Characters */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <div className="flex items-center gap-4 mb-4">
            <PixelIcon name="user" sizePreset="lg" variant="primary" decorative />
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">角色</h3>
              <p className="text-xs text-pip-boy-green/70 uppercase">CHARACTERS</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">總數：</span>
              <span className="font-bold">{stats.totalCharacters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">啟用：</span>
              <span className="font-bold text-pip-boy-green">{stats.activeCharacters}</span>
            </div>
          </div>
        </div>

        {/* Factions */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <div className="flex items-center gap-4 mb-4">
            <PixelIcon name="flag" sizePreset="lg" variant="primary" decorative />
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">陣營</h3>
              <p className="text-xs text-pip-boy-green/70 uppercase">FACTIONS</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">總數：</span>
              <span className="font-bold">{stats.totalFactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">啟用：</span>
              <span className="font-bold text-pip-boy-green">{stats.activeFactions}</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <div className="flex items-center gap-4 mb-4">
            <PixelIcon name="spade" sizePreset="lg" variant="primary" decorative />
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">卡牌</h3>
              <p className="text-xs text-pip-boy-green/70 uppercase">CARDS</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">總數：</span>
              <span className="font-bold">{stats.totalCards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-pip-boy-green/80 text-sm">解讀：</span>
              <span className="font-bold text-pip-boy-green">{stats.totalInterpretations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold uppercase tracking-wider mb-4">
          快速操作
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/characters"
            className="border-2 border-pip-boy-green/50 hover:border-pip-boy-green hover:bg-pip-boy-green/10 p-6 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <PixelIcon
                name="plus"
                sizePreset="lg"
                variant="primary"
                decorative
                className="group-hover:scale-110 transition-transform"
              />
              <div>
                <h4 className="font-bold text-lg uppercase tracking-wider">新增角色</h4>
                <p className="text-sm text-pip-boy-green/70">建立新的角色聲音</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/factions"
            className="border-2 border-pip-boy-green/50 hover:border-pip-boy-green hover:bg-pip-boy-green/10 p-6 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <PixelIcon
                name="plus"
                sizePreset="lg"
                variant="primary"
                decorative
                className="group-hover:scale-110 transition-transform"
              />
              <div>
                <h4 className="font-bold text-lg uppercase tracking-wider">新增陣營</h4>
                <p className="text-sm text-pip-boy-green/70">建立新的陣營資料</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* System Info */}
      <div className="border-2 border-orange-400/30 bg-orange-500/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <PixelIcon name="info" sizePreset="md" variant="warning" decorative />
          <h3 className="text-lg font-bold uppercase tracking-wider text-orange-400">
            系統資訊
          </h3>
        </div>
        <div className="space-y-2 text-sm text-pip-boy-green/80">
          <p>• 資料庫正規化：完成 3NF 設計</p>
          <p>• API 架構：RESTful API with FastAPI</p>
          <p>• 快取策略：5 分鐘 TTL 客戶端快取</p>
          <p>• 資料來源：PostgreSQL (Supabase)</p>
        </div>
      </div>
    </div>
  )
}
