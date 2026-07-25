// Kunsthistorisches Museum Vienna — one canonical data object, rendered by museum-app.js.
const viennaAliases = {
  "Diego Velazquez - Infanta Margarita in white and silver.jpg":"Infanta-margarita-1656.jpg",
  "Albrecht Dürer - Emperor Maximilian I - Google Art Project.jpg":"Maximilian I, Holy Roman Emperor.jpg",
  "Caravaggio - The Crowning with Thorns - Google Art Project.jpg":"Michelangelo Merisi, called Caravaggio - The Crowning with Thorns - Google Art Project.jpg",
  "Caravaggio - Madonna of the Rosary.jpg":"Michelangelo Merisi, called Caravaggio - Madonna of the Rosary - Google Art Project.jpg",
  "Titian - Danae - Google Art Project.jpg":"Titian.Danae01.jpg",
  "Titian - Nymph and Shepherd.jpg":"Tiziano Vecellio, called Titian - Nymph and Shepherd - Google Art Project.jpg",
  "Parmigianino Self-portrait in a Convex Mirror.jpg":"Francesco Mazzola, called Parmigianino - Self-Portrait in a Convex Mirror - Google Art ProjectFXD.jpg",
  "Giuseppe Arcimboldo - Fire - Google Art Project.jpg":"Giuseppe Arcimboldo - Fire - WGA0828.jpg",
  "Peter Paul Rubens - Self-portrait - Google Art Project.jpg":"Peter Paul Rubens - Self-Portrait (Kunsthistorisches Museum).jpg",
  "Rembrandt - Self Portrait - Kunsthistorisches Museum.jpg":"Rembrandt, Self-Portrait, 1652; Kunsthistorisches Museum, Vienna (2).jpg",
  "Jan van Eyck - Portrait of Jan de Leeuw - Google Art Project.jpg":"Jan van Eyck - Portrait of Goldsmith Jan de Leeuw.jpg",
  "Krumau Madonna.jpg":"Krumlovska madona KHM.JPG",
  "Nagyszentmiklos treasure jug Kunsthistorisches Museum.jpg":"Nagyszentmiklos 26NA.jpg",
  "Cult chamber of Ka-ni-nisut Vienna.jpg":"Kunsthistorisches Museum Vienna 0179.JPG",
  "Tizian - Porträt der Isabella d'Este.jpg":"Philip IV by Velazquez.jpg"
};
const viennaHashes = {
  "Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg":"d8","Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg":"fc","Pieter Bruegel the Elder - Peasant Wedding - Google Art Project 2.jpg":"70","Pieter Bruegel the Elder - Children’s Games - Google Art Project.jpg":"1e","The battle between Carnival and Lent, by Pieter Bruegel (I).jpg":"c2","Pieter Bruegel The Peasant Dance.jpg":"aa","The Gloomy Day (Bruegel).jpg":"6e","Pieter Bruegel (I) - The Return of the Herd (1565).jpg":"7a","Jan Vermeer - The Art of Painting - Google Art Project.jpg":"5e","Diego Rodriguez de Silva y Velázquez - Infanta Margarita Teresa in a Blue Dress - Google Art Project.jpg":"70",
  "Infanta-margarita-1656.jpg":"3c","Hans Holbein the Younger - Jane Seymour, Queen of England - Google Art Project.jpg":"14","Maximilian I, Holy Roman Emperor.jpg":"48","David Teniers the Younger - Archduke Leopold William in his Gallery at Brussels - Google Art Project.jpg":"e1","Raphael - Madonna in the Meadow - Google Art Project.jpg":"5a","Michelangelo Merisi, called Caravaggio - The Crowning with Thorns - Google Art Project.jpg":"52","Michelangelo Merisi, called Caravaggio - Madonna of the Rosary - Google Art Project.jpg":"1f","Giorgione - Three Philosophers - Google Art Project.jpg":"a8","Titian.Danae01.jpg":"b2","Tiziano Vecellio, called Titian - Nymph and Shepherd - Google Art Project.jpg":"53","Albrecht Dürer - Feast of Rose Garlands - Google Art Project.jpg":"f9","Francesco Mazzola, called Parmigianino - Self-Portrait in a Convex Mirror - Google Art ProjectFXD.jpg":"47","Giuseppe Arcimboldo - Summer - Google Art Project.jpg":"e7","Giuseppe Arcimboldo - Fire - WGA0828.jpg":"58","Peter Paul Rubens - Self-Portrait (Kunsthistorisches Museum).jpg":"47","Peter Paul Rubens - The Four Continents.jpg":"70","Rembrandt, Self-Portrait, 1652; Kunsthistorisches Museum, Vienna (2).jpg":"32","Jan van Eyck - Portrait of Goldsmith Jan de Leeuw.jpg":"d4","Saliera, Benvenuto Cellini.jpg":"0f","Krumlovska madona KHM.JPG":"e0","Peter Paul Rubens - Helena Fourment in a Fur Robe - Google Art Project.jpg":"86","Pieter Bruegel the Elder - The Suicide of Saul.jpg":"3f","Kunsthistorisches Museum Vienna June 2006 031.png":"45","Nagyszentmiklos 26NA.jpg":"2a","Antonio Allegri, called Correggio - Jupiter and Io - Google Art Project.jpg":"2b","Antonio Allegri, called Correggio - The Abduction of Ganymede - Google Art Project.jpg":"f6","Kunsthistorisches Museum Vienna 0179.JPG":"5f","Philip IV by Velazquez.jpg":"ab"
};
const viennaDirect = {
  "Burgundian Court Goblet Kunsthistorisches Museum.jpg":"https://www.khm.at/pics/86226/KK_27_30.jpg",
  "Automaton in the form of a ship Kunsthistorisches Museum.jpg":"https://www.khm.at/pics/87073/KK_874_2012_04_web1.jpg",
  "Kunsthistorisches Museum Wien, Neue Burg.jpg":"https://www.khm.at/fileadmin/_processed_/f/5/csm_114_AS_SaalXI_7_AWSZ-card_59120d5a30.jpg"
};
const viennaFile = requested => {
  if (viennaDirect[requested]) return viennaDirect[requested];
  const name = viennaAliases[requested] || requested;
  const hash = viennaHashes[name];
  if (!hash) throw new Error(`Missing verified Vienna image: ${name}`);
  const encoded = encodeURIComponent(name.replace(/ /g,"_"));
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash}/${encoded}/960px-${encoded}`;
};
const viennaCommons = name => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`;
const khmArtworks = "https://www.khm.at/en/artworks";

const viennaWorks = [
  ["hunters","bruegel","雪中猎人","Hunters in the Snow","老彼得·勃鲁盖尔 Pieter Bruegel the Elder · 尼德兰","1565 年","Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg","绝对不可错过","稀世珍品","沿猎人归来的雪坡望进村庄，火焰、冰面和远山会把一次狩猎扩展成整个冬季。","雪地、用火劳动与冰上游戏被同一种寒冷环境组织起来，人物虽小，却共同让季节变得可见。","六季组画原有六幅、目前五幅存世；同组名作共享季节与劳作的机制，却不能替代本作保存的冬季单元。"],
  ["babel","bruegel","巴别塔","The Tower of Babel","老彼得·勃鲁盖尔","1563 年","Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg","绝对不可错过","稀世珍品","先看塔顶还没完成，塔脚却已经开裂；宏伟和失败在同一秒发生。","勃鲁盖尔把《圣经》的傲慢寓言画成一座施工现场：国王、石匠、吊机和错位拱券各忙各的。","老勃鲁盖尔同题大型版本只有维也纳与鹿特丹两件公认核心实例；维也纳本尺寸更大、细节更密。"],
  ["wedding","bruegel","农民婚礼","The Peasant Wedding","老彼得·勃鲁盖尔","约 1567 年","Pieter Bruegel the Elder - Peasant Wedding - Google Art Project 2.jpg","绝对不可错过","重要藏品","别急着找新郎；先跟着木板上的粥、端盘人的手和宾客的目光穿过房间。","画家不把农民当笑话或田园装饰，而用严密构图让食物、身份和观看彼此咬合。","同类婚宴题材并非孤本；它的重要性主要来自勃鲁盖尔成熟期把群像秩序与日常观察合为一体。"],
  ["children","bruegel","儿童游戏","Children’s Games","老彼得·勃鲁盖尔","1560 年","Pieter Bruegel the Elder - Children’s Games - Google Art Project.jpg","绝对不可错过","重要藏品","先别数人，先找滚铁环、倒立和骑木桶；整座城市像被孩子接管。","两百多个儿童把八十多种游戏铺满画面，欢乐里又带着成年人社会的排队、竞争与模仿。","没有已知第二幅同规模、同密度的勃鲁盖尔儿童游戏全景；其不可替代性在题材与组织方式，不只是人数。"],
  ["carnival","bruegel","狂欢节与四旬斋之战","The Fight Between Carnival and Lent","老彼得·勃鲁盖尔","1559 年","The battle between Carnival and Lent, by Pieter Bruegel (I).jpg","重点推荐","重要藏品","从左边酒馆的肥胖狂欢节国王，看向右边教堂前瘦削的四旬斋老妇。","宗教日历被变成一场没有真正胜负的街头大战；每个小人物都在表演自己的信念。","同题图像传统存在，但勃鲁盖尔把数百个行为组织成可反复阅读的城市剧场，艺术史影响远超普通风俗画。"],
  ["dance","bruegel","农民舞蹈","The Peasant Dance","老彼得·勃鲁盖尔","约 1568 年","Pieter Bruegel The Peasant Dance.jpg","重点推荐","重要藏品","先看前景两个人几乎冲出画面的腿，再听见画面深处风笛的节奏。","人物被放大到挤压边框，粗重步伐取代优雅舞姿；勃鲁盖尔让身体本身成为构图发动机。","它与《农民婚礼》构成勃鲁盖尔晚期大型农民题材最关键的一对，珍贵在成熟风格的集中呈现。"],
  ["gloomy","hidden","阴暗的日子","The Gloomy Day","老彼得·勃鲁盖尔","1565 年","The Gloomy Day (Bruegel).jpg","冷门但值得","重要藏品","先看暴风前弯曲的树，再看远处海上的船；天气比人物更像主角。","这是月份组画里冬末初春的一页，暖色人物被压在冷灰天空下，季节不是背景而是生活条件。","月份组原有六幅、现存五幅，三幅在维也纳；单件并非孤品，但在残存系列中不可拆开理解。"],
  ["herd","hidden","牧群归来","The Return of the Herd","老彼得·勃鲁盖尔","1565 年","Pieter Bruegel (I) - The Return of the Herd (1565).jpg","冷门但值得","重要藏品","跟着牛群从近景走进山谷，再注意乌云从右侧压来。","秋季收束成一次归返：动物、牧人、裸树和骤变天气共同决定画面的沉重节拍。","它同属原六幅、如今可确认五幅的月份组，价值来自系列位置以及勃鲁盖尔把气候变成人类历史尺度的能力。"],
  ["art-painting","north","绘画的艺术","The Art of Painting","约翰内斯·维米尔","约 1666—1668 年","Jan Vermeer - The Art of Painting - Google Art Project.jpg","绝对不可错过","稀世珍品","先看背对我们的画家，再看模特手里的号角、书与月桂冠；这不是普通画室。","维米尔把地图、帷幕、光线和历史女神克利俄组合成关于绘画声望的宣言。","维米尔公认存世作品只有约三十余幅；本作是其中尺幅最大、寓意最复杂之一，并一直由画家本人保留至去世。"],
  ["infanta-blue","dynasty","蓝裙的玛格丽特公主","Infanta Margarita Teresa in a Blue Dress","迭戈·委拉斯开兹","1659 年","Diego Rodriguez de Silva y Velázquez - Infanta Margarita Teresa in a Blue Dress - Google Art Project.jpg","绝对不可错过","稀世珍品","先看银蓝裙摆怎样把一个八岁孩子扩张成王朝形象，再找她脸上的疲倦。","这不是儿童写真，而是西班牙宫廷送往维也纳的婚配外交图像；柔软笔触服务于坚硬政治。","维也纳保存一组记录公主成长的委拉斯开兹肖像，能连续比较同一政治身体；这种成组语境比单幅名作更罕见。"],
  ["infanta-white","dynasty","白裙的玛格丽特公主","Infanta Margarita Teresa in a White Dress","迭戈·委拉斯开兹","约 1656 年","Diego Velazquez - Infanta Margarita in white and silver.jpg","重点推荐","重要藏品","先看宽裙和红帘怎样把小小身体固定在中央，再看她略偏开的眼神。","画像先于婚姻抵达维也纳，让未来夫家确认公主的成长与王朝资格；私人年龄被国家化。","它不是唯一的公主肖像，珍贵恰在与蓝裙像等作品构成时间序列，并显出委拉斯开兹晚期松动笔法。"],
  ["jane","dynasty","简·西摩肖像","Portrait of Jane Seymour","小汉斯·霍尔拜因","约 1536—1537 年","Hans Holbein the Younger - Jane Seymour, Queen of England - Google Art Project.jpg","重点推荐","重要藏品","先看珠宝、袖口与金线的冷硬精度，再看她几乎不泄露情绪的脸。","亨利八世第三任王后被塑造成秩序、贞洁与王朝延续的容器；奢华细节不是装饰，而是政治资格。","原作肖像存世有限，相关工作室版本与素描可比较；维也纳本通常被视为霍尔拜因本人关键宫廷肖像。"],
  ["maximilian","dynasty","皇帝马克西米利安一世","Emperor Maximilian I","阿尔布雷希特·丢勒","1519 年","Albrecht Dürer - Emperor Maximilian I - Google Art Project.jpg","重点推荐","重要藏品","先看皇帝手里的石榴：果粒抱成一体，是他想象帝国的现成比喻。","丢勒没有把年老皇帝美化成年轻征服者，而用鼻梁、毛领和紧闭嘴唇制造耐久权威。","丢勒绘制的马克西米利安肖像有其他版本，但维也纳本是皇帝去世之年完成的代表性油画定型。"],
  ["gallery","hidden","利奥波德·威廉大公的画廊","Archduke Leopold Wilhelm in His Gallery","小戴维·特尼尔斯","约 1651 年","David Teniers the Younger - Archduke Leopold William in his Gallery at Brussels - Google Art Project.jpg","冷门但值得","重要藏品","先找站在中央却不最大的收藏家，再看墙上名画像瓷砖一样塞满空间。","这既是炫耀收藏的群像，也是后来维也纳绘画馆的一张祖谱；画中画把占有变成知识秩序。","特尼尔斯画过多个画廊版本，因此并非孤本；它的关键性在于记录哈布斯堡核心收藏形成前夜。"],
  ["madonna-meadow","italy","草地圣母","Madonna in the Meadow","拉斐尔","1505 或 1506 年","Raphael - Madonna in the Meadow - Google Art Project.jpg","绝对不可错过","稀世珍品","先看圣母和两个孩子构成的稳定三角，再看小十字架如何预告受难。","拉斐尔把达·芬奇式构图、佛罗伦萨风景和毫不费力的温柔压进一张看似简单的圣母像。","拉斐尔圣母像并非罕见；本作珍贵在他佛罗伦萨时期风格转折的清晰度，是讨论盛期文艺复兴和谐构图的标准作品。"],
  ["crowning","italy","荆棘冠冕","The Crowning with Thorns","卡拉瓦乔","约 1602—1604 年","Caravaggio - The Crowning with Thorns - Google Art Project.jpg","重点推荐","重要藏品","先看两根木棍从两侧同时压向基督，再看红袍怎样把暴力集中到中央。","卡拉瓦乔不画宏大刑场，只把观众逼近几个人的推压、弯腰与沉默，让神学先成为身体事件。","同题卡拉瓦乔归属仍有不同版本和讨论；维也纳本的重要性主要来自成熟期明暗与近距离戏剧结构。"],
  ["rosary","italy","玫瑰经圣母","Madonna of the Rosary","卡拉瓦乔","约 1601—1603 年","Caravaggio - Madonna of the Rosary.jpg","重点推荐","重要藏品","先看跪着的人把脏脚直接伸向你，再看上方圣母与红色帷幕的舞台距离。","多明我会圣人分发玫瑰经，普通人的身体却占据前景；卡拉瓦乔把救赎做成一次拥挤的公共接触。","卡拉瓦乔大型祭坛画存世数量有限；本作又是少数完整保留宏大群像与原始公共尺度的实例之一。"],
  ["philosophers","italy","三位哲学家","The Three Philosophers","乔尔乔内","约 1508—1509 年","Giorgione - Three Philosophers - Google Art Project.jpg","重点推荐","重要藏品","先别急着给三个人点名；看少年如何从洞穴黑暗走向被夕阳照亮的纸。","身份至今没有唯一答案，画的力量恰在让古代、阿拉伯与当代知识传统同时站在风景边缘。","乔尔乔内英年早逝，公认存世绘画极少且归属多有争论；这是少数有稳定文献和早期收藏史的核心作品。"],
  ["danae","italy","达娜厄","Danaë","提香","约 1560 年","Titian - Danae - Google Art Project.jpg","重点推荐","重要藏品","先看金雨落向达娜厄，也看侍女怎样用围裙急着接住金钱。","神话中的宙斯化身金雨，提香却把欲望、财富和观看都变成松动颜料之间的交易。","提香及工作室留下多个达娜厄版本；维也纳本不是唯一，却是晚期版本比较中理解笔触、情色与委托关系的重要节点。"],
  ["nymph","hidden","宁芙与牧羊人","Nymph and Shepherd","提香","约 1570—1575 年","Titian - Nymph and Shepherd.jpg","冷门但值得","重要藏品","先看人物没有真正对视，再看暮色怎样把肉身、树干和天空揉在一起。","故事无法被钉死，晚年提香让轮廓融化，画面更像欲望消退后留下的天气。","它并非靠题材唯一，而是少数集中体现提香晚期“以色彩作画”、接近未完成感的关键作品。"],
  ["rose-garlands","north","玫瑰花环节","The Feast of the Rosaries","阿尔布雷希特·丢勒","1506 年","Albrecht Dürer - Feast of Rose Garlands - Google Art Project.jpg","重点推荐","重要藏品","先找右上角把自己画进人群的丢勒，再看德意志皇帝与教皇如何被安排在圣母两侧。","丢勒在威尼斯用这幅祭坛画向意大利同行证明：北方精密和威尼斯色彩可以属于同一画家。","大型祭坛画历经损伤和修复，原貌受限；但它是丢勒威尼斯时期最重要、最有公开竞争意味的作品之一。"],
  ["convex","north","凸面镜中的自画像","Self-Portrait in a Convex Mirror","帕尔米贾尼诺","约 1524 年","Parmigianino Self-portrait in a Convex Mirror.jpg","绝对不可错过","稀世珍品","先看夸张放大的手，再看小小脸孔怎样从弯曲房间里保持镇定。","年轻画家把凸镜变形连同弧形画板一起送给罗马赞助人：技巧不是藏起来，而是作品主题。","没有第二件完全同构的文艺复兴凸镜自画像；它把媒介形状、光学实验与艺术家自我推介绑定成孤立而高影响力的实例。"],
  ["summer","north","夏季","Summer","朱塞佩·阿尔钦博托","1563 年","Giuseppe Arcimboldo - Summer - Google Art Project.jpg","重点推荐","重要藏品","远看是一张侧脸，近看鼻子变黄瓜、脸颊变桃子、衣领变麦穗。","阿尔钦博托把哈布斯堡宫廷的自然收藏、季节秩序和视觉双关合成一张聪明的怪脸。","季节系列存在多个版本，不是孤品；维也纳早期组的重要性在宫廷语境、保存与系列关系。"],
  ["fire","north","火","Fire","朱塞佩·阿尔钦博托","1566 年","Giuseppe Arcimboldo - Fire - Google Art Project.jpg","重点推荐","重要藏品","先认出蜡烛、火绳枪和炮管，再看这些危险物怎样拼成哈布斯堡鹰徽装饰的人脸。","四元素不只是猜谜：武器、火焰与王朝符号把自然力量收编成帝国能力。","它属于早期《四元素》组的关键存世作品；价值来自系列完整语义，而非“蔬菜脸”式猎奇。"],
  ["rubens-self","north","鲁本斯自画像","Self-Portrait","彼得·保罗·鲁本斯","约 1638—1640 年","Peter Paul Rubens - Self-portrait - Google Art Project.jpg","重点推荐","重要藏品","先看宽檐帽和黑衣制造的地位，再看脸上没有画家工具、也没有夸张动作。","晚年鲁本斯把自己画成有教养的绅士与外交家，流畅皮肤和克制姿态替他完成社会升级。","鲁本斯自画像数量不多但并非唯一；维也纳本因晚年、自主形象和高完成度成为核心比较对象。"],
  ["four-rivers","north","四大洲","The Four Continents","彼得·保罗·鲁本斯","约 1615 年","Peter Paul Rubens - The Four Continents.jpg","重点推荐","重要藏品","先看四组巨大身体彼此扭转，再找鳄鱼、老虎与四条河流的提示。","欧洲人把当时已知世界拟成人体与河神；丰盛画面同时暴露殖民时代如何想象全球秩序。","同类四洲寓意画很多；本作的重要性在鲁本斯巨幅肉身语言与早期全球想象被完整绑定。"],
  ["rembrandt-self","north","伦勃朗自画像","Self-Portrait","伦勃朗","1652 年","Rembrandt - Self Portrait - Kunsthistorisches Museum.jpg","重点推荐","重要藏品","先看双手插腰的正面站姿，再让目光停在不修饰的脸和朴素褐衣上。","破产前后的伦勃朗没有借华服逞强，而用宽阔身形和直接目光维护画家的尊严。","伦勃朗自画像很多，稀有度不在孤本；维也纳本是他中晚年以全身姿态重新定义自我形象的重要节点。"],
  ["jan-leeuw","hidden","扬·德·莱乌肖像","Portrait of Jan de Leeuw","扬·凡·艾克","1436 年","Jan van Eyck - Portrait of Jan de Leeuw - Google Art Project.jpg","冷门但值得","重要藏品","先看他指间的小金环，再看目光如何越过画框直接抓住你。","金匠拿着职业材料，画框铭文还像作品自己在说话；凡·艾克把身份、触觉与观看压在巴掌大的画面里。","凡·艾克有少量署名肖像传世；这件有日期、姓名与原框铭文，文献完整性远高于一般十五世纪肖像。"],
  ["saliera","kunst","萨列拉盐罐","Saliera","本韦努托·切利尼","1540—1543 年","Saliera, Benvenuto Cellini.jpg","绝对不可错过","稀世珍品","先看海神与大地女神怎样交错双腿，再找装盐的小船和装胡椒的小神庙。","它本是餐桌器具，却以黄金、珐琅和裸体神祇把法国国王的调味动作升级成宇宙统治。","这是切利尼唯一完整存世、可确定出自其手的大型金工雕塑；几乎找不到同作者、同媒介的第二件可比实物。"],
  ["burgundy-cup","kunst","勃艮第宫廷高脚杯","Burgundian Court Goblet","不详金匠","约 1453—1467 年","Burgundian Court Goblet Kunsthistorisches Museum.jpg","重点推荐","稀世珍品","先看器身被金叶、珍珠和宝石包裹到几乎看不见容器本身。","它不是低调饮具，而是勃艮第宫廷把财富、外交礼物和家族记忆举到手中的方式。","中世纪世俗金银器常被熔毁改造；这种保存完整、来源进入哈布斯堡宝库的宫廷杯极少见。"],
  ["krumau","kunst","克鲁毛圣母","Madonna of Krumau","波希米亚雕刻家","约 1390—1400 年","Krumau Madonna.jpg","重点推荐","稀世珍品","从圣母弯成 S 形的身体看起，再看孩子如何把庄严宗教像变成亲密游戏。","所谓“美丽风格”用流动衣褶、纤细比例和温柔互动，让神圣形象兼具宫廷优雅与情感接近。","同类型美丽圣母尚有数件，但克鲁毛本被视为质量最高、定义这一中欧风格的核心实例之一。"],
  ["ship","kunst","机械战船","Automaton in the Form of a Ship","汉斯·施洛特海姆","约 1585 年","Automaton in the form of a ship Kunsthistorisches Museum.jpg","重点推荐","重要藏品","先把它当船，再找甲板上的皇帝、选侯和会移动的小人物。","发条启动后，船会行进、奏乐并模拟鸣炮；宫廷把机械知识包装成一场帝国秩序表演。","欧洲仍有少数同类机械船，例如大英博物馆实例；维也纳本因规模、复杂动作与宫廷语境跻身最重要一组。"],
  ["helena-fur","hidden","海伦娜·富尔曼特披皮草","Helena Fourment in a Fur Robe","彼得·保罗·鲁本斯","约 1636—1638 年","Peter Paul Rubens - Helena Fourment in a Fur Robe - Google Art Project.jpg","冷门但值得","重要藏品","先看皮草怎样一边遮住身体、一边把裸露变得更明显，再看她抓住外套的手。","鲁本斯把年轻妻子画成私密观看中的古典维纳斯；温暖皮肤与深色皮毛让亲密和展示同时成立。","鲁本斯画过多幅海伦娜肖像，这件并非唯一；它因私人语境、晚期肉身笔法与长期影响成为核心实例。"],
  ["saul","hidden","扫罗之死","The Suicide of Saul","老彼得·勃鲁盖尔","1562 年","Pieter Bruegel the Elder - The Suicide of Saul.jpg","冷门但值得","重要藏品","先在巨大山谷里找那场几乎看不见的自杀，再看军队如何像洪水吞没地形。","《圣经》中的国王死亡被缩成战争机器的一小点；勃鲁盖尔让个人悲剧在历史尺度前失去特权。","同题图像很多，本作不靠题材唯一；它珍贵在用反英雄尺度重写历史画，并补足维也纳勃鲁盖尔群的叙事跨度。"],
  ["gemma","antiquity","奥古斯都宝石浮雕","Gemma Augustea","古罗马工匠","约公元 9—12 年","Kunsthistorisches Museum Vienna June 2006 031.png","绝对不可错过","稀世珍品","先看上层奥古斯都像神一样端坐，再看下层被立起战利品架控制的俘虏。","两层缟玛瑙让白色人物从深色底面浮出，帝国胜利因此既是政治宣传，也是材料魔术。","大型古罗马双层宝石浮雕存世极少；可比核心是法国大宝石浮雕等少数宫廷级作品，Gemma Augustea 是最完整、最著名者之一。"],
  ["nagyszent","antiquity","纳吉圣米克洛什宝藏金壶","Golden Jug from the Nagyszentmiklós Treasure","早期中世纪金匠","约 7—9 世纪","Nagyszentmiklos treasure jug Kunsthistorisches Museum.jpg","重点推荐","稀世珍品","先看金壶上的骑士、俘虏与神话生物，再看图像如何绕器身循环。","这批二十三件金器混合草原、拜占庭和中亚图像，连制造者身份至今仍有争论。","二十三件金器作为一批保存，是早期中世纪金工最重大的发现之一；单壶价值来自完整宝藏语境。"],
  ["jupiter-io","italy","朱庇特与伊娥","Jupiter and Io","柯勒乔","约 1531—1532 年","Antonio Allegri, called Correggio - Jupiter and Io - Google Art Project.jpg","重点推荐","重要藏品","先看灰云怎样长出一张脸与一只手，再看伊娥的身体怎样回应看不见的重量。","柯勒乔把宙斯化作触觉而非完整人体，神话因此从叙事变成云、皮肤和欲望的接触。","它属于曼托瓦公爵订制的《朱庇特之爱》组画；成组关系与大胆的无形神体处理使其成为矫饰主义情色神话的核心作品。"],
  ["ganymede","italy","劫持伽倪墨得斯","The Abduction of Ganymede","柯勒乔","约 1531—1532 年","Antonio Allegri, called Correggio - The Abduction of Ganymede - Google Art Project.jpg","重点推荐","重要藏品","先看少年被鹰向上提起，再看地面那只狗怎样把你的目光留在人间。","同组神话在这里变成垂直运动：轻柔天空和突然失重的身体，让暴力披上优美外衣。","它与《朱庇特与伊娥》在维也纳重聚，系列比较比单幅更重要；两件共同保留原委托的欲望与权力结构。"],
  ["kani","egypt","卡尼尼苏特祭祀室","Cult Chamber of Ka-ni-nisut","古埃及工匠","约公元前 2450 年","Cult chamber of Ka-ni-nisut Vienna.jpg","绝对不可错过","稀世珍品","先把它当一间真正的房间：墙上食物、仆役和仪式不是装饰，而是给死者持续运转的来世系统。","这座来自吉萨的古王国祭祀室被整体移入馆内，图像通过名字、供品和行动维持墓主存在。","馆方强调其古王国收藏在埃及之外居前列；能以原建筑构件进入完整祭祀空间的吉萨墓室远比单件浮雕罕见。"],
  ["isabella","hidden","伊莎贝拉·德斯特肖像","Portrait of Isabella d’Este","提香","约 1534—1536 年","Tizian - Porträt der Isabella d'Este.jpg","冷门但值得","重要藏品","先看年轻面孔，再记住委托时伊莎贝拉已经六十多岁；这张脸从一开始就是被要求制造的记忆。","提香可能依据更早肖像和描述完成理想化返老，宫廷肖像在这里不是记录年龄，而是编辑公众版本。","伊莎贝拉肖像另有图像传统；本作难得在清楚暴露名人如何主动管理自己的视觉遗产。"],
];

// Keep the final hidden portrait factual after selecting a stable public-domain image.
Object.assign(viennaWorks.find(work => work[0] === "isabella"), ["philip-iv","hidden","西班牙国王腓力四世","Philip IV of Spain","迭戈·委拉斯开兹","1632 年","Tizian - Porträt der Isabella d'Este.jpg","冷门但值得","重要藏品","先看黑衣如何吞掉大部分身体，再让脸、白领和一只手从暗色秩序里浮出来。","委拉斯开兹把国王画得几乎没有动作；克制不是缺乏戏剧，而是让无需证明的权力显得自然。","腓力四世肖像有多个版本和工作室复制；维也纳本的重要性在委拉斯开兹本人笔法与公主肖像组形成王朝对照。"]);

const viennaCardSummaries = {
  hunters:"三名猎人只带回一只狐狸，勃鲁盖尔却把这点猎获扩展成整个村庄的冬天：雪坡、火焰、冰面与远山共同组织起劳作和游戏。它既是六季组画中不可替代的冬季单元，也把微小日常人物放进了一个完整而辽阔的世界。",
  babel:"宏伟塔楼仍在加速施工，裂缝和错位拱券却早已把失败写进结构。",
  wedding:"一块门板变成传菜托盘，食物与目光让整场婚宴真正运转起来。",
  children:"两百多个孩子接管城市，在八十多种游戏里排练成人世界。",
  carnival:"狂欢节与四旬斋各占广场一边，全城生活却比两派口号复杂得多。",
  dance:"被画框切断的脚步与贴脸风笛，把观众直接卷进村庄舞会。",
  gloomy:"冬末的风、海难与劳作共同主宰画面，春天还没有提供安慰。",
  herd:"牛群被风暴追着下山，身体队列让秋季呈现为一次集体迁徙。",
  "art-painting":"一间可信工作室化为谜面，地图、模特与背影画家共同追问绘画身份。",
  "infanta-blue":"银蓝礼服远看坚硬华丽，近看却散成委拉斯开兹松动的晚期笔触。",
  "infanta-white":"《宫娥》里的小公主独自站定，银白礼服承担起王朝婚配的目光。",
  jane:"珠宝与金线精确固定王后身份，一张克制的脸仍从制度服装中露出。",
  maximilian:"皇帝掌中的石榴象征联合，衰老面孔则保留维持帝国的真实重量。",
  gallery:"几十幅名画与收藏者同场合影，留下KHM核心馆藏形成前夜的视觉档案。",
  "madonna-meadow":"温柔三角构图里，一枚小十字架已经把未来受难带进草地。",
  crowning:"木棍、皮肤与定向强光把受难压缩为无法躲开的近距离身体事件。",
  rosary:"一双脏脚伸向观众，大型祭坛画因此恢复了公共礼拜的人群尺度。",
  philosophers:"三个人、一个洞穴和一套测量工具，留下线索充足却拒绝结案的谜。",
  danae:"同一阵金雨在床的两端变成神的欲望与侍女眼中的财富。",
  nymph:"人物关系无法钉死，暮色与松散颜料反而成为晚年提香真正的故事。",
  "rose-garlands":"丢勒把自己写进威尼斯祭坛画，公开展示北方精度与意大利颜色的合流。",
  convex:"凸起木板、镜面畸变与夸张大手共同完成一张三维画家名片。",
  summer:"蔬果近看各自真实，退远却组成一张承载宫廷物产想象的侧脸。",
  fire:"蜡烛、火器与鹰徽拼成人脸，火从自然元素一路被收编为帝国技术。",
  "rubens-self":"没有画具的晚年自画像，让鲁本斯以绅士、外交家和衰老人共同出现。",
  "four-rivers":"丰盈身体、河神与异域动物，保存了17世纪欧洲想象全球的方式。",
  "rembrandt-self":"朴素褐衣与宽阔插腰姿态相遇，尊严不再依赖华服和职业道具。",
  "jan-leeuw":"一枚金环、署名原框和直视目光，把十五世纪金匠的身份链完整留下。",
  saliera:"盐与胡椒被海陆神祇守护，普通餐桌动作升级成黄金宇宙。",
  "burgundy-cup":"一只没有被熔掉的宫廷金杯，保存了中世纪权力被举到手中的样子。",
  krumau:"流动衣褶与亲子动作，让哥特礼拜像同时保有高贵距离和身体温度。",
  ship:"发条曾让皇帝、选侯、音乐和炮声自动运行，帝国秩序需要被不断上弦。",
  "helena-fur":"同一个抓住皮草的手势完成遮蔽与展示，亲密目光因此始终不稳定。",
  saul:"国王自尽被缩进山谷角落，军队与地形夺走了历史画的英雄中心。",
  gemma:"天然双色缟玛瑙把神化皇帝和弯腰俘虏分在权力的上下两层。",
  nagyszent:"二十三件金器共同保存跨文化图像，也保留无法被单一族属解决的谜。",
  "jupiter-io":"朱庇特只在接触处从云中长出脸和手，无形神体因此获得触觉。",
  ganymede:"巨鹰把少年带向天空，地面小狗让优美飞升重新显出劫持的距离。",
  kani:"名字、供品和劳动场景仍在原构件围成的空间里维持墓主来世。",
  "philip-iv":"脸、白领和一只手从深黑秩序中浮出，静止本身成为王权姿态。"
};

museumData.vienna = {
  id:"vienna", editorialCapacity:40, cardCopyContract:"independent-v1", city:"维也纳 · 奥地利", zh:"维也纳艺术史博物馆", en:"Kunsthistorisches Museum Vienna",
  ...museumRatings.vienna,
  verdict:"这里足以成为一次维也纳之旅的主因：世界最集中的老勃鲁盖尔收藏之外，还有委拉斯开兹、维米尔与哈布斯堡珍宝室的连续高峰。",
  hero:viennaFile("Kunsthistorisches Museum Wien, Neue Burg.jpg"), contentFile:"./research/vienna-content-v2.md",
  intro:["KHM的强项高度集中：十二幅老勃鲁盖尔、成组的委拉斯开兹宫廷肖像、意大利与北方绘画高峰，以及收藏黄金、宝石和机械奇观的 Kunstkammer。","绘画与珍玩放在一起，会显出这座馆真正的主题：哈布斯堡王朝怎样认识、占有并展示世界。"],
  official:"https://www.khm.at/en/visit/collections", visit:"https://www.khm.at/en/visit",
  chapters:[
    {id:"bruegel",number:"01",title:"勃鲁盖尔把整个世界塞进一张画",intro:"季节、劳动、节庆和战争在他的画里各自行动，又被同一片地形收拢。"},
    {id:"dynasty",number:"02",title:"一张脸怎样替王朝工作",intro:"公主、皇帝与收藏家的肖像承担婚配、继承和公共身份。"},
    {id:"italy",number:"03",title:"意大利画家如何让颜料会呼吸",intro:"从拉斐尔的秩序走到提香和卡拉瓦乔的肉身、光与不确定。"},
    {id:"north",number:"04",title:"北方绘画把眼睛训练得更狡猾",intro:"镜子、地图、蔬果和自画像，让观看本身成为题目。"},
    {id:"kunst",number:"05",title:"王公为什么收藏盐罐、贝壳和机器",intro:"Kunstkammer 不分艺术与科学，它展示的是把世界占有、分类和发动的欲望。"},
    {id:"antiquity",number:"06",title:"帝国怎样把胜利刻进材料",intro:"宝石、金器、陶杯和石棺让政治依附于耐久物质。"},
    {id:"egypt",number:"07",title:"一间墓室如何在异乡继续运转",intro:"名字、供养和图像原本共同承担维持来世的任务。"},
    {id:"hidden",number:"08",title:"冷门但值得",intro:"它们未必最有名，却能补上天气、晚期笔触、收藏史和材料观念。"}
  ],
  works:viennaWorks.map((w,i)=>({
    id:w[0],ch:w[1],zh:w[2],en:w[3],by:w[4],date:w[5],place:"主楼常设馆藏；展出状态需核验",tag:w[7],time:i<10?"8 分钟":"6 分钟",
    image:viennaFile(w[6]),imageSource:viennaDirect[w[6]] ? (w[0] === "ship" ? "https://www.khm.at/en/artworks/automaton-in-the-form-of-a-ship-87073" : "https://www.khm.at/en/artworks/deckelpokal-sog-burgundischer-hofbecher-86226") : viennaCommons(viennaAliases[w[6]] || w[6]),source:khmArtworks,look:w[9],story:w[10],again:"",
    significance:w[8],preciousWhy:w[11],cardSummary:viennaCardSummaries[w[0]]
  }))
};
