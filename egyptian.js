// Egyptian Museum in Cairo (Tahrir Square) — 40 objects. GEM and NMEC are excluded.
const emOfficial = "https://egymonuments.gov.eg/en/museums/egyptian-museum/";
const emVisit = emOfficial;
const emSearch = title => `https://egymonuments.gov.eg/en/search/?q=${encodeURIComponent(title)}`;
const emImage = file => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=960`;
const emImageSource = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

const egyptianWorks = [
  ["narmer","dawn","纳尔迈调色板","Narmer Palette","古埃及，早王朝时期第一王朝，纳尔迈在位期","约公元前 3100 年","Narmer Palette (verso).jpg","绝对不可错过","稀世珍品","依次寻找两面顶部的王名框、白冠与红冠，以及始终大于其他人的国王。","这件神庙仪式物把击敌、检阅和破城组织成王权宣称；它常被联系到上下埃及统一，但不是中立战报。","比较王名、两冠和等级尺度；再找长颈神兽围出的研磨区与拿鞋随从。"],
  ["min-palette","dawn","明神调色板","Min Palette","前王朝晚期工匠","约公元前 3300—3100 年","Min Palette.jpg","重点推荐","重要藏品","一块日常研磨颜料的石板，正在变成神庙献礼；器物用途与宗教图像的分叉，就发生在这块不大的片岩上。","它不如纳尔迈调色板完整，却让人看到仪式调色板并非突然出现，而是由实用品逐步被放大、刻图并脱离使用。","看凹槽是否真的适合研磨；找明神的高羽冠与直立身体；再观察边缘磨损和图像中心如何争夺位置。"],
  ["king-den","dawn","登王象牙标签","Ivory Label of King Den","第一王朝王室作坊","约公元前 2985 年","Den label.jpg","重点推荐","重要藏品","手掌大的象牙同时装下击敌、王名与纪年，图像和文字在国家记录中一起成长。","第一王朝有铭文的象牙标签数量有限，它们是理解早期行政纪年最直接的原件之一；单件不靠豪华材料，而靠文字史位置珍贵。","找国王举起的权杖；看隼形荷鲁斯与王名框；注意小孔说明它原本系在容器或贡物上；比较图像与短铭文谁占更多面积。"],

  ["djoser","pyramids","左塞尔坐像","Seated Statue of Djoser","第三王朝王室工坊","约公元前 2667—2648 年","Djoser d1.jpg","绝对不可错过","稀世珍品","这不是“金字塔建造者的肖像照”。沉重假发、紧裹身体的长袍和几乎封闭的姿势，把会活动的人固定成能在墓中永续接受祭祀的王。","它出自阶梯金字塔北侧真人大小密室，是现存最早的等身埃及王室雕像之一；原址的复制品与这里的原件互为参照，却不是另一件古代同作。","绕到侧面看身体怎样仍被石块包住；找眼部原镶嵌留下的空洞；注意胡须与假发的重量；把正面凝固感同阶梯金字塔的实验性对照。"],
  ["khufu","pyramids","胡夫象牙小像","Ivory Statuette of Khufu","第四王朝王室工坊","约公元前 2589—2566 年","Khufu Statuette.jpg","绝对不可错过","稀世珍品","建造最大金字塔的国王只有约七厘米高，王座铭文却让这件小像成为辨认胡夫的关键证据。","可靠刻有胡夫王名的三维王像极少，这件通常被视为唯一能够确定身份的完整小像；其他胡夫图像存在，却没有同等完整、同等确定的第二尊肖像。","用手指长度想象尺寸；找王座侧面的王名；看红冠与短裙；留意头部曾在发掘中失踪、后来从土堆找回的接缝。"],
  ["khafre","pyramids","荷鲁斯护佑下的哈夫拉坐像","Khafre Enthroned","第四王朝王室工坊","约公元前 2558—2532 年","Khafre statue.jpg","绝对不可错过","稀世珍品","正面先看国王的绝对平静，走到侧后方才会发现一只隼正把双翼抱住他的头；神并未站在王旁边，而是在视觉上与王的脑后合成。","哈夫拉河谷神庙出土过多尊王像，但这件以完整度、闪长岩质量和荷鲁斯护头构图成为最重要的一尊；有同组作品，却没有等效的第二件。","从正面看隼几乎消失；转到侧面找翼尖；观察王座两侧象征上下埃及统一的结；再看坚硬闪长岩怎样被磨出皮肤般光泽。"],
  ["menkaure-triad","pyramids","孟卡拉三人组像","Menkaure Triad","第四王朝王室工坊","约公元前 2490 年","Cairo, Egyptian Museum, Antiquities, photo 66 of 97 - Archivio fotografico Museo Egizio, Turin Album3 065.jpg","绝对不可错过","稀世珍品","哈索尔、国王与一位地方化身并肩，把神权、王权和国土压成一步向前的共同动作。","孟卡拉河谷神庙发现多件同类三人组像，分藏开罗与波士顿；开罗的优势是能比较同一规划中不同诺姆版本的成组序列。","看三双脚是否同速迈出；辨认哈索尔的牛角日盘；找地方女神头顶的诺姆标志；比较男女身体的前后层次。"],
  ["rahotep-nofret","pyramids","拉霍特普与诺芙蕾特夫妇坐像","Rahotep and Nofret","第四王朝工匠","约公元前 2575—2551 年","Prince Rahotep and wife Nofret 01.jpg","绝对不可错过","稀世珍品","先看那两双仍像湿润的眼睛。石灰岩身体被颜色、石英与水晶重新激活，难怪最早进入墓室的人一度以为暗处坐着活人。","两像在未受盗扰的封闭壁龛中成对出土，颜色和眼部镶嵌保存异常完整；同时代有彩绘夫妇像，但很少同时保住这一级尺寸、配对关系与表面。","看男性红褐与女性浅色的程式差异；找诺芙蕾特项链的层数；观察黑色眼线；比较两张脸是否真的像现代肖像。"],
  ["kaaper","pyramids","卡阿佩尔木像（村长像）","Wooden Statue of Ka-aper","第五王朝工匠","约公元前 2500 年","Kaaper statue Egyptian Museum (Cairo).png","绝对不可错过","稀世珍品","一位并非国王的中年官员，挺着腹部迈出一步；木材让身体摆脱石雕的永恒硬度，变得有体重、有年龄，也有一点让发掘工人认出“村长”的熟悉感。","古王国大型木像比石像更难保存，这件仍保留真人尺度、独立四肢与眼部镶嵌；相近木像存在，但完整度和艺术影响力很少达到同级。","看腹部与胸部的重量；找水晶眼珠的反光；注意手杖为现代补配；绕侧面看木纹和接合。"],
  ["seneb","pyramids","塞尼布一家","Seneb and His Family","第六王朝工匠","约公元前 2520 年","Seneb and family.jpg","绝对不可错过","重要藏品","塞尼布盘腿坐着，两个孩子填入通常属于小腿的空间，身体差异没有破坏一家四口的庄严秩序。","古埃及侏儒形象并非只此一件，但这组以身份、亲密关系和构图解决方案同时保存，给社会史提供难得的具名家庭证据。","看夫妻肤色与姿态；找孩子含手指的动作；注意两名孩子的位置怎样补齐轮廓；读底座铭文中的头衔。"],
  ["meidum-geese","pyramids","梅杜姆群雁图","Meidum Geese","第四王朝墓室画工","约公元前 2575—2551 年","OiesdeMeidoum.JPG","绝对不可错过","稀世珍品","六只鹅没有排成装饰花边：两只低头觅食，两只警觉抬头，羽毛花纹甚至区分品种。古王国画师用极少动作让一段湿地突然安静下来。","它是梅杜姆一座墓室中保存最完整、色彩最鲜明的壁画片段之一；同墓其他画面和同时代墓画存在，但这一级自然观察与完整表面没有简单替代品。","数六只鹅的朝向；比较三种羽纹；看背景为何几乎留白；靠近观察矿物颜料与灰泥边缘。"],
  ["hesyra","pyramids","赫西拉木板浮雕","Wooden Panels of Hesy-Ra","第三王朝工匠","约公元前 2650 年","Hesy Ra physician.jpg","重点推荐","稀世珍品","这些高瘦人物不是后来王室石雕的缩小版。细密木纹、锐利轮廓和一连串年龄变化，让一位官员在同一墓中获得多次出现的身体。","大型早王朝木浮雕极少存世，这组又保留多块连续人物板，是研究木雕风格和非王室精英形象的基准序列。","看肩宽与细腰；比较不同板上面容年龄；找书写工具暗示的官职；观察浅浮雕线怎样顺着木纹走。"],
  ["pepi-copper","pyramids","佩皮一世铜像组","Copper Statues of Pepi I and a Younger Figure","第六王朝金属工匠","约公元前 2332—2283 年","Pepi I copper statue.jpg","绝对不可错过","稀世珍品","远看像普通立像，近看才发现身体由铜片敲打、铆接而成。古王国工匠没有浇铸一大块铜，而是像造一层金属皮肤般把王拼起来。","它是古埃及现存最早的大型真人尺度金属雕像组；小型铜像不少，却没有同一时期、同等尺寸和工艺完整性的第二组。","找铜片接缝与铆钉；看眼睛原镶嵌留下的结构；比较大像和小像身份争议；注意腐蚀颜色不是原始肤色。"],
  ["seated-scribe","pyramids","开罗坐姿书吏像","Seated Scribe of Cairo","第五王朝工匠","约公元前 2450 年","Egyptian scribe statue.jpg","重点推荐","重要藏品","胸腹松弛，纸草摊在膝上，眼神像在等下一句话；把口述变成档案就是他的权力。","古王国坐姿书吏像有数件名作，卢浮宫也有著名一尊；开罗这件的价值在于同一类型的本土收藏与官僚形象，而不能冒充唯一。","看膝上纸草；找握笔手势；观察腹部写实与脸部理想化的差异；比较眼睛是否镶嵌。"],
  ["ti-relief","pyramids","提墓捕河马浮雕片","Relief from the Tomb of Ti","第五王朝墓室工匠","约公元前 2450 年","Mastaba of Ti 03.jpg","重点推荐","重要藏品","河马、芦苇和小船不是乡村风景；墓主人在图像里控制危险水域，让收获与秩序在死后继续运转。","提的陵墓主体仍在萨卡拉，馆内片段不能替代原址；它珍贵在保留原作表面与古王国叙事细节，同时必须讲清脱离墓室后的边界。","看河马嘴部的张力；找船工身体的交叉节奏；注意墓主人是否按等级放大；想象片段原在墙面哪一层。"],

  ["mentuhotep","middle","孟图霍特普二世彩绘坐像","Painted Statue of Mentuhotep II","第十一王朝王室工坊","约公元前 2055—2004 年","Mentuhotep II statue.jpg","绝对不可错过","稀世珍品","黑色皮肤、白色节庆长袍和粗壮双腿让他不像古王国的修长王像。这位重新统一埃及的国王，故意用古老仪式服装制造一次政治重启。","雕像出自代尔巴哈里王室葬庙的地下室，保留强烈原彩；同王另有碎片和浮雕，但这尊完整坐像是中王国开端最有辨识度的王权图像。","看黑肤色可能关联复生而非族群写实；找红冠残迹；观察双腿比例；比较白袍与深色身体的强烈分区。"],
  ["amenemhat-sphinx","middle","阿蒙涅姆赫特三世狮身人面像","Sphinx of Amenemhat III","第十二王朝王室工坊","约公元前 1850 年","Sphinx Amenemhat III Cairo.jpg","绝对不可错过","稀世珍品","鬃毛像真正狮子，脸却没有传统头巾；这件作品曾被后世国王改刻名字，说明一张强有力的王脸可以被政治反复占用。","所谓“海克索斯狮身人面像”有一组成对与相关作品，不是孤件；它们罕见在中王国写实王脸、狮身样式与多次篡刻历史叠在同一石面。","看鬃毛而非头巾；找后刻王名；观察颧骨与眼袋；比较身体的动物力量和脸的疲惫感。"],
  ["black-pyramidion","middle","黑色金字塔顶石","Pyramidion of Amenemhat III","第十二王朝王室工坊","约公元前 1850 年","Pyramidion of Amenemhet III at Dahshur.jpg","绝对不可错过","稀世珍品","把它想回金字塔最顶端：太阳从黑色花岗岩表面升起，翼日盘和双眼把整座墓变成一台朝向天空的复生装置。","完整刻铭的中王国王室金字塔顶石存量很少，这件又能明确对应达舒尔黑金字塔；有其他 pyramidion，却没有同一王、同一建筑与同等保存的替代品。","绕一圈看四面铭文；找双眼与翼日盘；注意顶端是否曾包金的推测边界；把小尺度与原金字塔高度相乘。"],
  ["senusret-head","middle","塞努斯雷特三世头像","Head of Senusret III","第十二王朝王室工坊","约公元前 1878—1840 年","Senusret III head Cairo.jpg","重点推荐","重要藏品","下垂眼睑、突出的耳朵和收紧嘴角，把承担秩序的疲惫变成一种新的统治风格。","塞努斯雷特三世肖像分藏多馆，存在多个版本；开罗作品的意义在于与馆内中王国王像成组比较，而非声称孤例。","看眼袋与嘴角；比较耳朵的夸张；找王室头巾留下的边界；退远看忧郁感是否仍成立。"],
  ["meketre-granary","middle","梅克特拉监督清点牛群模型","Meketre Supervising a Cattle Count","第十二王朝木工作坊","约公元前 1981—1975 年","GD-EG-Caire-Musée121.JPG","绝对不可错过","稀世珍品","牛群经过监督者和记录人员，木模型把最抽象的财产统计变成一套看得见的工作流程。","梅克特拉墓中保存一整组高质量生活模型，现主要分藏开罗与大都会；单个畜牧模型有同类，但墓组的完整行业谱系非常少见。","沿牛群行进方向追踪队列；找坐着的梅克特拉与儿子；看牧人的动作；比较每头牛是否被做成同一模样。"],
  ["bersha-soldiers","middle","梅塞赫蒂墓木制士兵队列","Model Soldiers from the Tomb of Mesehti","第十一至十二王朝木工作坊","约公元前 2000 年","Egyptian model soldiers Cairo Museum.jpg","重点推荐","稀世珍品","几十名士兵排成整齐纵队，盾牌和长矛把个体压进军事节奏，在墓中永久调动一支部队。","成规模保存的中王国木制士兵模型并不多，梅塞赫蒂墓的埃及弓箭手与努比亚枪兵两队尤其完整；价值来自成组和身份对照。","从队首看纵深；比较肤色与武器；找盾牌木纹；注意每个身体略有手工差异。"],

  ["ahhotep-jewels","empire","阿赫霍特普王后金饰与荣誉苍蝇项链","Jewels of Queen Ahhotep","第十七至十八王朝金匠","约公元前 1550 年","Ahhotep jewels Cairo.jpg","绝对不可错过","稀世珍品","三只金苍蝇今天看着古怪，在当时却可能表彰军事勇武；一位王后的珠宝把王朝战争、女性权力和金工技术串到同一条链上。","阿赫霍特普墓葬群是第二中间期结束与新王国建立阶段少数成组王室金器；同类苍蝇饰件存在，但这一组有明确王室墓葬语境。","找苍蝇翅膀的锤揲线；看金与彩石配色；辨认王名；比较佩戴尺寸与展示方式。"],
  ["ahmose-dagger","empire","森尼弗与塞奈夫妇像","Sennefer and Senay","第十八王朝卡纳克工坊","约公元前 1427—1400 年","By ovedc - Egyptian Museum (Cairo) - 105.jpg","重点推荐","重要藏品","底比斯市长与妻子并坐，不靠巨像尺寸证明身份；肩膀相接、双手贴近和密集铭文，把私人夫妻关系与公共官职缝在一起。","卡纳克藏坑保留了许多跨时代雕像，这组并非唯一夫妻像；它珍贵在人物具名、官职明确，并能与王室夫妻巨像比较尺度如何服务不同等级。","看两人肩线是否平齐；找手臂接触；读座椅侧面铭文；比较脸部个性与理想化身体。"],
  ["thutmose-iii","empire","图特摩斯三世玄武岩像","Basalt Statue of Thutmose III","第十八王朝王室工坊","约公元前 1479—1425 年","Thutmose III statue Cairo.jpg","重点推荐","重要藏品","征服者没有被雕成怒目武士；年轻、平静、几乎柔和的脸，说明埃及王像用神圣稳定而不是战场表情证明力量。","图特摩斯三世雕像数量不算少，分布多馆与神庙；这尊的价值在材质、完整度和作为王室肖像标准，不应说成孤件。","看玄武岩抛光；找王室头巾与眼镜蛇；观察肩胸的理想比例；比较脸与史书中军功形象。"],
  ["amenhotep-tiye","empire","阿蒙霍特普三世与泰伊王后巨像","Colossal Dyad of Amenhotep III and Tiye","第十八王朝王室工坊","约公元前 1390—1352 年","Colossal statue of Amenhotep III and Tiye.jpg","绝对不可错过","稀世珍品","七米级夫妻坐像几乎填满中庭，泰伊却没有按传统缩小到王的膝边。尺度上的并列，比任何“爱情故事”更直接地宣布她的地位。","它是现存最大的古埃及夫妻双人坐像，且保留三位公主与持续复原史；有其他王后并坐像，却没有同等规模和家庭结构的第二组。","从楼上与楼下各看一次；比较夫妻身高；找公主小像；观察新补碎片与旧石面的差异。"],
  ["amenhotep-meretseger","empire","阿蒙霍特普二世与梅雷特塞格女神","Amenhotep II with the Goddess Meretseger","第十八王朝王室工坊","约公元前 1427—1400 年","Amenhotep II Meretseger.jpg","重点推荐","重要藏品","女神以眼镜蛇从身后升起，国王不再只是被隼护住，而像坐在一整座底比斯山的神圣庇护前。","这件组合把地方山岳女神与王室形象直接相连，主题较少见；但同王与神像并非没有其他例子，价值主要在图像关系。","找蛇身怎样形成靠背；看王的手势；观察两者尺度；从侧面确认雕块如何合为一体。"],
  ["amenhotep-hapu","empire","阿蒙霍特普之子哈普坐姿书吏像","Amenhotep Son of Hapu as a Scribe","第十八王朝工坊","约公元前 1360 年","Amenhotep son of Hapu Cairo.jpg","重点推荐","重要藏品","一个不是国王的人，以书吏姿势把展开的纸草放在膝上，后来甚至被奉为智慧与治疗之神；官僚身份在这里一路升级成神圣权威。","哈普之子阿蒙霍特普留下多尊年龄不同的像，这件不是唯一；成组比较恰好能看见精英如何设计自己的公共形象。","读膝上铭文方向；看衰老面容；比较坐姿书吏传统；找衣料与身体的边界。"],
  ["sekhmet","empire","塞赫麦特女神坐像","Seated Statue of Sekhmet","阿蒙霍特普三世时期工坊","约公元前 1387—1350 年","Sekhmet statue Cairo Museum.jpg","重点推荐","重要藏品","狮首没有咆哮，身体也端坐不动；危险被压缩进平静重复的神像中，像以大量秩序安抚一位会带来疫病也能治愈的女神。","阿蒙霍特普三世曾制作数百尊塞赫麦特像，今天散布世界多馆，所以单尊不罕见；开罗的价值在本土序列和与王朝宗教工程的比较。","看狮鬃刻法；找日盘与眼镜蛇；辨认手中生命符号；比较动物头和女性身体的接合。"],

  ["akhenaten-colossus","amarna","阿肯那顿巨像","Colossal Statue of Akhenaten","第十八王朝阿玛尔纳工坊","约公元前 1353—1336 年","Colossal statue of King Amenhotep IV Akhenaten00 (2).jpg","绝对不可错过","稀世珍品","长脸、厚唇、窄胸与突出的腹部，并不是雕刻家突然不会做理想王像；新宗教需要一种一眼就与旧王权断开的身体。","卡纳克阿顿神庙的巨像被拆毁后仍有多件残存，开罗保存其中最关键的一组；不是只有一尊，却是理解阿玛尔纳风格诞生的成组原件。","从低处看长脸；观察胸腹的性别模糊；找交叉双臂上的权杖；比较同组不同头像的变形程度。"],
  ["amarna-family","amarna","阿肯那顿一家祭拜阿顿石碑","Akhenaten and His Family under the Aten","第十八王朝阿玛尔纳工坊","约公元前 1340 年","Akhenaten Nefertiti and their children.jpg","绝对不可错过","稀世珍品","太阳光线末端长出小手，把生命符号递到王室鼻前；同时孩子坐在父母膝上。宇宙宗教与家庭亲密，被压进一块家用祭坛。","同类阿玛尔纳家庭祭坛石碑有若干件，柏林也有名作；开罗这一件的价值在图像类型与本馆巨像、头像能组成完整语境，不能说成唯一。","数阿顿光线末端的小手；找生命符号；看孩子动作；比较王后与国王的身体语言。"],
  ["amarna-princess","amarna","阿玛尔纳公主头像","Head of an Amarna Princess","第十八王朝王室工坊","约公元前 1340 年","Amarna princess head Cairo.jpg","重点推荐","重要藏品","拉长的头骨和几乎未完成的表面，让她像一个风格实验。别急着诊断疾病：这首先是阿玛尔纳宫廷共享的造型语言。","阿玛尔纳公主头像与石膏模型散见多馆，单件不是孤例；其价值在工作室过程和王室风格如何被复制。","看后脑延伸；观察眼鼻完成度；找工具痕；比较巨像的夸张与小头像的柔软。"],
  ["painted-floor","amarna","阿玛尔纳宫殿彩绘地板","Painted Floor from Amarna","第十八王朝宫廷画工","约公元前 1340 年","By ovedc - Egyptian Museum (Cairo) - 152.jpg","重点推荐","稀世珍品","脚下本该是建筑最低处，却画满池塘、鱼鸟与纸莎草；王室每走一步，都像穿过一块被永久驯服的尼罗河湿地。","大型新王国宫殿地板很少保留原彩，开罗这组又经历发现、破坏与复原；珍贵的是建筑装饰存量和考古史，不是画面独一无二。","找鱼鸟朝向；看花叶如何重复；辨认修复接缝；退远想象原房间尺度。"],

  ["yuya-thuya-masks","yuya","尤亚与图亚金面具","Masks of Yuya and Thuya","第十八王朝葬仪工坊","约公元前 1387—1350 年","Yuya and Thuya masks.jpg","绝对不可错过","稀世珍品","王后泰伊的父母各有一张金脸，个人差异与接近王室等级的葬仪在这里同时保留。","KV46 在图坦卡蒙墓发现前是帝王谷保存最完整的墓葬之一；面具、棺椁、家具与日用品能重新组成一整套葬礼，价值远大于孤立金器。","并排比较两张脸；看金箔而非实心金；找假发与项圈；观察面具如何贴合木乃伊头部。"],
  ["yuya-coffin","yuya","尤亚嵌金棺椁组","Coffins of Yuya","第十八王朝葬仪工坊","约公元前 1387—1350 年","Yuya coffin Cairo Museum.jpg","绝对不可错过","稀世珍品","人形外壳、金箔面孔、神祇和文字层层套合，把尤亚从尸体逐步改写成可复生者。","许多新王国墓只剩零散棺板，KV46 则保留夫妇多层棺具与木乃伊；完整套合关系是它比单件华丽棺材更稀有的原因。","顺层级辨认外棺与内棺；看金箔覆盖范围；找保护女神翅膀；读竖向咒文如何包住身体。"],
  ["yuya-chariot","yuya","尤亚墓葬战车","Chariot from the Tomb of Yuya and Thuya","第十八王朝车匠","约公元前 1387—1350 年","Chariot of Yuya Cairo.jpg","重点推荐","稀世珍品","木轮、皮革与轻薄车架本来最怕时间，墓室却把一台真实交通工具留了下来；它让壁画里的飞驰战车突然有了工程重量。","古埃及完整战车存量很少，最著名一组来自图坦卡蒙墓且已迁往 GEM；尤亚墓战车因此是解放广场馆仍能独立成立的罕见实物线。","数轮辐；看车斗深度；找皮革或编结痕迹；想象马匹牵引点与乘员站位。"],
  ["thuya-chair","yuya","图亚墓葬镀金座椅","Gilded Chair from the Tomb of Yuya and Thuya","第十八王朝家具工坊","约公元前 1387—1350 年","Chair of Thuya Cairo.jpg","重点推荐","稀世珍品","别让金色遮住木工：靠背、腿足、榫卯和编座，说明贵族家具先要能够承重，才在表面变成身份图像。","新王国木家具常因有机材料腐朽而只剩图像，KV46 成组保留多件座椅与箱柜；它们的稀有度来自墓组完整和工艺可复原。","看椅腿动物造型；找榫卯连接；辨认金箔与彩绘；观察靠背图像服务谁的身份。"],

  ["psusennes-mask","tanis","普苏森尼斯一世金面具","Gold Mask of Psusennes I","第二十一王朝王室金匠","约公元前 1000 年","Psusennes I mask.jpg","绝对不可错过","稀世珍品","它常被图坦卡蒙面具的名气挡住，但不该被当成替代品。更克制的蓝金花纹和安静脸型，属于千年之后仍在重写王室永生的另一套时代语言。","塔尼斯王墓是极少数未遭彻底盗掘的埃及王室墓群；普苏森尼斯面具与银棺、珠宝成组留存，世界范围内能比较的完整王室金面具本就屈指可数。","看青金石色带与金面；找眉眼镶嵌；比较面具厚度与面部塑形；别用图坦卡蒙的纹样套读。"],
  ["psusennes-coffin","tanis","普苏森尼斯一世银棺","Silver Coffin of Psusennes I","第二十一王朝王室银匠","约公元前 1000 年","Silver coffin of Psusennes I.jpg","绝对不可错过","稀世珍品","古埃及银常比金更难取得，这具银质人形棺直接宣布了一种更难汇集的王室资源。","古埃及王室贵金属棺大多被熔毁，完整银质法老棺几乎没有第二件同等级实例；它与塔尼斯原墓、金面具和珠宝的组合进一步提高稀有度。","看银面反光与氧化；找金质头巾细节；观察眼部镶嵌；比较金银在埃及资源网络中的来源。"],
  ["sheshonq-coffin","tanis","舍顺克二世鹰首银棺","Falcon-Headed Silver Coffin of Shoshenq II","第二十二王朝王室银匠","约公元前 887—885 年","Shoshenq II silver coffin.jpg","绝对不可错过","稀世珍品","鹰首神索卡取代国王的人脸，银棺把舍顺克二世的身体直接送入神的外形。","完整古埃及银棺本已极少，这件又采用鹰首神形；与普苏森尼斯人形银棺同馆比较，能看到塔尼斯王墓群内部并非复制一套模板。","看鹰喙弧线；找眼部镶嵌；比较银板接合；与隔壁人形银棺对照神化策略。"],
  ["merneptah-stele","tanis","梅尔奈普塔赫胜利碑（以色列碑）","Merneptah Stele (Israel Stele)","第十九王朝王室铭文工坊","约公元前 1208 年","Merneptah Stele.jpg","绝对不可错过","稀世珍品","这块碑的大部分在歌颂对利比亚的胜利，真正改变后世研究的却是末尾短短一行：它包含目前已知最早的“以色列”域外文字记录。","它不是唯一埃及胜利碑，却因这条最早域外称名成为埃及史、黎凡特史与圣经考古共同使用的基准原件；没有同年代同证据功能的第二碑。","先确认大段正文与关键一行的比例；找表示族群而非城市的限定符；注意碑石原先属于阿蒙霍特普三世；分清铭文宣传与历史事实。"]
];

// Card copy is independently written from the detail-page viewing layer.
const egyptianCardSummaries = {
  "narmer":"王名在两面重复，白冠与红冠轮流出现，国王的身体始终压过周围人物：这块神庙仪式石板把身份、地域和暴力组织成一套王权宣称。它的珍贵之处不只是年代早，而是完整保存了具名统治者与这套图像组合。",
  "min-palette":"这块片岩处在日用调色工具转化为神庙献礼的中间阶段，器物功能和宗教图像正在同一表面分开。",
  "king-den":"手掌大的象牙同时承担王名、纪年和征服图像，是早期埃及把行政记录变成国家记忆的直接原件。",
  "djoser":"现存最早的等身王室雕像之一，把金字塔建造者的身体封进一种能够在墓中永久接受祭祀的姿态。",
  "khufu":"建造最大金字塔的胡夫只剩一尊约七厘米高、身份能够可靠确认的完整小像，尺度反差本身就令人难忘。",
  "khafre":"庄严平静的国王与身后的荷鲁斯神鹰合成一个构图，王权与神权直到观众绕到侧面才完全显现。",
  "menkaure-triad":"哈索尔、孟卡拉与地方化身共同迈步，把神、国王和国土组织成一幅紧密的政治图像。",
  "rahotep-nofret":"石英与水晶让两双眼睛在四千五百多年后仍有湿润反光，完整彩绘又把一对墓中夫妻带回近乎真人的状态。",
  "kaaper":"古王国少见的真人尺度木像保住了官员的体重、年龄和眼神，身体因此比理想化石雕更接近日常经验。",
  "seneb":"两个孩子填入父亲盘腿后留下的空间，巧妙构图让身体差异、家庭亲密与社会身份同时成立。",
  "meidum-geese":"六只鹅以不同动作和羽纹组成一段异常安静的湿地观察，是古王国墓室绘画中保存最出色的自然片段之一。",
  "hesyra":"极少存世的早期大型木浮雕以多块连续人物板记录同一官员，也保存了埃及精英形象尚未定型时的锐利线条。",
  "pepi-copper":"真人尺度的王像由铜片锤打、铆接成形，是古埃及现存最早的大型金属雕像组，工艺地位没有同代替代品。",
  "seated-scribe":"松弛的胸腹、摊开的纸草和等待口述的眼神，让古王国官僚的权力以工作状态而非英雄姿态出现。",
  "ti-relief":"河马、芦苇和船工共同表现墓主人控制危险水域的能力，田园场景背后是一套死后继续运转的秩序。",
  "mentuhotep":"强烈的黑白色块与粗壮身体为重新统一埃及的国王制造政治重启，也成为中王国开端最醒目的王权形象。",
  "amenemhat-sphinx":"写实而疲惫的王脸配上真正狮鬃，后世国王又反复改刻姓名，使同一石面叠加了数轮权力占用。",
  "black-pyramidion":"这块完整刻铭的顶石曾位于黑金字塔最高处，以太阳、双眼和铭文把整座陵墓接入王的复生工程。",
  "senusret-head":"下垂眼睑、突出双耳与紧闭嘴角改变了传统理想王脸，把负担和警觉塑造成新的统治气质。",
  "meketre-granary":"木制人物把畜群、监督和记录组合成可见的财产统计流程，一座墓因此保存了中王国行政怎样实际运作。",
  "bersha-soldiers":"成排士兵、盾牌和长矛构成罕见完整的中王国木制部队，手工差异仍藏在严整军事节奏之中。",
  "ahhotep-jewels":"王后的金饰把军事荣誉、女性权力和新王国建立前夕的战争史串在一起，完整墓葬来源使它超越普通珠宝。",
  "ahmose-dagger":"一对具名夫妻以肩膀、双手和铭文连接私人关系与公共官职，展现新王国精英如何经营共同形象。",
  "thutmose-iii":"埃及最著名的征服者却拥有年轻柔和的王脸，神圣稳定而非战场凶狠才是这套肖像宣示力量的方法。",
  "amenhotep-tiye":"七米级夫妻巨像让泰伊王后与国王等大并坐，尺度直接公开了她在十八王朝非同寻常的政治地位。",
  "amenhotep-meretseger":"眼镜蛇形女神从王身后升起，地方山岳神、底比斯地景与王室庇护被雕进同一块石头。",
  "amenhotep-hapu":"一位高级官员以书吏身份建立公共形象，死后又被奉为智慧与治疗之神，个人权威的升级过程有实物可循。",
  "sekhmet":"狮首女神的危险被压进平静坐姿与大规模重复生产，王室试图以秩序安抚一位兼具疫病与治愈力量的神。",
  "akhenaten-colossus":"长脸、窄胸和突出的腹部以巨像尺度宣布宗教断裂，是阿玛尔纳革命最无法忽视的一组身体证据。",
  "amarna-family":"阿顿光线以小手把生命递给亲密相处的王室家庭，宏大宇宙宗教因此进入一块家用祭坛。",
  "amarna-princess":"拉长头骨与未完成表面保存了阿玛尔纳工作室的造型实验，也说明王室成员共享一套被反复训练的风格。",
  "painted-floor":"王宫地板把鱼鸟、池塘和纸莎草铺在脚下，罕见原彩保存了王室以建筑驯服尼罗河湿地的想象。",
  "yuya-thuya-masks":"两张金面仍保留个人差异，并与棺椁、家具和日用品共同来自一座近乎完整的贵族墓葬。",
  "yuya-coffin":"多层人形棺具、金箔、神祇和咒文仍保持套合关系，使一整套新王国复生程序能够被逐层读懂。",
  "yuya-chariot":"易腐的木轮、皮革和轻薄车架从墓中完整留下，让壁画里的战车第一次呈现真实的工程结构与重量。",
  "thuya-chair":"镀金表面之下保留了椅腿、榫卯和编座，新王国贵族家具的承重技术与身份展示仍是一件完整实物。",
  "psusennes-mask":"这张完整王室金面具来自塔尼斯未遭彻底盗掘的墓群，以蓝金秩序呈现不同于图坦卡蒙时代的永生语言。",
  "psusennes-coffin":"资源比黄金更难取得的白银被制成完整法老棺，目前几乎找不到同等级的第二件古埃及王室实例。",
  "sheshonq-coffin":"罕见完整银棺采用鹰首神形，同馆的人形银棺恰好构成对照，显示塔尼斯王室葬具并未复制单一方案。",
  "merneptah-stele":"碑文末尾一行保存了目前已知最早的域外“以色列”文字记录，使这块胜利碑成为多个历史领域共同使用的基准原件。"
};

const egyptianImageOverrides = {
  "min-palette":"Mudstone palette with hieroglyphs in relief. Late Predynastic, Naqada III. 3250-3100 BC. From El-Amra.jpg",
  khufu:"Ivory statuette of Khufu from Abydos, 2551-2528 BCE; Egyptian Museum, Cairo (2).jpg",
  "rahotep-nofret":"Ägyptisches Museum Kairo 2016-03-29 Rahotep Nofret 01.jpg",
  seneb:"Seneb and wife statue.jpg",
  "pepi-copper":"Statues of Pepi I from Hierakonpolis, Sixth Dynasty, 2289-2255 BCE; Egyptian Museum, Cairo.jpg",
  "seated-scribe":"EgyptianScribe.jpg",
  "ti-relief":"Mastaba Ti 09.jpg",
  mentuhotep:"Ägyptisches Museum Kairo 2019-11-09 Mentuhotep II 02.jpg",
  "amenemhat-sphinx":"Sphinxes of Amenemhat III.jpg",
  "black-pyramidion":"Pyramidion of the Pyramid of Amenemhet III at Dahshur, 1842-1794 BCE; Egyptian Museum, Cairo (2).jpg",
  "senusret-head":"Senusret III head Legrain.png",
  "meketre-granary":"GD-EG-Caire-Musée121.JPG",
  "bersha-soldiers":"Mesehtisoldiers.JPG",
  "ahhotep-jewels":"The magnificent jewelery of the Pharaohs (Queen Ahhotep, 17th Century B.C.) Cairo Museum, Egypt (13) (1904) - front - TIMEA.jpg",
  "ahmose-dagger":"By ovedc - Egyptian Museum (Cairo) - 105.jpg",
  "thutmose-iii":"Statue of Thutmose III from Deir al-Madina, 18th Dynasty, 1479-1425 BCE; Egyptian Museum, Cairo (2).jpg",
  "amenhotep-tiye":"Colossal statue of Amenhotep III and Queen Tiye, 1387-1350 BCE; Egyptian Museum, Cairo (7).jpg",
  "amenhotep-hapu":"Kairo Museum Statue Amenophis Sohn des Hapu 01.jpg",
  "amenhotep-meretseger":"By ovedc - Egyptian Museum (Cairo) - 099.jpg",
  sekhmet:"Egyptian Museum Cairo statue.jpg",
  "amarna-family":"GD-EG-Caire-Musée066.JPG",
  "amarna-princess":"Amarna princess.jpg",
  "painted-floor":"By ovedc - Egyptian Museum (Cairo) - 152.jpg",
  "yuya-thuya-masks":"By ovedc - Egyptian Museum (Cairo) - 294.jpg",
  "yuya-coffin":"Outer KV46 coffin of Yuya.jpg",
  "yuya-chariot":"Chariot of Yuya from Tomb KV46.jpg",
  "thuya-chair":"Gilded Chair, Egyptian Museum, al-Qāhirah, CG, EGY (47856880572).jpg",
  "psusennes-coffin":"Silver Coffin of Psusennes I.jpg",
  "sheshonq-coffin":"Silver Hawk-Headed Coffin of Sheshonq II.jpg",
  "merneptah-stele":"Merenptah stele.jpg"
};

museumData.egyptian = {
  id:"egyptian",editorialCapacity:40,cardCopyContract:"independent-v1",contentUpdatedAt:"2026-07-22",city:"开罗 · 埃及",zh:"埃及博物馆（解放广场）",en:"The Egyptian Museum in Cairo",
  ...museumRatings.egyptian,
  verdict:"即使明星藏品不断迁出，这里仍把埃及国家诞生、金字塔时代雕塑、完整贵族墓葬与塔尼斯王室金银葬具压在同一座历史馆舍里。",
  hero:emImage("CairoEgyptMueseum.jpg"),contentFile:"./research/content/egyptian.md",official:emOfficial,visit:emVisit,
  intro:[
    "先把三个名字分清：本页只讲解放广场的埃及博物馆，不是吉萨的大埃及博物馆（GEM），也不是福斯塔特的埃及国家文明博物馆（NMEC）。图坦卡蒙整套珍宝正集中到 GEM，22 具皇家木乃伊已在 2021 年迁往 NMEC；它们不会被借回来替这座馆撑评分。",
    "剩下的馆藏仍足以决定一次旅行。纳尔迈调色板站在国家与文字形成的门槛；左塞尔、胡夫、哈夫拉、孟卡拉、拉霍特普与诺芙蕾特构成别处难以复制的金字塔时代原件群；尤亚与图亚墓把棺具、面具、家具和战车留在同一语境；塔尼斯又以两具银棺和王室金面具补上一条独立高峰。",
    "四十件是一日上限附近的内容库，不是按展柜顺序抄目录。老馆展陈和标签仍在更新，部分对象可能临时调柜；出发前以馆方页面与当天现场为准，遇到迁展不要为集齐清单反复折返。"
  ],
  chapters:[
    {id:"dawn",number:"01",title:"埃及成为一个国家时，国王怎样让人看见自己的权力",intro:"调色板与象牙标签把南北统一、王名、战争和早期文字留在几件可以亲眼看到的原物上。"},
    {id:"pyramids",number:"02",title:"金字塔时代为什么不只剩下金字塔",intro:"王、官员、家庭、动物和木铜石材料，共同把古王国从建筑尺度拉回人的身体。"},
    {id:"middle",number:"03",title:"重新统一以后，国王为什么开始显得疲惫",intro:"中王国用新的王脸、墓葬模型与金字塔顶石，把行政、焦虑和复生重新组织。"},
    {id:"empire",number:"04",title:"帝国如何把黄金、巨像与专业官僚变成秩序",intro:"从王后军功金饰到七米夫妻像，新王国的力量既在战争，也在技术与职位。"},
    {id:"amarna",number:"05",title:"阿肯那顿怎样让整个王室身体突然变形",intro:"巨像、家庭祭坛、公主头像与宫殿地板，显示宗教革命如何进入每一种表面。"},
    {id:"yuya",number:"06",title:"一座几乎完整的墓，能比一件金器多告诉我们什么",intro:"尤亚与图亚墓让面具、棺椁、交通和家具重新组成一次真实葬礼。"},
    {id:"tanis",number:"07",title:"图坦卡蒙之后，为什么还要看塔尼斯的金与银",intro:"晚期王室葬具不是盛世余响；银棺、金面具与一块关键碑文各自改写资源与历史。"}
  ],
  works:egyptianWorks.map((w,i)=>({
    id:w[0],ch:w[1],zh:w[2],en:w[3],by:w[4],date:w[5],place:"解放广场主馆；具体展柜与可见状态须现场核验",tag:w[7],significance:w[8],time:w[7]==="绝对不可错过"?"10 分钟":"7 分钟",
    image:emImage(egyptianImageOverrides[w[0]] || w[6]),imageSource:emImageSource(egyptianImageOverrides[w[0]] || w[6]),imageCaption:`${w[2]}对象图；请以现场标签确认展柜与编号。`,source:w[0]==="narmer"?"https://egymonuments.gov.eg/en/collections/narmer-palette-1/":w[0]==="khafre"?"https://egymonuments.gov.eg/collections/khafra-statue-2/":w[0]==="menkaure-triad"?"https://egymonuments.gov.eg/en/collections/menkaura-triads-2/":w[0]==="yuya-thuya-masks"?"https://egymonuments.gov.eg/collections/masks-of-yuya-and-thuya-6/":emOfficial,
    look:w[9],story:w[10],again:w[11],preciousWhy:w[10],cardSummary:egyptianCardSummaries[w[0]],deepFacts:w[11].split("；")
  }))
};
