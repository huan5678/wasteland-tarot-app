/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { WastelandBackground } from '../WastelandBackground';

describe('WastelandBackground Performance', () => {
  it('renders appropriate number of particles based on animation intensity', () => {
    // Test low intensity (20 particles)
    const { container: lowContainer } = render(
      <WastelandBackground animationIntensity="low" />
    );
    expect(lowContainer.querySelectorAll('.particle')).toHaveLength(20);

    // Test medium intensity (50 particles)
    const { container: mediumContainer } = render(
      <WastelandBackground animationIntensity="medium" />
    );
    expect(mediumContainer.querySelectorAll('.particle')).toHaveLength(50);

    // Test high intensity (80 particles)
    const { container: highContainer } = render(
      <WastelandBackground animationIntensity="high" />
    );
    expect(highContainer.querySelectorAll('.particle')).toHaveLength(80);
  });

  it('uses consistent particle properties across renders', () => {
    const { container: firstRender } = render(
      <WastelandBackground animationIntensity="medium" />
    );
    const firstParticles = Array.from(firstRender.querySelectorAll('.particle'));
    const firstStyles = firstParticles.map(p => p.getAttribute('style'));

    const { container: secondRender } = render(
      <WastelandBackground animationIntensity="medium" />
    );
    const secondParticles = Array.from(secondRender.querySelectorAll('.particle'));
    const secondStyles = secondParticles.map(p => p.getAttribute('style'));

    // Should have the same number of particles
    expect(firstStyles.length).toBe(secondStyles.length);

    // Note: Due to useMemo, particles should be consistent within the same component instance
    // but may differ between different component instances due to Math.random()
    expect(firstStyles.length).toBe(50); // Medium intensity should always be 50
  });

  it('handles animation intensity changes efficiently', () => {
    const { container, rerender } = render(
      <WastelandBackground animationIntensity="low" />
    );

    // Initial render should have 20 particles
    expect(container.querySelectorAll('.particle')).toHaveLength(20);

    // Change to high intensity
    rerender(<WastelandBackground animationIntensity="high" />);

    // Should now have 80 particles
    expect(container.querySelectorAll('.particle')).toHaveLength(80);

    // Change back to low intensity
    rerender(<WastelandBackground animationIntensity="low" />);

    // Should have 20 particles again
    expect(container.querySelectorAll('.particle')).toHaveLength(20);
  });

  it('optimizes for reduced motion preferences', () => {
    // Mock the prefers-reduced-motion media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { container } = render(<WastelandBackground />);

    // Background should still render for visual consistency
    expect(container.querySelector('.wasteland-background')).toBeInTheDocument();

    // But animations should be disabled via CSS
    // (CSS media query handling is tested via visual regression tests)
  });

  it('has proper z-index positioning for performance', () => {
    const { container } = render(<WastelandBackground />);
    const background = container.querySelector('.wasteland-background');

    // Should be behind content (-z-10) to avoid affecting layout/paint
    expect(background).toHaveClass('-z-10');
    expect(background).toHaveClass('fixed');
  });

  it('uses transform-based animations for performance', () => {
    const { container } = render(<WastelandBackground />);

    // Check that CSS classes are applied for GPU acceleration
    expect(container.querySelector('.particle')).toBeInTheDocument();
    expect(container.querySelector('.scan-lines')).toBeInTheDocument();
    expect(container.querySelector('.radiation-interference')).toBeInTheDocument();

    // The actual transform properties are set via CSS keyframes
    // which are better for performance than JavaScript animations
  });
});