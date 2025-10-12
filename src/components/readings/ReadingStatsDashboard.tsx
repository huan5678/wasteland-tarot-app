'use client'
import React, { useMemo, useState } from 'react'
import { useReadingsStore, ReadingStatistics } from '@/lib/readingsStore'
import { PixelIcon } from '@/components/ui/icons'

export function ReadingStatsDashboard() {
  const { calculateStatistics, getReadingsByPeriod, readings, categories } = useReadingsStore()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  const stats = useMemo(() => calculateStatistics(), [calculateStatistics])
  const periodReadings = useMemo(() => getReadingsByPeriod(selectedPeriod), [getReadingsByPeriod, selectedPeriod])

  // Calculate additional insights
  const insights = useMemo(() => {
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentReadings = readings.filter(r =>
      r.created_at && new Date(r.created_at) > lastWeek
    )

    // Most active day of week
    const dayStats = Array(7).fill(0)
    readings.forEach(r => {
      if (r.created_at) {
        const day = new Date(r.created_at).getDay()
        dayStats[day]++
      }
    })
    const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    const mostActiveDay = dayNames[dayStats.indexOf(Math.max(...dayStats))]

    // Most active month
    const monthStats: Record<string, number> = {}
    readings.forEach(r => {
      if (r.created_at) {
        const month = new Date(r.created_at).toISOString().substring(0, 7)
        monthStats[month] = (monthStats[month] || 0) + 1
      }
    })
    const mostActiveMonth = Object.entries(monthStats).sort((a, b) => b[1] - a[1])[0]

    // Average time between readings
    const sortedDates = readings
      .filter(r => r.created_at)
      .map(r => new Date(r.created_at!))
      .sort((a, b) => a.getTime() - b.getTime())

    let avgDaysBetween = 0
    if (sortedDates.length > 1) {
      const intervals = []
      for (let i = 1; i < sortedDates.length; i++) {
        const days = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (24 * 60 * 60 * 1000)
        intervals.push(days)
      }
      avgDaysBetween = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    }

    return {
      recentReadings: recentReadings.length,
      mostActiveDay,
      mostActiveMonth: mostActiveMonth ? {
        month: mostActiveMonth[0],
        count: mostActiveMonth[1]
      } : null,
      avgDaysBetween
    }
  }, [readings])

  // Chart data for popular spreads
  const spreadChartData = useMemo(() => {
    const maxCount = Math.max(...Object.values(stats.readings_by_spread))
    return Object.entries(stats.readings_by_spread).map(([spread, count]) => ({
      name: spread === 'single' ? '單張' : spread === 'three_card' ? '三張' : spread === 'celtic_cross' ? '凱爾特十字' : spread,
      count,
      percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
    })).sort((a, b) => b.count - a.count)
  }, [stats.readings_by_spread])

  // Chart data for monthly activity
  const monthlyChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return date.toISOString().substring(0, 7)
    }).reverse()

    return last6Months.map(month => ({
      month,
      count: stats.readings_by_month[month] || 0,
      displayMonth: new Date(month + '-01').toLocaleDateString('zh-TW', { month: 'short' })
    }))
  }, [stats.readings_by_month])

  // Top tags data
  const topTagsData = useMemo(() => {
    return Object.entries(stats.most_used_tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }))
  }, [stats.most_used_tags])

  // Top cards data
  const topCardsData = useMemo(() => {
    return Object.entries(stats.most_used_cards)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([card, count]) => ({ card, count }))
  }, [stats.most_used_cards])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pip-boy-green">占卜統計</h2>
          <p className="text-pip-boy-green/70 text-sm">你的塔羅之旅數據分析</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                     focus:border-pip-boy-green focus:outline-none"
          >
            <option value="week">最近一週</option>
            <option value="month">最近一月</option>
            <option value="year">最近一年</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
          <div className="text-3xl font-bold text-pip-boy-green numeric tabular-nums mb-2">
            {stats.total_readings}
          </div>
          <div className="text-pip-boy-green/70 text-sm flex items-center justify-center gap-1">
            < PixelIcon name="spade" className="w-4 h-4" />
            總占卜次數
          </div>
        </div>

        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400 numeric tabular-nums mb-2">
            {stats.favorite_readings}
          </div>
          <div className="text-pip-boy-green/70 text-sm flex items-center justify-center gap-1">
            < PixelIcon name="star" className="w-4 h-4" />
            最愛占卜
          </div>
        </div>

        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
          <div className="text-3xl font-bold text-orange-400 numeric tabular-nums mb-2">
            {stats.reading_streak}
          </div>
          <div className="text-pip-boy-green/70 text-sm flex items-center justify-center gap-1">
            < PixelIcon name="flame" className="w-4 h-4" />
            連續天數
          </div>
        </div>

        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
          <div className="text-3xl font-bold text-blue-400 numeric tabular-nums mb-2">
            {periodReadings.length}
          </div>
          <div className="text-pip-boy-green/70 text-sm flex items-center justify-center gap-1">
            < PixelIcon name="trending-up" className="w-4 h-4" />
            {selectedPeriod === 'week' ? '本週' : selectedPeriod === 'month' ? '本月' : '今年'}占卜
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
        <h3 className="font-bold text-pip-boy-green mb-3 flex items-center gap-2">
          < PixelIcon name="target" className="w-5 h-5" />
          智能洞察
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-pip-boy-green/70">最活躍日</div>
            <div className="text-pip-boy-green font-bold">{insights.mostActiveDay}</div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">最近一週</div>
            <div className="text-pip-boy-green font-bold numeric tabular-nums">{insights.recentReadings} 次占卜</div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">平均間隔</div>
            <div className="text-pip-boy-green font-bold numeric tabular-nums">{insights.avgDaysBetween} 天</div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">最活躍月份</div>
            <div className="text-pip-boy-green font-bold">
              {insights.mostActiveMonth ? new Date(insights.mostActiveMonth.month + '-01').toLocaleDateString('zh-TW', { month: 'long' }) : '無'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spread Type Distribution */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <h3 className="font-bold text-pip-boy-green mb-4 flex items-center gap-2">
            < PixelIcon name="bar-chart-3" className="w-5 h-5" />
            牌陣使用分佈
          </h3>
          <div className="space-y-3">
            {spreadChartData.map((item, index) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-pip-boy-green">{item.name}</span>
                  <span className="numeric text-sm text-pip-boy-green font-bold tabular-nums">{item.count}</span>
                </div>
                <div className="w-full bg-pip-boy-green/20 h-2">
                  <div
                    className="h-2 bg-pip-boy-green transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <h3 className="font-bold text-pip-boy-green mb-4 flex items-center gap-2">
            < PixelIcon name="calendar" className="w-5 h-5" />
            月度活躍度
          </h3>
          <div className="space-y-2">
            {monthlyChartData.map(item => {
              const maxCount = Math.max(...monthlyChartData.map(d => d.count))
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
              return (
                <div key={item.month} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-pip-boy-green/70">
                    {item.displayMonth}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-pip-boy-green/20 h-3">
                      <div
                        className="h-3 bg-pip-boy-green transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 numeric text-xs text-pip-boy-green font-bold text-right tabular-nums">
                    {item.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Tags */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <h3 className="font-bold text-pip-boy-green mb-4 flex items-center gap-2">
            < PixelIcon name="hash" className="w-5 h-5" />
            熱門標籤
          </h3>
          <div className="space-y-2">
            {topTagsData.length > 0 ? (
              topTagsData.map((item, index) => (
                <div key={item.tag} className="flex items-center justify-between p-2 bg-pip-boy-green/10">
                  <div className="flex items-center gap-2">
                    <div className="text-pip-boy-green/60 text-xs w-4">#{index + 1}</div>
                    <div className="text-sm text-pip-boy-green">{item.tag}</div>
                  </div>
                  <div className="numeric text-sm text-pip-boy-green font-bold tabular-nums">{item.count}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-pip-boy-green/60 text-sm py-4">
                尚無標籤數據
              </div>
            )}
          </div>
        </div>

        {/* Top Cards */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <h3 className="font-bold text-pip-boy-green mb-4 flex items-center gap-2">
            < PixelIcon name="award" className="w-5 h-5" />
            常見卡牌
          </h3>
          <div className="space-y-2">
            {topCardsData.length > 0 ? (
              topCardsData.map((item, index) => (
                <div key={item.card} className="flex items-center justify-between p-2 bg-pip-boy-green/10">
                  <div className="flex items-center gap-2">
                    <div className="text-pip-boy-green/60 text-xs w-4">#{index + 1}</div>
                    <div className="text-sm text-pip-boy-green">{item.card}</div>
                  </div>
                  <div className="numeric text-sm text-pip-boy-green font-bold tabular-nums">{item.count}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-pip-boy-green/60 text-sm py-4">
                尚無卡牌數據
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
        <h3 className="font-bold text-pip-boy-green mb-3 flex items-center gap-2">
          < PixelIcon name="clock" className="w-5 h-5" />
          其他統計
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-pip-boy-green/70">平均解讀長度</div>
            <div className="text-pip-boy-green font-bold numeric tabular-nums">{stats.average_interpretation_length} 字</div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">最後占卜</div>
            <div className="text-pip-boy-green font-bold">
              {stats.last_reading_date ? new Date(stats.last_reading_date).toLocaleDateString() : '無'}
            </div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">使用標籤數</div>
            <div className="text-pip-boy-green font-bold numeric tabular-nums">{Object.keys(stats.most_used_tags).length}</div>
          </div>
          <div>
            <div className="text-pip-boy-green/70">不同卡牌數</div>
            <div className="text-pip-boy-green font-bold numeric tabular-nums">{Object.keys(stats.most_used_cards).length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}