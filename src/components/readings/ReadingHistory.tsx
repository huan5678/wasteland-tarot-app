'use client'
import React, { useMemo, useState, useCallback } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { Star, Save, Spade } from 'lucide-react'

interface Props { onSelect?: (id: string) => void }

export function ReadingHistory({ onSelect }: Props) {
  const readings = useReadingsStore(s => s.readings)
  const toggleFavorite = useReadingsStore(s => s.toggleFavorite)
  const [filter, setFilter] = useState<'all' | 'single' | 'three_card' | 'favorites'>('all')
  const [tagFilter, setTagFilter] = useState('')
  const [tagMode, setTagMode] = useState<'any' | 'all'>('any')
  const [sortBy, setSortBy] = useState<'date' | 'question'>('date')
  const [search, setSearch] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    readings.forEach(r => (r.tags || []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [readings])

  const filtered = useMemo(() => {
    return readings
      .filter(r => {
        if (tagFilter.trim()) {
          const want = tagFilter.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean)
          if (!want.length) return true
          const tags = (r.tags || []).map(t=>t.toLowerCase())
          if (tagMode === 'any') {
            if (!want.some(w => tags.includes(w))) return false
          } else { // all
            if (!want.every(w => tags.includes(w))) return false
          }
        }
        return true
      })
      .filter(r => {
        if (filter === 'favorites') return r.is_favorite
        if (filter === 'all') return true
        return r.spread_type === filter
      })
      .filter(r => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return r.question.toLowerCase().includes(q) || (r.interpretation || '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date((b as any).created_at || (b as any).date).getTime() - new Date((a as any).created_at || (a as any).date).getTime()
        return a.question.localeCompare(b.question)
      })
  }, [readings, filter, sortBy, search])

  const formatDate = (d: string) => new Date(d).toLocaleString()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="flex flex-col gap-1">
          <input placeholder="標籤過濾 (逗號分隔)" value={tagFilter} onChange={e=>setTagFilter(e.target.value)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-sm" />
          <div className="flex items-center gap-2">
            <select value={tagMode} onChange={e=>setTagMode(e.target.value as any)} className="px-2 py-1 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-[10px]">
              <option value="any">任一</option>
              <option value="all">全部</option>
            </select>
            <div className="flex-1">
              <select onChange={e=>{ const v=e.target.value; if(!v)return; setTagFilter(tf=> tf ? (tf.split(',').map(t=>t.trim()).includes(v)? tf : tf+','+v) : v) }} className="w-full px-2 py-1 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-[10px]">
                <option value="">(標籤快速加入)</option>
                {allTags.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <input placeholder="標籤過濾 (完整匹配)" value={tagFilter} onChange={e=>setTagFilter(e.target.value)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-sm" />
        <input placeholder="搜尋問題/解讀..." value={search} onChange={e=>setSearch(e.target.value)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-sm" />
        <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-sm">
          <option value="all">全部</option>
          <option value="single">單張</option>
          <option value="three_card">三張</option>
          <option value="favorites">最愛</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green font-mono text-sm">
          <option value="date">日期</option>
          <option value="question">問題</option>
        </select>
        <div className="flex items-center text-xs font-mono text-pip-boy-green/70">顯示 <span className="numeric tabular-nums mx-1">{filtered.length}</span> 筆</div>
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="border-2 border-pip-boy-green/30 p-3 hover:border-pip-boy-green transition cursor-pointer" onClick={()=>{ onSelect?.(r.id); import('@/lib/actionTracker').then(m=>m.track('reading:view_detail',{id:r.id})) }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{r.spread_type === 'single' ? <Spade className="w-5 h-5" /> : <div className="flex gap-0.5"><Spade className="w-4 h-4" /><Spade className="w-4 h-4" /><Spade className="w-4 h-4" /></div>}</div>
                <div>
                  <div className="font-mono text-sm font-bold text-pip-boy-green">{r.spread_type === 'single' ? '單張卡牌' : '三張卡牌'}</div>
                  <div className="text-xs font-mono text-pip-boy-green/60">{formatDate((r as any).created_at || (r as any).date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e)=>{e.stopPropagation(); toggleFavorite(r.id).then(()=>import('@/lib/actionTracker').then(m=>m.track('reading:toggle_favorite',{id:r.id,value:!r.is_favorite})))}} className={"text-xs "+(r.is_favorite ? 'text-yellow-400' : 'text-pip-boy-green/40 hover:text-yellow-400') }><Star className="w-4 h-4" /></button>
                <button onClick={(e)=>{e.stopPropagation(); const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`reading-${r.id}.json`; a.click(); }} className="text-pip-boy-green/60 hover:text-pip-boy-green"><Save className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-2 text-xs font-mono text-pip-boy-green/70 line-clamp-2">{r.interpretation}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 border-2 border-pip-boy-green/30">
            <Spade className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <div className="font-mono text-sm text-pip-boy-green/70">沒有符合條件的占卜</div>
          </div>
        )}
      </div>
    </div>
  )
}
