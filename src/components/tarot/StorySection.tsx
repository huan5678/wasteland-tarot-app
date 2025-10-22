/**
 * StorySection Component
 * Displays story content with metadata (character, location, timeline, factions)
 */

import type { Story } from '@/types/database'

interface StorySectionProps {
  story: Story | null
  audioUrls: Record<string, string>
}

export function StorySection({ story, audioUrls }: StorySectionProps) {
  if (!story) return null

  return (
    <div className="story-section border-2 border-pip-boy-green rounded-lg p-4 bg-black/40">
      {/* Story Background */}
      <div className="story-background mb-4">
        <h3 className="text-pip-boy-green text-lg font-semibold mb-2">故事背景</h3>
        <p className="text-pip-boy-green/80 leading-relaxed text-sm">
          {story.background}
        </p>
      </div>

      {/* Metadata Grid */}
      <div className="story-metadata grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-pip-boy-green/60">角色：</span>
          <span className="text-pip-boy-green">{story.character}</span>
        </div>
        <div>
          <span className="text-pip-boy-green/60">地點：</span>
          <span className="text-pip-boy-green">{story.location}</span>
        </div>
        <div>
          <span className="text-pip-boy-green/60">時間：</span>
          <span className="text-pip-boy-green">{story.timeline}</span>
        </div>
        {story.relatedQuest && (
          <div>
            <span className="text-pip-boy-green/60">相關任務：</span>
            <span className="text-pip-boy-green">{story.relatedQuest}</span>
          </div>
        )}
      </div>

      {/* Factions */}
      <div className="story-factions">
        <span className="text-pip-boy-green/60 text-sm">陣營：</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {story.factionsInvolved.map((faction) => (
            <span
              key={faction}
              className="px-2 py-1 bg-pip-boy-green/20 text-pip-boy-green text-xs rounded border border-pip-boy-green/40"
            >
              {faction}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
