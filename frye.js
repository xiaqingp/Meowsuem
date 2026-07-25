// Frye Art Museum — 20 selected works. Object records and images checked against official collection pages on 2026-07-22.
const fryeBase = "https://fryemuseum.org";
const fryeRows = [
  ["sin","founding","罪","Die Sünde (Sin)","弗朗茨·冯·施图克 Franz von Stuck · 德国","约 1908 年","1952.169","黑暗中的脸、发亮的身体和盘在肩上的蛇只占窄窄一条画布，却把诱惑做成一次几乎无法回避的对视。","重要藏品","绝对不可错过","9 分钟","/artwork/die-sunde-sin-1952.169","/sites/default/files/images/embark/1952.169_Mafford_Low-Res.jpg"],
  ["judgment-paris","founding","帕里斯的裁决","Urteil des Paris","弗朗茨·冯·施图克 Franz von Stuck · 德国","1923 年","1952.168","三位女神像排练舞台造型，帕里斯却缩在角落；施图克把神话审美比赛画成一场关于谁有权观看的表演。","重要藏品","强烈推荐","7 分钟","/artwork/urteil-des-paris-1952.168","/sites/default/files/images/embark/1952.168_Low-Res.jpg"],
  ["spring-dance","founding","春之舞","Frühlingtanz (Spring Dance)","弗朗茨·冯·施图克 Franz von Stuck · 德国","约 1925 年","1952.165","鲜亮身体绕成圆环，轻快表面下仍有施图克惯用的舞台感：人物像从现实被抽走，只剩节奏、欲望和装饰。","特色看点","强烈推荐","6 分钟","/artwork/fruhlingtanz-spri-1952.165","/sites/default/files/images/embark/1952.165_Fang_Low-Res.jpg"],
  ["condemned","founding","被判刑的人","The Condemned","米哈伊·蒙卡奇 Mihály de Munkácsy · 匈牙利","1869—1872 年","1952.125","囚犯站在房间中央，旁观者的视线像第二重判决；戏剧性不靠刑具，而靠每个人与他之间那一点距离。","重要藏品","绝对不可错过","9 分钟","/artwork/condemned-1952.125","/sites/default/files/images/embark/1952.125_Mafford_Low-Res.jpg"],
  ["soap-bubbles","founding","肥皂泡","Seifenblasen (Soap Bubbles)","加布里埃尔·冯·马克斯 Gabriel von Max · 德国（生于波希米亚）","1881 年","1952.111","孩子吹出的泡泡轻得快要消失，画家却用暗背景和近乎宗教画的安静，把一次游戏推到生命短暂的边缘。","重要藏品","强烈推荐","7 分钟","/artwork/seifenblasen-soap-1952.111","/sites/default/files/images/embark/1952.111_Calderon_Low-Res.jpg"],
  ["picture-book","secession","图画书 I","Das Bilderbuch I","弗里茨·冯·乌德 Fritz von Uhde · 德国","1889 年","1952.174","母亲和孩子围着一本书，最亮的地方落在纸页与脸上；乌德把日常家庭场景画出了祭坛画般的专注。","重要藏品","强烈推荐","7 分钟","/artwork/das-bilderbuch-i-1952.174","/sites/default/files/images/embark/1952.174_Mafford_Low-Res.jpg"],
  ["three-firs","secession","施莱斯海姆的三棵冷杉","Drei Tannen, Schleißheim","威廉·特吕布纳 Wilhelm Trübner · 德国","1904 年","1952.173","三根树干几乎堵住去路，风景的主角成了颜料本身；近看那些短促厚重的笔触，森林会从景物变成表面。","重要藏品","强烈推荐","7 分钟","/artwork/drei-tannen-sch-1952.173","/sites/default/files/images/embark/1952.173_Mafford_Low-Res.jpg"],
  ["birch-grove","secession","白桦林","Birkenwald (Birch Grove)","路德维希·迪尔 Ludwig Dill · 德国","约 1900 年","1952.037","细白树干把空间切成音乐般的竖线，地面只留下低声变化的绿色；这正是慕尼黑分离派把自然简化为节奏的方式。","特色看点","强烈推荐","6 分钟","/artwork/birkenwald-birch-1952.037","/sites/default/files/images/embark/1952.037_Mafford_Low-Res.jpg"],
  ["marion-lenbach","secession","玛丽昂·伦巴赫与尼古拉斯·吉齐斯之女","Marion Lenbach and Daughter of the Painter Nikolaus Gysis","弗朗茨·冯·伦巴赫 Franz von Lenbach · 德国","1899 年","1952.101","一张纸上同时留下两种亲密：女儿的脸被细细完成，旁边孩子像刚从画家的手腕里闪出来。","特色看点","推荐","6 分钟","/artwork/marion-lenbach-and-1952.101","/sites/default/files/images/embark/1952.101_Fang_Low-Res.jpg"],
  ["dordrecht","secession","多德雷赫特：大教堂","Dordrecht, The Cathedral","欧仁·布丹 Eugène Boudin · 法国","约 1885—1889 年","1952.009","天空占去大半块木板，教堂和船只都被天气压低；布丹的厉害，是让云层成为真正不断变化的事件。","重要藏品","强烈推荐","7 分钟","/artwork/dordrecht-cat-1952.009","/sites/default/files/images/embark/1952.009_Fang_Low-Res.jpg"],
  ["in-the-woods","salon","林中","Dans les bois (In the Woods)","威廉—阿道夫·布格罗 William-Adolphe Bouguereau · 法国","1905 年","1952.013","女孩被画得像瓷器一样光洁，树林只是柔软背景；它很讨喜，也正好解释现代主义为何曾把学院派当成反面教材。","特色看点","推荐","6 分钟","/artwork/dans-les-bois-1952.013","/sites/default/files/images/embark/1952.013_Mafford_Low-Res.jpg"],
  ["sun-maiden","salon","太阳少女","Sun Maiden","莉莲·根特 Lillian Genth · 美国","约 1909 年","1952.048","逆光裸像在水边抬起手臂，身体与风景都被暖光磨平；漂亮之外，也能看见女性画家怎样进入当时最受规训的人体题材。","特色看点","推荐","6 分钟","/artwork/sun-maiden-1952.048","/sites/default/files/images/embark/1952.048_Fang_Low-Res.jpg"],
  ["chief-seattle","salon","西雅图酋长","Chief Seattle","亨利·拉申 Henry Raschen · 美国（生于德国）","约 1916 年","1952.135","这张威严肖像并非现场写生，而是后来者对城市同名人物的想象；值得看的，是纪念如何把一个真实领袖固定成方便流通的形象。","重要藏品","强烈推荐","8 分钟","/artwork/chief-seattle-1952.135","/sites/default/files/images/embark/1952.135_Low-Res.jpg"],
  ["critical-point","salon","棋局的关键时刻","A Critical Point in the Game","路易斯·莫勒 Louis Moeller · 美国","约 1903 年","1952.121","几位老人围着棋盘，没人需要做大动作；莫勒靠手势、眼神和等待，把安静房间吊在下一步棋上。","特色看点","冷门但值得","6 分钟","/artwork/critical-point-i-1952.121","/sites/default/files/images/embark/1952.121_Fang_Low-Res.jpg"],
  ["prayer-hands","present","T 型墙祈祷之手","T-Wall Prayer Hands","海芙·卡赫拉曼 Hayv Kahraman · 伊拉克裔美国／瑞典","2023 年","2025.001.01.A–.B","两幅细长身体被军事防爆墙的轮廓切开；卡赫拉曼借熟悉的美人姿态，谈迁徙者如何被边境与安全语言重新塑形。","重要藏品","绝对不可错过","9 分钟","/artwork/t-wall-prayer-hand","/sites/default/files/2025-11/2025.001.01-Kahraman-T_Wall-Fang-Low_Res.jpg"],
  ["free-me","present","把我从这身体里释放","Free me from this body, my voice can carry only so far…","斯凯·霍平卡 Sky Hopinka · 胡—琼克族／路易塞尼奥印第安人佩昌加部落","2020 年","2022.003","云层照片边缘写着一整段像呼吸般延伸的句子；图像看似轻盈，文字却把身体、声音与无法摆脱的重量带回来。","重要藏品","强烈推荐","8 分钟","/node/3025","/sites/default/files/images/embark/2022.003_Fang_Low-Res.jpg"],
  ["cargamonton","present","负重者","CARGAMONTÓN","拉斐尔·索尔迪 Rafael Soldi · 秘鲁裔美国","2022 年","2024.012","八张凹版图像把身体、记忆和负担拆成一组反复出现的片段；系列阅读比挑一张“最好看”的更重要。","重要藏品","强烈推荐","8 分钟","/artwork/cargamonton-2024.012","/sites/default/files/2025-11/2024.012-Soldi-Cargamonton-Soldi-Low_Res.jpg"],
  ["fruits-plenty","present","丰饶之果","Fruits of Plenty","斯蒂芬妮·西朱科 Stephanie Syjuco · 菲律宾裔美国","2021 年","2024.008.01–.02","热带水果、格尺与档案式背景看似在做静物分类，实际追问殖民影像怎样把土地与物产变成可占有的资料。","重要藏品","强烈推荐","8 分钟","/artwork/fruits-plenty-2024.008.01","/sites/default/files/2025-11/2024.008.01-Syjuco-Fruits_of_Plenty-Fang-Low_Res.jpg"],
  ["gentle-angry-women","present","我们是温柔而愤怒的女人……","We Are the Gentle Angry Women…","埃伦·莱斯佩兰斯 Ellen Lesperance · 美国","2015 年","2024.006.02","看起来像一张毛衣编织图，标题却来自抗议歌；衣服在这里既贴身又公开，把政治立场变成可以穿走的图案。","重要藏品","强烈推荐","8 分钟","/artwork/we-are-gentle-2024.006.02","/sites/default/files/images/embark/2024.006.02.jpeg"],
  ["not-waving","present","不是挥手，而是溺水","Not Waving, but Drowning","杰弗里·米切尔 Jeffry Mitchell · 美国","2012 年","2013.009","釉陶堆出既滑稽又脆弱的身体，标题借来求救被误读的瞬间；可爱没有消除难过，只让人更晚察觉。","重要藏品","冷门但值得","8 分钟","/artwork/not-waving-dr-2013.009","/sites/default/files/images/embark/2013.009_Woods_Low-Res.jpg"]
];

const fryeWorks = fryeRows.map(([id,ch,zh,en,by,date,number,cardSummary,significance,tag,time,source,image]) => ({
  id,ch,zh,en,by,date,number,place:"Frye 馆藏；创馆收藏与当代作品均可能轮换，出发前核验 On View",tag,time,
  image:`${fryeBase}${image}`,source:`${fryeBase}${source}`,imageSource:`${fryeBase}${source}`,cardSummary,significance,
  preciousWhy: significance === "重要藏品" ? "它能明确解释 Frye 的创馆收藏、慕尼黑绘画取向或当代转型；其重要性来自馆内叙事位置，不等于全球孤本。" : "它是理解本馆趣味或观看方法的有效节点；不以稀有度作为推荐理由。"
}));

museumData.frye = {
  id:"frye", editorialCapacity:20, contentUpdatedAt:"2026-07-22", city:"西雅图 · 美国", zh:"弗莱艺术博物馆", en:"Frye Art Museum",
  ...museumRatings.frye,
  verdict:"一对西雅图收藏家认准的德语区绘画，后来成了一座美术馆不断反问自身趣味的起点；馆不大，却有非常清楚的性格。",
  hero:"https://fryemuseum.org/sites/default/files/images/sidebar/Frye%20Ext%20AndrewvanLeeuwen-sidebar.jpg",
  contentFile:"./research/content/frye.md", official:"https://fryemuseum.org/collection/founding-collection", visit:"https://fryemuseum.org/visit",
  intro:[
    "Frye 1952 年开馆，创馆基础是 Charles 与 Emma Frye 留给西雅图的 232 幅油画，其中近一半来自德国。两人不是漫无目的地买欧洲名画：1893 年芝加哥哥伦布纪念博览会点燃了他们的兴趣，后来又持续追随慕尼黑艺术家协会和慕尼黑分离派。",
    "这使 Frye 很不像一座缩小版综合美术馆。它最有意思的部分，是看 1900 年前后的收藏家如何理解“好画”：讲故事、画得像、人物漂亮，同时也逐渐接受更松动的笔触和构图。施图克、蒙卡奇、冯·乌德和特吕布纳把这条变化串起来。",
    "今天的 Frye 没把创馆趣味封成纪念室。当代收藏加入迁徙、原住民声音、殖民分类、女权行动与太平洋西北艺术，让旧沙龙和新问题互相顶住。20 件正好覆盖这次转身；免费开放值得珍惜，但评分只按藏品和参观收获计算。"
  ],
  chapters:[
    {id:"founding",number:"01",title:"先看懂 Frye 夫妇为什么买这些画",intro:"戏剧、道德与漂亮表面构成创馆收藏最直观的吸引力。"},
    {id:"secession",number:"02",title:"慕尼黑绘画开始把表面松开",intro:"家庭、森林、肖像与天空显示写实传统内部也在改变。"},
    {id:"salon",number:"03",title:"沙龙趣味既迷人，也值得追问",intro:"学院人体、城市记忆和日常故事说明“好看”背后的时代眼光。"},
    {id:"present",number:"04",title:"当代收藏回头改写创馆故事",intro:"身体、边境、殖民档案与行动主义让美术馆的现在进入画面。"},
    {id:"visit",number:"05",title:"把轮换与沙龙陈列算进参观",intro:"这些作品不保证同时在墙上；现场应先看当前 On View，再按章节挑选。"}
  ],
  works:fryeWorks,
  cardCopyContract:"independent-v1"
};
