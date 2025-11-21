/**
 * Admin Card Interpretations Management Page
 * 管理後台 - 卡牌解讀管理
 *
 * 功能：
 * - 查看所有卡牌及其解讀
 * - 為卡牌新增/編輯/刪除角色解讀
 * - 批量管理解讀
 */

'use client';

import { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useCharacters } from '@/hooks/useCharacterVoices';
import { CardService } from '@/services/cards.service';
import {
  getInterpretationsByCard,
  createInterpretation,
  updateInterpretation,
  deleteInterpretation } from
'@/lib/api/character-voice';
import type {
  Character,
  CardInterpretationWithDetails,
  CardInterpretationCreate,
  CardInterpretationUpdate } from
'@/types/character-voice';
import type { TarotCard } from '@/types/api';
import { toast } from 'sonner';
import { CardListSkeleton, InterpretationListSkeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { ProgressBar, type ProgressStats } from '@/components/ui/ProgressBar';import { Button } from "@/components/ui/button";

export default function InterpretationsPage() {
  const { characters, isLoading: isLoadingCharacters } = useCharacters();
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [interpretations, setInterpretations] = useState<CardInterpretationWithDetails[]>([]);
  const [isLoadingInterpretations, setIsLoadingInterpretations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingInterpretation, setEditingInterpretation] = useState<CardInterpretationWithDetails | null>(null);

  // Batch edit state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<ProgressStats | null>(null);

  // Load all cards
  useEffect(() => {
    const loadCards = async () => {
      try {
        const allCards = await CardService.getAll({ limit: 100 });
        // Check if data is paginated response or array
        const cardsArray = Array.isArray(data) ?
        data :
        (data as any).cards || [];
        setCards(cardsArray);
      } catch (error) {
        console.error('Failed to load cards:', error);
        toast.error('載入卡牌失敗');
      } finally {
        setIsLoadingCards(false);
      }
    };
    loadCards();
  }, []);

  // Load interpretations for selected card
  useEffect(() => {
    if (!selectedCard) {
      setInterpretations([]);
      return;
    }

    const loadInterpretations = async () => {
      setIsLoadingInterpretations(true);
      try {
        const data = await getInterpretationsByCard(selectedCard.id);
        setInterpretations(data);
      } catch (error) {
        console.error('Failed to load interpretations:', error);
        toast.error('載入解讀失敗');
      } finally {
        setIsLoadingInterpretations(false);
      }
    };

    loadInterpretations();
  }, [selectedCard]);

  // Get characters that don't have interpretations yet for selected card
  const getAvailableCharacters = (): Character[] => {
    if (!characters || !selectedCard) return [];

    const interpretedCharacterIds = new Set(
      interpretations.map((i) => i.character_id)
    );

    return characters.filter((c) => c.is_active && !interpretedCharacterIds.has(c.id));
  };

  // Filter cards by search
  const filteredCards = cards.filter((card) =>
  card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  card.suit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reload interpretations
  const reloadInterpretations = async () => {
    if (!selectedCard) return;

    try {
      const data = await getInterpretationsByCard(selectedCard.id);
      setInterpretations(data);
    } catch (error) {
      console.error('Failed to reload interpretations:', error);
    }
  };

  // Batch selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === interpretations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(interpretations.map((i) => i.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Batch operations
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要啟用選中的 ${selectedIds.size} 個解讀嗎？`)) return;

    const total = selectedIds.size;
    let completed = 0;
    let success = 0;
    let failed = 0;

    setIsBulkProcessing(true);
    setBulkProgress({ total, completed, success, failed });

    try {
      for (const id of selectedIds) {
        try {
          await updateInterpretation(id, { is_active: true });
          success++;
        } catch (error) {
          console.error(`Failed to activate interpretation ${id}:`, error);
          failed++;
        }
        completed++;
        setBulkProgress({ total, completed, success, failed });
      }

      toast.success(`成功啟用 ${success} 個解讀${failed > 0 ? `，${failed} 個失敗` : ''}`);
      await reloadInterpretations();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress(null);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要停用選中的 ${selectedIds.size} 個解讀嗎？`)) return;

    const total = selectedIds.size;
    let completed = 0;
    let success = 0;
    let failed = 0;

    setIsBulkProcessing(true);
    setBulkProgress({ total, completed, success, failed });

    try {
      for (const id of selectedIds) {
        try {
          await updateInterpretation(id, { is_active: false });
          success++;
        } catch (error) {
          console.error(`Failed to deactivate interpretation ${id}:`, error);
          failed++;
        }
        completed++;
        setBulkProgress({ total, completed, success, failed });
      }

      toast.success(`成功停用 ${success} 個解讀${failed > 0 ? `，${failed} 個失敗` : ''}`);
      await reloadInterpretations();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個解讀嗎？\n\n此操作無法復原！`)) return;

    const total = selectedIds.size;
    let completed = 0;
    let success = 0;
    let failed = 0;

    setIsBulkProcessing(true);
    setBulkProgress({ total, completed, success, failed });

    try {
      for (const id of selectedIds) {
        try {
          await deleteInterpretation(id);
          success++;
        } catch (error) {
          console.error(`Failed to delete interpretation ${id}:`, error);
          failed++;
        }
        completed++;
        setBulkProgress({ total, completed, success, failed });
      }

      toast.success(`成功刪除 ${success} 個解讀${failed > 0 ? `，${failed} 個失敗` : ''}`);
      await reloadInterpretations();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress(null);
    }
  };

  const isLoading = isLoadingCards || isLoadingCharacters;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <div className="h-10 w-64 bg-pip-boy-green/10 border border-pip-boy-green/20 animate-pulse mb-2" />
          <div className="h-4 w-96 bg-pip-boy-green/10 border border-pip-boy-green/20 animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards List Skeleton */}
          <div className="lg:col-span-1 space-y-4">
            <div className="h-7 w-32 bg-pip-boy-green/10 border border-pip-boy-green/20 animate-pulse" />
            <div className="h-10 w-full bg-pip-boy-green/10 border border-pip-boy-green/20 animate-pulse" />
            <CardListSkeleton count={10} />
          </div>

          {/* Interpretations Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-pip-boy-green/10 border border-pip-boy-green/20 animate-pulse" />
          </div>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
          卡牌解讀管理
        </h2>
        <p className="text-pip-boy-green/70 text-sm uppercase tracking-wider">
          CARD INTERPRETATIONS MANAGEMENT
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">總卡牌數</div>
          <div className="text-2xl font-bold text-pip-boy-green">{cards.length}</div>
        </div>
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">總角色數</div>
          <div className="text-2xl font-bold text-pip-boy-green">
            {characters?.filter((c) => c.is_active).length || 0}
          </div>
        </div>
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">理論解讀數</div>
          <div className="text-2xl font-bold text-pip-boy-green">
            {cards.length * (characters?.filter((c) => c.is_active).length || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-bold text-pip-boy-green uppercase tracking-wider">
            選擇卡牌
          </h3>

          {/* Search */}
          <div className="relative">
            <PixelIcon
              name="search"
              sizePreset="xs"
              variant="primary"
              decorative
              className="absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              placeholder="搜尋卡牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green placeholder-pip-boy-green/50 focus:border-pip-boy-green focus:outline-none" />

          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredCards.map((card) => {
              const isSelected = selectedCard?.id === card.id;

              return (
                <Button size="default" variant="default"
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="{expression}">





                  <div className="font-bold text-pip-boy-green mb-1">
                    {card.name}
                  </div>
                  <div className="text-xs text-pip-boy-green/70">
                    {card.suit} • {card.is_major_arcana ? 'Major Arcana' : 'Minor Arcana'}
                  </div>
                </Button>);

            })}
          </div>
        </div>

        {/* Interpretations Management */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCard ?
          <>
              {/* Card Info */}
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-pip-boy-green mb-1">
                      {selectedCard.name}
                    </h3>
                    <div className="text-sm text-pip-boy-green/70">
                      {selectedCard.suit} • {selectedCard.is_major_arcana ? 'Major Arcana' : 'Minor Arcana'}
                    </div>
                  </div>
                  <Button size="sm" variant="outline"
                onClick={() => setIsCreating(!isCreating)}
                className="px-4 py-2 font-bold uppercase tracking-wider transition-colors flex items-center gap-2">

                    <PixelIcon name="plus" sizePreset="xs" decorative />
                    新增解讀
                  </Button>
                </div>
                {selectedCard.upright_meaning &&
              <p className="text-pip-boy-green/60 text-sm">
                    正位意義：{selectedCard.upright_meaning}
                  </p>
              }
              </div>

              {/* Create Interpretation Form */}
              {isCreating &&
            <CreateInterpretationForm
              cardId={selectedCard.id}
              availableCharacters={getAvailableCharacters()}
              onSuccess={() => {
                setIsCreating(false);
                reloadInterpretations();
              }}
              onCancel={() => setIsCreating(false)} />

            }

              {/* Bulk Actions */}
              {selectedIds.size > 0 &&
            <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PixelIcon name="check-circle" sizePreset="sm" variant="warning" decorative />
                      <span className="font-bold text-orange-400">
                        已選擇 {selectedIds.size} 個解讀
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline"
                  onClick={handleBulkActivate}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-wider transition-colors flex items-center gap-2">

                        <PixelIcon name="check" sizePreset="xs" decorative />
                        批量啟用
                      </Button>
                      <Button size="sm" variant="outline"
                  onClick={handleBulkDeactivate}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-wider transition-colors flex items-center gap-2">

                        <PixelIcon name="close" sizePreset="xs" decorative />
                        批量停用
                      </Button>
                      <Button size="sm" variant="outline"
                  onClick={handleBulkDelete}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-wider transition-colors flex items-center gap-2">

                        <PixelIcon name="trash" sizePreset="xs" decorative />
                        批量刪除
                      </Button>
                      <Button size="sm" variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-wider transition-colors">

                        取消選擇
                      </Button>
                    </div>
                  </div>
                </div>
            }

              {/* Bulk Progress */}
              {bulkProgress &&
            <ProgressBar
              stats={bulkProgress}
              label="批量操作進度" />

            }

              {/* Interpretations List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-pip-boy-green uppercase tracking-wider">
                    角色解讀 ({interpretations.length})
                  </h4>
                  {interpretations.length > 0 &&
                <Button size="icon" variant="link"
                onClick={handleSelectAll}
                className="underline">

                      {selectedIds.size === interpretations.length ? '取消全選' : '全選'}
                    </Button>
                }
                </div>

                {isLoadingInterpretations ?
              <InterpretationListSkeleton count={5} /> :
              interpretations.length === 0 ?
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-8 text-center">
                    <PixelIcon name="info" sizePreset="xl" variant="muted" decorative className="mx-auto mb-3" />
                    <p className="text-pip-boy-green/70">
                      此卡牌尚無任何角色解讀
                    </p>
                  </div> :

              <div className="space-y-3">
                    {interpretations.map((interpretation) =>
                <InterpretationItem
                  key={interpretation.id}
                  interpretation={interpretation}
                  isSelected={selectedIds.has(interpretation.id)}
                  onToggleSelect={() => handleSelectOne(interpretation.id)}
                  onEdit={() => setEditingInterpretation(interpretation)}
                  onDelete={async () => {
                    try {
                      await deleteInterpretation(interpretation.id);
                      toast.success('解讀已刪除');
                      reloadInterpretations();
                    } catch (error) {
                      console.error('Failed to delete:', error);
                      toast.error('刪除失敗');
                    }
                  }}
                  onToggleActive={async () => {
                    try {
                      await updateInterpretation(interpretation.id, {
                        is_active: !interpretation.is_active
                      });
                      toast.success(`解讀已${interpretation.is_active ? '停用' : '啟用'}`);
                      reloadInterpretations();
                    } catch (error) {
                      console.error('Failed to toggle:', error);
                      toast.error('更新失敗');
                    }
                  }} />

                )}
                  </div>
              }
              </div>

              {/* Available Characters Info */}
              {getAvailableCharacters().length > 0 &&
            <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PixelIcon name="alert-triangle" sizePreset="sm" variant="warning" decorative />
                    <h5 className="font-bold text-orange-400 uppercase tracking-wider">
                      缺少解讀的角色
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableCharacters().map((char) =>
                <span
                  key={char.id}
                  className="px-2 py-1 border border-orange-400/30 bg-orange-500/10 text-orange-300 text-xs">

                        {char.name}
                      </span>
                )}
                  </div>
                </div>
            }
            </> :

          <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-12 text-center">
              <PixelIcon name="arrow-left" sizePreset="xl" variant="muted" decorative className="mx-auto mb-4" />
              <p className="text-pip-boy-green/70 text-lg">
                請從左側選擇一張卡牌以管理其解讀
              </p>
            </div>
          }
        </div>
      </div>

      {/* Edit Modal */}
      {editingInterpretation &&
      <EditInterpretationModal
        interpretation={editingInterpretation}
        onClose={() => setEditingInterpretation(null)}
        onSuccess={() => {
          setEditingInterpretation(null);
          reloadInterpretations();
        }} />

      }
    </div>);

}

// ============================================================================
// Create Interpretation Form Component
// ============================================================================

interface CreateInterpretationFormProps {
  cardId: string;
  availableCharacters: Character[];
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateInterpretationForm({
  cardId,
  availableCharacters,
  onSuccess,
  onCancel
}: CreateInterpretationFormProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [interpretationText, setInterpretationText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCharacterId || !interpretationText.trim()) {
      toast.error('請選擇角色並輸入解讀內容');
      return;
    }

    setIsSaving(true);

    try {
      const data: CardInterpretationCreate = {
        card_id: cardId,
        character_id: selectedCharacterId,
        interpretation_text: interpretationText.trim(),
        is_active: isActive
      };

      await createInterpretation(data);
      toast.success('解讀已建立');
      onSuccess();
    } catch (error) {
      console.error('Failed to create interpretation:', error);
      toast.error('建立失敗');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-orange-400/30 bg-orange-500/5 p-4 space-y-4">

      <div className="flex items-center gap-2 mb-2">
        <PixelIcon name="plus-circle" sizePreset="sm" variant="warning" decorative />
        <h4 className="font-bold text-orange-400 uppercase tracking-wider">
          建立新解讀
        </h4>
      </div>

      {/* Character Selection */}
      <div>
        <label className="block text-pip-boy-green text-sm font-bold mb-2">
          選擇角色 <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedCharacterId}
          onChange={(e) => setSelectedCharacterId(e.target.value)}
          className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none"
          required>

          <option value="">-- 請選擇角色 --</option>
          {availableCharacters.map((char) =>
          <option key={char.id} value={char.id}>
              {char.name} ({char.key})
            </option>
          )}
        </select>
        {availableCharacters.length === 0 &&
        <p className="text-xs text-orange-400 mt-1">
            所有角色都已有解讀
          </p>
        }
      </div>

      {/* Interpretation Text */}
      <div>
        <label className="block text-pip-boy-green text-sm font-bold mb-2">
          解讀內容 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={interpretationText}
          onChange={(e) => setInterpretationText(e.target.value)}
          className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none resize-none"
          rows={6}
          placeholder="輸入角色對此卡牌的解讀..."
          required />

        <p className="text-xs text-pip-boy-green/60 mt-1">
          {interpretationText.length} 字
        </p>
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="create_is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:ring-pip-boy-green focus:ring-offset-0 cursor-pointer" />

        <label htmlFor="create_is_active" className="text-pip-boy-green text-sm font-bold cursor-pointer">
          啟用此解讀
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-pip-boy-green/30">
        <Button size="default" variant="outline"
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2 font-bold uppercase tracking-wider transition-colors"
        disabled={isSaving}>

          取消
        </Button>
        <Button size="icon" variant="outline"
        type="submit"
        className="flex-1 px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSaving || availableCharacters.length === 0}>

          {isSaving ? '儲存中...' : '建立'}
        </Button>
      </div>
    </form>);

}

// ============================================================================
// Interpretation Item Component
// ============================================================================

interface InterpretationItemProps {
  interpretation: CardInterpretationWithDetails;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function InterpretationItem({
  interpretation,
  onEdit,
  onDelete,
  onToggleActive,
  isSelected,
  onToggleSelect
}: InterpretationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 cursor-pointer accent-pip-boy-green" />

            <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-bold text-pip-boy-green">
                {interpretation.character_name || '未知角色'}
              </h5>
              <span className="text-xs text-pip-boy-green/70 font-mono">
                ({interpretation.character_key})
              </span>
            </div>
            <Button size="sm" variant="link"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1">

              <PixelIcon
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  sizePreset="xs"
                  decorative />

              {isExpanded ? '收起' : '展開'} 解讀內容
            </Button>
          </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="default"
            onClick={onToggleActive}
            className="{expression}">





              {interpretation.is_active ? '啟用' : '停用'}
            </Button>
            <Button size="icon" variant="outline"
            onClick={onEdit}
            className="p-2 border transition-colors"
            title="編輯">

              <PixelIcon name="edit" sizePreset="xs" variant="primary" decorative />
            </Button>
            <Button size="icon" variant="outline"
            onClick={onDelete}
            className="p-2 border transition-colors"
            title="刪除">

              <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded &&
        <div className="mt-3 pt-3 border-t border-pip-boy-green/20">
            <p className="text-pip-boy-green/80 text-sm leading-relaxed whitespace-pre-line">
              {interpretation.interpretation_text}
            </p>
          </div>
        }
      </div>
    </div>);

}

// ============================================================================
// Edit Interpretation Modal Component
// ============================================================================

interface EditInterpretationModalProps {
  interpretation: CardInterpretationWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

function EditInterpretationModal({
  interpretation,
  onClose,
  onSuccess
}: EditInterpretationModalProps) {
  const [interpretationText, setInterpretationText] = useState(interpretation.interpretation_text);
  const [isActive, setIsActive] = useState(interpretation.is_active);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interpretationText.trim()) {
      toast.error('請輸入解讀內容');
      return;
    }

    setIsSaving(true);

    try {
      const data: CardInterpretationUpdate = {
        interpretation_text: interpretationText.trim(),
        is_active: isActive
      };

      await updateInterpretation(interpretation.id, data);
      toast.success('解讀已更新');
      onSuccess();
    } catch (error) {
      console.error('Failed to update interpretation:', error);
      toast.error('更新失敗');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-wasteland-dark border-2 border-pip-boy-green max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-pip-boy-green/30 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-pip-boy-green uppercase tracking-wider">
              編輯解讀
            </h3>
            <p className="text-sm text-pip-boy-green/70 mt-1">
              {interpretation.card_name} - {interpretation.character_name}
            </p>
          </div>
          <Button size="default" variant="link"
          onClick={onClose}
          className="font-bold">

            ×
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Interpretation Text */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                解讀內容 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={interpretationText}
                onChange={(e) => setInterpretationText(e.target.value)}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none resize-none"
                rows={10}
                required />

              <p className="text-xs text-pip-boy-green/60 mt-1">
                {interpretationText.length} 字
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:ring-pip-boy-green focus:ring-offset-0 cursor-pointer" />

              <label htmlFor="edit_is_active" className="text-pip-boy-green text-sm font-bold cursor-pointer">
                啟用此解讀
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-pip-boy-green/30">
            <Button size="default" variant="outline"
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 font-bold uppercase tracking-wider transition-colors"
            disabled={isSaving}>

              取消
            </Button>
            <Button size="icon" variant="outline"
            type="submit"
            className="flex-1 px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}>

              {isSaving ? '儲存中...' : '更新'}
            </Button>
          </div>
        </form>
      </div>
    </div>);

}