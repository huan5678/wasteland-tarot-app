/**
 * DynamicHeroTitle Error Boundary
 *
 * 捕獲並處理 DynamicHeroTitle 元件的錯誤，提供降級 UI
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary 元件
 */
export class DynamicHeroTitleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 開發模式下記錄錯誤
    if (process.env.NODE_ENV === 'development') {
      console.error('DynamicHeroTitle Error:', error, errorInfo);
    }

    // 可選：發送至錯誤追蹤服務（如 Sentry）
    // captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 降級 UI：顯示靜態預設文案
      return (
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-pip-boy-green">
            玄學的盡頭是科學™
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-pip-boy-green/80">
            由 Nuka-Cola 量子科學部贊助播出
          </p>
          <p className="text-sm text-pip-boy-green/60 max-w-2xl mx-auto leading-relaxed">
            「經過 200 年的實驗室驗證與田野測試，我們證實了一件事：
            命運不是迷信，而是尚未被完全理解的統計學。現在就用 Pip-Boy 量測你的概率吧。」
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-red-400">
              Error: {this.state.error?.message}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
