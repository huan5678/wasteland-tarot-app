/**
 * Characters Management Page - 角色管理頁面
 *
 * 功能：
 * - 角色列表顯示
 * - 新增/編輯/刪除角色
 * - 啟用/停用角色
 * - 搜尋與篩選
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '角色管理 | 廢土塔羅管理後台',
  description: '管理廢土塔羅的角色資料，包含新增、編輯、刪除角色，設定角色聲音與關聯陣營。僅供管理員使用。',
  robots: 'noindex, nofollow',
};

'use client';

import { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useCharacters, clearCharacterVoicesCache } from '@/hooks/useCharacterVoices';
import type { Character } from '@/types/character-voice';
import { createCharacter, updateCharacter, deleteCharacter } from '@/lib/api/character-voice';
import { toast } from 'sonner';import { Button } from "@/components/ui/button";

export default function CharactersPage() {
  const { characters, isLoading, error, reload } = useCharacters();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  // Batch edit state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // 篩選角色
  const filteredCharacters = characters?.filter((char) => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' ||
    filterActive === 'active' && char.is_active ||
    filterActive === 'inactive' && !char.is_active;
    return matchesSearch && matchesFilter;
  }) || [];

  const handleCreate = () => {
    setEditingCharacter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleDelete = async (character: Character) => {
    if (!confirm(`確定要刪除角色「${character.name}」嗎？\n\n這將會刪除所有相關的解讀資料！`)) {
      return;
    }

    try {
      await deleteCharacter(character.id);
      toast.success('角色已刪除');
      clearCharacterVoicesCache();
      reload();
    } catch (error) {
      console.error('Failed to delete character:', error);
      toast.error('刪除失敗');
    }
  };

  const handleToggleActive = async (character: Character) => {
    try {
      await updateCharacter(character.id, {
        is_active: !character.is_active
      });
      toast.success(`角色已${character.is_active ? '停用' : '啟用'}`);
      clearCharacterVoicesCache();
      reload();
    } catch (error) {
      console.error('Failed to toggle character:', error);
      toast.error('更新失敗');
    }
  };

  // Batch operations
  const handleSelectAll = () => {
    if (selectedIds.size === filteredCharacters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCharacters.map((c) => c.id)));
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

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`確定要啟用選中的 ${selectedIds.size} 個角色嗎？`)) return;

    const idsArray = Array.from(selectedIds);
    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: idsArray.length });
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i];
        try {
          await updateCharacter(id, { is_active: true });
          successCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知錯誤';
          errors.push(`角色 ${id}: ${errorMsg}`);
          console.error(`Failed to activate character ${id}:`, error);
          failCount++;
        }
        setBulkProgress({ current: i + 1, total: idsArray.length });
      }

      if (failCount === 0) {
        toast.success(`成功啟用 ${successCount} 個角色`);
      } else {
        toast.error(
          `批量啟用完成：成功 ${successCount} 個，失敗 ${failCount} 個\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
          { duration: 5000 }
        );
      }
      clearCharacterVoicesCache();
      reload();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`確定要停用選中的 ${selectedIds.size} 個角色嗎？`)) return;

    const idsArray = Array.from(selectedIds);
    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: idsArray.length });
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i];
        try {
          await updateCharacter(id, { is_active: false });
          successCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知錯誤';
          errors.push(`角色 ${id}: ${errorMsg}`);
          console.error(`Failed to deactivate character ${id}:`, error);
          failCount++;
        }
        setBulkProgress({ current: i + 1, total: idsArray.length });
      }

      if (failCount === 0) {
        toast.success(`成功停用 ${successCount} 個角色`);
      } else {
        toast.error(
          `批量停用完成：成功 ${successCount} 個，失敗 ${failCount} 個\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
          { duration: 5000 }
        );
      }
      clearCharacterVoicesCache();
      reload();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個角色嗎？\n\n這將會刪除所有相關的解讀資料！`)) return;

    const idsArray = Array.from(selectedIds);
    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: idsArray.length });
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i];
        try {
          await deleteCharacter(id);
          successCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知錯誤';
          errors.push(`角色 ${id}: ${errorMsg}`);
          console.error(`Failed to delete character ${id}:`, error);
          failCount++;
        }
        setBulkProgress({ current: i + 1, total: idsArray.length });
      }

      if (failCount === 0) {
        toast.success(`成功刪除 ${successCount} 個角色`);
      } else {
        toast.error(
          `批量刪除完成：成功 ${successCount} 個，失敗 ${failCount} 個\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
          { duration: 5000 }
        );
      }
      clearCharacterVoicesCache();
      reload();
      setSelectedIds(new Set());
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入角色資料...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="border-2 border-red-500/50 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 mb-2">
          <PixelIcon name="alert-triangle" sizePreset="lg" variant="error" decorative />
          <h3 className="text-lg font-bold text-red-400">載入失敗</h3>
        </div>
        <p className="text-red-300">{error.message}</p>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
            角色管理
          </h2>
          <p className="text-pip-boy-green/70 text-sm uppercase tracking-wider">
            CHARACTERS MANAGEMENT
          </p>
        </div>

        <Button size="lg" variant="outline"
        onClick={handleCreate}
        className="px-6 py-3 transition-colors flex items-center gap-2 font-bold uppercase tracking-wider">

          <PixelIcon name="plus" sizePreset="sm" variant="primary" decorative />
          新增角色
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <PixelIcon
            name="search"
            sizePreset="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-pip-boy-green/50"
            decorative />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋角色名稱或 Key..."
            className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-10 py-3 text-pip-boy-green placeholder:text-pip-boy-green/50 outline-none" />

        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((filter) =>
          <Button size="icon" variant="default"
          key={filter}
          onClick={() => setFilterActive(filter)}
          className="{expression}">





              {filter === 'all' ? '全部' : filter === 'active' ? '啟用' : '停用'}
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 &&
      <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PixelIcon name="check-circle" sizePreset="sm" variant="warning" decorative />
              <span className="font-bold text-orange-400">
                已選擇 {selectedIds.size} 個角色
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline"
            onClick={handleBulkActivate}
            disabled={isBulkProcessing}
            className="px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">

                {isBulkProcessing ?
              <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative className="inline" /> :

              <PixelIcon name="check" sizePreset="xs" decorative className="inline" />
              }
                批量啟用
              </Button>
              <Button size="sm" variant="outline"
            onClick={handleBulkDeactivate}
            disabled={isBulkProcessing}
            className="px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">

                {isBulkProcessing ?
              <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative className="inline" /> :

              <PixelIcon name="close" sizePreset="xs" decorative className="inline" />
              }
                批量停用
              </Button>
              <Button size="sm" variant="outline"
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            className="px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">

                {isBulkProcessing ?
              <PixelIcon name="loader" sizePreset="xs" animation="spin" variant="error" decorative className="inline" /> :

              <PixelIcon name="trash" sizePreset="xs" variant="error" decorative className="inline" />
              }
                批量刪除
              </Button>
              <Button size="sm" variant="outline"
            onClick={() => setSelectedIds(new Set())}
            disabled={isBulkProcessing}
            className="px-4 py-2 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

                取消選擇
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isBulkProcessing && bulkProgress.total > 0 &&
        <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-pip-boy-green font-mono">
                  處理進度: {bulkProgress.current} / {bulkProgress.total}
                </span>
                <span className="text-pip-boy-green/70 font-mono">
                  {Math.round(bulkProgress.current / bulkProgress.total * 100)}%
                </span>
              </div>
              <div className="h-2 bg-black border-2 border-pip-boy-green/30 overflow-hidden">
                <div
              className="h-full bg-pip-boy-green transition-all duration-300"
              style={{ width: `${bulkProgress.current / bulkProgress.total * 100}%` }} />

              </div>
            </div>
        }
        </div>
      }

      {/* Characters Table */}
      <div className="border-2 border-pip-boy-green/30 bg-black/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-pip-boy-green/30 bg-pip-boy-green/10">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCharacters.length && filteredCharacters.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:ring-pip-boy-green focus:ring-offset-0 cursor-pointer" />

                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                  角色名稱
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pip-boy-green/20">
              {filteredCharacters.length === 0 ?
              <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-pip-boy-green/50">
                    沒有找到角色
                  </td>
                </tr> :

              filteredCharacters.map((character) =>
              <tr
                key={character.id}
                className="hover:bg-pip-boy-green/5 transition-colors">

                    <td className="px-6 py-4">
                      <input
                    type="checkbox"
                    checked={selectedIds.has(character.id)}
                    onChange={() => handleSelectOne(character.id)}
                    className="w-5 h-5 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:ring-pip-boy-green focus:ring-offset-0 cursor-pointer" />

                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{character.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-pip-boy-green/10 px-2 py-1 border border-pip-boy-green/30">
                        {character.key}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-pip-boy-green/80">
                      {character.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {character.is_active ?
                  <span className="inline-block px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green text-xs font-bold">
                          啟用
                        </span> :

                  <span className="inline-block px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold">
                          停用
                        </span>
                  }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon" variant="outline"
                    onClick={() => handleToggleActive(character)}
                    className="p-2 border transition-colors"
                    title={character.is_active ? '停用' : '啟用'}>

                          <PixelIcon
                        name={character.is_active ? 'eye-off' : 'eye'}
                        sizePreset="xs"
                        decorative />

                        </Button>
                        <Button size="icon" variant="outline"
                    onClick={() => handleEdit(character)}
                    className="p-2 border transition-colors"
                    title="編輯">

                          <PixelIcon name="edit" sizePreset="xs" decorative />
                        </Button>
                        <Button size="icon" variant="outline"
                    onClick={() => handleDelete(character)}
                    className="p-2 border transition-colors"
                    title="刪除">

                          <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
                        </Button>
                      </div>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-pip-boy-green/70">
        <p>
          顯示 <span className="font-bold text-pip-boy-green">{filteredCharacters.length}</span> 筆資料
          （共 <span className="font-bold text-pip-boy-green">{characters?.length || 0}</span> 筆）
        </p>
        <p>
          啟用: <span className="font-bold text-pip-boy-green">{characters?.filter((c) => c.is_active).length || 0}</span> |
          停用: <span className="font-bold text-pip-boy-green">{characters?.filter((c) => !c.is_active).length || 0}</span>
        </p>
      </div>

      {/* Modal will be added in next step */}
      {isModalOpen &&
      <CharacterFormModal
        character={editingCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          clearCharacterVoicesCache();
          reload();
          setIsModalOpen(false);
        }} />

      }
    </div>);

}

/**
 * Character Form Modal Component
 */
function CharacterFormModal({
  character,
  isOpen,
  onClose,
  onSuccess





}: {character: Character | null;isOpen: boolean;onClose: () => void;onSuccess: () => void;}) {
  const [formData, setFormData] = useState({
    name: character?.name || '',
    key: character?.key || '',
    description: character?.description || '',
    voice_style: character?.voice_style || '',
    personality: character?.personality || '',
    is_active: character?.is_active ?? true,
    sort_order: character?.sort_order || 0
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (character) {
        await updateCharacter(character.id, formData);
        toast.success('角色已更新');
      } else {
        await createCharacter(formData);
        toast.success('角色已建立');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save character:', error);
      toast.error('儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black border-2 border-pip-boy-green max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b-2 border-pip-boy-green/30 p-6">
          <h3 className="text-2xl font-bold uppercase tracking-wider">
            {character ? '編輯角色' : '新增角色'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">
              角色名稱 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-4 py-3 text-pip-boy-green outline-none"
              placeholder="例如：Pip-Boy" />

          </div>

          {/* Key */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">
              Key (唯一識別碼) *
            </label>
            <input
              type="text"
              required
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-4 py-3 text-pip-boy-green outline-none font-mono"
              placeholder="例如：pip_boy"
              disabled={!!character} // 編輯時不可更改 key
            />
            {character &&
            <p className="text-xs text-orange-400 mt-2">
                ⚠️ 編輯時無法更改 Key
              </p>
            }
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-4 py-3 text-pip-boy-green outline-none resize-none"
              rows={3}
              placeholder="角色的背景描述..." />

          </div>

          {/* Voice Style */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">
              語音風格
            </label>
            <input
              type="text"
              value={formData.voice_style}
              onChange={(e) => setFormData({ ...formData, voice_style: e.target.value })}
              className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-4 py-3 text-pip-boy-green outline-none"
              placeholder="例如：機械化、正式" />

          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">
              性格特質
            </label>
            <input
              type="text"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              className="w-full bg-black border-2 border-pip-boy-green/30 focus:border-pip-boy-green px-4 py-3 text-pip-boy-green outline-none"
              placeholder="例如：理性、樂觀" />

          </div>

          {/* Is Active */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5" />

              <span className="text-sm font-bold uppercase tracking-wider">
                啟用此角色
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t-2 border-pip-boy-green/30">
            <Button size="lg" variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-6 py-3 transition-colors font-bold uppercase tracking-wider disabled:opacity-50">

              取消
            </Button>
            <Button size="icon" variant="outline"
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 transition-colors font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">

              {isSaving ?
              <>
                  <PixelIcon name="loader" animation="spin" sizePreset="xs" decorative />
                  儲存中...
                </> :

              character ? '更新' : '建立'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>);

}