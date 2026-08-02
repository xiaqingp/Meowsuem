// Meowseum production route source.
const routePlans = {
  smk: {
    "90": {title:"90 分钟 · 四条收藏高峰",note:"从王室旧藏直接进入科布克、哈默斯霍伊和马蒂斯；用八件作品建立骨架，不为展厅顺序折返。",workIds:["melancholy","titans","kobke-sortedam","artists-rome","ring-windows","hammershoi-sunlight","green-line","braque-estaque"]},
    half: {title:"半天 · 十六件读懂丹麦国家收藏",note:"在四条高峰上补学院训练、斯卡恩、蒙克、马蒂斯收藏群与丹麦战后艺术；若作品借展，以同作者同展厅作品替换。",workIds:["melancholy","titans","rembrandt-old-man","eckersberg-clouds","kobke-sortedam","artists-rome","life-class","pot-seller","kroyer-bathers","ring-windows","hammershoi-sunlight","green-line","matisse-goldfish","derain-chemise","braque-estaque","jorn-sun"]},
    all: {title:"完整浏览 · 30 件",note:"30 件适合一整天或二刷；清单按内容逻辑组织，不是实时馆内导航。纸本轮换与临时借展仍须按当天现场调整。",workIds:[]}
  },
  alhambra: {
    "90": {title:"90 分钟 · 八个不可替代的空间",note:"这是极端压缩路线，必须先服从纳斯里德宫殿票面时段；抓住宫城、科马雷斯、狮子宫和 Generalife 四段，不为次要塔门折返。",workIds:["whole","myrtles","ambassadors","ambassadors-ceiling","lions-court","lion-fountain","two-sisters","canal-court"]},
    half: {title:"半天 · 十八项读懂一座宫城",note:"先完成纳斯里德宫殿核心，再补堡垒、行政前区、王座路线、1492 年后的叠层与 Generalife 水系；官方常规参观约三小时，拥堵时主动跳过低优先节点。",workIds:["whole","justice-gate","alcazaba","vela-tower","mexuar","comares-facade","myrtles","ambassadors","ambassadors-ceiling","lions-court","lion-fountain","abencerrajes","kings-hall","two-sisters","daraxa","charles-palace","generalife-palace","canal-court"]},
    all: {title:"完整内容库 · 30 个现场节点",note:"三十项适合一次从容的四小时以上参观或二刷；分区通常只能进入一次，顺着现场单向路线观察，不为清单顺序回头。",workIds:[]}
  },
  egyptian: {
    "90": {title:"90 分钟 · 八件撑起专程旅行的原件",note:"不按年代扫馆：先用纳尔迈调色板看国家诞生，再抓住金字塔时代四件、阿肯那顿巨像、普苏森尼斯银棺和梅尔奈普塔赫碑。对象调柜时跳过，不折返。",workIds:["narmer","khufu","khafre","menkaure-triad","rahotep-nofret","akhenaten-colossus","psusennes-coffin","merneptah-stele"]},
    half: {title:"半天 · 十八件贯穿三千年",note:"在八件骨架上补左塞尔、木雕和铜像工艺、中王国王脸与模型、新王国巨像、尤亚与图亚墓组、塔尼斯金面具；这条路线刻意不借用已迁出的图坦卡蒙和皇家木乃伊。",workIds:["narmer","djoser","khufu","khafre","menkaure-triad","rahotep-nofret","kaaper","pepi-copper","mentuhotep","black-pyramidion","meketre-granary","amenhotep-tiye","akhenaten-colossus","yuya-thuya-masks","yuya-coffin","psusennes-mask","psusennes-coffin","merneptah-stele"]},
    all: {title:"完整内容库 · 40 件分两次看",note:"40 件适合一整天或分两次完成；老馆标签、展柜和开放状态仍会调整。先完成半天骨架，再按兴趣补日常模型、材料工艺与阿玛尔纳，不为清单顺序反复跨楼层。",workIds:[]}
  },
  chichu: {
    "90": {
      "title": "90分钟 · 三位艺术家与建筑主线",
      "note": "现场若限流或规定单向动线，以馆方路线为准；本路线是注意力取舍，不是实时导航。",
      "workIds": [
        "whole",
        "entrance-cut",
        "triangle-court",
        "monet-room",
        "water-lily-pond-1915",
        "afrum",
        "open-field",
        "open-sky",
        "time-timeless"
      ]
    },
    "half": {
      "title": "半天 · 看懂建筑怎样改变三组作品",
      "note": "给莫奈室、三件塔瑞尔作品和德·玛利亚空间各留出安静适应光线的时间，不以快速打卡数量为目标。",
      "workIds": [
        "whole",
        "hidden-profile",
        "entrance-cut",
        "concrete-ramp",
        "square-court",
        "trench-passage",
        "triangle-court",
        "daylight-clock",
        "monet-room",
        "water-lily-pond-1915",
        "cluster-grass",
        "water-lilies-1914",
        "afrum",
        "open-field",
        "open-sky",
        "time-timeless"
      ]
    },
    "all": {
      "title": "完整浏览 · 把20项看成一套时间装置",
      "note": "庭园可在入馆前或离馆后观看；馆内顺序须服从当天动线。日落项目不是常规开放自动包含的环节。",
      "workIds": [
        "chichu-garden",
        "whole",
        "hidden-profile",
        "entrance-cut",
        "concrete-ramp",
        "square-court",
        "trench-passage",
        "triangle-court",
        "daylight-clock",
        "monet-room",
        "marble-floor",
        "water-lily-pond-1915",
        "cluster-grass",
        "water-lilies-1914",
        "water-lily-pond-1917",
        "willow-reflections",
        "afrum",
        "open-field",
        "open-sky",
        "time-timeless"
      ]
    }
  },
  getty: {
    "90": {title:"90 分钟 · 山顶与七件核心",note:"先用建筑和中央花园理解场所，再抓住中世纪、巴洛克、洛可可与现代绘画四个转折。展厅改造期间，以当天开放为准；遇闭馆不跨区折返。",workIds:["hilltop","central-garden","saint-luke","lucretia","old-man","surprise","irises","machine-argent"]},
    half: {title:"半天 · 十六项完成 Getty 骨架",note:"在八项核心上补足早期尼德兰、文艺复兴雕塑、宫廷家具、印象派与克洛岱尔；中途在中央花园休息，不把纸本轮换项当成必须完成。",workIds:["hilltop","travertine","central-garden","saint-luke","annunciation","young-boy","lucretia","boar-hunt","old-man","pope-paul","surprise","machine-argent","boulle-cabinet","jeanne","sunrise","irises"]},
    all: {title:"完整内容库 · 30 项分两次看",note:"第一次完成建筑、绘画、雕塑和装饰艺术二十四项；第二次按当期展览补手稿、素描与摄影。纸本六项长期轮换，页面会明确标成仅阅读。",workIds:["hilltop","travertine","central-garden","saint-luke","annunciation","parmigianino","madonna-cherries","young-boy","lucretia","boar-hunt","old-man","pope-paul","juggling-man","saint-gines","surprise","suzanne","machine-argent","pilgrim-flask","boulle-cabinet","model-joseph","jeanne","sunrise","irises","crouching-woman"]}
  },
  anchorage: {
    "90": {title:"90 分钟 · 八件看懂北方",note:"先用四件艺术作品拆掉‘只有荒野’的想象，再用肠衣、猎帽、树皮与当代熊肠雨衣理解材料知识。",workIds:["denali-laurence","muir-glacier","everything-love","punk-nanuk","gut-cape","alutiiq-hat","birch-basket","bear-gut-parka"]},
    half: {title:"半天 · 十五件艺术与生活技术",note:"保留八件骨架，补足人物肖像、现代媒介、长距离贸易和代际传承；给 Alaska Exhibition 的整体叙事留出时间。",workIds:["denali-laurence","muir-glacier","resurrection-bay","miowak","everything-love","idiot-strings","punk-nanuk","radio-babies","blueberries","gut-cape","alutiiq-hat","birch-basket","kayak-model","bear-gut-parka","fish-trap"]},
    all: {title:"完整浏览 · 20 件内容库",note:"后七件多为馆藏轮换对象；若当天不在展，就用对应的常设展与数字资料理解，不为集齐清单折返。",workIds:[]}
  },
  british: {
    "90": {title:"90 分钟 · 八件改变知识史的对象",note:"只抓住破译、帝国、城市、古典身体、材料技术、船葬、瓷器与殖民收藏八条主线；主动放弃按文明扫馆。",workIds:["rosetta","lion-hunt","standard-ur","parthenon-horse","lycurgus-cup","sutton-helmet","david-vases","benin-plaque"]},
    half: {title:"半天 · 十八件跨文明骨架",note:"在八件骨架上补足埃及墓葬、两河书写、希腊墓葬、英国金工、南亚宗教与美洲祭祀；纸本轮换对象不混入。",workIds:["rosetta","nebamun-hunt","hunefer","lamassu","lion-hunt","cyrus-cylinder","standard-ur","flood-tablet","parthenon-horse","nereid","portland-vase","lycurgus-cup","sutton-helmet","mold-cape","david-vases","nataraja","benin-plaque","double-serpent"]},
    all: {title:"单日完整路线 · 30 件上限",note:"六十件是多次参观内容库；这条路线控制为三十件，并排除纸本轮换项目。拥堵或闭厅时不要为集齐清单折返。",workIds:["rosetta","younger-memnon","nebamun-hunt","hunefer","lamassu","lion-hunt","cyrus-cylinder","standard-ur","ram-thicket","royal-game","flood-tablet","parthenon-horse","parthenon-frieze","parthenon-metope","nereid","portland-vase","lycurgus-cup","sutton-helmet","sutton-purse","lewis-chessmen","mold-cape","royal-gold-cup","david-vases","gandhara-buddha","nataraja","benin-plaque","ife-head","hoa-hakananai","double-serpent","yaxchilan-24"]}
  },
  enoura: {
    "90": {title:"90 分钟 · 读懂四条太阳轴线",note:"时间很紧时留在上区；放弃竹林与大部分园石，先确认夏至、冬至、春秋分如何分别进入建筑。",workIds:["whole-site","summer-gallery","cantilever-tip","winter-tunnel","optical-stage","stone-stage","equinox-axis","uchoten"]},
    half: {title:"半天 · 从太阳走进建筑史",note:"官方普通场次本身约三小时；先走上区主轴，再经茶室、旧门和石庭进入竹林。雨天先确认下区是否开放。",workIds:["whole-site","summer-gallery","cantilever-tip","oya-wall","winter-tunnel","optical-stage","stone-stage","equinox-axis","uchoten","tea-glass-step","meigetsu-gate","naraya-gate","stone-torii","garden","fossil-cave","kasuga-shrine"]},
    all: {title:"完整浏览 · 20 个现场节点",note:"按一个完整预约场次安排；户外路面、高差和拍照会消耗时间，不为集齐节点折返。",workIds:[]}
  },
  muxin: {
    "90": {
      "title": "90分钟：抓住保存、绘画与空间三条线",
      "note": "只保留能解释评分与馆级主线的节点；文学稿本和绘画如未展出，按同章可见对象替换，不等待指定页面。",
      "workIds": [
        "muxin-c20",
        "muxin-c01",
        "muxin-c02",
        "muxin-c14",
        "muxin-r02",
        "muxin-c12",
        "muxin-c15"
      ]
    },
    "half": {
      "title": "半天：把文学与绘画放回同一条创作线",
      "note": "按建筑—监禁文献—诗歌稿本—版本与记忆—早期绘画—晚期序列—设计与影像推进，中途在水边或连接空间休息。",
      "workIds": [
        "muxin-c20",
        "muxin-c01",
        "muxin-c02",
        "muxin-c03",
        "muxin-c05",
        "muxin-c09",
        "muxin-c10",
        "muxin-c14",
        "muxin-r06",
        "muxin-r02",
        "muxin-c11",
        "muxin-r03",
        "muxin-c12",
        "muxin-c15",
        "muxin-r05",
        "muxin-r07"
      ]
    },
    "all": {
      "title": "完整浏览：20个节点分两轮看",
      "note": "第一轮建立主线，第二轮补比较对象与媒介边界；不把20项写成当天必然全部可见的清单。",
      "workIds": [
        "muxin-c20",
        "muxin-c01",
        "muxin-c02",
        "muxin-c03",
        "muxin-c05",
        "muxin-c09",
        "muxin-c14",
        "muxin-r06",
        "muxin-r02",
        "muxin-c11",
        "muxin-c12",
        "muxin-c15",
        "muxin-c04",
        "muxin-c10",
        "muxin-r01",
        "muxin-r03",
        "muxin-r04",
        "muxin-c13",
        "muxin-r05",
        "muxin-r07"
      ]
    }
  },
  louvre: {
    "90": {title:"90 分钟 · 8 件保底路线",note:"只保留会决定卢浮宫价值判断的八个节点；《蒙娜丽莎》排队与跨馆翼移动时间不计入作品停留。",workIds:["victory","venus","mona","cana","raft","liberty","psyche","hammurabi"]},
    half: {title:"半天 · 18 件理解路线",note:"保留 90 分钟骨架，再补意大利绘画、早期国家图像、埃及墓葬和人体雕塑；路线很长，拥堵时优先跳过折返。",workIds:["victory","venus","mona","cana","raft","liberty","psyche","hammurabi","virgin-rocks","coronation","vultures-stele","horatii","lamassu","sphinx","scribe","akhethotep","death-virgin","rolin-madonna"]},
    all: {title:"单日完整路线 · 30 件上限",note:"60 件是多次参观内容库，这里只列一天仍可能完成的 30 件；其余主线与冷门作品按兴趣挑选，不为集齐清单折返。",workIds:["victory","venus","mona","cana","virgin-rocks","coronation","raft","liberty","hammurabi","naram-sin","vultures-stele","horatii","lamassu","sphinx","scribe","akhethotep","paser-coffin","spouses-sarcophagus","death-virgin","psyche","hermaphroditus","diana","marly-horses","milo-croton","rolin-madonna","bathsheba","cythera","lacemaker","odalisque","caryatides"]}
  },
  met: {
    "90": {title:"90 分钟主馆骨架",note:"只走第五大道主馆的七个高价值节点；不包含需要另行前往的 Cloisters。",workIds:["dendur","lamassu","kouros","armor","vermeer","washington","mangaaka"]},
    half: {title:"半天主馆代表路线",note:"覆盖古代文明、亚洲、欧洲、美国与非洲艺术；馆内距离很长，不追求每个展厅都进入。",workIds:["dendur","hatshepsut","lamassu","kouros","guanyin","armor","vermeer","aristotle","washington","death","gulf","madamex","vangogh","mangaaka","idia"]},
    all: {title:"单日完整路线 · 30 件上限",note:"60 件是多次参观内容库；这里控制为 30 件。The Met Cloisters 仍需另行安排，不能视为馆内顺路。",workIds:["dendur","hatshepsut","lamassu","kouros","guanyin","armor","vermeer","aristotle","washington","death","gulf","madamex","vangogh","mangaaka","idia","perneb","boscoreale","night-shining-white","old-trees","great-wave","damascus-room","harvesters","toledo","juan-pareja","gertrude-stein","autumn-rhythm","rothko-13","oxbow","bisj","merode"]}
  },
  seattle: {
    "90": {
      "title": "90 分钟｜只看决定 75 分判断的节点",
      "note": "入馆先核对当日展厅；按现场可见项依次完成，缺一件就转到下一件，不为状态未知作品折返。",
      "workIds": [
        "sea-change",
        "double-elvis",
        "naaxein",
        "cylinder-vase-depicting-scribes-in-the-underworld",
        "belt-mask-of-iyoba-idia",
        "salt-cellar",
        "dr-silvester-gardiner",
        "still-life-with-strawberries-and-ostrich-egg-cup"
      ]
    },
    "half": {
      "title": "半天｜看懂主馆为何是跨文化综合馆",
      "note": "先看现代艺术的制作过程，再看美国艺术的身份与物质文化，休息后进入西北海岸、古代美洲、非洲与地中海器物；以实际开放展厅调整同组顺序。",
      "workIds": [
        "sea-change",
        "double-elvis",
        "how-my-mothers-embroidered-apron-unfolds-in-my-life",
        "barcelona",
        "dr-silvester-gardiner",
        "still-life-with-strawberries-and-ostrich-egg-cup",
        "a-country-home",
        "narragansett-bay",
        "naaxein",
        "swan-rattle",
        "cylinder-vase-depicting-scribes-in-the-underworld",
        "belt-mask-of-iyoba-idia",
        "salt-cellar",
        "funerary-portrait",
        "posthumous-portrait-head-of-the-emperor-claudius"
      ]
    },
    "all": {
      "title": "完整浏览｜20 件内容库，建议分两次核验式参观",
      "note": "第一次以市中心主馆当日可见的 17 件为范围；第二次只在状态改变后补看缺席项。完整路线是编辑覆盖，不承诺 20 件能在同一天、同一馆址兑现。",
      "workIds": [
        "sea-change",
        "double-elvis",
        "how-my-mothers-embroidered-apron-unfolds-in-my-life",
        "barcelona",
        "dr-silvester-gardiner",
        "still-life-with-strawberries-and-ostrich-egg-cup",
        "a-country-home",
        "narragansett-bay",
        "naaxein",
        "four-cornered-hat-with-birds",
        "swan-rattle",
        "cylinder-vase-depicting-scribes-in-the-underworld",
        "canoe-prow-figure-nguzu-nguzu",
        "funerary-portrait",
        "posthumous-portrait-head-of-the-emperor-claudius",
        "belt-mask-of-iyoba-idia",
        "salt-cellar"
      ]
    }
  },
  vienna: {
    "90": {
      "title": "90分钟 · 只抓住决定96分的核心",
      "note": "以中央建筑轴线开场，在古物与艺术珍宝馆各取数件不可替代对象，最后把主要时间留给勃鲁盖尔和维米尔。主动跳过埃及收藏、钱币馆及大部分第二梯队绘画；这是一条取舍路线，不是主馆缩略全景。",
      "workIds": [
        "vienna-space-02-grand-staircase-ensemble",
        "vienna-space-03-cupola-hall",
        "vienna-ant-01-gemma-augustea",
        "vienna-ant-04-bacchanalia-decree",
        "vienna-kk-01-saliera",
        "vienna-kk-07-rock-crystal-pyramid",
        "vienna-kk-08-bellerophon-pegasus",
        "vienna-pg-01-tower-of-babel",
        "vienna-pg-02-hunters-in-the-snow",
        "vienna-pg-06-art-of-painting"
      ]
    },
    "half": {
      "title": "半天 · 看懂这家馆为何不只是名画馆",
      "note": "先用建筑建立收藏逻辑，再依次看古代制度、宫廷技术、勃鲁盖尔群和绘画如何重组历史与身份。路线保留全部八条稀世珍品线的代表；轮换对象不可见时，以同章其他对象维持主线。",
      "workIds": [
        "vienna-space-01-museum-building",
        "vienna-space-02-grand-staircase-ensemble",
        "vienna-space-03-cupola-hall",
        "vienna-ant-01-gemma-augustea",
        "vienna-ant-04-bacchanalia-decree",
        "vienna-ant-02-nagyszentmiklos-treasure",
        "vienna-ant-06-theseus-mosaic",
        "vienna-egy-01-ka-ni-nisut-chapel",
        "vienna-kk-01-saliera",
        "vienna-kk-07-rock-crystal-pyramid",
        "vienna-kk-08-bellerophon-pegasus",
        "vienna-kk-03-automaton-ship",
        "vienna-kk-05-rudolf-ii-bust",
        "vienna-pg-01-tower-of-babel",
        "vienna-pg-02-hunters-in-the-snow",
        "vienna-pg-03-childrens-games",
        "vienna-pg-04-peasant-wedding",
        "vienna-pg-05-carnival-and-lent",
        "vienna-pg-06-art-of-painting",
        "vienna-pg-07-infanta-margarita-blue",
        "vienna-pg-08-madonna-of-the-meadow",
        "vienna-pg-09-madonna-of-the-rosary",
        "vienna-pg-16-parmigianino-convex-self-portrait"
      ]
    },
    "all": {
      "title": "完整浏览 · 40项内容库，建议拆成两次",
      "note": "第一次集中建筑、古物、埃及与艺术珍宝馆，回答物件怎样服务制度、祭祀与宫廷技术；第二次集中绘画馆和钱币馆，回答图像怎样组织社会、身份、历史与绘画本身。每次都在穹顶大厅附近安排休息，避免把第二次参观降为疲劳补漏。",
      "workIds": [
        "vienna-space-01-museum-building",
        "vienna-space-02-grand-staircase-ensemble",
        "vienna-space-03-cupola-hall",
        "vienna-ant-01-gemma-augustea",
        "vienna-ant-04-bacchanalia-decree",
        "vienna-ant-02-nagyszentmiklos-treasure",
        "vienna-ant-03-brygos-skyphos",
        "vienna-ant-05-amazon-sarcophagus",
        "vienna-ant-06-theseus-mosaic",
        "vienna-egy-01-ka-ni-nisut-chapel",
        "vienna-egy-02-reserve-head",
        "vienna-egy-04-kai-pu-ptah-ipep",
        "vienna-egy-05-gem-nef-hor-bak",
        "vienna-egy-03-babylon-lion",
        "vienna-kk-01-saliera",
        "vienna-kk-07-rock-crystal-pyramid",
        "vienna-kk-08-bellerophon-pegasus",
        "vienna-kk-03-automaton-ship",
        "vienna-kk-04-cittern-player",
        "vienna-kk-06-dragon-bowl",
        "vienna-kk-02-krumau-madonna",
        "vienna-kk-05-rudolf-ii-bust",
        "vienna-coin-01-sigismund-guldiner",
        "vienna-coin-02-charles-v-dedication-medal",
        "vienna-pg-01-tower-of-babel",
        "vienna-pg-02-hunters-in-the-snow",
        "vienna-pg-03-childrens-games",
        "vienna-pg-04-peasant-wedding",
        "vienna-pg-05-carnival-and-lent",
        "vienna-pg-06-art-of-painting",
        "vienna-pg-07-infanta-margarita-blue",
        "vienna-pg-12-rubens-self-portrait",
        "vienna-pg-13-cardinal-albergati",
        "vienna-pg-16-parmigianino-convex-self-portrait",
        "vienna-pg-15-summer",
        "vienna-pg-08-madonna-of-the-meadow",
        "vienna-pg-14-madonna-with-the-pear",
        "vienna-pg-09-madonna-of-the-rosary",
        "vienna-pg-11-judith-veronese",
        "vienna-pg-10-nymph-and-shepherd"
      ]
    }
  },
  glyptotek: {
    "90": {title:"90 分钟收藏骨架",note:"从古代肖像与帕尔米拉进入法国现代艺术，最后回到冬季花园；重排和轮换作品出发前需核验。",workIds:["pompey","caligula","palmyra","absinthe","gauguin","little-dancer","water-mother"]},
    half: {title:"半天代表路线",note:"兼顾古代地中海、埃及、法国现代艺术、罗丹与丹麦艺术；这是最能说明馆藏结构的一组。",workIds:["rayet","pompey","caligula","amenemhat","gemni","palmyra","absinthe","vangogh","gauguin","little-dancer","foyer","water-mother","mother-denmark","rodin-kiss","carpeaux-ugolino","hammershoi-relief"]},
    all: {title:"完整浏览 · 30 件",note:"30 件适合一整天或二刷；古希腊罗马展厅重排及绘画轮换可能改变当天可见组合。",workIds:[]}
  },
  frye: {
    "90": {title:"90 分钟 · 先看懂这家馆的性格",note:"先抓创馆收藏的慕尼黑主线，再用两件当代作品看 Frye 如何反问自己的旧眼光；具体在展状态以 On View 为准。",workIds:["sin","condemned","soap-bubbles","picture-book","three-firs","chief-seattle","prayer-hands","free-me"]},
    half: {title:"半天 · 从旧沙龙走到当代收藏",note:"保留 90 分钟骨架，再补施图克、风景、学院派人体与当代档案；馆不大，时间主要花在比较，不花在赶路。",workIds:["sin","judgment-paris","condemned","soap-bubbles","picture-book","three-firs","birch-grove","dordrecht","in-the-woods","chief-seattle","prayer-hands","free-me","fruits-plenty","gentle-angry-women","not-waving"]},
    all: {title:"完整浏览 · 20 件",note:"20 件是跨轮换内容库，不代表当天同时在展；先按馆方 On View 筛选，再顺着四条主线看。",workIds:[]}
  },
  "designmuseum-danmark": {
    "90": {
      "title": "90 分钟：先看这家馆为什么值得",
      "note": "只保留能支撑本馆核心判断的节点：跨文化形式、皇家瓷器、早期工业设计、光、丹麦现代家具和塑料转向。主动跳过机构肖像、平面设计、纺织、同系列补充和当代收束；每件对象是否当天可见须先向馆方核验。",
      "workIds": [
        "chinese-jug-handle-spout-yongle",
        "spengler-temple-spiral-staircase-1760",
        "flora-danica-four-sided-serving-dish",
        "malling-hansen-writing-ball-1870s",
        "gauguin-jug-self-portrait-1889",
        "poul-henningsen-table-lamp-4-3-1927",
        "kaare-klint-red-chair-1927",
        "hans-wegner-wishbone-chair-1950",
        "arne-jacobsen-ant-chair-1952",
        "verner-panton-panton-chair-1960-1967"
      ]
    },
    "half": {
      "title": "半天：看懂从工艺到丹麦现代设计的结构",
      "note": "在核心节点外，加入日本工艺、晚十九世纪协作瓷器、穿孔瓷、平面设计、家具原型、纺织和 Beogram 4000，形成主要收藏群的代表性横切面。按章节顺序行走，遇到轮换对象时保留该章节的比较逻辑，不把不可见对象当作当天必看。",
      "workIds": [
        "chinese-jug-handle-spout-yongle",
        "tsuba-sano-naoyoshi-c1775",
        "spengler-temple-spiral-staircase-1760",
        "flora-danica-four-sided-serving-dish",
        "heron-service-wine-cooler-1885-88",
        "gauguin-jug-self-portrait-1889",
        "hegermann-lindencrone-porcelain-vase-1899-1900",
        "malling-hansen-writing-ball-1870s",
        "thorvald-bindesboll-carlsberg-label-1904",
        "nilfisk-l10-vacuum-cleaner-1922",
        "poul-henningsen-table-lamp-4-3-1927",
        "kaare-klint-red-chair-1927",
        "marie-gudme-leth-tree-pattern-1937",
        "finn-juhl-butterfly-coffee-table-prototype-1949",
        "hans-wegner-wishbone-chair-1950",
        "arne-jacobsen-ant-chair-1952",
        "verner-panton-panton-chair-1960-1967",
        "bang-olufsen-beogram-4000-1972"
      ]
    },
    "all": {
      "title": "完整浏览：沿六个问题走完 20 件精选",
      "note": "按章节顺序覆盖全部入选对象；它是研究内容的完整观看序列，不保证一天内全部可见，也不提供实时馆内导航。出发前核验轮换、借展和展厅状态；Katrine Bendixen 的对象尤其只能按曾展出且当前未知处理。全程均以 Bredgade 68 主馆址为边界。",
      "workIds": [
        "portrait-pietro-krohn-1887",
        "chinese-jug-handle-spout-yongle",
        "tsuba-sano-naoyoshi-c1775",
        "spengler-temple-spiral-staircase-1760",
        "flora-danica-four-sided-serving-dish",
        "heron-service-wine-cooler-1885-88",
        "gauguin-jug-self-portrait-1889",
        "hegermann-lindencrone-porcelain-vase-1899-1900",
        "malling-hansen-writing-ball-1870s",
        "thorvald-bindesboll-carlsberg-label-1904",
        "nilfisk-l10-vacuum-cleaner-1922",
        "poul-henningsen-table-lamp-4-3-1927",
        "kaare-klint-red-chair-1927",
        "marie-gudme-leth-tree-pattern-1937",
        "finn-juhl-butterfly-coffee-table-prototype-1949",
        "hans-wegner-wishbone-chair-1950",
        "arne-jacobsen-ant-chair-1952",
        "verner-panton-panton-chair-1960-1967",
        "bang-olufsen-beogram-4000-1972",
        "katrine-bendixen-inside-out-lamp-2019"
      ]
    }
  },
  "nationalmuseum": {
    "90": {
      "title": "90分钟：先看决定值不值得来的节点",
      "note": "按主馆时间线从十七世纪绘画走到十八世纪，再转入转世纪艺术、雕塑庭院和设计。作品停留之外要留出楼层转换时间；主动跳过两件当前未展出的轮换作品、次要设计比较和完整 Treasury 浏览。",
      "workIds": [
        "rembrandt-self-portrait-nm-5324",
        "goya-truth-time-history-nm-5593",
        "roslin-lady-with-veil-nm-4098",
        "pilo-coronation-gustav-iii-nm-1004",
        "fanny-brate-day-of-celebration-nm-1605",
        "fogelberg-odin-nmsk-392",
        "mathsson-reclining-chair-36-nmk-46-2010",
        "halds-cactus-exhibition-nmk-215-2011"
      ]
    },
    "half": {
      "title": "半天：看懂艺术与设计如何接成一条线",
      "note": "以主馆现场可见的 18 件入选作品组成半日主线：先按年代看绘画，再看雕塑庭院，最后安排家具、陶瓷、玻璃和 Treasury。Josephson《水妖》和 Zorn《仲夏舞》当前不作为现场节点；若某件作品临时轮换，按同章其他作品继续，不把路线当作实时导航。",
      "workIds": [
        "rembrandt-self-portrait-nm-5324",
        "rubens-three-graces-nm-601",
        "goya-truth-time-history-nm-5593",
        "roslin-lady-with-veil-nm-4098",
        "pilo-coronation-gustav-iii-nm-1004",
        "elias-martin-view-stockholm-nm-1470",
        "julius-kronberg-nymph-and-fauns-nm-1316",
        "rodin-bellona-nmsk-985",
        "fogelberg-odin-nmsk-392",
        "hasselberg-spring-snowflake-nmsk-746",
        "fanny-brate-day-of-celebration-nm-1605",
        "persson-portrait-of-a-pea-nmk-169-1972",
        "stig-lindberg-bersa-bowl-nmk-60-1996",
        "mathsson-reclining-chair-36-nmk-46-2010",
        "aalto-paimio-armchair-nmk-13-1963",
        "ron-arad-rover-chair-nmk-72-2013",
        "halds-cactus-exhibition-nmk-215-2011",
        "charles-x-gustav-miniature-nmb-2163"
      ]
    },
    "all": {
      "title": "完整浏览：分两次把主馆的收藏逻辑走完",
      "note": "建议至少分两次：第一次完成时间线绘画、雕塑庭院与转世纪节点，第二次专看家具、Design Depot、玻璃和 Treasury。完整结构包含两件当前未展出的馆藏轮换作品，它们是收藏延伸，不是当天可见保证；遇到跨楼层或临时不可见时，以章节顺序和作品价值取舍为准。",
      "workIds": [
        "rembrandt-self-portrait-nm-5324",
        "rubens-three-graces-nm-601",
        "goya-truth-time-history-nm-5593",
        "roslin-lady-with-veil-nm-4098",
        "pilo-coronation-gustav-iii-nm-1004",
        "elias-martin-view-stockholm-nm-1470",
        "julius-kronberg-nymph-and-fauns-nm-1316",
        "rodin-bellona-nmsk-985",
        "fogelberg-odin-nmsk-392",
        "hasselberg-spring-snowflake-nmsk-746",
        "josephson-water-sprite-nm-1905",
        "zorn-midsummer-dance-nm-1603",
        "fanny-brate-day-of-celebration-nm-1605",
        "persson-portrait-of-a-pea-nmk-169-1972",
        "stig-lindberg-bersa-bowl-nmk-60-1996",
        "mathsson-reclining-chair-36-nmk-46-2010",
        "aalto-paimio-armchair-nmk-13-1963",
        "ron-arad-rover-chair-nmk-72-2013",
        "halds-cactus-exhibition-nmk-215-2011",
        "charles-x-gustav-miniature-nmb-2163"
      ]
    }
  },
  "rosenborg": {
    "90": {
      "title": "90分钟：先看王权舞台，再下到 Treasury",
      "note": "按高回报节点取舍：优先骑士大厅、两把王冠、克里斯蒂安三世国剑、加冕剑与一件珍奇对象。跳过四套珠宝的逐套比较、玻璃柜和战争记忆组；地下 Treasury 的入口与参观边界以现场馆方安排为准。",
      "workIds": [
        "knights-hall",
        "narwhal-throne",
        "silver-lions",
        "christian-iii-sword-of-state",
        "oldenborg-horn",
        "christian-iv-crown",
        "christian-v-crown",
        "coronation-sword",
        "ampulla",
        "pomander"
      ]
    },
    "half": {
      "title": "半天：从克里斯蒂安四世到宪政转折",
      "note": "在90分钟核心线上加入克里斯蒂安四世的染血服装与弹片耳环、四套王冠珠宝的比较、玻璃柜和葡萄酒。玫瑰式切割钻石套饰属于通常王冠珠宝语境，但具体陈列和是否因王室使用暂离须提前核验；宪法笔在弗雷德里克七世房间观看。",
      "workIds": [
        "christian-iv-blood-stained-clothes",
        "shrapnel-earrings",
        "knights-hall",
        "narwhal-throne",
        "silver-lions",
        "glass-cabinet",
        "christian-iii-sword-of-state",
        "oldenborg-horn",
        "pomander",
        "christian-iv-crown",
        "christian-v-crown",
        "coronation-sword",
        "ampulla",
        "emerald-set",
        "pearl-ruby-set",
        "brilliant-cut-diamond-set",
        "rose-cut-diamond-set",
        "constitution-pen",
        "rosenborg-wine",
        "wetting-trap-chair"
      ]
    },
    "all": {
      "title": "完整浏览：按楼层、制度与收藏线分段看",
      "note": "完整路线覆盖全部20件入选对象。建议先看城堡室内和骑士大厅，再进入地下 Treasury，最后用王冠珠宝和葡萄酒收束；多层楼梯、休息和地下室独立入口会增加时间。所有对象的现场状态仍以访问日馆方通知为准，尤其是轮换珠宝；完整浏览不把关闭或未确认对象伪装成必然可见。",
      "workIds": [
        "christian-iv-blood-stained-clothes",
        "shrapnel-earrings",
        "knights-hall",
        "narwhal-throne",
        "silver-lions",
        "glass-cabinet",
        "wetting-trap-chair",
        "christian-iii-sword-of-state",
        "oldenborg-horn",
        "pomander",
        "christian-iv-crown",
        "coronation-sword",
        "ampulla",
        "christian-v-crown",
        "emerald-set",
        "pearl-ruby-set",
        "brilliant-cut-diamond-set",
        "rose-cut-diamond-set",
        "constitution-pen",
        "rosenborg-wine"
      ]
    }
  }
};

const contentUpdatedAtByMuseum = {
  alhambra:"2026-07-21", anchorage:"2026-07-20", british:"2026-07-20", chichu:"2026-07-23",
  egyptian:"2026-07-22", enoura:"2026-07-20", getty:"2026-07-21", glyptotek:"2026-07-21",
  frye:"2026-07-22", louvre:"2026-07-20", met:"2026-07-22", muxin:"2026-07-23", seattle:"2026-07-26", smk:"2026-07-21", vienna:"2026-07-24",
  "designmuseum-danmark":"2026-08-01",
  "nationalmuseum":"2026-08-01",
  "rosenborg":"2026-08-02"
};

for (const museum of Object.values(museumData)) {
  museum.contentUpdatedAt = contentUpdatedAtByMuseum[museum.id];
  const plans = routePlans[museum.id];
  if (!plans) throw new Error(`${museum.id} 缺少三档参观攻略`);
  const knownIds = new Set(museum.works.map(work => work.id));
  if (museum.editorialCapacity < 60) plans.all.workIds = museum.works.filter(work => !work.unavailable).map(work => work.id);
  for (const [routeId, route] of Object.entries(plans)) {
    if (!route.workIds.length || route.workIds.some(workId => !knownIds.has(workId))) throw new Error(`${museum.id}/${routeId} 路线作品无效`);
    if (route.workIds.some(workId => museum.works.find(work => work.id === workId)?.unavailable)) throw new Error(`${museum.id}/${routeId} 含不可见作品`);
  }
  museum.routes = plans;
}
