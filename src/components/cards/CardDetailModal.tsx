'use client';

import React, { useState, useEffect } from 'react';
import type { WastelandCard } from '@/types/database';
import Image from 'next/image';

interface CardDetailModalProps {
  card: WastelandCard;
  isOpen: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('pip_boy');

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

  const availableVoices = Object.keys(card.character_voice_interpretations);
  const currentInterpretation =
    card.character_voice_interpretations[selectedVoice] ||
    card.pip_boy_interpretation ||
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
                src={card.image_url}
                alt={`${card.name} card`}
                fill
                className="object-cover rounded border-2 border-green-700"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-green-400 font-mono mb-2">
                {card.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${getRarityColor(card.rarity_level)}`}>
                  {card.rarity_level.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded font-mono text-sm ${getKarmaColor(card.karma_alignment)}`}>
                  {card.karma_alignment}
                </span>
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded font-mono text-sm">
                  {card.suit.replace(/_/g, ' ')}
                </span>
              </div>

              {card.description && (
                <p className="text-gray-300 font-mono text-sm">{card.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Keywords */}
          {card.keywords && card.keywords.length > 0 && (
            <div>
              <h3 className="text-green-400 font-mono font-semibold mb-2 text-sm uppercase">
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {card.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs font-mono"
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
              <h3 className="text-green-400 font-mono font-semibold mb-2 uppercase text-sm">
                Upright
              </h3>
              <p className="text-gray-300 text-sm">{card.upright_meaning}</p>
            </div>

            <div className="bg-red-900/10 border border-red-900/50 rounded p-4">
              <h3 className="text-red-400 font-mono font-semibold mb-2 uppercase text-sm">
                Reversed
              </h3>
              <p className="text-gray-300 text-sm">{card.reversed_meaning}</p>
            </div>
          </div>

          {/* Character Voice Interpretations */}
          <div>
            <h3 className="text-green-400 font-mono font-semibold mb-3 text-sm uppercase">
              Character Interpretations
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableVoices.map((voice) => (
                <button
                  key={voice}
                  onClick={() => setSelectedVoice(voice)}
                  className={`px-3 py-1 rounded font-mono text-sm transition-colors ${
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
              <p className="text-green-300 font-mono text-sm">{currentInterpretation}</p>
            </div>
          </div>

          {/* Fallout-specific details */}
          <div className="grid md:grid-cols-2 gap-4">
            {card.fallout_reference && (
              <div>
                <h4 className="text-green-400 font-mono font-semibold mb-2 text-xs uppercase">
                  Fallout Reference
                </h4>
                <p className="text-gray-300 text-sm">{card.fallout_reference}</p>
              </div>
            )}

            {card.vault_reference !== undefined && (
              <div>
                <h4 className="text-green-400 font-mono font-semibold mb-2 text-xs uppercase">
                  Vault Reference
                </h4>
                <p className="text-gray-300 text-sm">Vault {card.vault_reference}</p>
              </div>
            )}
          </div>

          {/* Wasteland stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
              <div className="text-xs text-gray-400 font-mono mb-1 uppercase">Radiation</div>
              <div className="text-green-400 font-mono font-bold">
                {(card.radiation_factor * 100).toFixed(0)}%
              </div>
            </div>

            {card.threat_level !== undefined && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 font-mono mb-1 uppercase">Threat Level</div>
                <div className="text-red-400 font-mono font-bold">{card.threat_level}</div>
              </div>
            )}

            {card.element && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 font-mono mb-1 uppercase">Element</div>
                <div className="text-blue-400 font-mono font-bold">{card.element}</div>
              </div>
            )}

            {card.astrological_association && (
              <div className="bg-black/40 border border-green-900/50 rounded p-3 text-center">
                <div className="text-xs text-gray-400 font-mono mb-1 uppercase">Astrology</div>
                <div className="text-purple-400 font-mono font-bold">
                  {card.astrological_association}
                </div>
              </div>
            )}
          </div>

          {/* Symbolism */}
          {card.symbolism && (
            <div>
              <h4 className="text-green-400 font-mono font-semibold mb-2 text-xs uppercase">
                Symbolism
              </h4>
              <p className="text-gray-300 text-sm">{card.symbolism}</p>
            </div>
          )}

          {/* Wasteland humor */}
          {card.wasteland_humor && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded p-4">
              <h4 className="text-amber-400 font-mono font-semibold mb-2 text-xs uppercase">
                Wasteland Wisdom
              </h4>
              <p className="text-amber-300 font-mono text-sm italic">{card.wasteland_humor}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
