import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('應該正確渲染按鈕文字', () => {
    render(<Button>點擊我</Button>)
    expect(screen.getByRole('button', { name: '點擊我' })).toBeInTheDocument()
  })

  it('應該處理點擊事件', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>點擊我</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('應該在禁用狀態下不觸發點擊事件', () => {
    const handleClick = jest.fn()
    render(
      <Button disabled onClick={handleClick}>
        禁用按鈕
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('應該顯示載入狀態', () => {
    render(
      <Button loading>
        提交
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    // 假設載入狀態會顯示特定的 aria-label 或 test-id
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('應該應用正確的變體樣式', () => {
    const { rerender } = render(<Button variant="default">預設按鈕</Button>)

    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')

    rerender(<Button variant="destructive">危險按鈕</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">外框按鈕</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border-input')
  })

  it('應該應用正確的尺寸樣式', () => {
    const { rerender } = render(<Button size="default">預設尺寸</Button>)

    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-10')

    rerender(<Button size="sm">小尺寸</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')

    rerender(<Button size="lg">大尺寸</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11')
  })

  it('應該傳遞自定義 className', () => {
    render(<Button className="custom-class">自定義樣式</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('應該支援 asChild 屬性', () => {
    render(
      <Button asChild>
        <a href="/test">連結按鈕</a>
      </Button>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('連結按鈕')
  })
})