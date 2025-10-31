import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PipBoyDialog, PipBoyDialogTrigger, PipBoyDialogContent, PipBoyDialogHeader, PipBoyDialogTitle, PipBoyDialogDescription, PipBoyDialogClose } from '../PipBoyDialog'

describe('PipBoyDialog', () => {
  describe('基礎渲染', () => {
    it('應該在關閉狀態不渲染內容', () => {
      render(
        <PipBoyDialog>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>測試標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      expect(screen.queryByText('測試標題')).not.toBeInTheDocument()
    })

    it('應該在開啟狀態渲染內容', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>測試標題</PipBoyDialogTitle>
            <PipBoyDialogDescription>測試描述</PipBoyDialogDescription>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        expect(screen.getByText('測試標題')).toBeInTheDocument()
        expect(screen.getByText('測試描述')).toBeInTheDocument()
      })
    })

    it('應該透過 Trigger 開啟 Dialog', async () => {
      const user = userEvent.setup()

      render(
        <PipBoyDialog>
          <PipBoyDialogTrigger>開啟對話框</PipBoyDialogTrigger>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>對話框標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      const trigger = screen.getByText('開啟對話框')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('對話框標題')).toBeInTheDocument()
      })
    })
  })

  describe('無障礙支援', () => {
    it('應該包含 role="dialog"', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })

    it('應該包含 aria-modal="true"', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('應該正確設定 aria-labelledby', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題文字</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        const title = screen.getByText('標題文字')
        expect(dialog).toHaveAttribute('aria-labelledby', title.id)
      })
    })
  })

  describe('Pip-Boy 樣式', () => {
    it('應該套用 Pip-Boy Green 邊框', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const content = screen.getByRole('dialog')
        expect(content).toHaveClass('border-pip-boy-green')
      })
    })

    it('應該使用 Cubic 11 字體於標題', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>測試標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const title = screen.getByText('測試標題')
        expect(title).toHaveStyle({ fontFamily: expect.stringContaining('Cubic') })
      })
    })
  })

  describe('關閉按鈕', () => {
    it('應該渲染關閉按鈕', async () => {
      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
            <PipBoyDialogClose />
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /關閉/i })
        expect(closeButton).toBeInTheDocument()
      })
    })

    it('應該透過關閉按鈕關閉 Dialog', async () => {
      const user = userEvent.setup()

      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
            <PipBoyDialogClose />
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        expect(screen.getByText('標題')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /關閉/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('標題')).not.toBeInTheDocument()
      })
    })
  })

  describe('鍵盤導航', () => {
    it('應該透過 Escape 鍵關閉 Dialog', async () => {
      const user = userEvent.setup()

      render(
        <PipBoyDialog defaultOpen>
          <PipBoyDialogContent>
            <PipBoyDialogTitle>標題</PipBoyDialogTitle>
          </PipBoyDialogContent>
        </PipBoyDialog>
      )

      await waitFor(() => {
        expect(screen.getByText('標題')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('標題')).not.toBeInTheDocument()
      })
    })
  })
})
