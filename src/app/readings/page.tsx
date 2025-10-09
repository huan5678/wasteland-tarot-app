'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'
import { useReadingsStore } from '@/lib/readingsStore'
import { Lock, List, BarChart3, BookOpen, Settings } from 'lucide-react'
import { ReadingHistory } from '@/components/readings/ReadingHistory'
import { ReadingDetailModal } from '@/components/readings/ReadingDetailModal'
import { ReadingStatsDashboard } from '@/components/readings/ReadingStatsDashboard'
import { ReadingTemplates } from '@/components/readings/ReadingTemplates'
import { CategoryManager } from '@/components/readings/CategoryManager'
import { TagsManager } from '@/components/readings/TagsManager'

export default function ReadingsPage() {
  const user = useAuthStore(s => s.user)
  const isLoading = useReadingsStore(s => s.isLoading)
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'templates' | 'manage'>('history')

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) return
      await useReadingsStore.getState().fetchUserReadings(user.id)
    }
    fetch()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-wasteland-dark flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 mb-4 mx-auto text-pip-boy-green" />
          <h1 className="text-2xl font-bold text-pip-boy-green font-mono mb-4">
            ACCESS DENIED
          </h1>
          <p className="text-pip-boy-green/70 font-mono mb-6">
            你必須登入才能查看你的占卜記錄
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-pip-boy-green text-wasteland-dark font-mono font-bold hover:bg-pip-boy-green/80 transition-colors"
          >
登入 Pip-Boy
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wasteland-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green font-mono">載入占卜記錄中...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'history', label: '占卜記錄', icon: List },
    { id: 'stats', label: '數據統計', icon: BarChart3 },
    { id: 'templates', label: '占卜模板', icon: BookOpen },
    { id: 'manage', label: '管理設定', icon: Settings },
  ] as const

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return <ReadingHistory onSelect={(id) => setSelectedReadingId(id)} />
      case 'stats':
        return <ReadingStatsDashboard />
      case 'templates':
        return <ReadingTemplates />
      case 'manage':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CategoryManager />
            </div>
            <div className="space-y-6">
              <TagsManager mode="manage" />
            </div>
          </div>
        )
      default:
        return <ReadingHistory onSelect={(id) => setSelectedReadingId(id)} />
    }
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-pip-boy-green font-mono">
                塔羅管理中心
              </h1>
              <p className="text-pip-boy-green/70 font-mono text-sm">個人占卜記錄與數據分析</p>
            </div>
            <Link
              href="/readings/new"
              className="px-4 py-2 bg-pip-boy-green text-wasteland-dark font-mono font-bold hover:bg-pip-boy-green/80 transition-colors"
            >
+ 新占卜
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-mono text-sm border transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                      : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Reading Detail Modal */}
      <ReadingDetailModal id={selectedReadingId} onClose={() => setSelectedReadingId(null)} />
    </div>
  )
}