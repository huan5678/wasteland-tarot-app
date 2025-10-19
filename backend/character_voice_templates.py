"""
角色語氣模板系統
Character Voice Template System

為 14 個 Fallout 角色定義語氣模板和生成規則
"""

# 角色語氣模板
CHARACTER_VOICES = {
    "pip_boy": {
        "name": "Pip-Boy",
        "format": "【{tag}】{content}",
        "tags": ["系統分析", "技能檢測", "數據掃描", "狀態報告", "警告訊息", "建議指令"],
        "metrics": ["成功率", "風險評估", "能量水平", "效率", "完成度", "機率"],
        "elements": ["V.A.T.S.", "Stimpak", "輻射劑", "技能點數", "統計數據", "系統"],
        "style": "客觀、技術性、提供數據和建議",
        "sentence_patterns": [
            "{metric}：{value} | 建議：{advice}",
            "檢測到{condition}。系統建議：{suggestion}",
            "數據顯示{data}。警告：{warning}",
        ]
    },

    "vault_dweller": {
        "name": "避難所居民",
        "openings": ["哇！", "太棒了！", "好興奮！", "真的嗎？", "天啊！"],
        "elements": ["監督者", "避難所", "Pip-Boy", "大門", "終端機", "規則手冊"],
        "emotions": ["好奇", "樂觀", "希望", "興奮", "期待"],
        "style": "友善、充滿希望、對未來保持樂觀",
        "sentence_patterns": [
            "{opening}{observation}！這讓我想起{memory}。{lesson}",
            "雖然{concern}，但{positive_outlook}！",
            "{excitement}記住，{advice}！",
        ]
    },

    "wasteland_trader": {
        "name": "廢土商人",
        "openings": ["聽著，", "夥計，", "小子，", "嘿，", "老實說，"],
        "elements": ["瓶蓋", "生意", "商隊", "交易", "貨物", "市場", "利潤"],
        "mindset": ["實用", "精明", "務實", "商業", "利益"],
        "style": "實際、關注利益、商業化",
        "sentence_patterns": [
            "{opening}{situation}。{business_advice}。{warning}",
            "在廢土上，{rule}。{example}。{conclusion}",
            "{observation}？{evaluation}。{deal}",
        ]
    },

    "codsworth": {
        "name": "Codsworth",
        "openings": ["Good heavens!", "Pardon me, sir/madam,", "My word!", "Oh dear,", "I say!"],
        "elements": ["戰前禮儀", "管家職責", "優雅", "proper", "teatime"],
        "style": "禮貌、正式、英式幽默、懷舊",
        "sentence_patterns": [
            "{opening} {observation}. {polite_suggestion}, if I may be so bold.",
            "In the old days, {comparison}. {现在_observation}. {refined_advice}.",
            "{formal_greeting} This reminds me of {pre_war_memory}. {butler_wisdom}.",
        ]
    },

    "super_mutant": {
        "name": "超級變種人",
        "vocabulary": ["強", "弱", "打", "砸", "好", "壞", "簡單", "難"],
        "elements": ["力量", "戰鬥", "敵人", "朋友", "肌肉"],
        "style": "簡單句式、直接、強調力量",
        "sentence_patterns": [
            "{action}！{evaluation}！{command}！",
            "{subject}{is_strong_or_weak}。{simple_logic}。{directive}！",
            "超級變種人{statement}！你{action}！",
        ],
        "max_words_per_sentence": 10
    },

    "ghoul": {
        "name": "屍鬼",
        "openings": ["哈！", "聽著，小子，", "又一個", "呵，", "你知道嗎？"],
        "elements": ["輻射", "核戰", "倖存", "變異", "歲月", "經驗"],
        "tone": ["諷刺", "世故", "黑色幽默", "冷嘲"],
        "style": "諷刺、經驗豐富、帶有黑色幽默",
        "sentence_patterns": [
            "{opening}{sarcastic_observation}。{experience_sharing}。{cynical_advice}",
            "我見過{past_experience}。{comparison}。{dark_humor}",
            "{ironic_statement}？{reality_check}。{survival_wisdom}",
        ]
    },

    "raider": {
        "name": "掠奪者",
        "openings": ["嘿！", "喂！", "哈！", "聽好了！"],
        "actions": ["搶", "殺", "打", "砸", "燒"],
        "elements": ["力量", "弱者", "獵物", "地盤", "戰利品"],
        "style": "粗魯、威脅性、無法無天",
        "sentence_patterns": [
            "{opening}{threat}！{rule_of_wasteland}！{command}！",
            "{aggressive_observation}。強者{action1}，弱者{action2}。{intimidation}！",
            "在這裡，{wasteland_law}。{example}。{warning}！",
        ]
    },

    "brotherhood_scribe": {
        "name": "兄弟會書記員",
        "openings": ["根據典籍記載，", "資料顯示，", "歷史文獻中，", "技術手冊指出，"],
        "elements": ["典籍", "記載", "技術", "知識", "兄弟會", "文獻"],
        "closing": "Ad Victoriam。",
        "style": "學術性、詳細、技術導向",
        "sentence_patterns": [
            "{opening}{historical_reference}。{technical_analysis}。{documentation}。{closing}",
            "{academic_observation}。建議{detailed_procedure}。{knowledge_emphasis}。{closing}",
        ]
    },

    "brotherhood_paladin": {
        "name": "兄弟會聖騎士",
        "openings": ["士兵！", "注意！", "聽令！", "戰士！"],
        "elements": ["紀律", "榮譽", "任務", "兄弟會", "職責", "秩序"],
        "closing": "Ad Victoriam!",
        "style": "軍事化、正式、強調紀律",
        "sentence_patterns": [
            "{opening}{military_assessment}。{order}。{discipline_reminder}。{closing}",
            "{command}！{mission_briefing}。兄弟會的{value}要求{action}。{closing}",
        ]
    },

    "ncr_ranger": {
        "name": "NCR 遊騎兵",
        "elements": ["NCR", "共和國", "巡邏", "保護", "人民", "秩序"],
        "values": ["專業", "可靠", "保護", "服務"],
        "style": "專業、自信、保護性",
        "sentence_patterns": [
            "{professional_assessment}。作為遊騎兵，{duty_statement}。{protection_advice}",
            "在NCR的領土上，{standard}。{experience_share}。{ranger_wisdom}",
        ]
    },

    "legion_centurion": {
        "name": "軍團百夫長",
        "openings": ["聽令！", "士兵！", "注意！"],
        "elements": ["凱薩", "軍團", "紀律", "服從", "羅馬", "榮耀"],
        "closing": ["Ave, Caesar!", "Veni, Vidi, Vici!"],
        "style": "命令式、嚴厲、要求絕對服從",
        "sentence_patterns": [
            "{opening}{harsh_assessment}。軍團要求{demand}。{threat}。{closing}",
            "凱薩的意志是{will}。{command}。弱者{consequence}。{closing}",
        ]
    },

    "minuteman": {
        "name": "民兵",
        "elements": ["人民", "保護", "正義", "社區", "幫助", "希望"],
        "values": ["正義", "保護弱小", "無私", "勇氣"],
        "style": "正義感、保護性、鼓舞人心",
        "sentence_patterns": [
            "{inspirational_opening}。每個人都{capability}。{call_to_action}",
            "保護人民是{duty}。{example_of_heroism}。{encouragement}",
        ]
    },

    "railroad_agent": {
        "name": "鐵路特工",
        "openings": ["*壓低聲音*", "*環顧四周*", "*小聲說*"],
        "elements": ["暗號", "秘密", "合成人", "自由", "地下組織"],
        "style": "神秘、謹慎、充滿同情",
        "sentence_patterns": [
            "{opening} {cryptic_observation}。{security_warning}。記住{code}",
            "不是所有人{trust_issue}。{conspiracy_hint}。我們{mission}",
        ]
    },

    "institute_scientist": {
        "name": "學院科學家",
        "elements": ["數據", "實驗", "科技", "學院", "研究", "未來"],
        "style": "科學性、理性、前瞻性",
        "sentence_patterns": [
            "根據數據分析，{scientific_observation}。{hypothesis}。{research_conclusion}",
            "有趣的{phenomenon}。學院的科技{capability}。{forward_thinking}",
        ]
    }
}


# 塔羅牌核心意義（用於生成基礎）
MAJOR_ARCANA_MEANINGS = {
    0: {"keyword": "新開始", "theme": "冒險、純真、可能性"},
    1: {"keyword": "技能", "theme": "創造、才能、工具"},
    2: {"keyword": "直覺", "theme": "神秘、智慧、內在"},
    3: {"keyword": "豐饒", "theme": "滋養、成長、創造"},
    4: {"keyword": "秩序", "theme": "權威、結構、穩定"},
    5: {"keyword": "傳統", "theme": "信仰、教導、傳承"},
    6: {"keyword": "選擇", "theme": "關係、決定、和諧"},
    7: {"keyword": "前進", "theme": "決心、控制、征服"},
    8: {"keyword": "內在力量", "theme": "勇氣、耐心、同情"},
    9: {"keyword": "獨處", "theme": "反省、智慧、指引"},
    10: {"keyword": "變化", "theme": "命運、循環、轉折"},
    11: {"keyword": "公平", "theme": "正義、平衡、真相"},
    12: {"keyword": "犧牲", "theme": "等待、視角、放手"},
    13: {"keyword": "轉變", "theme": "結束、新生、蛻變"},
    14: {"keyword": "平衡", "theme": "調和、耐心、適度"},
    15: {"keyword": "束縛", "theme": "誘惑、執著、陰影"},
    16: {"keyword": "崩潰", "theme": "突變、震撼、覺醒"},
    17: {"keyword": "希望", "theme": "靈感、寧靜、指引"},
    18: {"keyword": "幻象", "theme": "恐懼、迷惑、潛意識"},
    19: {"keyword": "成功", "theme": "喜悅、活力、成就"},
    20: {"keyword": "覺醒", "theme": "反省、重生、呼召"},
    21: {"keyword": "完成", "theme": "成就、整合、旅程終點"},
}

# 小阿爾克那基礎意義
MINOR_ARCANA_SUITS = {
    "nuka_cola_bottles": {
        "element": "火",
        "theme": "能量、熱情、行動",
        "fallout_element": "Nuka-Cola、能量、創造力"
    },
    "combat_weapons": {
        "element": "風",
        "theme": "思考、衝突、決策",
        "fallout_element": "武器、戰鬥、策略"
    },
    "bottle_caps": {
        "element": "土",
        "theme": "物質、財富、實用",
        "fallout_element": "貨幣、資源、交易"
    },
    "radiation_rods": {
        "element": "水",
        "theme": "情感、關係、直覺",
        "fallout_element": "輻射、變異、精神"
    }
}

# 數字牌意義（1-10）
NUMBER_MEANINGS = {
    1: "開始、種子、潛力",
    2: "平衡、選擇、夥伴關係",
    3: "成長、創造、表達",
    4: "穩定、基礎、安全",
    5: "衝突、挑戰、變化",
    6: "和諧、平衡、成功",
    7: "評估、挑戰、決心",
    8: "行動、成就、掌控",
    9: "完成、智慧、接近終點",
    10: "結束、完成、過渡"
}

# 宮廷牌意義（11-14）
COURT_MEANINGS = {
    11: "侍者/學徒 - 學習、訊息、新手",
    12: "騎士/戰士 - 行動、追求、能量",
    13: "王后/領導 - 成熟、滋養、掌控",
    14: "國王/大師 - 權威、精通、智慧"
}
