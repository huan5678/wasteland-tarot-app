/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardDetailModal } from './CardDetailModal';
import type { WastelandCard } from '@/types/database';

const mockCard: WastelandCard = {
  id: 'card-123',
  name: 'The Wanderer',
  suit: 'MAJOR_ARCANA',
  card_number: 0,
  number: 0,
  upright_meaning: 'New beginnings, freedom, adventure in the wasteland',
  reversed_meaning: 'Recklessness, lack of direction, naivety',
  description: 'A lone figure steps out from Vault 111 into the unknown wasteland',
  keywords: ['freedom', 'adventure', 'new beginnings', 'wasteland'],
  image_url: '/images/cards/the-wanderer.png',
  radiation_factor: 0.3,
  karma_alignment: 'NEUTRAL',
  fallout_reference: 'The Sole Survivor emerging from Vault 111',
  symbolism: 'Represents the journey of self-discovery in a post-apocalyptic world',
  element: 'Air',
  astrological_association: 'Uranus',
  character_voice_interpretations: {
    pip_boy: 'Pip-Boy says: Adventure awaits, Vault Dweller!',
    super_mutant: 'Me smash new things!',
  },
  pip_boy_interpretation: 'Pip-Boy says: Adventure awaits, Vault Dweller!',
  vault_reference: 111,
  threat_level: 2,
  wasteland_humor: 'War. War never changes, but you can!',
  rarity_level: 'legendary',
  is_active: true,
  is_complete: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('CardDetailModal', () => {
  it('should not render when isOpen is false', () => {
    render(<CardDetailModal card={mockCard} isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText('The Wanderer')).not.toBeInTheDocument();
  });

  it('should render card details when isOpen is true', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
    expect(screen.getByText(/New beginnings, freedom, adventure/i)).toBeInTheDocument();
  });

  it('should display card image', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const image = screen.getByRole('img', { name: /The Wanderer/i });
    expect(image).toHaveAttribute('src', expect.stringContaining('the-wanderer'));
  });

  it('should show upright and reversed meanings', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/upright/i)).toBeInTheDocument();
    expect(screen.getByText(/reversed/i)).toBeInTheDocument();
    expect(screen.getByText(/Recklessness, lack of direction/i)).toBeInTheDocument();
  });

  it('should display Fallout-specific attributes', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const vaultTexts = screen.getAllByText(/Vault 111/i);
    expect(vaultTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/legendary/i)).toBeInTheDocument();
  });

  it('should show keywords as badges', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('freedom')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();
    expect(screen.getByText('new beginnings')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking outside modal', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking inside modal content', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display character voice interpretations', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/Pip-Boy says: Adventure awaits/i)).toBeInTheDocument();
  });

  it('should allow switching between different character voices', async () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    // Should show pip-boy by default
    expect(screen.getByText(/Pip-Boy says/i)).toBeInTheDocument();

    // Find and click super mutant voice button
    const voiceButtons = screen.getAllByRole('button', { name: /voice/i });
    if (voiceButtons.length > 1) {
      fireEvent.click(voiceButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Me smash/i)).toBeInTheDocument();
      });
    }
  });

  it('should display karma alignment with color coding', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const karmaElement = screen.getByText(/NEUTRAL/i);
    expect(karmaElement).toBeInTheDocument();
    expect(karmaElement).toHaveClass(/yellow|neutral/i);
  });

  it('should show radiation factor as visual indicator', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/radiation/i)).toBeInTheDocument();
    // Should display as percentage or visual bar
    expect(screen.getByText(/30%|0\.3/i)).toBeInTheDocument();
  });

  it('should display threat level', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/threat level/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should show wasteland humor section', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/War\. War never changes/i)).toBeInTheDocument();
  });

  it('should support keyboard navigation (Escape to close)', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display astrological and symbolic information', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/Uranus/i)).toBeInTheDocument();
    expect(screen.getByText(/Air/i)).toBeInTheDocument();
    expect(screen.getByText(/self-discovery/i)).toBeInTheDocument();
  });

  it('should handle cards without optional fields gracefully', () => {
    const minimalCard: WastelandCard = {
      ...mockCard,
      description: undefined,
      keywords: undefined,
      fallout_reference: undefined,
      vault_reference: undefined,
      wasteland_humor: undefined,
    };

    render(<CardDetailModal card={minimalCard} isOpen={true} onClose={jest.fn()} />);

    // Should still render without errors
    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
  });

  // ========================================
  // Story Integration Tests (Task 15.1)
  // ========================================

  describe('Story Mode Integration', () => {
    const mockCardWithStory = {
      ...mockCard,
      story: {
        background: '在輻射廢土上，一名初出茅廬的避難所居民踏出了 Vault 的大門，面對著未知的荒蕪世界。他手持 Pip-Boy，心懷希望，準備在這片充滿危險與機會的廢土上書寫自己的傳奇。他不知道前方等待著什麼，但他相信每一步都是新的開始。Brotherhood of Steel 的飛船在遠方劃過天際，NCR 的巡邏隊在公路上來回巡邏。這是一個關於勇氣、希望與生存的故事。',
        character: '避難所居民',
        location: 'Vault 111',
        timeline: '2287 年',
        factionsInvolved: ['Vault-Tec', 'Brotherhood of Steel', 'NCR'],
        relatedQuest: '離開 Vault',
      },
      audioUrls: {
        vault_dweller: 'https://storage.supabase.co/story/test/vault_dweller.mp3',
        pip_boy: 'https://storage.supabase.co/story/test/pip_boy.mp3',
        brotherhood_scribe: 'https://storage.supabase.co/story/test/brotherhood_scribe.mp3',
      },
    };

    it('should render StorySection when card has story content', () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Check for story section heading
      expect(screen.getByText(/故事背景|story background/i)).toBeInTheDocument();

      // Check for story content
      expect(screen.getByText(/輻射廢土/)).toBeInTheDocument();
      expect(screen.getByText(/Vault 的大門/)).toBeInTheDocument();

      // Check for metadata
      expect(screen.getByText('避難所居民')).toBeInTheDocument();
      expect(screen.getByText('Vault 111')).toBeInTheDocument();
      expect(screen.getByText('2287 年')).toBeInTheDocument();
    });

    it('should NOT render StorySection when card has no story content', () => {
      render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

      // Story section should not be present
      expect(screen.queryByText(/故事背景|story background/i)).not.toBeInTheDocument();
    });

    it('should render CharacterVoiceSelector with available voices', () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Check for character voice selector
      expect(screen.getByText(/角色語音|character voice/i)).toBeInTheDocument();

      // Check for available voice options
      expect(screen.getByText(/vault.*dweller/i)).toBeInTheDocument();
      expect(screen.getByText(/pip.*boy/i)).toBeInTheDocument();
      expect(screen.getByText(/brotherhood.*scribe/i)).toBeInTheDocument();
    });

    it('should render StoryAudioPlayer when audio URLs exist', () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Check for audio player element (play button)
      const playButton = screen.getByRole('button', { name: /播放|play/i });
      expect(playButton).toBeInTheDocument();

      // Check for timeline
      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i });
      expect(timeline).toBeInTheDocument();
    });

    it('should update audio player when character voice is selected', async () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Initially should show first voice (vault_dweller)
      expect(screen.getByText(/vault.*dweller/i)).toBeInTheDocument();

      // Select different voice
      const brotherhoodButton = screen.getByRole('button', { name: /brotherhood.*scribe/i });
      fireEvent.click(brotherhoodButton);

      await waitFor(() => {
        // Audio player should update (check if audio element src changed)
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        expect(audioElement?.src).toContain('brotherhood_scribe');
      });
    });

    it('should show loading state when generating audio', async () => {
      const cardWithoutAudio = {
        ...mockCard,
        story: mockCardWithStory.story,
        audioUrls: undefined, // No audio URLs yet
      };

      render(<CardDetailModal card={cardWithoutAudio as any} isOpen={true} onClose={jest.fn()} />);

      // Should show "generating audio" message or loading state
      await waitFor(() => {
        expect(screen.getByText(/生成中|generating|載入中|loading/i)).toBeInTheDocument();
      });
    });

    it('should display error message when audio generation fails', async () => {
      // Mock API call to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('TTS service unavailable'));

      const cardWithoutAudio = {
        ...mockCard,
        story: mockCardWithStory.story,
        audioUrls: undefined,
      };

      render(<CardDetailModal card={cardWithoutAudio as any} isOpen={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/錯誤|error|失敗|failed/i)).toBeInTheDocument();
      });
    });

    it('should show fallback message when using Web Speech API', async () => {
      const cardWithFailedAudio = {
        ...mockCard,
        story: mockCardWithStory.story,
        audioUrls: {
          vault_dweller: 'https://invalid-url.com/audio.mp3', // Will fail to load
        },
      };

      render(<CardDetailModal card={cardWithFailedAudio as any} isOpen={true} onClose={jest.fn()} />);

      // Try to play the audio (will fail)
      const playButton = screen.getByRole('button', { name: /播放|play/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        // Should show fallback message
        expect(screen.getByText(/瀏覽器朗讀|web speech|fallback/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should support collapsing/expanding story section', async () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Find collapse/expand button
      const toggleButton = screen.getByRole('button', { name: /收起|展開|collapse|expand/i });
      expect(toggleButton).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // Story content should be hidden
        expect(screen.queryByText(/輻射廢土/)).not.toBeVisible();
      });

      // Click to expand again
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // Story content should be visible
        expect(screen.getByText(/輻射廢土/)).toBeVisible();
      });
    });

    it('should display faction tags for involved factions', () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Check for faction tags
      expect(screen.getByText(/Vault-Tec/i)).toBeInTheDocument();
      expect(screen.getByText(/Brotherhood of Steel/i)).toBeInTheDocument();
      expect(screen.getByText(/NCR/i)).toBeInTheDocument();
    });

    it('should show related quest information', () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Check for related quest
      expect(screen.getByText(/相關任務|related quest/i)).toBeInTheDocument();
      expect(screen.getByText('離開 Vault')).toBeInTheDocument();
    });

    it('should maintain audio playback state when switching characters', async () => {
      render(<CardDetailModal card={mockCardWithStory as any} isOpen={true} onClose={jest.fn()} />);

      // Start playing audio
      const playButton = screen.getByRole('button', { name: /播放|play/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument();
      });

      // Switch to different character
      const brotherhoodButton = screen.getByRole('button', { name: /brotherhood.*scribe/i });
      fireEvent.click(brotherhoodButton);

      await waitFor(() => {
        // Should still be playing (or restarted with new audio)
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        expect(audioElement?.paused).toBe(false);
      });
    });
  });
});
