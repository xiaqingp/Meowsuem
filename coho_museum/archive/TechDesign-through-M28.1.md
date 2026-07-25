# Meowseum 内容网站技术设计

> Approval: Production release approved and completed 2026-07-20

## Overview

使用一个真实世界地图入口和一个馆页渲染器，让当前 15 家博物馆或艺术场所共用博物馆首页、三档参观攻略、章节、按馆声明的 20/30/40/60 项内容卡片、详情与来源展示。馆名、场址边界、容量与正式正文文件由 PRD 和 manifest 统一列出，不在技术架构中维护另一份不完整名单。

真实地图已采用 Leaflet 与 OpenStreetMap。第一版仍不实现账号、云端数据、自动定位或打卡；当前在同一正式结构中维护十五馆 500 项，卢浮宫、大都会与大英为 60 件多次参观内容库，维也纳艺术史博物馆与埃及博物馆为 40 件，阿尔罕布拉、新嘉士伯、丹麦国立美术馆与 Getty Center 各 30 项，西雅图艺术博物馆、Frye Art Museum、木心美术馆、江之浦测候所、Anchorage Museum 与地中美术馆各 20 项。江之浦、地中与阿尔罕布拉的单位可包含可现场辨认的建筑、花园或路线节点，不伪装成传统馆藏；Getty 条目只覆盖 Getty Center，不并入 Getty Villa；地中条目只覆盖地中美术馆，不并入直岛其他场馆；埃及条目只覆盖解放广场主馆，不并入 GEM 或 NMEC；阿尔罕布拉条目只覆盖 Alhambra–Generalife 官方纪念建筑群，不并入 Albaicín 或格拉纳达其他遗址；丹麦国立美术馆只覆盖 Sølvgade 主馆，不并入 SMK Thy 等场址；Frye 只计算 704 Terry Avenue 本馆稳定馆藏，不把临展外借作品计入评分。

## Architecture

```text
index.html：正式世界地图与馆入口
museum.html：十五馆唯一馆页渲染器
ratings.js：评分唯一数据源
museums.js + 各馆数据模块：十五馆同构的元数据、章节、作品或现场节点、图像与来源
routes.js：十五馆三档攻略与卡片摘要规范化
research/meowseum-content-instruction.md：唯一内容生成母指令
research/generation-pipeline.md：唯一生成执行流程与状态机
research/content-standard-manifest.json：母指令版本与逐馆审核状态
research/*-content-*.md：各馆与声明容量一致的作品正文及实时提醒
```

## Data Model

每家博物馆至少包含：

- `id`、中英文名、城市、评分、评分档位、旅行行动、档内理由、支撑档位的珍品标识、核心判断、取舍提示、主图；
- 章节编号、标题、导语与所含作品；
- `routes.90`、`routes.half`、`routes.all`：标题、边界说明和按现场顺序排列的作品 ID；跨馆址路线必须明确说明，当前不可见作品不得混入当日路线；
- `editorialCapacity` 声明 20/30/40/60 容量；作品数必须一致。60 件馆的单日 `all` 路线最多 30 件。作品包含中英文名、作者或文化、年代、地点/可见状态、重要性级别、分层角色与正文标题匹配键；稀世珍品与重要藏品必须有仅供研究和校验的 `preciousWhy`；
- 每件作品的准确主图、图片来源页和作品资料页；
- 一份 Markdown 正文，按博物馆介绍、参观路线、声明容量的作品、参观提醒、主要资料组织。

## Rendering

- 首页使用 Leaflet 1.9.4 和 OpenStreetMap 标准瓦片渲染真实世界地图，保留可见署名；巴黎、西雅图、纽约和哥本哈根使用真实坐标，标记弹层只提供馆名、城市、分数与馆页入口，不设置地图右侧预览。
- 地图下方固定展示 90–100、80–89、70–79、60–69 与 60 以下五档评分规则，再按分数从高到低渲染简洁博物馆排名；排名不重复馆级推荐理由。
- “打开博物馆”进入当前选择的博物馆，不再写死卢浮宫。
- 通用解析器从对应 Markdown 读取馆介、各作品正文与末尾提醒。
- 页面只显示访客需要的正式内容；版本、测试目标、制作说明不进入渲染结果。
- 卡片与详情使用同一件作品的同一身份图像；详情图完整显示，不裁切主体。
- 卡片同时渲染 `tag`（参观优先级）与 `significance`（作品重要性），并显示与详情一致的作者或文化、年代信息；作品状态不再被误认为重要性。
- 地图使用 `index.html`；十五馆统一使用 `museum.html?id=<museum>`；章节在馆级 URL 后附加稳定 `#<chapter>`；作品统一使用 `museum.html?id=<museum>&work=<work>`。旧卢浮宫 `index.html?museum=louvre...` 地址只负责一次兼容跳转。
- 唯一渲染器固定卡片信息顺序：图片、编号、重要性/注意力标签、中英文名、作者或文化/年代、一句话导览、停留时间/阅读入口；一句话导览统一使用克制的 14px 次级文本。详情图片说明统一为作品名、图片来源与许可、馆方作品资料，并使用正文下方 12px 次级文本。
- 三档攻略由同一 `routes` 配置和同一组件渲染；路线是编辑选择，不是自动馆内寻路。完整浏览可以跨馆址，但必须显式提示额外交通或分次参观。
- 品牌文本统一为 `Meowseum`；不增加路由框架或构建依赖。

## Content and Source Rules

- `research/meowseum-content-instruction.md` 是新增、重写和审核馆级/作品级内容的唯一规范来源；历史研究笔记、页面数据与校验脚本不得形成平行标准。
- `research/content-standard-manifest.json` 记录当前母指令版本及逐馆审核状态；只有自动检查、事实审计和人工声音评分全部通过，场馆才可标为 `compliant`。
- 馆方网页、馆藏数据库和开放接口优先；必要时使用 Wikimedia Commons 的明确作品文件页。
- 作品名称、作者/文化、年代、馆藏身份和图像必须能相互核对。
- “馆藏核心”与“当天可见”分开；无法确认在展的作品不得承诺现场可见。
- 易变运营信息显示核验日期并链接馆方实时页面。
- 中文讲解保留完整因果链，并以可执行的观看动作收束。
- 评分校验先执行档位门槛：无稀世珍品或不可替代整体不得达到 80 分；未声明值得专程旅行不得达到 90 分。体验相关信息只用于档内微调。
- 博物馆用于支撑档位的珍品标识必须能反查到具体作品；标为稀世珍品或重要藏品的作品必须保存研究依据，但页面通过正文自然表达，不显示独立证明模块。
- `research/significance-evidence-v1.6.0.json` 保存本次迁移前全部稀世标签的逐件审核状态。每馆修复时将 `pending` 改为 `retain` 或 `downgrade`；保留必须填写比较类别、最近比较对象、决定性差异、不可替代性、证据边界和来源，降级必须写明理由并同步作品标签与 `rareAssets`。
- `ratings.js` 是十五馆评分的唯一数据源；首页地图与唯一馆页渲染器都从这里读取，不再分别手写分数。
- 每次评分规则变化都必须更新 `calibratedAgainst` 与 `calibratedAt`；校准集合必须包含当前发布的全部博物馆。

## Verification

- 静态检查：每馆为 20/30/40/60 且与 `editorialCapacity` 一致；每件有正文、主图、图片来源、资料来源；标题与 ID 无重复。
- 评分检查：分数位于声明档位内，80/90 分硬门槛成立，珍品引用存在，重要作品含 `preciousWhy`；稀世珍品完成比较核验后，还要验证最近比较对象与证据边界。
- 重要性检查：逐馆运行 `node scripts/verify-significance-evidence.mjs --museum=<id>`；发布候选门运行全库检查。存在 `pending`、没有审核记录、降级后仍被珍品引用，或保留记录缺少五项证据时失败。
- 网络检查：所有主图可加载且返回图片 MIME 类型。
- 浏览器检查：十五处地图入口、十五馆切换、章节跳转、卡片详情、长图完整显示、移动宽度基本可用。
- 内容检查：用户页面不得出现“测试稿”“UI 原型”“这版内容刻意改了什么”等制作语言。

## Production State

- 用户于 2026-07-20 明确批准发布；唯一前端实现已从 `prototype/` 迁到仓库根目录，正式入口为 `/`。
- 仓库不保留第二套 prototype renderer；首页、馆页、评分和内容数据只维护根目录这一套实现。
- 稳定本地启动入口为 `scripts/serve.ps1`，默认监听 `0.0.0.0:8094`。
- 发布门禁依次运行结构、内容和资源清单检查；外部站点的 403/429 记为自动访问受限并交由真实浏览器复核，404、错误对象和非图片响应才是发布失败。

## Content Authorship Boundary

- 所有内容任务先读取 `research/README.md`；写作标准与执行流程分别只认内容母指令和 `research/generation-pipeline.md`。对话与自动化 prompt 不得补充隐含规则。
- `scripts/run-isolated-generation.ps1` 是内容生成的唯一模型入口：它在模型外校验 run header 与允许输入哈希，把锁定原文各装载一次后通过 stdin 交给模型，并在退出后检查声明输出、生成 `<stage>-result.json` 记录输入与作者包输出哈希。它不生成、改写或拼装正文；哈希不进入游客正文。
- `research/*-content-*.md` 保存已经独立写完的正式正文；研究字段和前端摘要不能在构建时拼成快层、深层或结尾。
- `scripts/verify-content-pipeline.mjs` 是结构与发布共用的硬门。当前没有脚本获准自行生成内容 Markdown；隔离 runner 只负责启动模型和机械校验，历史 build 脚本全部只会报错退出。
- M22 单件写作合同同时交付独立的 `cardSummary` 与 `detailMarkdown`；`verify-m22-pipeline.mjs` 检查交付声明，单件生成样本门检查卡片长度、命令式开头与快层复用。现有旧馆按 M21 逐馆迁移，所有未来新增馆默认进入卡片/详情分离硬门。
- v1.6.1 的单件写作任务还必须在正文前保存核心问题等叙事计划；v1.6.2 增加 `claimBoundaryPlan`；v1.6.3 检查篇内否定—转折骨架。v1.6.4 把 `logicSequence` 改成 `discovery / changesUnderstanding / thereforeNext` 对象，增加 `quickLayerPlan` 和逐段 `narrativeReview`。v1.6.5 又要求 review 逐句完成 `highRiskClaimReview`，并使 `unplannedHighRiskClaims` 为空。v1.6.6 改为置信度分层：资料包可以补充学术来源，高风险判断在证据强度与断言强度相配时允许保留。v1.6.7 再增加 `historicalContextPlan` 与中文母语审读；v1.6.8 把研究缺口、图片许可、发布待办、测试和生成流程排除出访客正文，并由自动门和独立 reviewer 双重检查。以上 reviewer 规则是历史演进记录。
- 当前 v1.8.1 / Pipeline 2.2.1 默认停用 reviewer。作者必须在同一个 author bundle 内完成计划、独立卡片简介与正文；runner 锁定输入输出哈希。机械层把结果分为提示、确定性程序修复与 blocker：小型风格问题不阻塞，格式与派生字段不调用模型，只有影响证据追溯、产物完整性或页面基本可用性且无法安全修复的问题才阻塞。流程不设置特殊观察状态。
- 严格内容门对同馆跨作品的完整长句和段落做重复检查；相同作者或主题不构成复制正文的豁免。
- `museum-app.js` 只渲染完整 Markdown。正文尚未载入或载入失败时显示明确错误，不再用卡片摘要构造伪正文。
- manifest 中出现 `pending_full_audit`、待重写 content gate 或失败的声音门时，release candidate 必须失败。

## Risks

- 馆方展陈状态随时变化：通过“最后核验日期 + 官网链接 + 不承诺在展”处理。
- 外链图像可能失效：保存来源清单并提供自动检测脚本；后续可迁移为受许可的本地缓存。
- 西雅图产品范围只包含 downtown Seattle Art Museum 主馆；Seattle Asian Art Museum 与 Olympic Sculpture Park 不进入本轮作品、章节或路线数据。作品地点字段必须明确为 downtown 主馆或诚实标注轮换/需现场核对。
# 2026-07-22 — M26 每日整馆重生边界

- 每日自动任务从局部修复器改为整馆再生成器；任务选择依据是 manifest 中当前 regeneration batch 的馆级状态，不再读取旧 M21 / M24 pending 作为跳过或选择条件。
- 研究可以每批最多十件准备，但正式正文保持单件独立生成；构建脚本只搬运已审阅正文。
- 已发布旧稿是事实覆盖检查材料，不是润色底稿。馆级交付必须原子化：任何作品、卡片、评分、图片或页面门失败，该馆继续保持 pending。
- 队列包含当前全部十五馆；后续新增馆不自动插入已经开始的批次，必须显式更新 manifest 和自动任务。
