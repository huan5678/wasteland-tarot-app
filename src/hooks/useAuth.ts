/**
 * useAuth Hook - Wasteland Tarot Authentication
 * JWT token management with Pip-Boy themed error handling
 */

import { useState, useCallback } from 'react'

interface LoginCredentials {
  username: string
  password: string
}

interface AuthResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    username: string
    karmaLevel: string
  }
}

interface AuthState {
  user: AuthResponse['user'] | null
  token: string | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null,
  })

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Make API call to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error('Invalid access codes - Pip-Boy authentication failed')
      }

      const data: AuthResponse = await response.json()

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('pip-boy-token', data.token)
      }

      setState(prev => ({
        ...prev,
        user: data.user || null,
        token: data.token || null,
        loading: false,
        error: null,
      }))

      // Play success sound
      global.WastelandTarot?.PipBoyInterface?.playSound('login-success')

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))

      // Play error sound
      global.WastelandTarot?.PipBoyInterface?.playSound('error-beep')

      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('pip-boy-token')
    setState({
      user: null,
      token: null,
      loading: false,
      error: null,
    })

    // Play logout sound
    global.WastelandTarot?.PipBoyInterface?.playSound('logout')
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    logout,
    clearError,
  }
}