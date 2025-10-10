'use client'
import React, { useEffect, useMemo } from 'react'
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore'

interface Props {
  value: string
  onChange: (spreadType: string) => void
}

export function SpreadSelector({ value, onChange }: Props) {
  const fetchAll = useSpreadTemplatesStore(s => s.fetchAll)
  const templates = useSpreadTemplatesStore(s => s.templates)
  const sortedTemplates = useMemo(()=> {
    const diffRank: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }
    return [...templates].sort((a,b)=> (diffRank[a.difficulty_level||'intermediate'] - diffRank[b.difficulty_level||'intermediate']) || ((b.usage_count||0) - (a.usage_count||0)))
  }, [templates])
  const isLoading = useSpreadTemplatesStore(s => s.isLoading)

  useEffect(() => { fetchAll().catch(()=>{}) }, [fetchAll])

  return (
    <div className="space-y-2">
      <label className="block text-pip-boy-green text-sm">選擇牌陣</label>
      <select
        value={value}
        onChange={e => { const v = e.target.value; onChange(v); import('@/lib/actionTracker').then(m=>m.track('spread:select',{spread:v})) }}
        className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm"
      >
        <option value="single_wasteland">單張占卜 (內建)</option>
        <option value="vault_tec_spread">三張占卜 (內建)</option>
        {sortedTemplates.map(t => (
          // avoid duplicating internal ones
          (t.spread_type === 'single_wasteland' || t.spread_type === 'vault_tec_spread') ? null : (
          <option key={t.id} value={t.spread_type} title={t.description}>
            {(t.display_name || t.name)} ({t.card_count}){t.difficulty_level ? ` [${t.difficulty_level}]` : ''}{t.tags?.length ? ` - ${t.tags.slice(0,2).join('/')}` : ''}
          </option>
        )))}
      </select>
      {isLoading && <p className="text-xs text-pip-boy-green/60">載入牌陣中...</p>}
      {!isLoading && templates.length === 0 && (
        <p className="text-xs text-pip-boy-green/60">尚無可用牌陣模板</p>
      )}
      {value && value !== 'single_wasteland' && value !== 'vault_tec_spread' && (()=>{
        const t = templates.find(t=>t.spread_type===value)
        if(!t) return null
        return (
          <div className="mt-2 border border-pip-boy-green/30 p-3 bg-pip-boy-green/5 text-xs space-y-1">
            <div><span className="text-pip-boy-green/70">牌數:</span> {t.card_count} | <span className="text-pip-boy-green/70">難度:</span> {t.difficulty_level || 'intermediate'}</div>
            {t.tags?.length ? <div className="flex flex-wrap gap-1">{t.tags.slice(0,6).map(tag=> <span key={tag} className="px-1 py-0.5 border border-pip-boy-green/40 text-pip-boy-green/80">{tag}</span>)}</div> : null}
            {t.interpretation_guide && <div className="text-pip-boy-green/60 leading-snug whitespace-pre-line">{t.interpretation_guide.slice(0,160)}{t.interpretation_guide.length>160?'...':''}</div>}
          </div>
        )
      })()}
    </div>
  )
}
