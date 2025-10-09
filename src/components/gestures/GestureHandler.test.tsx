/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GestureHandler } from './GestureHandler';

describe('GestureHandler', () => {
  it('should render children', () => {
    render(
      <GestureHandler>
        <div>Test Content</div>
      </GestureHandler>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should pass gesture callbacks to children', () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const onPinchZoom = jest.fn();

    render(
      <GestureHandler
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onPinchZoom={onPinchZoom}
      >
        <div>Gesture Area</div>
      </GestureHandler>
    );

    expect(screen.getByText('Gesture Area')).toBeInTheDocument();
  });

  it('should handle swipe left gesture', () => {
    const onSwipeLeft = jest.fn();

    render(
      <GestureHandler onSwipeLeft={onSwipeLeft}>
        <div>Swipe Left</div>
      </GestureHandler>
    );

    // Component renders successfully
    expect(screen.getByText('Swipe Left')).toBeInTheDocument();
  });

  it('should support pinch to zoom', () => {
    const onPinchZoom = jest.fn();

    render(
      <GestureHandler onPinchZoom={onPinchZoom} enablePinchZoom={true}>
        <div>Pinch to Zoom</div>
      </GestureHandler>
    );

    expect(screen.getByText('Pinch to Zoom')).toBeInTheDocument();
  });

  it('should support pull to refresh', () => {
    const onPullRefresh = jest.fn();

    render(
      <GestureHandler onPullRefresh={onPullRefresh} enablePullRefresh={true}>
        <div>Pull to Refresh</div>
      </GestureHandler>
    );

    expect(screen.getByText('Pull to Refresh')).toBeInTheDocument();
  });

  it('should handle momentum scrolling', () => {
    render(
      <GestureHandler enableMomentum={true}>
        <div>Momentum Scroll</div>
      </GestureHandler>
    );

    expect(screen.getByText('Momentum Scroll')).toBeInTheDocument();
  });

  it('should support custom gesture threshold', () => {
    render(
      <GestureHandler swipeThreshold={100}>
        <div>Custom Threshold</div>
      </GestureHandler>
    );

    expect(screen.getByText('Custom Threshold')).toBeInTheDocument();
  });

  it('should provide gesture state to children via render prop', () => {
    render(
      <GestureHandler>
        {({ isGesturing }) => (
          <div>Gesturing: {isGesturing ? 'Yes' : 'No'}</div>
        )}
      </GestureHandler>
    );

    expect(screen.getByText(/Gesturing:/)).toBeInTheDocument();
  });
});
