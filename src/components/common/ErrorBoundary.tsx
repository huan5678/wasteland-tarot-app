'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pip-Boy System Error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="border-2 border-red-400 bg-red-900/20 p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />

              <h1 className="text-xl font-bold text-red-400 font-mono mb-2">
                系統故障偵測
              </h1>

              <p className="text-red-300 font-mono text-sm mb-4">
                Pip-Boy 遇到了未預期的錯誤。請嘗試重新啟動系統。
              </p>

              {this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="text-red-300 font-mono text-xs cursor-pointer mb-2">
                    錯誤詳情 (開發用)
                  </summary>
                  <pre className="bg-black/50 p-2 rounded text-red-300 font-mono text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full py-2 bg-red-500 text-white font-mono font-bold text-sm hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新啟動 Pip-Boy
                </button>

                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full py-2 border border-red-400 text-red-400 font-mono font-bold text-sm hover:bg-red-900/30 transition-colors"
                >
                  返回主控台
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}