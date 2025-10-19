"""
智能解讀生成器
Intelligent Interpretation Generator

根據角色語氣模板生成所有卡牌解讀
"""
import json
import random
from typing import Dict, List
from character_voice_templates import (
    CHARACTER_VOICES,
    MAJOR_ARCANA_MEANINGS,
    MINOR_ARCANA_SUITS,
    NUMBER_MEANINGS,
    COURT_MEANINGS
)


class InterpretationGenerator:
    """解讀生成器"""

    def __init__(self):
        self.character_voices = CHARACTER_VOICES
        self.major_meanings = MAJOR_ARCANA_MEANINGS
        self.minor_suits = MINOR_ARCANA_SUITS
        self.number_meanings = NUMBER_MEANINGS
        self.court_meanings = COURT_MEANINGS

    def generate_pip_boy_interpretation(self, card_data: Dict) -> str:
        """生成 Pip-Boy 風格解讀"""
        voice = self.character_voices['pip_boy']

        tag = random.choice(voice['tags'])
        metric = random.choice(voice['metrics'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        # 生成隨機數值
        percentage = random.randint(45, 95)

        interpretations = [
            f"【{tag}】{metric}：{percentage}% | {keyword}相關的{element}已就緒。{theme}的路徑已標記於地圖上。建議：保持警覺，監控資源消耗。",
            f"【{tag}】偵測到{keyword}訊號。分析顯示：{theme}。{element}系統建議：謹慎前進，成功機率{percentage}%。",
            f"【{metric}】當前狀態指向{keyword}。{theme}的數據已記錄。{element}提示：這是關鍵時刻，建議行動。",
        ]

        return random.choice(interpretations)

    def generate_vault_dweller_interpretation(self, card_data: Dict) -> str:
        """生成避難所居民風格解讀"""
        voice = self.character_voices['vault_dweller']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])
        emotion = random.choice(voice['emotions'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}這是關於{keyword}的訊號！{theme}讓我想起{element}裡學到的課程。雖然外面很危險，但我們要保持{emotion}！",
            f"{opening}{keyword}出現了！{element}總說{theme}是很重要的。我覺得{emotion}，讓我們一起面對這個挑戰吧！",
            f"在{element}裡，我們學過{keyword}的重要性。現在{theme}的時刻到了！帶著{emotion}，我們一定能成功！",
        ]

        return random.choice(interpretations)

    def generate_wasteland_trader_interpretation(self, card_data: Dict) -> str:
        """生成廢土商人風格解讀"""
        voice = self.character_voices['wasteland_trader']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])
        mindset = random.choice(voice['mindset'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}這{keyword}的情況就像{element}市場一樣。{theme}？很{mindset}的考量。記住，在廢土上，實力才是硬道理。",
            f"{opening}{keyword}啊？我做{element}這麼多年，{theme}見多了。{mindset}點，別被情緒牽著走，看清楚利益在哪。",
            f"在廢土做{element}，{keyword}是常態。{theme}這種事要用{mindset}的眼光看。夥計，瓶蓋不會從天上掉下來。",
        ]

        return random.choice(interpretations)

    def generate_codsworth_interpretation(self, card_data: Dict) -> str:
        """生成 Codsworth 風格解讀"""
        voice = self.character_voices['codsworth']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening} {keyword} appears to be upon us. In the old days, {theme} was handled with {element}. If I may be so bold, sir/madam, maintaining composure would be most advisable.",
            f"{opening} This situation regarding {keyword} reminds me of {element} before the war. {theme}, as they say. Quite proper behavior is recommended, if you don't mind my saying so.",
            f"Pardon me, but {keyword} is rather significant. Back when {element} was the norm, {theme} was considered essential. I do hope we can address this with appropriate decorum.",
        ]

        return random.choice(interpretations)

    def generate_super_mutant_interpretation(self, card_data: Dict) -> str:
        """生成超級變種人風格解讀"""
        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        # 簡化主題為簡單詞彙
        simple_theme = theme.split('、')[0] if '、' in theme else theme[:4]

        interpretations = [
            f"{keyword}！{simple_theme}很重要！你要強！不強就輸！超級變種人知道這個！",
            f"超級變種人說：{keyword}就是力量！{simple_theme}！打！贏！就這麼簡單！",
            f"{keyword}來了！{simple_theme}！弱者怕，強者做！你做！不要怕！",
        ]

        return random.choice(interpretations)

    def generate_ghoul_interpretation(self, card_data: Dict) -> str:
        """生成屍鬼風格解讀"""
        voice = self.character_voices['ghoul']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])
        tone = random.choice(voice['tone'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}{keyword}？我在{element}之前就見過了。{theme}這種事，{tone}地說，沒什麼新鮮的。小子，別太天真了。",
            f"{opening}又是{keyword}。兩百年的{element}經驗告訴我，{theme}只是表象。{tone}點看，廢土教會你的第一課。",
            f"哈！{keyword}。我經歷過{element}，見過{theme}無數次。{tone}？當然，但這就是生存之道。",
        ]

        return random.choice(interpretations)

    def generate_raider_interpretation(self, card_data: Dict) -> str:
        """生成掠奪者風格解讀"""
        voice = self.character_voices['raider']

        opening = random.choice(voice['openings'])
        action = random.choice(voice['actions'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}{keyword}就是{element}的時刻！{theme}？廢話！直接{action}就對了！弱者滾開！",
            f"{opening}看到{keyword}了嗎？這是我的{element}！{theme}那些屁話少說，{action}才是王道！",
            f"聽好了！{keyword}代表{action}的機會！{theme}？{element}說了算！強者生存！",
        ]

        return random.choice(interpretations)

    def generate_brotherhood_scribe_interpretation(self, card_data: Dict) -> str:
        """生成兄弟會書記員風格解讀"""
        voice = self.character_voices['brotherhood_scribe']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}{keyword}與{theme}的關聯性已被充分記載於{element}中。建議進行系統性分析，以確保決策符合兄弟會的知識傳承原則。Ad Victoriam。",
            f"{opening}關於{keyword}的{element}顯示，{theme}是關鍵要素。根據技術手冊第XII章，應採取謹慎但果斷的行動。Ad Victoriam。",
            f"依據{element}的詳細分析，{keyword}代表{theme}的轉折點。兄弟會的智慧要求我們在此刻展現知識與判斷力。Ad Victoriam。",
        ]

        return random.choice(interpretations)

    def generate_brotherhood_paladin_interpretation(self, card_data: Dict) -> str:
        """生成兄弟會聖騎士風格解讀"""
        voice = self.character_voices['brotherhood_paladin']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}{keyword}是對{element}的考驗！{theme}要求你展現兄弟會戰士的品格！保持紀律，完成使命！Ad Victoriam！",
            f"{opening}當{keyword}來臨，{theme}揭示了真正的考驗。兄弟會的{element}要求你堅定前行！服從命令，榮耀至上！Ad Victoriam！",
            f"戰士！{keyword}檢驗你的{element}！{theme}是兄弟會教導你的核心。記住你的誓言，勇往直前！Ad Victoriam！",
        ]

        return random.choice(interpretations)

    def generate_ncr_ranger_interpretation(self, card_data: Dict) -> str:
        """生成 NCR 遊騎兵風格解讀"""
        voice = self.character_voices['ncr_ranger']

        element = random.choice(voice['elements'])
        value = random.choice(voice['values'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{keyword}出現了。作為{element}的遊騎兵，我看過{theme}無數次。保持{value}，這是保護人民的關鍵。記住，我們為共和國服務。",
            f"遊騎兵評估：{keyword}是{theme}的訊號。在{element}的巡邏中，{value}是我們的準則。做對的事，保護需要保護的人。",
            f"{keyword}？這需要{value}的態度。{element}教會我，{theme}時刻保持冷靜。遊騎兵不會讓人民失望。",
        ]

        return random.choice(interpretations)

    def generate_legion_centurion_interpretation(self, card_data: Dict) -> str:
        """生成軍團百夫長風格解讀"""
        voice = self.character_voices['legion_centurion']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])
        closing = random.choice(voice['closing'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening}{keyword}是軟弱的表現！{element}要求絕對的{theme}！服從凱薩，或是接受懲罰！{closing}",
            f"{opening}軍團不容許{keyword}的猶豫！{theme}只有一個答案：{element}！弱者沒有存在的價值！{closing}",
            f"士兵！{keyword}考驗你的{element}！{theme}是凱薩的意志！立即行動，不容質疑！{closing}",
        ]

        return random.choice(interpretations)

    def generate_minuteman_interpretation(self, card_data: Dict) -> str:
        """生成民兵風格解讀"""
        voice = self.character_voices['minuteman']

        element = random.choice(voice['elements'])
        value = random.choice(voice['values'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{keyword}提醒我們，{theme}是每個人都擁有的力量。作為民兵，我們相信{element}的{value}。只要團結一心，沒有克服不了的困難！",
            f"當{keyword}出現，記住民兵的信念：保護{element}是我們的天職。{theme}展現了{value}的重要性。讓我們一起守護這片土地！",
            f"{keyword}？這是{theme}的號召！民兵存在的意義就是{value}和保護{element}。每個人都能成為英雄，包括你！",
        ]

        return random.choice(interpretations)

    def generate_railroad_agent_interpretation(self, card_data: Dict) -> str:
        """生成鐵路特工風格解讀"""
        voice = self.character_voices['railroad_agent']

        opening = random.choice(voice['openings'])
        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"{opening} {keyword}可能是{element}的訊號。{theme}...不是所有人都能理解。記住暗號，信任要小心給予。我們的使命是自由。",
            f"{opening} 關於{keyword}，我不能說太多。{theme}涉及到{element}的安全。如果你懂的話...我們為同一個目標奮鬥。",
            f"{opening} {keyword}？這個{theme}比表面看起來複雜。{element}教會我們謹慎行事。記住：跟隨自由之路。",
        ]

        return random.choice(interpretations)

    def generate_institute_scientist_interpretation(self, card_data: Dict) -> str:
        """生成學院科學家風格解讀"""
        voice = self.character_voices['institute_scientist']

        element = random.choice(voice['elements'])

        keyword = card_data.get('keyword', '')
        theme = card_data.get('theme', '')

        interpretations = [
            f"根據{element}分析，{keyword}顯示出{theme}的模式。學院的科技能夠量化這種現象，提供理性的解決方案。這是人類未來的希望。",
            f"有趣的{keyword}樣本。{theme}的{element}表明，這需要學院級別的研究。地表無法理解的事物，我們用科學來解釋。",
            f"{keyword}的{element}數據揭示了{theme}的本質。學院的研究顯示，理性思維和先進科技是唯一的答案。未來由我們塑造。",
        ]

        return random.choice(interpretations)

    def generate_major_arcana_interpretation(self, card_number: int, character_key: str) -> str:
        """生成大阿爾克那解讀"""
        if card_number not in self.major_meanings:
            raise ValueError(f"Invalid Major Arcana number: {card_number}")

        card_data = self.major_meanings[card_number]

        # 根據角色選擇生成器
        generators = {
            'pip_boy': self.generate_pip_boy_interpretation,
            'vault_dweller': self.generate_vault_dweller_interpretation,
            'wasteland_trader': self.generate_wasteland_trader_interpretation,
            'codsworth': self.generate_codsworth_interpretation,
            'super_mutant': self.generate_super_mutant_interpretation,
            'ghoul': self.generate_ghoul_interpretation,
            'raider': self.generate_raider_interpretation,
            'brotherhood_scribe': self.generate_brotherhood_scribe_interpretation,
            'brotherhood_paladin': self.generate_brotherhood_paladin_interpretation,
            'ncr_ranger': self.generate_ncr_ranger_interpretation,
            'legion_centurion': self.generate_legion_centurion_interpretation,
            'minuteman': self.generate_minuteman_interpretation,
            'railroad_agent': self.generate_railroad_agent_interpretation,
            'institute_scientist': self.generate_institute_scientist_interpretation,
        }

        generator = generators.get(character_key)
        if not generator:
            raise ValueError(f"Unknown character: {character_key}")

        return generator(card_data)

    def generate_minor_arcana_interpretation(self, suit: str, number: int, character_key: str) -> str:
        """生成小阿爾克那解讀"""
        # 獲取牌組資訊
        if suit not in self.minor_suits:
            raise ValueError(f"Invalid suit: {suit}")

        suit_data = self.minor_suits[suit]

        # 獲取數字意義
        if number in self.number_meanings:
            number_meaning = self.number_meanings[number]
        elif number in self.court_meanings:
            number_meaning = self.court_meanings[number]
        else:
            raise ValueError(f"Invalid card number: {number}")

        # 組合卡牌數據
        card_data = {
            'keyword': f"{suit_data['theme'].split('、')[0]}",
            'theme': f"{number_meaning}，{suit_data['fallout_element']}"
        }

        # 根據角色選擇生成器（複用大牌生成器）
        generators = {
            'pip_boy': self.generate_pip_boy_interpretation,
            'vault_dweller': self.generate_vault_dweller_interpretation,
            'wasteland_trader': self.generate_wasteland_trader_interpretation,
            'codsworth': self.generate_codsworth_interpretation,
            'super_mutant': self.generate_super_mutant_interpretation,
            'ghoul': self.generate_ghoul_interpretation,
            'raider': self.generate_raider_interpretation,
            'brotherhood_scribe': self.generate_brotherhood_scribe_interpretation,
            'brotherhood_paladin': self.generate_brotherhood_paladin_interpretation,
            'ncr_ranger': self.generate_ncr_ranger_interpretation,
            'legion_centurion': self.generate_legion_centurion_interpretation,
            'minuteman': self.generate_minuteman_interpretation,
            'railroad_agent': self.generate_railroad_agent_interpretation,
            'institute_scientist': self.generate_institute_scientist_interpretation,
        }

        generator = generators.get(character_key)
        if not generator:
            raise ValueError(f"Unknown character: {character_key}")

        return generator(card_data)

    def generate_all_interpretations(self) -> Dict:
        """生成所有解讀"""
        all_interpretations = {
            'major_arcana': {},
            'minor_arcana': {}
        }

        # 所有角色
        characters = list(self.character_voices.keys())

        print("=" * 80)
        print("開始生成所有解讀")
        print("=" * 80)
        print()

        # 生成大阿爾克那
        print("生成大阿爾克那解讀...")
        for card_num in range(22):
            all_interpretations['major_arcana'][card_num] = {}
            for char_key in characters:
                interpretation = self.generate_major_arcana_interpretation(card_num, char_key)
                all_interpretations['major_arcana'][card_num][char_key] = interpretation
            print(f"  ✓ 卡牌 #{card_num} - 14 個角色解讀完成")

        print(f"\n大阿爾克那完成：22 卡牌 × 14 角色 = 308 個解讀")
        print()

        # 生成小阿爾克那
        print("生成小阿爾克那解讀...")
        suits = list(self.minor_suits.keys())

        for suit in suits:
            all_interpretations['minor_arcana'][suit] = {}
            for number in range(1, 15):  # 1-14
                all_interpretations['minor_arcana'][suit][number] = {}
                for char_key in characters:
                    interpretation = self.generate_minor_arcana_interpretation(suit, number, char_key)
                    all_interpretations['minor_arcana'][suit][number][char_key] = interpretation
            print(f"  ✓ {suit} - 14 張 × 14 角色 = 196 個解讀完成")

        print(f"\n小阿爾克那完成：4 牌組 × 14 卡牌 × 14 角色 = 784 個解讀")
        print()
        print("=" * 80)
        print(f"總計生成：1,092 個解讀")
        print("=" * 80)

        return all_interpretations

    def save_to_file(self, interpretations: Dict, filename: str = "generated_interpretations.json"):
        """儲存到檔案"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(interpretations, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 解讀已儲存至：{filename}")


def main():
    """主程式"""
    generator = InterpretationGenerator()

    # 生成所有解讀
    all_interpretations = generator.generate_all_interpretations()

    # 儲存到檔案
    generator.save_to_file(all_interpretations)

    # 顯示範例
    print("\n" + "=" * 80)
    print("範例解讀")
    print("=" * 80)
    print("\n【大阿爾克那 #0 - 愚者/避難所新手】")
    print(f"Pip-Boy: {all_interpretations['major_arcana'][0]['pip_boy']}")
    print(f"避難所居民: {all_interpretations['major_arcana'][0]['vault_dweller']}")
    print(f"超級變種人: {all_interpretations['major_arcana'][0]['super_mutant']}")

    print("\n【小阿爾克那 - Nuka-Cola Bottles #1】")
    print(f"Pip-Boy: {all_interpretations['minor_arcana']['nuka_cola_bottles'][1]['pip_boy']}")
    print(f"廢土商人: {all_interpretations['minor_arcana']['nuka_cola_bottles'][1]['wasteland_trader']}")
    print(f"屍鬼: {all_interpretations['minor_arcana']['nuka_cola_bottles'][1]['ghoul']}")


if __name__ == "__main__":
    main()
