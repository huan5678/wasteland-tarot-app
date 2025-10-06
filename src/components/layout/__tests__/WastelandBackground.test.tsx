/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WastelandBackground } from '../WastelandBackground';

describe('WastelandBackground', () => {
  it('renders without crashing', () => {
    render(<WastelandBackground />);
    const background = document.querySelector('.wasteland-background');
    expect(background).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<WastelandBackground />);
    const background = document.querySelector('.wasteland-background');
    expect(background).toHaveClass('wasteland-bg-default');
    expect(background).toHaveClass('animation-medium');
  });

  it('applies custom variant and animation classes', () => {
    render(
      <WastelandBackground variant="login" animationIntensity="high" />
    );
    const background = document.querySelector('.wasteland-background');
    expect(background).toHaveClass('wasteland-bg-login');
    expect(background).toHaveClass('animation-high');
  });

  it('applies custom className', () => {
    const customClass = 'custom-background';
    render(<WastelandBackground className={customClass} />);
    const background = document.querySelector('.wasteland-background');
    expect(background).toHaveClass(customClass);
  });

  it('renders radiation particles', () => {
    render(<WastelandBackground />);
    const particlesContainer = document.querySelector('.radiation-particles');
    expect(particlesContainer).toBeInTheDocument();

    // Check that particles are generated
    const particles = document.querySelectorAll('.particle');
    expect(particles).toHaveLength(50);
  });

  it('renders all background elements', () => {
    render(<WastelandBackground />);

    expect(document.querySelector('.radiation-particles')).toBeInTheDocument();
    expect(document.querySelector('.wasteland-grid')).toBeInTheDocument();
    expect(document.querySelector('.scan-lines')).toBeInTheDocument();
    expect(document.querySelector('.screen-gradient')).toBeInTheDocument();
    expect(document.querySelector('.radiation-interference')).toBeInTheDocument();
  });

  it('renders particles with random CSS properties', () => {
    render(<WastelandBackground />);
    const particles = document.querySelectorAll('.particle');

    particles.forEach((particle) => {
      const style = particle.getAttribute('style');
      expect(style).toContain('--delay');
      expect(style).toContain('--duration');
      expect(style).toContain('--x-start');
      expect(style).toContain('--y-start');
    });
  });

  it('renders with accessibility considerations', () => {
    render(<WastelandBackground />);

    // Background should not interfere with screen readers
    const background = document.querySelector('.wasteland-background');
    expect(background).toHaveClass('-z-10'); // Behind content
    expect(background).toHaveClass('fixed'); // Fixed positioning

    // No aria-labels or roles should be needed for decorative background
    expect(background).not.toHaveAttribute('aria-label');
    expect(background).not.toHaveAttribute('role');
  });
});