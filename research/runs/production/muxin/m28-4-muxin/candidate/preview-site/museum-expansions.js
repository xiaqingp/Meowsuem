// M11 capacity and selection overrides. All museums still use museum-app.js.
(function () {
  const met = museumData.met;
  const metRow = row => {
    const [id,ch,zh,en,by,date,objectId,image,cardSummary,significance="重要藏品",tag="强烈推荐",time="5 分钟"] = row;
    return {id,ch,zh,en,by,date,place:ch==="hidden"?"大都会艺术博物馆馆藏；馆址与在展状态需核验":"第五大道主馆；具体展厅与轮换状态需核验",tag,time,image,imageSource:`https://www.metmuseum.org/art/collection/search/${objectId}`,source:`https://www.metmuseum.org/art/collection/search/${objectId}`,cardSummary,significance,preciousWhy:significance==="特色看点"?undefined:"珍贵性来自原境、媒介、作者转折或馆藏结构中的具体位置；最近比较对象与证据边界见正文。"};
  };
  const metAdded = [
    ["perneb","architecture","佩内布墓室","Mastaba Tomb of Perneb","古埃及，古王国工匠","约公元前 2381—2323 年",543937,"https://images.metmuseum.org/CRDImages/eg/web-large/DP108489.jpg","不是一块墓葬残片，而是一座可以走进去、按原有墙面关系理解的古王国墓室。","稀世珍品","绝对不可错过","8 分钟"],
    ["meketre-granary","gods","粮仓与书记模型","Model of a Granary with Scribes","古埃及，中王国工匠","约公元前 1981—1975 年",545281,"https://images.metmuseum.org/CRDImages/eg/web-large/DP351557.jpg","来世粮食供应被做成缩微管理系统：搬运、计量与记账缺一不可。"],
    ["sardis-column","ideal","萨迪斯阿耳忒弥斯神庙柱","Marble Column from the Temple of Artemis at Sardis","古希腊化时期工匠","约公元前 300 年",252453,"https://images.metmuseum.org/CRDImages/gr/web-large/DP144130.jpg","一段室内巨柱让你用身体尺度理解古代神庙，而不只是看一块精美柱头。"],
    ["boscoreale","architecture","博斯科雷亚莱别墅卧室","Cubiculum from the Villa of P. Fannius Synistor","古罗马坎帕尼亚工匠","约公元前 50—40 年",247017,"https://images.metmuseum.org/CRDImages/gr/web-large/DP143704.jpg","墙面用透视假建筑把一间小卧室向外撑开；你站的位置正是作品的一部分。","稀世珍品","绝对不可错过","8 分钟"],
    ["night-shining-white","power","照夜白图","Night-Shining White","韩干","约 750 年",39901,"https://images.metmuseum.org/CRDImages/as/web-large/DP153705.jpg","被拴住的马把力量压进一根绳，后世题跋又把一张画变成千年接力。","稀世珍品","绝对不可错过","7 分钟"],
    ["old-trees","power","树色平远图","Old Trees, Level Distance","郭熙","约 1080 年",39668,"https://images.metmuseum.org/CRDImages/as/web-large/DP167812_CRD.jpg","枯树、雾气与平远层次，让观看像在空气里慢慢展开。","稀世珍品","绝对不可错过","7 分钟"],
    ["great-wave","public","神奈川冲浪里","Under the Wave off Kanagawa (The Great Wave)","葛饰北斋","约 1830—1832 年",39799,"https://images.metmuseum.org/CRDImages/as/web-large/DP141042.jpg","别只认那道浪：先找三条船和富士山，紧张来自人如何从巨浪缝隙穿过去。"],
    ["old-plum","power","老梅图","Old Plum","狩野山雪","1646 年",44858,"https://images.metmuseum.org/CRDImages/as/web-large/DT229.jpg","一棵扭曲老梅横跨四扇襖门，像把植物画成在建筑里推进的巨大身体。"],
    ["maebyeong","ideal","云鹤纹梅瓶","Maebyeong Decorated with Cranes and Clouds","高丽王朝陶工","13 世纪晚期",39590,"https://images.metmuseum.org/CRDImages/as/web-large/DT4857.jpg","白鹤与云纹来自刻开泥胎、填入异色泥料再共同烧成的高难度镶嵌技法。"],
    ["damascus-room","architecture","大马士革室","Damascus Room","奥斯曼时期大马士革工匠","1707 年",452102,"https://images.metmuseum.org/CRDImages/is/web-large/DP240367.jpg","整套墙板、壁龛与题铭共同组织待客礼仪，不是几件家具拼成的异域风格。","稀世珍品","绝对不可错过","9 分钟"],
    ["harvesters","public","收割者","The Harvesters","老彼得·勃鲁盖尔","1565 年",435809,"https://images.metmuseum.org/CRDImages/ep/web-large/DP119115.jpg","近处吃饭与睡倒的人连接远方麦田：宏大季节由具体劳动拼成。","稀世珍品","绝对不可错过","7 分钟"],
    ["toledo","public","托莱多风景","View of Toledo","埃尔·格列柯","约 1599—1600 年",436575,"https://images.metmuseum.org/CRDImages/ep/web-large/DP349564.jpg","它不是可靠地图，而是把教堂、山坡和暴风云重排成精神性的城市肖像。","稀世珍品","绝对不可错过","6 分钟"],
    ["juan-pareja","public","胡安·德·帕雷哈肖像","Juan de Pareja","迭戈·委拉斯开兹","1650 年",437869,"https://images.metmuseum.org/CRDImages/ep/web-large/DP-14286-001.jpg","一位当时仍受画家奴役的助手直视观众；绘画尊严与现实权力在同一张脸上冲突。","稀世珍品","绝对不可错过","7 分钟"],
    ["rembrandt-self","public","自画像","Self-Portrait","伦勃朗","1660 年",437397,"https://images.metmuseum.org/CRDImages/ep/web-large/DP-16323-001.jpg","厚涂、刮擦和迟疑目光没有把晚年画家美化成成功者。"],
    ["denial-peter","public","圣彼得不认主","The Denial of Saint Peter","卡拉瓦乔","1610 年",437986,"https://images.metmuseum.org/CRDImages/ep/web-large/DP-12413-001.jpg","三个人和三次指认，把背叛压进伸出的手指、火光与圣彼得收回胸前的双手。"],
    ["gertrude-stein","public","格特鲁德·斯泰因肖像","Gertrude Stein","巴勃罗·毕加索","1905—1906 年",488221,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/488221/1009264/restricted","脸像古代面具，身体坐在现代沙龙里：这是毕加索走向立体主义前的转折。","稀世珍品","绝对不可错过","7 分钟"],
    ["monet-bridge","public","睡莲池上的桥","Bridge over a Pond of Water Lilies","克洛德·莫奈","1899 年",437127,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/437127/2331256/restricted","先认出桥，再看植物、倒影和水面怎样让上下边界逐渐失效。"],
    ["wheat-cypresses","public","麦田与柏树","Wheat Field with Cypresses","文森特·梵高","1889 年",436535,"https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg","云、山、树与麦田像被同一股力量卷动；重点是笔触怎样组织自然。","重要藏品","绝对不可错过","6 分钟"],
    ["matisse-dance","public","旱金莲与《舞蹈》","Nasturtiums with the Painting ‘Dance’ I","亨利·马蒂斯","1912 年",483301,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/483301/1321292/restricted","桌面、花盆与墙上《舞蹈》互相穿透，房间被压平后颜色反而开始运动。"],
    ["autumn-rhythm","public","秋韵：第 30 号","Autumn Rhythm: Number 30, 1950","杰克逊·波洛克 Jackson Pollock · 美国","1950 年",488978,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/488978/2334675/restricted","颜料会受重力牵引，也会留下画家何时移动、覆盖和停手的决定。《秋韵（第30号）》把这两股力量铺在超过五米的横幅上：黑线弯转，白色滴点与粗痕交叠，浅褐底布仍从缝隙中透出。它值得点开，不是因为“泼洒”听起来大胆，而是因为那些上下层关系让偶然与选择同时变得可见。","重要藏品","绝对不可错过","8 分钟"],
    ["rothko-13","public","第 13 号（白、红与黄）","No. 13 (White, Red on Yellow)","马克·罗斯科","1958 年",484362,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/484362/1006959/restricted","站远是三块颜色，站近后边缘开始呼吸；作品也使用你的视野和停留时间。","重要藏品","绝对不可错过","8 分钟"],
    ["williamsburg","public","从威廉斯堡大桥望去","From Williamsburg Bridge","爱德华·霍普","1928 年",487834,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/487834/2354161/restricted","桥上视线掠过一排窗户，却没有真正进入任何生活：近而不可达就是城市孤独。"],
    ["sainte-victoire","public","圣维克多山与阿尔克河谷高架桥","Mont Sainte-Victoire and the Viaduct","保罗·塞尚","1882—1885 年",435877,"https://images.metmuseum.org/CRDImages/ep/web-large/DP-20099-001.jpg","色块把树、桥、空气和远峰一起搭成随观看稳定下来的结构。"],
    ["oxbow","public","牛轭湖","The Oxbow","托马斯·科尔","1836 年",10497,"https://images.metmuseum.org/CRDImages/ad/web-large/DP-12550-001.jpg","左边暴风与森林，右边晴空和耕地；土地该保留还是开发被一刀分开。","重要藏品","绝对不可错过","7 分钟"],
    ["tiffany-autumn","ideal","秋日风景彩色玻璃窗","Autumn Landscape","蒂芙尼工作室","1923—1924 年",282,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/282/33513/restricted","不用颜料模仿秋色，而让不同纹理和厚度的玻璃直接过滤真实光线。"],
    ["tanner-flight","public","逃往埃及","Flight Into Egypt","亨利·奥萨瓦·坦纳","1923 年",16947,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/16947/2216155/restricted","圣经故事被压进蓝紫夜色，微弱光线让逃亡先变成身体感受。"],
    ["bisj","power","比斯祖先柱","Bisj (Ancestor Pole)","阿斯马特艺术家","20 世纪 50 年代晚期",313830,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/313830/2196301/restricted","高耸镂空柱把多位祖先、死亡与社群义务叠成一条向上的谱系。"],
    ["merode","room","梅罗德祭坛画","Annunciation Triptych (Merode Altarpiece)","罗伯特·康平及工坊","约 1427—1432 年",470304,"https://images.metmuseum.org/CRDImages/cl/web-large/DP273206.jpg","天使降临普通住宅；蜡烛、百合、锅与街景都把神迹藏进日常。","稀世珍品","专程值得","8 分钟"],
    ["mirror-bearer","power","持镜者","Mirror-Bearer","玛雅艺术家","公元 410—650 年",313256,"https://images.metmuseum.org/CRDImages/ao/web-large/DP-24340-001.jpg","跪姿人物原本托住一面镜子；看似侍从的身体同时承担通向神圣视觉的媒介。"],
    ["kneeling-bull","ideal","持流口器的跪牛","Kneeling Bull Holding a Spouted Vessel","原始埃兰工匠","约公元前 3100—2900 年",329074,"https://images.metmuseum.org/CRDImages/an/web-large/DP-12449-001.jpg","牛穿衣并用前蹄托器皿，四千年前的金属工匠故意搅乱动物与人的界线。"],
    ["studiolo","hidden","古比奥公爵宫书房","Studiolo from the Ducal Palace in Gubbio","弗朗切斯科·迪·乔治·马蒂尼等","约 1478—1482 年",198556,"https://images.metmuseum.org/CRDImages/es/web-large/DT2954.jpg","木镶嵌把书、乐器和柜门伪装成立体空间，是精英给自己设计的思想肖像。","稀世珍品","冷门但值得","9 分钟"],
    ["little-house","hidden","弗朗西斯·利特尔住宅客厅","Living Room from the Francis W. Little House","弗兰克·劳埃德·赖特","1912—1914 年",7873,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/7873/1476156/restricted","窗、木墙与家具共同决定人怎样坐、看湖和感受水平线。","重要藏品","冷门但值得","8 分钟"],
    ["flatiron","hidden","熨斗大厦","The Flatiron","爱德华·斯泰肯","1904 年",267838,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/267838/1336222/restricted","建筑溶进黄昏、湿路与树影，摄影主动追求绘画般气氛。","重要藏品","冷门但值得"],
    ["gould-violin","hidden","“古尔德”小提琴","‘Gould’ Violin","安东尼奥·斯特拉迪瓦里","1693 年",503045,"https://images.metmuseum.org/CRDImages/mi/web-large/DT669.jpg","后来恢复巴洛克配置，使一件名琴也能说明乐器如何被时代持续改造。","重要藏品","冷门但值得","6 分钟"],
    ["oba-head","hidden","贝宁奥巴头像","Head of an Oba","贝宁王国黄铜铸造行会艺术家","19 世纪",310283,"https://images.metmuseum.org/CRDImages/ao/web-large/DP-25381-001.jpg","厚重项圈把头颈托成权力结构；它原本在祖先祭坛承接象牙与王朝记忆。","重要藏品","冷门但值得","6 分钟"],
    ["japanese-armor","hidden","具足","Armor (Gusoku)","早乙女家忠等日本甲胄工匠","16 与 18 世纪部件",22521,"https://images.metmuseum.org/CRDImages/aa/web-large/DT253026.jpg","不同时期部件组合为可活动身体，保护、身份与舞台效果同时存在。","重要藏品","冷门但值得","7 分钟"],
    ["maya-vessel","hidden","神话场景彩绘器皿","Vessel with Mythological Scene","玛雅“大都会画师”","公元 600—800 年",310364,"https://images.metmuseum.org/CRDImages/ao/web-large/DP-576-001.jpg","圆筒没有固定正面；必须绕一圈，神话人物与文字才按时间展开。","重要藏品","冷门但值得","6 分钟"],
    ["bangwa","hidden","勒费姆纪念像","Lefem Commemorative Figure","喀麦隆草原地区艺术家，Bangwa","19 至 20 世纪初",311037,"https://collectionapi.metmuseum.org/api/collection/v1/iiif/311037/667142/restricted","扭转身体、屈膝和张嘴让木像像正在表演，保存的是身份与行动。","重要藏品","冷门但值得","6 分钟"],
    ["isfahan-mihrab","hidden","伊斯法罕礼拜壁龛","Mihrab (Prayer Niche)","伊斯法罕陶工","伊斯兰历 755 年／公元 1354—1355 年",449537,"https://images.metmuseum.org/CRDImages/is/web-large/DP235035.jpg","数百块釉面砖把几何、植物和《古兰经》文字锁成一个朝向麦加的建筑焦点。","重要藏品","冷门但值得","7 分钟"],
    ["moche-portrait","hidden","人像头形瓶","Portrait Head Bottle","莫切文化陶工","5—6 世纪",308527,"https://images.metmuseum.org/CRDImages/ao/web-large/DP-23630-001.jpg","它不是抽象的‘古代人脸’：皱纹、眼袋与嘴角被塑成一个难以互换的具体人物。","重要藏品","冷门但值得","6 分钟"]
  ].map(metRow);
  met.editorialCapacity=60;
  met.chapters=[...met.chapters,{id:"architecture",number:"06",title:"把整座空间搬进博物馆",intro:"墓室、卧室与会客厅让观看者走进原有尺度。"},{id:"hidden",number:"07",title:"冷门但值得",intro:"十个不靠排队，却能改变你理解材料、空间与流动的入口。"}];
  met.works=[...met.works,...metAdded];
  met.intro=["大都会最容易被误逛成一串名作。它真正不可替代的地方，是同一天可以走进埃及墓室、罗马卧室与大马士革会客厅，再回到绘画、雕塑和仪式物件之间比较。","60 件不是一天任务，而是一座多次参观内容库：50 件跨文明主线加 10 件“冷门但值得”。波洛克、罗斯科等明确偏好有入口，但不自动排在古代或非西方作品之前。","第五大道主馆与 The Met Cloisters 分处两地，纸本、纺织与摄影会轮换；页面不把馆藏归属误写成当天一定可见。"];

  const seattle=museumData.seattle;
  const samRow=row=>{const[id,ch,zh,en,by,date,url,image,cardSummary,significance="重要藏品",tag="强烈推荐",time="5 分钟",imageSource=url]=row;return{id,ch,zh,en,by,date,place:"Seattle Art Museum downtown 主馆馆藏；是否在展需核验",tag,time,image,imageSource,source:url,cardSummary,significance,preciousWhy:significance==="特色看点"?undefined:"价值来自作者方法、跨文化接触或本馆收藏结构中的具体位置；比较边界见正文。"}};
  const samNew=[
    ["sea-change","modern","海变","Sea Change","杰克逊·波洛克","1947 年","https://art.seattleartmuseum.org/objects/2742/sea-change","https://art.seattleartmuseum.org/internal/media/dispatcher/76355/preview","刷画底层与滴洒、铝漆和砂石并存，正卡在波洛克成熟滴画法的转折点。","重要藏品","绝对不可错过","7 分钟"],
    ["rothko-11","modern","第 11 号","Number 11","马克·罗斯科","1947 年","https://art.seattleartmuseum.org/objects/11355/number-11","https://art.seattleartmuseum.org/internal/media/dispatcher/49129/preview","矩形还没摆脱生物般形状，能看见罗斯科走向后来色域的中间步骤。"],
    ["gorky-apron","modern","母亲绣花围裙如何在我的生命中展开","How My Mother's Embroidered Apron Unfolds in My Life","阿希尔·戈尔基","1944 年","https://art.seattleartmuseum.org/objects/5816/how-my-mothers-embroidered-apron-unfolds-in-my-life","https://art.seattleartmuseum.org/internal/media/dispatcher/95371/preview","植物、身体与记忆互相渗透，私人创伤被改造成绘画语法。"],
    ["double-elvis","modern","双重猫王","Double Elvis","安迪·沃霍尔","1963／1976 年","https://art.seattleartmuseum.org/objects/3307/double-elvis","https://art.seattleartmuseum.org/internal/media/dispatcher/29806/preview","同一持枪姿势被丝网重复，明星、暴力与商品复制变成一件事。"],
    ["sound-box","systems","自我制作之声盒","Box with the Sound of Its Own Making","罗伯特·莫里斯","1961 年","https://art.seattleartmuseum.org/objects/11616/box-with-the-sound-of-its-own-making","https://art.seattleartmuseum.org/internal/media/dispatcher/71820/preview","盒内播放制造它的录音，把结果、过程和你愿意付出的时间绑在一起。"],
    ["lawrence-studio","identity","画室","The Studio","雅各布·劳伦斯","1977 年","https://art.seattleartmuseum.org/objects/10605/the-studio","https://uw.pressbooks.pub/app/uploads/sites/414/2021/06/TheStudio1977-scaled-e1623197999280.jpg","扁平色块把工作室变成节奏明确的劳动现场。","重要藏品","强烈推荐","5 分钟","https://uw.pressbooks.pub/arth400jacoblawrence/front-matter/introduction-2/"],
    ["mirror","systems","镜面","MIRROR","道格·艾特肯","2013 年","https://art.seattleartmuseum.org/objects/38896/mirror","https://art.seattleartmuseum.org/internal/media/dispatcher/71153/preview","影像嵌在 downtown 外墙并按城市节奏改变，主馆作品主动看向街道。","特色看点"],
    ["host","modern","宿主","Host","埃伦·加拉格尔","1996 年","https://art.seattleartmuseum.org/objects/14756/host","https://art.seattleartmuseum.org/internal/media/dispatcher/42386/preview","密集的眼、嘴与符号先像装饰，靠近后显出种族化图像与大众印刷的压力。"],
    ["barcelona","modern","巴塞罗那","Barcelona","弗朗西斯·皮卡比亚","1924 年","https://art.seattleartmuseum.org/objects/14283/barcelona","https://art.seattleartmuseum.org/internal/media/dispatcher/42601/preview","机械图、身体和城市名称互相错接，达达式幽默让解释机器本身失灵。"],
    ["potter","identity","弗雷兴制陶师","Master Potter from Frechen","奥古斯特·桑德","1934 年","https://art.seattleartmuseum.org/objects/23703/topfermeister-aus-frechen-master-potter-from-frechen","https://www.moma.org/media/W1siZiIsIjMyNzk3NiJdLFsicCIsImNvbnZlcnQiLCItcXVhbGl0eSA5MCAtcmVzaXplIDIwMDB4MjAwMFx1MDAzZSJdXQ.jpg?sha=a78eb660a67746bc","正面、冷静的肖像让职业、衣着与姿态替人物说话。","重要藏品","强烈推荐","5 分钟","https://www.moma.org/collection/works/193762"],
    ["salt-cellar","stories","萨皮象牙盐罐","Salt Cellar","塞拉利昂萨皮雕刻家","约 1490—1530 年","https://art.seattleartmuseum.org/objects/7058/salt-cellar","https://art.seattleartmuseum.org/internal/media/dispatcher/48930/preview","欧洲餐桌器由非洲艺术家完成，委托、误读与能动性都留在象牙表面。","重要藏品","绝对不可错过","7 分钟"]
  ].map(samRow);
  seattle.works=[...seattle.works.filter(w=>!["someone","eyes","father","eagle","wake","schubert","bunyon","vivarium","cloud","curve","split"].includes(w.id)),...samNew];
  seattle.chapters=[{id:"place",number:"01",title:"西北不是一张空白地图",intro:"风景画与 Tlingit、Haida 对象揭示谁有权定义这片地方。"},{id:"identity",number:"02",title:"身份怎样被看见",intro:"肖像、帽子与画室把职业、族群和个人选择穿在身体上。"},{id:"stories",number:"03",title:"旧故事怎样被重新讲",intro:"宗教、史诗与跨海贸易在新观众面前重组。"},{id:"modern",number:"04",title:"绘画为什么不再服从图像",intro:"材料、重复与尺度开始自己说话。"},{id:"systems",number:"05",title:"作品可以是一段时间或系统",intro:"声音与建筑影像把制作、城市和停留纳入作品。"}];
  seattle.intro=["这一版只谈 1300 First Avenue 的 Seattle Art Museum downtown 主馆；Seattle Asian Art Museum 与 Olympic Sculpture Park 不再借作品替主馆增加分量。","主馆值得看的是西北原住民艺术、欧美绘画、非洲艺术与战后现代艺术如何相遇。波洛克和罗斯科不是抬分工具，而是主馆真实收藏结构的一部分。","20 件不代表当天全部在展；除明确 ongoing 展陈外，室内馆藏统一标注需核验。"];
  seattle.tradeoff="本页只覆盖 downtown Seattle Art Museum；不包含 Seattle Asian Art Museum 与 Olympic Sculpture Park。";
})();

(function () {
  const museum=museumData.glyptotek;
  const sculpture="https://glyptoteket.com/exhibitions/permanent-exhibitions/french-danish-sculpture";
  const danish="https://glyptoteket.com/exhibitions/permanent-exhibitions/danish-art";
  const egypt="https://glyptoteket.com/exhibitions/permanent-exhibitions/egyptian-collection";
  const nearEast="https://glyptoteket.com/exhibitions/permanent-exhibitions/middle-east";
  const row=r=>{const[id,ch,zh,en,by,date,image,source,cardSummary,significance="重要藏品",tag="强烈推荐",time="6 分钟"]=r;return{id,ch,zh,en,by,date,place:"新嘉士伯美术馆常设馆藏；具体展厅与在展状态需核验",tag,time,image,imageSource:source,source,cardSummary,significance,preciousWhy:significance==="特色看点"?undefined:"其价值来自本馆成组收藏、作者方法或丹麦艺术叙事中的位置；版本与数量边界见正文。"}};
  const added=[
    ["rodin-kiss","sculpture","吻","The Kiss","奥古斯特·罗丹","原型创作于 1880 年代","https://upload.wikimedia.org/wikipedia/commons/d/d8/Auguste_Rodin-The_Kiss-Ny_Carlsberg_Glyptotek-Copenhagen.jpg",sculpture,"别只看爱情：身体旋转、未完全收束的表面与版本关系，才是罗丹怎样让雕塑保持生成感。","重要藏品","绝对不可错过","7 分钟"],
    ["rodin-burghers","sculpture","加莱义民","The Burghers of Calais","奥古斯特·罗丹","1880 年代","https://upload.wikimedia.org/wikipedia/commons/2/2d/Ny_Carlsberg_Glyptotek_-_Rodin_B%C3%BCrger_von_Calais_3.jpg",sculpture,"六个人没有共同英雄姿势；不同手势与步伐把赴死前的恐惧、犹疑和责任拆开。"],
    ["rodin-thinker","sculpture","思想者","The Thinker","奥古斯特·罗丹","构思于 1880 年代","https://upload.wikimedia.org/wikipedia/commons/b/b8/Auguste_Rodin-The_Thinker-Ny_Carlsberg_Glyptotek-Copenhagen.jpg",sculpture,"脚趾、手腕和背部都在用力，思想被做成一项全身劳动。"],
    ["carpeaux-ugolino","sculpture","乌戈利诺与他的儿子们","Ugolino and His Sons","让-巴蒂斯特·卡尔波","1857—1861 年","https://upload.wikimedia.org/wikipedia/commons/d/d0/Ugolino_and_His_Sons_by_Jean-Baptiste_Carpeaux_at_Ny_Carlsberg_Glyptotek.jpg",sculpture,"饥饿的父亲被孩子围住，最可怕的不是动作完成，而是他还没决定是否越过人的底线。","重要藏品","绝对不可错过","8 分钟"],
    ["carpeaux-dance","sculpture","舞蹈","The Dance","让-巴蒂斯特·卡尔波","1873 年版本","https://upload.wikimedia.org/wikipedia/commons/9/9c/The_Dance_by_Jean-Baptiste_Carpeaux%2C_1873_-_Ny_Carlsberg_Glyptotek_-_Copenhagen_-_DSC09483.JPG",sculpture,"环形身体、飞起的腿与张开的嘴把学院雕塑推向喧闹现场。"],
    ["gebu","afterlife","司库主管盖布","Treasury Master Gebu","古埃及工匠","约公元前 1700 年","https://upload.wikimedia.org/wikipedia/commons/b/b2/Gebu%2C_Master_of_the_Royal_Treasury%2C_from_the_Temple_of_Karnak%2C_ca._1700_BCE%2C_Ny_Carlsberg_Glyptotek%2C_Copenhagen_%281%29_%2836284322061%29.jpg",egypt,"不靠王冠识别权力：方肩、端坐姿态和官职铭文让国家管理者获得纪念碑般稳定。"],
    ["sabina","faces","萨宾娜皇后肖像","Portrait of Empress Sabina","罗马雕刻家","公元 2 世纪","https://upload.wikimedia.org/wikipedia/commons/a/a4/Empress_Sabina%2C_wife_of_Hadrian%2C_Ny_Carlsberg_Glyptotek%2C_20220618_1047_7018.jpg","https://glyptoteket.com/exhibitions/permanent-exhibitions/greek-roman-sculpture","复杂发式和冷静面容把皇后塑成王朝连续性的公共形象。"],
    ["florentine","danish","镜前站立的佛罗伦蒂娜","Florentine Standing before a Mirror","萨洛蒙·鲁本·亨利克斯","1841 年","https://glyptoteket.com/_next/image?url=https%3A%2F%2Fakqa-glyptoteket.euwest01.umbraco.io%2Fmedia%2Fkvihklur%2Fdansk-kunst-1780-1930-0119-glyptoteket-2025-ana-cecilia-gonz%C3%A1lez.jpg&w=1920&q=90",danish,"女性裸体刚进入丹麦学院教学；镜子、布料与古典姿势让人体课暴露制度怎样规定观看。","特色看点","冷门但值得"],
    ["hammershoi-relief","danish","卢浮宫中的希腊浮雕","A Greek Relief in the Louvre","维尔赫姆·哈默斯霍伊","1891 年","https://upload.wikimedia.org/wikipedia/commons/b/b6/Vilhelm_Hammersh%C3%B8i_A_Greek_Relief_in_the_Louvre.jpg",danish,"灰阶、空墙与侧光把古代浮雕变成安静的博物馆观看事件。"],
    ["mistress-hunt","danish","国王狩猎总管夫人 S. V. Holstein Rathlou","Mistress of the King's Hunt S. V. Holstein Rathlou","伊丽莎白·耶里肖—鲍曼","1879 年","https://glyptoteket.com/_next/image?url=https%3A%2F%2Fakqa-glyptoteket.euwest01.umbraco.io%2Fmedia%2Fh1shbm5a%2Fdscf3307.jpg&w=1920&q=90",danish,"服饰、坐姿和直接目光让贵族女性既承担家族身份，也保留个人存在。","特色看点","冷门但值得"]
  ].map(row);
  museum.editorialCapacity=30;
  museum.chapters=[...museum.chapters,{id:"sculpture",number:"06",title:"罗丹与卡尔波让石头失去安稳",intro:"扭转、未完成表面和过量动作把学院雕塑变成心理事件。"},{id:"danish",number:"07",title:"丹麦艺术不只是本地补充",intro:"人体课、室内和劳动者让这座馆回到自己的城市与收藏史。"}];
  museum.works=[...museum.works,...added];
  museum.intro=["新嘉士伯不该被压缩成“有几张高更和梵高的小馆”。30 件更合适，因为古代地中海、帕尔米拉、法国绘画、罗丹／卡尔波雕塑与丹麦艺术各自都能成立。","新增十件不继续堆印象派，而是补回被低估的雕塑与丹麦主线：从古代肖像的稳定走到罗丹身体的扭曲，再进入哈默斯霍伊几乎没有事件的室内。","古希腊与罗马展厅重排预计持续到 2026 年 10 月，部分绘画也会轮换；30 件是馆藏阅读库，不是当天全可见保证。"];
})();
