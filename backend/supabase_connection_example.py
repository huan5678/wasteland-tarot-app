
# Supabase Connection Example for Wasteland Tarot
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WastelandTarotDB:
    def __init__(self):
        # Get credentials from environment
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("SUPABASE_KEY")

        # Create clients for different permission levels
        self.service_client = create_client(self.supabase_url, self.service_key)
        self.anon_client = create_client(self.supabase_url, self.anon_key)

    def get_random_card(self) -> dict:
        """Get a random card for reading"""
        try:
            # Use anonymous client for reading cards (RLS allows this)
            result = self.anon_client.table('wasteland_cards')\
                .select('*')\
                .eq('is_active', True)\
                .limit(1)\
                .execute()

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching card: {e}")
            return None

    def get_cards_by_suit(self, suit: str) -> list:
        """Get all cards of a specific suit"""
        try:
            result = self.anon_client.table('wasteland_cards')\
                .select('*')\
                .eq('suit', suit)\
                .eq('is_active', True)\
                .order('number')\
                .execute()

            return result.data
        except Exception as e:
            print(f"Error fetching cards by suit: {e}")
            return []

    def create_reading_session(self, user_id: str, question: str) -> str:
        """Create a new reading session (requires service role)"""
        try:
            session_data = {
                "user_id": user_id,
                "question": question,
                "session_state": "in_progress",
                "character_voice": "pip_boy"
            }

            result = self.service_client.table('reading_sessions')\
                .insert(session_data)\
                .execute()

            return result.data[0]['id'] if result.data else None
        except Exception as e:
            print(f"Error creating reading session: {e}")
            return None

# Usage example
db = WastelandTarotDB()

# Get a random card
card = db.get_random_card()
if card:
    print(f"Drew card: {card['name']} ({card['suit']})")
    print(f"Upright meaning: {card['upright_meaning']}")

# Get all Major Arcana cards
major_cards = db.get_cards_by_suit('major_arcana')
print(f"Found {len(major_cards)} Major Arcana cards")
