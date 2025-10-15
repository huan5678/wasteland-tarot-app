/**
 * Authentication Server Actions
 *
 * ( Next.js Server Actions UçI^N¢6Ô cookie P6
 * ( Server-side ( cookies() API -ö httpOnly cookies
 */

'use server'

import { cookies } from 'next/headers'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * „ê Set-Cookie header W2
 * <: "name=value; HttpOnly; Secure; Max-Age=3600; Path=/; SameSite=lax"
 */
function parseCookieHeader(cookieHeader: string): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    maxAge?: number
    path: string
  }
} | null {
  const parts = cookieHeader.split(';').map(p => p.trim())
  const [nameValue, ...attributes] = parts

  if (!nameValue || !nameValue.includes('=')) {
    console.error('[Server Actions] Invalid cookie header:', cookieHeader)
    return null
  }

  const [name, ...valueParts] = nameValue.split('=')
  const value = valueParts.join('=') // U value -Ô˝+ '='

  const options = {
    httpOnly: false,
    secure: false,
    sameSite: 'lax' as 'strict' | 'lax' | 'none',
    path: '/',
  }

  attributes.forEach(attr => {
    const lowerAttr = attr.toLowerCase()

    if (lowerAttr === 'httponly') {
      options.httpOnly = true
    } else if (lowerAttr === 'secure') {
      options.secure = true
    } else if (lowerAttr.startsWith('samesite=')) {
      const sameSiteValue = attr.split('=')[1].toLowerCase()
      options.sameSite = sameSiteValue as 'strict' | 'lax' | 'none'
    } else if (lowerAttr.startsWith('max-age=')) {
      options.maxAge = parseInt(attr.split('=')[1])
    } else if (lowerAttr.startsWith('path=')) {
      options.path = attr.split('=')[1]
    }
  })

  return { name, value, options }
}

/**
 * ûåÔ response -–÷&-ö cookies
 */
async function setCookiesFromResponse(response: Response): Promise<void> {
  const setCookieHeaders = response.headers.getSetCookie()

  if (setCookieHeaders.length === 0) {
    console.log('[Server Actions] No Set-Cookie headers found')
    return
  }

  console.log(`[Server Actions] Processing ${setCookieHeaders.length} Set-Cookie headers`)
  const cookieStore = await cookies()

  for (const cookieHeader of setCookieHeaders) {
    const parsed = parseCookieHeader(cookieHeader)

    if (parsed) {
      try {
        cookieStore.set(parsed.name, parsed.value, parsed.options)
        console.log(`[Server Actions]  Set cookie: ${parsed.name} (httpOnly: ${parsed.options.httpOnly}, maxAge: ${parsed.options.maxAge})`)
      } catch (error) {
        console.error(`[Server Actions] L Failed to set cookie ${parsed.name}:`, error)
      }
    }
  }
}

/**
 * ;ä Server Action
 */
export async function registerAction(formData: {
  email: string
  password: string
  confirm_password: string
  name: string
}) {
  console.log('[Server Actions] Register action called for:', formData.email)

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Server Actions] Register failed:', data)
      return {
        success: false,
        error: data.detail || 'Registration failed',
        status: response.status,
      }
    }

    // -ö cookiesaccess_token, refresh_token	
    await setCookiesFromResponse(response)

    console.log('[Server Actions]  Register successful:', formData.email)

    return {
      success: true,
      user: data.user,
      token_expires_at: data.token_expires_at,
    }
  } catch (error) {
    console.error('[Server Actions] Register error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    }
  }
}

/**
 * {e Server Action
 */
export async function loginAction(formData: {
  email: string
  password: string
}) {
  console.log('[Server Actions] Login action called for:', formData.email)

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Server Actions] Login failed:', data)
      return {
        success: false,
        error: data.detail || 'Login failed',
        status: response.status,
      }
    }

    // -ö cookiesaccess_token, refresh_token	
    await setCookiesFromResponse(response)

    console.log('[Server Actions]  Login successful:', formData.email)

    return {
      success: true,
      user: data.user,
      token_expires_at: data.token_expires_at,
    }
  } catch (error) {
    console.error('[Server Actions] Login error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    }
  }
}

/**
 * {˙ Server Action
 */
export async function logoutAction() {
  console.log('[Server Actions] Logout action called')

  try {
    const cookieStore = await cookies()

    // ÷ó˛	Ñ access_token Â|ÎåÔ{˙ API
    const accessToken = cookieStore.get('access_token')

    if (accessToken) {
      // |ÎåÔ{˙ APIÇú	Ê\	
      try {
        await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Cookie': `access_token=${accessToken.value}`,
          },
        })
      } catch (error) {
        console.warn('[Server Actions] Backend logout failed (non-critical):', error)
      }
    }

    // d@	çI¯‹Ñ cookies
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    console.log('[Server Actions]  Logout successful, cookies cleared')

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Server Actions] Logout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    }
  }
}
