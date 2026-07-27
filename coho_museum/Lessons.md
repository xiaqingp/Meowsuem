# Active lessons

完整的 45 条历史记录保存在 `coho_museum/archive/Lessons-through-M28.1-full.md`。这里只保留仍会影响未来执行的防错规则；新问题只有形成新的长期规则时才加入。

## 1. 生成默认聊天隔离

- 作品和博物馆生成不能读取聊天、memory、旧正文或临时整理的对象知识。
- 对话反馈必须先进入 canonical 内容指令或 pipeline；禁止 pipeline 外 ad hoc 内容 prompt。

## 2. 先有证据，再写正文

- 研究卡先记录事实、观察、比较、论点边界和来源；写作计划用 `claimLedger` 对应。
- 作者只负责选择、排序和通俗解释，不得补写研究卡没有授权的事实或视觉判断。

## 3. 批量研究不等于批量写作

- 一个研究上下文最多准备 10 件。
- 每件作品仍有独立 author bundle；上一件正文不能成为下一件输入。

## 4. 旧正文只作事后诊断

- 旧稿不能进入作者上下文。
- 新稿封存后，只有明确的回归诊断才可与旧稿比较事实遗漏和质量差异。

## 5. 脚本不写正文

- 构建和迁移脚本只能搬运已写好的正文。
- 轮换句式、模板段落、运行时拼装或程序补写正文一律禁止。

## 6. 哈希证明文件身份，不证明思考顺序

- runner 记录输入输出哈希，用于发现篡改和锁定实际产物。
- 不把模型内部先计划后写作伪装成可由哈希证明的事实。

## 7. 机械层保持克制

- 小型长度、语气、节奏和重复风险只提示。
- 空白、编码、确定性 slug、编号、派生字段与哈希由程序修复。
- 只有影响证据追溯、产物完整性或页面基本可用性且程序不能安全修复的问题才阻塞。
- reviewer 和 owner 反馈不是默认生成状态。

## 8. 实质性歧义先确认

- 如果不同解释会改变范围、成本、旧成果使用或交付形态，执行前必须问清。
- 新要求默认叠加到未被明确取消的规则，不能自行选择更彻底、更昂贵的解释。

## 9. 评分必须全馆校准

- 先定 90/80/70/60 档，再定档内分数。
- 修改任一馆评分时，把全部已发布馆放回同一集合；建筑、体验、名家和馆藏数量不能重复或越档加分。

## 10. 图片正确性高于“有图”

- 图片必须对应当前作品或明确标注为环境图。
- 远程 403/429 不自动等于资源损坏；本地发布仍要验证实际图片字节和页面加载。

## 11. 页面只用统一渲染器

- 所有馆复用 `museum-app.js`、统一卡片、路线和作品深链。
- 修复应落在共享根因，不建立馆专用渲染器或重复字段合同。

## 12. 测试按影响范围执行

- 规则更新必须在同一任务完成最小充分回归。
- 管理文件变化不暴力重跑整馆；内容、图片、URL 或渲染变化必须验证受影响的真实页面。

## 13. 当前状态只写一次

- 当前版本、release、reviewer、执行档和 milestone 只写入 manifest。
- 活跃 Coho 文件只保存当前规则；完整历史进入 archive，默认任务不读取。
- release 用脚本生成，校验器动态读取 manifest；禁止在 README、脚本和 fixture 复制当前版本。

## 14. 元数据与正文必须分层

- 作者仍需完整交付作品元数据，但元数据进入 `writing-plan.json.displayMetadata` 和统一页面数据。
- `draft.md` 的作品标题后直接进入“30 秒先懂”；集成不得把元数据复制成正文首段。
- 机械层只可删除完全匹配已知字段的旧式开头元数据；无法无歧义处理的结构必须阻塞。

## 15. 通俗解释依赖理解顺序

- 作品分类、固定入口和一句复述都不能单独保证通俗。
- 每篇先找一个能解释至少三个重要细节的最小解释模型，再按零背景读者所需的前置知识排序。
- 先讲具体人物、动作、形状、材料和结果，再用专业术语命名；幽默与趣闻不能代替解释。

## 16. 研究卡不能预写文章

- 研究卡只保存事实、局部因果、观察、比较、来源和不确定性。
- `primaryValue`、核心问题、整篇因果链、开场和结尾属于作者阶段；提前写进研究卡会让新版 pipeline 继续复制旧叙事。
- 复用旧资料时可以机械移除写作方案，但不得改动事实或根据聊天补充对象答案。

## 17. 快层只承担一个认识

- 快层不同时承担核心判断、历史背景、重要性证明、观看任务和事实边界。
- 可见证据自然融入解释；`visualAnchor` 不是必须发布的导览句。
- 写作计划只保留会改变正文的决策，删除重复自证表格和字数下限，避免作者为了交栏目而灌水。

## 18. 主线先选最高层级价值

- “能够串起多个视觉细节”只证明一条解释成立，不证明它就是作品最重要的解释。
- 有来源支持的国家、制度、信仰、社会或艺术史转折，优先于构图机制、材料技巧和趣闻。
- 争议负责限制断言强度，不能把公认的首要价值挤到深层；形式机制应回答这项意义怎样在作品中被表达。
- 如果研究卡只收集了图像机制，却没有记录作品为何进入主流历史叙述，作者无法靠措辞补救；应回到研究阶段补齐“事件、图像表达、现存证据”三者的准确边界。
- 价值类型用于选择研究问题和主次，不得变成不同媒介的正文模板；一件作品只选一个首要类型，其他价值服务主线。
- 单一价值缺口使用隔离的 `research_gap` 补证据，不为一个缺口重新生成整张研究卡。

## 19. 深入层只保留理解增量

- 研究卡完整不等于正文必须覆盖；只增加资料、不改变核心答案的段落删除。
- 稀世珍品要证明价值与不可替代性，不要求把历史、形式、原境、比较、趣闻和对象经历逐栏展开。
- 同一事实只出现一次；主体、细节、最后一眼和事实边界不能换标题重复。
- 快层首句先给最大价值结论，背景和限定随后服务结论，不能用严谨拖延结论。

## 20. 馆级评分必须在写作前通过机械门

- 档内文字规则不等于程序会遵守；研究完成后先生成逐项馆级证据表，再定档和定分。
- 0 件稀世珍品、珍品清单不一致、父子项重复计数、90 档缺少独立珍品线或档内锚点错误必须直接阻塞，不能等馆稿写完才发现。

## 21. 共享前端改动必须处理缓存并真实刷新

- 同时删除 HTML 节点与 JavaScript 绑定时必须更新共享脚本缓存版本；否则旧缓存脚本会访问不存在的节点并中断整页渲染。
- 静态字符串检查只能作快速门；交付前必须在真实浏览器刷新，检查首屏、主要内容与控制台。

## 22. Pipeline 不能因局部修复擅自扩张

- Owner 授权修改某条内容规则，不等于授权改变模型输入架构、文件数量或成本。
- 木心占位图规则修复时，错误地把整馆计划、选择记录和审计记录加入每件作者输入，造成相同材料重复20次。
- 作者阶段现在由 runner 执行角色白名单、数量和总字节门；审计记录留在机械层，不进入模型。
- 任何 canonical pipeline 变更必须先有 owner 原话、基础 release、目标版本、允许文件和必跑测试组成的 change record；没有记录不得修改或冻结。同一版本首次冻结后不可覆盖，后续变化必须新授权并升版本。

## 23. 新馆内联重要性不能被旧映射门误判

- Issue：木心候选已经逐件携带 `significance`，但正式发布门仍只查询旧的集中映射，导致预览通过而正式门报缺失。
- Cause：共享前端把集中映射当成唯一来源，没有兼容当前生成馆已经内联的显式字段。
- Fix：保留旧映射对旧馆的覆盖；映射不存在时接受作品自身的显式 `significance` 与 `preciousWhy`。
- Prevention：整馆候选发布前必须在正式根目录运行全量 release gate，不能用预览页面检查代替。
- Affected docs：`museums.js`、`scripts/verify-release-candidate.mjs`、M28.4。

## 24. 启动参数等待和预填时间会制造假耗时

- Issue：维也纳生成首次启动遗漏 `ProjectRoot` 后进入 PowerShell 参数等待；同时预填 `run-header.startedAt` 让统计显示为 51.3 分钟。
- Cause：底层脚本把可推导的项目根目录设为交互式必填项，耗时统计又引用了执行前手写的时间。
- Fix：统一入口只接收 run 目录，自动推导项目根；标准命令强制 `-NonInteractive`。Runner 自己记录真实起止时间并从 CLI 日志提取 token。
- Prevention：每馆完成时运行整馆报告器；真实模型结果缺少时间或 token 时直接阻断，不允许估算或事后回填。

## 25. 单馆发布不能重复承担全站易变检查

- Issue：发布维也纳时，旧门会联网检查全站约500件，并被其他馆的待迁移状态和珍贵度待审计直接阻断。
- Cause：确定性的全站结构检查与易变的图片、来源、馆状态检查共用同一作用域。
- Fix：本地结构继续全站检查；联网资源、珍贵度和可发布状态只检查当前馆。候选补图改为有界并发，文件搬运与缓存更新交给标准发布器。
- Prevention：每次发布必须显式传入 museumId 和 candidate；不允许用无作用域的 `--live` 作为单馆发布门。

## 26. 图片必须成为研究与发布共用的上游证据

- Issue：普通 HTTP 把 SAM 的 403 当成图片不可用，研究中的画面观察和网页装配又各自找图，导致正确图片无法稳定复现。
- Cause：图片只被当成发布资源，没有在作品身份锁定后形成可验证的证据产物；文件门也一度错误地从项目根而非候选根检查新图片。
- Fix：Pipeline 2.8.0 先生成 `verified-image-evidence.json`，真实浏览器核对官方对象页身份、下载图片并保存尺寸与哈希；研究和组装只消费这份证据。只有多候选冲突时才调用隔离的 Luna medium。
- Prevention：未来每件直接视觉观察必须引用图片证据 ID；组装不得重新搜索图片，也不得读取旧图片映射。候选发布门必须从候选目录验证本地资源，真实浏览器仍逐张确认解码。

## 2026-07-26 - 页面图片不能等同于作品图片

- Issue：地中美术馆《Time/Timeless/No Time》等页面曾把 Google Arts & Culture 的网页界面一起截进作品图。
- Cause：页面候选是动态 `blob:` 图片时，旧逻辑截取 `<img>` 外框；该外框大于可见作品容器，导航和控件随之进入截图。
- Fix：页面元素捕获统一调用 `scripts/lib/page-image-capture.mjs`，只裁剪最近的可见图片容器，隐藏重叠控件，并记录 `captureType=clipped_image_container`、边界框和视口。
- Prevention：整页截图、原始 `<img>` 截图、来源网页 URL 和缺少捕获证据的图片均不得进入 locked metadata 或发布；回归测试必须检查共享 helper，而不是只检查某个馆的结果。
- Affected docs：`research/generation-pipeline.md`、`research/README.md`、Pipeline 2.11.6。
## 2026-07-24 - M28.9 通用整馆收尾

- Issue: Pipeline 在 mechanical output 之后仍依赖维也纳、地中等馆专用 builder，新馆会重复写装配代码。
- Cause: “museum integration” 只有文字约定，没有统一结构化输入和唯一可执行入口。
- Fix: 以 `assembly-input.json` 固定语义边界，用通用 assembler 和 finalizer 完成组装、验证、发布与成本报告。
- Prevention: 馆可以有数据，不得有馆专用装配代码；缺少语义或资源数据时退回上游，机械层不得搜索或创作。
- Affected docs: `research/generation-pipeline.md`, `coho_museum/TechDesign.md`, `coho_museum/Milestones.md`
# 2026-07-24 - 未来馆接入必须是可执行合同

- “以后统一”不能只写成文档约定；装配器必须自动完成页面、地图和排名接入，发布前门禁必须读取真实候选文件验证结果。
- 旧馆的数据形态可以作为明确列举的 legacy baseline 保留，但不能继续成为新馆可复制的先例。
- 正向测试必须真实调用通用装配器；只拿手写字符串测试验证函数，不能证明装配器和门禁能闭环。

## 2026-07-24 - 降档前先锁定职责、身份和风险

- Issue: 首次 Terra Scope 只复述容量规则；首次 standard research 又因同名对象缺少藏品号而研究了另一件作品。
- Cause: 阶段输入变小后，原先藏在 pipeline 全文里的交付职责没有进入阶段视图；candidate packet 只给标题，没有唯一身份锚点与模型前风险分流。
- Fix: Scope 在母指令内获得结构化交付合同并明确允许联网；candidate packet 必须包含官方 `identityAnchor`、`identitySourceUrl`、`riskFlags`，runner 在模型调用前阻断身份缺失、非法风险和复杂度混批。
- Prevention: 模型降档不能靠“任务看起来简单”；先把可机械判断的身份、路由与 schema 固定，再用小样本验证。失败样本保留，不用 reviewer 或 ad hoc prompt 修补。

## 2026-07-24 - 首次旧馆全流程运行必须验证真实发布路径

- Issue: Seattle 正文首稿通过后，真实发布才暴露评分 schema、机械枚举、旧馆脚本绑定、库存计数、重复暂存、UTC 日期和宿主阻挡图片七类集成缺口。
- Cause: 先前通用收尾主要用已具备独立数据文件的 Vienna 与 Chichu 验证，没有覆盖“旧馆从共享数据迁出”的完整路径。
- Fix: Pipeline 2.7.2—2.7.10 将每个缺口分别冻结为可追溯补丁；没有重跑已通过的正文。最终 20 件机械门、原子发布、首页、路线、深链与真实图片显示全部通过。
- Prevention: 新 pipeline 版本必须同时保留新馆、已有独立文件馆和共享旧馆三种 fixture；联网门把 403/429 记为宿主阻挡，但浏览器门仍须确认真实图片是否可见，不可把“不是坏 URL”等同于“页面能显示”。

## 2026-07-25 - 图片验证器不能代替图片解析器

- Issue: Seattle 的 18 张馆封面占位中，多数并不是确认没有作品图，而是装配阶段看到允许占位后提前返回；图片门只能证明封面可加载，不能主动找到作品图。
- Cause: “找图”和“验图”被混成同一职责，搜索服务暂时不可用时又没有区分“没有匹配结果”和“provider unavailable”。
- Fix: Pipeline 2.7.11 新增零模型图片解析器：先读严格缓存，再读官方页元数据，再做官方域名或 Commons 的身份匹配；验证图片字节后才缓存，失败最后才用馆封面。搜索服务不可用单独记录，不再误称没有图片。
- Prevention: 同名标题、泛称器物、非 File 页和来源页与图片身份不一致的结果必须拒绝；剩余占位必须保留机器可读原因，图片解析阶段固定为 0 模型调用、0 token。

## 2026-07-25 - 不得把图片解析 proposal 当作已实现能力

- Issue: Pipeline 2.7.11 被过早描述为已经支持官方 API、IIIF、Commons 和多来源搜索；实际代码只读取 Open Graph，并通过同一个 DuckDuckGo provider 间接搜索 Commons。
- Cause: 没有把每个承诺来源对应到独立代码路径、固定夹具和真实运行记录，完成门只检查了结果数量。
- Fix: Pipeline 2.7.12 为官方 Open Graph / JSON-LD / API / IIIF、直接 Commons API、Wikidata、DuckDuckGo 与 Bing 建立独立路径；身份包加入年代、机构和馆藏号，失败状态分型；真实页面同时验证占位标签。
- Prevention: 图片解析里程碑必须提交“来源能力—代码路径—测试夹具—真实状态”四项对照；共享 provider 不能冒充独立来源，proposal 未落地不得标记通过。

## 2026-07-25 - 目录秩序必须由共享 contract 执行

- Issue: `research/` 长期混放正文、milestone run、测试、证据与失败稿，多个脚本还能自行选择 `--run-root`、`--out-dir` 或 `--candidate`，整理一次不能阻止下次重新污染。
- Cause: 路径规则只写在文档和各脚本局部判断中，没有统一的 run identity、descriptor、生命周期与 root hygiene 门。
- Fix: Pipeline 2.9.0 引入 filesystem contract v1、唯一 Node 路径模块、run creator、validator、迁移 inventory/plan/result，以及覆盖路径逃逸、身份漂移和 immutable 写入的正反测试。
- Prevention: 新 run 只能由 creator 创建；Milestone 只进入 metadata；canonical writer 只接收 `kind + museum/case + runId`，所有路径由同一 contract 计算。历史证据可以保留旧路径，但 archive 不能成为运行时 fallback。

## 2026-07-26 - 图片综合页失败后必须立即转 AI

- Issue: 地中美术馆的官方综合页无法把 10 件作品绑定到单件图片，旧 resolver 却把同一张 museum hero 标成 10 件 accepted。
- Cause: 旧流程把 provider 解析、候选歧义和 placeholder 兜底混在一起，并且只有已有 2–5 个本地候选时才调用模型。
- Fix: 新增通用 two-level image mode；快速路径只接受作品级高置信度身份与图片绑定，否则每件 unresolved 进入一次 Luna Medium image research；代码独立负责下载、安全、尺寸、SHA 和重复图 gate。
- Prevention: `museum_hero_placeholder` 不再是作品 accepted 状态；普通作品无可靠图片只能是 `object_image_unresolved`，建筑／馆级节点单独使用 `context_image_accepted`。
- Affected docs: `scripts/resolve-museum-image-evidence.mjs`, `scripts/resolve-two-level-image-evidence.mjs`, `scripts/schemas/verified-image-evidence.schema.json`, `coho_museum/Milestones.md`

## 2026-07-26 - 隔离图片 runner 必须兼容 stdout JSON 与 Windows 日志编码

- Issue: Luna 按合同把图片研究 JSON 打到 stdout，旧 runner 只等待文件；PowerShell Tee 日志还可能是 UTF-16，导致有效结果被误报为缺少 output。
- Cause: image stage 的文件写入假设没有覆盖 one-shot JSON 响应模式，日志读取也固定使用 UTF-8。
- Fix: two-level mode 允许无本地候选、允许 web research，并从严格的 `schemaVersion/works` envelope 提取 stdout；runner 自动识别 UTF-16 / UTF-8 日志。原始 runner log 保留，token usage 继续记录。
- Prevention: 新模型 stage 必须同时测试“模型写文件”和“模型 stdout JSON”两条结果通道，且不得把任意日志文本当作 JSON。
