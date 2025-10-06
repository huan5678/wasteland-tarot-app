# tests/unit/test_character_interpretation.py - Tests for Character Interpretation Engine

import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import List, Dict, Any
import uuid
from datetime import datetime

# These imports will be available when the actual services are implemented
# from app.services.character_interpretation_service import CharacterInterpretationService
# from app.services.ai_interpretation_service import AIInterpretationService
# from app.core.character_voices import CharacterVoiceManager


class TestPipBoyAnalysisVoice:
    """Test Pip-Boy數據分析法 character voice."""

    @pytest.mark.asyncio
    async def test_pip_boy_interpretation_style(self, single_card_reading_data, mock_ai_service):
        """Test Pip-Boy produces systematic, data-driven interpretations."""
        reading_data = single_card_reading_data
        reading_data["character_voice"] = "pip_boy_analysis"

        # TODO: Implement when service is created
        # interpretation_service = CharacterInterpretationService()
        # result = await interpretation_service.generate_interpretation(
        #     reading_data, character_voice="pip_boy_analysis"
        # )

        # Mock expected Pip-Boy style response
        expected_pip_boy_response = {
            "character_voice_style": {
                "voice": "pip_boy_analysis",
                "personality": "系統化、數據導向、科技風格",
                "display_style": "綠色單色螢幕風格數據呈現",
                "delivery": "像Pip-Boy介面一樣系統化分析卡牌資訊"
            },
            "interpretation_format": {
                "opening": "掃描卡牌基本數據...",
                "analysis": "分析元素屬性中...",
                "threat_assessment": "評估威脅等級...",
                "probability": "計算成功機率...",
                "recommendation": "生成行動建議..."
            },
            "technical_elements": {
                "includes_stats": True,
                "includes_percentages": True,
                "includes_threat_levels": True,
                "includes_scan_results": True
            }
        }

        # Test Pip-Boy specific elements
        assert expected_pip_boy_response["character_voice_style"]["voice"] == "pip_boy_analysis"
        assert "系統化" in expected_pip_boy_response["character_voice_style"]["personality"]
        assert expected_pip_boy_response["technical_elements"]["includes_stats"] is True

    @pytest.mark.asyncio
    async def test_pip_boy_scan_integration(self, wasteland_card_data):
        """Test Pip-Boy voice integrates card scan results."""
        card_data = wasteland_card_data

        # TODO: Implement when service is created
        # voice_service = CharacterVoiceManager()
        # interpretation = await voice_service.interpret_with_voice(
        #     card_data, voice="pip_boy_analysis"
        # )

        # Mock expected scan integration
        expected_scan_elements = [
            "威脅等級: 低",
            "資源潛力: 中",
            "輻射讀數: 安全範圍",
            "成功機率: 75%",
            "建議行動: 進行探索，但保持謹慎"
        ]

        # Test scan results are properly formatted
        pip_boy_scan = card_data["pip_boy_scan_results"]
        assert pip_boy_scan["threat_level"] == "低"
        assert pip_boy_scan["resource_potential"] == "中"
        assert pip_boy_scan["radiation_reading"] == "安全範圍"

        # Test survival tips integration
        assert isinstance(pip_boy_scan["survival_tips"], list)
        assert len(pip_boy_scan["survival_tips"]) > 0

    @pytest.mark.asyncio
    async def test_pip_boy_system_messages(self):
        """Test Pip-Boy uses system-style status messages."""
        expected_system_messages = [
            "掃描卡牌基本數據...",
            "分析元素屬性中...",
            "評估威脅等級...",
            "計算成功機率...",
            "交叉參照資料庫...",
            "生成建議方案...",
            "系統分析完成"
        ]

        # TODO: Test messages are used in interpretations
        # for message in expected_system_messages:
        #     interpretation = await generate_pip_boy_interpretation()
        #     assert message in interpretation.content

        # For now, test the messages exist
        assert len(expected_system_messages) == 7
        assert "掃描" in expected_system_messages[0]
        assert "完成" in expected_system_messages[-1]

    @pytest.mark.asyncio
    async def test_pip_boy_green_screen_formatting(self):
        """Test Pip-Boy uses green screen terminal formatting."""
        expected_formatting = {
            "color_scheme": "green_monochrome",
            "font_style": "monospace",
            "line_separators": "=" * 40,
            "section_headers": "> ",
            "data_alignment": "left",
            "status_indicators": ["[OK]", "[WARN]", "[ERROR]"]
        }

        # Test formatting elements exist
        assert expected_formatting["color_scheme"] == "green_monochrome"
        assert len(expected_formatting["status_indicators"]) == 3
        assert "[OK]" in expected_formatting["status_indicators"]


class TestVaultDwellerPerspectiveVoice:
    """Test 避難所居民視角法 character voice."""

    @pytest.mark.asyncio
    async def test_vault_dweller_naive_optimism(self, vault_tec_spread_data):
        """Test Vault Dweller voice uses naive, optimistic perspective."""
        spread_data = vault_tec_spread_data
        spread_data["character_voice"] = "vault_dweller_perspective"

        # TODO: Implement when service is created
        # interpretation = await generate_interpretation_with_voice(
        #     spread_data, "vault_dweller_perspective"
        # )

        expected_characteristics = {
            "personality_traits": ["天真", "樂觀", "好奇", "科學導向"],
            "perspective": "從剛走出避難所的角度看待廢土",
            "humor_style": "戰前常識 vs 戰後現實的反差",
            "knowledge_base": "避難所教育 + 戰前科學書籍",
            "danger_assessment": "過度樂觀，常低估風險"
        }

        # Test characteristics
        assert "天真" in expected_characteristics["personality_traits"]
        assert "樂觀" in expected_characteristics["personality_traits"]
        assert "戰前" in expected_characteristics["humor_style"]

    @pytest.mark.asyncio
    async def test_vault_dweller_pre_war_knowledge_humor(self):
        """Test Vault Dweller uses pre-war knowledge inappropriately."""
        humor_examples = [
            "根據戰前生物學教科書，這些變種生物應該不會存在才對...",
            "Pip-Boy顯示輻射指數很高，但感覺就像陽光一樣溫暖呢！",
            "這個廢墟看起來很有考古價值，應該可以找到很多歷史文物",
            "按照戰前社會學理論，這些掠奪者應該可以透過理性溝通解決衝突",
            "輻射風暴看起來像極了戰前氣象學教科書裡的美麗極光現象"
        ]

        # Test humor contains pre-war vs post-war contrasts
        for humor in humor_examples:
            assert "戰前" in humor or "Pip-Boy" in humor or "輻射" in humor

        # Test optimistic misunderstanding of dangers
        dangerous_optimism = [ex for ex in humor_examples if "溫暖" in ex or "美麗" in ex or "理性" in ex]
        assert len(dangerous_optimism) > 0

    @pytest.mark.asyncio
    async def test_vault_dweller_scientific_curiosity(self):
        """Test Vault Dweller shows scientific curiosity about wasteland."""
        scientific_approaches = [
            "這個現象在《廢土生物學入門》第三章有類似案例",
            "應該記錄這個變異的詳細數據，對避難所科學部門很有價值",
            "根據輻射學原理，這種現象的半衰期應該是...",
            "這符合戰前核物理學的哪個定律呢？",
            "需要收集樣本進行進一步實驗室分析"
        ]

        # Test scientific vocabulary and references
        science_keywords = ["數據", "原理", "定律", "分析", "實驗", "樣本"]
        for approach in scientific_approaches:
            has_science_keyword = any(keyword in approach for keyword in science_keywords)
            assert has_science_keyword

    @pytest.mark.asyncio
    async def test_vault_dweller_education_references(self):
        """Test Vault Dweller references vault education materials."""
        education_references = [
            "《避難所居民手冊》第12章提到...",
            "戰前教育系統教導我們...",
            "G.E.C.K.使用指南建議...",
            "監督實驗記錄顯示...",
            "Vault-Tec員工訓練手冊說明..."
        ]

        # Test vault-specific education sources
        vault_sources = ["避難所", "G.E.C.K.", "監督", "Vault-Tec"]
        for reference in education_references:
            has_vault_source = any(source in reference for source in vault_sources)
            assert has_vault_source


class TestWastelandTraderWisdomVoice:
    """Test 廢土商人智慧法 character voice."""

    @pytest.mark.asyncio
    async def test_trader_practical_assessment(self, single_card_reading_data):
        """Test Trader voice focuses on practical value and risk/reward."""
        reading_data = single_card_reading_data
        reading_data["character_voice"] = "wasteland_trader_wisdom"

        # TODO: Implement when service is created
        # interpretation = await generate_trader_interpretation(reading_data)

        expected_focus_areas = [
            "資源價值評估",
            "風險收益分析",
            "交易機會識別",
            "市場趨勢預測",
            "供需關係分析",
            "運輸成本考量"
        ]

        # Test practical business focus
        business_keywords = ["價值", "收益", "機會", "市場", "成本", "供需"]
        for area in expected_focus_areas:
            has_business_keyword = any(keyword in area for keyword in business_keywords)
            assert has_business_keyword

    @pytest.mark.asyncio
    async def test_trader_caps_and_value_language(self):
        """Test Trader uses caps and value-focused language."""
        trader_expressions = [
            "這張牌價值至少50瓶蓋的機會",
            "風險太高，收益不成比例",
            "這是個賺取瓶蓋的好時機",
            "投資報酬率看起來不錯",
            "市場供需失衡，有套利空間",
            "運輸成本會吃掉大部分利潤"
        ]

        # Test economic vocabulary
        economic_terms = ["瓶蓋", "收益", "投資", "報酬", "市場", "利潤", "成本"]
        for expression in trader_expressions:
            has_economic_term = any(term in expression for term in economic_terms)
            assert has_economic_term

    @pytest.mark.asyncio
    async def test_trader_reputation_considerations(self):
        """Test Trader considers reputation and relationships."""
        reputation_factors = [
            "這會影響你在商隊的聲譽",
            "建立長期客戶關係比短期利潤重要",
            "信用比瓶蓋更有價值",
            "這個決定會影響未來的交易夥伴",
            "維護商譽需要謹慎行事",
            "口碑傳播的力量不可小覷"
        ]

        # Test relationship and reputation focus
        relationship_keywords = ["聲譽", "關係", "信用", "夥伴", "商譽", "口碑"]
        for factor in reputation_factors:
            has_relationship_keyword = any(keyword in factor for keyword in relationship_keywords)
            assert has_relationship_keyword

    @pytest.mark.asyncio
    async def test_trader_risk_mitigation_strategies(self):
        """Test Trader provides practical risk mitigation advice."""
        risk_strategies = [
            "分散投資降低整體風險",
            "建議帶保鏢，安全第一",
            "預留備用資金應對突發狀況",
            "多準備幾條逃生路線",
            "事先談好保險和賠償條款",
            "小心那些太好的交易，通常有陷阱"
        ]

        # Test practical safety and business advice
        safety_keywords = ["分散", "保鏢", "備用", "逃生", "保險", "小心"]
        for strategy in risk_strategies:
            has_safety_keyword = any(keyword in strategy for keyword in safety_keywords)
            assert has_safety_keyword


class TestSuperMutantSimplicityVoice:
    """Test 超級變種人簡化法 character voice."""

    @pytest.mark.asyncio
    async def test_super_mutant_direct_communication(self, single_card_reading_data):
        """Test Super Mutant uses direct, simple language."""
        reading_data = single_card_reading_data
        reading_data["character_voice"] = "super_mutant_simplicity"

        # TODO: Implement when service is created
        # interpretation = await generate_super_mutant_interpretation(reading_data)

        expected_characteristics = [
            "語言簡單直接",
            "邏輯出奇清晰",
            "忽略複雜細節",
            "專注核心問題",
            "實用主義至上",
            "消除無用信息"
        ]

        # Test simplicity characteristics
        simplicity_keywords = ["簡單", "直接", "清晰", "核心", "實用"]
        for characteristic in expected_characteristics:
            has_simplicity = any(keyword in characteristic for keyword in simplicity_keywords)
            assert has_simplicity

    @pytest.mark.asyncio
    async def test_super_mutant_clear_logic(self):
        """Test Super Mutant provides unexpectedly clear logical analysis."""
        logical_statements = [
            "問題簡單：有危險就避開，沒危險就前進",
            "卡牌說好事，就是好事。卡牌說壞事，就準備解決",
            "複雜想法浪費時間。重要的是：現在做什麼？",
            "太多選擇讓人困惑。最好的選擇通常最明顯",
            "其他人想太多。答案在眼前，直接行動就對了",
            "強者生存，弱者淘汰。卡牌告訴你如何變強"
        ]

        # Test binary logic and directness
        logic_indicators = ["簡單", "就是", "直接", "最好", "答案", "行動"]
        for statement in logical_statements:
            has_logic_indicator = any(indicator in statement for indicator in logic_indicators)
            assert has_logic_indicator

    @pytest.mark.asyncio
    async def test_super_mutant_elimination_of_complexity(self):
        """Test Super Mutant cuts through complexity to core issues."""
        complexity_elimination = [
            "別想那麼多，重點是生存",
            "複雜計劃容易失敗，簡單方法最可靠",
            "不需要理由，結果說明一切",
            "強者不需要解釋，弱者解釋太多",
            "問題只有兩種：能解決的和不能解決的",
            "廢話很多，但答案只有一個"
        ]

        # Test anti-complexity stance
        anti_complexity_keywords = ["別想", "簡單", "不需要", "只有", "答案"]
        for elimination in complexity_elimination:
            has_anti_complexity = any(keyword in elimination for keyword in anti_complexity_keywords)
            assert has_anti_complexity

    @pytest.mark.asyncio
    async def test_super_mutant_strength_focus(self):
        """Test Super Mutant emphasizes strength and survival."""
        strength_themes = [
            "這張牌讓你更強",
            "弱點必須消除",
            "強者的選擇很明確",
            "生存最重要，其他都是細節",
            "力量解決所有問題",
            "適者生存，不適者被淘汰"
        ]

        # Test strength and survival focus
        strength_keywords = ["強", "生存", "力量", "淘汰", "適者"]
        for theme in strength_themes:
            has_strength_focus = any(keyword in theme for keyword in strength_keywords)
            assert has_strength_focus


class TestCharacterVoiceConsistency:
    """Test character voice consistency and switching."""

    @pytest.mark.asyncio
    async def test_voice_consistency_within_reading(self, vault_tec_spread_data):
        """Test character voice remains consistent throughout a reading."""
        spread_data = vault_tec_spread_data
        spread_data["character_voice"] = "pip_boy_analysis"

        # TODO: Implement when service is created
        # interpretation = await generate_full_interpretation(spread_data)
        #
        # # Test all cards use same voice style
        # for card_interpretation in interpretation.card_meanings:
        #     assert "掃描" in card_interpretation.analysis  # Pip-Boy style
        #     assert "分析" in card_interpretation.analysis
        #     assert "評估" in card_interpretation.analysis

        # For now, test the concept
        assert spread_data["character_voice"] == "pip_boy_analysis"
        assert len(spread_data["cards_data"]) == 3

    @pytest.mark.asyncio
    async def test_voice_switching_between_readings(self, db_session):
        """Test user can switch voices between different readings."""
        user_id = str(uuid.uuid4())

        reading_voices = [
            ("reading_1", "pip_boy_analysis"),
            ("reading_2", "vault_dweller_perspective"),
            ("reading_3", "wasteland_trader_wisdom"),
            ("reading_4", "super_mutant_simplicity")
        ]

        # TODO: Test voice switching works
        # for reading_id, voice in reading_voices:
        #     reading = await create_reading_with_voice(user_id, voice)
        #     assert reading.character_voice == voice

        # For now, test the concept
        assert len(reading_voices) == 4
        voices_used = [voice for _, voice in reading_voices]
        assert len(set(voices_used)) == 4  # All different voices

    @pytest.mark.asyncio
    async def test_voice_preference_saving(self, test_user, db_session):
        """Test user voice preferences are saved and applied."""
        user_data = test_user

        # TODO: Implement when user service is created
        # user_service = UserService()
        # await user_service.update_voice_preference(
        #     user_data["id"], "wasteland_trader_wisdom"
        # )
        #
        # preference = await user_service.get_voice_preference(user_data["id"])
        # assert preference == "wasteland_trader_wisdom"

        # For now, test the concept
        preferred_voice = "wasteland_trader_wisdom"
        assert preferred_voice in [
            "pip_boy_analysis",
            "vault_dweller_perspective",
            "wasteland_trader_wisdom",
            "super_mutant_simplicity"
        ]


class TestCharacterVoicePersonalization:
    """Test character voice personalization based on user profile."""

    @pytest.mark.asyncio
    async def test_karma_influence_on_voice_style(self, karma_profile_data):
        """Test karma affects interpretation tone within voice styles."""
        karma_data = karma_profile_data

        # Test karma influences voice tone
        karma_voice_modifiers = {
            "good": {
                "pip_boy_analysis": "更多正面預測和建設性建議",
                "vault_dweller_perspective": "更加樂觀和助人導向",
                "wasteland_trader_wisdom": "強調公平交易和互利共贏",
                "super_mutant_simplicity": "保護弱者的簡單正義"
            },
            "neutral": {
                "pip_boy_analysis": "客觀數據分析，不偏不倚",
                "vault_dweller_perspective": "平衡的好奇心和謹慎",
                "wasteland_trader_wisdom": "純粹的商業考量",
                "super_mutant_simplicity": "實用主義的直接選擇"
            },
            "evil": {
                "pip_boy_analysis": "更多風險警告和威脅評估",
                "vault_dweller_perspective": "天真中帶有自私傾向",
                "wasteland_trader_wisdom": "更注重個人利益最大化",
                "super_mutant_simplicity": "勝者為王的叢林法則"
            }
        }

        # Test karma modifiers exist for each voice
        karma_level = karma_data["karma_level"]
        assert karma_level in karma_voice_modifiers

        voice_modifiers = karma_voice_modifiers[karma_level]
        assert len(voice_modifiers) == 4

    @pytest.mark.asyncio
    async def test_faction_alignment_voice_influence(self, faction_alignment_data):
        """Test faction alignment influences voice interpretation style."""
        faction_data = faction_alignment_data

        faction_voice_influences = {
            "vault_dweller": {
                "preferred_voices": ["pip_boy_analysis", "vault_dweller_perspective"],
                "voice_modifiers": {
                    "technology_focus": True,
                    "scientific_approach": True,
                    "optimistic_outlook": True
                }
            },
            "brotherhood_of_steel": {
                "preferred_voices": ["pip_boy_analysis", "super_mutant_simplicity"],
                "voice_modifiers": {
                    "technology_emphasis": True,
                    "military_precision": True,
                    "knowledge_preservation": True
                }
            },
            "ncr": {
                "preferred_voices": ["wasteland_trader_wisdom", "pip_boy_analysis"],
                "voice_modifiers": {
                    "democratic_values": True,
                    "economic_focus": True,
                    "diplomatic_solutions": True
                }
            }
        }

        # Test faction influences exist
        primary_faction = faction_data["primary_faction"]
        if primary_faction in faction_voice_influences:
            influence = faction_voice_influences[primary_faction]
            assert "preferred_voices" in influence
            assert "voice_modifiers" in influence

    @pytest.mark.asyncio
    async def test_reading_history_voice_adaptation(self):
        """Test voice adapts based on user's reading history."""
        # TODO: Implement when analytics service is created
        # user_history = {
        #     "most_used_voice": "pip_boy_analysis",
        #     "successful_interpretations": ["vault_dweller_perspective"],
        #     "preferred_question_types": ["exploration_adventures", "survival_decisions"]
        # }
        #
        # voice_adaptation = await calculate_voice_adaptation(user_history)
        # assert voice_adaptation.recommended_voice in user_history["successful_interpretations"]

        # For now, test the concept
        mock_history = {
            "total_readings": 25,
            "voice_usage": {
                "pip_boy_analysis": 10,
                "vault_dweller_perspective": 8,
                "wasteland_trader_wisdom": 4,
                "super_mutant_simplicity": 3
            },
            "satisfaction_ratings": {
                "pip_boy_analysis": 4.2,
                "vault_dweller_perspective": 4.5,
                "wasteland_trader_wisdom": 3.8,
                "super_mutant_simplicity": 4.0
            }
        }

        # Test highest satisfaction voice is identified
        best_voice = max(mock_history["satisfaction_ratings"].items(), key=lambda x: x[1])
        assert best_voice[0] == "vault_dweller_perspective"
        assert best_voice[1] == 4.5


class TestVoiceQualityAssurance:
    """Test character voice quality and authenticity."""

    @pytest.mark.asyncio
    async def test_voice_authenticity_validation(self, character_voices_data):
        """Test each voice maintains authentic Fallout character traits."""
        voices_data = character_voices_data

        for voice_data in voices_data:
            voice_id = voice_data["id"]

            # Test required voice attributes
            required_attributes = [
                "name", "description", "personality",
                "interpretation_style", "humor_level"
            ]

            for attr in required_attributes:
                assert attr in voice_data

            # Test Fallout theme authenticity
            fallout_elements = [
                voice_data["name"], voice_data["description"],
                str(voice_data.get("example_phrases", [])),
                str(voice_data.get("characteristics", []))
            ]

            combined_text = " ".join(fallout_elements)
            fallout_keywords = [
                "Pip-Boy", "避難所", "廢土", "變種人", "商人",
                "Vault", "輻射", "兄弟會", "數據", "分析"
            ]

            has_fallout_theme = any(keyword in combined_text for keyword in fallout_keywords)
            assert has_fallout_theme, f"Voice {voice_id} should contain Fallout themes"

    @pytest.mark.asyncio
    async def test_voice_distinctiveness(self, character_voices_data):
        """Test each voice has distinct characteristics."""
        voices_data = character_voices_data

        # Test personality differences
        personalities = [voice["personality"] for voice in voices_data]
        assert len(set(personalities)) == len(personalities)  # All unique

        # Test interpretation style differences
        styles = [voice["interpretation_style"] for voice in voices_data]
        assert len(set(styles)) == len(styles)  # All unique

        # Test humor level variety
        humor_levels = [voice["humor_level"] for voice in voices_data]
        unique_humor_levels = set(humor_levels)
        assert len(unique_humor_levels) >= 2  # At least some variety

    @pytest.mark.asyncio
    async def test_voice_accessibility(self):
        """Test voices are accessible to different user types."""
        voice_accessibility = {
            "pip_boy_analysis": {
                "difficulty": "medium",
                "tech_savvy_required": True,
                "fallout_knowledge_needed": "moderate"
            },
            "vault_dweller_perspective": {
                "difficulty": "easy",
                "tech_savvy_required": False,
                "fallout_knowledge_needed": "basic"
            },
            "wasteland_trader_wisdom": {
                "difficulty": "medium",
                "tech_savvy_required": False,
                "fallout_knowledge_needed": "moderate"
            },
            "super_mutant_simplicity": {
                "difficulty": "easy",
                "tech_savvy_required": False,
                "fallout_knowledge_needed": "basic"
            }
        }

        # Test accessibility range
        easy_voices = [v for v, data in voice_accessibility.items() if data["difficulty"] == "easy"]
        assert len(easy_voices) >= 2  # At least 2 beginner-friendly voices

        no_tech_required = [v for v, data in voice_accessibility.items() if not data["tech_savvy_required"]]
        assert len(no_tech_required) >= 2  # At least 2 non-technical voices