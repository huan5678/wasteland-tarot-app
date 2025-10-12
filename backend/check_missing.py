from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

result = supabase.table('wasteland_cards').select("name, number, suit").eq('suit', 'major_arcana').order('number').execute()

print(f"現有大阿卡納：{len(result.data)} 張\n")
existing_numbers = set()
for card in result.data:
    print(f"  {card['number']}: {card['name']}")
    existing_numbers.add(card['number'])

print(f"\n缺少的編號：")
all_numbers = set(range(0, 22))
missing = sorted(all_numbers - existing_numbers)
print(f"  {missing}")
