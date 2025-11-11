'use client';

import { useEffect } from 'react';
import { ReadingFlowNavigation, ReadingStage } from './ReadingFlowNavigation';
import { ReadingQuickActions } from './ReadingQuickActions';
import { HistoryToNewReadingFlow } from './HistoryToNewReadingFlow';
import { useBackButtonConfirmation } from '@/hooks/useBackButtonConfirmation';
import { useReadingGenerationResume } from '@/hooks/useReadingGenerationResume';

export interface ReadingFlowIntegrationProps {
  currentStage: string;
  isStageComplete: boolean;
  readingId?: string;
  voiceSettings?: Record<string, unknown>;
  categorySettings?: Record<string, unknown>;
  streamingText?: string;
  onStageChange?: (stageId: string) => void;
  onShare?: (readingId: string) => void;
  onResumeAvailable?: (savedText: string) => void;
  enableBackButtonConfirmation?: boolean;
  enableMobileGestures?: boolean;
}

const READING_STAGES: ReadingStage[] = [
  { id: 'select-spread', label: '選擇牌陣' },
  { id: 'drawing', label: '抽卡中' },
  { id: 'interpretation', label: '解讀生成' },
  { id: 'complete', label: '完成' },
];

/**
 * Integrated reading flow component that combines:
 * - Stage navigation
 * - Quick actions
 * - Back button confirmation
 * - Reading generation resume
 * - Setting preservation
 *
 * @example
 * ```tsx
 * <ReadingFlowIntegration
 *   currentStage="interpretation"
 *   isStageComplete={false}
 *   readingId={reading.id}
 *   enableBackButtonConfirmation={true}
 *   onResumeAvailable={(text) => {
 *     showNotification('繼續未完成的解讀...');
 *   }}
 * />
 * ```
 */
export function ReadingFlowIntegration({
  currentStage,
  isStageComplete,
  readingId,
  voiceSettings,
  categorySettings,
  streamingText,
  onStageChange,
  onShare,
  onResumeAvailable,
  enableBackButtonConfirmation = false,
  enableMobileGestures = false,
}: ReadingFlowIntegrationProps) {
  // Back button confirmation for incomplete readings
  useBackButtonConfirmation({
    enabled: enableBackButtonConfirmation && !isStageComplete && currentStage !== 'select-spread',
    message: '確定要離開嗎？未完成的解讀將不會被儲存',
  });

  // Reading generation resume
  const {
    hasIncompleteReading,
    savedText,
    saveProgress,
    clearProgress,
  } = useReadingGenerationResume({
    readingId: readingId || '',
    enabled: !!readingId && currentStage === 'interpretation',
    onResumeAvailable,
  });

  // Save progress during streaming
  useEffect(() => {
    if (streamingText && currentStage === 'interpretation' && !isStageComplete) {
      saveProgress(streamingText);
    }
  }, [streamingText, currentStage, isStageComplete, saveProgress]);

  // Clear progress on completion
  useEffect(() => {
    if (currentStage === 'complete' && isStageComplete) {
      clearProgress();
    }
  }, [currentStage, isStageComplete, clearProgress]);

  // Mobile swipe gestures (placeholder - full implementation would use touch events)
  useEffect(() => {
    if (!enableMobileGestures) {
      return;
    }

    // Implementation would handle touchStart, touchMove, touchEnd events
    // for swipe navigation between stages
  }, [enableMobileGestures, currentStage, onStageChange]);

  const isComplete = currentStage === 'complete';

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <ReadingFlowNavigation
        stages={READING_STAGES}
        currentStage={currentStage}
        isCurrentStageComplete={isStageComplete}
        onStageChange={onStageChange}
      />

      {/* Quick Actions (shown on completion) */}
      {isComplete && readingId && (
        <ReadingQuickActions
          readingId={readingId}
          voiceSettings={voiceSettings}
          categorySettings={categorySettings}
          onShare={onShare}
        />
      )}

      {/* Resume Notification */}
      {hasIncompleteReading && currentStage === 'interpretation' && (
        <div className="p-4 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded-lg">
          <p className="text-pip-boy-green font-cubic text-sm">
            📝 偵測到未完成的解讀，正在繼續生成...
          </p>
        </div>
      )}
    </div>
  );
}
