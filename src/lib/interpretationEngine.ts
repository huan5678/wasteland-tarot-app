interface GenerateParams {
  spreadType: string
  question: string
  cards: any[]
}

function formatCardLine(card: any, label?: string) {
  if (!card) return `${label || ''}: (空)`
  const posLabel = card.position === 'upright' ? '正位' : '逆位'
  const name = card.name || '未知'
  const meta = card.position_meta || card.position_meta === '' ? card.position_meta : (card._position_meta || label)
  const meaning = card.meaning || card.meaning_upright || card.meaning_reversed || ''
  return `${meta ? meta + ' ' : ''}${name} (${posLabel}) - ${meaning.split('\n')[0]}`
}

function summarizeKeywords(cards: any[]) {
  const kw = new Set<string>()
  cards.forEach(c => (c?.keywords || []).slice(0,2).forEach((k:string)=>kw.add(k)))
  return Array.from(kw).slice(0,6).join(', ')
}

export function generateInterpretation({ spreadType, question, cards }: GenerateParams): string {
  if (!cards.length) return ''
  // Normalize meta fields
  const enriched = cards.map(c => ({
    ...c,
    position_meta: c.position_meta || c._position_meta || c.meta || undefined
  }))

  if (spreadType === 'single' || spreadType === 'single_wasteland') {
    const c = enriched[0]
    return `針對「${question}」的指引：\n${formatCardLine(c)}`
  }
  if (spreadType === 'three_card' || spreadType === 'vault_tec_spread') {
    const [a,b,c] = enriched
    return [
      formatCardLine(a,'過去'),
      formatCardLine(b,'現在'),
      formatCardLine(c,'未來'),
      `關鍵能量: ${summarizeKeywords(enriched)}`,
      `此三段旅程回應「${question}」，顯示出漸進的廢土軌跡。`
    ].join('\n')
  }
  if (spreadType === 'celtic_cross') {
    const labels = ['現況','挑戰','過去','未來','顯意識','潛意識','自我','環境','盼望/恐懼','最終結果']
    const lines = labels.map((lbl,i)=> formatCardLine(enriched[i], lbl))
    lines.push(`關鍵能量: ${summarizeKeywords(enriched)}`)
    lines.push(`此 Celtic Cross 展示多層因素對「${question}」的交織。`)
    return lines.join('\n')
  }
  if (spreadType === 'horseshoe') {
    const labels = ['過去','現在','未來','建議','外在影響','希望與恐懼','結果']
    const lines = labels.map((lbl,i)=> formatCardLine(enriched[i], lbl))
    lines.push(`關鍵能量: ${summarizeKeywords(enriched)}`)
    lines.push(`馬蹄形流向顯示局勢演進對「${question}」的動態路徑。`)
    return lines.join('\n')
  }
  // fallback
  return enriched.map((c,i)=> formatCardLine(c, `位置${i+1}`)).join('\n')
}
