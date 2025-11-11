'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ReadingStage {
  id: string;
  label: string;
}

export interface ReadingFlowNavigationProps {
  stages: ReadingStage[];
  currentStage: string;
  isCurrentStageComplete?: boolean;
  onStageChange?: (stageId: string) => void;
}

export function ReadingFlowNavigation({
  stages,
  currentStage,
  isCurrentStageComplete = true,
  onStageChange,
}: ReadingFlowNavigationProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStage, setPendingStage] = useState<string | null>(null);

  const currentIndex = stages.findIndex((stage) => stage.id === currentStage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  const handleStageClick = (stageId: string, stageIndex: number) => {
    // Disable future stages
    if (stageIndex > currentIndex) {
      return;
    }

    // Show confirmation if current stage is incomplete
    if (!isCurrentStageComplete && stageId !== currentStage) {
      setPendingStage(stageId);
      setShowConfirmation(true);
      return;
    }

    // Navigate directly if stage is complete or same stage
    onStageChange?.(stageId);
  };

  const handleConfirmNavigation = () => {
    if (pendingStage) {
      onStageChange?.(pendingStage);
      setShowConfirmation(false);
      setPendingStage(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmation(false);
    setPendingStage(null);
  };

  return (
    <>
      <nav
        className="flex flex-col gap-4 bg-pip-boy-dark/50 border border-pip-boy-green/20 rounded-lg p-4"
        aria-label="解讀流程導航"
      >
        {/* Progress Bar */}
        <div
          className="w-full h-2 bg-pip-boy-dark rounded-full overflow-hidden"
          role="progressbar"
          aria-label="解讀進度"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-pip-boy-green transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Buttons */}
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id, index)}
                disabled={isFuture}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'px-4 py-2 rounded border transition-colors',
                  'font-cubic text-sm',
                  isActive && 'active bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green',
                  isPast && 'bg-pip-boy-dark border-pip-boy-green/40 text-pip-boy-green/70 hover:bg-pip-boy-green/10',
                  isFuture && 'bg-pip-boy-dark/30 border-pip-boy-green/10 text-pip-boy-green/30 cursor-not-allowed'
                )}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={handleCancelNavigation}
        >
          <div
            className="bg-pip-boy-dark border border-pip-boy-green rounded-lg p-6 max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-cubic text-pip-boy-green mb-4">
              確定要離開嗎？
            </h2>
            <p className="text-pip-boy-green/80 font-cubic mb-6">
              未完成的解讀將不會被儲存
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleCancelNavigation}
                variant="outline"
                className="border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmNavigation}
                className="bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/30"
              >
                確定
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
