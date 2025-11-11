import { render, screen, fireEvent, within } from '@testing-library/react';
import { ReadingFlowNavigation } from '../ReadingFlowNavigation';

describe('ReadingFlowNavigation', () => {
  const stages = [
    { id: 'select-spread', label: '選擇牌陣' },
    { id: 'drawing', label: '抽卡中' },
    { id: 'interpretation', label: '解讀生成' },
    { id: 'complete', label: '完成' },
  ];

  describe('Stage Display', () => {
    it('should render all stages', () => {
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="select-spread"
        />
      );

      expect(screen.getByText('選擇牌陣')).toBeInTheDocument();
      expect(screen.getByText('抽卡中')).toBeInTheDocument();
      expect(screen.getByText('解讀生成')).toBeInTheDocument();
      expect(screen.getByText('完成')).toBeInTheDocument();
    });

    it('should highlight active stage', () => {
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
        />
      );

      const drawingStage = screen.getByText('抽卡中').closest('button');
      expect(drawingStage).toHaveClass('active');
    });

    it('should show progress indicator', () => {
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="interpretation"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      // Stage 3 of 4 = 75% progress
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Stage Navigation', () => {
    it('should allow clicking previous stages', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="interpretation"
          onStageChange={onStageChange}
        />
      );

      const selectSpreadStage = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadStage);

      expect(onStageChange).toHaveBeenCalledWith('select-spread');
    });

    it('should disable clicking future stages', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
          onStageChange={onStageChange}
        />
      );

      const interpretationStage = screen.getByText('解讀生成').closest('button');
      expect(interpretationStage).toBeDisabled();

      fireEvent.click(interpretationStage!);
      expect(onStageChange).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation for Incomplete Stage', () => {
    it('should show confirmation when leaving incomplete stage', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
          isCurrentStageComplete={false}
          onStageChange={onStageChange}
        />
      );

      const selectSpreadStage = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadStage);

      // Should show confirmation dialog
      expect(screen.getByText(/確定要離開嗎？/)).toBeInTheDocument();
      expect(screen.getByText(/未完成的解讀將不會被儲存/)).toBeInTheDocument();
    });

    it('should navigate when confirmation is accepted', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
          isCurrentStageComplete={false}
          onStageChange={onStageChange}
        />
      );

      const selectSpreadStage = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadStage);

      const confirmButton = screen.getByRole('button', { name: /確定/ });
      fireEvent.click(confirmButton);

      expect(onStageChange).toHaveBeenCalledWith('select-spread');
    });

    it('should not navigate when confirmation is cancelled', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
          isCurrentStageComplete={false}
          onStageChange={onStageChange}
        />
      );

      const selectSpreadStage = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadStage);

      const cancelButton = screen.getByRole('button', { name: /取消/ });
      fireEvent.click(cancelButton);

      expect(onStageChange).not.toHaveBeenCalled();
    });

    it('should not show confirmation if stage is complete', () => {
      const onStageChange = jest.fn();
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
          isCurrentStageComplete={true}
          onStageChange={onStageChange}
        />
      );

      const selectSpreadStage = screen.getByText('選擇牌陣');
      fireEvent.click(selectSpreadStage);

      // Should navigate directly without confirmation
      expect(screen.queryByText(/確定要離開嗎？/)).not.toBeInTheDocument();
      expect(onStageChange).toHaveBeenCalledWith('select-spread');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="drawing"
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', '解讀流程導航');

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', '解讀進度');
    });

    it('should indicate current step to screen readers', () => {
      render(
        <ReadingFlowNavigation
          stages={stages}
          currentStage="interpretation"
        />
      );

      const activeStage = screen.getByText('解讀生成').closest('button');
      expect(activeStage).toHaveAttribute('aria-current', 'step');
    });
  });
});
