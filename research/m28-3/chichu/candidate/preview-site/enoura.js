// Enoura Observatory — 20 hand-authored site nodes, rendered by museum-app.js.
const enouraOfficial = "https://www.odawara-af.com/en/enoura/?site=pc";
const enouraPress = "https://www.odawara-af.com/admin/wp-content/uploads/2017/06/press-enoura-observatory-opens-to-public.pdf";
const enouraPhoto = name => `https://www.odawara-af.com/admin/wp-content/uploads/2026/04/${name}`;
const enouraImages = {
  aerial: enouraPhoto("DJI_0007-1200x800.jpg"), sun: enouraPhoto("DSC00052-802x1200.jpg"),
  tunnel: enouraPhoto("DSC00062-802x1200.jpg"), stage: enouraPhoto("DSC00063-802x1200.jpg"),
  glass: enouraPhoto("DSC00324-1200x800.jpg"), horizon: enouraPhoto("DSC00347-1200x800.jpg"),
  moon: enouraPhoto("DSC00174-1200x802.jpg"), garden: enouraPhoto("DSC09006-800x1200.jpg"),
  summerGallery: "./assets/enoura/summer-gallery.jpg",
  cantileverTip: "./assets/enoura/cantilever-tip.jpg",
  winterTunnel: "./assets/enoura/winter-tunnel.jpg",
  opticalStage: "./assets/enoura/optical-glass-stage.jpg",
  stoneStage: "./assets/enoura/stone-stage.jpg",
  uchoten: "./assets/enoura/uchoten.jpg",
  meigetsuGate: "./assets/enoura/meigetsu-gate.jpg",
  stoneTorii: "./assets/enoura/stone-torii.jpg"
};

const enouraImageMeta = {
  "whole-site": {key:"aerial", note:"馆方场地航拍：用于辨认建筑、橘园与相模湾的整体关系。"},
  "summer-gallery": {key:"summerGallery", note:"馆方对象照：夏至光遥拜一百米画廊。", source:enouraPress},
  "cantilever-tip": {key:"cantileverTip", note:"馆方对象照：一百米画廊伸向海面的悬挑端。", source:enouraPress},
  "oya-wall": {key:"tunnel", note:"馆方建筑环境图；当前图片不是大谷石墙与 37 块玻璃的完整对象照。"},
  "winter-tunnel": {key:"winterTunnel", note:"馆方对象照：冬至日光贯穿隧道。", source:enouraPress},
  "optical-stage": {key:"opticalStage", note:"馆方对象照：光学硝子舞台与日出。", source:enouraPress},
  "stone-stage": {key:"stoneStage", note:"馆方对象照：石舞台、巨石桥与海面轴线。", source:enouraPress},
  "equinox-axis": {key:"stoneStage", note:"馆方对象照：石舞台的巨石桥；春秋分日出轴线需在特定日期现场观察。", source:enouraPress},
  "uchoten": {key:"uchoten", note:"馆方对象照：雨听天茶室内部，远处可见石鸟居。", source:enouraPress},
  "tea-glass-step": {key:"glass", note:"馆方场地材料细节图；当前图片不是躙口前踏石的完整对象照。"},
  "meigetsu-gate": {key:"meigetsuGate", note:"馆方场地图：明月门位于画面中的庭园路径上。", source:enouraPress},
  "naraya-gate": {key:"garden", note:"馆方庭园环境图；当前图片不是旧奈良屋门的对象照。"},
  "stone-torii": {key:"stoneTorii", note:"馆方对象照：当代石鸟居与日出。", source:enouraPress},
  "garden": {key:"garden", note:"馆方庭园环境图：用于理解石构件在路径中的陈列方式。"},
  "sarcophagus-lid": {key:"garden", note:"馆方庭园环境图；当前图片不是古坟石棺盖的对象照。"},
  "gangoji-stone": {key:"garden", note:"馆方庭园环境图；当前图片不是元兴寺础石的对象照。"},
  "tree-of-life": {key:"garden", note:"馆方庭园环境图；当前图片不是威尼斯生命树浮雕的对象照。"},
  "thirteen-pagoda": {key:"garden", note:"馆方庭园环境图；当前图片不是十三重石塔的对象照。"},
  "fossil-cave": {key:"tunnel", note:"馆方建筑环境图；当前图片不是化石窟内部的对象照。"},
  "kasuga-shrine": {key:"garden", note:"馆方庭园环境图；当前图片不是柑橘山春日社的对象照。"}
};

const enouraWorks = [
  ["whole-site","cosmos","整座江之浦测候所","Enoura Observatory as a Whole","杉本博司 / 新素材研究所","2008—2017 年","aerial","绝对不可错过","特色看点","这里的主角不是一栋楼，而是太阳从相模湾升起后，如何依次击中廊道、隧道、舞台和茶室。先在高处认清海、山与三条轴线，后面的每一块石头才会从装饰变成刻度。","它把建筑变成测量时间的仪器，也把一次参观变成沿季节轴线行走的作品。","空中全景能确认场地、海岸与长廊关系，但不能替代人在地面感受高差。"],
  ["summer-gallery","cosmos","夏至光遥拜一百米画廊","Summer Solstice Light-Worship 100-Meter Gallery","杉本博司 / 新素材研究所","2017 年开放","tunnel","绝对不可错过","重要藏品","一百米长廊不是为了展示建筑师能把线拉多长。站到入口，让尽端的海面压成一条亮线：夏至清晨，日光正沿这条轴穿入室内，建筑才在一年中特定的几分钟完成。","大谷石实墙、无柱玻璃面与向海悬出的十二米，把重量、透明和失重感放在同一条直线上。","官方给出一百米长度、三十七块玻璃及十二米悬挑；具体结构体验属于现场观察。"],
  ["cantilever-tip","cosmos","画廊尽端的十二米悬挑","Twelve-Meter Cantilever","杉本博司 / 新素材研究所","2017 年开放","horizon","重点推荐","特色看点","走到玻璃长廊最末端，地面还在继续，墙却先结束了。那十二米并不是多出来的观景台：它故意把身体推出山坡，让你短暂失去建筑边界，只剩一条几乎像杉本《海景》的水平线。","摄影里被压平的海天分界，被翻译成身体能走进去的构图；这也是杉本从摄影跨到建筑最清楚的一刻。","十二米悬挑由馆方说明；与《海景》的关系是基于作者长期主题的编辑解释。"],
  ["oya-wall","cosmos","大谷石墙与三十七块玻璃","Oya-Stone Wall and 37 Glass Panes","新素材研究所","2017 年开放","tunnel","重点推荐","特色看点","同一条画廊，一边像岩层，一边几乎消失。不要只朝海拍照：把手边大谷石起皮般的表面，与对面三十七块看不见支撑的玻璃对读，你会发现“古老”与“现代”没有被分到两栋楼里。","杉本的建筑风格不是复古，而是让粗粝旧材料与高精度工程互相拆台，逼观众重新判断时间感。","材料、玻璃数量与无柱空间来自官方；石材触感需以现场为准。"],
  ["winter-tunnel","sun","冬至光遥拜隧道","Winter Solstice Light-Worship Tunnel","杉本博司 / 新素材研究所","2017 年开放","tunnel","绝对不可错过","重要藏品","这条七十米隧道平日看起来像把海框进黑盒；冬至清晨才显出真正用途：太阳从相模湾升起，光束穿完整条轴线，落到另一端的大石上。它不是象征太阳，而是让太阳亲自完成作品。","黑暗把多余景物全部删掉，方向、长度和日期共同构成作品；错过冬至仍能从洞口与尽端石组读懂这套装置。","七十米及冬至照明关系来自馆方；普通开放时无法保证出现同样光束。"],
  ["optical-stage","sun","光学硝子舞台","Optical Glass Stage","杉本博司 / 新素材研究所","2017 年开放","stage","绝对不可错过","重要藏品","远处像一片悬在海上的水面，走近才发现舞台由厚重光学玻璃构成。它最聪明的地方不是透明，而是边缘会收集阳光发亮；沉重材料因此看起来比支撑它的木架更轻。","舞台与冬至隧道并置，把传统悬造木构、工业光学玻璃和海平线叠成一个不稳定的时代组合。","馆方说明切割边缘会捕光；亮度随天气、时段而变。"],
  ["stone-stage","performance","石舞台","Stone Stage","杉本博司 / 新素材研究所","2017 年开放","stage","绝对不可错过","重要藏品","舞台尺寸来自能乐，材料却像从工地和城墙废墟里捡回来的。四角大石原本为江户城墙开采，却留在小田原；一条二十三吨巨石又被当作桥挂。演出尚未开始，材料已经讲了一场关于“未抵达”的戏。","石舞台把当地地质、被放弃的幕府工程与当代表演连在一起，价值不在某一块石头稀有，而在整组再编排。","石材来历和重量依据 2017 馆方说明；切凿年代采用其审慎判断。"],
  ["equinox-axis","performance","春分秋分的石桥轴线","Equinox Stone-Bridge Axis","杉本博司 / 新素材研究所","2017 年开放","sun","重点推荐","特色看点","站在二十三吨桥石的一端，别看脚下，越过舞台望向海。春分和秋分清晨，日出会沿桥轴升起；杉本设想能剧后场人物在天亮时退回冥界。天文学在这里不是知识点，而是舞台调度。","这条轴把能乐关于现世与彼岸的时间结构，交给真实黎明来完成。","对齐关系与艺术家设想来自馆方；一般参观时无法验证节气日出效果。"],
  ["uchoten","tea","雨听天茶室","Uchoten Teahouse","杉本博司 / 新素材研究所","2017 年开放","glass","绝对不可错过","特色看点","一座向千利休致敬的茶室，屋顶却来自橘园旧石仓上生锈的波纹铁皮。下雨时，铁皮把雨滴敲成声音，“雨听天”才名副其实。它不是复制古建筑，而是追问：如果利休活到今天，他会挑什么最不起眼的材料？","杉本以“本歌取”方式引用相传由利休设计的待庵尺寸，再用江之浦的废旧材料改写侘茶。","待庵归属与江之浦旧天正庵故事均有传说边界，正文按馆方措辞保留不确定性。"],
  ["tea-glass-step","tea","躙口前的光学玻璃踏石","Optical-Glass Step at the Crawl Door","杉本博司 / 新素材研究所","2017 年开放","glass","重点推荐","特色看点","茶室入口要求人低身爬入，门前却放了一块会发光的工业玻璃。春分和秋分破晓，光穿过躙口并点亮玻璃边缘；最谦卑的身体动作，撞上了最精确的光学材料。","这一小步把茶道的降低身体、节气方向与杉本反复使用的光学玻璃压缩在几十厘米里。","节气光照关系来自馆方；玻璃的视觉效果依赖天气。"],
  ["meigetsu-gate","gates","明月门","Meigetsu Gate","室町时代建筑构件；杉本博司主持复建","室町时代，2017 年前复建","garden","绝对不可错过","重要藏品","这扇门至少活过三次身份：镰仓明月院山门、六本木宅门、根津家与根津美术馆入口，最后来到江之浦。看门柱和斗拱时，别把“古”理解成从未移动；它的价值正来自反复拆解、迁移和修复。","门保留禅宗样式与大量原材，也是整座测候所把建筑史当可重组材料的宣言。","迁移链与原材比例采用馆方说明；各阶段改动程度仍需专项建筑史资料。"],
  ["naraya-gate","gates","旧奈良屋门","Old Naraya Gate","作者不详","约大正末至昭和初","garden","重点推荐","特色看点","穿过这扇不起眼的旅馆旧门，才到雨听天茶室。它曾属于箱根宫之下的奈良屋别墅；战后，近卫文麿与佐佐木惣一据说在那座别墅草拟新宪法早期文本。门把政治记忆留在日常尺度，而不是纪念碑尺度。","江之浦用一扇经历转手的旧门控制进入茶室的速度，也把箱根近代史接进场地。","年代与政治关联来自馆方 2017 说明；不是宪法文本本身的展品。"],
  ["stone-torii","gates","石鸟居","Stone Torii Gate","杉本博司 / 新素材研究所","当代仿作，2017 年前完成","garden","重点推荐","特色看点","它看起来像久经风雨的古鸟居，其实是根据山形县一座重要文化财式样重做的。楔痕被有意留下，脚下又垫着古坟时代石棺盖：你同时面对当代复制、古代实物与“做旧”的视觉暗示。","杉本不是追求考古纯度，而是把不同时间层并置，让观众主动识别真古、仿古与再利用。","原型与石棺盖年代依据馆方；鸟居本身不是古代原件。"],
  ["garden","stones","石庭与《作庭记》","Garden after the Sakuteiki","杉本博司 / 新素材研究所","二十一世纪","garden","重点推荐","特色看点","这座园子不靠修剪得像图案，而靠石头之间的来历互相说话。杉本参考平安时代《作庭记》，又用十多年搜集从古坟时代到现代的石构件；因此散步不是看“自然”，而是在踩一条材料年表。","传统规则提供摆放语法，跨时代旧物提供词汇，作者的选择则组成新的句子。","馆方确认参考《作庭记》及十余年搜石；具体摆放意义有编辑解释成分。"],
  ["sarcophagus-lid","stones","古坟石棺盖踏石","Kofun-Period Sarcophagus-Lid Step","奈良地区，作者不详","古坟时代，约 250—538 年","garden","重点推荐","重要藏品","你可能已经踩过它，才发现这块扁平石板曾是石棺盖。它被放在茶室中门前，死亡器物变成每天承受脚步的门槛；时间不是被玻璃罩保护，而是被新的动作继续使用。","单块石棺盖并非世界唯一；它的价值在有来源年代的古代构件与茶室礼法发生明确的新关系。","功能、来源和年代取自馆方清单；无法由现有资料确认更具体墓葬出处。"],
  ["gangoji-stone","stones","元兴寺础石","Foundation Stone from Gangoji Temple","作者不详","天平时代，729—749 年","garden","冷门但值得","重要藏品","一块础石最容易被当成普通园石，因为它原本就负责藏在柱子下面。知道它来自奈良元兴寺、并于 2005 年出土后，再看中央凹痕和承重面，你会发现“无名”恰是建筑构件真实的工作状态。","它把一座早期寺院的结构记忆带入当代园林，不靠完整复原，而靠一处可读的受力痕迹。","馆方给出来源、出土年份与天平时代范围；不据此推断原建筑的具体位置。"],
  ["tree-of-life","stones","威尼斯生命树大理石浮雕","Tree of Life Marble Relief","作者不详，威尼斯","十二至十三世纪","garden","冷门但值得","重要藏品","在一座强调日本建筑史的园子里，突然出现威尼斯商馆外墙的“生命树”。这不是跑题：枝叶式纹样在不同宗教和贸易网络里不断旅行，江之浦又让它从城市立面变成山海之间的一块异乡记忆。","跨文化旧构件打断了“纯日本传统”的想象，也让收藏者的选择暴露出来。","地点、年代和原用途来自馆方简表；缺少原建筑名称，不能补写确定传播路线。"],
  ["thirteen-pagoda","stones","十三重石塔","Thirteen-Story Stone Pagoda","内山永久寺旧物，作者不详","南北朝时代，1336—1392 年","garden","冷门但值得","重要藏品","十三层越往上越小，目光会被一节节提离地面；但它来自已经消失的内山永久寺。与其把它当造景竖线，不如把“仍站着的塔”与“不再存在的寺”同时放进视野。","江之浦保存的不是完整原境，而是被拆散历史中的幸存构件；这份缺口本身决定观看方式。","原属与年代依据馆方清单；迁离时间和完整流传链在现有来源中未说明。"],
  ["fossil-cave","bamboo","化石窟","Fossil Cave","小田原文化财团","2018 年开放","tunnel","重点推荐","特色看点","沿竹林下坡后，时间突然从人类建筑史拉到五亿年前。化石窟展示约五亿至两千万年前的化石；它不是为了补一间自然博物馆，而是把“测候”从太阳的一天、四季的一年继续推到地质尺度。","黑暗洞穴与远古生命让整座场地关于时间的主题获得下限，也提醒人类文明只是最后一小段。","年代范围与 2018 年开放信息来自馆方；具体展品会调整，不在此承诺逐件可见。"],
  ["kasuga-shrine","bamboo","柑橘山春日社","Kankitsuzan Kasuga Shrine","小田原文化财团 / 杉本博司","2022 年镇座","garden","重点推荐","特色看点","这不是在园林尽头添一座“日式建筑”。沿化石窟后的参道走过去，古石灯笼、竹林和新镇座的春日社把收藏、祭祀与当代表演重新接上；它仍在举行周年舞乐活动，所以不是停止使用的布景。","江之浦最激进之处，是不把传统只当可观看对象，而让仪式和身体继续进入其中。","馆方活动史可确认 2022 年镇座及后续周年演出；日常能否进入须服从现场开放安排。"]
];

museumData.enoura = {
  id:"enoura", editorialCapacity:20, city:"小田原 · 日本", zh:"江之浦测候所", en:"Enoura Observatory",
  ...museumRatings.enoura,
  verdict:"它不是靠镇馆名作取胜，而是把太阳、海岸、旧石与日本建筑史编成一次只能用身体读完的现场作品。",
  hero:enouraImages.aerial, contentFile:"./research/enoura-content-v1.md",
  intro:["江之浦最容易被误解成‘适合拍照的建筑’。真正值得看的，是杉本博司如何让一百米长廊对准夏至、七十米隧道对准冬至、石舞台桥道对准春分与秋分，再用迁移而来的门、塔、础石和茶室把天文时间接到人类历史。","因此本馆的 20 项不是 20 件被玻璃罩住的藏品，而是 20 个现场节点。每一项都要求你换位置、走一段路或等待光线；如果只拍海景，会错过这套作品真正的结构。"],
  official:enouraOfficial, visit:"https://www.odawara-af.com/en/enoura/ticket/",
  chapters:[
    {id:"cosmos",number:"01",title:"一栋建筑怎样测量太阳",intro:"先读懂夏至、冬至和海平线，整座场地才会从景观变成仪器。"},
    {id:"sun",number:"02",title:"光为什么要穿过黑暗",intro:"隧道、玻璃与舞台都不模拟太阳，而等待真实太阳介入。"},
    {id:"performance",number:"03",title:"一场能剧可以从日出开始吗",intro:"石材、节气轴线与表演时间共同完成舞台。"},
    {id:"tea",number:"04",title:"向利休致敬，为什么要用锈铁皮",intro:"传统在这里不是复制原样，而是用当下材料重写。"},
    {id:"gates",number:"05",title:"旧门搬家以后还是真的吗",intro:"迁移、修复、仿作与再利用，把“古”的含义拆开。"},
    {id:"stones",number:"06",title:"园林里的石头各自从哪里来",intro:"从古坟石棺到威尼斯浮雕，散步路线也是一条材料年表。"},
    {id:"bamboo",number:"07",title:"人的时间之外还有什么",intro:"竹林下的化石与仍在使用的神社，把尺度推向地质和仪式。"}
  ],
  works:enouraWorks.map((w,i)=>{
    const imageMeta = enouraImageMeta[w[0]];
    return {
      id:w[0],ch:w[1],zh:w[2],en:w[3],by:w[4],date:w[5],place:"江之浦测候所本址；户外区域受天气与维护影响",tag:w[7],significance:w[8],time:i<8?"8 分钟":"6 分钟",
      image:enouraImages[imageMeta.key],imageSource:imageMeta.source || enouraOfficial,imageCaption:imageMeta.note,source:enouraPress,look:w[9],story:w[10],again:w[11],preciousWhy:w[11],cardSummary:w[9]
    };
  })
};
