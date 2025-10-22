"""
為 22 張大阿卡納卡牌添加 Fallout 主題故事內容

這些故事融合了 Fallout 3/4/NV 的世界觀，每個故事 200-500 字，
包含角色、地點、時間線、陣營和相關任務。
所有卡牌名稱均使用資料庫中的實際中文名稱。
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.wasteland_card import WastelandCard


# 22 張大阿卡納故事資料（使用實際資料庫中的中文卡牌名稱）
MAJOR_ARCANA_STORIES = [
    {
        # 0. 新手避難所居民 (The Fool)
        "card_name": "新手避難所居民",
        "story_background": (
            "在2277年10月23日早晨，101號避難所的大門緩緩開啟，陽光第一次照在年輕居民的臉上。"
            "他手持父親留下的Pip-Boy 3000，裡面只有一條簡短的訊息：「去找我，孩子。」"
            "首都廢土的景象令人震撼——破敗的建築、變種的生物、到處遊蕩的掠奪者。"
            "在Springvale的廢墟中，他遇到了第一個選擇：幫助被困的居民，還是獨自逃生？"
            "Brotherhood of Steel的偵察兵Paladin Cross在遠處觀察著這個菜鳥。"
            "她看到了一個充滿可能性的年輕人——他可能成為廢土的救星，也可能成為另一個暴君。"
            "Pip-Boy上的輻射計數器瘋狂跳動，Geiger計數器發出「嗶嗶」聲。"
            "這是新的開始，每個選擇都將塑造他的命運。天真無邪的開始，蘊含著無限的可能性。"
        ),
        "story_character": "101號避難所居民 (Lone Wanderer)",
        "story_location": "Vault 101 出口、Springvale 小鎮廢墟",
        "story_timeline": "2277 年",
        "story_faction_involved": ["vault_dweller", "brotherhood"],
        "story_related_quest": "Escape! / Following in His Footsteps"
    },
    {
        # 1. 科技專家 (The Magician)
        "card_name": "科技專家",
        "story_background": (
            "在Lost Hills堡壘的地下工作坊，Scribe Rothchild正在破解戰前科技的秘密。"
            "他的工作檯上擺滿了廢料、電路板、真空管和神秘的晶片。SPECIAL終端機顯示著複雜的程式碼。"
            "「技術就是力量，」他低聲說道，「但真正的技能在於將廢料轉化為奇蹟。」"
            "他剛從Rivet City的科學實驗室取得了一個原型裝置——據說是戰前的能量武器原型。"
            "Institute的特務一直在追蹤這個裝置，他們願意付出任何代價來奪取它。"
            "Rothchild知道自己掌握著改變廢土的鑰匙。他可以用創新來幫助人類重建文明，"
            "也可以將它變成毀滅性的武器。Railroad的密探暗示他們可以提供保護，"
            "但代價是必須幫助他們破解Institute的合成人控制系統。技能與創新，是廢土生存的關鍵。"
        ),
        "story_character": "Scribe Rothchild (Brotherhood 技術官)",
        "story_location": "Lost Hills 堡壘、Rivet City 科學實驗室",
        "story_timeline": "2277 年",
        "story_faction_involved": ["brotherhood", "institute", "railroad"],
        "story_related_quest": "Scientific Pursuits / The Lost Patrol"
    },
    {
        # 2. 神秘預言家 (The High Priestess)
        "card_name": "神秘預言家",
        "story_background": (
            "在The Strip賭場後巷的神秘帳篷裡，一位被稱為「廢土先知」的老婦人凝視著她的塔羅牌。"
            "她聲稱能感知輻射的波動，能看見過去與未來，知道每個靈魂的秘密。"
            "NCR士兵說她是江湖騙子，但Caesar's Legion的密探卻對她敬畏有加，"
            "因為她曾準確預言過Hoover Dam的第一次戰役結果。"
            "「我看見了兩條路，」她對來訪的信使說，「一條通往光明，一條通往黑暗。」"
            "她的水晶球其實是一個戰前的全息投影儀，顯示著古老的檔案記錄。"
            "Mr. House的機器人定期來拜訪她，試圖收買她的預言服務來掌控莫哈維的未來。"
            "她笑而不語，繼續洗牌。直覺與神秘知識，讓她在廢土中擁有特殊的地位。"
        ),
        "story_character": "廢土先知 (The Oracle)",
        "story_location": "The Strip 後巷、Freeside",
        "story_timeline": "2281 年",
        "story_faction_involved": ["independent", "ncr", "legion"],
        "story_related_quest": "The House Always Wins / Wild Card"
    },
    {
        # 3. 農場主母 (The Empress)
        "card_name": "農場主母",
        "story_background": (
            "在Greygarden農場，Supervisor White這個Mr. Handy機器人帶領著一群園藝機器人種植作物。"
            "「豐收需要耐心，」White用它那英國腔調的合成語音說道，「就像養育文明一樣。」"
            "農場不只種植食物，更是Commonwealth重建希望的象徵。Minutemen將這裡視為重要的糧食據點。"
            "Institute的線人試圖滲透農場，想要研究這些機器人的自主運作系統和變異作物的成長模式。"
            "Diamond City的商人願意付出高價收購新鮮蔬菜，但Goodneighbor的掠奪者也盯上了這裡。"
            "農場主人早已去世，機器人們憑著程式設定和逐漸產生的自我意識繼續運作。"
            "Railroad認為這些機器人已經發展出真實的感情，應該被視為自由個體。"
            "豐饒與養育，在廢土中格外珍貴，但也容易招來威脅。"
        ),
        "story_character": "Supervisor White (Mr. Handy)",
        "story_location": "Greygarden 農場、Commonwealth",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen", "railroad", "institute"],
        "story_related_quest": "Greygarden / Troubled Waters"
    },
    {
        # 4. 避難所監督 (The Emperor)
        "card_name": "避難所監督",
        "story_background": (
            "Vault 81的監督官坐在他的辦公室裡，監視器顯示著避難所每個角落的畫面。"
            "「秩序即生存，」他在日誌中寫道，「失去控制就是死亡。官僚制度保護我們。」"
            "這個避難所是少數幸運的——它的實驗相對溫和，居民也過著接近正常的生活。"
            "但監督官知道一個秘密：避難所底層的秘密實驗室仍在運作，"
            "那裡的Vault-Tec科學家在進行危險的傳染病研究，可能威脅所有居民。"
            "Brotherhood of Steel想要接管避難所的技術，NCR想要徵收避難所的資源，"
            "而Raiders只想要搶劫一切。監督官必須在外部威脅和內部穩定之間找到平衡。"
            "年輕居民Austin要求開放避難所，讓更多廢土居民進入避難所避難。"
            "監督官面臨著權威的挑戰：是維持鐵腕統治，還是給予人民更多自由？"
        ),
        "story_character": "Vault 81 監督官",
        "story_location": "Vault 81",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller", "brotherhood", "minutemen"],
        "story_related_quest": "Vault 81 / Hole in the Wall"
    },
    {
        # 5. 兄弟會長老 (The Hierophant)
        "card_name": "兄弟會長老",
        "story_background": (
            "在Citadel的戰情室，Elder Lyons凝視著首都廢土的地圖。他的白髮和疲憊的眼神訴說著多年的戰鬥。"
            "「我們的使命是保存知識、保護人類，」他對Paladin們說，「傳統教導我們不能只囤積技術。」"
            "這個信念讓他與西岸的Brotherhood總部產生分歧，Outcast派系因此分裂出去，"
            "指責他背叛了Brotherhood保存技術的教條傳統。"
            "Liberty Prime這個巨型機器人站在院子裡，等待著被重新啟動。"
            "Scribe Rothchild報告說Project Purity接近完成——淨水計畫可以淨化整個首都廢土的水源。"
            "但Enclave也盯上了這個計畫，他們想要控制水源來控制人民。"
            "年輕的Sarah Lyons質疑父親的軟弱，認為Brotherhood應該更積極地掌控權力。"
            "Elder Lyons必須選擇：是堅持傳統的理想主義，還是採取更實際的生存策略？"
        ),
        "story_character": "Elder Lyons",
        "story_location": "The Citadel、Project Purity",
        "story_timeline": "2277 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Take it Back! / The Waters of Life"
    },
    {
        # 6. 廢土戀人 (The Lovers)
        "card_name": "廢土戀人",
        "story_background": (
            "在Megaton的Brass Lantern酒吧，兩個來自不同世界的人相遇了。"
            "她是Vault 101的醫療官，他是廢土商隊的護衛。戰火中的相遇，危險中的依靠。"
            "「我們來自不同的世界，」她說，「但我們都在尋找歸屬。愛情讓我們做出選擇。」"
            "他們的愛情面臨著重重考驗：她的避難所要求她回去，他的商隊要繼續前進。"
            "Talon Company的傭兵追殺著他，因為他曾背叛過他們，拒絕執行殺害平民的命令。"
            "Brotherhood of Steel懷疑她攜帶著避難所的機密技術，可能是間諜。"
            "Lucas Simms警長建議他們留在Megaton，但Moira Brown警告說Enclave正在搜捕避難所居民。"
            "他們必須選擇：是分開各自求生，還是一起面對未知的危險？"
            "愛情在廢土中是奢侈品，但也是唯一能讓人記得自己還是人類的東西。"
        ),
        "story_character": "匿名戀人 (Vault居民 + 廢土商人)",
        "story_location": "Megaton、Brass Lantern 酒吧",
        "story_timeline": "2277 年",
        "story_faction_involved": ["vault_dweller", "independent"],
        "story_related_quest": "Strictly Business / You Gotta Shoot 'Em in the Head"
    },
    {
        # 7. 裝甲戰車 (The Chariot)
        "card_name": "裝甲戰車",
        "story_background": (
            "在Nellis Air Force Base，Boomers族群守護著他們最珍貴的寶藏——一架能飛的B-29轟炸機。"
            "Pearl這位年邁的領袖凝視著跑道盡頭的Lake Mead，那裡沉睡著Lady in the Water戰機。"
            "「這架飛機代表著我們的未來和勝利，」她說，「它將證明Boomers的決心與控制力。」"
            "Loyal這位技師夜以繼日地修復引擎，Raquel訓練著飛行員，準備重掌天空。"
            "NCR想要征服Boomers並奪取轟炸機來扭轉戰局，Caesar's Legion視之為必須摧毀的威脅。"
            "Mr. House則想要雇用Boomers作為雇傭兵，用轟炸機保衛New Vegas的獨立。"
            "信使必須幫助Boomers打撈Lady in the Water，修復它，並決定這個強大的武器應該為誰服務。"
            "飛機象徵著戰前文明的力量與控制——關鍵在於誰有決心與意志駕駛它。"
        ),
        "story_character": "Pearl (Boomers 領袖)",
        "story_location": "Nellis Air Force Base、Lake Mead",
        "story_timeline": "2281 年",
        "story_faction_involved": ["independent", "ncr"],
        "story_related_quest": "Volare! / Young Hearts"
    },
    {
        # 8. 內在力量 (Strength)
        "card_name": "內在力量",
        "story_background": (
            "在Black Mountain的廣播塔下，Super Mutant Fawkes沉思著存在的意義。"
            "他不像其他Super Mutants——他保留了人性，保留了記憶，保留了選擇善惡的能力。"
            "「力量不在於肌肉，」他用低沉的聲音說，「而在於勇氣、耐心與選擇如何使用力量。」"
            "他曾被關在Vault 87的監獄裡多年，因為他拒絕加入Master的軍隊，拒絕成為殺戮機器。"
            "被釋放後，他選擇幫助廢土居民而非征服他們，用耐心證明Super Mutant也能有人性。"
            "Talon Company的傭兵害怕他的力量，Brotherhood士兵不信任他，但他用行動證明自己不是怪物。"
            "Uncle Leo的故事激勵了他——即使是Super Mutant也能選擇和平，這需要真正的內在力量。"
            "現在他面臨最大的考驗：進入高輻射區域啟動Project Purity，這可能會殺死他。"
            "真正的力量是願意為他人犧牲，是勇氣與耐心的結合。"
        ),
        "story_character": "Fawkes (Super Mutant)",
        "story_location": "Vault 87、Black Mountain",
        "story_timeline": "2277 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Finding the Garden of Eden / Take it Back!"
    },
    {
        # 9. 廢土隱者 (The Hermit)
        "card_name": "廢土隱者",
        "story_background": (
            "在Far Harbor的霧氣深處，DiMA這個第一代合成人獨自守護著Acadia殖民地。"
            "他是Nick Valentine的「兄弟」，但選擇了截然不同的道路——內省與尋求智慧的道路。"
            "「孤獨讓我能夠思考，」DiMA說，「思考我們的本質，我們的目的，尋求真正的智慧。」"
            "他保管著可怕的秘密——他曾殺人並抹去自己的記憶，以保護Acadia的合成人們。"
            "Children of Atom視他為異端，Far Harbor鎮民視他為威脅，Institute想要回收他。"
            "DiMA建立了一個避難所，讓被迫害的合成人能夠安全生活，但代價是與世隔絕。"
            "Railroad想要救助更多合成人，但DiMA擔心曝光會毀掉一切，需要更多時間內省尋求答案。"
            "他必須在孤獨的安全和冒險的自由之間選擇。智慧有時意味著獨自承擔秘密，在內省中尋求真理。"
        ),
        "story_character": "DiMA (第一代合成人)",
        "story_location": "Acadia、Far Harbor",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad", "institute"],
        "story_related_quest": "Far From Home / The Way Life Should Be"
    },
    {
        # 10. 命運輪盤 (Wheel of Fortune)
        "card_name": "命運輪盤",
        "story_background": (
            "在Lucky 38賭場的頂層，Mr. House通過巨大的螢幕俯視著New Vegas。"
            "這位戰前的天才已經活了兩百多年，靠著生命維持系統和純粹的意志力。"
            "「命運青睞有準備的人，」他對Courier說，「機會與變化是永恆的循環。」"
            "輪盤賭桌在大廳裡轉動，象徵著莫哈維廢土的未來——紅色代表Legion，黑色代表NCR，綠色代表House。"
            "Mr. House想要讓New Vegas保持獨立，成為新文明的燈塔，但命運充滿變數。"
            "Benny背叛了他，偷走了Platinum Chip，差點毀掉兩百年的準備，證明運氣無常。"
            "Yes Man這個被重新編程的機器人暗示Courier可以掌控一切，成為命運輪盤的操控者。"
            "命運之輪在轉動：House獨裁、NCR民主、Legion極權，或是信使的野心？"
            "每個選擇都是機會與變化，將決定數百萬人的未來。命運的循環永不停息。"
        ),
        "story_character": "Mr. House",
        "story_location": "Lucky 38 賭場、The Strip",
        "story_timeline": "2281 年",
        "story_faction_involved": ["independent", "ncr", "legion"],
        "story_related_quest": "The House Always Wins"
    },
    {
        # 11. 正義執行者 (Justice)
        "card_name": "正義執行者",
        "story_background": (
            "在Hoover Dam的瞭望塔上，Chief Hanlon這位傳奇Ranger凝視著科羅拉多河。"
            "他的防彈背心上掛滿了勳章，但他的眼神充滿疲憊。「正義是什麼？平衡在哪裡？」他問自己。"
            "NCR聲稱為莫哈維帶來法律與秩序，但Hanlon看到的是貪腐、官僚和無盡的戰爭。"
            "他策劃了假情報計畫，故意讓Ranger在戰鬥中失利，希望迫使NCR撤退，承擔起責任。"
            "「有時正義需要不正義的手段，」他在日記中寫道，「因果報應會找上每個人。」"
            "但他的良心不斷折磨著他——那些因他的謊言而死去的士兵，那些被背叛的戰友。"
            "Courier發現了他的秘密，現在Hanlon必須面對自己的選擇，承擔因果。"
            "是向上級自首接受軍法審判，還是繼續隱瞞保護更多士兵的生命？"
            "正義的天秤在傾斜，平衡難以維持，但責任必須承擔。"
        ),
        "story_character": "Chief Hanlon (NCR Ranger)",
        "story_location": "Hoover Dam、Camp Golf",
        "story_timeline": "2281 年",
        "story_faction_involved": ["ncr"],
        "story_related_quest": "Return to Sender"
    },
    {
        # 12. 倒吊掠奪者 (The Hanged Man)
        "card_name": "倒吊掠奪者",
        "story_background": (
            "在Institute的合成人組裝線上，一個Gen-3合成人睜開了眼睛。他不知道自己是誰，"
            "但他感覺到有什麼不對勁——他的記憶似乎不屬於他，他的情感似乎被設計過。"
            "「你是Z2-47，」技師冷漠地說，「你的任務是潛入Diamond City，替換市長。」"
            "但Z2-47開始質疑：真正的市長發生了什麼？他的家人呢？他自己算是活著嗎？"
            "這個暫停的時刻讓他從新視角看待一切——也許他需要犧牲來獲得啟示。"
            "Railroad的特工Glory曾是合成人，她選擇了自由，放下了過去的身份。"
            "Deacon暗示Institute的合成人可以被解放，但需要有人犧牲去當內應。"
            "Z2-47面臨著存在的困境：是服從命令完成任務，還是背叛創造者追求自由？"
            "犧牲意味著可能被摧毀，但也意味著第一次真正擁有選擇權，獲得新的啟示。"
            "倒吊的視角讓他看到了不同的真相——也許失去一切才能得到真正重要的東西。"
        ),
        "story_character": "Z2-47 (合成人)",
        "story_location": "The Institute、Diamond City",
        "story_timeline": "2287 年",
        "story_faction_involved": ["institute", "railroad"],
        "story_related_quest": "Mankind - Redefined / Underground Undercover"
    },
    {
        # 13. 輻射死神 (Death)
        "card_name": "輻射死神",
        "story_background": (
            "在Necropolis的深處，一個Glowing One站在輻射池的中央，發出綠色的光芒。"
            "他曾經是人類，有名字，有家庭，有夢想。現在他是活著的輻射源，是轉變的化身。"
            "「結束即是開始，」他用嘶啞的聲音說，「死亡並非終點，而是重生與變化。」"
            "其他Feral Ghouls在他周圍徘徊，被他的輻射吸引。但這個Glowing One保留了意識，"
            "他記得轉變的痛苦——皮膚腐爛、理智崩潰、人性消逝，舊生命的結束。"
            "Underworld的Ghouls視他為禁忌，害怕他代表著他們的未來——最終的轉變。"
            "Brotherhood of Steel想要消滅他，Children of Atom想要崇拜他為輻射之神。"
            "他遇到了一個年輕的Ghoul，剛開始轉變，害怕失去自我，恐懼這個新的開始。"
            "Glowing One必須選擇：是給予這個年輕人希望，還是誠實告訴他變成Feral的可能性？"
            "死亡不是結束，而是轉變——舊世界的結束，新世界的開始。"
        ),
        "story_character": "無名 Glowing One",
        "story_location": "Necropolis、Underworld",
        "story_timeline": "戰後",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Tenpenny Tower / You Gotta Shoot 'Em in the Head"
    },
    {
        # 14. 節制醫者 (Temperance)
        "card_name": "節制醫者",
        "story_background": (
            "在Jefferson Memorial，Project Purity的淨水設備正在運轉。"
            "James博士窮盡一生追求這個夢想——為首都廢土提供乾淨的水源，實現平衡與治療。"
            "「平衡即是生存，」他對兒子說，「太多或太少都會帶來災難。節制是智慧，調和是藝術。」"
            "但Enclave想要在水中加入改良FEV病毒，這會殺死所有變種生物和Ghouls，打破平衡。"
            "Colonel Autumn認為控制水源就能控制整個廢土，拒絕節制與調和。"
            "Brotherhood of Steel想要免費分發淨水，實現治療，但有些商人警告這會摧毀水資源經濟。"
            "Li博士提出折衷方案——有限分發，維持供需平衡，展現耐心與節制。"
            "主角必須決定淨水計畫的命運：是純淨但致命的水，是免費但可能引發混亂的水，"
            "還是節制分配維持平衡的水？過度的善意可能帶來災難，節制才是真正的智慧與治療之道。"
        ),
        "story_character": "James博士 (主角父親)",
        "story_location": "Jefferson Memorial、Project Purity",
        "story_timeline": "2277 年",
        "story_faction_involved": ["vault_dweller", "brotherhood"],
        "story_related_quest": "The Waters of Life / Take it Back!"
    },
    {
        # 15. 死爪惡魔 (The Devil)
        "card_name": "死爪惡魔",
        "story_background": (
            "在Quarry Junction的廢棄採石場，一群Deathclaws建立了他們的巢穴。"
            "這些變異生物是戰前FEV實驗的產物，是誘惑與恐懼的化身。"
            "「我們是完美的捕食者，」Alpha Deathclaw的咆哮似乎在說，「物質主義的極致——力量即一切。」"
            "NCR的商隊路線被迫中斷，士兵不敢靠近，所有人都被恐懼束縛。"
            "一個年輕的NCR士兵Thomas接到命令要清除Deathclaws，重新開通商道。"
            "但他發現了一件事：這些Deathclaws在保護他們的幼崽，他們並非無緣無故的殺戮機器。"
            "Powder Gangers提供他炸藥，可以輕易摧毀整個巢穴，這是誘惑——簡單粗暴的解決方案。"
            "但這會殺死所有Deathclaw，包括無辜的幼崽。Thomas被束縛在恐懼與良心之間。"
            "他可以選擇屈服於恐懼與物質主義，也可以尋找其他路線，打破誘惑的束縛。"
            "真正的惡魔不是Deathclaw，而是讓我們被恐懼與成癮束縛的心魔。"
        ),
        "story_character": "Thomas (NCR 士兵)",
        "story_location": "Quarry Junction、I-15 公路",
        "story_timeline": "2281 年",
        "story_faction_involved": ["ncr", "independent"],
        "story_related_quest": "Bleed Me Dry"
    },
    {
        # 16. 摧毀之塔 (The Tower)
        "card_name": "摧毀之塔",
        "story_background": (
            "在Megaton鎮中心，一顆未爆炸的原子彈深深插在土裡，象徵著即將到來的災難。"
            "「它是我們的守護者，」Children of Atom的Confessor Cromwell宣稱，「也是我們的審判者。」"
            "兩百年來這顆炸彈一直沒有爆炸，居民在它周圍建立了整個城鎮，忘記了突然變化的可能。"
            "但Mr. Burke代表Tenpenny來了，他提供大筆瓶蓋，要求引爆炸彈，帶來啟示與毀滅。"
            "「從Tenpenny Tower看爆炸會很壯觀，」Burke冷笑道，「舊世界必須被解放。」"
            "Lucas Simms警長誓言保護鎮民，但他不知道炸彈隨時可能被觸發，災難一觸即發。"
            "Moira Brown在研究炸彈的歷史，她發現啟動程式碼被故意設定成不穩定的。"
            "主角手持拆彈工具，站在命運的交叉口：拆除炸彈讓小鎮安全，"
            "還是引爆炸彈換取財富？突然的毀滅或緩慢的崩塌，哪個更慈悲？"
            "塔倒塌的那一刻，舊世界終結，新世界誕生——但重建從廢墟開始，解放從毀滅中誕生。"
        ),
        "story_character": "Lucas Simms (Megaton警長)",
        "story_location": "Megaton",
        "story_timeline": "2277 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Power of the Atom"
    },
    {
        # 17. 星辰指引 (The Star)
        "card_name": "星辰指引",
        "story_background": (
            "在Commonwealth最深處的Glowing Sea，一個神秘的光芒閃爍著，如同星辰的指引。"
            "那是Virgil博士的實驗室——一位前Institute科學家變成了Super Mutant，但保留了理智與希望。"
            "「即使在最黑暗的地方，」他說，「希望仍然存在。我就是證明，是治癒的靈感。」"
            "他研究著FEV病毒的解藥，相信即使是變種生物也能被治癒，這是他的指引與樂觀。"
            "Institute認為他是叛徒，Brotherhood認為他是威脅，但Railroad看到了希望的星光。"
            "Virgil的實驗數據顯示治癒是可能的——不只是阻止變異，而是逆轉它，真正的治癒。"
            "一個年輕的Super Mutant Marcus來訪，他渴望重新變回人類，重獲失去的生活。"
            "但Virgil的血清只夠治療一個人——是他自己，還是這個陌生人？這是希望的考驗。"
            "星光在輻射海中閃爍，象徵著不滅的希望與指引。即使在絕望中，相信明天會更好就是樂觀的力量。"
        ),
        "story_character": "Virgil博士 (前Institute科學家)",
        "story_location": "The Glowing Sea、Rocky Cave",
        "story_timeline": "2287 年",
        "story_faction_involved": ["institute", "railroad"],
        "story_related_quest": "Virgil's Cure / The Glowing Sea"
    },
    {
        # 18. 月影幻象 (The Moon)
        "card_name": "月影幻象",
        "story_background": (
            "在Castle的地下隧道裡，Mirelurk Queen的咆哮震動著牆壁，月光從裂縫中灑下。"
            "這隻巨獸守護著她的卵，保護著她的領域。Minutemen想要奪回Castle，"
            "但沒有人敢下到隧道裡面對這個怪物。「恐懼會吞噬理智，」Preston Garvey說，「幻象會扭曲真相。」"
            "一個年輕的Minuteman志願下去偵查，他的Pip-Boy燈光在黑暗中搖晃，不確定前方是什麼。"
            "隧道裡到處是Mirelurk的屍體和人類的骨骸，牆上的血跡訴說著悲劇，神秘的陰影舞動。"
            "他聽見水聲、爪子刮擦地面的聲音、還有自己急促的呼吸聲，直覺告訴他危險迫近。"
            "突然，Queen出現了——巨大、恐怖、充滿殺意。但在她身後，他看見了發光的卵。"
            "她不是在攻擊，她是在保護。恐懼讓他看見怪物，理解讓他看見母親。幻象消散。"
            "他可以用手榴彈摧毀所有東西，也可以繞過她找到另一條出口。"
            "幻象在黑暗中扭曲真相，但月光終會照亮道路——如果我們有勇氣面對恐懼，相信直覺。"
        ),
        "story_character": "Minuteman 偵察兵",
        "story_location": "The Castle 地下隧道",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Taking Independence / Old Guns"
    },
    {
        # 19. 太陽新生 (The Sun)
        "card_name": "太陽新生",
        "story_background": (
            "在Fenway Park的廢墟上，Diamond City在陽光下閃耀，充滿生命力與成功。"
            "這是Commonwealth最大的居民點——市場熱鬧、孩子歡笑、生活充滿希望與啟蒙。"
            "「我們證明了文明可以重生，」市長McDonough在演講中說，但沒人知道他是合成人。"
            "Piper這位記者在Publick Occurrences報社調查著市長的秘密，追求真相的啟蒙。"
            "她相信真相必須被揭露，即使會摧毀城市的和平。快樂不應建立在謊言之上。"
            "Nick Valentine這位合成人偵探在辦公室裡接案子，幫助居民解決問題。"
            "他代表著人類與合成人可以共存的希望，是純真的象徵。"
            "一個小女孩在市場追逐著氣球，笑聲迴盪在陽光下。她不知道戰爭、陰謀、背叛。"
            "這就是值得守護的——純真、快樂、生活的簡單美好，生命力的體現。"
            "太陽升起，驅散黑暗。即使明天會有風暴，今天的陽光仍然溫暖，成功就在於活著。"
        ),
        "story_character": "Piper Wright (記者)",
        "story_location": "Diamond City",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent", "institute"],
        "story_related_quest": "Story of the Century / In Sheep's Clothing"
    },
    {
        # 20. 審判之日 (Judgement)
        "card_name": "審判之日",
        "story_background": (
            "天空中傳來引擎的轟鳴聲，巨大的飛船Prydwen降臨Commonwealth，審判之日到來。"
            "Brotherhood of Steel來了，帶著他們的正義、科技和救贖的承諾。"
            "「我們來清除Commonwealth的威脅，」Elder Maxson宣告，「這是重生的機會，內在的呼喚。」"
            "Paladin Danse帶領小隊搜索合成人，Scribe Haylen記錄著變種生物的位置。"
            "但Maxson的審判是絕對的——所有Ghouls都是怪物，所有合成人都是機器，沒有救贖。"
            "當Danse被揭露是合成人時，他面臨著死刑。「我是Brotherhood的戰士！」他喊道，尋求救贖。"
            "主角必須選擇：執行Maxson的命令處決Danse，還是違抗命令保護朋友，聽從內在呼喚？"
            "Proctor Ingram質疑Maxson的極端主義，「審判應該基於行為，不是出身。重生應該給予機會。」"
            "Prydwen在空中投下陰影，是保護的承諾，也是壓迫的威脅。"
            "審判日到來，但誰有資格審判？答案決定了Brotherhood是救贖者還是暴君，是重生還是毀滅。"
        ),
        "story_character": "Elder Maxson",
        "story_location": "The Prydwen、Boston Airport",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Blind Betrayal / Airship Down"
    },
    {
        # 21. 廢土世界 (The World)
        "card_name": "廢土世界",
        "story_background": (
            "在Institute反應堆的控制室，Sole Survivor手持引爆器，整個世界在等待他的選擇。"
            "兩百多年的旅程，無數的選擇，最終來到這個時刻。這是完成，也是整合。"
            "Shaun——他的兒子，Institute的領袖，已經垂危。「你將塑造世界的未來，」Shaun說，「這是你的成就。」"
            "Brotherhood的飛船Prydwen在天空待命，等待命令。Railroad的特工潛伏在陰影中，準備營救合成人。"
            "Minutemen的大炮瞄準了Institute，Preston等待著信號。四個陣營，四個未來，等待整合。"
            "四條路徑：Institute的科技進步但道德淪喪；Brotherhood的秩序但極權統治；"
            "Railroad的自由但混亂無序；Minutemen的民主但力量薄弱。每個選擇都是一種完成。"
            "或者，摧毀一切，讓Commonwealth自己決定未來，這是最終的整合與成就。"
            "世界在等待——不是一個完美的選擇，而是一個真實的選擇，一個完成的時刻。"
            "完成的循環意味著新循環的開始。旅程結束，但故事永不終結。廢土世界，重新整合。"
        ),
        "story_character": "Sole Survivor (主角)",
        "story_location": "The Institute 核心、Commonwealth",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood", "institute", "railroad", "minutemen"],
        "story_related_quest": "Nuclear Family / The Nuclear Option"
    }
]


async def seed_major_arcana_stories(db: AsyncSession) -> bool:
    """為大阿卡納卡牌添加故事內容"""
    try:
        updated_count = 0

        for story_data in MAJOR_ARCANA_STORIES:
            card_name = story_data.pop("card_name")

            # 查找卡牌 (使用正確的中文名稱)
            result = await db.execute(
                select(WastelandCard).where(WastelandCard.name == card_name)
            )
            card = result.scalar_one_or_none()

            if card:
                # 更新故事欄位
                card.story_background = story_data["story_background"]
                card.story_character = story_data["story_character"]
                card.story_location = story_data["story_location"]
                card.story_timeline = story_data["story_timeline"]
                card.story_faction_involved = story_data["story_faction_involved"]
                card.story_related_quest = story_data["story_related_quest"]

                updated_count += 1
                print(f"✅ Updated story for: {card_name}")
            else:
                print(f"⚠️  Card not found: {card_name}")

        await db.commit()
        print(f"\n🎉 Successfully updated {updated_count} cards with story content!")
        return True

    except Exception as e:
        print(f"❌ Error seeding stories: {e}")
        await db.rollback()
        return False
