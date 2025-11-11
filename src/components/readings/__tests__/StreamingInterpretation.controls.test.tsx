/**
 * StreamingInterpretation - Streaming Controls UI Tests
 *
 * Tests for Task 4.2: Implement streaming controls UI
 * - Pause/resume button
 * - 2x speed button
 * - Skip to full content button
 * - Terminal loading animation
 * - Interpretation complete notification
 *
 * @see requirements.md Requirement 2.1, 2.7, 2.10
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreamingInterpretation } from '../StreamingInterpretation';
import * as useStreamingTextModule from '@/hooks/useStreamingText';

// Mock useStreamingText hook
jest.mock('@/hooks/useStreamingText');

const mockUseStreamingText = useStreamingTextModule.useStreamingText as jest.MockedFunction<
  typeof useStreamingTextModule.useStreamingText
>;

describe('StreamingInterpretation - Streaming Controls UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pause/Resume Controls', () => {
    it('should display pause button when streaming', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        // New controls
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const pauseButton = screen.getByLabelText('Pause streaming');
      expect(pauseButton).toBeInTheDocument();
      expect(pauseButton).toHaveTextContent('Pause');
    });

    it('should display resume button when paused', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: true, // Paused state
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const resumeButton = screen.getByLabelText('Resume streaming');
      expect(resumeButton).toBeInTheDocument();
      expect(resumeButton).toHaveTextContent('Resume');
    });

    it('should call pause when pause button is clicked', () => {
      const mockPause = jest.fn();

      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: mockPause,
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const pauseButton = screen.getByLabelText('Pause streaming');
      fireEvent.click(pauseButton);

      expect(mockPause).toHaveBeenCalledTimes(1);
    });

    it('should call resume when resume button is clicked', () => {
      const mockResume = jest.fn();

      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: mockResume,
        togglePause: jest.fn(),
        isPaused: true,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const resumeButton = screen.getByLabelText('Resume streaming');
      fireEvent.click(resumeButton);

      expect(mockResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Speed Controls', () => {
    it('should display 2x speed button when streaming', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const speedButton = screen.getByLabelText('Toggle 2x speed');
      expect(speedButton).toBeInTheDocument();
      expect(speedButton).toHaveTextContent('2x');
    });

    it('should toggle speed when 2x button is clicked', () => {
      const mockSetSpeed = jest.fn();

      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: mockSetSpeed,
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const speedButton = screen.getByLabelText('Toggle 2x speed');
      fireEvent.click(speedButton);

      expect(mockSetSpeed).toHaveBeenCalledWith(2);
    });

    it('should reset to 1x speed when clicked at 2x', () => {
      const mockSetSpeed = jest.fn();

      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: mockSetSpeed,
        currentSpeed: 2, // Currently at 2x
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const speedButton = screen.getByLabelText('Toggle 2x speed');
      fireEvent.click(speedButton);

      expect(mockSetSpeed).toHaveBeenCalledWith(1);
    });

    it('should display active state when at 2x speed', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 2, // Active
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const speedButton = screen.getByLabelText('Toggle 2x speed');
      expect(speedButton).toHaveClass('active');
    });
  });

  describe('Skip Button', () => {
    it('should display skip button when streaming', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const skipButton = screen.getByLabelText('Skip to full text');
      expect(skipButton).toBeInTheDocument();
      expect(skipButton).toHaveTextContent('Skip');
    });

    it('should call skip when skip button is clicked', () => {
      const mockSkip = jest.fn();

      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: mockSkip,
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const skipButton = screen.getByLabelText('Skip to full text');
      fireEvent.click(skipButton);

      expect(mockSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('Control Button Layout', () => {
    it('should display all control buttons in correct order', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello World',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      const pauseButton = screen.getByLabelText('Pause streaming');
      const speedButton = screen.getByLabelText('Toggle 2x speed');
      const skipButton = screen.getByLabelText('Skip to full text');

      expect(pauseButton).toBeInTheDocument();
      expect(speedButton).toBeInTheDocument();
      expect(skipButton).toBeInTheDocument();

      // Check order in DOM
      const controlsContainer = screen.getByTestId('streaming-controls');
      const buttons = controlsContainer.querySelectorAll('button');

      expect(buttons[0]).toBe(pauseButton);
      expect(buttons[1]).toBe(speedButton);
      expect(buttons[2]).toBe(skipButton);
    });

    it('should hide controls when streaming is complete', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Full text content',
        isStreaming: false,
        isComplete: true,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      // Controls should not be present
      expect(screen.queryByLabelText('Pause streaming')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Toggle 2x speed')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Skip to full text')).not.toBeInTheDocument();

      // Completion message should be shown
      expect(screen.getByText('Interpretation complete')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should display terminal loading animation when waiting for AI', () => {
      mockUseStreamingText.mockReturnValue({
        text: '',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading animation once text starts streaming', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Hello',
        isStreaming: true,
        isComplete: false,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument();
    });
  });

  describe('Completion Notification', () => {
    it('should display completion notification when streaming is complete', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Full interpretation text',
        isStreaming: false,
        isComplete: true,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
        />
      );

      expect(screen.getByText('Interpretation complete')).toBeInTheDocument();
      expect(screen.getByTestId('completion-icon')).toBeInTheDocument();
    });

    it('should enable save button when interpretation is complete', () => {
      mockUseStreamingText.mockReturnValue({
        text: 'Full interpretation text',
        isStreaming: false,
        isComplete: true,
        error: null,
        skip: jest.fn(),
        reset: jest.fn(),
        retryCount: 0,
        isRetrying: false,
        isOnline: true,
        usedFallback: false,
        errorType: null,
        userFriendlyError: null,
        recoverySuggestion: null,
        pause: jest.fn(),
        resume: jest.fn(),
        togglePause: jest.fn(),
        isPaused: false,
        setSpeed: jest.fn(),
        currentSpeed: 1,
        isBatchRendering: false,
        batchSize: 1,
        simulateLowFPS: jest.fn(),
        enableRandomVariation: false
      });

      const mockOnComplete = jest.fn();

      render(
        <StreamingInterpretation
          cardId="test-card"
          question="Test question"
          enabled={true}
          onComplete={mockOnComplete}
        />
      );

      // Save button should be enabled (implementation in parent component)
      expect(mockOnComplete).toHaveBeenCalledWith('Full interpretation text');
    });
  });
});
