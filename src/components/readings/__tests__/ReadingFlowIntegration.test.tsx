import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { ReadingFlowIntegration } from '../ReadingFlowIntegration';

// Mock useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/readings/new',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ReadingFlowIntegration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    sessionStorage.clear();
  });

  describe('Complete Flow Navigation', () => {
    it('should navigate through all stages', async () => {
      const { rerender } = render(
        <ReadingFlowIntegration
          currentStage="select-spread"
          isStageComplete={true}
        />
      );

      // Check initial stage
      expect(screen.getByText('選擇牌陣')).toHaveClass('active');

      // Move to drawing stage
      rerender(
        <ReadingFlowIntegration
          currentStage="drawing"
          isStageComplete={false}
        />
      );

      expect(screen.getByText('抽卡中')).toHaveClass('active');

      // Move to interpretation
      rerender(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
        />
      );

      expect(screen.getByText('解讀生成')).toHaveClass('active');

      // Complete the flow
      rerender(
        <ReadingFlowIntegration
          currentStage="complete"
          isStageComplete={true}
        />
      );

      expect(screen.getByText('完成')).toHaveClass('active');
    });

    it('should show quick actions on completion', () => {
      render(
        <ReadingFlowIntegration
          currentStage="complete"
          isStageComplete={true}
          readingId="test-123"
        />
      );

      expect(screen.getByRole('button', { name: /再抽一次/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /查看歷史/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /分享此解讀/ })).toBeInTheDocument();
    });
  });

  describe('Setting Preservation', () => {
    it('should preserve settings when clicking "Draw Again"', () => {
      const storageSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(
        <ReadingFlowIntegration
          currentStage="complete"
          isStageComplete={true}
          readingId="test-123"
          voiceSettings={{ voice: 'mr-handy' }}
          categorySettings={{ category: 'career' }}
        />
      );

      const drawAgainButton = screen.getByRole('button', { name: /再抽一次/ });
      fireEvent.click(drawAgainButton);

      expect(storageSpy).toHaveBeenCalledWith(
        'preserved-reading-settings',
        expect.stringContaining('"voice":"mr-handy"')
      );
      expect(storageSpy).toHaveBeenCalledWith(
        'preserved-reading-settings',
        expect.stringContaining('"category":"career"')
      );

      storageSpy.mockRestore();
    });

    it('should restore settings when returning from history', () => {
      sessionStorage.setItem(
        'reading-history-filters',
        JSON.stringify({
          tags: 'love',
          category: 'romance',
        })
      );

      render(
        <ReadingFlowIntegration
          currentStage="select-spread"
          isStageComplete={false}
        />
      );

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('tags=love')
      );
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('category=romance')
      );
    });
  });

  describe('Back Button Confirmation', () => {
    it('should prevent navigation on incomplete stage', () => {
      render(
        <ReadingFlowIntegration
          currentStage="drawing"
          isStageComplete={false}
        />
      );

      const selectSpreadButton = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadButton);

      // Should show confirmation
      expect(screen.getByText(/確定要離開嗎？/)).toBeInTheDocument();
      expect(screen.getByText(/未完成的解讀將不會被儲存/)).toBeInTheDocument();
    });

    it('should allow navigation on complete stage', () => {
      const onStageChange = jest.fn();

      render(
        <ReadingFlowIntegration
          currentStage="drawing"
          isStageComplete={true}
          onStageChange={onStageChange}
        />
      );

      const selectSpreadButton = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadButton);

      // Should navigate without confirmation
      expect(screen.queryByText(/確定要離開嗎？/)).not.toBeInTheDocument();
      expect(onStageChange).toHaveBeenCalledWith('select-spread');
    });

    it('should handle browser back button when incomplete', () => {
      let beforeUnloadListener: ((event: BeforeUnloadEvent) => void) | null = null;

      jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
        if (event === 'beforeunload') {
          beforeUnloadListener = listener as (event: BeforeUnloadEvent) => void;
        }
      });

      render(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
          enableBackButtonConfirmation={true}
        />
      );

      const event = new Event('beforeunload') as BeforeUnloadEvent;
      event.preventDefault = jest.fn();

      if (beforeUnloadListener) {
        beforeUnloadListener(event);
      }

      expect(event.preventDefault).toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  describe('Reading Generation Resume', () => {
    it('should restore ongoing interpretation', () => {
      sessionStorage.setItem(
        'reading-generation-resume-test',
        JSON.stringify({
          text: 'Previously generated text...',
          timestamp: Date.now(),
        })
      );

      const onResumeAvailable = jest.fn();

      render(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
          readingId="resume-test"
          onResumeAvailable={onResumeAvailable}
        />
      );

      expect(onResumeAvailable).toHaveBeenCalledWith('Previously generated text...');
    });

    it('should save progress during streaming', () => {
      const storageSpy = jest.spyOn(Storage.prototype, 'setItem');

      const { rerender } = render(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
          readingId="save-test"
          streamingText="Partial interpretation..."
        />
      );

      expect(storageSpy).toHaveBeenCalledWith(
        'reading-generation-save-test',
        expect.stringContaining('"text":"Partial interpretation..."')
      );

      storageSpy.mockRestore();
    });

    it('should clear progress on completion', () => {
      const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

      sessionStorage.setItem(
        'reading-generation-clear-test',
        JSON.stringify({ text: 'Some text', timestamp: Date.now() })
      );

      const { rerender } = render(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
          readingId="clear-test"
        />
      );

      // Complete the reading
      rerender(
        <ReadingFlowIntegration
          currentStage="complete"
          isStageComplete={true}
          readingId="clear-test"
        />
      );

      expect(removeSpy).toHaveBeenCalledWith('reading-generation-clear-test');

      removeSpy.mockRestore();
    });
  });

  describe('Mobile Swipe Gestures', () => {
    it('should support swipe left for next stage', () => {
      const onStageChange = jest.fn();

      render(
        <ReadingFlowIntegration
          currentStage="select-spread"
          isStageComplete={true}
          onStageChange={onStageChange}
          enableMobileGestures={true}
        />
      );

      const container = screen.getByRole('navigation').closest('div');

      // Simulate swipe left
      fireEvent.touchStart(container!, { touches: [{ clientX: 300, clientY: 100 }] });
      fireEvent.touchMove(container!, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(container!);

      // Should advance to next stage
      expect(onStageChange).toHaveBeenCalledWith('drawing');
    });

    it('should support swipe right for previous stage', () => {
      const onStageChange = jest.fn();

      render(
        <ReadingFlowIntegration
          currentStage="interpretation"
          isStageComplete={false}
          onStageChange={onStageChange}
          enableMobileGestures={true}
        />
      );

      const container = screen.getByRole('navigation').closest('div');

      // Simulate swipe right
      fireEvent.touchStart(container!, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(container!, { touches: [{ clientX: 300, clientY: 100 }] });
      fireEvent.touchEnd(container!);

      // Should show confirmation for incomplete stage
      expect(screen.getByText(/確定要離開嗎？/)).toBeInTheDocument();
    });
  });

  describe('Smooth Transitions', () => {
    it('should animate stage changes', async () => {
      const { rerender } = render(
        <ReadingFlowIntegration
          currentStage="select-spread"
          isStageComplete={true}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25'); // 1/4 stages

      rerender(
        <ReadingFlowIntegration
          currentStage="drawing"
          isStageComplete={false}
        />
      );

      // Should update progress
      await waitFor(() => {
        expect(progressBar).toHaveAttribute('aria-valuenow', '50'); // 2/4 stages
      });
    });

    it('should have transition classes on stage buttons', () => {
      render(
        <ReadingFlowIntegration
          currentStage="drawing"
          isStageComplete={false}
        />
      );

      const stageButton = screen.getByText('抽卡中').closest('button');
      expect(stageButton).toHaveClass('transition-colors');
    });
  });
});
