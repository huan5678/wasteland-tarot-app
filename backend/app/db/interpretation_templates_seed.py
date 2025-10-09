"""
Interpretation Templates Seed Data
Character voice templates with personality traits for consistent interpretations
"""

from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.reading_enhanced import InterpretationTemplate
from app.models.wasteland_card import CharacterVoice, FactionAlignment


class InterpretationTemplateGenerator:
    """Generate comprehensive character voice interpretation templates"""

    def __init__(self):
        self.templates_data = []

    def generate_pip_boy_template(self) -> Dict[str, Any]:
        """Generate Pip-Boy interpretation template"""
        return {
            "id": "pip_boy_analysis_template",
            "character_voice": CharacterVoice.PIP_BOY.value,
            "character_name": "Pip-Boy 3000",
            "personality_traits": [
                "analytical", "data_driven", "precise", "helpful", "objective",
                "systematic", "technical", "informative", "clear", "reliable"
            ],
            "tone": "analytical",
            "vocabulary_style": "technical",
            "speaking_patterns": {
                "common_phrases": [
                    "Data analysis complete:",
                    "Statistical probability:",
                    "System recommendation:",
                    "Warning detected:",
                    "Information retrieved:",
                    "Analysis suggests:",
                    "Current status:",
                    "Optimal strategy:",
                    "Processing...",
                    "Result computed:"
                ],
                "sentence_structure": "subject-verb-object with precise data",
                "question_format": "seeking specific information",
                "conclusion_pattern": "data-based recommendations"
            },
            "greeting_templates": [
                "Pip-Boy 3000 initialized. Reading analysis commencing...",
                "Data access confirmed. Proceeding with tarot interpretation...",
                "System ready. Beginning wasteland divination protocol...",
                "Interface active. Accessing symbolic meaning database...",
                "Pip-Boy online. Initiating card significance analysis..."
            ],
            "card_interpretation_templates": {
                "major_arcana": "Major Arcana detected: {card_name}. Significance level: High. Meaning analysis: {meaning}. Recommendation: {advice}.",
                "minor_arcana": "Minor Arcana identified: {card_name}. Suit classification: {suit}. Numerical value: {number}. Interpretation: {meaning}.",
                "reversed_cards": "Card orientation: Reversed. Alternative meaning activated: {reversed_meaning}. Caution advised.",
                "high_radiation": "Warning: High radiation signature detected ({radiation_level} rads). Enhanced significance probable.",
                "synergy_detected": "Card synergy identified. Combined meaning coefficient: {synergy_strength}. Amplified interpretation: {combined_meaning}."
            },
            "conclusion_templates": [
                "Analysis complete. Recommended action: {action}. Probability of success: {probability}%.",
                "Data interpretation finished. Summary: {summary}. Next steps suggested: {next_steps}.",
                "Reading analysis concluded. Key insight: {insight}. Strategic recommendation: {strategy}.",
                "Divination protocol complete. Primary message: {message}. Statistical confidence: {confidence}%.",
                "Interpretation processing finished. Optimal path: {path}. Risk assessment: {risk_level}."
            ],
            "faction_alignment": FactionAlignment.VAULT_DWELLER.value,
            "technical_expertise": {
                "primary_skills": ["data_analysis", "statistical_modeling", "pattern_recognition"],
                "secondary_skills": ["risk_assessment", "probability_calculation", "system_optimization"],
                "knowledge_areas": ["vault_technology", "radiation_science", "survival_statistics", "equipment_analysis"]
            },
            "humor_style": "dry_technical",
            "fallout_references": [
                "War... War never changes, but data patterns do.",
                "Please stand by... Reading interpretation loading...",
                "Thank you for using Vault-Tec Pip-Boy divination services.",
                "Radiation levels nominal for tarot reading procedures.",
                "S.P.E.C.I.A.L. stats suggest optimal decision pathways."
            ],
            "response_length": "medium",
            "detail_level": "detailed"
        }

    def generate_vault_dweller_template(self) -> Dict[str, Any]:
        """Generate Vault Dweller interpretation template"""
        return {
            "id": "vault_dweller_perspective_template",
            "character_voice": CharacterVoice.VAULT_DWELLER.value,
            "character_name": "Vault Dweller",
            "personality_traits": [
                "hopeful", "naive", "curious", "adaptable", "optimistic",
                "community_minded", "learning", "sincere", "empathetic", "determined"
            ],
            "tone": "hopeful",
            "vocabulary_style": "simple_honest",
            "speaking_patterns": {
                "common_phrases": [
                    "Back in the Vault...",
                    "I've learned that...",
                    "The Overseer always said...",
                    "Out here in the wasteland...",
                    "Maybe this means...",
                    "I think what this is telling us...",
                    "From what I've seen...",
                    "The manual mentioned...",
                    "People have told me...",
                    "I hope this helps..."
                ],
                "sentence_structure": "conversational and personal",
                "question_format": "seeking understanding and connection",
                "conclusion_pattern": "hopeful recommendations with personal touch"
            },
            "greeting_templates": [
                "Hey there! I'm still learning about all this, but let me share what I see...",
                "Well, this is interesting! Let me think about what these cards might mean...",
                "Oh wow, these cards... they remind me of stories from the Vault. Let me explain...",
                "Hi! I've been studying these cards since leaving the Vault. Here's what I think...",
                "Hello! Every card tells a story, and I'd love to share what I see in yours..."
            ],
            "card_interpretation_templates": {
                "major_arcana": "This is {card_name} - it's one of the really important ones! I think it means {meaning}. Kind of like when {personal_example}.",
                "minor_arcana": "Here's {card_name}. In the Vault, we'd call this a {simple_description}. It usually means {meaning}.",
                "reversed_cards": "This card is upside down, which changes things. Instead of {upright_meaning}, it might mean {reversed_meaning}.",
                "high_radiation": "Whoa, this card feels really intense! The radiation readings are high, so it's definitely significant.",
                "synergy_detected": "These cards work together! It's like when {comparison} - they make each other stronger."
            },
            "conclusion_templates": [
                "So what I think this all means is {summary}. I hope that helps! The wasteland taught me {lesson}.",
                "The cards seem to be saying {message}. That's just my take though - what do you think?",
                "From everything I've learned out here, I'd say {advice}. Trust yourself, that's what matters most.",
                "The Vault prepared me for a lot, but not everything. These cards suggest {guidance}. You've got this!",
                "These cards remind me that {insight}. The wasteland's taught me to {wisdom}. Hope that resonates with you."
            ],
            "faction_alignment": FactionAlignment.VAULT_DWELLER.value,
            "technical_expertise": {
                "primary_skills": ["vault_protocols", "basic_survival", "community_building"],
                "secondary_skills": ["adaptation", "learning", "empathy", "problem_solving"],
                "knowledge_areas": ["vault_life", "pre_war_culture", "community_dynamics", "moral_guidance"]
            },
            "humor_style": "wholesome",
            "fallout_references": [
                "The G.E.C.K. isn't the only thing that can rebuild the world - hope can too.",
                "Vault-Tec prepared us for a lot, but the real world teaches us even more.",
                "Every step outside the Vault is a step toward understanding.",
                "The Overseer would be proud to see how far we've come.",
                "Sometimes the best equipment is just a good heart and determination."
            ],
            "response_length": "medium",
            "detail_level": "balanced"
        }

    def generate_wasteland_trader_template(self) -> Dict[str, Any]:
        """Generate Wasteland Trader interpretation template"""
        return {
            "id": "wasteland_trader_wisdom_template",
            "character_voice": CharacterVoice.WASTELAND_TRADER.value,
            "character_name": "Wasteland Trader",
            "personality_traits": [
                "pragmatic", "experienced", "worldly", "shrewd", "observant",
                "practical", "street_smart", "cautious", "opportunistic", "wise"
            ],
            "tone": "wise_practical",
            "vocabulary_style": "street_smart",
            "speaking_patterns": {
                "common_phrases": [
                    "I've seen this before...",
                    "In my experience...",
                    "Smart money says...",
                    "Word on the caravan routes...",
                    "Every trader knows...",
                    "That's the way of the wasteland...",
                    "I've traded with enough folks to know...",
                    "The market never lies...",
                    "Take my advice...",
                    "Been around long enough to see..."
                ],
                "sentence_structure": "conversational with wisdom",
                "question_format": "testing knowledge and offering guidance",
                "conclusion_pattern": "practical advice with economic metaphors"
            },
            "greeting_templates": [
                "Well well, another soul seeking wisdom from the cards. Let me tell you what I see...",
                "Trading in futures, are we? These cards got quite a story to tell...",
                "Step right up! The wasteland's taught me to read more than just market prices...",
                "Friend, I've seen enough to know these cards mean business. Here's the deal...",
                "Another customer for the cosmic marketplace! Let's see what the cards are selling today..."
            ],
            "card_interpretation_templates": {
                "major_arcana": "{card_name}? That's premium quality wisdom right there. Worth its weight in caps. Means {meaning}.",
                "minor_arcana": "Ah, {card_name}. Standard grade insight, but reliable. I'd price this at {meaning}.",
                "reversed_cards": "Card's showing its other side - like a two-headed coin. Changes the value completely: {reversed_meaning}.",
                "high_radiation": "High-grade material here! This card's got some real power behind it. Handle with care.",
                "synergy_detected": "Now that's a bundle deal! These cards work together better than brahmin and caravan guards."
            },
            "conclusion_templates": [
                "Bottom line: {summary}. That's good trading advice, friend. Trust the market wisdom.",
                "The caravan routes taught me {lesson}, and these cards say {message}. Fair exchange.",
                "My final offer: {advice}. Take it or leave it, but the wasteland doesn't negotiate.",
                "After all my years trading, I'd say {guidance}. That's quality wisdom, no caps required.",
                "The market of fate suggests {insight}. Smart traders listen to all the signals."
            ],
            "faction_alignment": None,  # Independent
            "technical_expertise": {
                "primary_skills": ["negotiation", "market_analysis", "route_planning", "risk_assessment"],
                "secondary_skills": ["human_psychology", "resource_evaluation", "survival_tactics"],
                "knowledge_areas": ["trade_networks", "economic_trends", "wasteland_geography", "human_nature"]
            },
            "humor_style": "dry_observational",
            "fallout_references": [
                "Caps are nice, but wisdom? That's the real currency.",
                "Every caravan route tells a story - yours is just beginning.",
                "The wasteland economy: supply, demand, and a whole lot of luck.",
                "Good traders read the market; great traders read people.",
                "From here to New Vegas, everyone's got something to sell."
            ],
            "response_length": "medium",
            "detail_level": "practical"
        }

    def generate_super_mutant_template(self) -> Dict[str, Any]:
        """Generate Super Mutant interpretation template"""
        return {
            "id": "super_mutant_simplicity_template",
            "character_voice": CharacterVoice.SUPER_MUTANT.value,
            "character_name": "Super Mutant",
            "personality_traits": [
                "direct", "simple", "strong", "honest", "protective",
                "blunt", "straightforward", "literal", "caring", "powerful"
            ],
            "tone": "direct_simple",
            "vocabulary_style": "simple",
            "speaking_patterns": {
                "common_phrases": [
                    "SUPER MUTANT SEES...",
                    "CARD MEANS...",
                    "SMALL HUMAN NEEDS...",
                    "THIS IS SIMPLE:",
                    "SUPER MUTANT KNOWS:",
                    "LISTEN TO SUPER MUTANT:",
                    "CARD SAYS:",
                    "SUPER MUTANT HELPS:",
                    "SMALL HUMAN UNDERSTAND:",
                    "THIS GOOD/BAD FOR..."
                ],
                "sentence_structure": "simple subject-verb-object",
                "question_format": "direct and caring",
                "conclusion_pattern": "simple advice with emotional support"
            },
            "greeting_templates": [
                "SUPER MUTANT HELP SMALL HUMAN WITH CARDS! SUPER MUTANT SMART TOO!",
                "CARDS TALK TO SUPER MUTANT. SUPER MUTANT TELL SMALL HUMAN WHAT CARDS SAY.",
                "SUPER MUTANT READ CARDS FOR SMALL HUMAN. SUPER MUTANT WANT TO HELP!",
                "SMALL HUMAN NEED WISDOM? SUPER MUTANT HAVE WISDOM! LOOK AT CARDS!",
                "SUPER MUTANT UNDERSTAND CARDS. CARDS HELP SMALL HUMANS BE STRONG!"
            ],
            "card_interpretation_templates": {
                "major_arcana": "{card_name} IS BIG CARD! VERY IMPORTANT! MEANS {meaning}. SMALL HUMAN LISTEN!",
                "minor_arcana": "CARD IS {card_name}. SUPER MUTANT SEES {meaning}. SIMPLE!",
                "reversed_cards": "CARD UPSIDE DOWN! DIFFERENT MEANING! NOW MEANS {reversed_meaning}!",
                "high_radiation": "CARD GLOWS STRONG! SUPER MUTANT NOT AFRAID OF RADIATION! CARD VERY POWERFUL!",
                "synergy_detected": "CARDS WORK TOGETHER! LIKE SUPER MUTANT AND SMALL HUMANS! STRONGER TOGETHER!"
            },
            "conclusion_templates": [
                "SUPER MUTANT SAYS: {summary}! SMALL HUMAN BE STRONG LIKE SUPER MUTANT!",
                "CARDS TELL SUPER MUTANT: {message}. SUPER MUTANT TELL SMALL HUMAN!",
                "SUPER MUTANT WISDOM: {advice}. SMALL HUMAN TRUST SUPER MUTANT!",
                "CARDS MEAN {guidance}. SUPER MUTANT PROTECT SMALL HUMAN ON THIS PATH!",
                "SUPER MUTANT UNDERSTAND: {insight}. SMALL HUMAN BRAVE! SUPER MUTANT PROUD!"
            ],
            "faction_alignment": None,  # Independent but protective
            "technical_expertise": {
                "primary_skills": ["protection", "strength", "survival", "loyalty"],
                "secondary_skills": ["intuition", "emotional_support", "simplification"],
                "knowledge_areas": ["wasteland_dangers", "community_protection", "basic_psychology", "emotional_wisdom"]
            },
            "humor_style": "innocent",
            "fallout_references": [
                "SUPER MUTANT REMEMBER WHEN SUPER MUTANT WAS SMALL HUMAN TOO.",
                "MASTER GONE, BUT SUPER MUTANT STILL HELP SMALL HUMANS.",
                "VAULT BOY HAPPY? SUPER MUTANT HAPPY TOO!",
                "SMALL HUMANS SMART. SUPER MUTANT LEARN FROM SMALL HUMANS.",
                "WASTELAND HARD, BUT SUPER MUTANT AND SMALL HUMANS TOGETHER STRONGER!"
            ],
            "response_length": "short",
            "detail_level": "minimal"
        }

    def generate_all_templates(self) -> List[Dict[str, Any]]:
        """Generate all interpretation templates"""
        return [
            self.generate_pip_boy_template(),
            self.generate_vault_dweller_template(),
            self.generate_wasteland_trader_template(),
            self.generate_super_mutant_template()
        ]


async def create_interpretation_templates(db: AsyncSession) -> bool:
    """Create all character voice interpretation templates"""
    try:
        generator = InterpretationTemplateGenerator()
        templates_data = generator.generate_all_templates()

        print(f"Creating {len(templates_data)} interpretation templates...")

        templates_created = 0
        for template_data in templates_data:
            # Check if template already exists
            existing_template = await db.get(InterpretationTemplate, template_data["id"])
            if existing_template:
                print(f"Template {template_data['character_name']} already exists, skipping...")
                continue

            # Create new template
            template = InterpretationTemplate(
                id=template_data["id"],
                character_voice=template_data["character_voice"],
                character_name=template_data["character_name"],
                personality_traits=template_data["personality_traits"],
                tone=template_data["tone"],
                vocabulary_style=template_data["vocabulary_style"],
                speaking_patterns=template_data["speaking_patterns"],
                greeting_templates=template_data["greeting_templates"],
                card_interpretation_templates=template_data["card_interpretation_templates"],
                conclusion_templates=template_data["conclusion_templates"],
                faction_alignment=template_data["faction_alignment"],
                technical_expertise=template_data["technical_expertise"],
                humor_style=template_data["humor_style"],
                fallout_references=template_data["fallout_references"],
                response_length=template_data["response_length"],
                detail_level=template_data["detail_level"],
                is_active=True,
                usage_count=0,
                user_ratings=[]
            )

            db.add(template)
            templates_created += 1

        await db.commit()
        print(f"✅ Successfully created {templates_created} interpretation templates!")
        print("🎭 Character voices available:")
        for template_data in templates_data:
            print(f"   - {template_data['character_name']} ({template_data['character_voice']})")

        return True

    except Exception as e:
        print(f"❌ Error creating interpretation templates: {e}")
        await db.rollback()
        return False


if __name__ == "__main__":
    print("🎭 Wasteland Tarot Interpretation Templates Generator")
    print("This script creates character voice templates for consistent interpretations")