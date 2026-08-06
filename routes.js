// Meowseum production route source.
const routePlans = {
  smk: {
    "90": {
      "title": "90分钟：看懂SMK为何是一座丹麦国家美术馆",
      "note": "依次抓住王室收藏、殖民联系、丹麦国家图像、北欧象征主义、Rump法国现代主义、雕塑与当代延伸。路线只使用锁定证据中确认在主馆展出的节点；仍须在到访当天核对展厅。主动跳过归属研究的第二层细节、大部分黄金时代作者群、轮换纸本和展出状态不明作品。",
      "workIds": [
        "cornelis-fall-titans",
        "dom-miguel-de-castro",
        "gijsbrechts-studio-wall",
        "juel-niels-ryberg-family",
        "jerichau-egyptian-pot-seller",
        "ring-french-windows",
        "hammershoi-artemis",
        "hammershoi-interior-easel",
        "matisse-green-line",
        "derain-woman-chemise",
        "niels-hansen-jacobsen-shadow",
        "noack-standing-female-nude",
        "kirkeby-untitled-laesoe"
      ]
    },
    "half": {
      "title": "半天：从王室选择走到仍在改写的公共正典",
      "note": "约3.5—4.5小时，按八章顺序覆盖主要收藏机制与丹麦艺术纵深。先核对埃克斯贝格、勒比、克布克、康斯坦丁·汉森、马斯特兰德、马蒂斯习作和吉尔辛的当日展陈；若不可见，保留章节逻辑并跳过，不用其他作品冒充。中段在北欧现代性后休息，再进入法国现代主义和新翼。",
      "workIds": [
        "cecco-virgin-child-goldfinch",
        "cornelis-fall-titans",
        "dom-miguel-de-castro",
        "rembrandt-old-man-profile",
        "rembrandt-crusader-sketch",
        "gijsbrechts-studio-wall",
        "juel-niels-ryberg-family",
        "eckersberg-nathanson-daughters",
        "rorbye-artists-window",
        "koebke-dosseringen-copenhagen",
        "constantin-hansen-artists-rome",
        "marstrand-justina-antoine",
        "jerichau-egyptian-pot-seller",
        "ring-french-windows",
        "munch-evening-talk",
        "hammershoi-artemis",
        "hammershoi-interior-easel",
        "hammershoi-interior-artificial-light",
        "matisse-green-line",
        "matisse-collioure-joy-life-study",
        "derain-woman-chemise",
        "modigliani-alice",
        "giersing-judgment-paris",
        "niels-hansen-jacobsen-shadow",
        "noack-standing-female-nude",
        "nolde-legend",
        "kirkeby-untitled-laesoe"
      ]
    },
    "all": {
      "title": "完整浏览：40件分两次看完",
      "note": "不要把40件内容库伪装成单日打卡表。第一次看第1—5章，从早期王室收藏走到哈默斯赫伊；第二次看第6—8章，从Rump法国现代主义走到丹麦现代、当代重释和纸本收藏。所有display_status_unknown与collection_rotation对象均须预先核对；克布克素描与曼特尼亚版画按Study Room预约及纸本保护条件安排，不能承诺常设可见。SMK Thy与Royal Cast Collection不在路线内。",
      "workIds": [
        "cecco-virgin-child-goldfinch",
        "cranach-electress-sibyl",
        "cornelis-fall-titans",
        "rubens-judgement-solomon",
        "gijsbrechts-studio-wall",
        "dom-miguel-de-castro",
        "rembrandt-old-man-profile",
        "rembrandt-crusader-sketch",
        "therbusch-self-portrait",
        "juel-niels-ryberg-family",
        "eckersberg-nathanson-daughters",
        "rorbye-artists-window",
        "bendz-young-artist-mirror",
        "koebke-dosseringen-copenhagen",
        "koebke-self-portrait",
        "koebke-eckersberg-marstrand-trip",
        "constantin-hansen-artists-rome",
        "friedrich-after-storm",
        "marstrand-justina-antoine",
        "wegmann-anna-seekamp",
        "jerichau-egyptian-pot-seller",
        "ring-french-windows",
        "munch-evening-talk",
        "hammershoi-artemis",
        "hammershoi-interior-easel",
        "hammershoi-interior-artificial-light",
        "matisse-green-line",
        "matisse-collioure-joy-life-study",
        "derain-woman-chemise",
        "braque-trees-estaque",
        "modigliani-alice",
        "matisse-zulma",
        "giersing-judgment-paris",
        "niels-hansen-jacobsen-shadow",
        "noack-standing-female-nude",
        "kernn-larsen-phantoms",
        "nolde-legend",
        "kirkeby-untitled-laesoe",
        "roepstorff-desolation-beast",
        "mantegna-bacchanal-wine-vat"
      ]
    }
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
    "90": {
      "title": "90分钟｜先判断这座馆是否与你对味",
      "note": "从冬园开始，用11个高回报节点验证本馆的三条主线：私人品味如何成为公共空间，古代雕塑怎样保存权力与死亡，近代艺术如何改写身体与现代观看。主动略过各收藏组中的补充比较件；若希腊—罗马展厅重排导致节点不可见，不要折返等待，直接从埃及转入帕尔米拉，再继续罗丹与法国绘画。所有非稳定展出节点均须当天核验。",
      "workIds": [
        "water-mother-kai-nielsen",
        "rayet-head-in-0418",
        "ramses-ii-ptah-colossal-dyad",
        "gemni-e-hat-funerary-equipment",
        "demosthenes-in-2782",
        "casali-sarcophagus-in-0843",
        "beauty-of-palmyra-in-2795",
        "burghers-of-calais-rodin-min-0608",
        "kiss-rodin-min-0609",
        "absinthe-drinker-manet-min-1778",
        "tahitian-woman-flower-gauguin-min-1828"
      ]
    },
    "half": {
      "title": "半天｜看懂古代、雕塑与现代绘画怎样咬合",
      "note": "在90分钟核心上扩展到23件：补入埃及王室形象、古代名人肖像与政治肖像、帕尔米拉家庭和贸易身份、现代身体、丹麦—罗马桥梁及现代风景。建议在帕尔米拉之后回冬园休息，再进入近代部分。《圣雷米风景》为SMK寄存，本路线不预设它当天可见；希腊—罗马节点也以重排期现场开放为准。",
      "workIds": [
        "water-mother-kai-nielsen",
        "rayet-head-in-0418",
        "ramses-ii-ptah-colossal-dyad",
        "amenemhat-iii-head-aein-0924",
        "head-of-princess-aein-1663",
        "gemni-e-hat-funerary-equipment",
        "demosthenes-in-2782",
        "homer-in-2818",
        "portrait-pompey-great-official-highlight",
        "casali-sarcophagus-in-0843",
        "beauty-of-palmyra-in-2795",
        "palmyra-man-camel-official-media",
        "palmyra-sarcophagus-lid-couple-official-media",
        "panther-hunter-jerichau-min-0367",
        "burghers-of-calais-rodin-min-0608",
        "kiss-rodin-min-0609",
        "little-dancer-degas-min-2651",
        "via-sacra-eckersberg-min-2611",
        "autumn-morning-sortedam-koebke-min-1756",
        "absinthe-drinker-manet-min-1778",
        "flood-at-giverny-monet-min-3632",
        "tahitian-woman-flower-gauguin-min-1828",
        "amusement-evil-spirit-gauguin-min-1832"
      ]
    },
    "all": {
      "title": "完整浏览｜分两次读完一座收藏家的美学世界",
      "note": "覆盖全部40件，但建议拆成两次。第一次依次看冬园、埃及、希腊—罗马和帕尔米拉，重点比较原始用途、复制、色彩与记忆；第二次从丹麦和法国雕塑进入丹麦绘画及法国现代艺术，重点比较古典典范、城市生活、版本与殖民观看。若同日完成，在帕尔米拉后安排长休息，并把所有不可见作品视为内容库节点而非必须折返的打卡点。路线不声称实时馆内导航。",
      "workIds": [
        "water-mother-kai-nielsen",
        "rayet-head-in-0418",
        "prehistoric-egyptian-hippopotamus",
        "ramses-ii-ptah-colossal-dyad",
        "amenemhat-iii-head-aein-0924",
        "head-of-princess-aein-1663",
        "treasury-master-gebu",
        "anubis-jackal-headed-god",
        "gemni-e-hat-funerary-equipment",
        "demosthenes-in-2782",
        "homer-in-2818",
        "portrait-pompey-great-official-highlight",
        "sciarra-amazon-in-1568",
        "diana-of-nemi-in-1517",
        "casali-sarcophagus-in-0843",
        "beauty-of-palmyra-in-2795",
        "palmyra-man-camel-official-media",
        "palmyra-boy-bird-official-media",
        "yarhai-servant-palmyra-official-media",
        "palmyra-sarcophagus-lid-couple-official-media",
        "palmyra-altar-two-hands-official-media",
        "wrathful-achilles-bissen-min-0027",
        "panther-hunter-jerichau-min-0367",
        "burghers-of-calais-rodin-min-0608",
        "kiss-rodin-min-0609",
        "little-dancer-degas-min-2651",
        "via-sacra-eckersberg-min-2611",
        "florentine-mirror-henriques",
        "mother-denmark-jerichau-baumann",
        "autumn-morning-sortedam-koebke-min-1756",
        "smoking-party-bendz-min-1881",
        "mont-blanc-rousseau-min-1783",
        "absinthe-drinker-manet-min-1778",
        "flood-at-giverny-monet-min-3632",
        "landscape-saint-remy-van-gogh-smk-1840",
        "skaters-frederiksberg-gauguin-min-3213",
        "double-vase-breton-girl-gauguin-min-3548",
        "breton-shepherdess-gauguin-min-1827",
        "tahitian-woman-flower-gauguin-min-1828",
        "amusement-evil-spirit-gauguin-min-1832"
      ]
    }
  },
  frye: {
    "90": {title:"90 分钟 · 先看懂这家馆的性格",note:"先抓创馆收藏的慕尼黑主线，再用两件当代作品看 Frye 如何反问自己的旧眼光；具体在展状态以 On View 为准。",workIds:["sin","condemned","soap-bubbles","picture-book","three-firs","chief-seattle","prayer-hands","free-me"]},
    half: {title:"半天 · 从旧沙龙走到当代收藏",note:"保留 90 分钟骨架，再补施图克、风景、学院派人体与当代档案；馆不大，时间主要花在比较，不花在赶路。",workIds:["sin","judgment-paris","condemned","soap-bubbles","picture-book","three-firs","birch-grove","dordrecht","in-the-woods","chief-seattle","prayer-hands","free-me","fruits-plenty","gentle-angry-women","not-waving"]},
    all: {title:"完整浏览 · 20 件",note:"20 件是跨轮换内容库，不代表当天同时在展；先按馆方 On View 筛选，再顺着四条主线看。",workIds:[]}
  },
  "designmuseum-danmark": {
    "90": {
      "title": "90分钟：看懂这家馆为何不只是“名椅展厅”",
      "note": "先用馆舍建立“功能、人体与展示”的总问题，再快速经过跨文化工艺、工业日用品和Danish Modern，最后以潘顿椅与档案书收束材料和过程。主动跳过多数历史工艺、珠宝、瓷器和平面设计支线。除馆舍与2026年确认在展的潘顿椅外，其余节点须以当日展厅为准；遇到未展对象就直接跳过，不为寻找单件打乱节奏。",
      "workIds": [
        "royal-frederiks-hospital-museum-interiors",
        "krohn-heron-service-wine-cooler-1885-88",
        "malling-hansen-writing-ball-1870s",
        "kaare-klint-red-chair-1927",
        "wegner-round-chair-jh501-1947",
        "finn-juhl-butterfly-coffee-table-prototype-1949",
        "wegner-valet-chair-jh540-1953",
        "panton-chair-1960-1967-68",
        "lisbet-friis-archive-book-2021"
      ]
    },
    "half": {
      "title": "半天：从范本收藏走到原型、量产与国际品牌",
      "note": "约3至4小时。按七章顺序建立完整骨架：馆舍与机构史、历史范本、日本转译、艺术与工艺边界、日常工业品、Danish Modern、材料实验。中段在日用品章节后休息，再进入家具密集段。路线包含多件展出状态未知对象，入馆后应按当日开放展厅做同章替换或跳过；明永乐壶与明确不在展的PH 5/5灯具不纳入本路线。",
      "workIds": [
        "royal-frederiks-hospital-museum-interiors",
        "spengler-temple-spiral-staircase-1760",
        "flora-danica-four-sided-serving-dish",
        "sano-naoyoshi-tsuba-c1775",
        "krohn-heron-service-wine-cooler-1885-88",
        "rasmus-fenhann-hikari-lamp-2005",
        "gauguin-jug-self-portrait-1889",
        "bindesboll-carlsberg-label-1904",
        "malling-hansen-writing-ball-1870s",
        "bernadotte-bjorn-margrethe-bowl-1954",
        "kaare-klint-red-chair-1927",
        "wegner-round-chair-jh501-1947",
        "finn-juhl-butterfly-coffee-table-prototype-1949",
        "wegner-valet-chair-jh540-1953",
        "kjaerholm-pk0-prototype-1952",
        "henningsen-artichoke-lamp-1957",
        "panton-chair-1960-1967-68",
        "lisbet-friis-archive-book-2021"
      ]
    },
    "all": {
      "title": "完整浏览：30件作品，两次看完一套设计判断系统",
      "note": "覆盖全部30件，建议分两次而非压进一天。第一次看第1、5、6、7章，集中于馆舍、日用品、Danish Modern与原型材料；第二次看第2、3、4章，处理历史工艺、收藏分类、日本线与世纪之交的边界变化。两次都在家具密集段前安排休息。此路线是内容库顺序，不代表30件同时在展：明永乐壶为轮换对象，PH 5/5灯具明确不在展，其余多数也须核对当日状态；不可见条目作为馆藏理解节点保留，不应在现场耗时寻找。",
      "workIds": [
        "royal-frederiks-hospital-museum-interiors",
        "kroyer-portrait-pietro-krohn-1887",
        "henningsen-ph-5-5-lighting-system-1926",
        "spengler-temple-spiral-staircase-1760",
        "flora-danica-four-sided-serving-dish",
        "ming-yongle-jug-handle-spout",
        "sano-naoyoshi-tsuba-c1775",
        "hiroshige-lake-satta-suruga-1858",
        "krohn-heron-service-wine-cooler-1885-88",
        "rasmus-fenhann-hikari-lamp-2005",
        "gauguin-jug-self-portrait-1889",
        "lalique-gold-enamel-opal-pin-1898-99",
        "hegermann-lindencrone-porcelain-vase-1899-1900",
        "bindesboll-carlsberg-label-1904",
        "malling-hansen-writing-ball-1870s",
        "nilfisk-l10-vacuum-cleaner-1922",
        "bernadotte-bjorn-margrethe-bowl-1954",
        "jacobsen-cylinda-line-1967",
        "kaare-klint-red-chair-1927",
        "wegner-round-chair-jh501-1947",
        "finn-juhl-butterfly-coffee-table-prototype-1949",
        "riis-carstensen-finn-juhl-easy-chair-1953",
        "wegner-valet-chair-jh540-1953",
        "gudme-leth-tree-pattern-1937",
        "kjaerholm-pk0-prototype-1952",
        "panton-s-chair-1956",
        "henningsen-artichoke-lamp-1957",
        "panton-chair-1960-1967-68",
        "grete-jalk-bow-chair-1963",
        "lisbet-friis-archive-book-2021"
      ]
    }
  },
  "nationalmuseum": {
    "90": {
      "title": "90分钟：看懂这家馆为何值得专程安排",
      "note": "先看老大师与法国—瑞典文化输入，再用学院、古斯塔夫时代雕塑和珍宝室理解国家收藏机制；在雕塑庭院比较两位北欧神祇，最后把《仲冬祭》的楼梯原位体验与1930年代设计并读。主动跳过轮换中的纸本、未确认在展的《克劳狄乌斯·西维利斯》和多数深度对照；以下顺序是内容优先级，不是实时导航。",
      "workIds": [
        "rembrandt-kitchen-maid-17587",
        "boucher-triumph-venus-17773",
        "roslin-lady-with-veil-21152",
        "elias-martin-gustav-academy-35234",
        "sergel-cupid-psyche-26739",
        "henrichsen-gustav-gold-box-244051",
        "fogelberg-thor-26782",
        "fogelberg-balder-26783",
        "larsson-midwinter-sacrifice-32534",
        "lewerentz-grand-piano-96678",
        "mathsson-reclining-chair-134846"
      ]
    },
    "half": {
      "title": "半天：从王室收藏走到瑞典现代设计",
      "note": "按六个章节的逻辑覆盖主馆最重要的在展节点，并在法国十八世纪、塞尔格尔和现代设计处保留成组比较。中途可在古斯塔夫时代章节后休息；《刻瑞斯寻找普洛塞耳皮娜》位于易变的临时展陈环境，本路线不把它当作稳定必见对象。",
      "workIds": [
        "anguissola-canon-regular-640747",
        "el-greco-peter-paul-20131",
        "rembrandt-kitchen-maid-17587",
        "aved-count-tessin-22585",
        "boucher-triumph-venus-17773",
        "chardin-morning-toilet-17785",
        "wertmuller-marie-antoinette-18035",
        "roslin-lady-with-veil-21152",
        "elias-martin-gustav-academy-35234",
        "sergel-faun-26823",
        "sergel-cupid-psyche-26739",
        "henrichsen-gustav-gold-box-244051",
        "fogelberg-thor-26782",
        "fogelberg-balder-26783",
        "bergh-artist-eva-bonnier-18510",
        "larsson-midwinter-sacrifice-32534",
        "lewerentz-grand-piano-96678",
        "mathsson-reclining-chair-134846",
        "ohrstrom-ariel-vase-11625"
      ]
    },
    "all": {
      "title": "完整浏览：30件读完国家视觉文化的形成与修订",
      "note": "把完整路线分为至少两个时段：第一段看早期绘画、法国—瑞典交流、古斯塔夫时代与雕塑庭院；第二段看十九世纪国家图像、《仲冬祭》和现代设计。全部30件是内容库的完整结构，不是单日可见承诺：轮换或状态未明的对象若未展出，保留其章节位置但不要在馆内寻找；纸本和小型珍宝需要更慢的近距离观看。",
      "workIds": [
        "anguissola-canon-regular-640747",
        "el-greco-peter-paul-20131",
        "rembrandt-kitchen-maid-17587",
        "rembrandt-claudius-civilis-17581",
        "elias-martin-gustav-academy-35234",
        "aved-count-tessin-22585",
        "boucher-triumph-venus-17773",
        "boucher-study-triton-214899",
        "chardin-morning-toilet-17785",
        "wertmuller-marie-antoinette-18035",
        "roslin-lady-with-veil-21152",
        "sergel-faun-26823",
        "sergel-cupid-psyche-26739",
        "sergel-ceres-proserpine-26828",
        "sergel-gustav-statue-study-71152",
        "sergel-noisy-dinner-14667",
        "henrichsen-gustav-gold-box-244051",
        "bourdillon-pocket-watch-6842",
        "fogelberg-thor-26782",
        "fogelberg-balder-26783",
        "pauli-breakfast-time-18709",
        "bergh-artist-eva-bonnier-18510",
        "gauguin-landscape-brittany-19216",
        "zorn-midsummer-dance-18607",
        "larsson-midwinter-sacrifice-32534",
        "mathsson-reclining-chair-134846",
        "lewerentz-grand-piano-96678",
        "hald-celestial-globe-7985",
        "ohrstrom-ariel-vase-11625",
        "boden-rorstrand-vase-230112"
      ]
    }
  },
  "rosenborg": {
    "90": {
      "title": "90分钟：从国王的身体走到仍在使用的王冠珠宝",
      "note": "只保留决定84分结论的最高回报节点：先看克里斯蒂安四世的私人空间与战伤遗物，再以骑士厅建立权力环境，最后到地下Treasury比较两顶王冠、涂油壶和两套最能说明“继续改装与使用”的珠宝。主动跳过多数过渡房间、外交陈设、传说型奇珍和酒窖；冬室若当日因修复不可见，不把它当作可照走的节点，将时间留给卧室与Treasury。",
      "workIds": [
        "winter-room-room-1",
        "christian-iv-bedchamber-room-3",
        "christian-iv-blood-stained-clothes",
        "knights-hall-room-21",
        "christian-iii-sword-of-state",
        "christian-iv-crown",
        "christian-v-crown",
        "ampulla",
        "emerald-set",
        "rose-cut-diamond-set"
      ]
    },
    "half": {
      "title": "半天：看懂一座私人城堡怎样变成仍在运作的王朝博物馆",
      "note": "在90分钟核心线上加入大理石厅、《1660年致敬》、玻璃陈列室、独角鲸牙王座、王室酒和明亮式切割钻石套装，覆盖历史室内、政治图像、宫廷工艺、饮食传统与王冠珠宝。建议先完成城堡房间，再下到酒窖和Treasury；现场看到的是空历史酒桶，仍被使用的酒液已另存。仍主动略过公主漆室、玫瑰厅、Oldenborg角杯和珍珠红宝石套装。",
      "workIds": [
        "winter-room-room-1",
        "christian-iv-bedchamber-room-3",
        "christian-iv-blood-stained-clothes",
        "marble-room-room-5",
        "homage-of-1660",
        "knights-hall-room-21",
        "narwhal-throne",
        "glass-cabinet-room-22",
        "rosenborg-wine",
        "christian-iii-sword-of-state",
        "christian-iv-crown",
        "christian-v-crown",
        "ampulla",
        "emerald-set",
        "brillant-cut-diamond-set",
        "rose-cut-diamond-set"
      ]
    },
    "all": {
      "title": "完整浏览：房间、酒窖与Treasury的20个节点",
      "note": "覆盖全部入选对象，但不把内容库伪装成必须连续打卡的清单。优先按城堡房间的大致层级推进，把同室或相邻意义的对象合并观看；休息后再进入酒窖与地下Treasury，依次处理奇珍、礼器、王冠和四套珠宝。若历史房间因修复关闭或珠宝组件临时离柜，保留其解释位置并明确记为当日不可见，不用其他作品冒充。",
      "workIds": [
        "winter-room-room-1",
        "christian-iv-bedchamber-room-3",
        "christian-iv-blood-stained-clothes",
        "marble-room-room-5",
        "princess-lacquer-chamber-room-9",
        "the-rose-room-13",
        "homage-of-1660",
        "knights-hall-room-21",
        "narwhal-throne",
        "glass-cabinet-room-22",
        "rosenborg-wine",
        "oldenborg-horn",
        "christian-iii-sword-of-state",
        "christian-iv-crown",
        "christian-v-crown",
        "ampulla",
        "emerald-set",
        "brillant-cut-diamond-set",
        "rose-cut-diamond-set",
        "pearl-ruby-set"
      ]
    }
  },
  "louisiana": {
    "90": {
      "title": "90分钟：用九个节点判断 Louisiana 是否值得",
      "note": "从北翼贾科梅蒂入口与约恩核心开始，经音乐厅进入公园，最后在南翼开放时看草间弥生。主动跳过摄影、长时影像和多数轮换作品；若天气差，优先保留室内五站并缩短公园段。音乐厅或南翼受限时，不以其他轮换作品假装替代。",
      "workIds": [
        "giacometti-spoon-woman",
        "giacometti-walking-woman-i",
        "giacometti-walking-man",
        "dumas-mourning-marsyas",
        "jorn-die-gedanken-sind-frei",
        "hockney-a-closer-grand-canyon",
        "moore-reclining-figure-no-5",
        "serra-the-gate-in-the-gorge",
        "kusama-gleaming-lights-of-the-souls"
      ]
    },
    "half": {
      "title": "半天：从收藏组群走到建筑与地形",
      "note": "先完整建立北翼的贾科梅蒂与约恩比较组，再看音乐厅、当前可核验的美国与当代影像节点，随后用公园路线理解运动、组群和场域性，南翼开放时以草间弥生收束。草间弥生、音乐厅和影像播放均须以当日开放为准；公园段预留天气与步行弹性。",
      "workIds": [
        "giacometti-spoon-woman",
        "giacometti-walking-woman-i",
        "giacometti-grande-tete",
        "giacometti-walking-man",
        "dumas-mourning-marsyas",
        "jorn-die-gedanken-sind-frei",
        "jorn-ojets-blikstille",
        "hockney-a-closer-grand-canyon",
        "majerus-weisses-bild",
        "ruscha-figure-it-on-out",
        "cahen-nashi",
        "kentridge-sibyl",
        "calder-little-janey-waney",
        "heerup-granite-sculptures",
        "moore-reclining-figure-no-5",
        "serra-the-gate-in-the-gorge",
        "trakas-self-passage",
        "kusama-gleaming-lights-of-the-souls"
      ]
    },
    "all": {
      "title": "完整浏览：30件分两次，稳定锚点与轮换馆藏分开处理",
      "note": "第一次按北翼—音乐厅—当代展区—雕塑公园走稳定或已确认节点；第二次只在到访前核实展厅后补看《森林》、波洛克、培根、乌雷、戈尔丁、阿勃丝、利希滕斯坦和克莱因等轮换或当前状态未知作品。以下顺序是编辑观看顺序，不是实时导航；实际位置随馆藏重组而变。戈尔丁单件约需24分钟，建议单独留出完整播放时间。",
      "workIds": [
        "giacometti-spoon-woman",
        "giacometti-walking-woman-i",
        "giacometti-grande-tete",
        "giacometti-walking-man",
        "dumas-mourning-marsyas",
        "jorn-die-gedanken-sind-frei",
        "jorn-ojets-blikstille",
        "hockney-a-closer-grand-canyon",
        "majerus-weisses-bild",
        "ruscha-figure-it-on-out",
        "cahen-nashi",
        "kentridge-sibyl",
        "el-anatsui-akua-surviving-children",
        "kusama-gleaming-lights-of-the-souls",
        "laurens-grande-femme-debout-a-la-draperie",
        "calder-little-janey-waney",
        "miro-personnage",
        "heerup-granite-sculptures",
        "moore-reclining-figure-no-5",
        "kirkeby-tor-ii",
        "serra-the-gate-in-the-gorge",
        "trakas-self-passage",
        "giacometti-la-foret",
        "bacon-three-studies-of-george-dyer",
        "pollock-black-over-yellow",
        "klein-three-monochromes",
        "lichtenstein-louisiana-painting-dorothy-sound",
        "ulay-she",
        "arbus-albino-sword-swallower-at-a-carnival",
        "goldin-memory-lost"
      ]
    }
  },
  "mfa-boston": {
    "90": {
      "title": "90分钟：先验证MFA为何值得专程",
      "note": "从亨廷顿大道入口的公共雕塑开始，随后只抓美洲、古埃及和欧洲绘画的评分锚点，并以萨金特原位壁画收束。法国绘画四件的锁定证据未确认当天展出，入馆后只执行其中实际开放者；若均不可见，把时间留给孟卡拉组像与美洲艺术。主动跳过日本纸本、纺织、小型护身符和大部分补充节点。本路线是编辑顺序，不是实时导航。",
      "workIds": [
        "appeal-to-great-spirit",
        "watson-and-the-shark",
        "paul-revere-portrait",
        "sons-of-liberty-bowl",
        "king-menkaura-and-queen",
        "menkaura-hathor-hare-nome",
        "bust-prince-ankhhaf",
        "statue-lady-sennuwy",
        "grainstack-sunset-monet",
        "slave-ship-turner",
        "where-do-we-come-from-gauguin",
        "sargent-athena-mural"
      ]
    },
    "half": {
      "title": "半天：把四条收藏形成史连起来",
      "note": "在90分钟锚点上加入古希腊与近东、南亚和东南亚、日本艺术、纺织及法国人物画。日本手卷、《图像拼布被》等轮换作品，以及其他状态未知作品，只在当天确认展出时停留；不在展时不要为凑清单折返。预留一次庭院或公共空间休息，并把萨金特壁画作为跨馆区转换点。",
      "workIds": [
        "appeal-to-great-spirit",
        "watson-and-the-shark",
        "paul-revere-portrait",
        "sons-of-liberty-bowl",
        "pictorial-quilt-harriet-powers",
        "king-menkaura-and-queen",
        "menkaura-hathor-hare-nome",
        "bust-prince-ankhhaf",
        "statue-lady-sennuwy",
        "hittite-fist-vessel",
        "mantiklos-apollo",
        "durga-mahishasuramardini-java",
        "mughal-pictorial-carpet",
        "miroku-bosatsu-kaikei",
        "night-attack-sanjo-palace",
        "la-japonaise-monet",
        "grainstack-sunset-monet",
        "dance-at-bougival",
        "postman-joseph-roulin",
        "slave-ship-turner",
        "where-do-we-come-from-gauguin",
        "sargent-athena-mural"
      ]
    },
    "all": {
      "title": "完整浏览：37件分两次看完",
      "note": "这是一套内容库而非一天必走清单。第一次建议看入口与美洲、古代尼罗河及萨金特空间；第二次看日本与亚洲其余区域，再集中处理欧洲绘画。每次约半天并安排休息。纸本、纺织、外借和状态未知作品须在到馆前核对；未展作品保留为收藏理解节点，不应伪装成现场停靠点。",
      "workIds": [
        "appeal-to-great-spirit",
        "paul-revere-portrait",
        "sons-of-liberty-bowl",
        "watson-and-the-shark",
        "daughters-edward-darley-boit",
        "in-the-loge-cassatt",
        "pictorial-quilt-harriet-powers",
        "questioner-of-sphinx",
        "king-menkaura-and-queen",
        "menkaura-hathor-hare-nome",
        "bust-prince-ankhhaf",
        "statue-lady-sennuwy",
        "isis-knot-amulet-tabiry",
        "mentuhotep-iii-osiride-statue",
        "hittite-fist-vessel",
        "neo-assyrian-cylinder-seal",
        "eye-horus-amulet",
        "mantiklos-apollo",
        "sargent-athena-mural",
        "miroku-bosatsu-kaikei",
        "night-attack-sanjo-palace",
        "nihonbashi-thirty-six-views",
        "utamaro-woman-letter-mosquito-net",
        "hokusai-two-carp-waterfall",
        "durga-mahishasuramardini-java",
        "maharana-sangram-monsoon",
        "mughal-pictorial-carpet",
        "artist-in-his-studio-rembrandt",
        "slave-ship-turner",
        "the-sower-millet",
        "bocca-baciata-rossetti",
        "woman-parasol-child-renoir",
        "dance-at-bougival",
        "la-japonaise-monet",
        "grainstack-sunset-monet",
        "postman-joseph-roulin",
        "where-do-we-come-from-gauguin"
      ]
    }
  }
};

const contentUpdatedAtByMuseum = {
  alhambra:"2026-07-21", anchorage:"2026-07-20", british:"2026-07-20", chichu:"2026-07-23",
  egyptian:"2026-07-22", enoura:"2026-07-20", getty:"2026-07-21", glyptotek:"2026-07-21",
  frye:"2026-07-22", louvre:"2026-07-20", met:"2026-07-22", muxin:"2026-07-23", seattle:"2026-07-26", smk:"2026-07-21", vienna:"2026-07-24",
  "designmuseum-danmark":"2026-08-05",
  "nationalmuseum":"2026-08-05",
  "rosenborg":"2026-08-05",
  "louisiana":"2026-08-05",
  "smk":"2026-08-04",
  "glyptotek":"2026-08-04",
  "mfa-boston":"2026-08-06"
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
