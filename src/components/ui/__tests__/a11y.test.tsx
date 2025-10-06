/**
 * Accessibility Tests for Fallout Utilitarian Design System
 * Using jest-axe for automated WCAG 2.1 AA compliance testing
 */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Button } from '../button'
import { Input } from '../input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../card'
import { LoadingState } from '../loading-state'
import { EmptyState } from '../empty-state'

describe('Accessibility Tests - Button Component', () => {
  describe('All Button Variants', () => {
    it('should have no violations for default variant', async () => {
      const { container } = render(<Button>Click Me</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for destructive variant', async () => {
      const { container } = render(<Button variant="destructive">Delete</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for outline variant', async () => {
      const { container } = render(<Button variant="outline">Cancel</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for secondary variant', async () => {
      const { container } = render(<Button variant="secondary">Secondary Action</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for ghost variant', async () => {
      const { container } = render(<Button variant="ghost">Ghost Action</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for link variant', async () => {
      const { container } = render(<Button variant="link">Link Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for warning variant', async () => {
      const { container } = render(<Button variant="warning">Warning</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for success variant', async () => {
      const { container } = render(<Button variant="success">Success</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for info variant', async () => {
      const { container } = render(<Button variant="info">Info</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Button Sizes', () => {
    it('should have no violations for sm size', async () => {
      const { container } = render(<Button size="sm">Small Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for default size', async () => {
      const { container } = render(<Button size="default">Default Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for lg size', async () => {
      const { container } = render(<Button size="lg">Large Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for xl size', async () => {
      const { container } = render(<Button size="xl">Extra Large Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for icon size with aria-label', async () => {
      const { container } = render(
        <Button size="icon" aria-label="Close dialog">
          X
        </Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for icon-lg size with aria-label', async () => {
      const { container } = render(
        <Button size="icon-lg" aria-label="Open menu">
          ☰
        </Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Button States', () => {
    it('should have no violations for disabled state', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with icon', async () => {
      const { container } = render(
        <Button>
          <svg aria-hidden="true" width="16" height="16">
            <circle cx="8" cy="8" r="8" />
          </svg>
          <span>Button with Icon</span>
        </Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility Tests - Input Component', () => {
  describe('Input Variants', () => {
    it('should have no violations for default variant', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-default">Username</label>
          <Input id="input-default" variant="default" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for error variant with error message', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-error">Email</label>
          <Input
            id="input-error"
            variant="error"
            errorMessage="Email is required"
          />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for success variant', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-success">Password</label>
          <Input id="input-success" variant="success" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Input Sizes', () => {
    it('should have no violations for sm size', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-sm">Small Input</label>
          <Input id="input-sm" inputSize="sm" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for default size', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-default-size">Default Input</label>
          <Input id="input-default-size" inputSize="default" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for lg size', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-lg">Large Input</label>
          <Input id="input-lg" inputSize="lg" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Input with Helper Text', () => {
    it('should have no violations with helper text', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-helper">Password</label>
          <Input
            id="input-helper"
            type="password"
            helperText="Must be at least 8 characters"
          />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with error message (role=alert)', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-error-role">Email</label>
          <Input
            id="input-error-role"
            type="email"
            errorMessage="Invalid email format"
          />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Input States', () => {
    it('should have no violations for disabled input', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-disabled">Disabled Field</label>
          <Input id="input-disabled" disabled />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for required input', async () => {
      const { container } = render(
        <div>
          <label htmlFor="input-required">Required Field</label>
          <Input id="input-required" required aria-required="true" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility Tests - Card Component', () => {
  describe('Card Variants', () => {
    it('should have no violations for default variant', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for elevated variant', async () => {
      const { container } = render(
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Elevated Card</CardTitle>
          </CardHeader>
          <CardContent>Elevated card content</CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for ghost variant', async () => {
      const { container } = render(
        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Ghost Card</CardTitle>
          </CardHeader>
          <CardContent>Ghost card content</CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for interactive variant', async () => {
      const { container } = render(
        <Card variant="interactive" role="button" tabIndex={0} aria-label="Interactive card">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>Click this card</CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Card Padding', () => {
    it('should have no violations for all padding options', async () => {
      const { container } = render(
        <div>
          <Card padding="none">
            <CardTitle>No Padding</CardTitle>
          </Card>
          <Card padding="sm">
            <CardTitle>Small Padding</CardTitle>
          </Card>
          <Card padding="default">
            <CardTitle>Default Padding</CardTitle>
          </Card>
          <Card padding="lg">
            <CardTitle>Large Padding</CardTitle>
          </Card>
          <Card padding="xl">
            <CardTitle>Extra Large Padding</CardTitle>
          </Card>
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Card Subcomponents', () => {
    it('should have no violations with full card structure', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Full Card Example</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </CardFooter>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility Tests - LoadingState Component', () => {
  it('should have no violations for loading state with message', async () => {
    const { container } = render(
      <LoadingState message="Loading your data..." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no violations for loading state without message', async () => {
    const { container } = render(<LoadingState />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no violations for all sizes', async () => {
    const { container } = render(
      <div>
        <LoadingState size="sm" />
        <LoadingState size="md" />
        <LoadingState size="lg" />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Accessibility Tests - EmptyState Component', () => {
  it('should have no violations for empty state with all props', async () => {
    const { container } = render(
      <EmptyState
        icon={<svg aria-hidden="true" width="48" height="48"><circle cx="24" cy="24" r="24" /></svg>}
        title="No Data Found"
        description="There are no items to display at this time."
        action={<Button>Create New Item</Button>}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no violations for empty state with minimal props', async () => {
    const { container } = render(
      <EmptyState title="No Results" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Accessibility Tests - Form Patterns', () => {
  it('should have no violations for complete form field pattern', async () => {
    const { container } = render(
      <form>
        <div>
          <label htmlFor="username">Username</label>
          <Input
            id="username"
            type="text"
            helperText="Enter your username"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            errorMessage="Please enter a valid email address"
            aria-invalid="true"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            variant="success"
            helperText="Password meets requirements"
          />
        </div>
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline">Cancel</Button>
      </form>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Accessibility Tests - Complex Layouts', () => {
  it('should have no violations for card grid layout', async () => {
    const { container } = render(
      <div role="list" aria-label="Tarot cards">
        <Card role="listitem">
          <CardHeader>
            <CardTitle>The Wanderer</CardTitle>
          </CardHeader>
          <CardContent>Major Arcana 0</CardContent>
          <CardFooter>
            <Button size="sm">View Details</Button>
          </CardFooter>
        </Card>
        <Card role="listitem">
          <CardHeader>
            <CardTitle>The Vault Dweller</CardTitle>
          </CardHeader>
          <CardContent>Major Arcana I</CardContent>
          <CardFooter>
            <Button size="sm">View Details</Button>
          </CardFooter>
        </Card>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no violations for interactive card with keyboard support', async () => {
    const handleClick = jest.fn()
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    const { container } = render(
      <Card
        variant="interactive"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label="Select tarot card"
      >
        <CardContent>
          <h4>The Wanderer</h4>
          <p>Click or press Enter to select this card</p>
        </CardContent>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
