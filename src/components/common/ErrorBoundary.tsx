'use client';

import React, { Component, ReactNode } from 'react';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pip-Boy System Error:', error, errorInfo);

    // 🟢 Task 15.7: Log error to backend
    this.logErrorToBackend({
      timestamp: new Date().toISOString(),
      errorType: error.name,
      message: error.message,
      stackTrace: error.stack,
      componentStack: errorInfo.componentStack,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      }
    });
  }

  private async logErrorToBackend(errorLog: any) {
    try {
      await fetch('/api/v1/monitoring/logs/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      });
    } catch (e) {
      console.error('[ErrorBoundary] Failed to log error to backend:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="border-2 border-red-400 bg-red-900/20 p-6 text-center">
              <PixelIcon name="alert-triangle" sizePreset="xl" variant="error" animation="wiggle" className="mx-auto mb-4" decorative />

              <h1 className="text-xl font-bold text-red-400 mb-2">
                系統故障偵測
              </h1>

              <p className="text-red-300 text-sm mb-4">
                Pip-Boy 遇到了未預期的錯誤。請嘗試重新啟動系統。
              </p>

              {this.state.error &&
              <details className="mb-4 text-left">
                  <summary className="text-red-300 text-xs cursor-pointer mb-2">
                    錯誤詳情 (開發用)
                  </summary>
                  <pre className="bg-black/50 p-2 rounded text-red-300 text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              }

              <div className="space-y-3">
                <Button size="sm" variant="link"
                onClick={this.handleReset}
                className="w-full py-2 font-bold transition-colors flex items-center justify-center">

                  <PixelIcon name="reload" sizePreset="xs" className="mr-2 inline" decorative />
                  重新啟動 Pip-Boy
                </Button>

                <Button size="sm" variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-2 border font-bold transition-colors">

                  返回主控台
                </Button>
              </div>
            </div>
          </div>
        </div>);

    }

    return this.props.children;
  }
}