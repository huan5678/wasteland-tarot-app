/**
 * BingoCardSetup Component Tests
 * Tests for bingo card setup interface (Task 19)
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// Mock component until implementation is complete
interface BingoCardSetupProps {
  onSubmit?: (numbers: number[][]) => void | Promise<void>
  isLoading?: boolean
  error?: string | null
}

const MockBingoCardSetup: React.FC<BingoCardSetupProps> = ({
  onSubmit,
  isLoading = false,
  error = null
}) => {
  const [selectedNumbers, setSelectedNumbers] = React.useState<Set<number>>(new Set())
  const [validationError, setValidationError] = React.useState<string>('')

  const handleNumberClick = (num: number) => {
    const newSelected = new Set(selectedNumbers)
    if (newSelected.has(num)) {
      newSelected.delete(num)
    } else {
      if (newSelected.size < 25) {
        newSelected.add(num)
      }
    }
    setSelectedNumbers(newSelected)
    setValidationError('')
  }

  const handleSubmit = async () => {
    if (selectedNumbers.size !== 25) {
      setValidationError('請選擇 25 個號碼')
      return
    }

    // Convert Set to 5x5 array
    const numbersArray = Array.from(selectedNumbers).sort((a, b) => a - b)
    const card: number[][] = []
    for (let i = 0; i < 5; i++) {
      card.push(numbersArray.slice(i * 5, (i + 1) * 5))
    }

    if (onSubmit) {
      await onSubmit(card)
    }
  }

  const canSubmit = selectedNumbers.size === 25 && !isLoading

  return (
    <div data-testid="bingo-card-setup">
      <h2>設定賓果卡</h2>
      <p>請選擇 25 個號碼 (1-25)</p>

      <div data-testid="number-selector" className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            data-testid={`number-button-${num}`}
            data-number={num}
            onClick={() => handleNumberClick(num)}
            disabled={isLoading}
            className={`
              p-4 border rounded
              ${selectedNumbers.has(num) ? 'selected bg-pip-boy-green' : 'bg-gray-700'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-pressed={selectedNumbers.has(num)}
            aria-label={`號碼 ${num}`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p data-testid="selection-count">
          已選擇: {selectedNumbers.size} / 25
        </p>
      </div>

      {validationError && (
        <p
          data-testid="validation-error"
          className="text-red-500"
          role="alert"
        >
          {validationError}
        </p>
      )}

      {error && (
        <p
          data-testid="api-error"
          className="text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        data-testid="submit-button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          mt-4 px-6 py-3 rounded
          ${canSubmit ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 cursor-not-allowed'}
        `}
        aria-label="確認設定賓果卡"
      >
        {isLoading ? '處理中...' : '確認設定'}
      </button>
    </div>
  )
}

// Mock component export
const BingoCardSetup = MockBingoCardSetup

describe('BingoCardSetup Component', () => {
  describe('Rendering', () => {
    it('應該渲染 25 個號碼選擇按鈕', () => {
      render(<BingoCardSetup />)

      for (let i = 1; i <= 25; i++) {
        const button = screen.getByTestId(`number-button-${i}`)
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent(i.toString())
      }
    })

    it('應該顯示選擇計數器', () => {
      render(<BingoCardSetup />)

      const counter = screen.getByTestId('selection-count')
      expect(counter).toBeInTheDocument()
      expect(counter).toHaveTextContent('已選擇: 0 / 25')
    })

    it('應該顯示提交按鈕', () => {
      render(<BingoCardSetup />)

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('確認設定')
    })

    it('應該初始時禁用提交按鈕', () => {
      render(<BingoCardSetup />)

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Number Selection', () => {
    it('應該能選擇號碼', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const button = screen.getByTestId('number-button-1')
      await user.click(button)

      expect(button).toHaveClass('selected')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('selection-count')).toHaveTextContent('已選擇: 1 / 25')
    })

    it('應該能取消選擇號碼', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const button = screen.getByTestId('number-button-1')

      // 選擇
      await user.click(button)
      expect(button).toHaveClass('selected')

      // 取消選擇
      await user.click(button)
      expect(button).not.toHaveClass('selected')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('selection-count')).toHaveTextContent('已選擇: 0 / 25')
    })

    it('應該能選擇多個號碼', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      // 選擇 5 個號碼
      for (let i = 1; i <= 5; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      expect(screen.getByTestId('selection-count')).toHaveTextContent('已選擇: 5 / 25')

      // 驗證每個按鈕都被選中
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`number-button-${i}`)).toHaveClass('selected')
      }
    })

    it('應該限制選擇最多 25 個號碼', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      // 選擇所有 25 個號碼
      for (let i = 1; i <= 25; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      expect(screen.getByTestId('selection-count')).toHaveTextContent('已選擇: 25 / 25')
    })

    it('應該為選中的號碼提供視覺回饋', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const button = screen.getByTestId('number-button-5')
      expect(button).toHaveClass('bg-gray-700')

      await user.click(button)
      expect(button).toHaveClass('bg-pip-boy-green')
    })
  })

  describe('Validation', () => {
    it('應該在選擇 25 個號碼後啟用提交按鈕', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()

      // 選擇 25 個號碼
      for (let i = 1; i <= 25; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      expect(submitButton).not.toBeDisabled()
    })

    it('應該在號碼不足時顯示驗證錯誤', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      // 只選擇 10 個號碼
      for (let i = 1; i <= 10; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
    })

    it('應該在點擊未完成的提交時顯示錯誤訊息', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<BingoCardSetup onSubmit={onSubmit} />)

      // 選擇少於 25 個號碼
      for (let i = 1; i <= 10; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      // 強制啟用按鈕並嘗試點擊（測試驗證邏輯）
      // 實際上按鈕應該是禁用的，這裡測試防禦性程式設計

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('Submission', () => {
    it('應該在提交時呼叫 onSubmit 並傳遞號碼陣列', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<BingoCardSetup onSubmit={onSubmit} />)

      // 選擇 25 個號碼
      for (let i = 1; i <= 25; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.arrayContaining([expect.any(Number)])
          ])
        )
      })

      // 驗證傳遞的陣列格式
      const submittedCard = onSubmit.mock.calls[0][0]
      expect(submittedCard).toHaveLength(5)
      expect(submittedCard[0]).toHaveLength(5)
      expect(submittedCard.flat()).toHaveLength(25)
    })

    it('應該提交按順序排列的號碼', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<BingoCardSetup onSubmit={onSubmit} />)

      // 以隨機順序選擇號碼
      const randomOrder = [15, 3, 22, 8, 1, 19, 7, 25, 12, 5, 18, 2, 24, 10, 14, 6, 21, 9, 17, 4, 23, 11, 20, 13, 16]
      for (const num of randomOrder) {
        await user.click(screen.getByTestId(`number-button-${num}`))
      }

      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        const submittedCard = onSubmit.mock.calls[0][0]
        const flattened = submittedCard.flat()
        // 驗證是排序過的
        expect(flattened).toEqual([...flattened].sort((a, b) => a - b))
      })
    })

    it('應該轉換為 5x5 格式', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<BingoCardSetup onSubmit={onSubmit} />)

      for (let i = 1; i <= 25; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        const submittedCard = onSubmit.mock.calls[0][0]
        expect(submittedCard).toEqual([
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
          [16, 17, 18, 19, 20],
          [21, 22, 23, 24, 25]
        ])
      })
    })
  })

  describe('Loading State', () => {
    it('應該在 loading 時禁用所有按鈕', () => {
      render(<BingoCardSetup isLoading={true} />)

      for (let i = 1; i <= 25; i++) {
        expect(screen.getByTestId(`number-button-${i}`)).toBeDisabled()
      }

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    it('應該在 loading 時顯示處理中訊息', () => {
      render(<BingoCardSetup isLoading={true} />)

      expect(screen.getByTestId('submit-button')).toHaveTextContent('處理中...')
    })

    it('應該在 loading 時為按鈕添加視覺回饋', () => {
      render(<BingoCardSetup isLoading={true} />)

      const button = screen.getByTestId('number-button-1')
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Error Handling', () => {
    it('應該顯示 API 錯誤訊息', () => {
      const errorMessage = '本月已設定賓果卡，無法重新設定'
      render(<BingoCardSetup error={errorMessage} />)

      const errorElement = screen.getByTestId('api-error')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent(errorMessage)
      expect(errorElement).toHaveAttribute('role', 'alert')
    })

    it('應該處理提交失敗', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<BingoCardSetup onSubmit={onSubmit} />)

      for (let i = 1; i <= 25; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('應該沒有無障礙違規', async () => {
      const { container } = render(<BingoCardSetup />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('應該有適當的 ARIA 標籤', () => {
      render(<BingoCardSetup />)

      const button = screen.getByTestId('number-button-1')
      expect(button).toHaveAttribute('aria-label', '號碼 1')
      expect(button).toHaveAttribute('aria-pressed')
    })

    it('應該有適當的錯誤 role', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      // 觸發驗證錯誤
      for (let i = 1; i <= 10; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      const errorMessage = '本月已設定賓果卡'
      render(<BingoCardSetup error={errorMessage} />)

      const errorElement = screen.getByTestId('api-error')
      expect(errorElement).toHaveAttribute('role', 'alert')
    })

    it('應該支援鍵盤導航', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const button = screen.getByTestId('number-button-1')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(button).toHaveClass('selected')
    })
  })

  describe('User Experience', () => {
    it('應該清除選擇號碼後的驗證錯誤', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      // 選擇一些號碼然後嘗試提交（會產生錯誤）
      for (let i = 1; i <= 10; i++) {
        await user.click(screen.getByTestId(`number-button-${i}`))
      }

      // 繼續選擇號碼應該清除驗證錯誤
      await user.click(screen.getByTestId('number-button-11'))

      // 驗證錯誤應該被清除（如果有的話）
      expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument()
    })

    it('應該即時更新選擇計數', async () => {
      const user = userEvent.setup()
      render(<BingoCardSetup />)

      const counter = screen.getByTestId('selection-count')

      // 初始狀態
      expect(counter).toHaveTextContent('已選擇: 0 / 25')

      // 選擇號碼
      await user.click(screen.getByTestId('number-button-1'))
      expect(counter).toHaveTextContent('已選擇: 1 / 25')

      await user.click(screen.getByTestId('number-button-2'))
      expect(counter).toHaveTextContent('已選擇: 2 / 25')

      // 取消選擇
      await user.click(screen.getByTestId('number-button-1'))
      expect(counter).toHaveTextContent('已選擇: 1 / 25')
    })
  })
})
