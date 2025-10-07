import { http, HttpResponse } from 'msw'
import { mockTarotCards, mockUser, mockReadings } from './data'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const handlers = [
  // 認證相關 API
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: '1',
      email: body.email,
      created_at: new Date().toISOString(),
      is_verified: false,
    }, { status: 201 })
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as any
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: mockUser,
      })
    }
    return HttpResponse.json(
      { message: '帳號或密碼錯誤' },
      { status: 401 }
    )
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: '未授權' },
        { status: 401 }
      )
    }
    return HttpResponse.json(mockUser)
  }),

  // 塔羅牌相關 API
  http.get(`${API_BASE}/tarot/cards`, () => {
    return HttpResponse.json(mockTarotCards)
  }),

  http.post(`${API_BASE}/tarot/reading`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: '未授權' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const { question, spread_type } = body

    if (!question || !spread_type) {
      return HttpResponse.json(
        { message: '缺少必要參數' },
        { status: 400 }
      )
    }

    // 根據牌陣類型決定卡片數量
    const cardCount = spread_type === 'single' ? 1 :
                     spread_type === 'three_card' ? 3 : 1

    // 隨機選擇卡片
    const selectedCards = mockTarotCards
      .sort(() => 0.5 - Math.random())
      .slice(0, cardCount)
      .map(card => ({
        ...card,
        position: Math.random() > 0.5 ? 'upright' : 'reversed'
      }))

    const reading = {
      id: `reading-${Date.now()}`,
      user_id: mockUser.id,
      question,
      spread_type,
      cards: selectedCards,
      interpretation: `基於您的問題「${question}」和抽到的卡片，這是一個測試解讀...`,
      created_at: new Date().toISOString(),
    }

    return HttpResponse.json(reading, { status: 201 })
  }),

  http.get(`${API_BASE}/tarot/reading/:id`, ({ params }) => {
    const reading = mockReadings.find(r => r.id === params.id)
    if (!reading) {
      return HttpResponse.json(
        { message: '找不到占卜記錄' },
        { status: 404 }
      )
    }
    return HttpResponse.json(reading)
  }),

  // 歷史記錄 API
  http.get(`${API_BASE}/history`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: '未授權' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search')

    let filteredReadings = [...mockReadings]

    // 搜尋過濾
    if (search) {
      filteredReadings = filteredReadings.filter(reading =>
        reading.question.toLowerCase().includes(search.toLowerCase())
      )
    }

    // 分頁
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedReadings = filteredReadings.slice(startIndex, endIndex)

    return HttpResponse.json({
      data: paginatedReadings,
      pagination: {
        page,
        limit,
        total: filteredReadings.length,
        total_pages: Math.ceil(filteredReadings.length / limit),
      }
    })
  }),

  http.delete(`${API_BASE}/history/:id`, ({ params }) => {
    const readingId = params.id
    return HttpResponse.json(
      { message: '占卜記錄已刪除' },
      { status: 200 }
    )
  }),

  // 錯誤處理
  http.get(`${API_BASE}/error/500`, () => {
    return HttpResponse.json(
      { message: '伺服器內部錯誤' },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE}/error/timeout`, () => {
    return new Promise(() => {
      // 永不解析，模擬超時
    })
  }),
]