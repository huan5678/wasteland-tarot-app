/**
 * WastelandStorySection Component
 *
 * Reusable component for displaying Wasteland Story Mode content
 * Includes:
 * - Story narration audio player
 * - Story background text
 * - Story metadata (character, location, timeline, quest)
 * - Factions involved
 *
 * Used in:
 * - /cards/[suit]/[cardId]/page.tsx
 * - CardDetailModal.tsx
 */

'use client'

import React from 'react'
import { PipBoyCard } from '@/components/ui/pipboy/PipBoyCard'
import StoryAudioPlayer from '@/components/tarot/StoryAudioPlayer'
import type { Story } from '@/types/database'

export interface WastelandStorySectionProps {
  /**
   * Story data containing background, character, location, etc.
   */
  story: Story | undefined

  /**
   * Audio URLs for different character voices
   * Format: { character_key: audio_url }
   */
  audioUrls?: Record<string, string>

  /**
   * Card name for accessibility labels
   */
  cardName?: string
}

/**
 * WastelandStorySection - Complete story display component
 *
 * @example
 * ```tsx
 * <WastelandStorySection
 *   story={card.story}
 *   audioUrls={card.audio_urls}
 *   cardName={card.name}
 * />
 * ```
 */
export function WastelandStorySection({
  story,
  audioUrls,
  cardName,
}: WastelandStorySectionProps) {
  // Don't render if no story data
  if (!story) {
    return null
  }

  // Normalize audio URLs (support both camelCase and snake_case)
  const normalizedAudioUrls = audioUrls || {}

  // Check if audio is available
  const hasAudio = Object.keys(normalizedAudioUrls).length > 0

  return (
    <PipBoyCard>
      <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
        廢土故事
      </h2>

      {/* Story Narration Audio Player */}
      {hasAudio && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-pip-boy-green mb-3">故事旁白</h3>
          <div className="space-y-3">
            {Object.entries(normalizedAudioUrls).map(([characterKey, audioUrl]) => (
              <StoryAudioPlayer
                key={characterKey}
                audioUrl={audioUrl}
                characterName={characterKey === 'pip_boy' ? 'Pip-Boy' : characterKey}
                characterKey={characterKey}
                storyText={story.background}
                volume={0.8}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 text-sm md:text-base text-pip-boy-green/70">
        {/* Story Background */}
        <div className={hasAudio ? "pt-4 border-t border-pip-boy-green/30" : ""}>
          <h3 className="text-lg font-semibold text-pip-boy-green mb-2">故事背景</h3>
          <p className="leading-relaxed whitespace-pre-wrap">{story.background}</p>
        </div>

        {/* Story Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-pip-boy-green/30">
          <div>
            <span className="font-semibold text-pip-boy-green">主角：</span>
            <span className="ml-2">{story.character}</span>
          </div>
          <div>
            <span className="font-semibold text-pip-boy-green">地點：</span>
            <span className="ml-2">{story.location}</span>
          </div>
          <div>
            <span className="font-semibold text-pip-boy-green">時間：</span>
            <span className="ml-2">{story.timeline}</span>
          </div>
          {story.relatedQuest && (
            <div>
              <span className="font-semibold text-pip-boy-green">相關任務：</span>
              <span className="ml-2">{story.relatedQuest}</span>
            </div>
          )}
        </div>

        {/* Factions Involved */}
        {story.factionsInvolved && story.factionsInvolved.length > 0 && (
          <div className="pt-4 border-t border-pip-boy-green/30">
            <h3 className="text-lg font-semibold text-pip-boy-green mb-2">涉及陣營</h3>
            <div className="flex flex-wrap gap-2">
              {story.factionsInvolved.map((faction, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-pip-boy-green text-sm"
                  aria-label={`陣營: ${faction}`}
                >
                  {faction}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </PipBoyCard>
  )
}
