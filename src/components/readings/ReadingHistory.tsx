'use client';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReadingsStore } from '@/lib/readingsStore';
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore';
import { PixelIcon } from '@/components/ui/icons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toDisplay } from '@/lib/spreadMapping';import { Button } from "@/components/ui/button";

interface Props {onSelect?: (id: string) => void;}

export function ReadingHistory({ onSelect }: Props) {
  const router = useRouter();
  const readings = useReadingsStore((s) => s.readings);
  const toggleFavorite = useReadingsStore((s) => s.toggleFavorite);
  const deleteReading = useReadingsStore((s) => s.deleteReading);
  const { templates, byId: templatesById, fetchAll } = useSpreadTemplatesStore();
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'question'>('date');
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch spread templates on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 動態生成所有可用的牌陣類型選項
  const availableSpreadTypes = useMemo(() => {
    const types = new Set<string>();
    readings.forEach((r) => {
      if (r.spread_type) types.add(r.spread_type);
    });
    return Array.from(types).sort();
  }, [readings]);

  // 輔助函式：取得牌陣顯示名稱
  const getSpreadDisplayName = useCallback((reading: any) => {
    // 格式化顯示名稱的輔助函式，匹配 SpreadSelector 的格式
    const formatDisplayName = (template: any) => {
      const baseName = template.display_name || template.name || '牌陣';
      const cardCount = template.card_count;
      const difficulty = template.difficulty_level;

      let displayName = baseName;
      if (cardCount) {
        displayName += ` (${cardCount}張)`;
      }
      if (difficulty) {
        displayName += ` [${difficulty}]`;
      }
      return displayName;
    };

    // 1. 如果 reading 包含 spread_template 物件，檢查是否為 placeholder
    if (reading.spread_template) {
      const template = reading.spread_template;

      // 如果是 placeholder 或 id 為 "unknown"，嘗試根據卡牌數量匹配真實的 template
      if (template.id === 'unknown' || template.name === 'placeholder' || template.display_name === 'Placeholder Spread') {
        const cardCount = (reading.card_positions || reading.cards_drawn || reading.cards || []).length;

        // 嘗試從本地 templates 中找到相同卡牌數量的 template
        const matchingTemplate = templates.find((t) => t.card_count === cardCount);
        if (matchingTemplate) {
          return formatDisplayName(matchingTemplate);
        }

        // 如果找不到，顯示為「未知牌陣 (X張)」
        if (cardCount > 0) {
          return `未知牌陣 (${cardCount}張)`;
        }
        return '未知牌陣';
      }

      // 正常的 spread_template，直接格式化
      return formatDisplayName(template);
    }

    // 2. 使用 spread_template_id 查找本地 templates
    if (reading.spread_template_id && templatesById[reading.spread_template_id]) {
      return formatDisplayName(templatesById[reading.spread_template_id]);
    }

    // 3. 使用 spread_type 匹配本地 templates
    if (reading.spread_type) {
      const matchingTemplate = templates.find((t) => t.spread_type === reading.spread_type);
      if (matchingTemplate) {
        return formatDisplayName(matchingTemplate);
      }
      // 使用 spreadMapping 取得顯示名稱
      return toDisplay(reading.spread_type);
    }

    // 4. 根據卡牌數量生成名稱
    const cardCount = (reading.card_positions || reading.cards_drawn || reading.cards || []).length;
    if (cardCount > 0) {
      return `未知牌陣 (${cardCount}張)`;
    }

    // 5. 完全找不到資訊時的預設值（可能是測試資料或未完成的占卜）
    return '未完成的占卜';
  }, [templatesById, templates]);

  // 輔助函式：取得牌陣圖示
  const getSpreadIcons = useCallback((reading: any) => {
    // 支援多種資料格式
    const cards = reading.card_positions || reading.cards_drawn || reading.cards || [];
    const cardCount = cards.length;

    // 取得第一張卡牌的花色作為圖示（如果有的話）
    // card_positions 結構：{ card: { suit, name, ... }, ... }
    const firstCard = cards[0]?.card || cards[0];
    const firstCardSuit = firstCard?.suit;

    // 根據花色映射圖示名稱（使用 RemixIcon 中實際存在的圖示）
    const getSuitIcon = (suit?: string): string => {
      if (!suit) return 'contacts'; // 預設圖示

      const suitLower = suit.toLowerCase();

      // Major Arcana - 使用星星圖示
      if (suitLower.includes('major') || suitLower.includes('arcana')) {
        return 'star';
      }

      // Nuka-Cola Bottles (聖杯 Cups) - 使用杯子圖示
      if (suitLower.includes('nuka') || suitLower.includes('bottles') || suitLower.includes('cups') || suitLower.includes('聖杯')) {
        return 'drop';
      }

      // Combat Weapons (寶劍 Swords) - 使用刀劍圖示
      if (suitLower.includes('combat') || suitLower.includes('weapons') || suitLower.includes('swords') || suitLower.includes('寶劍')) {
        return 'sword';
      }

      // Bottle Caps (錢幣 Pentacles) - 使用錢幣圖示
      if (suitLower.includes('caps') || suitLower.includes('pentacles') || suitLower.includes('coins') || suitLower.includes('錢幣')) {
        return 'coin';
      }

      // Radiation Rods (權杖 Wands) - 使用魔杖/閃電圖示
      if (suitLower.includes('radiation') || suitLower.includes('rods') || suitLower.includes('wands') || suitLower.includes('權杖')) {
        return 'earthquake';
      }

      // 預設為卡牌圖示
      return 'contacts';
    };

    const iconName = getSuitIcon(firstCardSuit);

    // 根據卡牌數量渲染對應數量的圖示
    if (cardCount === 1) {
      return <PixelIcon name={iconName} className="w-5 h-5" />;
    } else if (cardCount <= 3) {
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: cardCount }).map((_, i) =>
          <PixelIcon key={i} name={iconName} className="w-4 h-4" />
          )}
        </div>);

    } else {
      // 超過 3 張：顯示 3 個圖示 + 數字
      return (
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) =>
            <PixelIcon key={i} name={iconName} className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs text-pip-boy-green/70">+{cardCount - 3}</span>
        </div>);

    }
  }, []);

  const filtered = useMemo(() => {
    return readings.
    filter((r) => {
      if (filter === 'favorites') return r.is_favorite;
      if (filter === 'all') return true;
      return r.spread_type === filter;
    }).
    filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      // 支援多種 interpretation 欄位名稱
      const interpretation = (r as any).overall_interpretation || (r as any).interpretation || '';
      return r.question.toLowerCase().includes(q) || interpretation.toLowerCase().includes(q);
    }).
    sort((a, b) => {
      if (sortBy === 'date') return new Date((b as any).created_at || (b as any).date).getTime() - new Date((a as any).created_at || (a as any).date).getTime();
      return a.question.localeCompare(b.question);
    });
  }, [readings, filter, sortBy, search]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, sortBy]);

  const formatDate = (d: string) => new Date(d).toLocaleString();

  // 打開刪除確認對話框
  const handleDeleteClick = (e: React.MouseEvent, readingId: string) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    setReadingToDelete(readingId);
    setDeleteDialogOpen(true);
  };

  // 確認刪除
  const confirmDelete = async () => {
    if (!readingToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteReading(readingToDelete);
      if (success) {
        // 成功刪除後的追蹤
        import('@/lib/actionTracker').then((m) => m.track('reading:delete', { id: readingToDelete }));
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setReadingToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input placeholder="搜尋問題/解讀..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm">
          <option value="all">全部</option>
          {availableSpreadTypes.map((type) => {
            // 嘗試從 templates 中找到對應的顯示名稱
            const template = templates.find((t) => t.spread_type === type);
            const displayName = template?.display_name || template?.name || type;
            return (
              <option key={type} value={type}>{displayName}</option>);

          })}
          <option value="favorites">最愛</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm">
          <option value="date">日期</option>
          <option value="question">問題</option>
        </select>
        <div className="flex items-center text-xs text-pip-boy-green/70">
          共 <span className="numeric tabular-nums mx-1">{filtered.length}</span> 筆
        </div>
      </div>
      <div className="space-y-3">
        {paginatedData.map((r) =>
        <div key={r.id} className="border-2 border-pip-boy-green/30 p-3 hover:border-pip-boy-green transition cursor-pointer" onClick={() => {router.push(`/readings/${r.id}`);import('@/lib/actionTracker').then((m) => m.track('reading:view_detail', { id: r.id }));}}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getSpreadIcons(r)}</div>
                <div>
                  <div className="text-sm font-bold text-pip-boy-green">{getSpreadDisplayName(r)}</div>
                  <div className="text-xs text-pip-boy-green/60">{formatDate((r as any).created_at || (r as any).date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="default" onClick={(e) => {e.stopPropagation();toggleFavorite(r.id).then(() => import('@/lib/actionTracker').then((m) => m.track('reading:toggle_favorite', { id: r.id, value: !r.is_favorite })));}} className="{expression}" title={r.is_favorite ? '取消收藏' : '加入收藏'}><PixelIcon name="star" className="w-4 h-4" /></Button>
                <Button size="icon" variant="link" onClick={(e) => {e.stopPropagation();const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });const a = document.createElement('a');a.href = URL.createObjectURL(blob);a.download = `reading-${r.id}.json`;a.click();}} title="匯出 JSON"><PixelIcon name="save" className="w-4 h-4" /></Button>
                <Button size="icon" variant="link" onClick={(e) => handleDeleteClick(e, r.id)} title="刪除占卜"><PixelIcon name="trash" className="w-4 h-4" /></Button>
              </div>
            </div>
            {/* 使用者的問題 */}
            <p className="mt-2 text-pip-boy-green/80 text-sm italic">
              "{r.question}"
            </p>
            {/* AI 解讀標示 */}
            {r.ai_interpretation_requested &&
          <div className="mt-2 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-pip-boy-green text-xs">
                  <PixelIcon name="cpu" sizePreset="xs" variant="primary" decorative />
                  <span className="font-bold uppercase tracking-wider">AI 已解讀</span>
                </div>
                {(r as any).interpretation_audio_url &&
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-pip-boy-green text-xs">
                    <PixelIcon name="volume-up" sizePreset="xs" variant="primary" decorative />
                    <span className="font-bold uppercase tracking-wider">語音朗讀</span>
                  </div>
            }
              </div>
          }
          </div>
        )}
        {paginatedData.length === 0 && filtered.length === 0 &&
        <div className="text-center py-12 border-2 border-pip-boy-green/30">
            <PixelIcon name="contacts" className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <div className="text-sm text-pip-boy-green/70">沒有符合條件的占卜</div>
          </div>
        }
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && totalPages > 1 &&
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-pip-boy-green/30">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm text-pip-boy-green/70">
            <span>每頁顯示</span>
            <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-black border border-pip-boy-green/50 text-pip-boy-green text-sm">

              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>筆</span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <Button size="default" variant="default"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="{expression}"




          title="上一頁">

              <PixelIcon name="arrow-left-s" size={16} decorative />
              <span className="text-xs">上一頁</span>
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);

              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page
              if (startPage > 1) {
                pages.push(
                  <Button size="xs" variant="outline"
                  key={1}
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1 border transition-colors">

                      1
                    </Button>
                );
                if (startPage > 2) {
                  pages.push(<span key="ellipsis-start" className="text-pip-boy-green/50 px-1">...</span>);
                }
              }

              // Middle pages
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <Button size="icon" variant="default"
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className="{expression}">





                      {i}
                    </Button>
                );
              }

              // Last page
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="ellipsis-end" className="text-pip-boy-green/50 px-1">...</span>);
                }
                pages.push(
                  <Button size="icon" variant="outline"
                  key={totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1 border transition-colors">

                      {totalPages}
                    </Button>
                );
              }

              return pages;
            })()}
            </div>

            {/* Next button */}
            <Button size="default" variant="default"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="{expression}"




          title="下一頁">

              <span className="text-xs">下一頁</span>
              <PixelIcon name="arrow-right-s" size={16} decorative />
            </Button>
          </div>

          {/* Page info */}
          <div className="text-xs text-pip-boy-green/70">
            第 <span className="numeric tabular-nums">{currentPage}</span> / <span className="numeric tabular-nums">{totalPages}</span> 頁
          </div>
        </div>
      }

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="刪除占卜記錄"
        description="確定要刪除這筆占卜記錄嗎？此操作無法復原，所有相關的卡牌和解讀資料都將被永久刪除。"
        confirmText="刪除"
        cancelText="取消"
        variant="destructive"
        isLoading={isDeleting} />

    </div>);

}