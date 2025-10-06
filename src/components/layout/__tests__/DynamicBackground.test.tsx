/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { DynamicBackground } from '../DynamicBackground';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock WastelandBackground to test props passing
jest.mock('../WastelandBackground', () => ({
  WastelandBackground: jest.fn(({ variant, animationIntensity }) => (
    <div
      data-testid="wasteland-background"
      data-variant={variant}
      data-animation={animationIntensity}
    />
  )),
}));

const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('DynamicBackground', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('applies homepage variant for root path', () => {
    mockedUsePathname.mockReturnValue('/');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'homepage');
    expect(background).toHaveAttribute('data-animation', 'medium');
  });

  it('applies login variant for login path', () => {
    mockedUsePathname.mockReturnValue('/auth/login');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'login');
    expect(background).toHaveAttribute('data-animation', 'high');
  });

  it('applies login variant for register path', () => {
    mockedUsePathname.mockReturnValue('/auth/register');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'login');
    expect(background).toHaveAttribute('data-animation', 'medium');
  });

  it('applies dashboard variant for dashboard path', () => {
    mockedUsePathname.mockReturnValue('/dashboard');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'dashboard');
    expect(background).toHaveAttribute('data-animation', 'low');
  });

  it('applies default variant for unknown paths', () => {
    mockedUsePathname.mockReturnValue('/unknown-page');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'default');
    expect(background).toHaveAttribute('data-animation', 'medium');
  });

  it('handles nested paths correctly', () => {
    mockedUsePathname.mockReturnValue('/dashboard/profile');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'dashboard');
    expect(background).toHaveAttribute('data-animation', 'low');
  });

  it('handles auth paths with parameters', () => {
    mockedUsePathname.mockReturnValue('/auth/login?redirect=/dashboard');
    render(<DynamicBackground />);

    const background = document.querySelector('[data-testid="wasteland-background"]');
    expect(background).toHaveAttribute('data-variant', 'login');
    expect(background).toHaveAttribute('data-animation', 'high');
  });
});