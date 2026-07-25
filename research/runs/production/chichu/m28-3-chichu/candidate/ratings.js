// Meowseum production rating source.
const museumRatings = {
  alhambra: {
    score: 95,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为格拉纳达旅行主因",
    travelAction: "即使暂时拿掉格拉纳达其他景点，只为阿尔罕布拉与赫内拉利费来到这座城市，这趟旅行仍然成立；第一次应完整预留至少三到四小时。",
    scoreReason: "纳斯里德宫殿仍留在自己的城墙、行政前区、朝会轴线、私人宫室、水网与山地景观中。阿尔卡萨瓦保存王朝的军事起点，Generalife 则把休憩宫、灌溉和持续耕作的园圃连成另一套文化景观；1492 年后的王室改造又把征服与连续占用变成可以现场比较的历史层。",
    withinBandReason: "位于 90 档的 93–95 段上沿：完整纳斯里德宫城本身稳定通过专程旅行检验，科马雷斯、狮子宫与 Generalife 又形成连续高峰；它明显高于依赖三条小型永久作品线的地中美术馆 92。之所以不进入维也纳 96、开罗 97或三座综合巨馆 98，是因为核心价值高度集中在一处建筑文明与同一历史现场，各节点彼此增强，却不能被重复算成多条独立收藏线。",
    limitations: "本条目只覆盖 Alhambra 与 Generalife 官方纪念建筑群，不把 Albaicín 或格拉纳达其他遗址并入。纳斯里德宫殿按票面时段限流，错过时段不能进入；各分区通常只允许进入一次，部分空间会因保护、修复或路线管理临时关闭。",
    dedicatedTrip: true,
    rareAssets: ["whole","comares-facade","myrtles","ambassadors","ambassadors-ceiling","lions-court","lion-fountain","kings-hall","two-sisters","partal","generalife-palace","canal-court"],
    calibratedAgainst: [],
    calibratedAt: "2026-07-21",
    sources: [
      "https://whc.unesco.org/en/list/314/",
      "https://www.alhambra-patronato.es/en/discover/alhambra-y-generalife",
      "https://www.alhambra-patronato.es/en/discover/alhambra-y-generalife/buildings-and-places"
    ]
  },
  egyptian: {
    score: 97,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为开罗旅行主因",
    travelAction: "即使暂时拿掉吉萨金字塔、GEM 与开罗其他景点，只为解放广场埃及博物馆来到开罗，这趟旅行仍然成立；第一次至少留半天，最好预留一整天。",
    scoreReason: "纳尔迈调色板在早期文字与统一王权形成史上没有等效替代；左塞尔、胡夫、哈夫拉、孟卡拉及拉霍特普与诺芙蕾特组成世界级金字塔时代雕塑群；尤亚与图亚墓保留面具、棺具、家具与战车的近完整语境；普苏森尼斯一世和舍顺克二世的银棺、金面具与塔尼斯珍宝又形成独立王室葬具高峰。四条主线中任何一条临时不可见，另外几条仍能通过专程旅行检验。",
    withinBandReason: "位于 90 档的 96–97 段：多条收藏线能够分别支撑专程旅行，整体强于只靠一组场域作品进入 92 的地中美术馆，也比维也纳 96 更集中地保存一个文明最早、最关键的一手原件。它不与卢浮宫、大都会和大英并列 98，是因为文明与媒介跨度更集中，且图坦卡蒙完整珍宝和皇家木乃伊两条最著名主线已经迁往 GEM 与 NMEC。",
    limitations: "本条目只覆盖开罗解放广场主馆，不把大埃及博物馆（GEM）或埃及国家文明博物馆（NMEC）并入。图坦卡蒙珍宝正集中迁往 GEM，22 具皇家木乃伊已于 2021 年迁往 NMEC；老馆陈列继续调整，单件可见状态须在出发前和现场复核。",
    dedicatedTrip: true,
    rareAssets: ["narmer","khufu","khafre","menkaure-triad","yuya-thuya-masks","psusennes-coffin","sheshonq-coffin"],
    calibratedAgainst: [],
    calibratedAt: "2026-07-21",
    sources: [
      "https://egymonuments.gov.eg/en/museums/egyptian-museum/",
      "https://mota.gov.eg/ar/الآثار-والمتاحف/المجلس-الأعلى-للآثار/دليل-متاحف-الآثار-المفتوحة-للزيارة-جديد/المتحف-المصري-بالتحرير/",
      "https://mota.gov.eg/ar/هيئة-تنشيط-السياحة/أنشطة-الهيئة/الفعاليات-الترويجية/فعاليات-ترويجية-تنظمه-الهيئة/موكب-المومياوات-الملكية/"
    ]
  },
  chichu: {
    "score": 79,
    "scoreBand": "70–79 · 可去可不去",
    "shortAction": "直岛行程中优先安排",
    "travelAction": "如果已经安排直岛行程，地中美术馆应列为优先目的地，并预留至少半天；若只按稀世名作密度决定旅行，它不足以单独支撑一次前往直岛的行程。",
    "scoreReason": "安藤忠雄把建筑大半埋入山体，并为莫奈、詹姆斯·塔瑞尔和沃尔特·德·玛利亚分别设计永久空间；路线、自然光、作品与天气共同构成高度不可复制的现场。20项中有11项达到重要藏品，但没有一项通过“稀世珍品”的全球不可替代性硬门，因此最高只能停在70档。",
    "withinBandReason": "位于70档上限：整体现场、三位艺术家的永久空间和从早期到晚期的塔瑞尔序列，使它比一般建筑型小馆更完整，也比同为场域体验主导的江之浦测候所更集中地把重要原作、建筑与光线锁在一起；但收藏规模很小，莫奈和塔瑞尔均有明确可比组，建筑体验也不能重复计作多条珍品线，所以不能跨入80档。",
    "limitations": "馆藏集中于三位艺术家，20项中多项是同一建筑的观看节点，不能按20件独立名作理解。预约、开放日、维护与塔瑞尔夜间项目会变化；馆内摄影规则和当天作品状态须以馆方为准。",
    "dedicatedTrip": false,
    "rareAssets": [],
    "sources": [
      "https://benesse-artsite.jp/en/art/chichu.html",
      "https://benesse-artsite.jp/en/contact/press/BASN_MediaKit_Jan2016_GenegalPress_eng.pdf",
      "https://benesse-artsite.jp/en/story/20210611-1671.html",
      "https://benesse-artsite.jp/en/story/20170215-770.html",
      "https://www.benesse-artsite.jp/en/calendar/monthly.html"
    ],
    "calibratedAgainst": [],
    "calibratedAt": "2026-07-23"
  },
  getty: {
    score: 89,
    scoreBand: "80–89 · 应主动列入行程",
    shortAction: "在洛杉矶应主动留出半天",
    travelAction: "如果已经来到洛杉矶，应稳定留出半天给 Getty Center；它足以改变同城行程，但还不足以让普通游客只为这一馆专程来到洛杉矶。",
    scoreReason: "《鸢尾花》是梵高圣雷米时期的核心名作；西蒙·马蒂尼、鲁本斯、伦勃朗、马奈与莫奈形成稳定的欧洲绘画线，法国装饰艺术、稀有手稿、老大师素描和早期摄影又提供数条可独立成立的强项。Richard Meier 建筑与 Robert Irwin 中央花园把参观变成完整现场，但场所体验只计一次，不与馆藏重复加分。",
    withinBandReason: "位于 80 档最上端：它比依靠单一稀有核心的 80 档下段更深，也比一般同城必去馆更完整；但真正达到对象级不可替代的核心数量和成组密度，仍不足以跨进 90 档。尤其手稿、素描和摄影必须轮换，2026 年又有大面积展厅改造，因此定为 89。",
    limitations: "本条目只覆盖 Brentwood 的 Getty Center，不把 Getty Villa 的希腊、伊特鲁里亚与罗马古物并入评分或清单。纸本、手稿和摄影长期轮换；截至 2026 年 7 月，东馆、北馆及南馆部分展厅因改造关闭，出发前必须核验当天开放与在展作品。",
    dedicatedTrip: false,
    rareAssets: ["irises", "machine-argent", "saint-luke"],
    calibratedAgainst: [],
    calibratedAt: "2026-07-21",
    sources: [
      "https://www.getty.edu/museum/paintings/",
      "https://www.getty.edu/museum/sculpture-decorative-arts/",
      "https://www.getty.edu/visit/center/"
    ]
  },
  anchorage: {
    score: 74,
    scoreBand: "70–79 · 可去可不去",
    shortAction: "理解阿拉斯加时值得顺路参观",
    travelAction: "如果已经来到安克雷奇，又希望在半天内建立对阿拉斯加历史、北方艺术与 Alaska Native 文化的整体认识，可以安排参观；时间紧或主要追求艺术名作时可以略过。",
    scoreReason: "馆内把 Art of the North、Alaska Exhibition 与 Smithsonian Arctic Studies Center 的长期借展文化遗产放在同一套北方叙事中。它的优势是区域解释力和 Indigenous knowledge 的现场呈现，不是艺术名作密度，也没有经过对象级比较确认的稀世珍品组。",
    withinBandReason: "位于 70 档中段：主题集中、地域权威性和策展连贯性使它高于一般地方综合馆；但核心价值主要来自解释与整合，长期借展也不能自动等同于本馆的稳定珍品实力，因此定为 74。",
    limitations: "本条目只覆盖 625 C Street 主馆。Smithsonian Arctic Studies Center 的对象属于长期借展，不是 Anchorage Museum 馆藏；艺术馆藏和历史对象会轮换，清单不等于当天全部在展。",
    dedicatedTrip: false,
    rareAssets: [],
    calibratedAgainst: [],
    calibratedAt: "2026-07-20",
    sources: [
      "https://www.anchoragemuseum.org/collections/",
      "https://www.anchoragemuseum.org/exhibits/art-of-the-north/",
      "https://www.anchoragemuseum.org/exhibits/living-our-cultures-sharing-our-heritage-the-first-peoples-of-alaska/"
    ]
  },
  british: {
    score: 98,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为伦敦旅行主因",
    travelAction: "即使暂时拿掉伦敦的其他博物馆和景点，只为大英博物馆来到这座城市，这趟旅行仍然成立；第一次至少留半天，真正看懂需要分两次。",
    scoreReason: "罗塞塔石碑、亚述宫殿浮雕、帕特农雕塑、乌尔王墓群、萨顿胡船葬、刘易斯棋子、《女史箴图》和贝宁宫廷艺术等，不是一条文明高峰，而是多条彼此独立的稀世珍品线。它还能把文字、帝国、宗教、贸易、考古与殖民收藏放在同一座建筑中比较。",
    withinBandReason: "位于 90 档上端，与卢浮宫和大都会同为 98：单件和成组珍品密度足以决定一次旅行，也不存在可靠依据给三者硬排一分高下。拥挤、巨大选择成本、纸本轮换、展厅阶段性关闭与许多对象脱离原境，使它不取满分。",
    limitations: "本条目只覆盖 Great Russell Street 主馆。藏品不等于当天在展；《女史箴图》及版画素描尤其受光照限制。帕特农、贝宁等对象的取得与归属存在持续争议，正文会把来源链和争议作为理解对象的一部分，而不是脚注式回避。",
    dedicatedTrip: true,
    rareAssets: ["rosetta","lion-hunt","standard-ur","parthenon-horse","sutton-helmet","admonitions","benin-plaque"],
    calibratedAgainst: [],
    calibratedAt: "2026-07-20",
    sources: [
      "https://www.britishmuseum.org/about-us/british-museum-story/history",
      "https://www.britishmuseum.org/about-us/british-museum-story/collecting-histories",
      "https://www.britishmuseum.org/blog/12-things-not-miss-british-museum"
    ]
  },
  enoura: {
    score: 78,
    scoreBand: "70–79 · 可去可不去",
    shortAction: "兴趣匹配时值得专门绕行",
    travelAction: "如果已经在东京、箱根或小田原一带，又喜欢杉本博司、建筑、茶室或日本庭园，值得拿出大半天；但按珍品标准，它还不足以成为普通游客专程来到小田原的理由。",
    scoreReason: "一百米夏至画廊、七十米冬至隧道、光学硝子舞台、石舞台与迁移重组的历史构件，构成高度不可替代的总体现场；但这里没有一组足以决定普通艺术旅行的稀世馆藏，价值主要来自空间、节气与行走的共同体验。",
    withinBandReason: "位于 70 档上段：整体性、作者辨识度和三小时低密度参观体验远强于普通小型艺术空间，对兴趣匹配者也值得绕行；但价值仍主要由总体现场而非稀世馆藏支撑，建筑体验不能重复计算或单独帮助跨进 80 档，因此定为 78。",
    limitations: "必须预约，未满 12 岁不能入场；竹林为未铺装下坡路，雨天或湿滑时可能限制开放。它也不是气象科学展馆，期待大量室内名作会失望。",
    dedicatedTrip: false,
    rareAssets: [],
    calibratedAgainst: [],
    calibratedAt: "2026-07-20",
    sources: ["https://www.odawara-af.com/en/enoura/?site=pc","https://www.odawara-af.com/en/enoura/ticket/","https://www.odawara-af.com/admin/wp-content/uploads/2017/06/press-enoura-observatory-opens-to-public.pdf"]
  },
  muxin: {
    score: 81,
    scoreBand: "80–89 · 应主动列入行程",
    shortAction: "在乌镇应主动安排",
    travelAction: "如果已经来到乌镇，应稳定留出两到三小时；但对普通艺术旅行者，它还不足以单独支撑一次前往乌镇的旅行。",
    scoreReason: "馆方保存木心六百余件绘画和数千份文学手稿，能把绘画、文学与个人经历放在同一条创作线上；其中约六十六纸、132 面的《狱中手稿》是一组有明确历史处境、材料限制与国际展览史的罕见完整作品。",
    withinBandReason: "位于 80 档下段：《狱中手稿》这一组稀有核心足以改变乌镇当日安排；建筑和完整个人档案提升理解，却不能重复算成第二批珍品。其他绘画与手稿尚未形成第二条同等级高峰，对非木心读者的普遍吸引力也有限，因此定为 81。",
    limitations: "这是一座轮换强烈的个人美术馆，清单中的馆藏不等于当天在展。2026 年 1 月馆方曾公告空间升级改造临时闭馆，后续安排另行发布；出发前必须核验最新开放状态。",
    dedicatedTrip: false,
    rareAssets: ["prison-notes"],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
    calibratedAt: "2026-07-19",
    sources: [
      "https://www.artcm.cn/customer/exhibition_detail/?exhibition_id=67",
      "https://yalebooks.co.uk/book/9780300090758/the-art-of-mu-xin/",
      "https://www.alexandramunroe.com/exhibitions/the-art-of-mu-xin-landscape-paintings-and-prison-notes"
    ]
  },
  louvre: {
    score: 98,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为旅行主因",
    travelAction: "即使巴黎的其他行程全部删掉，只为卢浮宫来到这座城市，这趟旅行仍然成立。",
    scoreReason: "核心名单已有多件跨文明稀世珍品；60 件内容库又能用宫殿建筑、王室旧藏、革命接收、考古分配、购买与捐赠解释这家馆如何形成。扩容增加选择与理解深度，不自动抬高原有 98 分。",
    withinBandReason: "位于 90 档上端：单件杰作的全球辨识度、文明跨度和宫殿本身都接近最高水平；拥挤、巨大尺度、作品轮换与局部关闭使一次参观很难稳定获得全部价值，因此不取满分。",
    limitations: "最大限制是人流、距离和选择成本。第一次至少留半天，并接受不可能一次看完。",
    dedicatedTrip: true,
    rareAssets: ["victory", "venus", "mona", "liberty", "hammurabi", "lamassu", "basin"],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
    calibratedAt: "2026-07-19",
    sources: [
      "https://www.louvre.fr/en/explore",
      "https://collections.louvre.fr/en/"
    ]
  },
  seattle: {
    score: 75,
    scoreBand: "70–79 · 可去可不去",
    shortAction: "可去可不去",
    travelAction: "已经来到西雅图、又对现代绘画或西北海岸原住民艺术感兴趣时，可以给市中心主馆安排半天；普通游客跳过也不会形成重大遗憾。",
    scoreReason: "市中心主馆的《海变》是波洛克进入滴画时期的关键过渡作品，罗斯科《第 11 号》也能解释其成熟语言的形成，再加上西北海岸原住民艺术构成明确地域特色；但目前没有一组足以改变普通游客行程的稀世珍品。",
    withinBandReason: "位于 70 档中段上沿：《海变》是一件真正重要的作品，其他名家作品与地域收藏提供了完整半日体验；但名家名单不等于连续的代表作密度，西北海岸收藏也尚无对象级证据支持世界级珍品组，因此定为 75。",
    limitations: "本评分和 20 件清单只覆盖 1300 First Avenue 的 downtown 主馆，不把 Seattle Asian Art Museum 或 Olympic Sculpture Park 纳入加分。常设馆藏会轮换，出发前需要核验具体作品是否在展。",
    dedicatedTrip: false,
    rareAssets: [],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
    calibratedAt: "2026-07-19",
    sources: [
      "https://www.seattleartmuseum.org/art-and-artists/sams-collection",
      "https://art.seattleartmuseum.org/collections"
    ]
  },
  met: {
    score: 98,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为旅行主因",
    travelAction: "它本身就足以成为来到纽约的主要理由，而且值得分两次参观。",
    scoreReason: "精选 20 件中有 8 件达到稀世珍品级别；全馆以超过 150 万件藏品覆盖五千多年，并由第五大道主馆与 Cloisters 共同提供跨文明、跨媒介的世界艺术史体验。",
    withinBandReason: "位于 90 档上端：世界级珍品不只集中在一个门类，埃及神庙、中世纪挂毯、欧洲绘画、美国艺术和非洲宫廷及仪式艺术都能独立支撑重点路线；两处馆址和百科全书式规模也造成很高的时间与选择成本，因此不取满分。",
    limitations: "第五大道主馆无法一天看完，Cloisters 又在曼哈顿北端。第一次应选 4—5 个部门，而不是按楼层扫荡。",
    dedicatedTrip: true,
    rareAssets: ["dendur", "unicorn", "vermeer", "aristotle", "washington", "death", "mangaaka", "idia"],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
    calibratedAt: "2026-07-19",
    sources: [
      "https://www.metmuseum.org/about-the-met",
      "https://www.metmuseum.org/art/collection"
    ]
  },
  vienna: {
    score: 96,
    scoreBand: "90–100 · 值得专程旅行",
    shortAction: "值得成为维也纳旅行主因",
    travelAction: "即使把维也纳的宫殿、音乐会和咖啡馆暂时拿掉，只为这家博物馆来一次，这趟旅行仍然成立。",
    scoreReason: "老彼得·勃鲁盖尔约四十幅存世绘画中，这里集中十二幅，是全球最大且最重要的一组；再叠加维米尔《绘画的艺术》、委拉斯开兹公主肖像组、切利尼唯一完整存世的大型金工作品《萨列拉》与 Gemma Augustea，稀世珍品不只一条线。",
    withinBandReason: "位于 90 档上段：绘画高峰与哈布斯堡 Kunstkammer 的密度足以决定旅行；但它主要集中在欧洲古典绘画、宫廷珍玩与古代收藏，文明覆盖和馆藏广度仍低于卢浮宫与大都会，因此定为 96 而不是 98。",
    limitations: "本条目只覆盖玛丽亚·特蕾西亚广场主楼，不把帝国宝库、马车博物馆、阿姆布拉斯城堡等分馆并入评分或四十件清单。常设展也会因借展与维护变化，出发前需要核验。",
    dedicatedTrip: true,
    rareAssets: ["hunters", "babel", "art-painting", "infanta-blue", "convex", "saliera", "gemma", "kani"],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle", "vienna"],
    calibratedAt: "2026-07-20",
    sources: [
      "https://www.khm.at/en/exhibitions/picture-gallery/the-best-of-bruegel-only-in-vienna",
      "https://www.khm.at/en/research/collections/kunstkammer-wien-chamber-of-art",
      "https://www.khm.at/en/visit/collections/collection-of-greek-and-roman-antiquities/selected-masterpieces"
    ]
  },
  glyptotek: {
    score: 88,
    scoreBand: "80–89 · 应主动列入行程",
    shortAction: "在哥本哈根应主动安排",
    travelAction: "如果已经来到哥本哈根，它值得稳定留出半天，尤其适合同时喜欢古代肖像与十九世纪法国艺术的人。",
    scoreReason: "它没有靠一件全球游客都认识的镇馆之宝取胜，而是靠几组难以替代的收藏形成高峰：超过 400 件希腊罗马肖像和近乎完整的罗马皇帝序列、叙利亚境外规模最大的帕尔米拉墓葬雕刻群、近 60 件高更，以及世界上少数完整保存 72 件德加遗作铜像的馆藏。",
    withinBandReason: "位于 80 档上端：强项不止一项，收藏密度与冬季花园、历史建筑共同提供很完整的半日体验；但多数高峰是收藏群而不是单件世界图标，对非艺术爱好者的城市旅行决定力仍低于卢浮宫和大都会，因此不进入 90 档。",
    limitations: "古希腊与罗马雕塑展厅正在重排，预计持续到 2026 年 10 月；部分作品可能暂不展出、部分展厅可能关闭。高更与德加的重点作品也会随专题展和借展变化，出发前必须核验。",
    dedicatedTrip: false,
    rareAssets: ["pompey", "caligula", "palmyra", "grasshoppers", "little-dancer"],
    calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
    calibratedAt: "2026-07-19",
    sources: [
      "https://glyptoteket.com/exhibitions/permanent-exhibitions/greek-roman-sculpture",
      "https://glyptoteket.com/exhibitions/current-exhibitions/palmyra",
      "https://glyptoteket.com/exhibitions/permanent-exhibitions/french-art-1870"
    ]
  },
  frye: {
    score: 72,
    scoreBand: "70–79 · 可去可不去",
    shortAction: "在 First Hill 附近时值得顺路",
    travelAction: "如果已经来到西雅图，又喜欢 19 世纪末德语区绘画、收藏史或免费而紧凑的美术馆，可以留 90 分钟到两小时；第一次来西雅图且行程很紧时，不必为它放弃更高优先级安排。",
    scoreReason: "232 幅创馆油画中近一半来自德国，慕尼黑艺术家协会与慕尼黑分离派形成清楚主线，《罪》《被判刑的人》与一组当代收藏让旧沙龙趣味可以被比较和反问。它有鲜明性格，但没有经过对象级比较可支持的稀世珍品，也缺少足以决定城市行程的名作密度。",
    withinBandReason: "位于 70 档低段上沿：收藏结构比一般小型地方美术馆更完整，免费、紧凑与沙龙陈列让体验稳定，所以达到 72；但其艺术史跨度、单件上限和区域解释权均低于 Anchorage Museum 74，综合名作与跨文化密度也低于 downtown Seattle Art Museum 75。",
    limitations: "评分只计算 Frye Art Museum 本馆的稳定收藏，不把免费门票折算成藏品价值，也不把临时展览的外借名作计入。创馆收藏与当代作品都会轮换，20 件内容库不等于同一天全部在墙上。",
    dedicatedTrip: false,
    rareAssets: [],
    calibratedAgainst: [],
    calibratedAt: "2026-07-22",
    sources: [
      "https://fryemuseum.org/about",
      "https://fryemuseum.org/collection/founding-collection",
      "https://fryemuseum.org/collection/contemporary-art"
    ]
  },
  smk: {
    score: 88,
    scoreBand: "80–89 · 应主动列入行程",
    shortAction: "在哥本哈根应主动安排",
    travelAction: "如果已经来到哥本哈根，应给它稳定留出半天；偏爱绘画的人可以安排更久，但它还不足以单独成为普通游客专程飞往哥本哈根的唯一理由。",
    scoreReason: "SMK 拥有全球规模最大的克里斯滕·科布克收藏、世界最大的哈默斯霍伊收藏之一，以及二十五件马蒂斯构成的法国境外重要收藏群，《绿线》又是 20 世纪肖像艺术的关键作品；王室旧藏与丹麦战后艺术提供了两端完整骨架。",
    withinBandReason: "位于 80 档上端，与新嘉士伯同为 88，但高峰结构不同：SMK 的绘画史连续性、科布克／哈默斯霍伊研究密度和《绿线》单件强度更高；新嘉士伯则在古代肖像、帕尔米拉、高更与德加成组收藏上更跨媒介。两馆都有多条世界级收藏线，却都未达到普通游客可只为该馆专程来到城市的 90 档门槛，因此并列而非硬排一分。",
    limitations: "本条目只覆盖 Sølvgade 主馆，不把 SMK Thy 等场址并入。超过二十万件馆藏不等于当天在展；纸本尤其轮换。30 件依据 2026 年 7 月 21 日官方开放馆藏的在展字段核验，借展、维护与展陈仍会变化。",
    dedicatedTrip: false,
    rareAssets: ["kobke-sortedam", "hammershoi-sunlight", "green-line"],
    calibratedAgainst: [],
    calibratedAt: "2026-07-21",
    sources: [
      "https://www.smk.dk/en/article/the-collection/",
      "https://open.smk.dk/en/",
      "https://www.smk.dk/en/article/smk-api/"
    ]
  }
};

// A rating is only current when every museum is calibrated against the same live set.
for (const rating of Object.values(museumRatings)) {
  rating.calibratedAgainst = ["alhambra", "anchorage", "british", "chichu", "egyptian", "enoura", "frye", "getty", "glyptotek", "louvre", "met", "muxin", "seattle", "smk", "vienna"];
  rating.calibratedAt = "2026-07-23";
}
