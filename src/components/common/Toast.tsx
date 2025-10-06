'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, newToast.duration)
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastComponent({
  toast,
  onRemove
}: {
  toast: Toast
  onRemove: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(onRemove, 200) // Wait for animation
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'info':
        return <Info className="w-5 h-5 text-pip-boy-green" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-400'
      case 'error':
        return 'border-red-400'
      case 'info':
        return 'border-pip-boy-green'
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/80'
      case 'error':
        return 'bg-red-900/80'
      case 'info':
        return 'bg-pip-boy-green/10'
    }
  }

  return (
    <div
      className={`
        border-2 ${getBorderColor()} ${getBackgroundColor()}
        backdrop-blur-sm p-4 shadow-lg
        transform transition-all duration-200 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold font-mono text-pip-boy-green">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs font-mono text-pip-boy-green/80 mt-1">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="text-pip-boy-green/60 hover:text-pip-boy-green transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}