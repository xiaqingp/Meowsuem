// British Museum — 60 hand-authored collection entries, rendered by museum-app.js.
const bmOfficial = "https://www.britishmuseum.org/collection";
const bmVisit = "https://www.britishmuseum.org/visit";
const bmSearch = title => `https://www.britishmuseum.org/collection/search?keyword=${encodeURIComponent(title)}`;
const bmImage = file => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=960`;
const bmImageSource = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

const britishWorks = [
  ["rosetta","egypt","罗塞塔石碑","Rosetta Stone","托勒密王朝祭司团法令","公元前 196 年","Rosetta Stone.JPG","绝对不可错过","稀世珍品","三段文字没有讲三个故事；它们让同一道政令穿过三套书写系统，也让失传的圣书体重新开口。"],
  ["younger-memnon","egypt","拉美西斯二世巨像胸像（年轻的门农）","Colossal Bust of Ramesses II (Younger Memnon)","古埃及第十九王朝","约公元前 1250 年","Colossal bust of Ramesses II, the Younger Memnon (1250 BC) - British Museum.jpg","绝对不可错过","稀世珍品","脸上的平静并非自然表情，而是把统治者从会衰老的人变成永远有效的王权图像。"],
  ["nebamun-hunt","egypt","内巴蒙墓室壁画：沼泽狩猎","Nebamun Hunting in the Marshes","古埃及底比斯画工","约公元前 1350 年","Tomb of Nebamun.jpg","绝对不可错过","稀世珍品","猫、鱼、鸟和纸莎草拥挤得近乎失控，内巴蒙却稳稳站在中央；墓室用最旺盛的生命许诺死后世界。"],
  ["gebel-man","egypt","盖贝莱因人","Gebelein Man","前王朝时期埃及","约公元前 3500 年","At the British Museum 2024 346.jpg","重点推荐","重要藏品","这里最先看到的不是木乃伊技术，而是干燥沙土偶然保存的一具身体；自然环境先于祭司完成了防腐。"],
  ["katebet","egypt","卡特贝特的木乃伊与棺具","Mummy and Coffin of Katebet","古埃及第二十一王朝","约公元前 1300—1250 年","Mummy of Katebet, British Museum.jpg","重点推荐","重要藏品","假手、戒指、假发和张开的眼睛不是装饰清单，而是一套让卡特贝特在来世重新获得完整身体的方案。"],
  ["hunefer","egypt","胡内弗《亡灵书》：称心仪式","Book of the Dead of Hunefer: Weighing of the Heart","古埃及第十九王朝画工","约公元前 1275 年","BD Hunefer cropped 1.jpg","绝对不可错过","重要藏品","死者的心脏要与羽毛同秤；画面真正紧张的地方，是怪兽阿米特正等着吞掉不合格的灵魂。"],
  ["gayer-cat","egypt","盖尔－安德森猫","Gayer-Anderson Cat","古埃及晚期","约公元前 664—332 年","Gayer-Anderson Cat in British Museum; on its wooden base.JPG","重点推荐","重要藏品","这只猫既像活物又像神像：修长身体保持警觉，首饰和圣甲虫却把它推入巴斯特女神的祭祀世界。"],

  ["lamassu","empires","人首翼牛守门神","Human-Headed Winged Bull","新亚述帝国，杜尔－沙鲁金","约公元前 710 年","British Museum - Human-headed Winged Lion ME118802-01.JPG","绝对不可错过","稀世珍品","从正面看它站立，从侧面看它行走；第五条腿让同一守门神同时满足两种观看方向。"],
  ["lion-hunt","empires","亚述巴尼拔猎狮浮雕","Lion Hunt of Ashurbanipal","新亚述帝国尼尼微宫廷工匠","约公元前 645—635 年","Lion Hunt of Ashurbanipal DSCF3575.jpg","绝对不可错过","稀世珍品","国王几乎不动，狮子却在挣扎、流血和回头咬车轮；帝国宣传把最强烈的生命给了必败的一方。"],
  ["lachish","empires","拉吉城围攻浮雕","Lachish Reliefs","新亚述帝国西拿基立宫廷工匠","约公元前 700—681 年","Lachish Relief, British Museum 1.jpg","重点推荐","稀世珍品","攻城坡道、弓箭手、俘虏和被剥皮者连续铺开；这不是抽象胜利，而是帝国如何把恐惧制作成走廊。"],
  ["black-obelisk","empires","沙尔马那塞尔三世黑色方尖碑","Black Obelisk of Shalmaneser III","新亚述帝国","约公元前 825 年","Black-obelisk.jpg","重点推荐","重要藏品","五层贡物队伍把世界压成向国王弯腰的秩序；其中一组铭文让圣经人物第一次进入亚述王室图像。"],
  ["cyrus-cylinder","empires","居鲁士圆柱","Cyrus Cylinder","阿契美尼德波斯帝国","公元前 539 年后","Cyrus Cylinder.jpg","绝对不可错过","稀世珍品","它不是现代意义的“第一份人权宣言”，而是一位征服巴比伦的新王用传统语言证明自己统治合法。"],
  ["standard-ur","first-cities","乌尔军旗","Standard of Ur","苏美尔乌尔王墓工匠","约公元前 2500 年","Standard of Ur - War.jpg","绝对不可错过","稀世珍品","一面从战车碾人讲到俘虏受审，另一面从搬运贡物讲到宴会；战争与分配共同定义早期城市权力。"],
  ["ram-thicket","first-cities","灌木中的公羊","Ram in a Thicket","苏美尔乌尔王墓工匠","约公元前 2500 年","Ram in a thicket - British.jpg","绝对不可错过","稀世珍品","金箔、青金石、贝壳和沥青把一只踮脚山羊变成材料地图；奢侈品从数千公里外汇入乌尔。"],
  ["royal-game","first-cities","乌尔王棋","Royal Game of Ur","苏美尔乌尔王墓工匠","约公元前 2600—2400 年","British Museum Royal Game of Ur.jpg","重点推荐","稀世珍品","棋盘并不只证明古人会娱乐；楔形文字规则泥板让今天的人真的可以重新开一局四千年前的游戏。"],
  ["queens-lyre","first-cities","王后竖琴的牛首饰件","Bull-Headed Lyre from Ur","苏美尔乌尔王墓工匠","约公元前 2600—2400 年","The Queen's Lyre, side view; British Museum, London.jpg","重点推荐","稀世珍品","牛首上是真金和青金石，下方动物却像人一样饮酒奏乐；音乐把葬礼和神话接在一起。"],
  ["flood-tablet","first-cities","《吉尔伽美什史诗》洪水泥板","Flood Tablet from the Epic of Gilgamesh","新亚述抄写员","公元前 7 世纪","Tablet XI or the Flood Tablet of the Epic of Gilgamesh, currently housed in the British Museum in London.jpg","绝对不可错过","稀世珍品","十九世纪学者读到方舟、洪水与放鸟情节时，当场发现《圣经》之外还有更早的近东洪水传统。"],

  ["parthenon-horse","greece","帕特农神庙东山墙马首","Horse from the East Pediment of the Parthenon","菲迪亚斯主持的雅典工坊","约公元前 438—432 年","Horse's head from the Parthenon East Pediment.jpg","绝对不可错过","稀世珍品","鼻孔、眼眶和咬肌被推到极限，这匹拉月神战车的马像刚从整夜奔驰中耗尽最后一口气。"],
  ["parthenon-frieze","greece","帕特农神庙泛雅典娜节游行浮雕","Parthenon Frieze: Panathenaic Procession","菲迪亚斯主持的雅典工坊","约公元前 442—438 年","The Parthenon Frieze, British Museum (27034280066).jpg","绝对不可错过","稀世珍品","骑手没有整齐列队，马匹也各有脾气；神庙用细微差异把城邦共同体雕成持续前进的节奏。"],
  ["parthenon-metope","greece","帕特农神庙南面壁间板：拉庇泰人与半人马","Parthenon Metope: Lapith and Centaur","雅典工坊","约公元前 447—438 年","Centaur and Lapith in combat-South metope-Parthenon-British Museum.jpg","重点推荐","稀世珍品","人和半人马扭成一个结，斗篷在背后形成圆弧；文明战胜野蛮的口号，被雕成势均力敌的身体冲突。"],
  ["nereid","greece","涅瑞伊得斯纪念碑","Nereid Monument","吕西亚克珊托斯工匠","约公元前 390—380 年","The Nereid Monument - British Museum.jpg","重点推荐","稀世珍品","它看似一座小型希腊神庙，却属于吕西亚统治者墓葬；柱间海仙女的薄衣把跨文化权力变成海风。"],
  ["mausoleum-horse","greece","哈利卡纳苏斯陵墓巨马","Colossal Horse from the Mausoleum at Halikarnassos","希腊化前期工坊","约公元前 350 年","Horse from the Mausoleum of Halicarnassus, British Museum.jpg","重点推荐","稀世珍品","这匹残马原在世界七大奇迹之一的屋顶附近；只剩头颈也足以让人反推整座陵墓如何压过城市天际线。"],
  ["bassae","greece","巴赛阿波罗神庙浮雕","Bassae Frieze","古希腊工坊","约公元前 420—400 年","Bassar Frieze 1065.jpg","重点推荐","重要藏品","战士、女人和半人马像被狭窄石带挤得翻滚；原本在高处昏暗室内的浮雕，靠夸张动作抵抗看不清。"],
  ["discobolus","greece","汤利掷铁饼者","Townley Discobolus","罗马复制品，原作归于米隆","公元 2 世纪","The Townley Discobolos.jpg","重点推荐","重要藏品","身体扭到极限却还没把铁饼掷出；古典雕塑把爆发前一瞬冻结成可从四周检查的几何。"],
  ["portland-vase","greece","波特兰花瓶","Portland Vase","罗马帝国玻璃工匠","约公元 1—25 年","Portland Vase 1.jpg","绝对不可错过","稀世珍品","深蓝玻璃外覆白层，再像雕宝石一样切出人物；它是玻璃在假装浮雕石器，也是后来无数仿制品的祖本。"],
  ["warren-cup","greece","沃伦杯","Warren Cup","罗马帝国银匠","约公元 10—20 年","Warren Cup BM GR 1999.4-26.1 n1.jpg","重点推荐","重要藏品","两面男性性爱场景没有藏进暗角，而占满饮酒器外壁；它迫使现代观众检查自己对罗马性与身份的想象。"],
  ["lycurgus-cup","greece","莱库古斯杯","Lycurgus Cup","晚期罗马玻璃工匠","公元 4 世纪","British Museum The Lycurgus Cup 02 15022019 4362.jpg","绝对不可错过","稀世珍品","正面照是绿色，背后透光变红色；古代玻璃中的纳米级金银颗粒，在现代科学解释之前先制造了魔术。"],

  ["sutton-helmet","britain","萨顿胡头盔","Sutton Hoo Helmet","盎格鲁－撒克逊工匠","公元 6 世纪末至 7 世纪初","Sutton Hoo helmet 2016.png","绝对不可错过","稀世珍品","眉毛、鼻梁和胡须共同拼成一只飞鸟，头盔正面又变成人脸；战士把动物力量戴到自己身上。"],
  ["sutton-purse","britain","萨顿胡钱袋盖","Sutton Hoo Purse Lid","盎格鲁－撒克逊工匠","公元 7 世纪初","Sutton.Hoo.PurseLid.RobRoy.jpg","绝对不可错过","稀世珍品","石榴石、玻璃和金片被切成密集隔间，两只狼吞噬人的构图却保持完美对称；财富和危险贴在腰间。"],
  ["lewis-chessmen","britain","刘易斯棋子","Lewis Chessmen","挪威或北欧工匠","约 1150—1200 年","Lewis chessmen 23.JPG","绝对不可错过","稀世珍品","王后托腮、士兵咬盾、主教举手祝福；一套规则固定的棋，把中世纪社会身份做成几十张不同的脸。"],
  ["battersea-shield","britain","巴特西盾牌","Battersea Shield","不列颠凯尔特工匠","约公元前 350—50 年","British Museum Battersea Shield.jpg","重点推荐","重要藏品","红玻璃和旋涡纹让它耀眼得不适合实战；这块薄青铜更像在河流仪式中展示身份的外壳。"],
  ["mold-cape","britain","莫尔德金披肩","Mold Gold Cape","青铜时代威尔士工匠","约公元前 1900—1600 年","Mold cape British Museum img01.jpg","绝对不可错过","稀世珍品","一整片金被锤成覆盖肩胸的硬壳，纹带模拟珠串；穿戴者得到太阳般表面，却几乎失去抬臂自由。"],
  ["mildenhall-dish","britain","米尔登霍尔大银盘","Great Dish from the Mildenhall Treasure","晚期罗马银匠","公元 4 世纪","Mildenhall treasure great dish british museum.JPG","重点推荐","稀世珍品","海神涅普顿被酒神狂欢包围，直径六十多厘米的银盘把神话、宴饮和财富压在同一张桌面。"],
  ["hoxne-pepper","britain","霍克森宝藏“女皇”胡椒罐","Empress Pepper Pot from the Hoxne Hoard","晚期罗马银匠","公元 4—5 世纪","British Museum Hoxne Hoard Empress Pepper Pot.jpg","重点推荐","重要藏品","转动底部机关，胡椒从胸前落出；一张帝国女性的理想面孔，实际承担餐桌调味器的机械工作。"],
  ["franks-casket","britain","弗兰克斯匣","Franks Casket","盎格鲁－撒克逊工匠","约公元 700 年","Franks casket 03.jpg","重点推荐","稀世珍品","基督降生、罗马战争、日耳曼英雄和鲸骨铭文挤在同一只盒子上；信仰转换不是整齐替换，而是旧故事继续共存。"],
  ["royal-gold-cup","britain","皇家金杯","Royal Gold Cup","巴黎宫廷金匠","约 1370—1380 年","British Museum Royal Gold Cup.jpg","重点推荐","稀世珍品","半透明珐琅让人物像从金底里亮出来；这只杯在法、英、西班牙王室间移动，外交史直接写进物件履历。"],
  ["holy-thorn","britain","圣荆棘圣物匣","Holy Thorn Reliquary","巴黎宫廷金匠","约 1390 年代","Holy Thorn Reliquary, Waddesdon Bequest 01.jpg","重点推荐","稀世珍品","末日审判人物围住一根据称来自荆棘冠的刺；珠宝技术不是包边，而是在替不可验证的圣物制造可信度。"],

  ["admonitions","asia","《女史箴图》","Admonitions Scroll","传统归顾恺之；现存本为早期摹本","约公元 5—8 世纪","Admonitions Scroll Scene 5.jpg","绝对不可错过","稀世珍品","细线让人物像在纸上缓慢呼吸，宫廷训诫却始终伴着失宠、嫉妒和权力风险；观看前必须先确认短期展期。"],
  ["david-vases","asia","大维德花瓶","David Vases","元代景德镇窑工","1351 年","Vase with dragons among waves, British Museum 03.jpg","绝对不可错过","稀世珍品","瓶身铭文给出精确到年的供奉记录，使这对青花瓷成为断代锚点；龙纹之外，最值钱的是可读的时间。"],
  ["gandhara-buddha","asia","犍陀罗说法佛坐像","Seated Buddha from Gandhara","犍陀罗工匠","约公元 2—3 世纪","Seated Buddha, British Museum 1.jpg","重点推荐","重要藏品","衣褶像罗马长袍，面容与手势却服务佛教说法；文化交流不是把两种风格各贴一半，而是造出新的神圣身体。"],
  ["amaravati","asia","阿玛拉瓦蒂大塔浮雕","Relief from the Great Stupa at Amaravati","印度安得拉工匠","约公元 2—3 世纪","BrMus Amravati.jpg","重点推荐","稀世珍品","人物、象群和莲花围着原本不存在于馆内的佛塔旋转；碎片必须靠身体想象才能重新成为建筑。"],
  ["nataraja","asia","湿婆舞王","Shiva Nataraja","印度朱罗王朝工匠","约公元 1100 年","Lord Shiva Nataraja at the British Museum.jpg","绝对不可错过","重要藏品","一只脚踩住无知，另一只抬起许诺解脱；火圈、鼓点与头发把宇宙毁灭和再生压进平衡姿势。"],
  ["tara","asia","度母像","Statue of Tara","斯里兰卡工匠","约公元 8 世纪","British Museum Statue of Tara.jpg","重点推荐","稀世珍品","近一米半高的鎏金铜身仍保留柔软腰线和低垂手势；宗教亲近感建立在极高材料成本上。"],
  ["samurai-armour","asia","武士甲胄","Samurai Armour","日本多代甲胄工匠组合","约 18—19 世纪","SamuraiArmor.jpg","重点推荐","特色看点","它不是一个时代一次做完的套装，而是馆方用不同时期构件组合的展示；威风外表本身就是收藏史产物。"],

  ["idia-mask","world","贝宁象牙王母面具","Ivory Mask of Queen Mother Idia","贝宁王国宫廷工匠","16 世纪初","Idia mask BM Af1910 5-13 1.jpg","绝对不可错过","稀世珍品","柔和面孔上方排列葡萄牙人头像与泥鱼；王国把跨海来客和水神力量收编进王母权威。"],
  ["benin-plaque","world","贝宁王宫奥巴与侍从铜牌","Benin Plaque: Oba and Attendants","贝宁王国宫廷铜匠协会","约 16—17 世纪","Benin brass plaque 01.jpg","绝对不可错过","稀世珍品","奥巴被放大，侍从缩小，背景布满四叶纹；等级不靠透视，而靠身体尺寸直接宣布。"],
  ["ife-head","world","伊费铜合金头像","Brass Head from Ife","约鲁巴伊费工匠","约 14—15 世纪","British Museum Room 25 Head of a king Ife 17022019 5147.jpg","绝对不可错过","稀世珍品","面部刻线、闭合嘴唇和近乎真人尺度的安静逼真，曾击碎欧洲人关于非洲艺术“不可能自然主义”的偏见。"],
  ["hoa-hakananai","world","霍阿·哈卡纳奈阿摩艾石像","Hoa Hakananai'a","拉帕努伊人","约公元 1000—1200 年；背雕较晚","Hoa hakananai.jpg","绝对不可错过","稀世珍品","正面是祖先石像，背面却刻着鸟人仪式图案；岛上宗教变化在同一块玄武岩的前后两面相遇。"],
  ["double-serpent","world","双头蛇胸饰","Double-Headed Serpent","墨西加工匠","约 15—16 世纪","Double Headed Turquoise Serpent.jpg","绝对不可错过","稀世珍品","成千上万块绿松石被粘到木胎上，两张蛇口同时张开；材料光泽把危险动物变成可佩戴的神圣权力。"],
  ["yaxchilan-24","world","亚斯奇兰第24号门楣：放血仪式","Yaxchilan Lintel 24","玛雅工匠","公元 709 年","Yaxchilan Lintel 24.jpg","绝对不可错过","稀世珍品","王后用带刺绳索穿过舌头，国王举火把照明；政治权力不是享受，而是公开表演身体痛苦与通神资格。"],

  ["vindolanda-letter","hidden","温多兰达生日邀请木简","Vindolanda Birthday Invitation","克劳迪娅·塞维拉口述或亲笔","约公元 100 年","Vindolanda tablet 291.jpg","冷门但值得","重要藏品","帝国边疆没有只剩军令；一位女性邀请朋友参加生日聚会，结尾可能保留她亲手写下的问候。"],
  ["lindow-man","hidden","林道人","Lindow Man","铁器时代不列颠","约公元前 2 世纪至公元 1 世纪","Lindow Man.jpg","冷门但值得","重要藏品","头部重击、绞索和割喉集中在同一身体上，但“祭祀三重死亡”仍是解释，不是已经解决的案情。"],
  ["ringlemere","hidden","林格米尔金杯","Ringlemere Gold Cup","青铜时代不列颠工匠","约公元前 1700—1500 年","Ringlemere cup, British Museum.jpg","冷门但值得","稀世珍品","一整片金锤成薄杯，出土时已被农具压扁；它与欧洲少数同类金杯共同提示跨海精英网络。"],
  ["fuller-brooch","hidden","富勒胸针","Fuller Brooch","盎格鲁－撒克逊工匠","9 世纪后期","Fuller brooch Brit Museum jpg.jpg","冷门但值得","重要藏品","中央五感人格围成一圈，“视觉”睁大眼睛；抽象感官学被压缩成可以别在衣服上的银质宇宙。"],
  ["mechanical-galleon","hidden","机械帆船自动钟","Mechanical Galleon","奥格斯堡金匠与钟表匠","约 1585 年","Mechanical Galleon - British Museum - Joy of Museums.jpg","冷门但值得","重要藏品","上弦后船会前进、奏乐、鸣炮，小皇帝还在甲板巡游；宫廷把世界统治想象成一件会动的餐桌玩具。"],
  ["blacas-ewer","hidden","布拉卡斯水壶","Blacas Ewer","舒贾·伊本·马纳，摩苏尔","1232 年","Blacas Ewer, Mosul, 1232, British Museum.jpg","冷门但值得","稀世珍品","银铜嵌错人物、骑士和宫廷生活环绕壶身，签名与日期让一件豪华器物重新拥有工匠姓名。"],
  ["great-wave","hidden","神奈川冲浪里","Under the Wave off Kanagawa","葛饰北斋","约 1831 年","Great Wave off Kanagawa2.jpg","冷门但值得","重要藏品","巨浪像爪子扣向小船，富士山反而缩成远处稳定三角；纸本通常轮换，别把馆藏身份误当长期展出。"],
  ["durer-rhino","hidden","犀牛","The Rhinoceros","阿尔布雷希特·丢勒","1515 年","Dürer - Rhinoceros.jpg","冷门但值得","重要藏品","丢勒没见过活犀牛，却凭文字和草图造出铠甲怪兽；错误细节因版画传播反而统治欧洲想象数百年。"],
  ["epifania","hidden","《显现》构图稿","Epifania","米开朗基罗","约 1550—1553 年","Michelangelo - Epifania, 1895,0915.518.+.jpg","冷门但值得","稀世珍品","多张纸拼成巨幅炭笔稿，反复手臂和头部显示构图仍在移动；名作不是灵光一现，而是身体推演。"],
  ["blind-minotaur","hidden","暗夜里由女孩引路的盲眼牛怪","Blind Minotaur Led by a Little Girl in the Night","巴勃罗·毕加索","1934 年","https://www.christies.com/img/LotImages/2024/CKS/2024_CKS_22543_0043_000(pablo_picasso_minotaure_aveugle_guide_par_une_fillette_dans_la_nuit_fr043540).jpg?mode=max","冷门但值得","重要藏品","最强壮的牛怪失去视力，只能把方向交给牵着他的女孩；力量与脆弱在黑夜里交换了位置。"]
];

museumData.british = {
  id:"british",editorialCapacity:60,city:"伦敦 · 英国",zh:"大英博物馆",en:"The British Museum",
  ...museumRatings.british,
  verdict:"不是把全世界缩成陈列柜，而是让人同时看见人类造物的联系，以及这些物件为何会来到伦敦。",
  hero:bmImage("British Museum Great Court, London, UK - Diliff.jpg"),contentFile:"./research/content/british.md",
  intro:[
    "大英博物馆最不可替代的地方，不只是文明跨度，而是许多改变知识史的原件和完整收藏群在同一建筑中发生比较：文字如何被破译，宫殿怎样制造帝国图像，墓葬怎样保存社会等级，跨洋材料又如何移动。",
    "这份力量也带着不能绕开的取得史。帕特农雕塑、贝宁宫廷艺术和部分亚洲藏品的迁移涉及帝国、战争、交易与权力不对等；讲清对象来到伦敦的过程，本身就是看懂它们的一部分。",
    "六十件是多次参观内容库，不是一日打卡表。第一次抓住八件骨架；半天扩到十八件；单日上限三十件。纸本、纺织和部分敏感材料会轮换，出发前必须查馆方页面。"
  ],
  official:bmOfficial,visit:bmVisit,
  chapters:[
    {id:"egypt",number:"01",title:"一块石头怎样让失传文字重新开口",intro:"从自然木乃伊到王权巨像，埃及馆不只讲死亡，也讲身体、文字和复活技术。"},
    {id:"empires",number:"02",title:"帝国怎样把征服雕成必然",intro:"亚述与波斯对象让宫殿宣传、战争暴力和合法性语言正面相遇。"},
    {id:"first-cities",number:"03",title:"最早的城市如何分配战争、宴会与记忆",intro:"乌尔王墓和楔形文字把贸易、游戏、音乐与书写放回城市制度。"},
    {id:"greece",number:"04",title:"古典身体为什么从来不只是“美”",intro:"神庙、墓葬、复制品和玻璃把身体、政治、技术与原境拆开重组。"},
    {id:"britain",number:"05",title:"英国历史为什么要从一艘墓船讲起",intro:"金属、宝藏和宗教混合说明岛屿从来处在欧洲与更远贸易网络中。"},
    {id:"asia",number:"06",title:"图像怎样在丝路、宫廷和祭祀中改写自己",intro:"中国绘画、瓷器、南亚雕塑与日本甲胄显示“亚洲”从不是单一路线。"},
    {id:"world",number:"07",title:"谁有权替另一种文明命名和收藏",intro:"非洲、大洋洲与美洲杰作既证明高度艺术成就，也要求直面殖民取得史。"},
    {id:"hidden",number:"08",title:"冷门但值得：日常证据、机械与纸上巨作",intro:"十件容易错过或不常展出的对象，把注意力从巨型石雕转向写字、机械、版画和私人创作过程。"}
  ],
  works:britishWorks.map((w,i)=>({
    id:w[0],ch:w[1],zh:w[2],en:w[3],by:w[4],date:w[5],place:w[1]==="hidden"?"Great Russell Street 主馆；纸本或敏感材料可能轮换，须现场核验":"Great Russell Street 主馆；展厅与可见状态须现场核验",tag:w[7],significance:w[8],time:i<20?"8 分钟":"6 分钟",
    image:w[6].startsWith("http")?w[6]:bmImage(w[6]),imageSource:w[0]==="blind-minotaur"?"https://onlineonly.christies.com/s/prints-multiples/pablo-picasso-1881-1973-43/215125":bmImageSource(w[6]),source:w[0]==="blind-minotaur"?"https://www.britishmuseum.org/collection/object/P_2011-7096-97":bmSearch(w[3]),look:w[9],story:w[9],again:w[9],preciousWhy:w[9],cardSummary:w[9],unavailable:["admonitions","great-wave","durer-rhino","epifania","blind-minotaur"].includes(w[0])
  }))
};
