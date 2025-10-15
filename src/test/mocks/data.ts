// 測試用戶資料
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  is_verified: true,
  profile: {
    display_name: '測試用戶',
    avatar_url: null,
  },
  preferences: {
    theme: 'light',
    language: 'zh-TW',
    notifications: true,
  }
}

// 測試塔羅牌資料
// 注意：suit 必須使用 API 枚舉值，不能用中文名稱
export const mockTarotCards = [
  {
    id: 1,
    name: '愚者',
    suit: 'major_arcana', // 修正：使用 API 枚舉值
    number: 0,
    meaning_upright: '新的開始、純真、自發性、自由精神',
    meaning_reversed: '魯莽、愚蠢、冒險、輕率',
    image_url: '/cards/fool.jpg',
    keywords: ['開始', '冒險', '純真', '自由'],
  },
  {
    id: 2,
    name: '魔術師',
    suit: 'major_arcana', // 修正：使用 API 枚舉值
    number: 1,
    meaning_upright: '意志力、渴望、創造、顯化',
    meaning_reversed: '操縱、詭計、缺乏能量',
    image_url: '/cards/magician.jpg',
    keywords: ['創造', '意志', '技能', '專注'],
  },
  {
    id: 3,
    name: '女祭司',
    suit: 'major_arcana', // 修正：使用 API 枚舉值
    number: 2,
    meaning_upright: '直覺、神聖知識、潛意識、內在聲音',
    meaning_reversed: '缺乏中心、迷失方向、壓抑情感',
    image_url: '/cards/high-priestess.jpg',
    keywords: ['直覺', '神秘', '潛意識', '智慧'],
  },
  {
    id: 4,
    name: '權杖一',
    suit: 'radiation_rods', // 修正：權杖 → radiation_rods (Wands)
    number: 1,
    meaning_upright: '創意、新項目、行動、靈感',
    meaning_reversed: '缺乏方向、創意受阻、延遲',
    image_url: '/cards/ace-of-wands.jpg',
    keywords: ['創意', '靈感', '行動', '開始'],
  },
  {
    id: 5,
    name: '聖杯一',
    suit: 'nuka_cola_bottles', // 修正：聖杯 → nuka_cola_bottles (Cups)
    number: 1,
    meaning_upright: '愛、新關係、同情心、創造力',
    meaning_reversed: '自私、情感受阻、空虛',
    image_url: '/cards/ace-of-cups.jpg',
    keywords: ['愛', '情感', '直覺', '靈性'],
  },
  {
    id: 6,
    name: '寶劍一',
    suit: 'combat_weapons', // 修正：寶劍 → combat_weapons (Swords)
    number: 1,
    meaning_upright: '突破、新想法、精神清晰、溝通',
    meaning_reversed: '困惑、殘酷、混亂、缺乏清晰度',
    image_url: '/cards/ace-of-swords.jpg',
    keywords: ['清晰', '真理', '溝通', '智慧'],
  },
  {
    id: 7,
    name: '錢幣一',
    suit: 'bottle_caps', // 修正：錢幣 → bottle_caps (Pentacles)
    number: 1,
    meaning_upright: '新機會、顯化、豐盛、新事業',
    meaning_reversed: '錯失機會、缺乏規劃、糟糕投資',
    image_url: '/cards/ace-of-pentacles.jpg',
    keywords: ['機會', '豐盛', '顯化', '安全'],
  },
]

// 測試占卜記錄
export const mockReadings = [
  {
    id: 'reading-1',
    user_id: '1',
    question: '我的愛情運勢如何？',
    spread_type: 'three_card',
    cards: [
      { ...mockTarotCards[0], position: 'upright' },
      { ...mockTarotCards[1], position: 'reversed' },
      { ...mockTarotCards[2], position: 'upright' },
    ],
    interpretation: '根據三張牌的組合，您的愛情運勢顯示...',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'reading-2',
    user_id: '1',
    question: '我的事業發展如何？',
    spread_type: 'single',
    cards: [
      { ...mockTarotCards[1], position: 'upright' },
    ],
    interpretation: '魔術師牌顯示您在事業上有很強的創造力...',
    created_at: '2024-01-14T15:45:00Z',
  },
  {
    id: 'reading-3',
    user_id: '1',
    question: '我應該如何處理目前的困境？',
    spread_type: 'three_card',
    cards: [
      { ...mockTarotCards[2], position: 'upright' },
      { ...mockTarotCards[3], position: 'upright' },
      { ...mockTarotCards[4], position: 'reversed' },
    ],
    interpretation: '這個牌陣建議您要相信內在直覺...',
    created_at: '2024-01-13T09:20:00Z',
  },
]

// 工廠函數：創建測試塔羅牌
export const createMockTarotCard = (overrides = {}) => ({
  id: 1,
  name: '愚者',
  suit: 'major_arcana', // 修正：使用 API 枚舉值
  number: 0,
  meaning_upright: '新的開始、純真、自發性、自由精神',
  meaning_reversed: '魯莽、愚蠢、冒險、輕率',
  image_url: '/cards/fool.jpg',
  keywords: ['開始', '冒險', '純真', '自由'],
  ...overrides,
})

// 工廠函數：創建測試用戶
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  is_verified: true,
  profile: {
    display_name: '測試用戶',
    avatar_url: null,
  },
  preferences: {
    theme: 'light',
    language: 'zh-TW',
    notifications: true,
  },
  ...overrides,
})

// 工廠函數：創建測試占卜記錄
export const createMockReading = (overrides = {}) => ({
  id: 'reading-1',
  user_id: '1',
  question: '測試問題',
  spread_type: 'single',
  cards: [createMockTarotCard()],
  interpretation: '測試解讀',
  created_at: new Date().toISOString(),
  ...overrides,
})

// 認證相關測試資料
export const validCredentials = {
  email: 'test@example.com',
  password: 'password123',
}

export const invalidCredentials = {
  email: 'wrong@example.com',
  password: 'wrongpassword',
}

export const mockAuthToken = 'mock-jwt-token'

// API 回應測試資料
export const mockApiResponses = {
  registerSuccess: {
    id: '1',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    is_verified: false,
  },
  loginSuccess: {
    access_token: mockAuthToken,
    token_type: 'bearer',
    user: mockUser,
  },
  readingSuccess: {
    id: 'reading-1',
    user_id: '1',
    question: '我的運勢如何？',
    spread_type: 'single',
    cards: [createMockTarotCard()],
    interpretation: '根據愚者牌，您即將迎來新的開始...',
    created_at: '2024-01-01T00:00:00Z',
  },
}