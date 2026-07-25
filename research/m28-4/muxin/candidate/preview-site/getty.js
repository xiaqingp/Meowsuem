// Getty Center — 30 editorial stops. Getty Villa is intentionally out of scope.
const gettyCenter = "https://www.getty.edu/visit/center/";
const gettyCollection = "https://www.getty.edu/art/collection/";
const gettyArchitecture = "https://www.getty.edu/visit/center/top-things-to-do/architecture/";
const gettyGardens = "https://www.getty.edu/visit/center/top-things-to-do/gardens/";
const gettyHero = "https://media.getty.edu/iiif/image/0ce1f9a0-bb74-498d-962c-2728b9999529/full/1500,/0/default.jpg";
const gettyImage = id => `https://media.getty.edu/iiif/image/${id}/full/!1200,1200/0/default.jpg`;
const gettyObject = slug => `https://www.getty.edu/art/collection/object/${slug}`;

const gettyWorks = [
  {id:"hilltop",ch:"site",zh:"山顶总体布局",en:"The Getty Center as a Hilltop Campus",by:"Richard Meier 与 Getty 项目团队",date:"1984—1997 年",image:gettyHero,source:gettyArchitecture,summary:"真正的第一件作品不是某幅画，而是你从电车下车后才逐步展开的白色山城。",tag:"绝对不可错过",significance:"重要现场"},
  {id:"travertine",ch:"site",zh:"石灰华、网格与曲线",en:"Travertine, Grid, and Curves",by:"Richard Meier",date:"1997 年开放",image:"https://media.getty.edu/iiif/image/ad650098-ba15-4a87-a275-775dac98acd5/0,510,5315,2783/1500,785/0/default.jpg",source:gettyArchitecture,summary:"同一种米色石头，一边服从精密网格，一边被圆弧、阶梯和阳光不断打断。",tag:"重点推荐",significance:"特色看点"},
  {id:"central-garden",ch:"site",zh:"中央花园",en:"Central Garden",by:"Robert Irwin",date:"1992—1997 年；持续生长",image:"https://media.getty.edu/iiif/image/fcb9b7a3-0a42-47bb-b0cb-b163edbaa026/full/1500,/0/default.jpg",source:gettyGardens,summary:"这不是建筑的附属绿化，而是一件用水声、路径、季节和五百多种植物不断重写自己的作品。",tag:"绝对不可错过",significance:"重要现场"},

  {id:"saint-luke",ch:"early",zh:"圣路加",en:"Saint Luke",by:"西蒙·马蒂尼 Simone Martini",date:"14 世纪 30 年代初",slug:"103RF1",number:"82.PB.72",imageId:"21a98b59-5039-434e-a90b-2bb4f63eac74",summary:"先看那头替圣人守墨水瓶的小翼牛，再看金地如何把写作变成一件庄严而亲密的事。",tag:"绝对不可错过",significance:"稀世珍品"},
  {id:"annunciation",ch:"early",zh:"天使报喜",en:"The Annunciation",by:"迪里克·鲍茨 Dieric Bouts",date:"约 1450—1455 年",slug:"103QS9",number:"85.PA.24",imageId:"72d6e499-515a-47ee-8888-d7dcd5afedec",summary:"宗教奇迹被放进一间细节过分具体的尼德兰室内，门、床、光线都在帮你相信它发生过。",tag:"重点推荐",significance:"重要藏品"},
  {id:"parmigianino",ch:"early",zh:"圣母子、施洗者圣约翰与抹大拉的马利亚",en:"Virgin and Child with Saint John the Baptist and Mary Magdalene",by:"帕尔米贾尼诺 Parmigianino",date:"约 1535—1540 年",slug:"109M4K",number:"2017.22",imageId:"a49ffba7-18b8-4974-8f7f-9a116363a986",summary:"身体被故意拉长，手势像藤蔓彼此缠绕：优雅在这里已经接近不安。",tag:"重点推荐",significance:"重要藏品"},
  {id:"madonna-cherries",ch:"early",zh:"樱桃圣母",en:"Madonna of the Cherries",by:"昆廷·马西斯 Quentin Metsys",date:"约 1520—1525 年",slug:"11RMAD",number:"2024.56",imageId:"d102e501-b4d6-4f9a-9af4-33e680e9950f",summary:"两颗樱桃把神学缩成一次母子递食，也把甜味、血色与未来受难悄悄叠在一起。",tag:"重点推荐",significance:"重要藏品"},
  {id:"young-boy",ch:"early",zh:"少年胸像",en:"Bust of a Young Boy",by:"德西德里奥·达·塞蒂尼亚诺 Desiderio da Settignano",date:"约 1460—1464 年",slug:"109NVH",number:"2018.5",imageId:"c0b15eee-726b-4b99-b41b-b588ef413db6",summary:"大理石没有把孩子变成小大人：微张的嘴、蓬松头发和不稳定的注意力仍然活着。",tag:"重点推荐",significance:"重要藏品"},

  {id:"lucretia",ch:"baroque",zh:"卢克蕾提娅",en:"Lucretia",by:"阿尔泰米西娅·真蒂莱斯基 Artemisia Gentileschi",date:"约 1627 年",slug:"109Q8G",number:"2021.14",imageId:"2f0dd4c7-676e-4d80-a993-638acad11033",summary:"画面停在匕首落下前：她不是供人观看的受害者，而是把决定权握回手里的历史画主角。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"boar-hunt",ch:"baroque",zh:"卡吕冬野猪狩猎",en:"The Calydonian Boar Hunt",by:"彼得·保罗·鲁本斯 Peter Paul Rubens",date:"约 1611—1612 年",slug:"103QTF",number:"2006.4",imageId:"fd803195-132f-492a-857c-24fad0c98817",summary:"不要数人头，先找所有身体共同冲向的一点；鲁本斯把神话画成一次即将失控的挤压。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"old-man",ch:"baroque",zh:"身着军装的老人",en:"An Old Man in Military Costume",by:"伦勃朗 Rembrandt",date:"约 1630—1631 年",slug:"103RE6",number:"78.PB.246",imageId:"116f2def-eb34-4fcf-bfeb-fd6ab291bd3f",summary:"盔甲很亮，却不是主角；真正抓人的是一张被时间压弯、仍保持警觉的脸。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"pope-paul",ch:"baroque",zh:"教皇保禄五世胸像",en:"Bust of Pope Paul V",by:"吉安·洛伦佐·贝尼尼 Gian Lorenzo Bernini",date:"1621 年",slug:"103QTR",number:"2015.22",imageId:"adc6a054-bea0-45ef-bf07-dff1abc960e3",summary:"从侧面看衣料和胡须如何把冷硬大理石推向肉身，再回正面面对教皇的权力表情。",tag:"绝对不可错过",significance:"稀世珍品"},
  {id:"juggling-man",ch:"baroque",zh:"杂耍者",en:"Juggling Man",by:"阿德里安·德·弗里斯 Adriaen de Vries",date:"约 1615 年",slug:"103QSC",number:"90.SB.44",imageId:"c1b99b1b-8d8d-44bd-8550-0f993fd5cf08",summary:"绕着走一圈，你会发现没有一个角度能把他的平衡解释完整。",tag:"重点推荐",significance:"重要藏品"},
  {id:"saint-gines",ch:"baroque",zh:"圣希内斯·德拉哈拉",en:"Saint Ginés de la Jara",by:"卢伊莎·罗尔丹 Luisa Roldán；托马斯·德洛斯阿尔科斯设色",date:"1690 年代",slug:"103QSB",number:"85.SD.161",imageId:"bb72d5f1-e230-4797-a7dc-262bf948b256",summary:"木雕、真实衣料般的褶皱和彩绘肤色合作，让圣徒像刚从荒野里走进展厅。",tag:"重点推荐",significance:"重要藏品"},

  {id:"surprise",ch:"court",zh:"惊喜",en:"La Surprise",by:"让-安托万·华托 Jean-Antoine Watteau",date:"约 1718—1719 年",slug:"109NEP",number:"2017.72",imageId:"13f44e77-0547-4c47-824a-3465a4cb9255",summary:"一边是吻，一边是吉他手的孤独侧脸；华托把爱情画成同时发生的靠近与离开。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"suzanne",ch:"court",zh:"苏珊娜·勒佩尔捷肖像",en:"Portrait of Suzanne Le Peletier de Saint-Fargeau",by:"雅克-路易·大卫 Jacques-Louis David",date:"1804 年",slug:"107V32",number:"97.PA.36",imageId:"84fa98a3-b193-4153-bf77-d14af69e2c23",summary:"革命画家没有给女孩历史画的口号，只留下白裙、红披巾和不愿取悦观众的目光。",tag:"重点推荐",significance:"重要藏品"},
  {id:"machine-argent",ch:"court",zh:"银之机器：宴席中央饰件",en:"La Machine d'Argent",by:"弗朗索瓦-托马·热尔曼 François-Thomas Germain",date:"1754 年",slug:"103QTE",number:"2005.43",imageId:"42463fe1-2d47-4ed5-858a-b8ee2f8e7a17",summary:"野兔、鸟和蔬菜被银器匠冻结成一场豪华静物；它原本要在餐桌中央和真食物竞争。",tag:"绝对不可错过",significance:"稀世珍品"},
  {id:"pilgrim-flask",ch:"court",zh:"朝圣者扁壶",en:"Pilgrim Flask",by:"美第奇瓷器工坊 Medici Porcelain Factory",date:"1580 年代",slug:"103RR6",number:"86.DE.630",imageId:"083250c8-50a6-48ff-bdc1-985a79748997",summary:"欧洲还没掌握真正硬质瓷配方时，佛罗伦萨宫廷已经用实验和仿制追赶中国瓷器。",tag:"绝对不可错过",significance:"稀世珍品"},
  {id:"boulle-cabinet",ch:"court",zh:"带底座的柜子",en:"Cabinet on Stand",by:"安德烈-夏尔·布勒 André-Charles Boulle；让·瓦兰纹章图样",date:"约 1675—1680 年",slug:"103QSK",number:"77.DA.1",imageId:"44441820-c44f-434f-bd37-48934eec454e",summary:"花鸟镶嵌只是第一层；中央那只法国公鸡正在踩住帝国鹰与西班牙狮。",tag:"绝对不可错过",significance:"稀世珍品"},

  {id:"model-joseph",ch:"modern",zh:"模特约瑟夫习作",en:"Study of the Model Joseph",by:"泰奥多尔·热里柯 Théodore Géricault",date:"约 1818—1819 年",slug:"103QRX",number:"85.PA.407",imageId:"05edab83-23f7-4f42-9c81-8646b3a4cbe9",summary:"他后来会进入《梅杜萨之筏》；在这里，热里柯先把一名黑人模特画成拥有重量和目光的人。",tag:"重点推荐",significance:"重要藏品"},
  {id:"jeanne",ch:"modern",zh:"让娜（春）",en:"Jeanne (Spring)",by:"爱德华·马奈 Édouard Manet",date:"1881 年",slug:"103QTZ",number:"2014.62",imageId:"8094f61e-e458-42bd-90cf-a0ed0dcc90b9",summary:"花裙、阳伞、背景杜鹃把“春天”堆满画面，但让娜的脸拒绝变成季节装饰。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"sunrise",ch:"modern",zh:"日出（海景）",en:"Sunrise (Marine)",by:"克劳德·莫奈 Claude Monet",date:"1872 或 1873 年",slug:"103QT7",number:"98.PA.164",imageId:"2709b745-b312-4a5c-b0f8-884b4dca5cbc",summary:"太阳和倒影只用几下橙色笔触固定；其余海面正在你眼前失去轮廓。",tag:"绝对不可错过",significance:"重要藏品"},
  {id:"irises",ch:"modern",zh:"鸢尾花",en:"Irises",by:"文森特·梵高 Vincent van Gogh",date:"1889 年",slug:"103JNH",number:"90.PA.20",imageId:"8c255d80-7382-46db-9fa8-892c0d37247e",summary:"别先找那朵白花；先看每一片叶子怎样用不同方向的笔触，把花坛变成一股向外生长的力量。",tag:"绝对不可错过",significance:"稀世珍品"},
  {id:"crouching-woman",ch:"modern",zh:"蹲伏女子躯干",en:"Torso of a Crouching Woman",by:"卡米耶·克洛岱尔 Camille Claudel",date:"约 1884—1885 年塑模；1913 年前铸造",slug:"109P03",number:"2018.32",imageId:"12941ade-0611-490a-909f-d7d87d5e22a3",summary:"缺少头和四肢没有削弱动作，反而让背部扭转、腹部收缩和身体重量变得更直接。",tag:"重点推荐",significance:"重要藏品"},
  {id:"roulin",ch:"modern",zh:"约瑟夫·鲁兰肖像",en:"Portrait of Joseph Roulin",by:"文森特·梵高 Vincent van Gogh",date:"1888 年",slug:"103QZR",number:"85.GA.299",imageId:"0dd0592d-5542-4590-a9f5-571864e1c68c",summary:"一张纸上的邮差肖像，靠芦苇笔、墨水和不断转向的短线获得比油画更急促的生命。",tag:"冷门但值得",significance:"重要藏品",unavailable:true},

  {id:"creation",ch:"paper",zh:"世界的创造",en:"The Creation of the World",by:"德国手稿画师，姓名不详",date:"约 1170 年代",slug:"107V36",number:"Ms. 64, fol. 10v",imageId:"15f99e35-f6db-43f3-aa56-28f08a93e415",summary:"上帝没有站在世界外面：圆形宇宙、金银叶和对称秩序把创造本身画成一套可见结构。",tag:"绝对不可错过",significance:"稀世珍品",unavailable:true},
  {id:"hoefnagel",ch:"paper",zh:"幻想昆虫、郁金香、蜘蛛与欧洲梨",en:"Imaginary Insect, Tulip, Spider, and Common Pear",by:"约里斯·胡夫纳赫尔 Joris Hoefnagel；格奥尔格·博奇凯 Georg Bocskay",date:"文字 1561—1562 年；图像 1591—1596 年",slug:"105TJS",number:"Ms. 20, fol. 25",imageId:"24acf81f-961f-40a5-960e-108cc2fd37ca",summary:"书法完成约三十年后，花、果实和昆虫才来占领页边：观察自然也成了对文字的挑战。",tag:"冷门但值得",significance:"重要藏品",unavailable:true},
  {id:"leonardo",ch:"paper",zh:"圣婴与羔羊习作（正面）",en:"Studies for the Christ Child with a Lamb (recto)",by:"列奥纳多·达·芬奇 Leonardo da Vinci",date:"约 1503—1506 年",slug:"103QS0",number:"86.GG.725",imageId:"a47994ae-2233-4958-9065-696ac388222d",summary:"重复的手臂、腿和身体不是画错，而是列奥纳多让动作在纸上试跑。",tag:"绝对不可错过",significance:"稀世珍品",unavailable:true},
  {id:"michelangelo",ch:"paper",zh:"哀悼女子习作",en:"Study of a Mourning Woman",by:"米开朗基罗 Michelangelo",date:"约 1500—1505 年",slug:"103QTY",number:"2017.78",imageId:"a6a95f47-0f1b-464e-b396-ca7d5d6f071e",summary:"几条黑粉笔线把头巾、低头和压住身体的悲伤固定下来，完成度却仍保留思考的速度。",tag:"绝对不可错过",significance:"稀世珍品",unavailable:true},
  {id:"lace",ch:"paper",zh:"蕾丝",en:"(Lace)",by:"威廉·亨利·福克斯·塔尔博特 William Henry Fox Talbot",date:"1841—1846 年",slug:"10960P",number:"2003.495",imageId:"dd052675-f3a0-4948-90a4-c5372cbe0cfd",summary:"没有镜头，也没有拍摄现场；光穿过蕾丝直接留下负像，摄影在这里像自然自己画画。",tag:"冷门但值得",significance:"重要藏品",unavailable:true}
];

museumData.getty = {
  id:"getty", editorialCapacity:30, city:"洛杉矶 · 美国", zh:"盖蒂中心", en:"Getty Center",
  ...museumRatings.getty,
  verdict:"它不是靠一件镇馆之宝压倒你，而是让欧洲艺术、建筑、花园、山景和洛杉矶的光共同组成一次完整的半日体验。",
  hero:gettyHero, contentFile:"./research/getty-content-v1.md", official:gettyCollection, visit:gettyCenter,
  intro:[
    "先把边界说清楚：这里是 Brentwood 山上的 Getty Center，不是 Pacific Palisades 的 Getty Villa。Villa 的古希腊、伊特鲁里亚和罗马文物不参与本馆 89 分，也不出现在这 30 项里。",
    "Getty Center 的强项不是百科全书式覆盖，而是几条被精心收紧的欧洲艺术线：中世纪到 19 世纪绘画、法国装饰艺术、文艺复兴与巴洛克雕塑，以及轮换展出的手稿、素描和摄影。建筑与中央花园把这些对象放进一座真正需要步行、停留和回望的山顶现场。",
    "截至 2026 年 7 月，东馆、北馆和南馆部分展厅因改造关闭；纸本与摄影本来就会轮换。90 分钟路线只选当前更可能稳定看到的骨架，半天路线再加入场所与装饰艺术；完整 30 项是多次参观内容库，不是当天必须集齐的任务。"
  ],
  chapters:[
    {id:"site",number:"01",title:"先别进展厅：这座山顶本身怎样工作",intro:"电车、石材、网格、曲线与花园先调整你的速度；建筑不是评分捷径，却是理解这家馆不可跳过的第一章。"},
    {id:"early",number:"02",title:"金地退去之后，神圣怎样进入真实房间",intro:"从西蒙·马蒂尼到帕尔米贾尼诺，看欧洲图像如何从金色秩序走向具体空间、柔软身体与复杂优雅。"},
    {id:"baroque",number:"03",title:"巴洛克不是热闹，而是把决定压缩到一秒",intro:"匕首落下前、野猪冲撞前、身体失去平衡前：动作、权力与心理都被推到临界点。"},
    {id:"court",number:"04",title:"宫廷趣味怎样藏进吻、银器和一只柜子",intro:"洛可可的轻盈与王权的宣传并存；最漂亮的表面往往也最会表达制度。"},
    {id:"modern",number:"05",title:"现代性从轮廓开始松动",intro:"模特重新获得姓名，季节变成时尚，海面变成笔触，花坛则几乎长出画框。"},
    {id:"paper",number:"06",title:"冷门但值得：纸页为什么不能永远亮着",intro:"手稿、素描和摄影是 Getty 的真正强项，但光照会伤害它们；把这一章当作轮换候选，而不是在展承诺。"}
  ],
  works:gettyWorks.map((work,index)=>({
    ...work,
    image:work.image || gettyImage(work.imageId),
    source:work.slug ? gettyObject(work.slug) : work.source,
    imageSource:work.slug ? gettyObject(work.slug) : work.source,
    place:work.unavailable ? "Getty Center 馆藏；纸本或摄影轮换，须核验是否在展" : "Getty Center；具体展厅须按当日开放核验",
    time:index < 3 ? "12 分钟" : (work.tag === "绝对不可错过" ? "10 分钟" : "7 分钟"),
    cardSummary:work.summary, look:work.summary, story:work.summary, again:work.summary,
    preciousWhy:work.summary
  }))
};
