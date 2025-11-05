-- Update all wasteland cards with standard tarot names
-- Based on suit and number mapping

-- Major Arcana (0-21)
UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Fool',
    standard_tarot_name_zh = '愚者',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 0;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Magician',
    standard_tarot_name_zh = '魔術師',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 1;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The High Priestess',
    standard_tarot_name_zh = '女祭司',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 2;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Empress',
    standard_tarot_name_zh = '皇后',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 3;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Emperor',
    standard_tarot_name_zh = '皇帝',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 4;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Hierophant',
    standard_tarot_name_zh = '教皇',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 5;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Lovers',
    standard_tarot_name_zh = '戀人',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 6;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Chariot',
    standard_tarot_name_zh = '戰車',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 7;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Strength',
    standard_tarot_name_zh = '力量',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 8;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Hermit',
    standard_tarot_name_zh = '隱者',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 9;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Wheel of Fortune',
    standard_tarot_name_zh = '命運之輪',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 10;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Justice',
    standard_tarot_name_zh = '正義',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 11;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Hanged Man',
    standard_tarot_name_zh = '倒吊人',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 12;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Death',
    standard_tarot_name_zh = '死神',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 13;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Temperance',
    standard_tarot_name_zh = '節制',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 14;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Devil',
    standard_tarot_name_zh = '惡魔',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 15;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Tower',
    standard_tarot_name_zh = '塔',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 16;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Star',
    standard_tarot_name_zh = '星星',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 17;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Moon',
    standard_tarot_name_zh = '月亮',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 18;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The Sun',
    standard_tarot_name_zh = '太陽',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 19;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'Judgement',
    standard_tarot_name_zh = '審判',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 20;

UPDATE wasteland_cards SET 
    standard_tarot_name = 'The World',
    standard_tarot_name_zh = '世界',
    standard_suit = 'Major Arcana'
WHERE suit = 'major_arcana' AND number = 21;

-- Cups (Nuka-Cola Bottles) - Number cards (1-10)
UPDATE wasteland_cards SET standard_tarot_name = 'Ace of Cups', standard_tarot_name_zh = '聖杯王牌', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 1;
UPDATE wasteland_cards SET standard_tarot_name = 'Two of Cups', standard_tarot_name_zh = '聖杯二', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 2;
UPDATE wasteland_cards SET standard_tarot_name = 'Three of Cups', standard_tarot_name_zh = '聖杯三', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 3;
UPDATE wasteland_cards SET standard_tarot_name = 'Four of Cups', standard_tarot_name_zh = '聖杯四', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 4;
UPDATE wasteland_cards SET standard_tarot_name = 'Five of Cups', standard_tarot_name_zh = '聖杯五', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 5;
UPDATE wasteland_cards SET standard_tarot_name = 'Six of Cups', standard_tarot_name_zh = '聖杯六', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 6;
UPDATE wasteland_cards SET standard_tarot_name = 'Seven of Cups', standard_tarot_name_zh = '聖杯七', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 7;
UPDATE wasteland_cards SET standard_tarot_name = 'Eight of Cups', standard_tarot_name_zh = '聖杯八', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 8;
UPDATE wasteland_cards SET standard_tarot_name = 'Nine of Cups', standard_tarot_name_zh = '聖杯九', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 9;
UPDATE wasteland_cards SET standard_tarot_name = 'Ten of Cups', standard_tarot_name_zh = '聖杯十', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 10;

-- Cups - Court cards (11-14)
UPDATE wasteland_cards SET standard_tarot_name = 'Page of Cups', standard_tarot_name_zh = '聖杯侍者', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 11;
UPDATE wasteland_cards SET standard_tarot_name = 'Knight of Cups', standard_tarot_name_zh = '聖杯騎士', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 12;
UPDATE wasteland_cards SET standard_tarot_name = 'Queen of Cups', standard_tarot_name_zh = '聖杯王后', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 13;
UPDATE wasteland_cards SET standard_tarot_name = 'King of Cups', standard_tarot_name_zh = '聖杯國王', standard_suit = 'Cups' WHERE suit = 'nuka_cola_bottles' AND number = 14;

-- Swords (Combat Weapons) - Number cards (1-10)
UPDATE wasteland_cards SET standard_tarot_name = 'Ace of Swords', standard_tarot_name_zh = '寶劍王牌', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 1;
UPDATE wasteland_cards SET standard_tarot_name = 'Two of Swords', standard_tarot_name_zh = '寶劍二', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 2;
UPDATE wasteland_cards SET standard_tarot_name = 'Three of Swords', standard_tarot_name_zh = '寶劍三', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 3;
UPDATE wasteland_cards SET standard_tarot_name = 'Four of Swords', standard_tarot_name_zh = '寶劍四', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 4;
UPDATE wasteland_cards SET standard_tarot_name = 'Five of Swords', standard_tarot_name_zh = '寶劍五', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 5;
UPDATE wasteland_cards SET standard_tarot_name = 'Six of Swords', standard_tarot_name_zh = '寶劍六', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 6;
UPDATE wasteland_cards SET standard_tarot_name = 'Seven of Swords', standard_tarot_name_zh = '寶劍七', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 7;
UPDATE wasteland_cards SET standard_tarot_name = 'Eight of Swords', standard_tarot_name_zh = '寶劍八', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 8;
UPDATE wasteland_cards SET standard_tarot_name = 'Nine of Swords', standard_tarot_name_zh = '寶劍九', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 9;
UPDATE wasteland_cards SET standard_tarot_name = 'Ten of Swords', standard_tarot_name_zh = '寶劍十', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 10;

-- Swords - Court cards (11-14)
UPDATE wasteland_cards SET standard_tarot_name = 'Page of Swords', standard_tarot_name_zh = '寶劍侍者', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 11;
UPDATE wasteland_cards SET standard_tarot_name = 'Knight of Swords', standard_tarot_name_zh = '寶劍騎士', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 12;
UPDATE wasteland_cards SET standard_tarot_name = 'Queen of Swords', standard_tarot_name_zh = '寶劍王后', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 13;
UPDATE wasteland_cards SET standard_tarot_name = 'King of Swords', standard_tarot_name_zh = '寶劍國王', standard_suit = 'Swords' WHERE suit = 'combat_weapons' AND number = 14;

-- Pentacles (Bottle Caps) - Number cards (1-10)
UPDATE wasteland_cards SET standard_tarot_name = 'Ace of Pentacles', standard_tarot_name_zh = '錢幣王牌', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 1;
UPDATE wasteland_cards SET standard_tarot_name = 'Two of Pentacles', standard_tarot_name_zh = '錢幣二', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 2;
UPDATE wasteland_cards SET standard_tarot_name = 'Three of Pentacles', standard_tarot_name_zh = '錢幣三', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 3;
UPDATE wasteland_cards SET standard_tarot_name = 'Four of Pentacles', standard_tarot_name_zh = '錢幣四', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 4;
UPDATE wasteland_cards SET standard_tarot_name = 'Five of Pentacles', standard_tarot_name_zh = '錢幣五', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 5;
UPDATE wasteland_cards SET standard_tarot_name = 'Six of Pentacles', standard_tarot_name_zh = '錢幣六', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 6;
UPDATE wasteland_cards SET standard_tarot_name = 'Seven of Pentacles', standard_tarot_name_zh = '錢幣七', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 7;
UPDATE wasteland_cards SET standard_tarot_name = 'Eight of Pentacles', standard_tarot_name_zh = '錢幣八', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 8;
UPDATE wasteland_cards SET standard_tarot_name = 'Nine of Pentacles', standard_tarot_name_zh = '錢幣九', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 9;
UPDATE wasteland_cards SET standard_tarot_name = 'Ten of Pentacles', standard_tarot_name_zh = '錢幣十', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 10;

-- Pentacles - Court cards (11-14)
UPDATE wasteland_cards SET standard_tarot_name = 'Page of Pentacles', standard_tarot_name_zh = '錢幣侍者', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 11;
UPDATE wasteland_cards SET standard_tarot_name = 'Knight of Pentacles', standard_tarot_name_zh = '錢幣騎士', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 12;
UPDATE wasteland_cards SET standard_tarot_name = 'Queen of Pentacles', standard_tarot_name_zh = '錢幣王后', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 13;
UPDATE wasteland_cards SET standard_tarot_name = 'King of Pentacles', standard_tarot_name_zh = '錢幣國王', standard_suit = 'Pentacles' WHERE suit = 'bottle_caps' AND number = 14;

-- Wands (Radiation Rods) - Number cards (1-10)
UPDATE wasteland_cards SET standard_tarot_name = 'Ace of Wands', standard_tarot_name_zh = '權杖王牌', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 1;
UPDATE wasteland_cards SET standard_tarot_name = 'Two of Wands', standard_tarot_name_zh = '權杖二', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 2;
UPDATE wasteland_cards SET standard_tarot_name = 'Three of Wands', standard_tarot_name_zh = '權杖三', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 3;
UPDATE wasteland_cards SET standard_tarot_name = 'Four of Wands', standard_tarot_name_zh = '權杖四', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 4;
UPDATE wasteland_cards SET standard_tarot_name = 'Five of Wands', standard_tarot_name_zh = '權杖五', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 5;
UPDATE wasteland_cards SET standard_tarot_name = 'Six of Wands', standard_tarot_name_zh = '權杖六', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 6;
UPDATE wasteland_cards SET standard_tarot_name = 'Seven of Wands', standard_tarot_name_zh = '權杖七', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 7;
UPDATE wasteland_cards SET standard_tarot_name = 'Eight of Wands', standard_tarot_name_zh = '權杖八', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 8;
UPDATE wasteland_cards SET standard_tarot_name = 'Nine of Wands', standard_tarot_name_zh = '權杖九', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 9;
UPDATE wasteland_cards SET standard_tarot_name = 'Ten of Wands', standard_tarot_name_zh = '權杖十', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 10;

-- Wands - Court cards (11-14)
UPDATE wasteland_cards SET standard_tarot_name = 'Page of Wands', standard_tarot_name_zh = '權杖侍者', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 11;
UPDATE wasteland_cards SET standard_tarot_name = 'Knight of Wands', standard_tarot_name_zh = '權杖騎士', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 12;
UPDATE wasteland_cards SET standard_tarot_name = 'Queen of Wands', standard_tarot_name_zh = '權杖王后', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 13;
UPDATE wasteland_cards SET standard_tarot_name = 'King of Wands', standard_tarot_name_zh = '權杖國王', standard_suit = 'Wands' WHERE suit = 'radiation_rods' AND number = 14;

-- Verify results
SELECT 
    name,
    suit,
    number,
    standard_tarot_name_zh,
    standard_tarot_name,
    standard_suit
FROM wasteland_cards
ORDER BY 
    CASE suit 
        WHEN 'major_arcana' THEN 0
        WHEN 'nuka_cola_bottles' THEN 1
        WHEN 'combat_weapons' THEN 2
        WHEN 'bottle_caps' THEN 3
        WHEN 'radiation_rods' THEN 4
    END,
    number
LIMIT 10;
