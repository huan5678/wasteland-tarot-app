/**
 * Character Voice Mapping
 * 角色聲音映射表 - 與後端 CharacterVoice enum 保持一致
 */

export interface VoiceInfo {
  value: string
  label: string
  description: string
  themeColor: string
  personality: string
}

/**
 * 完整的角色聲音列表
 */
export const VOICES: VoiceInfo[] = [
  // 通用角色
  {
    value: 'pip_boy',
    label: 'Pip-Boy',
    description: 'Vault-Tec 個人資訊處理器，提供技術分析和數據報告',
    themeColor: '#00ff88',
    personality: '理性、數據導向、精確',
  },
  {
    value: 'vault_dweller',
    label: '避難所居民',
    description: '來自避難所的樂觀居民，對外界充滿好奇',
    themeColor: '#0ea5e9',
    personality: '樂觀、好奇、友善',
  },
  {
    value: 'wasteland_trader',
    label: '廢土商人',
    description: '經驗豐富的商人，提供實用建議',
    themeColor: '#f59e0b',
    personality: '實用、精明、務實',
  },
  {
    value: 'codsworth',
    label: 'Codsworth',
    description: '忠誠的機器人管家，保持著戰前的優雅',
    themeColor: '#06b6d4',
    personality: '優雅、忠誠、老派',
  },

  // 廢土生物與掠奪者
  {
    value: 'super_mutant',
    label: '超級變種人',
    description: '強壯但直率的變種人，用簡單的語言表達',
    themeColor: '#ef4444',
    personality: '直接、簡單、強大',
  },
  {
    value: 'ghoul',
    label: '屍鬼',
    description: '輻射變異的倖存者，擁有豐富的廢土經驗',
    themeColor: '#a3e635',
    personality: '經驗豐富、諷刺、堅韌',
  },
  {
    value: 'raider',
    label: '掠奪者',
    description: '廢土的無法無天者，直言不諱',
    themeColor: '#f97316',
    personality: '粗暴、直接、無畏',
  },

  // 鋼鐵兄弟會
  {
    value: 'brotherhood_scribe',
    label: '兄弟會書記員',
    description: '鋼鐵兄弟會的知識守護者，專注於技術和歷史',
    themeColor: '#3b82f6',
    personality: '學術、嚴謹、技術導向',
  },
  {
    value: 'brotherhood_paladin',
    label: '兄弟會聖騎士',
    description: '鋼鐵兄弟會的戰士，堅守紀律和榮譽',
    themeColor: '#1e40af',
    personality: '榮譽、紀律、勇敢',
  },

  // NCR
  {
    value: 'ncr_ranger',
    label: 'NCR 遊騎兵',
    description: '新加州共和國的精英戰士，經驗豐富且值得信賴',
    themeColor: '#d97706',
    personality: '專業、可靠、堅定',
  },

  // 凱薩軍團
  {
    value: 'legion_centurion',
    label: '軍團百夫長',
    description: '凱薩軍團的指揮官，講求紀律和服從',
    themeColor: '#dc2626',
    personality: '嚴格、權威、軍事化',
  },

  // Fallout 4 陣營角色
  {
    value: 'minuteman',
    label: '民兵',
    description: '保護人民的志願軍，充滿正義感',
    themeColor: '#10b981',
    personality: '正義、保護、無私',
  },
  {
    value: 'railroad_agent',
    label: '鐵路特工',
    description: '地下鐵路的秘密特工，致力於解放合成人',
    themeColor: '#8b5cf6',
    personality: '神秘、同情、謹慎',
  },
  {
    value: 'institute_scientist',
    label: '學院科學家',
    description: '學院的研究員，代表最先進的科技',
    themeColor: '#06b6d4',
    personality: '科學、理性、先進',
  },
]

/**
 * 角色值到標籤的映射（用於快速查詢）
 */
export const VOICE_LABELS: Record<string, string> = VOICES.reduce(
  (acc, voice) => {
    acc[voice.value] = voice.label
    return acc
  },
  {} as Record<string, string>
)

/**
 * 角色值到完整資訊的映射
 */
export const VOICE_MAP: Record<string, VoiceInfo> = VOICES.reduce(
  (acc, voice) => {
    acc[voice.value] = voice
    return acc
  },
  {} as Record<string, VoiceInfo>
)

/**
 * 從角色欄位名稱中提取基礎角色名稱
 * 例如：pip_boy_analysis -> pip_boy, vault_dweller_perspective -> vault_dweller
 */
function extractBaseVoiceName(voiceField: string): string {
  // 移除常見的後綴
  const suffixes = ['_analysis', '_perspective', '_wisdom', '_simplicity', '_commentary']
  let baseName = voiceField.toLowerCase()

  for (const suffix of suffixes) {
    if (baseName.endsWith(suffix)) {
      baseName = baseName.slice(0, -suffix.length)
      break
    }
  }

  return baseName
}

/**
 * 獲取角色的顯示名稱
 * 支援帶後綴的欄位名稱（如 pip_boy_analysis）
 */
export function getVoiceLabel(value: string): string {
  // 先嘗試直接匹配
  if (VOICE_LABELS[value]) {
    return VOICE_LABELS[value]
  }

  // 提取基礎名稱後再匹配
  const baseName = extractBaseVoiceName(value)
  return VOICE_LABELS[baseName] || value
}

/**
 * 獲取角色的完整資訊
 */
export function getVoiceInfo(value: string): VoiceInfo | undefined {
  return VOICE_MAP[value]
}

/**
 * 獲取角色的主題顏色
 */
export function getVoiceColor(value: string): string {
  return VOICE_MAP[value]?.themeColor || '#00ff88'
}
