/**
 * StorySection Component Tests (TDD - Red Phase)
 * Tests for story content display component
 */

import { render, screen } from '@testing-library/react'
import { StorySection } from '../StorySection'
import type { Story } from '@/types/database'

const mockStory: Story = {
  background: '在輻射廢土上,一名初出茅廬的避難所居民踏出了 Vault 的大門,面對著未知的荒蕪世界。他手持 Pip-Boy,心懷希望,準備在這片充滿危險與機會的廢土上書寫自己的傳奇。他不知道前方等待著什麼,但他相信每一步都是新的開始。Brotherhood of Steel 的飛船在遠方劃過天際,NCR 的巡邏隊在公路上來回巡邏。',
  character: '避難所居民',
  location: 'Vault 111',
  timeline: '2287 年',
  factionsInvolved: ['Vault-Tec', 'Brotherhood of Steel', 'NCR'],
  relatedQuest: '離開 Vault',
}

const mockAudioUrls = {
  'vault_dweller': 'https://storage.supabase.co/story/test/vault_dweller.mp3',
  'pip_boy': 'https://storage.supabase.co/story/test/pip_boy.mp3',
}

describe('StorySection', () => {
  it('should render story background text', () => {
    render(<StorySection story={mockStory} audioUrls={mockAudioUrls} />)

    // Check for story background heading
    expect(screen.getByText('故事背景')).toBeInTheDocument()

    // Check for unique story background content
    expect(screen.getByText(/輻射廢土/)).toBeInTheDocument()
    expect(screen.getByText(/Vault 的大門/)).toBeInTheDocument()
    expect(screen.getByText(/手持 Pip-Boy/)).toBeInTheDocument()
  })

  it('should display metadata (character, location, timeline)', () => {
    render(<StorySection story={mockStory} audioUrls={mockAudioUrls} />)

    // Check for labels
    expect(screen.getByText(/角色/)).toBeInTheDocument()
    expect(screen.getByText(/地點/)).toBeInTheDocument()
    expect(screen.getByText(/時間/)).toBeInTheDocument()

    // Check for values
    expect(screen.getByText('避難所居民')).toBeInTheDocument()
    expect(screen.getByText('Vault 111')).toBeInTheDocument()
    expect(screen.getByText('2287 年')).toBeInTheDocument()
  })

  it('should display factions involved', () => {
    render(<StorySection story={mockStory} audioUrls={mockAudioUrls} />)

    expect(screen.getByText(/陣營/)).toBeInTheDocument()
    expect(screen.getByText('Vault-Tec')).toBeInTheDocument()
    expect(screen.getByText('Brotherhood of Steel')).toBeInTheDocument()
    expect(screen.getByText('NCR')).toBeInTheDocument()
  })

  it('should display related quest when provided', () => {
    render(<StorySection story={mockStory} audioUrls={mockAudioUrls} />)

    expect(screen.getByText(/相關任務/)).toBeInTheDocument()
    expect(screen.getByText('離開 Vault')).toBeInTheDocument()
  })

  it('should hide when no story provided', () => {
    const { container } = render(<StorySection story={null} audioUrls={{}} />)

    expect(container.firstChild).toBeNull()
  })

  it('should not display related quest section when quest is undefined', () => {
    const storyWithoutQuest: Story = {
      ...mockStory,
      relatedQuest: undefined,
    }

    render(<StorySection story={storyWithoutQuest} audioUrls={mockAudioUrls} />)

    expect(screen.queryByText(/相關任務/)).not.toBeInTheDocument()
  })

  it('should render with Fallout Pip-Boy styling classes', () => {
    const { container } = render(<StorySection story={mockStory} audioUrls={mockAudioUrls} />)

    // Check for Pip-Boy Green color classes
    const section = container.querySelector('.story-section')
    expect(section).toBeInTheDocument()
    expect(section).toHaveClass('border-pip-boy-green')
  })
})
