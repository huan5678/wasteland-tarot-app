export const spreadCanonicalMap: Record<string,string> = {
  single: 'single_wasteland',
  three_card: 'vault_tec_spread',
  five_card: 'wasteland_survival',
  seven_card: 'brotherhood_council'
}

export const spreadDisplayMap: Record<string,string> = {
  single: '單張廢土指引',
  single_wasteland: '單張廢土指引',
  single_wasteland_reading: '單卡廢土占卜',
  three_card: '避難所科技三牌陣',
  vault_tec_spread: '避難所科技三牌陣',
  five_card: '廢土生存五牌陣',
  wasteland_survival: '廢土生存五牌陣',
  wasteland_survival_spread: '廢土生存五牌陣',
  seven_card: '兄弟會議會',
  brotherhood_council: '兄弟會議會',
  brotherhood_council_spread: '兄弟會議會',
  raider_chaos: '掠奪者混沌陣',
  raider_chaos_spread: '掠奪者混沌陣',
  ncr_strategic: 'NCR戰略陣',
  ncr_strategic_spread: 'NCR戰略陣',
  celtic_cross: '十字路口抉擇陣',
  horseshoe: '馬蹄鐵運勢陣'
}

export function toCanonical(type: string) {
  return spreadCanonicalMap[type] || type
}

export function toDisplay(type: string) {
  return spreadDisplayMap[type] || type
}
