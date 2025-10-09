export const spreadCanonicalMap: Record<string,string> = {
  single: 'single_wasteland',
  three_card: 'vault_tec_spread'
}

export const spreadDisplayMap: Record<string,string> = {
  single: '單張卡牌',
  single_wasteland: '單張卡牌',
  three_card: '三張卡牌',
  vault_tec_spread: '三張卡牌',
  celtic_cross: 'Celtic Cross',
  horseshoe: 'Horseshoe'
}

export function toCanonical(type: string) {
  return spreadCanonicalMap[type] || type
}

export function toDisplay(type: string) {
  return spreadDisplayMap[type] || type
}
