/**
 * Unit Tests - ActivityProgressCard Component
 *
 * Feature: 活躍度進度條元件
 * Test Coverage: UI rendering, state updates, edge cases
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ActivityProgressCard from '../ActivityProgressCard'

describe('ActivityProgressCard', () => {
  // Test Suite 1: Basic Rendering
  describe('Rendering', () => {
    test('should render card title correctly', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      expect(screen.getByText(/Pip-Boy 活躍度系統/i)).toBeInTheDocument()
    })

    test('should render progress bar component', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      // Progress bar 應該顯示 0%
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    test('should render time display in MM:SS format', () => {
      // 15 分鐘 = 900000 毫秒
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={900000}
          progress={50}
        />
      )

      expect(screen.getByText(/15:00/)).toBeInTheDocument()
      expect(screen.getByText(/30:00/)).toBeInTheDocument() // 目標時間
    })

    test('should render hint text', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      expect(
        screen.getByText(/保持活躍 30 分鐘即可自動延長 Token/i)
      ).toBeInTheDocument()
    })
  })

  // Test Suite 2: Active State Indicator
  describe('Active State Indicator', () => {
    test('should show ACTIVE label when isActive is true', () => {
      render(
        <ActivityProgressCard
          isActive={true}
          activeTime={0}
          progress={0}
        />
      )

      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    })

    test('should show IDLE label when isActive is false', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      expect(screen.getByText('IDLE')).toBeInTheDocument()
    })

    test('should apply pulse animation class when active', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={true}
          activeTime={0}
          progress={0}
        />
      )

      const statusElement = container.querySelector('[data-testid="status-indicator"]')
      expect(statusElement).toHaveClass('animate-pulse')
    })

    test('should not apply pulse animation when idle', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      const statusElement = container.querySelector('[data-testid="status-indicator"]')
      expect(statusElement).not.toHaveClass('animate-pulse')
    })
  })

  // Test Suite 3: Progress Bar Behavior
  describe('Progress Bar Updates', () => {
    test('should show 0% when progress is 0', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    test('should show 50% when progress is 50', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={900000}
          progress={50}
        />
      )

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    test('should show 100% when progress reaches 100', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={1800000}
          progress={100}
        />
      )

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    test('should clamp progress to 100 if value exceeds', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={2000000}
          progress={110}
        />
      )

      // 即使 progress 超過 100，仍然只顯示 100%
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  // Test Suite 4: Time Formatting
  describe('Time Formatting', () => {
    test('should format 0 milliseconds as 00:00', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      expect(screen.getByText(/00:00/)).toBeInTheDocument()
    })

    test('should format 1 minute (60000ms) as 01:00', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={60000}
          progress={3.33}
        />
      )

      expect(screen.getByText(/01:00/)).toBeInTheDocument()
    })

    test('should format 15 minutes 30 seconds (930000ms) as 15:30', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={930000}
          progress={51.67}
        />
      )

      expect(screen.getByText(/15:30/)).toBeInTheDocument()
    })

    test('should format 30 minutes (1800000ms) as 30:00', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={1800000}
          progress={100}
        />
      )

      expect(screen.getByText(/30:00/)).toBeInTheDocument()
    })
  })

  // Test Suite 5: Completion State
  describe('Completion State', () => {
    test('should show completion indicator when progress is 100', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={1800000}
          progress={100}
        />
      )

      // 檢查是否顯示完成訊息或圖示
      const completeIcon = screen.getByTestId('complete-icon')
      expect(completeIcon).toBeInTheDocument()
    })

    test('should display "延長已觸發" message when completed', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={1800000}
          progress={100}
        />
      )

      expect(screen.getByText(/Token 延長已觸發/i)).toBeInTheDocument()
    })

    test('should change progress bar color to green when completed', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={false}
          activeTime={1800000}
          progress={100}
        />
      )

      const progressBar = container.querySelector('[data-testid="progress-bar-fill"]')
      expect(progressBar).toHaveClass('bg-pip-boy-green')
    })
  })

  // Test Suite 6: Edge Cases
  describe('Edge Cases', () => {
    test('should handle negative activeTime gracefully', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={-1000}
          progress={0}
        />
      )

      // 應該顯示 00:00 而不是負數
      expect(screen.getByText(/00:00/)).toBeInTheDocument()
    })

    test('should handle negative progress gracefully', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={-10}
        />
      )

      // 應該顯示 0% 而不是負數
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    test('should handle very large activeTime (over 30 min)', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={3600000} // 60 分鐘
          progress={100}
        />
      )

      // 時間應該被限制或正確顯示
      expect(screen.getByText(/30:00/)).toBeInTheDocument()
    })

    test('should handle NaN values gracefully', () => {
      render(
        <ActivityProgressCard
          isActive={false}
          activeTime={NaN}
          progress={NaN}
        />
      )

      // 應該顯示預設值 00:00 和 0%
      expect(screen.getByText(/00:00/)).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  // Test Suite 7: Accessibility
  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={true}
          activeTime={900000}
          progress={50}
        />
      )

      const progressBar = container.querySelector('div[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    test('should have descriptive aria-label for progress', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={true}
          activeTime={900000}
          progress={50}
        />
      )

      const progressBar = container.querySelector('div[role="progressbar"]')
      expect(progressBar).toHaveAttribute('aria-label', '活躍度進度：50%')
    })

    test('should have proper semantic HTML structure', () => {
      const { container } = render(
        <ActivityProgressCard
          isActive={false}
          activeTime={0}
          progress={0}
        />
      )

      // 應該使用 <section> 或 <article> 作為主容器
      const mainContainer = container.querySelector('section, article')
      expect(mainContainer).toBeInTheDocument()
    })
  })
})
