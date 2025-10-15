/**
 * Next.js API Proxy - Forward all /api/v1/* requests to FastAPI backend
 *
 * This proxy is necessary because:
 * 1. Chrome doesn't accept cookies from different ports (localhost:3000 vs localhost:8000)
 * 2. Next.js rewrites don't forward Set-Cookie headers
 * 3. We need to proxy ALL requests through Next.js to maintain same-origin policy
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'DELETE')
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path, 'OPTIONS')
}

/**
 * Proxy request to FastAPI backend
 */
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  const path = pathSegments.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const backendUrl = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`

  try {
    // Prepare request headers (forward from client)
    const headers = new Headers()
    request.headers.forEach((value, key) => {
      // Skip Next.js internal headers
      if (!key.startsWith('x-nextjs') && !key.startsWith('x-middleware')) {
        headers.set(key, value)
      }
    })

    // Forward cookies from request
    const cookies = request.cookies.getAll()
    console.log(`[API Proxy] ${method} ${path} - Forwarding ${cookies.length} cookies`)
    if (cookies.length > 0) {
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
      headers.set('Cookie', cookieHeader)
      console.log(`[API Proxy] Cookie header: ${cookieHeader.substring(0, 100)}...`)
    } else {
      console.warn(`[API Proxy] No cookies to forward for ${method} ${path}`)
    }

    // Prepare request body
    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      try {
        body = await request.text()
      } catch (error) {
        // Body might be empty
      }
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      credentials: 'include',
    })

    // Extract response body (skip for 204 No Content)
    const responseBody = response.status === 204 ? null : await response.text()

    // Create Next.js response
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    })

    // Forward response headers
    response.headers.forEach((value, key) => {
      // Skip headers that Next.js handles automatically
      if (
        key !== 'transfer-encoding' &&
        key !== 'connection' &&
        key !== 'keep-alive'
      ) {
        nextResponse.headers.set(key, value)
      }
    })

    // CRITICAL: Forward Set-Cookie headers to client
    // Use NextResponse cookies for reliable cookie handling
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders.length > 0) {
      console.log(`[API Proxy] Processing ${setCookieHeaders.length} Set-Cookie headers`)

      setCookieHeaders.forEach(cookieHeader => {
        // Parse cookie header: "name=value; attribute1; attribute2"
        const parts = cookieHeader.split(';').map(p => p.trim())
        const [nameValue, ...attributes] = parts
        const [name, value] = nameValue.split('=')

        if (!name || value === undefined) {
          console.warn('[API Proxy] Invalid cookie header:', cookieHeader)
          return
        }

        // Parse cookie attributes
        const options: any = {
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
          // Intentionally skip Domain attribute - Next.js handles it
        })

        // Set cookie using NextResponse.cookies API
        try {
          nextResponse.cookies.set(name, value, options)
          console.log(`[API Proxy] Set cookie: ${name} (httpOnly: ${options.httpOnly}, maxAge: ${options.maxAge})`)
        } catch (error) {
          console.error(`[API Proxy] Failed to set cookie ${name}:`, error)
        }
      })
    }

    return nextResponse
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
