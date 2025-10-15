"""
Spread Templates Seed Data
Divination method definitions for different reading styles in the Wasteland Tarot system
"""

from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.reading_enhanced import SpreadTemplate, SpreadType
from app.models.wasteland_card import FactionAlignment


class SpreadTemplateGenerator:
    """Generate comprehensive spread templates for Wasteland Tarot readings"""

    def __init__(self):
        self.templates_data = []

    def generate_single_wasteland_spread(self) -> Dict[str, Any]:
        """Generate single card wasteland reading template"""
        return {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "single_wasteland",
            "display_name": "單卡廢土占卜 (Single Wasteland Reading)",
            "description": "最簡單的廢土占卜法，一張卡片回答一個問題。適合快速決策和日常指導。",
            "spread_type": SpreadType.SINGLE_WASTELAND.value,
            "card_count": 1,
            "positions": [
                {
                    "number": 1,
                    "name": "The Answer",
                    "chinese_name": "答案",
                    "meaning": "對你問題的直接回答和指導",
                    "description": "這張卡代表廢土對你問題的回應",
                    "keywords": ["answer", "guidance", "insight", "direction"]
                }
            ],
            "interpretation_guide": "專注於卡片的主要含義，結合你的具體問題進行解讀。注意卡片的輻射等級和威脅程度。",
            "difficulty_level": "beginner",
            "faction_preference": None,  # 適合所有派系
            "radiation_sensitivity": 0.3,
            "vault_origin": 111,
            "background_theme": "wasteland_sunset",
            "audio_ambience": "/audio/ambience/geiger_light.mp3",
            "pip_boy_interface": {
                "layout": "single_card_center",
                "animation": "fade_in",
                "radiation_meter": True,
                "holotape_style": True
            },
            "tags": ["beginner", "quick", "daily", "simple", "versatile"]
        }

    def generate_vault_tec_spread(self) -> Dict[str, Any]:
        """Generate Vault-Tec 3-card spread (past/present/future)"""
        return {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "vault_tec_spread",
            "display_name": "Vault-Tec 時光機 (Vault-Tec Spread)",
            "description": "Vault-Tec 經典的三卡占卜法：過去、現在、未來。幫助你理解事情的發展脈絡。",
            "spread_type": SpreadType.VAULT_TEC_SPREAD.value,
            "card_count": 3,
            "positions": [
                {
                    "number": 1,
                    "name": "Past",
                    "chinese_name": "過去",
                    "meaning": "影響現況的過去事件或經歷",
                    "description": "戰前的記憶，避難所的經歷，形塑現在的基礎",
                    "keywords": ["history", "foundation", "memory", "influence", "lessons"]
                },
                {
                    "number": 2,
                    "name": "Present",
                    "chinese_name": "現在",
                    "meaning": "當前的狀況、挑戰或機會",
                    "description": "此刻在廢土上面臨的現實，需要處理的問題",
                    "keywords": ["current", "reality", "challenge", "opportunity", "action"]
                },
                {
                    "number": 3,
                    "name": "Future",
                    "chinese_name": "未來",
                    "meaning": "可能的發展方向或結果",
                    "description": "如果維持現在的路線，可能到達的未來",
                    "keywords": ["potential", "outcome", "direction", "goal", "destiny"]
                }
            ],
            "interpretation_guide": "從左到右解讀卡片，思考時間的流動。過去如何影響現在？現在的行動如何塑造未來？",
            "difficulty_level": "beginner",
            "faction_preference": FactionAlignment.VAULT_DWELLER.value,
            "radiation_sensitivity": 0.4,
            "vault_origin": 101,
            "background_theme": "vault_corridor",
            "audio_ambience": "/audio/ambience/vault_hum.mp3",
            "pip_boy_interface": {
                "layout": "linear_horizontal",
                "animation": "slide_in_sequence",
                "timeline_display": True,
                "vault_tec_logo": True
            },
            "tags": ["classic", "timeline", "beginner", "vault", "sequence"]
        }

    def generate_wasteland_survival_spread(self) -> Dict[str, Any]:
        """Generate 5-card Wasteland Survival spread"""
        return {
            "id": "33333333-3333-3333-3333-333333333333",
            "name": "wasteland_survival",
            "display_name": "廢土生存指南 (Wasteland Survival Spread)",
            "description": "五卡生存占卜法，涵蓋廢土生存的各個方面：威脅、資源、盟友、策略、結果。",
            "spread_type": SpreadType.WASTELAND_SURVIVAL.value,
            "card_count": 5,
            "positions": [
                {
                    "number": 1,
                    "name": "Threat",
                    "chinese_name": "威脅",
                    "meaning": "需要注意的危險或挑戰",
                    "description": "廢土上潛在的危險，可能是人、環境或內在因素",
                    "keywords": ["danger", "challenge", "obstacle", "caution", "enemy"]
                },
                {
                    "number": 2,
                    "name": "Resources",
                    "chinese_name": "資源",
                    "meaning": "可以利用的資源或優勢",
                    "description": "你擁有的技能、物品、人脈或內在力量",
                    "keywords": ["strength", "tools", "assets", "advantage", "skills"]
                },
                {
                    "number": 3,
                    "name": "Allies",
                    "chinese_name": "盟友",
                    "meaning": "可以提供幫助的人或力量",
                    "description": "支持你的人、派系或意外的援助來源",
                    "keywords": ["support", "help", "friendship", "cooperation", "assistance"]
                },
                {
                    "number": 4,
                    "name": "Strategy",
                    "chinese_name": "策略",
                    "meaning": "建議的行動方針或方法",
                    "description": "在這種情況下最佳的行動策略",
                    "keywords": ["action", "plan", "approach", "method", "tactics"]
                },
                {
                    "number": 5,
                    "name": "Outcome",
                    "chinese_name": "結果",
                    "meaning": "可能的結果或學到的教訓",
                    "description": "如果遵循建議策略可能達到的結果",
                    "keywords": ["result", "consequence", "lesson", "achievement", "growth"]
                }
            ],
            "interpretation_guide": "按照廢土生存邏輯解讀：先評估威脅，盤點資源，尋找盟友，制定策略，預測結果。",
            "difficulty_level": "intermediate",
            "faction_preference": None,  # 適合所有在廢土求生的人
            "radiation_sensitivity": 0.6,
            "vault_origin": None,
            "background_theme": "wasteland_camp",
            "audio_ambience": "/audio/ambience/wasteland_wind.mp3",
            "pip_boy_interface": {
                "layout": "cross_pattern",
                "animation": "reveal_by_category",
                "survival_stats": True,
                "compass_overlay": True
            },
            "tags": ["survival", "comprehensive", "intermediate", "strategy", "practical"]
        }

    def generate_brotherhood_council_spread(self) -> Dict[str, Any]:
        """Generate 7-card Brotherhood Council spread"""
        return {
            "id": "44444444-4444-4444-4444-444444444444",
            "name": "brotherhood_council",
            "display_name": "兄弟會議會 (Brotherhood Council Spread)",
            "description": "七卡圓桌會議占卜法，模擬兄弟會議會討論。每張卡代表不同角度的建議。",
            "spread_type": SpreadType.BROTHERHOOD_COUNCIL.value,
            "card_count": 7,
            "positions": [
                {
                    "number": 1,
                    "name": "Elder",
                    "chinese_name": "長老",
                    "meaning": "智慧和傳統的聲音",
                    "description": "基於經驗和傳統知識的建議",
                    "keywords": ["wisdom", "tradition", "experience", "authority", "guidance"]
                },
                {
                    "number": 2,
                    "name": "Scribe",
                    "chinese_name": "書記官",
                    "meaning": "知識和分析的角度",
                    "description": "基於研究和邏輯分析的觀點",
                    "keywords": ["knowledge", "analysis", "research", "logic", "information"]
                },
                {
                    "number": 3,
                    "name": "Knight",
                    "chinese_name": "騎士",
                    "meaning": "行動和實踐的建議",
                    "description": "基於實際執行經驗的實用建議",
                    "keywords": ["action", "practice", "execution", "duty", "service"]
                },
                {
                    "number": 4,
                    "name": "Paladin",
                    "chinese_name": "聖騎士",
                    "meaning": "道德和正義的考量",
                    "description": "基於道德原則和正義感的判斷",
                    "keywords": ["morality", "justice", "righteousness", "honor", "ethics"]
                },
                {
                    "number": 5,
                    "name": "Initiate",
                    "chinese_name": "見習生",
                    "meaning": "新鮮觀點和創新想法",
                    "description": "年輕人的創新思維和不同視角",
                    "keywords": ["innovation", "youth", "creativity", "fresh_perspective", "change"]
                },
                {
                    "number": 6,
                    "name": "Outsider",
                    "chinese_name": "外來者",
                    "meaning": "外部視角和客觀意見",
                    "description": "不受內部偏見影響的客觀觀點",
                    "keywords": ["objectivity", "outside_view", "neutrality", "alternative", "independence"]
                },
                {
                    "number": 7,
                    "name": "Consensus",
                    "chinese_name": "共識",
                    "meaning": "最終決議和統合建議",
                    "description": "綜合所有意見後的最佳行動方案",
                    "keywords": ["decision", "synthesis", "agreement", "resolution", "unity"]
                }
            ],
            "interpretation_guide": "像主持會議一樣，聽取每個角色的建議，然後在中心達成共識。注意不同觀點之間的衝突與協調。",
            "difficulty_level": "advanced",
            "faction_preference": FactionAlignment.BROTHERHOOD.value,
            "radiation_sensitivity": 0.2,  # 在安全的避難所內
            "vault_origin": 0,  # Lost Hills bunker
            "background_theme": "brotherhood_bunker",
            "audio_ambience": "/audio/ambience/bunker_systems.mp3",
            "pip_boy_interface": {
                "layout": "circular_council",
                "animation": "council_assembly",
                "member_indicators": True,
                "voting_system": True
            },
            "tags": ["advanced", "brotherhood", "council", "comprehensive", "democratic"]
        }

    def generate_raider_chaos_spread(self) -> Dict[str, Any]:
        """Generate chaotic Raider spread for unpredictable situations"""
        return {
            "id": "55555555-5555-5555-5555-555555555555",
            "name": "raider_chaos",
            "display_name": "掠奪者混亂牌陣 (Raider Chaos Spread)",
            "description": "隨機混亂的占卜法，適合處理不可預測的情況。卡片位置隨機決定，模擬廢土的無序本質。",
            "spread_type": SpreadType.CUSTOM_SPREAD.value,
            "card_count": 4,
            "positions": [
                {
                    "number": 1,
                    "name": "Chaos",
                    "chinese_name": "混亂",
                    "meaning": "無法控制的混亂因素",
                    "description": "突發的變化、意外事件或不可預測的元素",
                    "keywords": ["chaos", "unexpected", "random", "disruption", "wildcard"]
                },
                {
                    "number": 2,
                    "name": "Opportunity",
                    "chinese_name": "機會",
                    "meaning": "混亂中的機會",
                    "description": "在混亂中可以抓住的機會或優勢",
                    "keywords": ["opportunity", "advantage", "benefit", "exploitation", "gain"]
                },
                {
                    "number": 3,
                    "name": "Survival",
                    "chinese_name": "生存",
                    "meaning": "如何在混亂中生存",
                    "description": "在不確定環境中保護自己的方法",
                    "keywords": ["survival", "protection", "adaptation", "resilience", "endurance"]
                },
                {
                    "number": 4,
                    "name": "Wild_Card",
                    "chinese_name": "萬能牌",
                    "meaning": "完全未知的因素",
                    "description": "可能完全改變局面的神秘因素",
                    "keywords": ["mystery", "unknown", "transformation", "surprise", "revelation"]
                }
            ],
            "interpretation_guide": "不要試圖尋找邏輯，擁抱混亂。有時最好的策略就是適應變化，在混亂中尋找機會。",
            "difficulty_level": "intermediate",
            "faction_preference": FactionAlignment.RAIDERS.value,
            "radiation_sensitivity": 0.8,  # 高輻射環境
            "vault_origin": None,
            "background_theme": "raider_camp",
            "audio_ambience": "/audio/ambience/raider_chaos.mp3",
            "pip_boy_interface": {
                "layout": "scattered_random",
                "animation": "chaotic_reveal",
                "glitch_effects": True,
                "warning_alerts": True
            },
            "tags": ["chaotic", "raiders", "unpredictable", "adaptive", "wild"]
        }

    def generate_ncr_strategic_spread(self) -> Dict[str, Any]:
        """Generate NCR Strategic Planning spread"""
        return {
            "id": "66666666-6666-6666-6666-666666666666",
            "name": "ncr_strategic",
            "display_name": "NCR 戰略規劃 (NCR Strategic Spread)",
            "description": "新加州共和國的系統化決策占卜法，重視民主程序、資源評估和長期規劃。",
            "spread_type": SpreadType.CUSTOM_SPREAD.value,
            "card_count": 6,
            "positions": [
                {
                    "number": 1,
                    "name": "Current_Situation",
                    "chinese_name": "現況分析",
                    "meaning": "當前形勢的客觀評估",
                    "description": "不帶偏見的現狀分析",
                    "keywords": ["analysis", "facts", "assessment", "current_state", "reality"]
                },
                {
                    "number": 2,
                    "name": "Public_Opinion",
                    "chinese_name": "民意",
                    "meaning": "相關人員的意見和感受",
                    "description": "受影響的人們的真實想法",
                    "keywords": ["opinion", "sentiment", "democracy", "consensus", "voice"]
                },
                {
                    "number": 3,
                    "name": "Resources",
                    "chinese_name": "資源評估",
                    "meaning": "可用資源和限制",
                    "description": "人力、物力、時間等資源的現實情況",
                    "keywords": ["resources", "assets", "limitations", "capacity", "budget"]
                },
                {
                    "number": 4,
                    "name": "Strategy",
                    "chinese_name": "戰略選項",
                    "meaning": "可行的戰略選擇",
                    "description": "基於分析得出的可行方案",
                    "keywords": ["strategy", "options", "planning", "approach", "method"]
                },
                {
                    "number": 5,
                    "name": "Long_Term",
                    "chinese_name": "長期影響",
                    "meaning": "決策的長期後果",
                    "description": "這個決定對未來的影響",
                    "keywords": ["consequences", "future", "legacy", "impact", "sustainability"]
                },
                {
                    "number": 6,
                    "name": "Republic_Benefit",
                    "chinese_name": "共和利益",
                    "meaning": "對整體最有利的選擇",
                    "description": "對最多人最有益的決定",
                    "keywords": ["common_good", "benefit", "prosperity", "justice", "welfare"]
                }
            ],
            "interpretation_guide": "按照民主程序思考：分析現況，聽取民意，評估資源，制定戰略，考慮長期影響，選擇最符合共和利益的方案。",
            "difficulty_level": "advanced",
            "faction_preference": FactionAlignment.NCR.value,
            "radiation_sensitivity": 0.3,
            "vault_origin": None,
            "background_theme": "ncr_headquarters",
            "audio_ambience": "/audio/ambience/government_office.mp3",
            "pip_boy_interface": {
                "layout": "formal_grid",
                "animation": "systematic_reveal",
                "voting_indicators": True,
                "republic_symbols": True
            },
            "tags": ["strategic", "ncr", "democratic", "systematic", "planning"]
        }

    def generate_celtic_cross_spread(self) -> Dict[str, Any]:
        """Generate Wasteland Celtic Cross - 10 card comprehensive reading"""
        return {
            "id": "77777777-7777-7777-7777-777777777777",
            "name": "celtic_cross",
            "display_name": "廢土凱爾特十字 (Wasteland Celtic Cross)",
            "description": "最全面的廢土占卜法，改編自古老的凱爾特十字牌陣。十張卡片涵蓋過去、現在、未來、內在、外在等多個維度，適合重大決策。",
            "spread_type": SpreadType.CELTIC_CROSS.value,
            "card_count": 10,
            "positions": [
                {
                    "number": 1,
                    "name": "Present_Situation",
                    "chinese_name": "現況核心",
                    "meaning": "當前情況的核心",
                    "description": "你現在所處的主要狀況或面臨的核心議題",
                    "keywords": ["present", "core", "situation", "focus", "center"],
                    "layout": {"x": 0.5, "y": 0.5, "scale": 1.1, "zIndex": 10, "animationDelay": 0}
                },
                {
                    "number": 2,
                    "name": "Challenge_Obstacle",
                    "chinese_name": "橫向挑戰",
                    "meaning": "橫在面前的挑戰或障礙",
                    "description": "阻礙進展的主要困難或需要面對的挑戰",
                    "keywords": ["challenge", "obstacle", "conflict", "opposition", "barrier"],
                    "layout": {"x": 0.55, "y": 0.5, "rotation": 90, "zIndex": 8, "animationDelay": 150}
                },
                {
                    "number": 3,
                    "name": "Distant_Past",
                    "chinese_name": "遠古過去",
                    "meaning": "過去的根基和影響",
                    "description": "戰前時代或更早的基礎因素，深層的歷史影響",
                    "keywords": ["past", "foundation", "roots", "history", "origin"],
                    "layout": {"x": 0.5, "y": 0.35, "animationDelay": 300}
                },
                {
                    "number": 4,
                    "name": "Recent_Past",
                    "chinese_name": "近期過去",
                    "meaning": "最近的事件和經歷",
                    "description": "剛發生不久的事件，仍在發揮影響力",
                    "keywords": ["recent", "experience", "influence", "memory", "lesson"],
                    "layout": {"x": 0.35, "y": 0.5, "animationDelay": 450}
                },
                {
                    "number": 5,
                    "name": "Potential_Future",
                    "chinese_name": "可能未來",
                    "meaning": "可能的未來發展",
                    "description": "如果維持現在的路線，最可能出現的結果",
                    "keywords": ["future", "potential", "possibility", "outcome", "direction"],
                    "layout": {"x": 0.5, "y": 0.65, "animationDelay": 600}
                },
                {
                    "number": 6,
                    "name": "Near_Future",
                    "chinese_name": "近期未來",
                    "meaning": "即將發生的事",
                    "description": "短期內會出現的情況或機會",
                    "keywords": ["immediate", "upcoming", "soon", "next_step", "imminent"],
                    "layout": {"x": 0.65, "y": 0.5, "animationDelay": 750}
                },
                {
                    "number": 7,
                    "name": "Inner_Self",
                    "chinese_name": "內在自我",
                    "meaning": "你的態度和內在狀態",
                    "description": "你內心的真實感受、恐懼或希望",
                    "keywords": ["internal", "attitude", "feelings", "psychology", "self"],
                    "layout": {"x": 0.8, "y": 0.3, "animationDelay": 900}
                },
                {
                    "number": 8,
                    "name": "External_Influence",
                    "chinese_name": "外部影響",
                    "meaning": "環境和他人的影響",
                    "description": "外在環境、其他人或派系對你的影響",
                    "keywords": ["external", "environment", "others", "influence", "context"],
                    "layout": {"x": 0.8, "y": 0.45, "animationDelay": 1050}
                },
                {
                    "number": 9,
                    "name": "Hopes_Fears",
                    "chinese_name": "希望與恐懼",
                    "meaning": "你的希望或恐懼",
                    "description": "你對結果的期待或擔憂，可能推動或阻礙你",
                    "keywords": ["hope", "fear", "expectation", "anxiety", "aspiration"],
                    "layout": {"x": 0.8, "y": 0.6, "animationDelay": 1200}
                },
                {
                    "number": 10,
                    "name": "Final_Outcome",
                    "chinese_name": "最終結果",
                    "meaning": "最終的結果和結論",
                    "description": "綜合所有因素後，最終可能達到的結果",
                    "keywords": ["outcome", "result", "conclusion", "finale", "resolution"],
                    "layout": {"x": 0.8, "y": 0.75, "scale": 1.05, "zIndex": 5, "animationDelay": 1350}
                }
            ],
            "interpretation_guide": "這是廢土最全面的占卜法。從中心開始，理解現況和挑戰。向上下看過去和未來的時間軸。左側是內在世界，右側是外在影響。最右邊的四張卡顯示你的心理狀態到最終結果的發展。",
            "difficulty_level": "advanced",
            "faction_preference": None,  # 所有派系都可使用
            "radiation_sensitivity": 0.5,
            "vault_origin": None,
            "background_theme": "ancient_ruins",
            "audio_ambience": "/audio/ambience/mystical_wasteland.mp3",
            "pip_boy_interface": {
                "layout": "celtic_cross",
                "animation": "sequential_cross",
                "time_axis_display": True,
                "dimension_indicators": True
            }
        }

    def generate_horseshoe_spread(self) -> Dict[str, Any]:
        """Generate Wasteland Horseshoe - 7 card journey reading"""
        return {
            "id": "88888888-8888-8888-8888-888888888888",
            "name": "horseshoe",
            "display_name": "廢土馬蹄鐵 (Wasteland Horseshoe Spread)",
            "description": "七卡馬蹄形占卜法，象徵廢土旅程的各個階段。從過去出發，經過現在的挑戰，最終達到未來的結果，適合旅程和轉變相關的問題。",
            "spread_type": SpreadType.HORSESHOE.value,
            "card_count": 7,
            "positions": [
                {
                    "number": 1,
                    "name": "Distant_Past",
                    "chinese_name": "旅程起點",
                    "meaning": "旅程的起點和根源",
                    "description": "你從哪裡來，旅程的開始",
                    "keywords": ["origin", "beginning", "departure", "roots", "start"],
                    "layout": {"x": 0.2, "y": 0.7, "rotation": -20, "animationDelay": 0}
                },
                {
                    "number": 2,
                    "name": "Recent_Past",
                    "chinese_name": "近期經歷",
                    "meaning": "最近的經歷和學習",
                    "description": "剛剛經過的地方，最近的遭遇",
                    "keywords": ["recent", "experience", "learning", "passage", "transition"],
                    "layout": {"x": 0.3, "y": 0.45, "rotation": -10, "animationDelay": 150}
                },
                {
                    "number": 3,
                    "name": "Present_Situation",
                    "chinese_name": "當前位置",
                    "meaning": "你現在所在的位置",
                    "description": "此刻你在旅程中的確切位置",
                    "keywords": ["present", "current", "now", "position", "status"],
                    "layout": {"x": 0.4, "y": 0.25, "rotation": -5, "animationDelay": 300}
                },
                {
                    "number": 4,
                    "name": "Guidance_Advice",
                    "chinese_name": "旅行指南",
                    "meaning": "對旅程的建議和指導",
                    "description": "繼續前進的最佳方式和策略",
                    "keywords": ["guidance", "advice", "strategy", "direction", "wisdom"],
                    "layout": {"x": 0.5, "y": 0.2, "scale": 1.1, "zIndex": 10, "animationDelay": 450}
                },
                {
                    "number": 5,
                    "name": "External_Influences",
                    "chinese_name": "路上遭遇",
                    "meaning": "旅途中的外部影響",
                    "description": "路上會遇到的人、事、環境因素",
                    "keywords": ["encounter", "influence", "environment", "others", "obstacles"],
                    "layout": {"x": 0.6, "y": 0.25, "rotation": 5, "animationDelay": 600}
                },
                {
                    "number": 6,
                    "name": "Hopes_Fears",
                    "chinese_name": "旅者心境",
                    "meaning": "你對旅程的希望和恐懼",
                    "description": "你內心對這段旅程的期待或擔憂",
                    "keywords": ["hope", "fear", "emotion", "expectation", "mentality"],
                    "layout": {"x": 0.7, "y": 0.45, "rotation": 10, "animationDelay": 750}
                },
                {
                    "number": 7,
                    "name": "Final_Destination",
                    "chinese_name": "旅程終點",
                    "meaning": "旅程的最終目的地",
                    "description": "如果繼續這條路，最終會到達的地方",
                    "keywords": ["destination", "outcome", "arrival", "goal", "completion"],
                    "layout": {"x": 0.8, "y": 0.7, "rotation": 20, "scale": 1.05, "zIndex": 5, "animationDelay": 900}
                }
            ],
            "interpretation_guide": "像沿著馬蹄鐵的軌跡行走。從左下方的起點開始，經過上方的現在和建議，最後到達右下方的終點。中間的卡片（建議）是整個旅程的關鍵指引。",
            "difficulty_level": "intermediate",
            "faction_preference": None,  # 適合所有在廢土旅行的人
            "radiation_sensitivity": 0.6,
            "vault_origin": None,
            "background_theme": "caravan_trail",
            "audio_ambience": "/audio/ambience/desert_wind.mp3",
            "pip_boy_interface": {
                "layout": "horseshoe_arc",
                "animation": "journey_progression",
                "compass_overlay": True,
                "travel_log": True
            }
        }

    def generate_all_spreads(self) -> List[Dict[str, Any]]:
        """Generate all spread templates"""
        return [
            self.generate_single_wasteland_spread(),
            self.generate_vault_tec_spread(),
            self.generate_wasteland_survival_spread(),
            self.generate_brotherhood_council_spread(),
            self.generate_raider_chaos_spread(),
            self.generate_ncr_strategic_spread(),
            self.generate_celtic_cross_spread(),
            self.generate_horseshoe_spread()
        ]


async def create_spread_templates(db: AsyncSession) -> bool:
    """Create all spread templates"""
    try:
        from sqlalchemy import select

        generator = SpreadTemplateGenerator()
        spreads_data = generator.generate_all_spreads()

        print(f"Creating {len(spreads_data)} spread templates...")

        spreads_created = 0
        for spread_data in spreads_data:
            # Check if spread already exists using select instead of get()
            # to avoid prepared statement issues with pgbouncer
            result = await db.execute(
                select(SpreadTemplate).where(SpreadTemplate.id == spread_data["id"])
            )
            existing_spread = result.scalar_one_or_none()

            if existing_spread:
                print(f"Spread {spread_data['display_name']} already exists, skipping...")
                continue

            # Create new spread template
            spread = SpreadTemplate(
                id=spread_data["id"],
                name=spread_data["name"],
                display_name=spread_data["display_name"],
                description=spread_data["description"],
                spread_type=spread_data["spread_type"],
                card_count=spread_data["card_count"],
                positions=spread_data["positions"],
                interpretation_guide=spread_data["interpretation_guide"],
                difficulty_level=spread_data["difficulty_level"],
                faction_preference=spread_data["faction_preference"],
                radiation_sensitivity=spread_data["radiation_sensitivity"],
                vault_origin=spread_data["vault_origin"],
                background_theme=spread_data["background_theme"],
                audio_ambience=spread_data["audio_ambience"],
                pip_boy_interface=spread_data["pip_boy_interface"],
                usage_count=0,
                average_rating=0.0,
                is_active=True,
                is_premium=False
            )

            db.add(spread)
            # Commit immediately after each insert to avoid batch insert issues with UUID
            await db.commit()
            spreads_created += 1
            print(f"✅ Created spread: {spread_data['display_name']}")
        print(f"✅ Successfully created {spreads_created} spread templates!")
        print("🎯 Available spread types:")
        for spread_data in spreads_data:
            print(f"   - {spread_data['display_name']} ({spread_data['card_count']} cards)")

        return True

    except Exception as e:
        print(f"❌ Error creating spread templates: {e}")
        await db.rollback()
        return False


if __name__ == "__main__":
    print("🎯 Wasteland Tarot Spread Templates Generator")
    print("This script creates divination method templates for different reading styles")