// Anchorage Museum — 20 hand-authored works and collection objects, rendered by museum-app.js.
const anchorageOfficial = "https://www.anchoragemuseum.org/";
const anchorageVisit = "https://www.anchoragemuseum.org/visit/";
const anchorageAudio = "https://www.anchoragemuseum.org/visit/access/audiovisual-descriptions/";
const anchorageAlaska = "https://www.anchoragemuseum.org/exhibits/alaska-exhibition/";
const anchorageDenaina = "https://www.anchoragemuseum.org/exhibits/denainaq-huchulyeshi-the-denaina-way-of-living/denaina-object-gallery/";
const amImage = path => `https://www.anchoragemuseum.org${path}`;

const anchorageWorks = [
  ["denali-laurence","land","麦金利山（德纳里）","Mt. McKinley","Sydney Laurence","1929 年","/media/12879/mt-mckinley-laurence-img_1370-800px.jpg","绝对不可错过","重要藏品","山峰不是地理记录，而是一座从暗色前景里自己发光的北方纪念碑。",anchorageAudio],
  ["muir-glacier","land","缪尔冰川","Muir Glacier","Thomas Hill","1889 年","/media/12884/muir-glacier-hill-img_1371-800px.jpg","绝对不可错过","重要藏品","细小船只把冰墙的尺度突然打开，也留下冰川退缩前的视觉证词。",anchorageAudio],
  ["resurrection-bay","land","阿拉斯加复活湾","Resurrection Bay, Alaska","Rockwell Kent","1965 年","/media/12896/resurrection-bay-kent-img_1382-800px.jpg","重点推荐","重要藏品","肯特把海湾削成大块冷色和坚硬轮廓，北方因此像一种选择过的生活，而不是旅游风景。",anchorageAudio],
  ["fisher-women","land","阿拉斯加渔妇","Alaska Fisher Women","Louise Gilbert","1935 年","/media/12901/alaska-fisher-women-gilbert-img_1378-800px.jpg","重点推荐","特色看点","鱼、劳动者和岸边工具共同占据画面，宏大荒野第一次把位置让给日常工作。",anchorageAudio],
  ["miowak","people","米奥瓦克（Mayuġiak）","Miowak (Mayuġiak)","Fred Machetanz","1937 年","/media/18903/1972-106-001-1.jpg","重点推荐","重要藏品","标题保留了画家的误拼；真正值得认识的是画中人的名字、领导力和她与画家的关系。","https://www.anchoragemuseum.org/exhibits/extra-tough-women-of-the-north/"],
  ["everything-love","people","我爱的一切都在这里","Everything I Love Is Here","Alvin Amason","2017 年","/media/12888/everything-i-love-is-here-amason-img_1372-800px.jpg","绝对不可错过","重要藏品","熊、海、家族记忆和三维附着物挤在一起：Sugpiaq 经验不是背景，而是画面组织方法。",anchorageAudio],
  ["idiot-strings","people","傻瓜绳 IV","Idiot Strings IV","Sonya Kelliher-Combs","2005 年","/media/12890/idiot-strings-iv-kelliher-combs-img_1374-800px.jpg","重点推荐","重要藏品","一串柔软小形体看似熟悉，却拒绝被简单认成护身符、器官或装饰。",anchorageAudio],
  ["punk-nanuk","people","朋克北极熊之灵","Punk Nanuk Inua","Lawrence James Beck","1986 年","/media/12898/punk-nanuk-inua-beck-img_1376-800px.jpg","绝对不可错过","重要藏品","金属、塑料、羽毛和橡胶拼成一张机器脸，逼“传统材料”与工业废料正面相遇。",anchorageAudio],
  ["radio-babies","people","收音机宝宝","Radio Babies","George Ahgupuk","20 世纪；现场标签核验","/media/15107/radiobabies.jpg","重点推荐","重要藏品","旧式广播技术进入日常生活，被一位 Iñupiaq 艺术家转译成社区自己的现代经验。","https://www.anchoragemuseum.org/programs/for-educators/online-resources/art-radio-babies/"],
  ["blueberries","people","蓝莓","Blueberries","James Robert Schoppert","20 世纪；现场标签核验","/media/15567/1986-036-001ac-1-arend-schoppert-small.jpg","重点推荐","重要藏品","桤木浮雕没有复制一篮水果，而把采集、土地与 Tlingit 当代艺术压进刀痕和色块。","https://www.anchoragemuseum.org/programs/for-educators/online-resources/art-blueberries/"],
  ["gut-cape","materials","海狮肠衣斗篷","Chugaayux (Gut Cape)","Unangan 缝制者","约 1880 年","/media/9381/1986-031-001-1-arend.jpg","绝对不可错过","重要藏品","轻、薄、防水的海狮肠膜被做成威望服饰；技术、贸易接触与身份同时写在接缝里。",anchorageAlaska],
  ["alutiiq-hat","materials","Alutiiq 猎帽","Alutiiq Hat","Alutiiq / Sugpiaq 制作者","19 世纪中叶","/media/9383/2004-064-001-1-arend-1-copy.jpg","绝对不可错过","重要藏品","弯木帽把海上视线、猎手身份和海狮胡须的运动感组合成一件可穿戴雕塑。",anchorageAlaska],
  ["birch-basket","materials","Dena’ina 白桦树皮篮","Birch Bark Basket","Dena’ina 制作者","1916—1917 年","/media/9440/1997-048-001-1-arend.jpg","重点推荐","特色看点","看似朴素的树皮容器能采集、储藏，甚至装水加热石烹煮；材料知识比外观更值得看。",anchorageAlaska],
  ["kayak-model","denaina","皮艇模型","Biqidin Gga (Kayak Model)","Dena’ina 制作者","1916—1917 年","/media/4566/1_15-amrc_c5r9612.jpg","重点推荐","特色看点","三十多厘米的模型保存了真实皮艇的分工与结构，也提示 Cook Inlet 上文化技术如何流动。",anchorageDenaina],
  ["bear-gut-parka","denaina","熊肠雨衣","Vak’izhegi (Bear Gut Parka)","Helen Dick 与家人","2008 年","/media/4581/2010_10_1-8x10.jpg","绝对不可错过","重要藏品","四只熊的肠膜和一份对祖母的承诺，让所谓古老技术在 2008 年继续成为活知识。",anchorageDenaina],
  ["dentalium-necklace","denaina","角贝项链","T’uyedi (Dentalium Necklace)","Dena’ina 制作者","约 1902 年","/media/4573/13_33-amrc_c5r9417.jpg","重点推荐","重要藏品","这不是单纯装饰：角贝沿西北海岸远距离流通，项链又在多次 potlatch 中转交领导者。",anchorageDenaina],
  ["fish-trap","denaina","白鱼鱼笼","Taz’in (Fish Trap)","Helen、Alan、Wayne 与 Bryan Dick","2009 年","/media/4575/13_29_amrc_w2k3874.jpg","重点推荐","重要藏品","三代人共同复原鱼笼；博物馆保存的不只是成品，还有谁教谁、为什么春季白鱼曾决定生存。",anchorageDenaina],
  ["feather-headdress","denaina","羽毛头饰","Chijeł (Feather Headdress)","Dena’ina 制作者","19 世纪末","/media/4567/1-44-amrc_c5r6015.jpg","重点推荐","重要藏品","一件与萨满使用相连的头饰，因明确的 potlatch 转赠链而不仅是匿名“民族学标本”。",anchorageDenaina],
  ["story-knife","hidden","故事刀","Story Knife","Anna Martins","1972 年","/media/18679/1972-082-001-bt-overall-2.jpg","冷门但值得","特色看点","小刀既能在泥地或雪地画故事，也训练空间、记忆与缝纫图样；游戏和教育没有被分开。","https://www.anchoragemuseum.org/exhibits/extra-tough-women-of-the-north/"],
  ["yupik-doll","hidden","圣劳伦斯岛 Yupik 娃娃","St. Lawrence Island Yupik Doll","Josephine Ungott","1956 年","/media/18675/1965-014-033-1.jpg","冷门但值得","特色看点","海豹肠、海雀羽毛和鸟喙把服装知识缩进娃娃；儿童物件也是材料与角色学习的工具。","https://www.anchoragemuseum.org/exhibits/extra-tough-women-of-the-north/"]
];

museumData.anchorage = {
  id:"anchorage",editorialCapacity:20,city:"安克雷奇 · 美国",zh:"安克雷奇博物馆",en:"Anchorage Museum",
  ...museumRatings.anchorage,
  verdict:"它不是用一件世界名作定义阿拉斯加，而是把北方的艺术、原住民知识、历史和环境放回同一张地图。",
  hero:amImage("/media/9247/2015_lunchonlawn_2.jpg"),contentFile:"./research/anchorage-content-v1.md",
  intro:[
    "这家馆最特别的不是某一种门类，而是它拒绝把阿拉斯加拆成‘壮丽风景’与‘民族学过去’。Art of the North、Alaska Exhibition 与馆内 Smithsonian Arctic Studies Center 让绘画、生活技术、殖民史和当代原住民声音彼此校正。",
    "馆藏超过 26,000 件对象，并有超过 700,000 张历史照片与档案；长期展出的 Smithsonian 文化遗产则属于借展，不能混写成馆方所有。下面的 20 件既包括当前常设展重点，也包括可能轮换的馆藏对象。",
    "第一次来用 90 分钟抓住八件；半天看十五件。不要为了集齐名单牺牲 Alaska Exhibition 和 Living Our Cultures 的语境，因为这家馆的最高价值恰恰来自对象之间的关系。"
  ],
  official:anchorageOfficial,visit:anchorageVisit,
  chapters:[
    {id:"land",number:"01",title:"北方风景是谁发明出来的",intro:"从浪漫主义冰川到肯特的现代构图，先看‘荒野’如何被选择和加工。"},
    {id:"people",number:"02",title:"当画中人不再只是风景里的居民",intro:"肖像、材料拼贴与当代原住民艺术，把人物姓名、社区经验和现代生活带回中心。"},
    {id:"materials",number:"03",title:"严寒怎样逼出材料智慧",intro:"肠膜、弯木、树皮不是猎奇材料，而是对水、风、运输和身份的精确回答。"},
    {id:"denaina",number:"04",title:"一件物品怎样继续活在关系里",intro:"模型、服装、项链和鱼笼通过制作与转赠链，拒绝成为没有人的‘标本’。"},
    {id:"hidden",number:"05",title:"冷门但值得：孩子怎样学习北方",intro:"故事刀与娃娃把游戏、记忆、服装和环境知识缩进小物件。"}
  ],
  works:anchorageWorks.map((w,i)=>({
    id:w[0],ch:w[1],zh:w[2],en:w[3],by:w[4],date:w[5],
    place:i<13?"Anchorage Museum 常设展区；当天位置须现场核验":"Anchorage Museum 馆藏；是否展出须现场核验",
    tag:w[7],significance:w[8],time:i<8?"8 分钟":"6 分钟",image:amImage(w[6]),imageSource:w[10],source:w[10],look:w[9],story:w[9],again:w[9],preciousWhy:w[9],cardSummary:w[9],unavailable:i>=18
  }))
};
