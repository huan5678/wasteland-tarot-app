/**
 * Enhanced Tarot Cards Data - Wasteland Themed
 * Comprehensive card information including Fallout references, character voices, and detailed meanings
 */

import { DetailedTarotCard } from '@/components/tarot/CardDetailModal'

export const enhancedWastelandCards: DetailedTarotCard[] = [
  {
    id: '0',
    name: '廢土流浪者',
    description: '一個剛從地下避難所走出，面對嚴酷廢土的身影。',
    suit: '大阿爾克那',
    card_number: 0,
    image_url: '/cards/vault-dweller.png',
    upright_meaning: '新的開始、純真、潛力、在廢土中的全新起點',
    reversed_meaning: '魯莽、天真、判斷力差、對廢土毫無準備',
    keywords: ['新開始', '冒險', '純真', '潛力', '勇氣'],
    fallout_reference: '代表離開111號避難所的玩家角色',
    symbolism: '流浪者手持簡陋的裝備，眼神充滿希望地望向未知的廢土。背景是破損的避難所門，象徵著離開安全但封閉的環境，踏入充滿可能性但危險的新世界。',
    element: '精神',
    astrological_association: '天王星 - 突破與革新',
    radiation_factor: 0.1,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '檢測到新冒險！你的旅程現在開始，使用者。',
      'SUPER_MUTANT': '小人類離開金屬洞穴。廢土會教小人類艱難的課程。',
      'GHOUL': '又一個新鮮肉體踏入陽光。希望你的運氣比理智多，光滑皮膚。',
      'RAIDER': '又一個避難所老鼠爬出來。看看這個能撐多久。',
      'BROTHERHOOD_SCRIBE': '有趣。又一個避難所居民出現。記錄一切。'
    }
  },
  {
    id: '1',
    name: '廢土魔法師',
    description: '一個掌握前戰爭科技的神秘人物，能夠操控廢土的力量。',
    suit: '大阿爾克那',
    card_number: 1,
    image_url: '/cards/wasteland-magician.png',
    upright_meaning: '技能、意志力、創造、科技掌控、廢土求生能力',
    reversed_meaning: '操縱、欺騙、技能濫用、科技成癮',
    keywords: ['技能', '創造', '科技', '掌控', '智慧'],
    fallout_reference: '象徵著能夠修理和改造廢土科技的技術專家',
    symbolism: '魔法師舉起一隻手握著核子電池，另一隻手操作著終端機。工作台上擺滿了各種廢土科技，象徵著知識與技能的力量。',
    element: '火',
    astrological_association: '水星 - 溝通與技術',
    radiation_factor: 0.3,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '技術專精檢測。建議：運用你的技能和知識。',
      'SUPER_MUTANT': '聰明的小人類！會修理發光的盒子！',
      'GHOUL': '又一個認為自己很聰明的修理工。至少他知道哪邊是核電池的正極。',
      'RAIDER': '技術狂。這傢伙知道怎麼讓東西運作。值得留著。',
      'BROTHERHOOD_SCRIBE': '技術知識等級：專家。建議招募入兄弟會。'
    }
  },
  {
    id: '2',
    name: '避難所監督',
    description: '控制避難所的權威人物，代表秩序與控制。',
    suit: '大阿爾克那',
    card_number: 4,
    image_url: '/cards/overseer.png',
    upright_meaning: '權威、結構、秩序、領導力、穩定',
    reversed_meaning: '專制、壓迫、權力濫用、反抗權威',
    keywords: ['權威', '秩序', '領導', '控制', '穩定'],
    fallout_reference: '維持地下社會秩序的避難所監督',
    symbolism: '監督坐在控制室中，周圍是監控屏幕和控制面板。代表著在混亂世界中維持秩序的必要性，但也警示著權力可能帶來的腐敗。',
    element: '土',
    astrological_association: '白羊座 - 領導與權威',
    radiation_factor: 0.2,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '檢測到權威人物。建議遵守避難所規則。',
      'SUPER_MUTANT': '金屬洞穴的老大人類。所有小人類都聽老大的話。',
      'GHOUL': '每個避難所都需要一個發號司令的大人物。',
      'RAIDER': '階級制度的頭頭。尊重等級制度，不然就準備付出代價。',
      'BROTHERHOOD_SCRIBE': '階級領導結構。對避難所生存至關重要。'
    }
  },
  {
    id: '3',
    name: '神秘商人',
    description: '廢土中神出鬼沒的商人，擁有稀有物品和古老智慧。',
    suit: '大阿爾克那',
    card_number: 2,
    image_url: '/cards/mysterious-merchant.png',
    upright_meaning: '直覺、隱藏知識、神秘智慧、內在聲音',
    reversed_meaning: '缺乏方向、迷失、壓抑直覺、秘密被揭露',
    keywords: ['直覺', '神秘', '智慧', '秘密', '商業'],
    fallout_reference: '在廢土各地出現的神秘商人，總是有你需要的東西',
    symbolism: '商人身穿破舊的斗篷，背包裡裝滿了奇異的物品。月亮在背景中照耀著，象徵著直覺和隱藏的知識。',
    element: '水',
    astrological_association: '月亮 - 直覺與神秘',
    radiation_factor: 0.4,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '商人檢測。物品交換機會。建議：相信直覺進行交易。',
      'SUPER_MUTANT': '神秘的小商人！有好東西！小人類要用亮晶晶的換！',
      'GHOUL': '老神秘總是在你最需要的時候出現。價格公道...大部分時候。',
      'RAIDER': '這傢伙總是有好貨。不過別想著搶他，他比看起來危險。',
      'BROTHERHOOD_SCRIBE': '流動商人。擁有珍貴的前戰爭物品。建議建立貿易關係。'
    }
  },
  {
    id: '4',
    name: '瓶蓋王牌',
    description: '後末日世界的通用貨幣，象徵著財富與機會。',
    suit: '小阿爾克那',
    card_number: 1,
    image_url: '/cards/bottle-cap.png',
    upright_meaning: '新的財務機會、物質開始、繁榮、貿易成功',
    reversed_meaning: '財務損失、貧困、資源缺乏、投資失敗',
    keywords: ['財富', '機會', '貿易', '價值', '交換'],
    fallout_reference: '瓶蓋作為標準的戰後貨幣',
    symbolism: '閃亮的瓶蓋堆疊在一起，背景是廢土集市。象徵著即使在末日後，人類仍然需要貿易和價值交換的媒介。',
    element: '土',
    astrological_association: '金星 - 價值與財富',
    radiation_factor: 0.2,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '檢測到貨幣。價值：重要。可用交易機會。',
      'SUPER_MUTANT': '亮晶晶的金屬圓片！小人類喜歡亮晶晶的東西！',
      'GHOUL': '全能的瓶蓋。讓世界轉動，即使在它停止旋轉之後。',
      'RAIDER': '瓶蓋就是力量。更多瓶蓋，更多尊重，更多彈藥。',
      'BROTHERHOOD_SCRIBE': '有趣的戰後經濟適應。高效的以物易物系統。'
    }
  },
  {
    id: '5',
    name: '輻射蟑螂',
    description: '變異的蟑螂，象徵著生存能力和適應性。',
    suit: '小阿爾克那',
    card_number: 2,
    image_url: '/cards/radroach.png',
    upright_meaning: '生存、適應性、堅持、韌性、克服困難',
    reversed_meaning: '害蟲、煩惱、小問題擴大、感染',
    keywords: ['生存', '適應', '堅韌', '克服', '演化'],
    fallout_reference: '廢土中常見的變異生物',
    symbolism: '巨大的蟑螂在廢墟中覓食，象徵著生命的頑強與適應能力。即使在最惡劣的環境中，生命依然能找到存活的方式。',
    element: '土',
    astrological_association: '天蝎座 - 轉化與重生',
    radiation_factor: 0.6,
    karma_alignment: 'NEUTRAL',
    character_voice_interpretations: {
      'PIP_BOY': '檢測到變異昆蟲。威脅等級：極小。生存本能：最大。',
      'SUPER_MUTANT': '噁心的蟲子東西！很難壓扁！小人類怕蟲子！',
      'GHOUL': '蟑螂比大多數生物都更能存活下來。必須尊重這一點。',
      'RAIDER': '噁心的小雜種。但無論如何都能繼續活下去。',
      'BROTHERHOOD_SCRIBE': '卓越的輻射適應性。自然找到了持續存在的方式。'
    }
  }
]

// Function to merge enhanced data with basic card data
export function enhanceCardWithWastelandData(basicCard: any): DetailedTarotCard {
  // Try to find matching enhanced data
  const enhanced = enhancedWastelandCards.find(ec =>
    ec.name.includes(basicCard.name) || basicCard.name.includes(ec.name.replace('廢土', '').replace('避難所', ''))
  )

  if (enhanced) {
    return {
      ...enhanced,
      ...basicCard,
      position: basicCard.position,
      // Prefer enhanced data but fallback to basic
      upright_meaning: enhanced.upright_meaning || basicCard.meaning_upright,
      reversed_meaning: enhanced.reversed_meaning || basicCard.meaning_reversed,
    }
  }

  // Fallback: create enhanced version from basic card
  return {
    ...basicCard,
    id: basicCard.id.toString(),
    upright_meaning: basicCard.meaning_upright,
    reversed_meaning: basicCard.meaning_reversed,
    description: `${basicCard.name}是${basicCard.suit}中的重要卡牌，在廢土世界中具有特殊意義。`,
    symbolism: `${basicCard.name}象徵著${basicCard.meaning_upright}的深層含義，在廢土的嚴酷環境中指引著生存者的道路。`,
    element: getElementFromSuit(basicCard.suit),
    radiation_factor: Math.random() * 0.8,
    karma_alignment: 'NEUTRAL' as const,
    fallout_reference: `這張卡牌在廢土世界中代表著${basicCard.meaning_upright}的重要性。`,
    character_voice_interpretations: generateCharacterVoices(basicCard)
  }
}

function getElementFromSuit(suit: string): string {
  if (suit === '大阿爾克那') return '精神'
  if (suit.includes('權杖')) return '火'
  if (suit.includes('聖杯')) return '水'
  if (suit.includes('寶劍')) return '風'
  if (suit.includes('錢幣')) return '土'
  return '未知'
}

function generateCharacterVoices(card: any): { [voice: string]: string } {
  const meaning = card.position === 'upright' ? card.meaning_upright : card.meaning_reversed

  return {
    'PIP_BOY': `檢測到塔羅卡牌：${card.name}。分析結果：${meaning}。建議依據此指導行動。`,
    'GHOUL': `${card.name}，啊？這張破舊的卡片說的是${meaning}。在這廢土上，這倒是有些道理。`,
    'SUPER_MUTANT': `${card.name.toUpperCase()}！這張紙片說${meaning.toUpperCase()}！小人類相信紙片！`,
    'RAIDER': `${card.name}？聽起來像是廢話，但如果說的是${meaning}，那可能有些用處。`,
    'BROTHERHOOD_SCRIBE': `記錄：${card.name}，${card.suit}。解釋：${meaning}。建議整合到戰術分析中。`
  }
}