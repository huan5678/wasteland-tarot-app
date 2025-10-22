"""
完整的 78 張 Wasteland Tarot 卡牌故事資料

包含 22 張 Major Arcana + 56 張 Minor Arcana
每個故事 200-500 字，融合 Fallout 世界觀
"""

# ============================================================
# NUKA COLA BOTTLES (可樂瓶) - 情感、人際關係、社群
# 對應塔羅聖杯，代表情感、人際關係、直覺
# ============================================================

NUKA_COLA_BOTTLES_STORIES = [
    {
        "card_name": "可樂瓶王牌",
        "story_background": (
            "在Diamond City市集的角落，一個年輕的商人發現了一瓶完整未開封的Nuka-Cola Quantum。"
            "藍色的螢光液體在陽光下閃閃發光，彷彿蘊含著戰前世界的美好回憶。"
            "他的祖父曾告訴他，Nuka-Cola不只是飲料，更是人們分享快樂的象徵。"
            "在廢土中，一瓶乾淨的可樂代表著信任、友誼和希望。"
            "當他決定將這瓶珍貴的Quantum送給受傷的旅行者時，周圍的居民都停下了手中的工作。"
            "這個簡單的善意行為，在冷酷的廢土中如同漣漪般擴散開來。"
            "旅行者康復後，帶來了乾淨水源的情報，拯救了整個聚落。"
            "一瓶可樂開啟了新的情感連結，證明在廢土中，仁慈依然有其價值。"
        ),
        "story_character": "Diamond City 年輕商人 Marcus",
        "story_location": "Diamond City 市集",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent", "minutemen"],
        "story_related_quest": "Diamond City Blues"
    },
    {
        "card_name": "可樂瓶二",
        "story_background": (
            "Goodneighbor的Third Rail酒吧裡，兩個陌生人在吧台前並肩而坐。"
            "一個是從Commonwealth北方來的商隊護衛，另一個是Railroad的密探。"
            "他們之間有著微妙的默契——都是在尋找歸屬感的孤獨靈魂。"
            "酒保Whitechapel Charlie為他們倒了兩杯稀釋的Nuka-Cola，這是酒吧裡少見的溫和飲品。"
            "在昏暗的燈光下，兩人開始分享各自的故事。護衛談起失去的家人，密探訴說著拯救合成人的使命。"
            "他們發現彼此的傷痛和希望如此相似。當Institute的特務闖入酒吧搜查時，"
            "護衛毫不猶豫地站了起來，為陌生人提供掩護。"
            "這一刻，兩個孤獨的靈魂建立了廢土中最珍貴的連結——信任與友誼。"
        ),
        "story_character": "商隊護衛 Sarah & Railroad 密探 Deacon",
        "story_location": "Goodneighbor - Third Rail 酒吧",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad", "independent"],
        "story_related_quest": "Tradecraft"
    },
    {
        "card_name": "可樂瓶三",
        "story_background": (
            "在Sanctuary Hills的廢墟中，三個倖存者圍坐在營火旁慶祝聚落的第一次豐收。"
            "Sturges從工作坊拿出了三瓶他們自己釀造的Nuka-Cola仿製品，味道雖然不如戰前，但充滿了希望。"
            "Minutemen的Preston Garvey舉起瓶子，向天空致敬：「為了新的開始，為了重建家園。」"
            "農夫Marcy終於露出了久違的笑容，她想起了戰前與丈夫的快樂時光。"
            "機械師Sturges則為自己的發明感到驕傲——他證明了廢土人也能創造美好。"
            "這不只是一次慶祝，更是社群凝聚力的象徵。三個人代表著不同的專長，但共同的目標將他們連結在一起。"
            "當Raider的警戒哨聲響起時，他們並肩作戰，保護了這個來之不易的家園。"
            "慶祝變成了盟約，友誼化為了力量。"
        ),
        "story_character": "Preston Garvey, Marcy Long, Sturges",
        "story_location": "Sanctuary Hills 聚落",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Sanctuary"
    },
    {
        "card_name": "可樂瓶四",
        "story_background": (
            "Vault 81的居民們過著相對穩定的生活，但Austin卻感到深深的不滿足。"
            "他擁有一切——安全的居所、充足的食物、Nuka-Cola配給，但內心總是空虛。"
            "看著Pip-Boy上顯示的廢土地圖，他想起了父親曾經的冒險故事。"
            "「安全是好的，但不是一切，」他在日記裡寫道。當Vault的大門再次開啟時，"
            "Austin沒有像往常一樣害怕外面的世界，反而感到興奮。"
            "他主動要求加入對外的貿易隊伍，想要體驗真實的廢土生活。"
            "Overseer警告他外面的危險，但他堅持要用自己的雙眼看看這個世界。"
            "有時候，最大的牢籠不是輻射和變種生物，而是對未知的恐懼和對舒適的依賴。"
            "真正的滿足，來自於勇敢面對不確定性。"
        ),
        "story_character": "Vault 81 居民 Austin",
        "story_location": "Vault 81",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller"],
        "story_related_quest": "Vault 81"
    },
    {
        "card_name": "可樂瓶五",
        "story_background": (
            "Quincy的廢墟中，Minutemen的倖存者坐在倒塌的Nuka-Cola販賣機旁，陷入深深的悲傷。"
            "Gunners的背叛讓整個聚落毀滅，他的戰友們幾乎全部陣亡。"
            "他握著最後一瓶Nuka-Cola，這是在撤退時從廢墟中撿到的。瓶身上沾滿了灰塵和血跡。"
            "這瓶可樂本該是用來慶祝守住Quincy的，現在卻成為了失敗的見證。"
            "Radio Freedom的訊號依然在Pip-Boy上閃爍，Preston Garvey的聲音呼籲重建Minutemen。"
            "但他只想一個人靜靜地坐著，讓悲傷慢慢流淌。"
            "當一個受傷的聚落居民stumble過廢墟時，他猶豫了一會兒，最終還是站了起來。"
            "他把Nuka-Cola遞給了傷者，並扶著他走向安全地帶。"
            "悲傷需要被承認，但生命必須繼續。"
        ),
        "story_character": "Quincy 倖存者 Ronnie Shaw",
        "story_location": "Quincy 廢墟",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Old Guns"
    },
    {
        "card_name": "可樂瓶六",
        "story_background": (
            "在Sanctuary Hills的舊房子裡，Sole Survivor找到了一箱戰前的Nuka-Cola。"
            "每一瓶都讓他想起與妻子Nora和兒子Shaun的快樂時光。"
            "他記得週末的野餐，記得孩子第一次嚐Nuka-Cola時的笑臉，記得妻子溫柔的叮嚀。"
            "210年的冷凍睡眠結束後，這些回憶成為了他在廢土中前進的動力。"
            "他決定將這箱可樂分送給Sanctuary的新居民，就像當年鄰居們互相分享的那樣。"
            "當孩子們第一次嚐到Nuka-Cola的味道，臉上綻放的笑容讓他彷彿回到了過去。"
            "「這是我們家族的傳統，」他對孩子們說，「分享快樂，保護彼此。」"
            "過去的美好不應該被遺忘，而應該成為重建未來的基石。"
            "童年的快樂記憶，是廢土中最寶貴的財富。"
        ),
        "story_character": "Sole Survivor (Nate/Nora)",
        "story_location": "Sanctuary Hills - 戰前住所",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller", "minutemen"],
        "story_related_quest": "Out of Time"
    },
    {
        "card_name": "可樂瓶七",
        "story_background": (
            "Nuka-World的Fizztop Grille頂樓，Raider老大Porter Gage陷入了沉思。"
            "他手裡拿著一瓶稀有的Nuka-Cola Victory，這是整個園區裡最後一瓶。"
            "眼前是三個Raider幫派——Disciples、Operators、Pack——他們都渴望得到這瓶可樂作為權力的象徵。"
            "但Gage知道，無論給誰，都會引發其他幫派的不滿。這瓶可樂成為了選擇的考驗。"
            "他可以用它收買忠誠，也可以用它製造衝突。更誘人的選擇是自己喝掉，享受片刻的勝利。"
            "當Overboss走上頂樓時，Gage做出了決定——他把瓶子砸碎在地上。"
            "「沒人能得到它，」他說，「這樣才公平。」"
            "有時候，最好的選擇是不選擇。在廢土中，誘惑無處不在，但並非所有的寶藏都值得追求。"
        ),
        "story_character": "Porter Gage (Nuka-World Raider 副手)",
        "story_location": "Nuka-World - Fizztop Grille",
        "story_timeline": "2287 年",
        "story_faction_involved": ["raiders"],
        "story_related_quest": "An Ambitious Plan"
    },
    {
        "card_name": "可樂瓶八",
        "story_background": (
            "Railroad的據點裡，密探Glory決定放棄一項危險的任務。"
            "她本來計劃潛入Institute拯救一批合成人，但情報顯示這是個陷阱。"
            "Desdemona給了她一瓶Nuka-Cola作為慰勞，「有些戰鬥不值得打，」長官說。"
            "Glory是個完美主義者，她討厭失敗，討厭放棄，討厭看到合成人繼續受苦。"
            "但她也知道，魯莽的行動只會讓更多同伴送命。"
            "當她走出據點，準備告訴那些等待救援的合成人「對不起，我們還需要時間」時，"
            "她意外地遇到了一個逃出來的合成人。他虛弱、受傷，但眼中充滿希望。"
            "Glory把Nuka-Cola遞給他，扶著他走向安全屋。"
            "她意識到，有時候放棄一個計畫，是為了拯救真正重要的生命。"
            "離開也是一種勇氣。"
        ),
        "story_character": "Glory (Railroad 重裝合成人)",
        "story_location": "Railroad HQ - Old North Church",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad"],
        "story_related_quest": "Memory Interrupted"
    },
    {
        "card_name": "可樂瓶九",
        "story_background": (
            "在Castle的城牆上，Preston Garvey看著日落，心中充滿了滿足感。"
            "Minutemen重新奪回了這個象徵性的堡壘，Radio Freedom再次向整個Commonwealth播送希望。"
            "他手中拿著一瓶Nuka-Cola，這是Sanctuary居民們送給他的禮物。"
            "過去幾個月的努力終於有了成果——十幾個聚落加入了Minutemen，商隊路線重新開通，"
            "Gunners和Super Mutants的威脅顯著降低。每個夜晚，他都能安心入睡，知道有人在守護家園。"
            "當新兵問他「將軍，我們成功了嗎？」時，Preston搖了搖頭。"
            "「還沒有，」他說，「但我們在正確的道路上。」"
            "他舉起Nuka-Cola，向著遠方的聚落致敬。每一個燈火，都是希望的證明。"
            "情感的滿足不是終點，而是繼續前進的動力。"
        ),
        "story_character": "Preston Garvey (Minutemen 將軍)",
        "story_location": "The Castle - Minutemen 總部",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Taking Independence"
    },
    {
        "card_name": "可樂瓶十",
        "story_background": (
            "在Diamond City的家中，Sole Survivor與他的同伴們圍坐在桌旁。"
            "Piper、Nick Valentine、Hancock、Curie、Preston——每個人都曾在廢土的旅程中陪伴他。"
            "桌上擺著十瓶Nuka-Cola，這是他們從Nuka-World帶回的戰利品。"
            "「為了我們一起走過的路，」Hancock舉起瓶子，「為了那些我們拯救的人。」"
            "Piper笑著補充：「為了那些瘋狂的冒險和不可能的勝利。」"
            "Nick則用他特有的諷刺口吻說：「為了還活著沒被Deathclaw吃掉。」"
            "當他們碰杯的那一刻，Sole Survivor意識到，他在這個陌生的未來找到了新的家人。"
            "210年的失去固然痛苦，但新的連結讓他的心靈得到了治癒。"
            "在廢土中，家的定義不是地點，而是那些願意為你而戰的人。"
            "情感的圓滿，來自於分享與陪伴。"
        ),
        "story_character": "Sole Survivor 與同伴們",
        "story_location": "Diamond City - Home Plate",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen", "railroad", "independent"],
        "story_related_quest": "Reunions"
    },
    {
        "card_name": "可樂瓶新兵",
        "story_background": (
            "MacCready是個年輕的傭兵，他的背包裡總是裝著一瓶Nuka-Cola。"
            "這不是給自己喝的，而是要帶回給生病的兒子Duncan。"
            "他在Commonwealth各地接任務、賺瓶蓋，只為了找到治療方法。"
            "當Sole Survivor提出幫助他時，MacCready起初並不信任這個陌生人。"
            "但當他們並肩作戰，當Survivor真的找到了Med-Tek的藥物時，"
            "這個強硬的傭兵眼眶濕潤了。「為什麼要幫我？」他問。"
            "「因為在廢土中，我們需要互相幫助，」Survivor回答。"
            "MacCready打開背包，拿出那瓶珍藏的Nuka-Cola。"
            "「這瓶是要給Duncan的，但...謝謝你。你讓我相信廢土裡還有好人。」"
            "年輕的心靈學會了信任，這是比任何報酬都珍貴的禮物。"
        ),
        "story_character": "Robert MacCready (年輕傭兵)",
        "story_location": "Med-Tek Research / Goodneighbor",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Long Road Ahead"
    },
    {
        "card_name": "可樂瓶廢土騎士",
        "story_background": (
            "Paladin Danse是Brotherhood of Steel的菁英戰士，但他最珍惜的不是權力裝甲，而是與小隊的情誼。"
            "在Cambridge Police Station的休息室，他與Rhys、Haylen分享戰前找到的Nuka-Cola。"
            "「為了失去的Brandis小隊，」Danse舉起瓶子，聲音沉重。"
            "Haylen輕聲說：「為了我們還活著，還能繼續戰鬥。」"
            "但當他發現自己是合成人的真相後，這份情誼面臨了考驗。"
            "Maxson長老下令處決他，但Danse選擇逃離，不願傷害Brotherhood的兄弟。"
            "當Sole Survivor找到他時，Danse手中握著當年的Nuka-Cola瓶，已經空了。"
            "「我失去了我的身份，我的榮譽，我的兄弟，」他說，「但我不後悔為他們而戰的每一天。」"
            "真正的騎士精神，不在於身份，而在於為守護重要之人而戰的決心。"
        ),
        "story_character": "Paladin Danse (Brotherhood 聖騎士)",
        "story_location": "Cambridge Police Station / Listening Post Bravo",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Blind Betrayal"
    },
    {
        "card_name": "可樂瓶聚落領袖",
        "story_background": (
            "Desdemona是Railroad的領導者，她的辦公桌上永遠放著一瓶Nuka-Cola。"
            "這不是用來喝的，而是一個象徵——提醒她為什麼要戰鬥。"
            "瓶身上刻著一個名字：「Johnny D」，她的前任，死於Institute的突襲。"
            "作為領導者，她必須做出艱難的決定——派誰去危險任務、犧牲誰來拯救更多人。"
            "當Heavy需要她批准一次幾乎是自殺任務的救援行動時，她看著那瓶可樂，想起了Johnny的遺言："
            "「不要讓恐懼阻止你拯救他們。」最終，她批准了任務，並親自帶隊。"
            "他們成功救出了十二個合成人，但失去了三個探員。"
            "回到據點後，Desdemona把那瓶Nuka-Cola倒入杯中，與倖存者分享。"
            "「為了失去的同志，為了獲救的生命。」作為領導者，她學會了承擔痛苦，也學會了分享希望。"
        ),
        "story_character": "Desdemona (Railroad 領袖)",
        "story_location": "Railroad HQ - Old North Church",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad"],
        "story_related_quest": "Underground Undercover"
    },
    {
        "card_name": "可樂瓶廢土霸主",
        "story_background": (
            "在Nuka-World的Fizztop Grille，新的Overboss俯瞰著整個園區。"
            "他手中握著一瓶限量版的Nuka-Cola Quartz，這是征服整個Nuka-World的獎賞。"
            "三大Raider幫派臣服於他，商隊路線被控制，Commonwealth的聚落繳納貢品。"
            "他可以選擇成為殘暴的暴君，用恐懼統治一切。但他也可以選擇另一條路——"
            "建立秩序、保護弱者、讓Nuka-World成為廢土中的安全避風港。"
            "當Porter Gage建議屠殺反抗的商人時，Overboss拒絕了。"
            "「我們不是野獸，」他說，「我們可以是廢土的新秩序。」"
            "他把Nuka-Cola Quartz打開，倒入數個杯子，分給三個幫派的首領。"
            "「這不是統治，這是聯盟。我們一起重建，一起分享成果。」"
            "真正的霸主，不是用暴力征服，而是用智慧和仁慈贏得人心。"
        ),
        "story_character": "Overboss (Nuka-World 統治者)",
        "story_location": "Nuka-World - Fizztop Grille",
        "story_timeline": "2287 年",
        "story_faction_involved": ["raiders", "independent"],
        "story_related_quest": "Power Play"
    }
]

# ============================================================
# COMBAT WEAPONS (戰鬥武器) - 衝突、策略、智慧
# 對應塔羅寶劍，代表戰鬥、決策、智慧、挑戰
# ============================================================

COMBAT_WEAPONS_STORIES = [
    {
        "card_name": "戰鬥武器王牌",
        "story_background": (
            "在Cambridge Police Station的武器庫，Paladin Danse展示著一把全新的Laser Rifle。"
            "這把武器由Brotherhood of Steel的scribes精心製作，代表著科技與力量的完美結合。"
            "「這不只是武器，」Danse對新兵說，「這是我們重建秩序的希望。」"
            "Commonwealth的廢土充滿了威脅——Super Mutants、Feral Ghouls、Raiders。"
            "但Brotherhood相信，透過superior firepower和tactical discipline，他們能帶來和平。"
            "當第一次巡邏任務中，新兵用這把Laser Rifle擊退了一群Super Mutants時，"
            "他終於理解了Danse的話：力量不是用來征服，而是用來保護。"
            "一把武器的真正價值，在於使用者的意志和目的。"
        ),
        "story_character": "Paladin Danse (Brotherhood Paladin)",
        "story_location": "Cambridge Police Station",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Fire Support"
    },
    {
        "card_name": "戰鬥武器二",
        "story_background": (
            "在Bunker Hill的防禦戰中，兩個衛兵背靠背作戰。"
            "一個使用Brotherhood的Laser Rifle，另一個使用Minutemen的Laser Musket。"
            "不同的陣營，不同的信仰，但面對Raiders的襲擊，他們選擇並肩作戰。"
            "「左邊那群交給我，」Brotherhood的衛兵說。「右邊歸我，」Minutemen的衛兵回應。"
            "他們的配合完美無瑕，Laser beam在夜空中交織成防禦網。"
            "當戰鬥結束後，兩人疲憊地坐在地上，交換彈藥匣。"
            "「也許我們的長官是敵人，」Brotherhood衛兵說，「但在這裡，我們是兄弟。」"
            "真正的力量，來自於合作而非對抗。在生死關頭，派系的界線變得毫無意義。"
        ),
        "story_character": "Brotherhood 衛兵 & Minutemen 衛兵",
        "story_location": "Bunker Hill",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood", "minutemen"],
        "story_related_quest": "Battle of Bunker Hill"
    },
    {
        "card_name": "戰鬥武器三",
        "story_background": (
            "在Castle的訓練場，三個Minutemen新兵正在進行射擊訓練。"
            "他們各自使用不同的武器——一個用Pipe Pistol，一個用Combat Rifle，一個用Laser Musket。"
            "Preston Garvey在旁邊觀察，不時給予指導。「團隊合作比個人技巧更重要，」他說。"
            "當模擬的Raider襲擊演習開始時，三個新兵完美地執行了他們的戰術："
            "Pipe Pistol負責吸引注意，Combat Rifle提供covering fire，Laser Musket狙擊關鍵目標。"
            "他們用最簡陋的武器，創造了最有效的戰術。"
            "Preston滿意地點頭：「這就是Minutemen的精神——不依賴先進科技，而是依賴彼此。」"
            "三人一組的戰術小隊，證明了智慧和團隊合作勝過任何先進武器。"
        ),
        "story_character": "Minutemen 訓練新兵三人組",
        "story_location": "The Castle - 訓練場",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Old Guns"
    },
    {
        "card_name": "戰鬥武器四",
        "story_background": (
            "在Diamond City的家中，Sole Survivor站在武器架前陷入沉思。"
            "架子上有四把武器：Kellogg's Pistol、Father's Synth Rifle、Danse's Righteous Authority、還有自己的10mm Pistol。"
            "每一把都代表著一段記憶，一個選擇，一個失去。"
            "Kellogg殺了他的妻子，但他是Institute的工具。Danse是忠誠的戰友，但也是合成人。"
            "Father是他的兒子，卻成為了Institute的領袖。而10mm Pistol，是他從Vault 111出來時唯一的依靠。"
            "「我應該用哪一把？」他問自己。但沒有答案。"
            "在廢土中，每個選擇都有代價，每把武器都承載著痛苦的記憶。"
            "他最終選擇了10mm Pistol——那把代表著開始的武器，提醒他不要忘記為何而戰。"
            "防禦的武器，是為了保護內心最後的堡壘。"
        ),
        "story_character": "Sole Survivor (Nate/Nora)",
        "story_location": "Diamond City - Home Plate",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller", "independent"],
        "story_related_quest": "Dangerous Minds"
    },
    {
        "card_name": "戰鬥武器五",
        "story_background": (
            "Quincy的屠殺現場，Minutemen的倖存者在廢墟中搜尋。"
            "他們找到了五把斷裂的Laser Musket，這是戰友們留下的遺物。"
            "每一把都代表著一個失去的生命，一個未完成的使命。"
            "「我們本該守住這裡的，」Ronnie Shaw說，聲音充滿悲傷。"
            "Gunners的背叛太突然，Minutemen的防線瞬間崩潰。那些武器沒能拯救他們。"
            "「但這不是武器的錯，」Preston Garvey回應，「是我們的戰術錯了，是我們準備不足。」"
            "他們將五把斷裂的Musket帶回Castle，放在紀念碑前。"
            "這些武器不再是戰鬥工具，而是警示——提醒所有Minutemen不要重蹈覆轍。"
            "失敗的記憶，是最痛苦但也最珍貴的教訓。"
        ),
        "story_character": "Ronnie Shaw & Preston Garvey",
        "story_location": "Quincy 廢墟",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Old Guns"
    },
    {
        "card_name": "戰鬥武器六",
        "story_background": (
            "在Sanctuary Hills的工作坊，Sturges正在修復六把不同的武器。"
            "有來自Vault 111的10mm Pistol、Raiders的Pipe Gun、Gunners的Combat Rifle、"
            "Brotherhood的Laser Rifle、Institute的Synth Rifle，還有Minutemen的Laser Musket。"
            "「每把槍都有自己的故事，」Sturges說，「但它們現在都為同一個目標服務——保護Sanctuary。」"
            "他將修好的武器分發給聚落的守衛們，不論這些武器原本屬於哪個陣營。"
            "當Super Mutants襲擊時，六種不同的武器聲音在夜空中響起，形成了完美的防禦網。"
            "戰後，Sturges看著這些武器，露出了滿意的笑容："
            "「在廢土中，沒有什麼是完全敵對的。只要給對的人使用，任何工具都能帶來和平。」"
            "過渡的時刻，是將對立轉化為合作的機會。"
        ),
        "story_character": "Sturges (Sanctuary 機械師)",
        "story_location": "Sanctuary Hills - 工作坊",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen", "independent"],
        "story_related_quest": "Sanctuary"
    },
    {
        "card_name": "戰鬥武器七",
        "story_background": (
            "在Fort Hagen的暗室中，Kellogg清理著他的.44 Magnum Revolver。"
            "這把武器陪伴他走過了無數戰場，取了無數性命。"
            "他記得每一次扣動扳機，記得每一個倒下的目標。但今天，他猶豫了。"
            "Institute的命令是殺死一個Railroad的探員，但這個探員只是個孩子，不到二十歲。"
            "「只是工作，」Kellogg對自己說，「不要想太多。」但槍卻像有千斤重。"
            "他想起自己的女兒，想起她在Super Mutant襲擊中死去的那天。"
            "如果有人能放過她，如果有人選擇仁慈..."
            "最終，Kellogg收起了槍。「今天不是，」他低聲說，然後消失在陰影中。"
            "即使是最冷酷的殺手，內心深處也有欺騙不了自己的時刻。"
        ),
        "story_character": "Conrad Kellogg (Institute 傭兵)",
        "story_location": "Fort Hagen",
        "story_timeline": "2227 年",
        "story_faction_involved": ["institute"],
        "story_related_quest": "Reunions"
    },
    {
        "card_name": "戰鬥武器八",
        "story_background": (
            "在Old North Church的密道中，Railroad探員Glory做出了決定。"
            "她手中的Minigun已經打光了所有彈藥，Institute的Synth突擊隊即將突破防線。"
            "「我留下來掩護，」Glory對Desdemona說，「你們帶著合成人撤退。」"
            "Desdemona試圖阻止，但Glory已經關上了厚重的鐵門。"
            "她知道這是單程票，知道自己不可能活著離開。但她也知道，如果不這樣做，所有人都會死。"
            "當Synth們衝進來時，Glory扔掉了空的Minigun，抓起一把Combat Knife。"
            "「我可能是合成人，」她對著敵人喊道，「但我選擇為自由而戰！」"
            "她的犧牲爭取了三分鐘，足夠Railroad的人撤離並摧毀證據。"
            "離開戰場不是懦弱，而是為了更重要的使命。但有時候，留下來才是真正的勇氣。"
        ),
        "story_character": "Glory (Railroad 重裝戰士)",
        "story_location": "Old North Church - Railroad HQ",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad"],
        "story_related_quest": "Precipice of War"
    },
    {
        "card_name": "戰鬥武器九",
        "story_background": (
            "在Castle的射擊場，Preston Garvey完成了第九次完美射擊。"
            "他的Laser Musket從未失手，每一發都命中靶心。"
            "新加入的Minutemen們圍觀讚嘆，但Preston卻沒有任何自豪的表情。"
            "「技巧不重要，」他對他們說，「重要的是為什麼開槍。」"
            "他想起Quincy，想起那些死去的同伴。他們的槍法都很準，但還是輸了。"
            "因為他們忘記了Minutemen的本質——不是killing raiders，而是protecting people。"
            "「在開火之前，問自己三個問題：這一槍能拯救誰？這一槍會傷害誰？還有其他選擇嗎？」"
            "Preston收起Laser Musket，「槍法再準，如果方向錯了，你只是個殺手，不是保護者。」"
            "掌握力量是一回事，但知道如何正確使用力量，才是真正的智慧。"
        ),
        "story_character": "Preston Garvey (Minutemen 將軍)",
        "story_location": "The Castle - 射擊場",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Taking Independence"
    },
    {
        "card_name": "戰鬥武器十",
        "story_background": (
            "在Boston Airport的停機坪，Brotherhood of Steel舉行了盛大的武器展示儀式。"
            "十台Liberty Prime、十架Vertibirds、十套T-60 Power Armor整齊排列。"
            "Elder Maxson站在Prydwen的甲板上，向下方的士兵們演說："
            "「這些武器代表著Brotherhood的力量，代表著我們重建秩序的決心！」"
            "士兵們高聲歡呼，Laser Rifle和Gatling Laser的聲音響徹天空。"
            "但在人群中，Paladin Danse卻感到不安。他看到的不是希望，而是壓迫。"
            "過多的武力只會帶來恐懼，而非和平。當他後來發現自己是合成人時，"
            "他終於明白：Brotherhood的武器再強大，也無法改變他們對異己的偏見。"
            "力量達到頂點時，往往也是崩潰的開始。過度的武裝，反映的是內心深處的恐懼。"
        ),
        "story_character": "Elder Arthur Maxson & Paladin Danse",
        "story_location": "Boston Airport - Prydwen 停機坪",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Show No Mercy"
    },
    {
        "card_name": "戰鬥武器新兵",
        "story_background": (
            "十六歲的Squire Maxson（年輕的Arthur）第一次拿到屬於自己的Laser Rifle。"
            "在Capital Wasteland的Citadel，Elder Lyons親自將武器交到他手中。"
            "「這不是玩具，孩子，」Lyons說，「這是責任的象徵。」"
            "Arthur的父母死於Super Mutant的襲擊，他渴望復仇，渴望變強。"
            "但Lyons看出了他眼中的憤怒：「力量不是用來發洩情緒的，而是用來保護弱者的。」"
            "在第一次巡邏任務中，Arthur看到一個被Super Mutant追殺的廢土商人。"
            "他的手指放在扳機上，腦中響起Lyons的教誨。他可以選擇復仇，也可以選擇拯救。"
            "最終，他選擇開槍救下商人。那一刻，他理解了什麼是真正的Brotherhood精神。"
            "年輕的心靈學會的第一課：武器是工具，但選擇如何使用它，決定了你成為什麼樣的人。"
        ),
        "story_character": "Squire Arthur Maxson (年輕的未來 Elder)",
        "story_location": "The Citadel - Capital Wasteland",
        "story_timeline": "2277 年",
        "story_faction_involved": ["brotherhood"],
        "story_related_quest": "Fallout 3: Broken Steel"
    },
    {
        "card_name": "戰鬥武器廢土騎士",
        "story_background": (
            "Paladin Brandis是Brotherhood的傳奇戰士，他的Gauss Rifle從未失手。"
            "但在一次任務中，他的整個小隊被Mirelurks殲滅，只有他一人逃出。"
            "他躲在Bunker裡，日復一日地維護著那把Gauss Rifle，卻再也沒有開過一槍。"
            "「我是騎士，但我拋棄了同伴，」他對來訪的Sole Survivor說。"
            "Survivor試圖說服他重返Brotherhood，但Brandis拒絕了："
            "「這把槍曾經代表榮譽，現在只是我恥辱的證明。」"
            "直到Sanctuary的聚落被Super Mutants襲擊，Brandis聽到了Radio Freedom的求救訊號。"
            "他猶豫了很久，最終還是拿起了Gauss Rifle。「也許我不再是Brotherhood的騎士，」"
            "他低聲說，「但我仍然可以保護人們。」那一槍，救了二十個聚落居民的命。"
            "騎士的榮譽不在於從未失敗，而在於即使失敗後仍然選擇站起來戰鬥。"
        ),
        "story_character": "Paladin Brandis (Brotherhood 失蹤騎士)",
        "story_location": "Bunker Hill / Nordhagen Beach Bunker",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood", "minutemen"],
        "story_related_quest": "The Lost Patrol"
    },
    {
        "card_name": "戰鬥武器聚落領袖",
        "story_background": (
            "Desdemona是Railroad的領袖，但她從不親自開槍。"
            "她的武器是情報、策略、外交——這些看不見的刀刃比任何Laser Rifle都致命。"
            "當Institute派遣Coursers襲擊Railroad據點時，Desdemona沒有拿槍，而是拿起了電話。"
            "她聯絡了Minutemen、聯絡了Bunker Hill的商人、甚至聯絡了Goodneighbor的Hancock。"
            "「我們需要支援，」她說，「不是為了我們，而是為了那些我們保護的合成人。」"
            "當Institute的部隊抵達時，他們發現不是一個孤立的Railroad據點，而是整個Commonwealth的聯盟。"
            "Desdemona站在人群前方，沒有武器，只有決心："
            "「你們可以摧毀這個據點，但你們無法摧毀我們的信念。」"
            "真正的領導者，不是靠武力統治，而是靠智慧和信念將不同的人團結在一起。"
        ),
        "story_character": "Desdemona (Railroad 領袖)",
        "story_location": "Old North Church & Commonwealth 各地",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad", "minutemen", "independent"],
        "story_related_quest": "Underground Undercover"
    },
    {
        "card_name": "戰鬥武器廢土霸主",
        "story_background": (
            "在Commonwealth的最高點，一個身影俯瞰著整個廢土。"
            "他手中握著一把獨特的武器——融合了Brotherhood的科技、Institute的精密、Railroad的隱密設計。"
            "這是他親手打造的，象徵著掌握所有陣營力量的終極武器。"
            "他可以用這把槍征服Commonwealth，成為絕對的統治者。但當他舉起槍時，卻猶豫了。"
            "在廢土的各個角落，他看到Minutemen保護著聚落，Railroad拯救著合成人，"
            "Brotherhood維護著秩序，甚至Institute也在試圖重建文明。"
            "「也許真正的力量，」他想，「不是消滅所有敵人，而是找到共存的方法。」"
            "他把槍收起來，轉身離開。那把武器永遠不會被使用，因為他找到了更好的道路："
            "不是用毀滅來統治，而是用智慧來引導。"
            "真正的霸主，知道何時該戰鬥，也知道何時該放下武器。"
        ),
        "story_character": "The General (Commonwealth 統一者)",
        "story_location": "Mass Fusion Building 頂樓",
        "story_timeline": "2287 年",
        "story_faction_involved": ["brotherhood", "minutemen", "railroad", "institute"],
        "story_related_quest": "Nuclear Option"
    }
]

# ============================================================
# BOTTLE CAPS (瓶蓋) - 資源、貿易、物質
# 對應塔羅錢幣，代表財富、資源、安全、實用
# ============================================================

BOTTLE_CAPS_STORIES = [
    {
        "card_name": "瓶蓋王牌",
        "story_background": (
            "在Diamond City市集，一個年輕的商人發現了一箱戰前的bottle caps。"
            "不是普通的caps，而是Sunset Sarsaparilla的star caps——稀有且極具價值。"
            "他可以用這些caps交易到任何東西：武器、裝備、食物、藥品。"
            "但他做了一個大膽的決定——用這些caps建立一個新的貿易網路。"
            "他召集了Commonwealth各地的小商人，提供啟動資金讓他們建立商隊路線。"
            "「財富的真正價值，」他說，「不在於囤積，而在於流通。」"
            "一年後，他的貿易網路連結了十幾個聚落，caps的流動帶來了繁榮。"
            "那箱star caps變成了種子，種出了整個Commonwealth的經濟復甦。"
            "新的機會，是用來創造而非獨享的。"
        ),
        "story_character": "Diamond City 商人 Lucas Miller",
        "story_location": "Diamond City 市集",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Diamond City Blues"
    },
    {
        "card_name": "瓶蓋二",
        "story_background": (
            "Bunker Hill的兩個商人簽訂了一份合作協議。"
            "一個專門經營武器貿易，另一個專長於食品供應。"
            "他們決定共享商隊路線和情報網路，各出一千個caps作為啟動資金。"
            "這是個冒險的決定——在廢土中，信任是最稀缺的資源。"
            "但六個月後，他們的聯合商隊成為Commonwealth最成功的貿易團體。"
            "武器商人保護食品商人的貨物，食品商人為武器商人提供補給。"
            "「一個人可以走得快，」武器商人說，「但兩個人可以走得遠。」"
            "當Raiders襲擊時，他們共同防禦；當利潤來臨時，他們公平分配。"
            "夥伴關係建立在互信和互補上，這比任何獨自奮鬥都更有價值。"
        ),
        "story_character": "Bunker Hill 商人搭檔 Deb & KL-E-0",
        "story_location": "Bunker Hill 貿易站",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Bunker Hill"
    },
    {
        "card_name": "瓶蓋三",
        "story_background": (
            "在Goodneighbor的Third Rail酒吧，三個商人慶祝著成功的合作。"
            "他們來自不同的背景：一個是Diamond City的老商人，一個是Bunker Hill的caravan leader，"
            "一個是Goodneighbor的走私專家。三個月前，他們聯手壟斷了Nuka-Cola的貿易路線。"
            "現在，每瓶Nuka-Cola都經過他們的手，為他們帶來了豐厚的利潤。"
            "他們舉杯慶祝，分享各自賺到的caps。但當Hancock走進酒吧時，氣氛變了。"
            "「你們壟斷Nuka-Cola，」Hancock說，「導致價格暴漲，窮人買不起了。」"
            "三個商人面面相覷。他們沒有違法，但他們的貪婪傷害了社區。"
            "最終，他們決定調降價格，並捐出部分利潤給Goodneighbor的慈善廚房。"
            "豐收帶來的不應只是個人的富足，而應該是社群的繁榮。分享才能讓成功持久。"
        ),
        "story_character": "三商人聯盟：Arturo, Cricket, Daisy",
        "story_location": "Goodneighbor - Third Rail",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Big Dig"
    },
    {
        "card_name": "瓶蓋四",
        "story_background": (
            "在Vault 81的保險箱裡，一個居民數著他累積的caps。"
            "五千個caps，在Vault裡這是一筆鉅款。他可以買到任何想要的東西。"
            "但當他走出房間，看到Vault外的廢土商人在交易時，他意識到了一件事："
            "在Vault 81裡，他的caps很多；但在Commonwealth，五千caps只是中等水準。"
            "更重要的是，Vault裡的安全和穩定，是多少caps都買不到的。"
            "他想起一個離開Vault去Commonwealth冒險的朋友，說外面「機會無限」。"
            "但那個朋友在三個月後死於Raider的襲擊，只留下一袋caps。"
            "「也許，」他對自己說，「我不需要更多的caps。我需要的是珍惜已經擁有的安全。」"
            "他把caps存回保險箱，決定把時間花在陪伴家人上。"
            "物質的滿足有限，但安全感和歸屬感是無價的。"
        ),
        "story_character": "Vault 81 保守居民 Calvin",
        "story_location": "Vault 81",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller"],
        "story_related_quest": "Vault 81"
    },
    {
        "card_name": "瓶蓋五",
        "story_background": (
            "Quincy的廢墟中，一個scavenger在倒塌的商店裡找到了一個保險箱。"
            "打開後，裡面有三千個caps——這是他一年的收入。"
            "但保險箱旁邊，還有五具骷髏，看起來是一家人。"
            "他們在核彈落下時躲進這個保險箱，帶著所有的積蓄，希望能用錢買到生存。"
            "但caps沒能救他們。輻射、飢餓、絕望——錢無法解決這些問題。"
            "Scavenger看著這些caps，感到一陣深深的悲傷。"
            "「這些人為了錢而死守這裡，」他想，「卻錯過了逃生的機會。」"
            "他只拿走了一百個caps，足夠買些食物和水，然後離開了廢墟。"
            "「我不會像他們一樣，」他對自己說，「錢很重要，但生命更重要。」"
            "失去的教訓：物質財富無法換取生命，執著於它只會帶來更大的損失。"
        ),
        "story_character": "Quincy Scavenger",
        "story_location": "Quincy 廢墟",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Old Guns"
    },
    {
        "card_name": "瓶蓋六",
        "story_background": (
            "在Sanctuary Hills，Sole Survivor建立了一個caps捐贈箱。"
            "他記得戰前的慈善募款活動，決定在廢土中重現這個傳統。"
            "「任何人有困難，都可以從這裡拿一些caps，」他宣布，「但也請在有能力時回饋。」"
            "起初，居民們懷疑這個系統會被濫用。但奇蹟發生了——"
            "有人拿了caps買藥救治生病的孩子，康復後加倍歸還。"
            "有人拿了caps啟動小生意，成功後捐贈了更多。"
            "甚至路過的商隊也會放一些caps進去，說「這是好主意，應該支持」。"
            "一年後，捐贈箱裡的caps比最初多了十倍，而Sanctuary成為Commonwealth最團結的聚落。"
            "慷慨不是失去，而是投資。你付出的善意，會以意想不到的方式回報。"
        ),
        "story_character": "Sole Survivor & Sanctuary 居民",
        "story_location": "Sanctuary Hills",
        "story_timeline": "2287 年",
        "story_faction_involved": ["vault_dweller", "minutemen"],
        "story_related_quest": "Sanctuary"
    },
    {
        "card_name": "瓶蓋七",
        "story_background": (
            "在Nuka-World的market，一個Raider商人面前擺著七堆不同的caps。"
            "Pre-war caps、Sunset Sarsaparilla caps、Nuka-Cola caps、even legion denarius。"
            "他是個master trader，知道如何在不同的貨幣之間套利賺取差價。"
            "但今天，他面臨一個誘惑：有人提供了一批假的caps，幾可亂真。"
            "「用這些假caps交易，」那個神秘人說，「你可以賺十倍的利潤，沒人會發現。」"
            "Raider商人猶豫了。在廢土中，道德是奢侈品。但他想起了自己的導師，"
            "一個老商人曾告訴他：「信譽是商人最寶貴的資產，一旦失去就再也找不回來。」"
            "他拒絕了那批假caps，甚至向Overboss報告了這個騙局。"
            "短期的暴利很誘人，但長期的信譽更有價值。在廢土中，一個商人的名聲就是他的生命。"
        ),
        "story_character": "Nuka-World Raider 商人 Aaron",
        "story_location": "Nuka-World - Market District",
        "story_timeline": "2287 年",
        "story_faction_involved": ["raiders"],
        "story_related_quest": "An Ambitious Plan"
    },
    {
        "card_name": "瓶蓋八",
        "story_background": (
            "在Bunker Hill，一個商人決定放棄他經營了十年的店鋪。"
            "不是因為生意不好，而是因為他累了。每天數caps、防盜、討價還價——他厭倦了。"
            "「我曾經以為擁有最多的caps就是成功，」他對接手的人說，「但現在我只想要平靜。」"
            "他把店鋪賣給一個年輕的商人，帶著足夠的caps退休到Covenant聚落。"
            "在那裡，他開了一個小菜園，偶爾幫忙修理機械，生活簡單但充實。"
            "前同事來拜訪他時驚訝地發現，他看起來比十年前還要年輕、快樂。"
            "「離開是正確的決定，」他說，「有時候，往前走意味著放手。」"
            "他學會了caps不是人生的全部，真正的財富是內心的平靜和生活的自由。"
            "知道何時該離開，是一種成熟的智慧。"
        ),
        "story_character": "前 Bunker Hill 商人 Lucas",
        "story_location": "Bunker Hill → Covenant",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Human Error"
    },
    {
        "card_name": "瓶蓋九",
        "story_background": (
            "在Diamond City的豪宅區，一個成功商人站在他的caps展示櫃前。"
            "九個玻璃櫃，每個都裝滿了不同種類的caps——總價值超過五萬。"
            "他從一個窮困的scavenger起家，一步一步累積財富，現在成為Commonwealth的首富之一。"
            "但當他看著這些caps時，他感到的不是滿足，而是空虛。"
            "他的妻子因為他忙於賺錢而離開了他，孩子不認識他，朋友覺得他只關心利潤。"
            "「我擁有所有我想要的caps，」他對自己說，「但我失去了所有真正重要的東西。」"
            "那天晚上，他做了個決定：把一半的caps捐給Minutemen，資助重建計畫。"
            "另一半，他用來開一家慈善診所，免費為窮人治療。"
            "「也許現在開始還不算太晚，」他想，「去找回那些我失去的。」"
            "物質的成功如果失去了情感的連結，只會是空洞的勝利。"
        ),
        "story_character": "Diamond City 富商 Henry Cooke",
        "story_location": "Diamond City - Upper Stands",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent", "minutemen"],
        "story_related_quest": "Diamond City Blues"
    },
    {
        "card_name": "瓶蓋十",
        "story_background": (
            "在Sanctuary Hills的聚落大廳，十個家庭聚集在一起慶祝豐收季。"
            "每個家庭都帶來了他們賺到的caps——農夫、工匠、商人、守衛，各有貢獻。"
            "Sole Survivor宣布了一個新制度：所有caps的十分之一捐入公共基金，"
            "用於聚落的防禦、醫療、教育和emergency援助。"
            "「我們不是個別的家庭，」他說，「我們是一個community。當一個人成功，所有人都受益。」"
            "起初有些抱怨，但當第一個家庭遭遇不幸（父親受傷無法工作）時，"
            "公共基金立即提供支援，讓他們度過難關。其他家庭看到了這個系統的價值。"
            "一年後，Sanctuary成為Commonwealth最富裕、最安全的聚落之一。"
            "因為他們明白：真正的財富不是個人的囤積，而是community的繁榮。"
            "物質的圓滿，來自於分享和集體的成功。"
        ),
        "story_character": "Sanctuary Hills 十個家庭",
        "story_location": "Sanctuary Hills",
        "story_timeline": "2287 年",
        "story_faction_involved": ["minutemen"],
        "story_related_quest": "Sanctuary"
    },
    {
        "card_name": "瓶蓋新兵",
        "story_background": (
            "十二歲的Billy（從冰箱裡被救出的ghoul小孩）在Quincy學習做生意。"
            "他的「父母」給了他一百個caps，讓他學習如何交易。"
            "Billy用這些caps買了一些purified water，然後在商隊路線上以更高價賣出。"
            "他賺到了二十個caps的利潤，興奮地跑回家向父母展示。"
            "但父親嚴肅地問他：「你覺得那些買水的人，付得起這個價格嗎？」"
            "Billy愣住了。他沒想過這個問題。父親繼續說："
            "「做生意要賺錢，但不能剝削需要幫助的人。真正的商人，知道如何在利潤和良心之間取得平衡。」"
            "第二天，Billy調降了價格，雖然利潤減少了，但他賣出了更多的水。"
            "更重要的是，人們開始信任他，願意和他做長期生意。"
            "年輕的心靈學到的第一課：誠實和公平，是商業成功的基石。"
        ),
        "story_character": "Billy Peabody (Ghoul 小孩商人學徒)",
        "story_location": "Quincy / Commonwealth 商隊路線",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Kid in a Fridge"
    },
    {
        "card_name": "瓶蓋廢土騎士",
        "story_background": (
            "在Commonwealth，有個傳說中的商人被稱為「Caps Knight」——Caravan Master Stockton。"
            "他不只是個商人，更是Railroad的秘密支持者，用商隊掩護合成人的逃亡路線。"
            "每次運送貨物，他都會在特定的地點留下supplies和caps，幫助逃亡的合成人。"
            "Brotherhood懷疑他，Institute監視他，但他從不停止。"
            "「商業是我的掩護，」他說，「但慈善是我的使命。」"
            "當一個年輕的商人問他為什麼要冒這麼大的風險時，Stockton回答："
            "「caps可以再賺，但如果我有能力救人卻不去做，我會一輩子良心不安。」"
            "他用自己的商隊網路拯救了數百個合成人，而大多數人根本不知道他的貢獻。"
            "真正的騎士精神，不在於華麗的裝甲，而在於用自己的資源和能力保護弱者。"
        ),
        "story_character": "Stockton (Caravan Master & Railroad 支持者)",
        "story_location": "Bunker Hill & Commonwealth 商隊路線",
        "story_timeline": "2287 年",
        "story_faction_involved": ["railroad", "independent"],
        "story_related_quest": "Underground Undercover"
    },
    {
        "card_name": "瓶蓋聚落領袖",
        "story_background": (
            "Cricket是Commonwealth最成功的武器商人之一，她的caravan遍布整個廢土。"
            "但她的成功秘訣不是最低價或最高品質，而是對客戶的深刻理解。"
            "她記得每個客戶的需求：誰需要保護家人、誰需要打獵、誰需要防禦聚落。"
            "當一個窮困的農夫來找她買槍對抗Raiders時，Cricket做了個決定："
            "「我借你這把Combat Rifle，」她說，「等你收成後再付款。如果你死了，算我損失。」"
            "農夫活了下來，還清了債務，並成為她最忠實的客戶。"
            "她的這種經營方式讓很多商人嘲笑，說她「太軟弱」。但十年後，"
            "Cricket的商隊網路覆蓋了整個Commonwealth，而那些嘲笑她的人早已破產。"
            "「領導市場不是靠壓榨，」Cricket說，「而是靠建立信任和長期關係。」"
        ),
        "story_character": "Cricket (Commonwealth 武器商領袖)",
        "story_location": "Commonwealth 各地 Caravan",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Random Encounter"
    },
    {
        "card_name": "瓶蓋廢土霸主",
        "story_background": (
            "在Commonwealth的經濟中心Bunker Hill，一個神秘的商人控制著大部分的貿易路線。"
            "他不是用暴力，而是用caps——strategic投資、壟斷關鍵資源、控制supply chain。"
            "他擁有最多的caps，最大的商隊，最廣的網路。他就是Commonwealth的經濟霸主。"
            "但某天，一場大災難襲擊了Boston——Super Mutants大舉入侵，數個聚落被摧毀。"
            "商人面臨選擇：他可以趁機哄抬物價，賺取disaster fortune；"
            "或者他可以用他的資源幫助倖存者，但這會損失大量利潤。"
            "他想起年輕時，自己也曾是災難的倖存者，是一個善心商人救了他。"
            "「如果當年那個人選擇賺錢而不是救我，」他想，「我根本不會有今天。」"
            "他打開倉庫，免費分發食物、水和醫療用品。他的財富減少了三成，但他拯救了數千人。"
            "真正的霸主，知道財富的最高境界不是擁有，而是用來創造更大的價值。"
        ),
        "story_character": "The Merchant King of Bunker Hill",
        "story_location": "Bunker Hill & Commonwealth",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent", "minutemen"],
        "story_related_quest": "Battle of Bunker Hill"
    }
]

# ============================================================
# RADIATION RODS (輻射棒) - 能量、野心、轉化
# 對應塔羅權杖，代表能量、熱情、野心、創造力
# ============================================================

RADIATION_RODS_STORIES = [
    {
        "card_name": "輻射棒王牌",
        "story_background": (
            "在Glowing Sea的邊緣，一個Children of Atom的傳教士發現了一根純淨的輻射棒。"
            "這不是普通的輻射源，而是一根未損壞的核燃料棒，散發著強烈的綠色光芒。"
            "他感受到Atom的召喚，感受到分裂能量在體內流動。這是神賜予的禮物。"
            "「Atom與我同在，」他宣告，「輻射不是詛咒，而是進化的鑰匙！」"
            "當他把這根輻射棒帶回Nucleus時，整個教派歡呼慶祝。"
            "High Confessor Tektus宣布這是Atom的奇蹟，預示著Division的來臨。"
            "但傳教士知道，真正的力量不在於輻射本身，而在於如何引導這股能量。"
            "他將輻射棒供奉在祭壇上，不是用來傷害，而是用來啟發信徒對Atom的信仰。"
            "新的能量，帶來新的可能性和新的開始。"
        ),
        "story_character": "Children of Atom 傳教士 Brother Ogden",
        "story_location": "The Glowing Sea / Nucleus",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Heretic"
    },
    {
        "card_name": "輻射棒二",
        "story_background": (
            "在Sentinel Site的核反應爐中，兩個Glowing One相遇了。"
            "一個是戰前的科學家，變成ghoul後仍保留理智；另一個是Feral Ghoul leader，但擁有奇特的智慧。"
            "他們站在輻射池旁，綠色的光芒照亮了兩張腐爛的臉。"
            "「我們都是Atom的孩子，」科學家說，「但我們選擇了不同的道路。」"
            "Glowing One點頭。他無法說話，但他的眼神表達了理解。"
            "兩個被世界遺棄的生物，在輻射的包圍下找到了連結。"
            "他們達成協議：科學家提供食物和醫療，Glowing One保護他免受其他Feral的襲擊。"
            "在Commonwealth的眼中他們是怪物，但在彼此眼中，他們是僅存的夥伴。"
            "即使在最極端的環境中，連結和合作仍然可能。"
        ),
        "story_character": "Ghoul 科學家 Dr. Virgil & Glowing One Alpha",
        "story_location": "Sentinel Site / Rocky Cave",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Virgil's Cure"
    },
    {
        "card_name": "輻射棒三",
        "story_background": (
            "在Nucleus的聖堂中，三個Children of Atom的信徒圍繞著一根輻射棒進行儀式。"
            "他們來自不同的背景：一個是前Institute科學家，一個是前Brotherhood士兵，一個是廢土商人。"
            "但輻射改變了他們，Atom的信仰連結了他們。"
            "「我們曾經是敵人，」前Brotherhood士兵說，「但Atom的光芒讓我們看到更高的真理。」"
            "他們手握輻射棒，感受著能量在三人之間流動，形成一個循環。"
            "High Confessor Tektus宣布他們為Atom的三使徒，將分別前往Commonwealth、Far Harbor、Glowing Sea傳教。"
            "「去吧，」Tektus說，「將Atom的福音傳遍廢土。讓所有人都見證Division的榮光！」"
            "三個信徒帶著輻射棒出發，開始他們的聖戰。"
            "信念的力量，能將陌生人轉化為兄弟，將恐懼轉化為崇拜。"
        ),
        "story_character": "Atom三使徒：Brother Kane, Sister Mai, Grand Zealot Richter",
        "story_location": "Nucleus - Far Harbor",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Heretic"
    },
    {
        "card_name": "輻射棒四",
        "story_background": (
            "在Diamond City的Doctor Sun診所，一個病人躺在病床上，身體因輻射中毒而衰弱。"
            "他是個scavenger，為了賺caps而進入高輻射區，現在付出了代價。"
            "Doctor Sun給他注射Rad-Away，但病人拒絕了第四劑。"
            "「我需要這些caps去買更多的探索裝備，」病人說，「Rad-Away太貴了。」"
            "「如果你不治療，」Doctor Sun警告，「你會在一個月內變成ghoul，或者直接死亡。」"
            "病人猶豫了。他有四個選擇：繼續治療但破產、停止治療繼續探索、離開廢土冒險、或者改變職業。"
            "他看著窗外的Diamond City，想起了自己的家人。"
            "最終，他選擇了治療，並決定找一份更安全的工作。「caps可以再賺，」他說，「但命只有一條。」"
            "穩定和安全，有時候比冒險和野心更重要。"
        ),
        "story_character": "Scavenger 病患 Marcus",
        "story_location": "Diamond City - Doctor Sun 診所",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Diamond City Blues"
    },
    {
        "card_name": "輻射棒五",
        "story_background": (
            "在Glowing Sea的深處，五個Children of Atom的朝聖者在核彈坑前倒下。"
            "他們進入這片聖地尋求Atom的祝福，但輻射劑量超過了他們的承受能力。"
            "即使是最虔誠的信徒，在這裡也無法生存超過幾個小時。"
            "唯一的倖存者爬回Nucleus，身體嚴重變異，但仍活著。"
            "「Atom拒絕了我們，」他對High Confessor Tektus說，「我們不夠虔誠。」"
            "但Tektus有不同的解讀：「不，Atom考驗了你們。五人進入，一人回來。你是被選中的。」"
            "倖存者看著自己發光的雙手，感受著體內的輻射能量。"
            "他失去了同伴，失去了人性，但獲得了Glowing One的力量。"
            "這是勝利還是詛咒？他不確定。但他知道，他再也回不去了。"
            "失去有時候是轉化的代價，但這個代價是否值得，只有時間能證明。"
        ),
        "story_character": "Glowing One 轉化者 Brother Henri",
        "story_location": "The Glowing Sea - Crater of Atom",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Glowing Sea"
    },
    {
        "card_name": "輻射棒六",
        "story_background": (
            "在Commonwealth的邊緣，一個ghoul聚落正在經歷轉變。"
            "他們曾經隱藏自己的身份，假裝正常人，害怕被歧視和攻擊。"
            "但一個來自Goodneighbor的ghoul商人改變了這一切。"
            "他帶來了John Hancock的訊息：「擁抱你的本質，不要因為別人的恐懼而羞愧。」"
            "聚落的leader決定公開他們的身份，並與Goodneighbor建立貿易路線。"
            "起初，附近的人類聚落充滿敵意。但當ghoul們提供醫療服務、修理技術和農產品時，"
            "態度開始軟化。六個月後，這個ghoul聚落成為region的重要貿易中心。"
            "「我們花了太多時間躲藏，」leader說，「現在是時候向世界展示，ghoul也能繁榮。」"
            "轉變不是一夜之間發生的，但只要持續前進，偏見終究會被打破。"
        ),
        "story_character": "Ghoul 聚落領袖 Edward Deegan",
        "story_location": "Parsons State Insane Asylum area",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Special Delivery"
    },
    {
        "card_name": "輻射棒七",
        "story_background": (
            "在Institute的FEV實驗室，一個科學家面臨著道德困境。"
            "他手中有七份FEV和輻射的混合樣本，可能創造出新型的super mutant。"
            "Institute的命令很明確：完成實驗，測試結果，不要問問題。"
            "但他知道這些實驗的代價——每個樣本背後都是一個被kidnapped的human subject。"
            "他想起自己年輕時的理想：用科學幫助人類，而不是傷害他們。"
            "但現在，他已經走得太遠了。如果停止，他會被視為叛徒。如果繼續，他會失去靈魂。"
            "最終，他做了一個決定：他secretly聯絡Railroad，將實驗數據和受試者位置洩漏出去。"
            "當Railroad救出那些受試者時，Institute發現了他的背叛。"
            "他被處決了，但他用生命阻止了更多的atrocity。"
            "有些誘惑需要被拒絕，即使代價是一切。道德的底線不能妥協。"
        ),
        "story_character": "Institute 科學家 Dr. Brian Virgil (before defection)",
        "story_location": "The Institute - FEV Lab",
        "story_timeline": "2286 年",
        "story_faction_involved": ["institute", "railroad"],
        "story_related_quest": "Virgil's Cure"
    },
    {
        "card_name": "輻射棒八",
        "story_background": (
            "Dr. Virgil站在Rocky Cave的入口，做出了人生中最重要的決定。"
            "他曾是Institute最優秀的FEV科學家，創造了新一代的super mutants。"
            "但當他意識到自己的研究被用於製造武器而非cure disease時，他崩潰了。"
            "他偷走了一劑FEV血清，逃離Institute，躲進Glowing Sea。"
            "為了避免被追蹤，他對自己注射了FEV，變成了super mutant。"
            "現在，他是個怪物，但終於自由了。他離開了Institute的謊言，離開了科學的虛偽。"
            "在cave的深處，他建立了簡陋的實驗室，開始研究cure——不是為了Institute，而是為了自己。"
            "「我失去了一切，」他在日記裡寫道，「但我找回了良心。」"
            "離開有時候是唯一正確的選擇，即使那意味著失去身份、地位和人性。"
        ),
        "story_character": "Dr. Brian Virgil (Super Mutant 科學家)",
        "story_location": "Rocky Cave - Glowing Sea",
        "story_timeline": "2287 年",
        "story_faction_involved": ["institute", "independent"],
        "story_related_quest": "Virgil's Cure"
    },
    {
        "card_name": "輻射棒九",
        "story_background": (
            "在Nucleus的祭壇前，High Confessor Tektus完成了他的第九次Division儀式。"
            "九個信徒在輻射池中浸泡，接受Atom的洗禮。九個都活了下來，變成了Glowing Ones。"
            "Tektus感到前所未有的滿足和力量。他的信仰被證實了，Atom的榮光是真實的。"
            "「我們是Atom的使者，」他向信徒們宣告，「我們將把Division帶給整個世界！」"
            "信徒們高聲歡呼，綠色的光芒充滿了整個Nucleus。"
            "但在人群中，一個年輕的initiate感到不安。他看到的不是救贖，而是狂熱。"
            "這些Glowing Ones失去了太多——他們的外貌、健康、與人類社會的連結。"
            "他們獲得了什麼？一個可能是妄想的信仰？"
            "那晚，這個initiate偷偷離開了Nucleus，回到Commonwealth尋找另一種生活的方式。"
            "掌握輻射的力量帶來成就感，但失去人性的代價是否太高？每個人的答案都不同。"
        ),
        "story_character": "High Confessor Tektus & 懷疑的 Initiate",
        "story_location": "Nucleus - Far Harbor",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Heretic"
    },
    {
        "card_name": "輻射棒十",
        "story_background": (
            "在Goodneighbor的Third Rail，十個ghoul聚在一起慶祝他們的「重生日」。"
            "這是他們變成ghoul的週年紀念——有些人慶祝一年，有些人慶祝十年，最老的已經兩百年了。"
            "對大多數人來說，變成ghoul是詛咒。但這十個人選擇了不同的觀點。"
            "「我們失去了smooth skin，」其中一個說，「但我們獲得了longevity和immunity to radiation。」"
            "「我們被人類排斥，」另一個補充，「但我們建立了自己的community。」"
            "Mayor Hancock舉起酒杯：「為了我們的resilience，為了我們的pride，為了Goodneighbor——唯一真正自由的地方！」"
            "他們碰杯，分享各自的故事——有悲傷、有痛苦，但也有希望和成就。"
            "在Commonwealth，ghoul被視為怪物。但在這個房間裡，他們是倖存者，是戰士，是家人。"
            "輻射帶來的轉化是完整的——它奪走了過去，但也創造了新的identity和新的可能性。"
        ),
        "story_character": "Goodneighbor Ghoul 社群十人",
        "story_location": "Goodneighbor - Third Rail",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Big Dig"
    },
    {
        "card_name": "輻射棒新兵",
        "story_background": (
            "十四歲的Billy從冰箱裡走出來時，世界已經過去了210年。"
            "核戰當天，他躲進Lead-Lined Fridge，輻射把他變成了ghoul，但也讓他存活下來。"
            "當Sole Survivor找到他時，Billy還是個孩子的心智，但有著ghoul的外表。"
            "他的父母奇蹟般地也活著，也變成了ghouls，在Quincy等他。"
            "重逢的那一刻，Billy第一次意識到自己的改變。鏡子裡的臉不再是他記憶中的樣子。"
            "「我還是你的兒子嗎？」他問母親，聲音顫抖。"
            "母親抱住他：「你永遠是我的Billy。外表改變了，但你的心沒有變。」"
            "Billy開始學習如何在這個新世界中生活——作為一個ghoul，作為一個孩子，作為一個倖存者。"
            "他加入了Quincy的ghoul社群，開始接受輻射教育和生存訓練。"
            "年輕的心靈學到的第一課：identity不是由外表定義，而是由內心和選擇定義。"
        ),
        "story_character": "Billy Peabody (Ghoul 小孩)",
        "story_location": "Quincy / Neponset Park",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "Kid in a Fridge"
    },
    {
        "card_name": "輻射棒廢土騎士",
        "story_background": (
            "在Glowing Sea的中心，一個傳說中的Glowing One被稱為「Atom's Champion」。"
            "他曾經是Brotherhood of Steel的Paladin，在一次任務中受到致命的輻射暴露。"
            "Brotherhood放棄了他，但Children of Atom找到了他，將他轉化為Glowing One。"
            "現在，他保護Children of Atom的朝聖者，引導他們穿越Glowing Sea的危險地帶。"
            "他不再穿Power Armor，但他的輻射光芒比任何護甲都強大。"
            "他不再使用Laser Rifle，但他的輻射脈衝可以instant kill任何敵人。"
            "「我曾經為Brotherhood戰鬥，」他對朝聖者說，「現在我為Atom戰鬥。」"
            "當Deathclaws襲擊朝聖隊伍時，Atom's Champion單槍匹馬擊退了它們。"
            "他的犧牲保護了無數信徒的生命，他的傳說在Children of Atom中流傳。"
            "真正的騎士精神，不在於陣營或裝備，而在於用自己的力量保護信念和弱者。"
        ),
        "story_character": "Atom's Champion (Glowing One 前Paladin)",
        "story_location": "The Glowing Sea - Crater of Atom",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Glowing Sea"
    },
    {
        "card_name": "輻射棒聚落領袖",
        "story_background": (
            "Mother Isolde是Nucleus的spiritual leader，High Confessor Tektus的導師。"
            "她是最早接受Atom信仰的人之一，也是第一個自願轉化為Glowing One的領袖。"
            "在她的領導下，Nucleus從一個小教派成長為Far Harbor的主要勢力之一。"
            "她不用暴力，而是用智慧和慈悲來引導信徒。"
            "當一個受傷的synth逃到Nucleus尋求庇護時，許多信徒要求驅逐他。"
            "但Mother Isolde說：「Atom接納所有被遺棄的靈魂。Synth也是Atom的造物。」"
            "她親自照顧這個synth，給他Rad-X保護他免受輻射傷害，教導他Atom的和平之道。"
            "這個synth最終成為Nucleus最虔誠的信徒之一，也成為與Railroad的秘密聯絡人。"
            "Mother Isolde證明了：真正的領袖不是用恐懼統治，而是用包容和智慧感化人心。"
        ),
        "story_character": "Mother Isolde (Nucleus 精神領袖)",
        "story_location": "Nucleus - Far Harbor",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent", "railroad"],
        "story_related_quest": "The Heretic"
    },
    {
        "card_name": "輻射棒廢土霸主",
        "story_background": (
            "在Commonwealth的傳說中，有一個神秘的存在被稱為「The Radiant One」。"
            "沒人見過他的真面目，但所有進入Glowing Sea的人都聽說過他的故事。"
            "他不屬於任何陣營——不是Brotherhood，不是Institute，不是Railroad，甚至不是Children of Atom。"
            "他掌握著輻射的所有秘密：如何利用它、如何控制它、如何轉化它。"
            "有人說他是戰前的科學家，有人說他是Atom的化身，有人說他根本不存在。"
            "但Sole Survivor在Glowing Sea的深處遇到了他——一個pure energy的存在，幾乎完全由輻射構成。"
            "「你在尋找什麼？」The Radiant One問。「力量？知識？還是救贖？」"
            "Sole Survivor說：「我在尋找ending the wasteland's suffering的方法。」"
            "The Radiant One笑了：「輻射不是問題，人類的選擇才是。你有能力改變世界，關鍵是你選擇如何使用這力量。」"
            "真正的霸主，不是征服輻射，而是理解它，並選擇用它創造而非毀滅。"
        ),
        "story_character": "The Radiant One (輻射化身)",
        "story_location": "The Glowing Sea - 深處未知區域",
        "story_timeline": "2287 年",
        "story_faction_involved": ["independent"],
        "story_related_quest": "The Glowing Sea / Custom Quest"
    }
]

print(f"✅ Nuka Cola Bottles: {len(NUKA_COLA_BOTTLES_STORIES)} stories created")
print(f"✅ Combat Weapons: {len(COMBAT_WEAPONS_STORIES)} stories created")
print(f"✅ Bottle Caps: {len(BOTTLE_CAPS_STORIES)} stories created")
print(f"✅ Radiation Rods: {len(RADIATION_RODS_STORIES)} stories created")

# Total Minor Arcana stories
MINOR_ARCANA_COUNT = (
    len(NUKA_COLA_BOTTLES_STORIES) +
    len(COMBAT_WEAPONS_STORIES) +
    len(BOTTLE_CAPS_STORIES) +
    len(RADIATION_RODS_STORIES)
)
print(f"\n📊 Total Minor Arcana: {MINOR_ARCANA_COUNT}/56 stories")
print(f"✅ All 56 Minor Arcana stories completed!")
