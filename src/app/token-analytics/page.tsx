'use client';

/**
 * Token Extension Analytics Dashboard
 *
 * Pip-Boy 風格的 Token 延長分析儀表板
 * - 統計卡片（總延長次數、成功率、平均延長時間）
 * - 每日趨勢圖表
 * - 歷史記錄列表
 */

import { useEffect, useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import {
  getTokenExtensionStats,
  getTokenExtensionHistory,
  type TokenExtensionStats,
  type TokenExtensionHistory } from
'@/lib/api/token-extension-analytics';import { Button } from "@/components/ui/button";

export default function TokenAnalyticsPage() {
  const [stats, setStats] = useState<TokenExtensionStats | null>(null);
  const [history, setHistory] = useState<TokenExtensionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'activity' | 'loyalty'>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // 載入資料
  useEffect(() => {
    loadData();
  }, [timeRange, filterType]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // 計算日期範圍
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90d') {
        startDate.setDate(endDate.getDate() - 90);
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // 載入統計和歷史
      const [statsData, historyData] = await Promise.all([
      getTokenExtensionStats(startDateStr, endDateStr),
      getTokenExtensionHistory(
        filterType === 'all' ? undefined : filterType,
        startDateStr,
        endDateStr,
        100
      )]
      );

      setStats(statsData);
      setHistory(historyData);
    } catch (err: any) {
      console.error('載入 Token Analytics 失敗:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  // 載入中
  if (loading && !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <PixelIcon
              name="loader"
              sizePreset="xl"
              variant="primary"
              animation="spin"
              decorative />

            <p className="mt-4 text-pip-boy-green">載入中...</p>
          </div>
        </div>
      </div>);

  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <PixelIcon
              name="alert"
              sizePreset="xl"
              variant="error"
              animation="wiggle"
              decorative />

            <p className="mt-4 text-red-500">錯誤：{error}</p>
            <Button size="default" variant="link"
            onClick={loadData}
            className="mt-4 px-4 py-2 font-bold">

              重新載入
            </Button>
          </div>
        </div>
      </div>);

  }

  if (!stats || !history) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-2 border-pip-boy-green p-6 bg-wasteland-darker">
        <div className="flex items-center gap-4 mb-2">
          <PixelIcon name="chart" sizePreset="lg" variant="primary" decorative />
          <h1 className="text-3xl font-bold text-pip-boy-green uppercase tracking-wider">
            Token 延長分析儀表板
          </h1>
        </div>
        <p className="text-pip-boy-green/70 text-sm">
          Pip-Boy Token Extension Analytics System
        </p>
      </div>

      {/* 控制列 */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* 時間範圍選擇 */}
        <div className="flex gap-2">
          <Button size="default" variant="default"
          onClick={() => setTimeRange('7d')}
          className="{expression}">





            7 天
          </Button>
          <Button size="default" variant="default"
          onClick={() => setTimeRange('30d')}
          className="{expression}">





            30 天
          </Button>
          <Button size="default" variant="default"
          onClick={() => setTimeRange('90d')}
          className="{expression}">





            90 天
          </Button>
        </div>

        {/* 延長類型篩選 */}
        <div className="flex gap-2">
          <Button size="default" variant="default"
          onClick={() => setFilterType('all')}
          className="{expression}">





            全部
          </Button>
          <Button size="default" variant="default"
          onClick={() => setFilterType('activity')}
          className="{expression}">





            活躍度
          </Button>
          <Button size="default" variant="default"
          onClick={() => setFilterType('loyalty')}
          className="{expression}">





            忠誠度
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 總延長次數 */}
        <div className="border-2 border-pip-boy-green p-4 bg-wasteland-dark">
          <div className="flex items-center gap-2 mb-2">
            <PixelIcon name="reload" sizePreset="sm" variant="primary" decorative />
            <p className="text-pip-boy-green/70 text-xs uppercase">總延長次數</p>
          </div>
          <p className="text-3xl font-bold text-pip-boy-green font-mono">
            {stats.total_extensions}
          </p>
          <div className="mt-2 text-xs text-pip-boy-green/50">
            <span>活躍度: {stats.activity_extensions}</span>
            <span className="mx-2">|</span>
            <span>忠誠度: {stats.loyalty_extensions}</span>
          </div>
        </div>

        {/* 總延長時間 */}
        <div className="border-2 border-pip-boy-green p-4 bg-wasteland-dark">
          <div className="flex items-center gap-2 mb-2">
            <PixelIcon name="clock" sizePreset="sm" variant="primary" decorative />
            <p className="text-pip-boy-green/70 text-xs uppercase">總延長時間</p>
          </div>
          <p className="text-3xl font-bold text-pip-boy-green font-mono">
            {stats.total_minutes_extended}
          </p>
          <p className="mt-2 text-xs text-pip-boy-green/50">分鐘</p>
        </div>

        {/* 平均延長時間 */}
        <div className="border-2 border-pip-boy-green p-4 bg-wasteland-dark">
          <div className="flex items-center gap-2 mb-2">
            <PixelIcon name="chart-bar" sizePreset="sm" variant="primary" decorative />
            <p className="text-pip-boy-green/70 text-xs uppercase">平均延長時間</p>
          </div>
          <p className="text-3xl font-bold text-pip-boy-green font-mono">
            {stats.average_extension_minutes}
          </p>
          <p className="mt-2 text-xs text-pip-boy-green/50">分鐘/次</p>
        </div>

        {/* 成功率 */}
        <div className="border-2 border-pip-boy-green p-4 bg-wasteland-dark">
          <div className="flex items-center gap-2 mb-2">
            <PixelIcon name="check-circle" sizePreset="sm" variant="success" decorative />
            <p className="text-pip-boy-green/70 text-xs uppercase">成功率</p>
          </div>
          <p className="text-3xl font-bold text-pip-boy-green font-mono">
            {stats.success_rate}%
          </p>
          <p className="mt-2 text-xs text-pip-boy-green/50">
            {stats.total_extensions > 0 ?
            `${Math.round(stats.success_rate / 100 * stats.total_extensions)}/${stats.total_extensions} 次成功` :
            '尚無資料'}
          </p>
        </div>
      </div>

      {/* 每日統計趨勢 */}
      <div className="mb-8 border-2 border-pip-boy-green p-6 bg-wasteland-dark">
        <h2 className="text-xl font-bold text-pip-boy-green uppercase mb-4 flex items-center gap-2">
          <PixelIcon name="chart-line" sizePreset="md" variant="primary" decorative />
          每日統計趨勢
        </h2>

        {stats.daily_stats.length === 0 ?
        <p className="text-pip-boy-green/50 text-center py-8">尚無統計資料</p> :

        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* 簡易圖表（使用 CSS 條形圖） */}
              <div className="space-y-2">
                {stats.daily_stats.map((day) => {
                const maxTotal = Math.max(...stats.daily_stats.map((d) => d.total));
                const barWidth = maxTotal > 0 ? day.total / maxTotal * 100 : 0;

                return (
                  <div key={day.date} className="flex items-center gap-4">
                      <div className="w-24 text-xs text-pip-boy-green/70 font-mono">
                        {new Date(day.date).toLocaleDateString('zh-TW', {
                        month: '2-digit',
                        day: '2-digit'
                      })}
                      </div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-wasteland-darker border border-pip-boy-green/30">
                          <div
                          className="absolute inset-y-0 left-0 bg-pip-boy-green/30 border-r-2 border-pip-boy-green transition-all duration-300"
                          style={{ width: `${barWidth}%` }} />

                          <div className="absolute inset-0 flex items-center px-2 text-xs text-pip-boy-green font-mono">
                            <span>
                              總計: {day.total} ({day.activity}活 / {day.loyalty}忠) ⏱{' '}
                              {day.minutes_extended}分
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>);

              })}
              </div>
            </div>
          </div>
        }
      </div>

      {/* 歷史記錄列表 */}
      <div className="border-2 border-pip-boy-green p-6 bg-wasteland-dark">
        <h2 className="text-xl font-bold text-pip-boy-green uppercase mb-4 flex items-center gap-2">
          <PixelIcon name="list" sizePreset="md" variant="primary" decorative />
          歷史記錄 ({history.total_count} 筆)
        </h2>

        {history.extensions.length === 0 ?
        <p className="text-pip-boy-green/50 text-center py-8">尚無歷史記錄</p> :

        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-pip-boy-green/50">
                  <th className="text-left py-2 px-4 text-pip-boy-green uppercase text-xs">
                    時間
                  </th>
                  <th className="text-left py-2 px-4 text-pip-boy-green uppercase text-xs">
                    類型
                  </th>
                  <th className="text-left py-2 px-4 text-pip-boy-green uppercase text-xs">
                    延長時間
                  </th>
                  <th className="text-left py-2 px-4 text-pip-boy-green uppercase text-xs">
                    狀態
                  </th>
                  <th className="text-left py-2 px-4 text-pip-boy-green uppercase text-xs">
                    備註
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.extensions.map((ext, index) =>
              <tr
                key={ext.id || index}
                className="border-b border-pip-boy-green/20 hover:bg-pip-boy-green/10">

                    <td className="py-2 px-4 text-pip-boy-green/80 font-mono text-xs">
                      {ext.readable_time}
                    </td>
                    <td className="py-2 px-4 text-pip-boy-green/80">
                      <span
                    className={`px-2 py-1 text-xs border ${
                    ext.event_data.extension_type === 'activity' ?
                    'border-blue-500 bg-blue-500/20 text-blue-300' :
                    'border-yellow-500 bg-yellow-500/20 text-yellow-300'}`
                    }>

                        {ext.type_text}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-pip-boy-green font-mono">
                      {ext.event_data.extension_minutes} 分鐘
                    </td>
                    <td className="py-2 px-4">
                      {ext.event_data.success ?
                  <span className="flex items-center gap-1 text-green-400">
                          <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
                          {ext.success_text}
                        </span> :

                  <span className="flex items-center gap-1 text-red-400">
                          <PixelIcon name="close" sizePreset="xs" variant="error" decorative />
                          {ext.success_text}
                        </span>
                  }
                    </td>
                    <td className="py-2 px-4 text-pip-boy-green/60 text-xs">
                      {ext.event_data.reason || '-'}
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* 最後更新時間 */}
      <div className="mt-4 text-center text-pip-boy-green/50 text-xs">
        <p>最後更新: {new Date().toLocaleString('zh-TW')}</p>
      </div>
    </div>);

}