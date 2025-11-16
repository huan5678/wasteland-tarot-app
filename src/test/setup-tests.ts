import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup jsdom environment
beforeAll(() => {
  // Set up DOM environment
  if (typeof window === 'undefined') {
    const { JSDOM } = require('jsdom');
    const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });

    global.document = jsdom.window.document;
    global.window = jsdom.window as any;
    global.navigator = jsdom.window.navigator;
    global.HTMLElement = jsdom.window.HTMLElement;
    global.Element = jsdom.window.Element;
  }
});
