// SMK – National Gallery of Denmark. All 30 object records were checked against the official SMK API on 2026-07-21.
const smkCollection = "https://www.smk.dk/en/article/the-collection/";
const smkVisit = "https://www.smk.dk/en/visit/";
const smkObject = id => `https://open.smk.dk/en/artwork/image/${id}`;

const smkRows = [
  ["melancholy","royal","忧郁","Melancholy","老卢卡斯·克拉纳赫 Lucas Cranach the Elder · 德国","1532 年","KMSsp722","201A","画里人人都在忙，事情却没有一件像会有结果；从巨球、小圆环一路看到黑云，克拉纳赫把“忧郁”画成日常仍在运转、危险却已悄悄靠近。","重要藏品","绝对不可错过","10 分钟","https://iip-thumb.smk.dk/iiif/jp2/8336h5032_KMSsp722.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["titans","royal","泰坦诸神的陨落","The Fall of the Titans","科内利斯·科内利松·范哈勒姆 Cornelis Cornelisz. van Haarlem","1588—1590 年","KMS1","205","二十多具巨大的身体从天上砸成一团；这幅三米宽的王室旧藏把神话、人体炫技和政治秩序压在同一场坠落里。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/9g54xm869_KMS1-cropped.tif.jp2/full/!1024,/0/default.jpg"],
  ["rubens-cross","royal","十字架上的基督","Christ on the Cross","彼得·保罗·鲁本斯 Peter Paul Rubens","约 1592—1633 年","KMSsp186","204","身体没有被画成平静符号：扭转的胸腹、被拉长的手臂和压低的云层，让受难仍发生在肉身上。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/p2676z805_KMSKMSsp186-cropped.tif.jp2/full/!1024,/0/default.jpg"],
  ["rembrandt-old-man","royal","侧面老人习作","Study of an Old Man in Profile","伦勃朗 Rembrandt van Rijn","约 1628—1632 年","KMS1636","209","一小块木板容下蓬乱白发、低垂眼皮和鼻尖上的光；它的价值还在于技术检测支持这是年轻伦勃朗亲手完成的脸。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/6q182p44d_KMS1636.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["rembrandt-crusader","royal","持鹰骑士习作（“十字军”）","Sketch for The Knight with the Falcon, known as ‘The Crusader’","伦勃朗及工作室 Rembrandt van Rijn and workshop","1659—1661 年","KMS1384","209","厚颜料把头巾、脸和衣领从黑暗里推出来；画面保留了晚年伦勃朗迅速搭建人物的过程，光洁完成度反倒退居其次。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/js956j577_KMSKMS1384.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["eckersberg-self","golden","自画像","Self-Portrait","C.W. 埃克斯贝格 C.W. Eckersberg","1807—1810 年","KMS1764","217C","年轻画家侧过身回望，外套、卷发和毫不讨好的目光一起宣布：丹麦绘画的新主角将是观察本身。","重要藏品","强烈推荐","6 分钟","https://iip-thumb.smk.dk/iiif/jp2/h702q9542_KMS1764.TIF.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["eckersberg-clouds","golden","海上云层习作","Study of Clouds over the Sea","C.W. 埃克斯贝格 C.W. Eckersberg","1826 年","KMS6433","217C","天与海几乎没有故事，云的体积、方向和光却被记录得像实验数据；黄金时代的清晰感从这里长出来。","重要藏品","强烈推荐","6 分钟","https://iip-thumb.smk.dk/iiif/jp2/sq87bx612_KMS6433.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["kobke-sortedam","golden","从多瑟林根望向诺勒布罗的索特丹湖","A View of Lake Sortedam from Dosseringen Looking towards Nørrebro","克里斯滕·科布克 Christen Købke","1838 年","KMS359","217D","一条木栈道、平静湖面和哥本哈根郊外被画得异常精确；真正动人的却是傍晚光线让熟悉地方短暂变得不可替代。","稀世珍品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/gt54kq89w_KMSKMS359.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["kobke-dosseringen","golden","多瑟林根望向诺勒布罗","View of Dosseringen towards Nørrebro","克里斯滕·科布克 Christen Købke","约 1841—1845 年","KMS3613","217D","小画幅把湖岸栏杆、树梢和城市天际线切成几层；它适合与大幅索特丹湖并看，观察科布克怎样用取景改变同一地点。","重要藏品","强烈推荐","6 分钟","https://iip-thumb.smk.dk/iiif/jp2/3n2042320_KMS3613.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["artists-rome","golden","罗马的丹麦艺术家群像","A Group of Danish Artists in Rome","康斯坦丁·汉森 Constantin Hansen","1837 年","KMS3236","218B","五位旅居罗马的艺术家挤在一间房里，画像、建筑图和东方服饰各说一层身份；黄金时代也由出国、结社与自我塑造组成。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/z603r1675_kms3236.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["life-class","golden","皇家美术学院人体课","The Life Class at the Royal Academy of Fine Arts","威廉·本茨 Wilhelm Bendz","1826 年","KMS54","221","裸体模特站在灯下，学生和老师围成观看机器；这间课堂解释了黄金时代那种精确身体从何而来，也暴露谁能看、谁被看。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/hd76s515h_kms54.tif.jp2/full/!1024,/0/default.jpg"],
  ["sculptor-studio","golden","雕塑家的工作室","A Sculptor in his Studio Working from the Life","威廉·本茨 Wilhelm Bendz","1827 年","KMS62","221","真人模特、泥塑、石膏和完成中的雕像同时出现，艺术创作不再像灵感降临，而像一条可以逐段拆开的生产线。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/k3569765z_KMS62.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["acropolis-workers","golden","在雅典卫城遗址工作的希腊人","Greeks Working in the Ruins of the Acropolis","马丁努斯·勒比 Martinus Rørbye","1835 年","KMS4299","219","古典柱廊下出现搬运、休息和交谈的当代希腊人；废墟没有冻结在过去，而被重新放回 19 世纪的劳动与民族想象。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/wm117s302_KMS4299.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["pot-seller","golden","吉萨的埃及卖陶女","An Egyptian Pot Seller at Gizeh","伊丽莎白·耶里肖—鲍曼 Elisabeth Jerichau Baumann","1876—1878 年","KMS8791","220","陶罐、珠饰和直视观众的目光先制造强烈在场感；继续看，欧洲旅行者对“东方”的期待也藏在这份精致里。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/0z709032g_kms8791-cropped.tif.jp2/full/!1024,/0/default.jpg"],
  ["kroyer-bathers","nordic","斯卡恩海滨沐浴的男孩，夏夜","Boys Bathing at Skagen. Summer Evening","P.S. 克罗耶 P.S. Krøyer","1899 年","KMS1658","224","黄昏把海面压成蓝紫色，跑动与弯腰的男孩让冷光获得节奏；斯卡恩画派的“蓝色时刻”在这里不是滤镜。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/h702q953s_KMS1658.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["ring-windows","nordic","法式落地窗前：画家的妻子","At the French Windows. The Artist’s Wife","L.A. 林 L.A. Ring","1897 年","KMS3716","228","怀孕的西格丽站在花园入口，嫩叶与枯枝把新生和死亡放进同一扇门；宁静构图里其实有一道很硬的生命边界。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/1544bs13w_kms3716.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["munch-summer","nordic","夏夜","Summer Evening","爱德华·蒙克 Edvard Munch","1889 年","KMS2070","221","女子独坐海边，岸线和身体都被拉成长而安静的轮廓；这不是《呐喊》的预演，却已能看见蒙克怎样让风景承担心理。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/x346d7279_KMS2070.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["hammershoi-sunlight","nordic","斯特兰街室内：地板上的阳光","Interior in Strandgade, Sunlight on the Floor","维尔赫姆·哈默斯霍伊 Vilhelm Hammershøi","1901 年","KMS3696","227","没有人物，门、窗和一块梯形阳光仍让房间像刚发生过什么；哈默斯霍伊把空白变成最有压力的部分。","稀世珍品","绝对不可错过","9 分钟","https://iip-thumb.smk.dk/iiif/jp2/3197xr831_KMS3696.tif.jp2/full/!1024,/0/default.jpg"],
  ["hammershoi-teacup","nordic","端茶杯的伊达·哈默斯霍伊","Ida Hammershøi, the Artist’s Wife, with a Teacup","维尔赫姆·哈默斯霍伊 Vilhelm Hammershøi","1907 年","KMS3352","227","伊达近在桌边却没有迎接观众，杯子、手和低头动作把亲密生活封成一道无法闯入的灰色距离。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/pn89d956v_KMS3352-cropped.tif.jp2/full/!1024,/0/default.jpg"],
  ["anna-funeral","nordic","葬礼","A Funeral","安娜·安彻 Anna Ancher","1891 年","KMS1433","224","黑衣人群围着浅色棺木，屋内光线没有安慰任何人；安彻用色块和相互错开的视线画出共同哀悼中的各自孤独。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/5712mc657_kms1433.tif.jp2/full/!1024,/0/default.jpg"],
  ["lifeboat","nordic","救生艇穿过沙丘","The Lifeboat is Taken through the Dunes","迈克尔·安彻 Michael Ancher","1883 年","KMS1222","222","渔民们把沉重救生艇拖过沙地，几乎所有身体都朝同一方向发力；英雄主义被落实为集体劳动和坏天气。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/6q182p434_KMS1222.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["green-line","french","马蒂斯夫人肖像：绿线","Portrait of Madame Matisse. The Green Line","亨利·马蒂斯 Henri Matisse","1905 年","KMSr171","213","一条绿线把脸切成冷暖两半，却没有把人画坏；它证明颜色可以不服从肤色，仍然把光、体积和性格组织起来。","稀世珍品","绝对不可错过","10 分钟","https://iip-thumb.smk.dk/iiif/jp2/kd17cx80w_KMSr171-crop.tif.jp2/full/!1024,/0/default.jpg"],
  ["matisse-goldfish","french","金鱼","Goldfish","亨利·马蒂斯 Henri Matisse","1912 年","KMSr82","213","橙色金鱼像几个发光标点，桌面、玻璃缸和花园却拒绝待在同一个透视空间；观看本身变成一种缓慢游动。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/n870zv130_KMSr82_-_cropped.tif.jp2/full/!1024,/0/default.jpg"],
  ["matisse-self","french","自画像","Self-Portrait","亨利·马蒂斯 Henri Matisse","1906 年","KMSr78","213","条纹衫、胡须和脸由几块近乎粗暴的颜色拼起；马蒂斯把自己画成一场正在发生的色彩实验。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/g732dd003_KMSr78.TIF.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["derain-chemise","french","穿衬衣的女子","Woman in a Chemise","安德烈·德兰 André Derain","1906 年","KMSr14","214","红、绿和蓝没有温顺地描述皮肤与布料，而把人物撑成一块灼热平面；野兽派的“野”首先是颜色获得自主权。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/cj82kb35p_KMSr14.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["picasso-gosol","french","戈索尔的房屋","Houses in Gósol","巴勃罗·毕加索 Pablo Picasso","约 1906 年","KMSr92","213","村屋被压成赭色方块，窗与墙像要脱离真实建筑；立体主义尚未正式出现，拆解空间的念头已经启动。","重要藏品","强烈推荐","7 分钟","https://iip-thumb.smk.dk/iiif/jp2/w66347730_KMSr92_crop.tif.jp2/full/!1024,/0/default.jpg"],
  ["braque-estaque","french","埃斯塔克的树","Trees at l’Estaque","乔治·布拉克 Georges Braque","1908 年","KMSr7","214","树干、山坡和房屋挤成一组互相顶住的体块，远近关系开始失效；这是立体主义从风景里长出来的一刻。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/8049g796m_KMSKMSr7.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["jorn-sun","modern","太阳真让我火大","The Sun is Pissing Me Off","阿斯格·约恩 Asger Jorn","1961 年","KMS8657","269A","颜料像被抓、抹和喷吐到画布上，黄色太阳既可笑又暴躁；约恩让绘画保留涂鸦、神话和坏脾气。","重要藏品","绝对不可错过","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/794081367_KMS8657.tif.reconstructed.tif.jp2/full/!1024,/0/default.jpg"],
  ["ferlov-mask","modern","面具与人物","Mask and Figure","松娅·费洛夫·曼科巴 Sonja Ferlov Mancoba","1977—1984 年","KMS8889","269A","孔洞、突起和两具相依的身体拒绝变成单一人物；雕塑像面具、同伴，也像一套防御结构。","重要藏品","冷门但值得","8 分钟","https://iip-thumb.smk.dk/iiif/jp2/4j03d441s_kms8889.tif.jp2/full/!1024,/0/default.jpg"],
  ["horse-sacrifice","modern","《献马祭》遗留物","Objects from ‘The Horse Sacrifice’","比约恩·诺尔高 Bjørn Nørgaard","1970 年","KMS8603","263C","玻璃罐、马的残留物与档案把一次真实祭献留在馆内；它逼人追问艺术制度、动物身体和政治抗议的边界。","重要藏品","冷门但值得","9 分钟","https://api.smk.dk/api/v1/thumbnail/66584e9a-4951-45a9-ac93-9be6c886c636.jpg"]
];

const smkWorks = smkRows.map(([id,ch,zh,en,by,date,number,room,cardSummary,significance,tag,time,image]) => ({
  id,ch,zh,en,by,date,number,place:`SMK ${room} 展厅；2026-07-21 官方 API 标为在展`,tag,time,image,
  source:smkObject(number),imageSource:smkObject(number),cardSummary,significance,
  preciousWhy: significance === "稀世珍品" ? "本馆拥有难以替代的代表作或成组收藏；具体存世、版本和比较边界见正文。" : "价值来自作者发展、本馆收藏结构或丹麦艺术叙事中的明确位置；比较边界见正文。"
}));

museumData.smk = {
  id:"smk", editorialCapacity:30, contentUpdatedAt:"2026-07-22", city:"哥本哈根 · 丹麦", zh:"丹麦国立美术馆", en:"SMK — National Gallery of Denmark",
  ...museumRatings.smk,
  verdict:"丹麦黄金时代在这里不是一间地方绘画展厅：它与王室旧藏、哈默斯霍伊、马蒂斯和战后丹麦艺术连成一部国家收藏怎样不断改写自己的历史。",
  hero:"https://www.smk.dk/wp-content/uploads/2023/03/Facade2-scaled-e1679901449472.jpg",
  contentFile:"./research/smk-content-v1.md", official:smkCollection, visit:smkVisit,
  intro:[
    "SMK 的起点是丹麦王室收藏，1849 年君主制转向立宪后，藏品也转为国家所有。今天它保存超过二十万件作品，时间跨越约七百年；但参观时无需把它当成缩小版卢浮宫，真正应该抓住的是几条在哥本哈根才能看得这么集中的主线。",
    "第一条是丹麦黄金时代：SMK 拥有全球规模最大的克里斯滕·科布克收藏，也拥有世界最大的哈默斯霍伊收藏之一。第二条是法国现代主义：约翰内斯·鲁普的捐赠带来二十五件马蒂斯，使这里形成法国境外最重要的马蒂斯收藏群之一，《绿线》则是能单独改变一次参观重量的作品。",
    "30 件是这家馆合适的解释容量。前二十件能建立王室旧藏、黄金时代与北欧美术的骨架；后二十到三十件把马蒂斯、早期立体主义和丹麦战后艺术接上。继续扩到 40 件会增加好作品，却不再增加同等强度的新理由。"
  ],
  chapters:[
    {id:"royal",number:"01",title:"王室收藏先决定什么值得留下",intro:"克拉纳赫、鲁本斯与伦勃朗说明国家美术馆的欧洲旧藏怎样从宫廷趣味长出。"},
    {id:"golden",number:"02",title:"黄金时代把哥本哈根看得异常具体",intro:"课堂、工作室、湖岸与罗马朋友圈共同塑造丹麦绘画的清晰目光。"},
    {id:"nordic",number:"03",title:"北欧的光开始携带心理",intro:"斯卡恩海边、室内门窗和葬礼让光线从自然现象变成情绪结构。"},
    {id:"french",number:"04",title:"颜色与空间摆脱写实职责",intro:"从《绿线》到埃斯塔克，颜色、平面与体块依次取得自主权。"},
    {id:"modern",number:"05",title:"丹麦现代艺术保留坏脾气与身体",intro:"绘画、雕塑和行为遗留物把战后艺术推向材料、政治和制度。"}
  ],
  works:smkWorks,
  cardCopyContract:"independent-v1"
};
