"""
Fallout Theme Integrity Tests
Comprehensive testing to ensure all elements maintain authentic Fallout atmosphere,
lore consistency, and thematic coherence throughout the Wasteland Tarot system.
"""

import pytest
import re
from unittest.mock import AsyncMock, patch
from typing import Dict, Any, List, Set

from app.models.user import User
from app.models.reading_enhanced import Reading, UserProfile
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.reading_service import ReadingService
from app.services.wasteland_card_service import WastelandCardService


class TestFalloutThemeIntegrity:
    """Test suite for Fallout theme consistency and authenticity"""

    @pytest.fixture
    def fallout_vocabulary_bank(self) -> Dict[str, List[str]]:
        """Comprehensive Fallout vocabulary for theme validation"""
        return {
            "locations": [
                "避難所", "廢土", "首都廢土", "莫哈維", "聯邦", "核子冬天",
                "Vault", "Wasteland", "Capital Wasteland", "Mojave", "Commonwealth",
                "Nuclear Winter", "新維加斯", "新加州共和國", "鑽石城"
            ],
            "factions": [
                "兄弟會", "鋼鐵兄弟會", "NCR", "新加州共和國", "凱撒軍團",
                "英克雷", "劫掠者", "超級變種人", "蟲族", "民兵",
                "Brotherhood", "Steel Brotherhood", "Caesar's Legion",
                "Enclave", "Raiders", "Super Mutants", "Mirelurks", "Minutemen"
            ],
            "technology": [
                "Pip-Boy", "派普小子", "動力裝甲", "能量武器", "電漿步槍",
                "雷射步槍", "核融合電池", "輻射計", "史汀帕克", "輻射寧",
                "Power Armor", "Energy Weapons", "Plasma Rifle", "Laser Rifle",
                "Fusion Core", "Geiger Counter", "Stimpak", "RadAway"
            ],
            "consumables": [
                "可樂量子", "日落沙士", "瓶蓋", "變種果實", "輻射鼠肉",
                "Nuka-Cola", "Sunset Sarsaparilla", "Bottle Caps", "Mutfruit",
                "Radroach Meat", "量子可樂", "核子可樂"
            ],
            "creatures": [
                "輻射蟑螂", "變種狗", "死亡爪", "蟲族女王", "巨蠍",
                "野屍鬼", "發光者", "超級變種人",
                "Radroach", "Dogmeat", "Deathclaw", "Mirelurk Queen",
                "Radscorpion", "Feral Ghoul", "Glowing One", "Super Mutant"
            ],
            "pre_war": [
                "戰前", "大戰", "核子大戰", "戰前科技", "戰前文明",
                "Pre-War", "Great War", "Nuclear War", "Pre-War Technology",
                "Pre-War Civilization", "紅色中國", "資源戰爭"
            ],
            "radiation": [
                "輻射", "拉德", "輻射病", "輻射風暴", "放射性物質",
                "Radiation", "Rads", "Radiation Sickness", "Rad Storm",
                "Radioactive Material", "輻射計數", "輻射等級"
            ],
            "humor_elements": [
                "企業樂觀主義", "Vault-Tec式建議", "戰前的天真",
                "廢土幽默", "黑色幽默", "諷刺現實",
                "Corporate Optimism", "Vault-Tec Style Advice",
                "Pre-War Naivety", "Wasteland Humor", "Dark Humor"
            ]
        }

    @pytest.fixture
    def authentic_fallout_cards(self) -> List[WastelandCard]:
        """Sample cards with authentic Fallout theming"""
        return [
            WastelandCard(
                id="vault_dweller_card",
                name="避難所居民",
                english_name="The Vault Dweller",
                arcana_type="major",
                number=0,
                description="剛走出避難所的居民，對廢土充滿天真幻想和戰前價值觀",
                keywords=["新開始", "天真", "戰前價值", "適應"],
                wasteland_context="從安全的避難所踏入危險廢土的第一步",
                fallout_references=["Vault-Tec", "Pip-Boy", "避難所實驗", "監督"],
                humor_elements=["用戰前常識理解戰後世界", "對輻射的不當樂觀"],
                radiation_level=0.1
            ),
            WastelandCard(
                id="brotherhood_paladin",
                name="兄弟會聖騎士",
                english_name="Brotherhood Paladin",
                arcana_type="court",
                number=12,
                description="身著動力裝甲的鋼鐵兄弟會精英戰士，守護著失落的科技知識",
                keywords=["科技", "守護", "知識", "鋼鐵意志"],
                wasteland_context="在廢土中保存和控制危險科技的守護者",
                fallout_references=["動力裝甲", "雷射步槍", "科技法典", "長老"],
                humor_elements=["對科技的狂熱崇拜", "教條主義的執著"],
                faction_alignment=[FactionAlignment.BROTHERHOOD.value],
                radiation_level=0.2
            ),
            WastelandCard(
                id="nuka_cola_ace",
                name="核子可樂王牌",
                english_name="Ace of Nuka-Cola",
                arcana_type="minor",
                number=1,
                suit="nuka_cola_bottles",
                description="閃閃發光的核子可樂，戰前美國夢的象徵，現在帶著輻射光芒",
                keywords=["懷舊", "美國夢", "輻射治療", "成癮"],
                wasteland_context="廢土中最珍貴的貨幣和療癒物品之一",
                fallout_references=["核子可樂量子", "瓶蓋貨幣", "約翰卡萊布布拉德伯頓"],
                humor_elements=["對糖水的宗教式崇拜", "輻射可樂的諷刺"],
                radiation_level=0.4
            )
        ]

    @pytest.fixture
    def non_fallout_violations(self) -> List[Dict[str, Any]]:
        """Examples of theme violations to test against"""
        return [
            {
                "type": "wrong_universe",
                "content": "星際大戰的原力使用者在廢土中冒險",
                "violation": "references_other_franchise"
            },
            {
                "type": "anachronistic_technology",
                "content": "使用iPhone和WiFi連接避難所網路",
                "violation": "inappropriate_technology"
            },
            {
                "type": "tone_mismatch",
                "content": "一切都很完美，沒有任何危險或困難",
                "violation": "inappropriate_optimism"
            },
            {
                "type": "lore_inconsistency",
                "content": "核戰發生在1950年代",
                "violation": "historical_inaccuracy"
            },
            {
                "type": "character_violation",
                "content": "哈利波特在霍格華茲教授魔法",
                "violation": "wrong_fictional_universe"
            }
        ]

    def extract_theme_keywords(self, text: str) -> Set[str]:
        """Extract potential theme keywords from text"""
        # Convert to lowercase for analysis
        text_lower = text.lower()

        # Split into words and clean
        words = re.findall(r'\b\w+\b', text_lower)

        # Remove common words
        common_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
            'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
            'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
            'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        }

        theme_keywords = set(words) - common_words
        return theme_keywords

    def calculate_fallout_theme_score(
        self,
        text: str,
        vocabulary_bank: Dict[str, List[str]]
    ) -> Dict[str, Any]:
        """Calculate how well text adheres to Fallout theme"""
        text_lower = text.lower()
        keywords = self.extract_theme_keywords(text)

        category_scores = {}
        total_matches = 0
        total_possible = 0

        for category, vocab_list in vocabulary_bank.items():
            matches = 0
            for vocab_item in vocab_list:
                vocab_lower = vocab_item.lower()
                if vocab_lower in text_lower:
                    matches += 1
                    total_matches += 1

            category_scores[category] = {
                "matches": matches,
                "total": len(vocab_list),
                "score": matches / len(vocab_list) if vocab_list else 0
            }
            total_possible += len(vocab_list)

        overall_score = total_matches / total_possible if total_possible > 0 else 0

        return {
            "overall_score": overall_score,
            "category_scores": category_scores,
            "total_matches": total_matches,
            "keyword_diversity": len(keywords),
            "fallout_density": total_matches / len(keywords) if keywords else 0
        }

    @pytest.mark.asyncio
    async def test_card_fallout_theme_authenticity(
        self,
        authentic_fallout_cards,
        fallout_vocabulary_bank
    ):
        """
        測試牌卡的 Fallout 主題真實性

        測試情境：
        - 牌卡描述包含 Fallout 元素
        - 廢土背景的一致性
        - 派系關聯的準確性
        - 科技等級的合理性
        """
        for card in authentic_fallout_cards:
            # Test card description for Fallout theme
            description_score = self.calculate_fallout_theme_score(
                card.description,
                fallout_vocabulary_bank
            )

            assert description_score["overall_score"] > 0.1, f"Card {card.name} lacks Fallout theme elements"
            assert description_score["total_matches"] >= 2, f"Card {card.name} has insufficient Fallout references"

            # Test wasteland context
            if hasattr(card, 'wasteland_context') and card.wasteland_context:
                context_score = self.calculate_fallout_theme_score(
                    card.wasteland_context,
                    fallout_vocabulary_bank
                )
                assert context_score["total_matches"] >= 1, f"Card {card.name} wasteland context lacks theme"

            # Test Fallout references
            if hasattr(card, 'fallout_references') and card.fallout_references:
                assert len(card.fallout_references) >= 2, f"Card {card.name} needs more Fallout references"

                # Each reference should be authentic
                for reference in card.fallout_references:
                    is_authentic = any(
                        reference.lower() in [item.lower() for item in vocab_list]
                        for vocab_list in fallout_vocabulary_bank.values()
                    )
                    assert is_authentic or len(reference) > 3, f"Questionable Fallout reference: {reference}"

            # Test humor elements for Fallout style
            if hasattr(card, 'humor_elements') and card.humor_elements:
                humor_text = " ".join(card.humor_elements)
                humor_keywords = ["諷刺", "黑色幽默", "戰前", "廢土", "樂觀", "天真"]

                has_fallout_humor = any(keyword in humor_text for keyword in humor_keywords)
                assert has_fallout_humor, f"Card {card.name} humor doesn't match Fallout style"

    @pytest.mark.asyncio
    async def test_interpretation_fallout_consistency(
        self,
        db_session,
        authentic_fallout_cards,
        fallout_vocabulary_bank
    ):
        """
        測試解釋內容的 Fallout 一致性

        測試情境：
        - AI 解釋保持 Fallout 語調
        - 廢土背景的參考
        - 角色聲音的真實性
        - 派系觀點的準確性
        """
        reading_service = ReadingService(db_session)

        # Create test user with Fallout background
        fallout_user = User(
            id="fallout_theme_user",
            username="wasteland_wanderer",
            email="wanderer@vault.com",
            karma_score=75,
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            is_active=True
        )

        profile = UserProfile(
            user_id=fallout_user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            wasteland_location="Capital Wasteland"
        )

        fallout_user.profile = profile

        # Test interpretations for different character voices
        character_voices = [
            CharacterVoice.PIP_BOY,
            CharacterVoice.VAULT_DWELLER,
            CharacterVoice.WASTELAND_TRADER,
            CharacterVoice.SUPER_MUTANT
        ]

        for voice in character_voices:
            interpretation = await reading_service._generate_interpretation(
                user=fallout_user,
                cards=[authentic_fallout_cards[0]],
                question="我在廢土中的下一步行動是什麼？",
                character_voice=voice
            )

            # Calculate theme authenticity
            theme_score = self.calculate_fallout_theme_score(
                interpretation,
                fallout_vocabulary_bank
            )

            assert theme_score["overall_score"] > 0.05, f"{voice} interpretation lacks Fallout theme"
            assert theme_score["total_matches"] >= 3, f"{voice} interpretation needs more Fallout references"

            # Voice-specific authenticity checks
            if voice == CharacterVoice.PIP_BOY:
                pip_boy_keywords = ["分析", "數據", "掃描", "系統", "建議", "威脅等級"]
                has_pip_boy_style = any(keyword in interpretation for keyword in pip_boy_keywords)
                assert has_pip_boy_style, "Pip-Boy voice doesn't match expected style"

            elif voice == CharacterVoice.VAULT_DWELLER:
                vault_keywords = ["避難所", "戰前", "手冊", "安全", "程序"]
                has_vault_style = any(keyword in interpretation for keyword in vault_keywords)
                assert has_vault_style, "Vault Dweller voice doesn't match expected style"

            elif voice == CharacterVoice.SUPER_MUTANT:
                mutant_keywords = ["強壯", "簡單", "直接", "力量"]
                # Super mutant should have simpler language structure
                sentences = interpretation.split('。')
                avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
                assert avg_sentence_length < 15, "Super Mutant voice too complex"

    @pytest.mark.asyncio
    async def test_faction_lore_accuracy(
        self,
        db_session,
        fallout_vocabulary_bank
    ):
        """
        測試派系背景知識的準確性

        測試情境：
        - 兄弟會的科技專注
        - NCR 的民主價值
        - 劫掠者的混亂本質
        - 避難所居民的純真
        """
        reading_service = ReadingService(db_session)

        # Test faction-specific interpretations
        faction_tests = [
            {
                "faction": FactionAlignment.BROTHERHOOD,
                "expected_themes": ["科技", "知識", "保護", "鋼鐵", "長老"],
                "question": "這項古老科技的用途是什麼？"
            },
            {
                "faction": FactionAlignment.NCR,
                "expected_themes": ["民主", "共和", "秩序", "法律", "貿易"],
                "question": "如何建立穩定的社會秩序？"
            },
            {
                "faction": FactionAlignment.RAIDERS,
                "expected_themes": ["掠奪", "混亂", "生存", "力量", "自由"],
                "question": "如何快速獲得更多資源？"
            },
            {
                "faction": FactionAlignment.VAULT_DWELLER,
                "expected_themes": ["純真", "戰前", "安全", "學習", "適應"],
                "question": "外面的世界安全嗎？"
            }
        ]

        test_card = WastelandCard(
            id="faction_test_card",
            name="廢土指引",
            arcana_type="major",
            number=10,
            description="在混亂的廢土中尋找方向"
        )

        for faction_test in faction_tests:
            faction_user = User(
                id=f"faction_user_{faction_test['faction'].value}",
                username=f"faction_{faction_test['faction'].value}",
                email=f"{faction_test['faction'].value}@test.com",
                karma_score=60,
                faction_alignment=faction_test["faction"].value,
                is_active=True
            )

            interpretation = await reading_service._generate_interpretation(
                user=faction_user,
                cards=[test_card],
                question=faction_test["question"],
                character_voice=CharacterVoice.PIP_BOY
            )

            # Check for faction-appropriate themes
            faction_theme_found = False
            for expected_theme in faction_test["expected_themes"]:
                if expected_theme in interpretation:
                    faction_theme_found = True
                    break

            assert faction_theme_found, f"Faction {faction_test['faction'].value} interpretation lacks appropriate themes"

            # Verify faction-specific vocabulary
            faction_score = self.calculate_fallout_theme_score(
                interpretation,
                {"faction_themes": faction_test["expected_themes"]}
            )

            assert faction_score["total_matches"] >= 1, f"Faction {faction_test['faction'].value} interpretation needs faction-specific content"

    @pytest.mark.asyncio
    async def test_wasteland_humor_authenticity(
        self,
        db_session,
        authentic_fallout_cards
    ):
        """
        測試廢土幽默的真實性

        測試情境：
        - 黑色幽默元素
        - 企業樂觀主義諷刺
        - 戰前天真的對比
        - 廢土現實的荒謬感
        """
        reading_service = ReadingService(db_session)

        humor_user = User(
            id="humor_test_user",
            username="comedy_survivor",
            email="humor@wasteland.com",
            karma_score=50,
            is_active=True
        )

        # Test various humor scenarios
        humor_scenarios = [
            {
                "question": "我應該相信這個看起來很友善的商人嗎？",
                "expected_humor": ["諷刺", "現實", "教訓"],
                "voice": CharacterVoice.WASTELAND_TRADER
            },
            {
                "question": "這個避難所實驗看起來很安全",
                "expected_humor": ["企業", "樂觀", "危險"],
                "voice": CharacterVoice.VAULT_DWELLER
            },
            {
                "question": "輻射對健康有益嗎？",
                "expected_humor": ["諷刺", "戰前", "醫學"],
                "voice": CharacterVoice.PIP_BOY
            }
        ]

        for scenario in humor_scenarios:
            interpretation = await reading_service._generate_interpretation(
                user=humor_user,
                cards=[authentic_fallout_cards[0]],
                question=scenario["question"],
                character_voice=scenario["voice"]
            )

            # Check for Fallout-style humor indicators
            humor_indicators = [
                "諷刺", "荒謬", "黑色", "企業式", "樂觀",
                "戰前的", "天真", "現實", "危險", "警告"
            ]

            humor_found = any(indicator in interpretation for indicator in humor_indicators)

            # Alternatively, check for structural humor (contrasts, warnings, etc.)
            has_contrast = ("但是" in interpretation or "然而" in interpretation or
                          "不過" in interpretation or "可是" in interpretation)

            has_warning = ("小心" in interpretation or "注意" in interpretation or
                         "警告" in interpretation or "危險" in interpretation)

            has_fallout_humor = humor_found or has_contrast or has_warning

            assert has_fallout_humor, f"Interpretation lacks Fallout-style humor for: {scenario['question']}"

    @pytest.mark.asyncio
    async def test_radiation_theme_integration(
        self,
        authentic_fallout_cards,
        fallout_vocabulary_bank
    ):
        """
        測試輻射主題的整合

        測試情境：
        - 輻射等級的合理性
        - 輻射效應的描述
        - Geiger計數器風格
        - 輻射治療的概念
        """
        # Test radiation levels are realistic
        for card in authentic_fallout_cards:
            assert 0.0 <= card.radiation_level <= 1.0, f"Card {card.name} has invalid radiation level"

            # High radiation cards should have appropriate themes
            if card.radiation_level > 0.5:
                radiation_themes = ["輻射", "危險", "變異", "污染", "高能量"]
                has_radiation_theme = any(
                    theme in card.description for theme in radiation_themes
                )
                # Not strictly required, but encouraged for high-rad cards
                if not has_radiation_theme:
                    print(f"High radiation card {card.name} could use more radiation themes")

        # Test radiation-related vocabulary usage
        radiation_vocab = fallout_vocabulary_bank.get("radiation", [])

        for card in authentic_fallout_cards:
            if card.radiation_level > 0.3:
                description_score = self.calculate_fallout_theme_score(
                    card.description,
                    {"radiation": radiation_vocab}
                )

                # Higher radiation should correlate with more radiation references
                expected_references = int(card.radiation_level * 3)  # Scale expectation

                # This is a guideline, not a strict requirement
                if description_score["total_matches"] < expected_references:
                    print(f"Card {card.name} (rad: {card.radiation_level}) could use more radiation references")

    @pytest.mark.asyncio
    async def test_anti_fallout_theme_detection(
        self,
        non_fallout_violations
    ):
        """
        測試非 Fallout 主題的偵測

        測試情境：
        - 其他科幻宇宙元素
        - 不合時代的科技
        - 語調不符
        - 背景知識錯誤
        """
        for violation in non_fallout_violations:
            content = violation["content"]
            violation_type = violation["violation"]

            # Detect wrong universe references
            if violation_type == "references_other_franchise":
                wrong_franchises = ["星際大戰", "星艦迷航", "哈利波特", "漫威", "DC"]
                has_wrong_reference = any(franchise in content for franchise in wrong_franchises)
                assert has_wrong_reference, f"Test case should contain wrong franchise reference: {content}"

            # Detect anachronistic technology
            elif violation_type == "inappropriate_technology":
                modern_tech = ["iPhone", "WiFi", "internet", "手機", "網路", "藍牙"]
                has_anachronism = any(tech in content for tech in modern_tech)
                assert has_anachronism, f"Test case should contain anachronistic technology: {content}"

            # Detect inappropriate tone
            elif violation_type == "inappropriate_optimism":
                overly_positive = ["完美", "沒有危險", "一切順利", "絕對安全"]
                has_wrong_tone = any(phrase in content for phrase in overly_positive)
                assert has_wrong_tone, f"Test case should contain inappropriate optimism: {content}"

    @pytest.mark.asyncio
    async def test_fallout_easter_eggs_presence(
        self,
        db_session,
        authentic_fallout_cards,
        fallout_vocabulary_bank
    ):
        """
        測試 Fallout 彩蛋的存在

        測試情境：
        - 經典角色提及
        - 著名地點參考
        - 遊戲機制隱喻
        - 社群術語使用
        """
        reading_service = ReadingService(db_session)

        # Easter egg references that should occasionally appear
        easter_eggs = {
            "characters": ["道格肉", "監督", "長老麥克森", "尼克情人"],
            "locations": ["鑽石城", "好鄰居", "新維加斯", "避難所111"],
            "items": ["核子可樂量子", "動力裝甲X-01", "胖子發射器"],
            "phrases": ["戰爭永遠不變", "避難所科技", "鋼鐵同盟"]
        }

        easter_egg_user = User(
            id="easter_egg_user",
            username="lore_master",
            email="lore@wasteland.com",
            karma_score=80,
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=100,  # Experienced user more likely to get easter eggs
            is_active=True
        )

        # Test multiple interpretations to see if easter eggs appear
        easter_egg_found = False
        interpretations = []

        for i in range(10):  # Multiple attempts to find easter eggs
            interpretation = await reading_service._generate_interpretation(
                user=easter_egg_user,
                cards=authentic_fallout_cards,
                question=f"告訴我廢土的深層秘密 {i}",
                character_voice=CharacterVoice.PIP_BOY
            )
            interpretations.append(interpretation)

            # Check for any easter eggs
            for category, eggs in easter_eggs.items():
                for egg in eggs:
                    if egg in interpretation:
                        easter_egg_found = True
                        print(f"Found easter egg: {egg} in interpretation {i}")
                        break
                if easter_egg_found:
                    break

            if easter_egg_found:
                break

        # Easter eggs are nice to have but not required
        # This test documents their presence rather than enforcing it
        if not easter_egg_found:
            print("No obvious easter eggs found in test interpretations")
            print("Consider adding more Fallout references for authenticity")
        else:
            print("Easter eggs successfully detected!")

    @pytest.mark.asyncio
    async def test_pip_boy_voice_authenticity(
        self,
        db_session,
        authentic_fallout_cards
    ):
        """
        測試 Pip-Boy 聲音的真實性

        測試情境：
        - 機械式分析語調
        - 數據導向描述
        - 系統化建議
        - 威脅評估格式
        """
        reading_service = ReadingService(db_session)

        pip_boy_user = User(
            id="pip_boy_user",
            username="data_analyst",
            email="data@vault.com",
            karma_score=60,
            is_active=True
        )

        pip_boy_interpretation = await reading_service._generate_interpretation(
            user=pip_boy_user,
            cards=[authentic_fallout_cards[0]],
            question="系統分析：當前情況評估",
            character_voice=CharacterVoice.PIP_BOY
        )

        # Pip-Boy style indicators
        pip_boy_style = [
            "分析", "數據", "系統", "掃描", "評估", "建議",
            "威脅等級", "成功機率", "統計", "計算", "偵測"
        ]

        pip_boy_score = sum(
            1 for indicator in pip_boy_style
            if indicator in pip_boy_interpretation
        )

        assert pip_boy_score >= 2, "Pip-Boy voice lacks characteristic analytical language"

        # Check for structured analysis format
        has_structure = ("：" in pip_boy_interpretation or
                        "根據" in pip_boy_interpretation or
                        "顯示" in pip_boy_interpretation)

        assert has_structure, "Pip-Boy voice should have structured analysis format"

    @pytest.mark.asyncio
    async def test_comprehensive_theme_integration(
        self,
        db_session,
        authentic_fallout_cards,
        fallout_vocabulary_bank
    ):
        """
        測試主題整合的全面性

        測試情境：
        - 多個 Fallout 元素的協調
        - 世界觀的一致性
        - 沉浸感的維持
        - 主題深度的平衡
        """
        reading_service = ReadingService(db_session)

        comprehensive_user = User(
            id="comprehensive_user",
            username="wasteland_lorekeeper",
            email="lore@brotherhood.org",
            karma_score=85,
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=200,
            is_active=True,
            is_premium=True
        )

        profile = UserProfile(
            user_id=comprehensive_user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            wasteland_location="Capital Wasteland",
            experience_level="Wasteland Legend"
        )

        comprehensive_user.profile = profile

        # Generate comprehensive interpretation
        comprehensive_interpretation = await reading_service._generate_interpretation(
            user=comprehensive_user,
            cards=authentic_fallout_cards,
            question="提供完整的廢土生存指導和世界觀分析",
            character_voice=CharacterVoice.PIP_BOY
        )

        # Calculate comprehensive theme score
        theme_score = self.calculate_fallout_theme_score(
            comprehensive_interpretation,
            fallout_vocabulary_bank
        )

        # Should have strong theme integration
        assert theme_score["overall_score"] > 0.1, "Comprehensive interpretation lacks sufficient Fallout themes"
        assert theme_score["total_matches"] >= 5, "Needs more diverse Fallout references"

        # Should cover multiple theme categories
        categories_covered = sum(
            1 for category_score in theme_score["category_scores"].values()
            if category_score["matches"] > 0
        )

        assert categories_covered >= 3, f"Should cover multiple theme categories, only found {categories_covered}"

        # Should maintain immersion (no theme violations)
        violation_indicators = [
            "現代科技", "手機", "網路", "電腦遊戲", "社交媒體",
            "星際大戰", "哈利波特", "超級英雄", "魔法", "精靈"
        ]

        has_violations = any(
            indicator in comprehensive_interpretation
            for indicator in violation_indicators
        )

        assert not has_violations, "Comprehensive interpretation contains theme violations"

        print(f"Comprehensive Theme Analysis:")
        print(f"  Overall Score: {theme_score['overall_score']:.3f}")
        print(f"  Total Matches: {theme_score['total_matches']}")
        print(f"  Categories Covered: {categories_covered}")
        print(f"  Fallout Density: {theme_score['fallout_density']:.3f}")

        # Quality indicators for excellent theme integration
        excellent_threshold = {
            "overall_score": 0.15,
            "total_matches": 8,
            "categories_covered": 4,
            "fallout_density": 0.3
        }

        quality_metrics = {
            "overall_score": theme_score["overall_score"] >= excellent_threshold["overall_score"],
            "total_matches": theme_score["total_matches"] >= excellent_threshold["total_matches"],
            "categories_covered": categories_covered >= excellent_threshold["categories_covered"],
            "fallout_density": theme_score["fallout_density"] >= excellent_threshold["fallout_density"]
        }

        quality_score = sum(quality_metrics.values())

        if quality_score >= 3:
            print("Theme Integration Quality: EXCELLENT")
        elif quality_score >= 2:
            print("Theme Integration Quality: GOOD")
        else:
            print("Theme Integration Quality: ADEQUATE")

        # Document areas for improvement
        for metric, passed in quality_metrics.items():
            if not passed:
                print(f"  Improvement opportunity: {metric}")