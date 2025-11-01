'use client';

import React, { useState, useEffect } from 'react';
import type { WastelandCard, Story } from '@/types/database';
import Image from 'next/image';
import { WastelandStorySection } from '@/components/cards/WastelandStorySection';
import { PixelIcon } from '@/components/ui/icons';
import { getCardWithStory } from '@/lib/api';
import { getSuitDisplayName } from '@/types/suits';

interface ReadingContext {
  question?: string;
  spreadType?: string;
  positionName?: string;
  positionMeaning?: string;
  cardIndex?: number;
  totalCards?: number;
}

interface CardDetailModalProps {
  card: WastelandCard & {
    story?: Story;
    audioUrls?: Record<string, string>;
  };
  isOpen: boolean;
  onClose: () => void;
  readingContext?: ReadingContext; // 占卜情境（選填）
}

export function CardDetailModal({ card, isOpen, onClose, readingContext }: CardDetailModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('pip_boy');
  const [loadedCard, setLoadedCard] = useState<WastelandCard & { story?: Story; audioUrls?: Record<string, string> }>(card);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // Auto-fetch complete card data if any critical fields are missing
  useEffect(() => {
    // 檢查是否缺少關鍵欄位（圖片、故事、音頻、角色語音、Fallout 參考資料）
    const needsFullData =
      !card.image_url ||
      !card.story ||
      !card.audioUrls ||
      !card.character_voices ||
      !card.fallout_reference;

    if (isOpen && card.id && needsFullData) {
      console.log('[CardDetailModal] Fetching complete card data for:', card.id, {
        hasImageUrl: !!card.image_url,
        hasStory: !!card.story,
        hasAudioUrls: !!card.audioUrls,
        hasCharacterVoices: !!card.character_voices,
        hasFalloutReference: !!card.fallout_reference,
      })
      setIsLoadingStory(true);
      getCardWithStory(card.id)
        .then((cardWithStory) => {
          console.log('[CardDetailModal] Complete card data loaded:', {
            hasStory: !!cardWithStory.story,
            hasAudioUrls: !!cardWithStory.audioUrls,
            audioUrlsKeys: cardWithStory.audioUrls ? Object.keys(cardWithStory.audioUrls) : [],
            hasCharacterVoices: !!cardWithStory.character_voices,
            characterVoicesKeys: cardWithStory.character_voices ? Object.keys(cardWithStory.character_voices) : [],
            hasFalloutReference: !!cardWithStory.fallout_reference,
          })
          // 使用完整的 cardWithStory 資料，而不是只合併部分欄位
          setLoadedCard(cardWithStory);
        })
        .catch((error) => {
          console.error('[CardDetailModal] Failed to load complete card data:', error);
          // Keep using original card data if fetch fails
          setLoadedCard(card);
        })
        .finally(() => {
          setIsLoadingStory(false);
        });
    } else {
      console.log('[CardDetailModal] Using existing complete card data:', {
        hasImageUrl: !!card.image_url,
        hasStory: !!card.story,
        hasAudioUrls: !!card.audioUrls,
        audioUrlsKeys: card.audioUrls ? Object.keys(card.audioUrls) : [],
        hasCharacterVoices: !!card.character_voices,
        characterVoicesKeys: card.character_voices ? Object.keys(card.character_voices) : [],
        hasFalloutReference: !!card.fallout_reference,
      })
      setLoadedCard(card);
    }
  }, [isOpen, card]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Show loading state while fetching complete card data
  if (isLoadingStory) {
    return (
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-black border-2 border-green-900 rounded-lg p-8 flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
          <p className="text-green-400 text-sm">載入卡牌資訊中...</p>
        </div>
      </div>
    );
  }

  const getKarmaColor = (karma: string): string => {
    switch (karma) {
      case 'GOOD':
        return 'bg-green-900 text-green-300';
      case 'EVIL':
        return 'bg-red-900 text-red-300';
      case 'NEUTRAL':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return 'text-amber-400';
      case 'rare':
        return 'text-purple-400';
      case 'uncommon':
        return 'text-blue-400';
      case 'common':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // 角色語音中文映射
  const voiceNameMap: Record<string, string> = {
    'pip_boy': 'Pip-Boy 分析',
    'vault_dweller': '避難所居民觀點',
    'wasteland_trader': '廢土商人智慧',
    'super_mutant': '超級變種人視角',
    'codsworth': 'Codsworth 分析',
  };

  const availableVoices = Object.keys(loadedCard.character_voices || {});
  const currentInterpretation =
    (loadedCard.character_voices && loadedCard.character_voices[selectedVoice]) ||
    loadedCard.pip_boy_interpretation ||
    '暫無解讀內容';

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        data-testid="modal-content"
        className="bg-black border-2 border-green-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-400 hover:text-green-300 z-10"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Header */}
        <div className="bg-green-900/20 border-b border-green-900 p-6">
          <div className="flex items-start gap-4">
            {loadedCard.image_url && (
              <div className="relative w-32 h-48 flex-shrink-0">
                <Image
                  src={loadedCard.image_url}
                  alt={`${loadedCard.name} card`}
                  fill
                  className="object-cover rounded border-2 border-green-700"
                />
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-green-400 mb-2">
                {loadedCard.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {loadedCard.rarity_level && (
                  <span className={`px-3 py-1 rounded text-sm font-bold ${getRarityColor(loadedCard.rarity_level)}`}>
                    {loadedCard.rarity_level.toUpperCase()}
                  </span>
                )}
                {loadedCard.karma_alignment && (
                  <span className={`px-3 py-1 rounded text-sm ${getKarmaColor(loadedCard.karma_alignment)}`}>
                    {loadedCard.karma_alignment}
                  </span>
                )}
                {loadedCard.suit && (
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">
                    {getSuitDisplayName(loadedCard.suit)}
                  </span>
                )}
              </div>

              {loadedCard.description && (
                <p className="text-gray-300 text-sm">{loadedCard.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Reading Context (占卜情境) - Only show when provided */}
          {readingContext && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="compass" sizePreset="sm" variant="info" decorative />
                <h3 className="text-blue-400 font-semibold text-sm uppercase">
                  占卜情境
                </h3>
              </div>

              {readingContext.question && (
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1 text-xs uppercase">
                    問題
                  </h4>
                  <p className="text-gray-300 text-sm">{readingContext.question}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                {readingContext.spreadType && (
                  <div>
                    <h4 className="text-blue-300 font-semibold mb-1 text-xs uppercase">
                      牌陣類型
                    </h4>
                    <p className="text-gray-300 text-sm">{readingContext.spreadType}</p>
                  </div>
                )}

                {readingContext.positionName && (
                  <div>
                    <h4 className="text-blue-300 font-semibold mb-1 text-xs uppercase">
                      位置
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {readingContext.positionName}
                      {readingContext.cardIndex !== undefined && readingContext.totalCards && (
                        <span className="text-blue-400 ml-2">
                          ({readingContext.cardIndex + 1}/{readingContext.totalCards})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {readingContext.positionMeaning && (
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1 text-xs uppercase">
                    位置意義
                  </h4>
                  <p className="text-gray-300 text-sm">{readingContext.positionMeaning}</p>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          {loadedCard.keywords && loadedCard.keywords.length > 0 && (
            <div>
              <h3 className="text-green-400 font-semibold mb-2 text-sm uppercase">
                關鍵字
              </h3>
              <div className="flex flex-wrap gap-2">
                {loadedCard.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meanings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-900/10 border border-green-900/50 rounded p-4">
              <h3 className="text-green-400 font-semibold mb-2 uppercase text-sm">
                正位牌義
              </h3>
              <p className="text-gray-300 text-sm">{loadedCard.upright_meaning}</p>
            </div>

            <div className="bg-red-900/10 border border-red-900/50 rounded p-4">
              <h3 className="text-red-400 font-semibold mb-2 uppercase text-sm">
                逆位牌義
              </h3>
              <p className="text-gray-300 text-sm">{loadedCard.reversed_meaning}</p>
            </div>
          </div>

          {/* Character Voice Interpretations */}
          <div>
            <h3 className="text-green-400 font-semibold mb-3 text-sm uppercase">
              角色解讀
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableVoices.map((voice) => (
                <button
                  key={voice}
                  onClick={() => setSelectedVoice(voice)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedVoice === voice
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  aria-label={`${voice} voice`}
                >
                  {voiceNameMap[voice] || voice.replace(/_/g, ' ').toUpperCase()}
                </button>
              ))}
            </div>
            <div className="bg-black/40 border border-green-900/50 rounded p-4">
              <p className="text-green-300 text-sm">{currentInterpretation}</p>
            </div>
          </div>

          {/* Fallout-specific details */}
          <div className="grid md:grid-cols-2 gap-4">
            {loadedCard.fallout_reference && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 text-xs uppercase">
                  Fallout 參考
                </h4>
                <p className="text-gray-300 text-sm">{loadedCard.fallout_reference}</p>
              </div>
            )}

            {loadedCard.vault_reference !== undefined && loadedCard.vault_reference !== null && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 text-xs uppercase">
                  避難所編號
                </h4>
                <p className="text-gray-300 text-sm">Vault {loadedCard.vault_reference}</p>
              </div>
            )}
          </div>

          {/* Wasteland stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadedCard.radiation_factor !== undefined && !isNaN(loadedCard.radiation_factor) && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">輻射等級</div>
                <div className="text-green-400 font-bold">
                  {(loadedCard.radiation_factor * 100).toFixed(0)}%
                </div>
              </div>
            )}

            {loadedCard.threat_level !== undefined && loadedCard.threat_level !== null && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">威脅等級</div>
                <div className="text-red-400 font-bold">{loadedCard.threat_level}</div>
              </div>
            )}

            {loadedCard.element && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">元素</div>
                <div className="text-blue-400 font-bold">{loadedCard.element}</div>
              </div>
            )}

            {loadedCard.astrological_association && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">星座</div>
                <div className="text-purple-400 font-bold">
                  {loadedCard.astrological_association}
                </div>
              </div>
            )}
          </div>

          {/* Symbolism */}
          {loadedCard.symbolism && (
            <div>
              <h4 className="text-green-400 font-semibold mb-2 text-xs uppercase">
                象徵意義
              </h4>
              <p className="text-gray-300 text-sm">{loadedCard.symbolism}</p>
            </div>
          )}

          {/* Wasteland humor */}
          {loadedCard.wasteland_humor && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded p-4">
              <h4 className="text-amber-400 font-semibold mb-2 text-xs uppercase">
                廢土智慧
              </h4>
              <p className="text-amber-300 text-sm italic">{loadedCard.wasteland_humor}</p>
            </div>
          )}

          {/* Story Mode Section */}
          {loadedCard.story && (
            <div className="mt-6 border-t border-green-900/50 pt-6">
              <WastelandStorySection
                story={loadedCard.story}
                audioUrls={loadedCard.audioUrls}
                cardName={loadedCard.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
