'use client';

import React, { useState, useEffect } from 'react';
import type { WastelandCard, Story } from '@/types/database';
import Image from 'next/image';
import { StorySection } from '@/components/tarot/StorySection';
import { CharacterVoiceSelector } from '@/components/tarot/CharacterVoiceSelector';
import StoryAudioPlayer from '@/components/tarot/StoryAudioPlayer';
import { PixelIcon } from '@/components/ui/icons';
import { useStoryAudio } from '@/hooks/useStoryAudio';
import { getCardWithStory } from '@/lib/api';

interface CardDetailModalProps {
  card: WastelandCard & {
    story?: Story;
    audioUrls?: Record<string, string>;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('pip_boy');
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string>('');
  const [isStoryExpanded, setIsStoryExpanded] = useState<boolean>(true);
  const [loadedCard, setLoadedCard] = useState<WastelandCard & { story?: Story; audioUrls?: Record<string, string> }>(card);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // Auto-fetch story data if not provided
  useEffect(() => {
    if (isOpen && !card.story && card.id) {
      setIsLoadingStory(true);
      getCardWithStory(card.id)
        .then((cardWithStory) => {
          setLoadedCard({
            ...card,
            story: cardWithStory.story,
            audioUrls: cardWithStory.audioUrls,
          });
        })
        .catch((error) => {
          console.error('Failed to load card story:', error);
          // Keep using original card data if fetch fails
          setLoadedCard(card);
        })
        .finally(() => {
          setIsLoadingStory(false);
        });
    } else {
      setLoadedCard(card);
    }
  }, [isOpen, card]);

  // Use story audio hook for delayed generation
  const {
    audioUrls,
    isLoading: isAudioLoading,
    error: audioError,
    shouldUseFallback,
    generateAudio,
    resetError,
  } = useStoryAudio({
    cardId: loadedCard.id,
    story: loadedCard.story,
    initialAudioUrls: loadedCard.audioUrls,
    autoGenerate: true, // Auto-generate if no URLs provided
  });

  // Initialize selected character when audioUrls change
  useEffect(() => {
    if (audioUrls && Object.keys(audioUrls).length > 0) {
      const firstKey = Object.keys(audioUrls)[0];
      setSelectedCharacterKey(firstKey);
    }
  }, [audioUrls]);

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

  const availableVoices = Object.keys(loadedCard.character_voice_interpretations || {});
  const currentInterpretation =
    (loadedCard.character_voice_interpretations && loadedCard.character_voice_interpretations[selectedVoice]) ||
    loadedCard.pip_boy_interpretation ||
    'No interpretation available';

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
            <div className="relative w-32 h-48 flex-shrink-0">
              <Image
                src={loadedCard.image_url}
                alt={`${loadedCard.name} card`}
                fill
                className="object-cover rounded border-2 border-green-700"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-green-400 mb-2">
                {loadedCard.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded text-sm font-bold ${getRarityColor(loadedCard.rarity_level)}`}>
                  {loadedCard.rarity_level.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded text-sm ${getKarmaColor(loadedCard.karma_alignment)}`}>
                  {loadedCard.karma_alignment}
                </span>
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded text-sm">
                  {loadedCard.suit.replace(/_/g, ' ')}
                </span>
              </div>

              {loadedCard.description && (
                <p className="text-gray-300 text-sm">{loadedCard.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Keywords */}
          {loadedCard.keywords && loadedCard.keywords.length > 0 && (
            <div>
              <h3 className="text-green-400 font-semibold mb-2 text-sm uppercase">
                Keywords
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
                Upright
              </h3>
              <p className="text-gray-300 text-sm">{loadedCard.upright_meaning}</p>
            </div>

            <div className="bg-red-900/10 border border-red-900/50 rounded p-4">
              <h3 className="text-red-400 font-semibold mb-2 uppercase text-sm">
                Reversed
              </h3>
              <p className="text-gray-300 text-sm">{loadedCard.reversed_meaning}</p>
            </div>
          </div>

          {/* Character Voice Interpretations */}
          <div>
            <h3 className="text-green-400 font-semibold mb-3 text-sm uppercase">
              Character Interpretations
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
                  {voice.replace(/_/g, ' ').toUpperCase()}
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
                  Fallout Reference
                </h4>
                <p className="text-gray-300 text-sm">{loadedCard.fallout_reference}</p>
              </div>
            )}

            {loadedCard.vault_reference !== undefined && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 text-xs uppercase">
                  Vault Reference
                </h4>
                <p className="text-gray-300 text-sm">Vault {loadedCard.vault_reference}</p>
              </div>
            )}
          </div>

          {/* Wasteland stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1 uppercase">Radiation</div>
              <div className="text-green-400 font-bold">
                {(loadedCard.radiation_factor * 100).toFixed(0)}%
              </div>
            </div>

            {loadedCard.threat_level !== undefined && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">Threat Level</div>
                <div className="text-red-400 font-bold">{loadedCard.threat_level}</div>
              </div>
            )}

            {loadedCard.element && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">Element</div>
                <div className="text-blue-400 font-bold">{loadedCard.element}</div>
              </div>
            )}

            {loadedCard.astrological_association && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 mb-1 uppercase">Astrology</div>
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
                Symbolism
              </h4>
              <p className="text-gray-300 text-sm">{loadedCard.symbolism}</p>
            </div>
          )}

          {/* Wasteland humor */}
          {loadedCard.wasteland_humor && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded p-4">
              <h4 className="text-amber-400 font-semibold mb-2 text-xs uppercase">
                Wasteland Wisdom
              </h4>
              <p className="text-amber-300 text-sm italic">{loadedCard.wasteland_humor}</p>
            </div>
          )}

          {/* Story Mode Section */}
          {loadedCard.story && (
            <div className="mt-6 border-t border-green-900/50 pt-6">
              {/* Story Header with Collapse/Expand Button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-green-400 font-semibold text-lg uppercase flex items-center gap-2">
                  <PixelIcon name="book" sizePreset="sm" variant="primary" decorative />
                  <span>廢土故事模式</span>
                </h3>
                <button
                  onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                  className="px-3 py-1 text-xs text-green-400 border border-green-700 rounded hover:bg-green-900/30 transition-colors flex items-center gap-1"
                  aria-label={isStoryExpanded ? '收起故事' : '展開故事'}
                  aria-expanded={isStoryExpanded}
                >
                  {isStoryExpanded ? (
                    <>
                      <PixelIcon name="chevron-up" sizePreset="xs" decorative />
                      <span>收起</span>
                    </>
                  ) : (
                    <>
                      <PixelIcon name="chevron-down" sizePreset="xs" decorative />
                      <span>展開</span>
                    </>
                  )}
                </button>
              </div>

              {/* Story Content (Collapsible) */}
              {isStoryExpanded && (
                <div className="space-y-4">
                  {/* Story Section */}
                  <StorySection story={loadedCard.story} audioUrls={audioUrls || {}} />

                  {/* Loading State */}
                  {isAudioLoading && (
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded p-3 flex items-start gap-2">
                      <PixelIcon name="loader" sizePreset="xs" variant="info" animation="spin" decorative />
                      <div className="text-blue-400 text-xs">
                        <p className="font-semibold mb-1">載入中</p>
                        <p className="text-blue-300/80">
                          正在生成語音檔案，請稍候...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {audioError && !shouldUseFallback && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded p-3 flex items-start gap-2">
                      <PixelIcon name="alert-triangle" sizePreset="xs" variant="error" decorative />
                      <div className="text-red-400 text-xs">
                        <p className="font-semibold mb-1">錯誤</p>
                        <p className="text-red-300/80">{audioError}</p>
                        <button
                          onClick={generateAudio}
                          className="mt-2 px-2 py-1 bg-red-700/50 hover:bg-red-700 rounded text-xs transition-colors"
                        >
                          重試
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fallback Message */}
                  {shouldUseFallback && (
                    <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-3 flex items-start gap-2">
                      <PixelIcon name="alert-triangle" sizePreset="xs" variant="warning" decorative />
                      <div className="text-yellow-400 text-xs">
                        <p className="font-semibold mb-1">使用瀏覽器朗讀</p>
                        <p className="text-yellow-300/80">
                          伺服器音檔暫時無法使用，已切換至瀏覽器朗讀功能。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio Player Section */}
                  {!isAudioLoading && audioUrls && Object.keys(audioUrls).length > 0 && (
                    <div className="space-y-3">
                      {/* Character Voice Selector */}
                      <div>
                        <h4 className="text-green-400 text-sm font-semibold mb-2 flex items-center gap-2">
                          <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
                          <span>角色語音</span>
                        </h4>
                        <CharacterVoiceSelector
                          characters={Object.keys(audioUrls)}
                          selectedCharacter={selectedCharacterKey}
                          onSelect={setSelectedCharacterKey}
                        />
                      </div>

                      {/* Audio Player */}
                      {selectedCharacterKey && audioUrls[selectedCharacterKey] && (
                        <div>
                          <h4 className="text-green-400 text-sm font-semibold mb-2 flex items-center gap-2">
                            <PixelIcon name="music" sizePreset="xs" variant="primary" decorative />
                            <span>故事朗讀</span>
                          </h4>
                          <StoryAudioPlayer
                            audioUrl={audioUrls[selectedCharacterKey]}
                            characterName={selectedCharacterKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            characterKey={selectedCharacterKey}
                            storyText={loadedCard.story?.background}
                            useFallback={shouldUseFallback}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
