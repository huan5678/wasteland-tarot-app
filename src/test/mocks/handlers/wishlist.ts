/**
 * MSW Handlers for Wishlist API
 * Mock API endpoints for wishlist testing
 */

import { http, HttpResponse } from 'msw'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock wishlist data
export const mockWishes = [
  {
    id: 'wish-1',
    user_id: 'user-1',
    content: '希望能有更多的塔羅牌種類',
    admin_reply: null,
    created_at: new Date('2025-11-10T10:00:00Z').toISOString(),
    updated_at: new Date('2025-11-10T10:00:00Z').toISOString(),
    admin_reply_timestamp: null,
    has_been_edited: false,
    is_hidden: false,
  },
  {
    id: 'wish-2',
    user_id: 'user-1',
    content: '建議增加語音解讀功能',
    admin_reply: '感謝建議！我們正在開發中',
    created_at: new Date('2025-11-09T14:30:00Z').toISOString(),
    updated_at: new Date('2025-11-09T14:30:00Z').toISOString(),
    admin_reply_timestamp: new Date('2025-11-09T16:00:00Z').toISOString(),
    has_been_edited: false,
    is_hidden: false,
  },
  {
    id: 'wish-3',
    user_id: 'user-1',
    content: '希望能匯出占卜記錄',
    admin_reply: null,
    created_at: new Date('2025-11-08T09:00:00Z').toISOString(),
    updated_at: new Date('2025-11-08T09:00:00Z').toISOString(),
    admin_reply_timestamp: null,
    has_been_edited: true,
    is_hidden: false,
  },
]

export const wishlistHandlers = [
  // GET /api/v1/wishlist - 取得使用者願望列表
  http.get(`${API_BASE}/api/v1/wishlist`, ({ cookies }) => {
    // Mock authentication check
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    return HttpResponse.json(mockWishes)
  }),

  // POST /api/v1/wishlist - 提交新願望
  http.post(`${API_BASE}/api/v1/wishlist`, async ({ request, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const { content } = body

    if (!content || content.trim().length === 0) {
      return HttpResponse.json(
        { detail: '願望內容不可為空' },
        { status: 400 }
      )
    }

    // Mock daily limit check
    const today = new Date().toISOString().split('T')[0]
    const latestWishDate = mockWishes[0]?.created_at?.split('T')[0]

    if (latestWishDate === today) {
      return HttpResponse.json(
        { detail: '今日已提交願望，明日再來許願吧' },
        { status: 409 }
      )
    }

    const newWish = {
      id: `wish-${Date.now()}`,
      user_id: 'user-1',
      content,
      admin_reply: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_reply_timestamp: null,
      has_been_edited: false,
      is_hidden: false,
    }

    mockWishes.unshift(newWish)

    return HttpResponse.json(newWish, { status: 201 })
  }),

  // PUT /api/v1/wishlist/:wishId - 編輯願望
  http.put(`${API_BASE}/api/v1/wishlist/:wishId`, async ({ params, request, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const { wishId } = params
    const body = await request.json() as any
    const { content } = body

    const wishIndex = mockWishes.findIndex(w => w.id === wishId)

    if (wishIndex === -1) {
      return HttpResponse.json(
        { detail: '願望未找到' },
        { status: 404 }
      )
    }

    const wish = mockWishes[wishIndex]

    // Check edit permissions
    if (wish.admin_reply) {
      return HttpResponse.json(
        { detail: '此願望已收到回覆，無法再次編輯' },
        { status: 403 }
      )
    }

    if (wish.has_been_edited) {
      return HttpResponse.json(
        { detail: '此願望已編輯過，無法再次編輯' },
        { status: 403 }
      )
    }

    // Update wish
    const updatedWish = {
      ...wish,
      content,
      has_been_edited: true,
      updated_at: new Date().toISOString(),
    }

    mockWishes[wishIndex] = updatedWish

    return HttpResponse.json(updatedWish)
  }),

  // GET /api/v1/wishlist/admin - 取得所有願望列表（管理員）
  http.get(`${API_BASE}/api/v1/wishlist/admin`, ({ request, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const filter_status = url.searchParams.get('filter_status') || 'all'
    const sort_order = url.searchParams.get('sort_order') || 'newest'
    const page = parseInt(url.searchParams.get('page') || '1')
    const page_size = parseInt(url.searchParams.get('page_size') || '50')

    let filteredWishes = [...mockWishes]

    // Apply filters
    if (filter_status === 'replied') {
      filteredWishes = filteredWishes.filter(w => w.admin_reply !== null)
    } else if (filter_status === 'unreplied') {
      filteredWishes = filteredWishes.filter(w => w.admin_reply === null)
    }

    // Apply sorting
    if (sort_order === 'oldest') {
      filteredWishes.reverse()
    }

    // Apply pagination
    const total = filteredWishes.length
    const startIndex = (page - 1) * page_size
    const endIndex = startIndex + page_size
    const paginatedWishes = filteredWishes.slice(startIndex, endIndex)

    return HttpResponse.json({
      wishes: paginatedWishes,
      total,
      page,
      per_page: page_size,
    })
  }),

  // PUT /api/v1/wishlist/admin/:wishId/reply - 提交管理員回覆
  http.put(`${API_BASE}/api/v1/wishlist/admin/:wishId/reply`, async ({ params, request, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const { wishId } = params
    const body = await request.json() as any
    const { reply } = body

    const wishIndex = mockWishes.findIndex(w => w.id === wishId)

    if (wishIndex === -1) {
      return HttpResponse.json(
        { detail: '願望未找到' },
        { status: 404 }
      )
    }

    const updatedWish = {
      ...mockWishes[wishIndex],
      admin_reply: reply,
      admin_reply_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockWishes[wishIndex] = updatedWish

    return HttpResponse.json(updatedWish)
  }),

  // PUT /api/v1/wishlist/admin/:wishId/hide - 隱藏願望
  http.put(`${API_BASE}/api/v1/wishlist/admin/:wishId/hide`, async ({ params, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const { wishId } = params

    const wishIndex = mockWishes.findIndex(w => w.id === wishId)

    if (wishIndex === -1) {
      return HttpResponse.json(
        { detail: '願望未找到' },
        { status: 404 }
      )
    }

    const updatedWish = {
      ...mockWishes[wishIndex],
      is_hidden: true,
      updated_at: new Date().toISOString(),
    }

    mockWishes[wishIndex] = updatedWish

    return HttpResponse.json(updatedWish)
  }),

  // PUT /api/v1/wishlist/admin/:wishId/unhide - 取消隱藏願望
  http.put(`${API_BASE}/api/v1/wishlist/admin/:wishId/unhide`, async ({ params, cookies }) => {
    if (!cookies['access_token']) {
      return HttpResponse.json(
        { detail: 'No access token provided' },
        { status: 401 }
      )
    }

    const { wishId } = params

    const wishIndex = mockWishes.findIndex(w => w.id === wishId)

    if (wishIndex === -1) {
      return HttpResponse.json(
        { detail: '願望未找到' },
        { status: 404 }
      )
    }

    const updatedWish = {
      ...mockWishes[wishIndex],
      is_hidden: false,
      updated_at: new Date().toISOString(),
    }

    mockWishes[wishIndex] = updatedWish

    return HttpResponse.json(updatedWish)
  }),
]
