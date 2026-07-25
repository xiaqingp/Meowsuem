const muxinPaintingSource = "https://art.icity.ly/events/xuy9cdu";
const muxinLiteratureSource = "https://shilun.xafa.edu.cn/info/1036/9618.htm";
const muxinHallImage = "https://www.theartjournal.cn/wp-content/uploads/2015/11/1897776423.jpg";
const muxinHallSource = "https://www.theartjournal.cn/institutions/10399";
const muxinWork = (work) => ({
  by: "木心（孙璞，1927—2011）",
  place: "木心美术馆；原作轮换展出，出发前核验",
  time: "5 分钟",
  imageCaption: "木心美术馆相关展陈现场；原件轮换，本图不作为该单件作品的扫描件。",
  imageKind: work.image === muxinHallImage ? "installation" : "work",
  ...work
});

const muxinMuseum = {
  id: "muxin",
  editorialCapacity: 20,
  city: "乌镇 · 中国",
  zh: "木心美术馆",
  en: "Mu Xin Art Museum",
  ...museumRatings.muxin,
  verdict: "它不是一座靠世界名画排队打卡的馆，而是一座把一个人的画、文字、牢狱经验与故乡重新接在一起的完整档案。",
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Mu%20Xin%20Art%20Museum%20Wuzhen.jpg?width=1280",
  contentFile: "./research/muxin-content-v1.md",
  intro: [
    "木心同时画画、写诗、写散文，也留下数量庞大的手稿。木心美术馆最特别的地方，不是把这几种身份分成互不相干的房间，而是让你看见同一种眼睛怎样在墨色、句子和书写动作之间来回工作。",
    "馆方资料称木心身后留下六百余件绘画和数千份文学手稿；开馆陈列约一百件画、五十份手稿，并会轮换。这里最难替代的是约六十六纸的《狱中手稿》：它不是普通作家修改稿，而是在失去正常材料与空间时，文字、书法和图像被迫长到同一张纸上的完整创作群。",
    "2026 年 1 月馆方曾发布空间升级改造的临时闭馆通知，后续阶段另行公告。下面的 20 件是理解馆藏的导航，不是当天在展保证；出发前必须核验馆方最新开放与轮换信息。"
  ],
  official: "http://www.muxinam.com/",
  visit: "https://www.ewuzhen.com/ticket/detail?goodsCode=PK-202002-0949&goodsId=214433676845494273",
  chapters: [
    {id:"ink",number:"01",title:"故乡先被画成记忆",intro:"七十年代的水乡、人物与云气，不是写生地点说明，而是木心开始把中国笔墨拆开重组的现场。"},
    {id:"newyork",number:"02",title:"到了纽约，作品变小，也开始面向未来",intro:"石版画与微型风景让传统山水脱离固定技法；封面设计则显示木心也在安排作品将来怎样被观看。"},
    {id:"prison",number:"03",title:"纸被夺走以后，创作怎样继续",intro:"《狱中手稿》把极端处境、密写文字和图像变成一组不能拆开的作品。"},
    {id:"literature",number:"04",title:"句子不是画的说明书",intro:"散文、诗与小说手稿让删改、停顿和布局都变成可见的写作过程。"},
    {id:"archive",number:"05",title:"一个人怎样为自己留下档案",intro:"讲稿、书信、封面设计与未完成稿，把创作之外的选择和关系也保留下来。"}
  ],
  works: [
    muxinWork({id:"fishing-village",ch:"ink",zh:"渔村",en:"Fishing Village",date:"1970 年代",tag:"绝对不可错过",time:"7 分钟",imageKind:"work",image:"https://img.artcm.cn/5659358afa59313651810a10.jpg",imageSource:"https://www.artcm.cn/customer/exhibition_detail/?exhibition_id=67",source:muxinHallSource,cardSummary:"水乡没有被画成旅游风景，而像一段正从记忆里浮出又退回去的黑白天气。",imageCaption:"《渔村》作品图；木心美术馆开馆展页面。"}),
    muxinWork({id:"untitled-portrait",ch:"ink",zh:"题未定（人物）",en:"Untitled (Figure)",date:"1970 年代",tag:"强烈推荐",imageKind:"work",image:"https://www.theartjournal.cn/wp-content/uploads/2015/11/%E9%A2%98%E6%9C%AA%E5%AE%9A%EF%BC%8C%E7%BA%B8%E6%9C%AC%E5%BD%A9%E5%A2%A8%EF%BC%8C-31.4X40.5cm-70%E5%B9%B4%E4%BB%A3.jpg",imageSource:muxinHallSource,source:muxinHallSource,cardSummary:"一张脸被墨色推到将要消失的边缘，人物像记忆而不像肖像身份证。",imageCaption:"《题未定》人物画，纸本彩墨，31.4×40.5 厘米，1970 年代。"}),
    muxinWork({id:"pudong-moonlight",ch:"ink",zh:"浦东月色",en:"Moonlight over Pudong",date:"1977—1979",tag:"绝对不可错过",time:"7 分钟",image:"https://pic.yupoo.com/fotomag/27ec2f49/7618b3dd.jpg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"今天的浦东被倒拨成低矮、潮湿而几乎无人的夜景，月色比地标更重要。",imageCaption:"《浦东月色》作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"auspicious-clouds",ch:"ink",zh:"纠缦卿云",en:"Entangled Auspicious Clouds",date:"1977—1979",tag:"强烈推荐",image:"https://pic.yupoo.com/fotomag/34bd59ac/c2a98ab0.jpeg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"云不是天空装饰，而是一团互相缠绕、几乎要压住画面的物质。",imageCaption:"《纠缦卿云》作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"dancer",ch:"ink",zh:"舞蹈者",en:"Dancer",date:"1981",tag:"强烈推荐",image:"https://pic.yupoo.com/fotomag/ff2072c9/3d7ab1c7.jpg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"木心没有交代舞台，只把身体压成一枚会旋转的墨迹。",imageCaption:"《舞蹈者》作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"untitled-lithograph",ch:"newyork",zh:"题未定（石版画）",en:"Untitled (Lithograph)",date:"1985—1990",tag:"强烈推荐",image:"https://pic.yupoo.com/fotomag/7835b640/f8a779f3.jpeg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"换成石版以后，山水仍像山水，却开始带上印刷压力留下的冷硬表面。",imageCaption:"《题未定》石版画作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"clear-breeze",ch:"newyork",zh:"晴风",en:"Clear Breeze",date:"1999",tag:"绝对不可错过",time:"7 分钟",image:"https://pic.yupoo.com/fotomag/47cf8733/6ad17751.jpeg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"画幅很窄，山和树却像被风慢慢吹出；留白真正承担了天气。",imageCaption:"《晴风》作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"morning-glow",ch:"newyork",zh:"朝霞",en:"Morning Glow",date:"2000",tag:"强烈推荐",image:"https://pic.yupoo.com/fotomag/0e3a3b7a/2cf8a0de.jpg",imageSource:muxinPaintingSource,source:muxinPaintingSource,cardSummary:"别急着寻找红色朝霞；光被处理成灰层之间缓慢发生的变化。",imageCaption:"《朝霞》作品图；苏州博物馆与木心美术馆合作回顾展页面。"}),
    muxinWork({id:"waste-valley",ch:"newyork",zh:"废谷",en:"Waste Valley",date:"2004",tag:"强烈推荐",image:"https://www.theartjournal.cn/wp-content/uploads/2015/11/%E3%80%8A%E5%BA%9F%E8%B0%B7%E3%80%8B%E7%BA%B8%E6%9C%AC%E5%BD%A9%E5%A2%A815.7%C3%9742.9cm2004.jpg",imageSource:muxinHallSource,source:muxinHallSource,cardSummary:"晚年的山谷只剩横向压力和暗处，风景被压缩成一条近乎抽象的心理地带。",imageCaption:"《废谷》，纸本彩墨，15.7×42.9 厘米，2004 年。"}),
    muxinWork({id:"future-catalogue",ch:"newyork",zh:"为自己未来画册设计的封面",en:"Design for the Cover of His Future Catalogue",date:"年代不详",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinHallSource,cardSummary:"画家开始替未来观众安排第一眼：这既是设计，也是对自己作品如何流传的预演。"}),
    muxinWork({id:"prison-notes",ch:"prison",zh:"狱中手稿（六十六纸）",en:"Prison Notes (Sixty-six Sheets)",date:"1972",tag:"绝对不可错过",time:"12 分钟",image:muxinHallImage,imageSource:muxinHallSource,source:"https://yalebooks.co.uk/book/9780300090758/the-art-of-mu-xin/",cardSummary:"在极薄纸张上密写约六十五万字；它既是生存记录，也是文字、书法与图像合成的一组作品。"}),
    muxinWork({id:"colombia-draft",ch:"literature",zh:"《哥伦比亚的倒影》初稿",en:"Draft of Reflections of Colombia",date:"1986",tag:"强烈推荐",time:"7 分钟",image:muxinHallImage,imageSource:muxinHallSource,source:muxinPaintingSource,cardSummary:"出版后的名篇在这里退回写作现场：句子并非天生漂亮，而是删改、挪动和重写出来。"}),
    muxinWork({id:"book-of-songs",ch:"literature",zh:"《诗经演》手稿",en:"Manuscript of Recasting the Book of Songs",date:"年代待馆方标签核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"重点不是替《诗经》做白话翻译，而是看现代作者如何与古老语气保持距离又继续对话。"}),
    muxinWork({id:"scattered-desires",ch:"literature",zh:"《我纷纷的情欲》手稿",en:"Manuscript of My Scattered Desires",date:"年代待馆方标签核验",tag:"强烈推荐",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"题目里的“纷纷”在手稿上变成节奏：短行、停顿与空白共同控制情绪的密度。"}),
    muxinWork({id:"balong",ch:"literature",zh:"《巴珑》手稿",en:"Manuscript of Balong",date:"年代待馆方标签核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"小说人物不是从一句设定长出来的；手稿保存了叙述声音怎样试错和定形。"}),
    muxinWork({id:"false-solomon",ch:"literature",zh:"《伪所罗门书》手稿",en:"Manuscript of The False Book of Solomon",date:"年代待馆方标签核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"一个“伪”字先拆掉权威，再让格言、寓言和自我怀疑在同一页互相顶撞。"}),
    muxinWork({id:"world-literature",ch:"archive",zh:"世界文学史讲稿",en:"World Literature Lecture Notes",date:"1989—1994 年课程时期",tag:"绝对不可错过",time:"8 分钟",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"别把它误认成《文学回忆录》的排版原稿；这是木心备课、取舍与组织文学史的工作底稿。"}),
    muxinWork({id:"air-raid-shelter",ch:"archive",zh:"《三号防空洞》未完成稿",en:"Unfinished Manuscript of Air-Raid Shelter No. 3",date:"年代待馆方标签核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"未完成不是缺点：停在纸上的分岔，反而让我们看见一部作品可能怎样继续、又为何停止。"}),
    muxinWork({id:"letter-chen-juyuan",ch:"archive",zh:"致陈巨源手书",en:"Letter to Chen Juyuan",date:"年代待馆方标签核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinPaintingSource,cardSummary:"私人书信把“作家木心”拉回具体关系：字形、称呼与纸面距离都比出版文字更接近日常。"}),
    muxinWork({id:"early-scores",ch:"archive",zh:"早年曲谱与话剧稿",en:"Early Music and Drama Manuscripts",date:"早年；具体年代待核验",tag:"值得停留",image:muxinHallImage,imageSource:muxinHallSource,source:muxinLiteratureSource,cardSummary:"在成为被阅读的作家以前，音乐与舞台已训练他安排节奏、声音和人物出场。"})
  ],
  routes: {
    "90": {title:"90 分钟 · 先抓住木心的两种材料",note:"开放和轮换正常时，先看绘画转变，再把最多时间留给《狱中手稿》与文学馆。",workIds:["fishing-village","pudong-moonlight","dancer","clear-breeze","prison-notes","colombia-draft","world-literature"]},
    half: {title:"半天 · 从水乡走到纽约再回到纸上",note:"保留 90 分钟路线，再补足石版画、晚年风景和几份能看见写作过程的手稿。",workIds:["fishing-village","pudong-moonlight","dancer","untitled-lithograph","clear-breeze","morning-glow","waste-valley","prison-notes","colombia-draft","scattered-desires","world-literature","future-catalogue"]},
    all: {title:"完整路线 · 20 件逐一看",note:"只适合展厅开放、体力充足且愿意读手稿的人；作品轮换时按现场标签替换，不要为集齐清单折返。",workIds:["fishing-village","untitled-portrait","pudong-moonlight","auspicious-clouds","dancer","untitled-lithograph","clear-breeze","morning-glow","waste-valley","future-catalogue","prison-notes","colombia-draft","book-of-songs","scattered-desires","balong","false-solomon","world-literature","air-raid-shelter","letter-chen-juyuan","early-scores"]}
  }
};
