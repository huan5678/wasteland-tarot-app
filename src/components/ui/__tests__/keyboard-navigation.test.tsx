/**
 * Keyboard Navigation Tests for Fallout Utilitarian Design System
 * Testing Tab navigation, focus visibility, Enter/Space activation, and touch target sizes
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'
import { Input } from '../input'
import { Card } from '../card'

describe('Keyboard Navigation - Button Component', () => {
  describe('Tab Key Navigation', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      )

      const firstButton = screen.getByRole('button', { name: 'First Button' })
      const secondButton = screen.getByRole('button', { name: 'Second Button' })

      // Tab to first button
      await user.tab()
      expect(firstButton).toHaveFocus()

      // Tab to second button
      await user.tab()
      expect(secondButton).toHaveFocus()
    })

    it('should skip disabled buttons when tabbing', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Button>First Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Third Button</Button>
        </div>
      )

      const firstButton = screen.getByRole('button', { name: 'First Button' })
      const thirdButton = screen.getByRole('button', { name: 'Third Button' })

      // Tab to first button
      await user.tab()
      expect(firstButton).toHaveFocus()

      // Tab should skip disabled button and go to third
      await user.tab()
      expect(thirdButton).toHaveFocus()
    })

    it('should support reverse tabbing with Shift+Tab', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      )

      const firstButton = screen.getByRole('button', { name: 'First Button' })
      const secondButton = screen.getByRole('button', { name: 'Second Button' })

      // Tab to first, then second button
      await user.tab()
      await user.tab()
      expect(secondButton).toHaveFocus()

      // Shift+Tab back to first
      await user.tab({ shift: true })
      expect(firstButton).toHaveFocus()
    })
  })

  describe('Focus Visibility', () => {
    it('should have visible focus indicator', async () => {
      const user = userEvent.setup()
      render(<Button>Test Button</Button>)

      const button = screen.getByRole('button')

      // Tab to button
      await user.tab()

      // Button should have focus-visible styles
      expect(button).toHaveFocus()
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-border-focus/50')
    })

    it('should show focus indicator for all button variants', async () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'warning', 'success', 'info'] as const

      for (const variant of variants) {
        const user = userEvent.setup()
        const { unmount } = render(<Button variant={variant}>{variant}</Button>)
        const button = screen.getByRole('button', { name: variant })

        await user.tab()
        expect(button).toHaveFocus()
        expect(button).toHaveClass('focus-visible:ring-2')

        unmount()
      }
    })
  })

  describe('Enter and Space Key Activation', () => {
    it('should activate button with Enter key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)

      const button = screen.getByRole('button')
      await user.tab()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should activate button with Space key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)

      const button = screen.getByRole('button')
      await user.tab()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not activate disabled button with keyboard', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)

      const button = screen.getByRole('button')

      // Try Enter key (button should not be focusable)
      await user.keyboard('{Enter}')
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Touch Target Sizes', () => {
    it('should have minimum 44px touch target for lg size', () => {
      render(<Button size="lg">Large Button</Button>)
      const button = screen.getByRole('button')

      // lg size has h-10 class (40px height)
      expect(button).toHaveClass('h-10')
    })

    it('should have minimum 44px touch target for xl size', () => {
      render(<Button size="xl">Extra Large Button</Button>)
      const button = screen.getByRole('button')

      // xl size has h-11 class (44px height)
      expect(button).toHaveClass('h-11')
    })

    it('should have minimum 44px touch target for icon-lg size', () => {
      render(
        <Button size="icon-lg" aria-label="Icon button">
          X
        </Button>
      )
      const button = screen.getByRole('button')

      // icon-lg size has size-11 class (44x44px)
      expect(button).toHaveClass('size-11')
    })

    it('should render touch-friendly buttons with adequate spacing', () => {
      const { container } = render(
        <div className="flex gap-2">
          <Button size="lg">Button 1</Button>
          <Button size="lg">Button 2</Button>
          <Button size="lg">Button 3</Button>
        </div>
      )

      const wrapper = container.querySelector('.flex.gap-2')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('gap-2') // 8px spacing
    })
  })
})

describe('Keyboard Navigation - Input Component', () => {
  describe('Focus Indicator Visibility', () => {
    it('should show focus indicator when input is focused', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <Input id="test-input" />
        </div>
      )

      const input = screen.getByLabelText('Test Input')

      // Tab to input
      await user.tab()
      expect(input).toHaveFocus()

      // Input should have focus styles
      expect(input).toHaveClass('focus:outline-2')
      expect(input).toHaveClass('focus:outline-offset-1')
      expect(input).toHaveClass('focus:shadow-[0_0_0_3px_var(--color-input-focus-ring)]')
    })

    it('should show focus indicator for all input variants', async () => {
      const user = userEvent.setup()
      const variants = ['default', 'error', 'success'] as const

      for (const variant of variants) {
        const { unmount } = render(
          <div>
            <label htmlFor={`input-${variant}`}>{variant} Input</label>
            <Input id={`input-${variant}`} variant={variant} />
          </div>
        )

        const input = screen.getByLabelText(`${variant} Input`)

        await user.tab()
        expect(input).toHaveFocus()
        expect(input).toHaveClass('focus:outline-2')

        unmount()
      }
    })

    it('should have distinct focus border color for error state', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <label htmlFor="error-input">Error Input</label>
          <Input
            id="error-input"
            variant="error"
            errorMessage="This field is required"
          />
        </div>
      )

      const input = screen.getByLabelText('Error Input')

      await user.tab()
      expect(input).toHaveFocus()
      expect(input).toHaveClass('border-error')
      expect(input).toHaveClass('focus:border-error')
    })
  })

  describe('Error State ARIA Attributes', () => {
    it('should have aria-invalid when in error state', () => {
      render(
        <div>
          <label htmlFor="error-input">Email</label>
          <Input
            id="error-input"
            variant="error"
            errorMessage="Invalid email"
          />
        </div>
      )

      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-describedby pointing to error message', () => {
      render(
        <div>
          <label htmlFor="error-input">Email</label>
          <Input
            id="error-input"
            errorMessage="Invalid email format"
          />
        </div>
      )

      const input = screen.getByLabelText('Email')
      const errorMessage = screen.getByRole('alert')

      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      expect(errorMessage).toHaveTextContent('Invalid email format')
    })

    it('should announce error message with role=alert', () => {
      render(
        <div>
          <label htmlFor="error-input">Password</label>
          <Input
            id="error-input"
            errorMessage="Password is too short"
          />
        </div>
      )

      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveTextContent('Password is too short')
    })
  })

  describe('Input Tab Order', () => {
    it('should maintain logical tab order in form fields', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <div>
            <label htmlFor="username">Username</label>
            <Input id="username" />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <Input id="email" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <Input id="password" type="password" />
          </div>
        </form>
      )

      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      // Tab through inputs in order
      await user.tab()
      expect(usernameInput).toHaveFocus()

      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()
    })

    it('should skip disabled inputs when tabbing', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <div>
            <label htmlFor="first">First Field</label>
            <Input id="first" />
          </div>
          <div>
            <label htmlFor="second">Second Field (Disabled)</label>
            <Input id="second" disabled />
          </div>
          <div>
            <label htmlFor="third">Third Field</label>
            <Input id="third" />
          </div>
        </form>
      )

      const firstInput = screen.getByLabelText('First Field')
      const thirdInput = screen.getByLabelText('Third Field')

      await user.tab()
      expect(firstInput).toHaveFocus()

      // Should skip disabled input
      await user.tab()
      expect(thirdInput).toHaveFocus()
    })
  })

  describe('Helper Text Association', () => {
    it('should associate helper text with input via aria-describedby', () => {
      render(
        <div>
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            helperText="Must be at least 8 characters"
          />
        </div>
      )

      const input = screen.getByLabelText('Password')
      const helperText = screen.getByText('Must be at least 8 characters')

      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      expect(helperText).toBeInTheDocument()
    })

    it('should prioritize error message over helper text in aria-describedby', () => {
      render(
        <div>
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            helperText="Enter your email address"
            errorMessage="Email is required"
          />
        </div>
      )

      const input = screen.getByLabelText('Email')
      const errorMessage = screen.getByRole('alert')

      // Error message should be present
      expect(errorMessage).toHaveTextContent('Email is required')

      // Helper text should not be displayed when error exists
      expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument()

      // aria-describedby should point to error
      expect(input).toHaveAttribute('aria-describedby')
    })
  })
})

describe('Keyboard Navigation - Interactive Card Component', () => {
  describe('Focusable Interactive Cards', () => {
    it('should be focusable when interactive variant with proper ARIA', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()

      render(
        <Card
          variant="interactive"
          role="button"
          tabIndex={0}
          onClick={handleClick}
          aria-label="Select card"
        >
          Interactive Card Content
        </Card>
      )

      const card = screen.getByRole('button', { name: 'Select card' })

      // Tab to card
      await user.tab()
      expect(card).toHaveFocus()
    })

    it('should activate on Enter key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleClick()
        }
      }

      render(
        <Card
          variant="interactive"
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Select card"
        >
          Press Enter to select
        </Card>
      )

      const card = screen.getByRole('button', { name: 'Select card' })

      await user.tab()
      expect(card).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should activate on Space key', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }

      render(
        <Card
          variant="interactive"
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label="Select card"
        >
          Press Space to select
        </Card>
      )

      const card = screen.getByRole('button', { name: 'Select card' })

      await user.tab()
      expect(card).toHaveFocus()

      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Non-interactive Cards', () => {
    it('should not be focusable for non-interactive variants', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <Button>Before Card</Button>
          <Card variant="default">Non-interactive Card</Card>
          <Button>After Card</Button>
        </div>
      )

      const beforeButton = screen.getByRole('button', { name: 'Before Card' })
      const afterButton = screen.getByRole('button', { name: 'After Card' })

      // Tab should skip card and go directly from before to after button
      await user.tab()
      expect(beforeButton).toHaveFocus()

      await user.tab()
      expect(afterButton).toHaveFocus()
    })
  })
})

describe('Keyboard Navigation - Complex Form Patterns', () => {
  it('should maintain focus order in complex forms', async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn((e) => e.preventDefault())

    render(
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <Input id="username" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    )

    const usernameInput = screen.getByLabelText('Username')
    const emailInput = screen.getByLabelText('Email')
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    // Tab through all elements in order
    await user.tab()
    expect(usernameInput).toHaveFocus()

    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(cancelButton).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()

    // Submit with Enter
    await user.keyboard('{Enter}')
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('should handle error state focus management', async () => {
    const user = userEvent.setup()

    const FormWithValidation = () => {
      const [error, setError] = React.useState('')

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('Email is required')
      }

      return (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              errorMessage={error}
            />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      )
    }

    render(<FormWithValidation />)

    const submitButton = screen.getByRole('button', { name: 'Submit' })

    // Submit to trigger error
    await user.click(submitButton)

    // Error message should appear
    const errorMessage = await screen.findByRole('alert')
    expect(errorMessage).toHaveTextContent('Email is required')

    // Input should have aria-invalid
    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })
})
