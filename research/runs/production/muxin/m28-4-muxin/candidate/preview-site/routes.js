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
    "90": {title:"90 分钟 downtown 主馆路线",note:"全程只在 1300 First Avenue；先看西北与原住民骨架，再进入一件现代绘画。",workIds:["puget","raven","hat","lorenzetti","sea-change","salt-cellar"]},
    half: {title:"半天 downtown 主馆路线",note:"保留 90 分钟骨架，再补肖像、欧洲叙事与战后现代艺术；不跨往另外两处场址。",workIds:["puget","raven","hat","lorenzetti","sea-change","salt-cellar","cassatt","aeneid","rothko-11","gorky-apron","double-elvis","sound-box"]},
    all: {title:"完整浏览 · downtown 20 件",note:"只覆盖 Seattle Art Museum downtown 主馆；馆藏轮换时按现场替换，不为集齐清单折返。",workIds:[]}
  },
  vienna: {
    "90": {title:"90 分钟 · 八件不可替代之物",note:"先抓住勃鲁盖尔、维米尔、委拉斯开兹，再用萨列拉和奥古斯都宝石浮雕证明这不是一座只看油画的馆。",workIds:["hunters","babel","art-painting","infanta-blue","madonna-meadow","convex","saliera","gemma"]},
    half: {title:"半天 · 从名画走进哈布斯堡收藏术",note:"在 90 分钟骨架上补足意大利、北方绘画、Kunstkammer 与古埃及；不要为了按清单顺序反复跨楼层。",workIds:["hunters","babel","wedding","children","art-painting","infanta-blue","jane","madonna-meadow","crowning","philosophers","convex","summer","saliera","krumau","ship","gemma","kani"]},
    all: {title:"完整浏览 · 40 件",note:"四十件适合一整天或分两次看；先确认轮换状态，再在八件冷门作品里按体力选择。",workIds:[]}
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
  }
};

const contentUpdatedAtByMuseum = {
  alhambra:"2026-07-21", anchorage:"2026-07-20", british:"2026-07-20", chichu:"2026-07-23",
  egyptian:"2026-07-22", enoura:"2026-07-20", getty:"2026-07-21", glyptotek:"2026-07-21",
  frye:"2026-07-22", louvre:"2026-07-20", met:"2026-07-22", muxin:"2026-07-23", seattle:"2026-07-21", smk:"2026-07-21", vienna:"2026-07-22"
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
