# Meowseum 当前里程碑

> Current: M30（Luna High 单件 One-shot）
> Active amendment: M28.5（作者输入成本与 pipeline 变更控制）
> Paused: M26（除地中美术馆外的十四馆整馆重生）
> Awaiting owner acceptance: M27（Frye Art Museum）

完整的 M1–M28.1 历史、逐次 checkpoint 和测试数字保存在 `coho_museum/archive/Milestones-M1-M28.1-full.md`。本文件只保存当前执行范围。

## M30：Luna High 单件 One-shot Search & Write

Status: Complete — Pipeline 2.10.0 frozen 2026-07-26

Scope：

- 新单件正文固定使用 Luna High，一次自主搜索并直接输出 article 与 sources；无 Sol/Terra fallback、无默认 reviewer。
- Research Card 只保留馆级 selection、rating、structure 用途，不再进入单件写作；取消新路径中的 Writing Plan、claim ledger、story beats、valueType、mustNotAssume 和模型 display metadata。
- 通用 verifier 分开检查 direct quote、strong factual claim 与 artist intent，只让结构化 errors 阻塞；普通引号和否定式最高级不误报。
- 程序确定性生成 card、draft、display metadata 与 integration sources；assembler 同时兼容新 one-shot bundle 和历史 author bundle。
- 不重跑模型，重新验证既有 Luna v3《海变》并通过 canonical atomic publish 替换该件，Seattle 其他内容、评分和路线保持不变。

Completion gate：

- One-shot 正反夹具、历史 v2/v3 夹具、filesystem、authority、causality、assembler、publisher 与内容门通过。
- Luna v3 原 article / sources 哈希不变，原失败记录保留，并新增 `previousFailure: verifier false positive` 的复验记录。
- Production diff 仅包含《海变》卡片、正文与必要更新时间／缓存引用；其他 19 件、评分和路线无漂移。
- Pipeline 2.10.0 frozen。

## M31：两级图片解析试验（地中美术馆）

Status: Experiment complete with unresolved images; image evidence published to local 8096 — Pipeline 2.11.5 unchanged

Scope：

- 只读复用冻结地中美术馆 run 的 scope、candidate pool、selection 和 structure；不重跑其他阶段，不修改冻结 run、production 或前端。
- 新增两级图片模式：官方作品 URL 高置信度绑定先快速接受；快速路径无法证明身份时，一次交给 Luna Medium 自主搜索，再由代码执行 URL 安全、MIME、尺寸、SHA-256 和重复图片检查。
- 作品图、建筑／馆级 context 图和 unresolved 分离；museum hero 只保留一份，不伪装成作品图。

Completion gate：

- [x] 10 件作品从新 experiment run 的冻结上游输入进入图片阶段。
- [x] 快速路径未误接受综合馆页；10 件全部按规则进入一次 AI 图片研究，模型为 `gpt-5.6-luna` medium。
- [x] AI 结果经过确定性下载和图片校验；4 件作品图、1 件建筑 context 图接受，5 件因来源返回 HTML 或 429 明确 unresolved；重复作品图 SHA 为 0。
- [x] 生成 `reports/chichu-image-resolution-test.json` 与 `.md`；未触碰生产内容。
- [x] 仅将 4 张作品图、1 张建筑 context 图和 5 个明确 unresolved 状态发布到本地 8096；未解析作品不再回退为馆舍封面。

## M31.1：通用页面图片捕获门

Status: Complete — Pipeline 2.11.6 frozen 2026-07-26

- 将动态网页图片的容器裁剪、控件隐藏和捕获证据提升为共享 helper；新馆不得使用整页或原始 `<img>` 截图。
- 扩展 verified image evidence schema，要求页面元素捕获记录 `clipped_image_container`、来源页、边界框和视口。
- 用地中美术馆真实页面验证正式站 8094；8095/8096 仅作为测试端口并在交付后关闭。

## M29：Research 目录重构与文件系统契约

Status: Complete — Pipeline 2.9.3 frozen 2026-07-25

Acceptance note: 本次 filesystem contract、迁移、真实仓库 authority、runner、batch、reporter、assembler、publisher 与 15 馆页面回归均通过。全站 `verify-significance-evidence.mjs` 仍因迁移前已存在的 145 条 pending audit 返回非零；该固定失败集合已作为 owner-approved pre-existing baseline 正式记录，filesystem 相关新增失败为 0，门禁没有降低。

Scope：

- 在不改写游客可见正文、评分、选件、路线或 UI 的前提下，分离 active content、evidence、production / regression / experiment runs、pipeline metadata、archive 与 legacy scripts。
- 先冻结 machine-readable inventory 与 migration plan，再按哈希保护执行迁移；未知文件不删除。
- Pipeline 2.9.0 新增 filesystem contract v1、统一 run creator、共享路径解析和 run 生命周期门。
- Runner、batch、reporter、assembler、finalizer 与 publisher 不再接受任意输出目录；accepted / published / superseded run 只读。
- Authority gate 自动阻止 research 根目录污染、随意 milestone 目录、active/archive 引用串线和 museum-specific builder 回流。

Execution order：

1. Owner-approved change record。
2. Filesystem contract 与共享 validator。
3. 正反测试。
4. Inventory 与 migration plan。
5. 哈希保护迁移与引用更新。
6. 全套回归、15 馆浏览器验证和 Pipeline 2.9.0 冻结。

Completion gate：

- `research/` 根目录只剩 contract allowlist；active content 全部为 `research/content/<museumId>.md`。
- 原顶层 milestone runs、pipeline metadata 和旧正文完成分类迁移，无未知文件被删除。
- Canonical scripts 全部使用同一 Node contract 真源；任意路径、symlink / junction 逃逸、身份漂移和 immutable 写入负例被拒绝。
- 规定的现有与新增测试全部通过；15 馆、500 项、内容文件、路线、图片和 console 无迁移回归。
- `research/pipeline/releases/v2.9.3.json` 幂等冻结，并将真实 authority verifier 纳入 canonical hash；工作区无意外未跟踪文件。

## M26：十五馆当前 pipeline 整馆重生

Status: Partially resumed — Chichu only

- 暂停原因：先完成 M28 的 pipeline 与项目权威验证。
- 保留真实进度；不得回滚或标记完成。
- 恢复条件：M28 通过且 owner 明确允许恢复。
- 2026-07-23 owner 明确恢复地中美术馆整馆重生；其余十四馆继续暂停。
- 执行时读取 manifest 当前版本，不引用本文件里的版本号。

## M27：Frye Art Museum

Status: Implemented — awaiting owner content acceptance

- 20 件、5 章和三档路线已进入统一页面。
- 本地内容、图片、URL、地图、排名与浏览器检查已完成。
- Remaining: owner content acceptance。

## M28：项目权威与可复现 pipeline

Status: In Progress

已完成：

- 建立 `research/README.md` 权威入口。
- 统一 canonical 内容指令、生成流程、manifest 和 runner。
- 退休会生成正文的旧脚本。
- 建立聊天隔离、无 ad hoc prompt、批量研究与逐件 author bundle。
- Pipeline 2.4.3 在馆介与逐件写作前新增 `museum_selection -> rating_verified`：逐项证据表、档位、档内锚点、珍品清单、独立珍品线和父子重复计数由机械门阻断；11 个正反夹具通过，未调用模型。
- reviewer 默认停用。
- 单件流程收敛为 `research_card -> author_bundle -> mechanical_processed`。
- runner self-test、因果正反夹具与项目权威门通过。
- owner 接受的《秋韵》无 reviewer 作者包作为当前内容基线。

Remaining：

- Frye 20 件按当前 pipeline 完成整馆因果试点。
- 全馆去模板检查。
- 真实页面验证。
- manifest 记录真实试点结果。
- owner 决定是否关闭 M28 与恢复 M26。

## M28.14：图片证据前置与浏览器解析

Status: Passed — completed and published, 2026-07-25

Scope：

- 候选池锁定作品身份后、研究开始前生成 `verified-image-evidence.json`。
- 普通 HTTP、官方 API 与开放数据无法取得页面时，使用真实浏览器解析官方对象页并下载图片。
- 信号冲突时只把有限候选交给 `gpt-5.6-luna` medium；不读取聊天、旧图片映射或旧网页数据。
- 研究中的直接观察与最终网页使用同一份图片证据；组装阶段不再重新找图。
- 从当前官方对象页重新生成 Seattle 20 件图片，组装、发布并验证 8094。

完成门：

- 浏览器 403 fallback、身份核对、图片下载与歧义分流夹具通过。
- Luna 路由、隔离输入和结构化输出合同通过。
- Seattle 20/20 均有本次运行产生的图片证据或明确失败状态；不得读取旧资产缓存。
- Seattle 数据、图片、URL、发布门和真实浏览器页面通过。
- Pipeline 2.8.0 release 幂等冻结；记录真实用时、模型调用和 token。

Result：

- Seattle 20/20 从当前官方对象页重新取得，20 个 URL 与 20 个文件哈希均唯一；0 占位、0 歧义、0 未解决、0 模型调用。
- 真实浏览器逐一打开 20 张图全部成功；《双重猫王》《巴塞罗那》《伊迪娅腰饰面具》《风暴将至》深链通过。
- Luna medium 歧义合同用 2 个候选完成真实隔离测试，正确选择官方对象图；1 次调用、17,381 token、21.494 秒。
- Seattle 图片解析 40.696 秒；组装、验证与发布 2.741 秒；主站 8094 已更新。

完成门：

- 项目权威门和因果夹具通过。
- backfill / 错误上游产物被拒绝。
- Frye 整馆试点、机械处理、页面和去模板检查通过。
- 不要求 reviewer artifact。

## M28.1：项目管理瘦身

Status: Complete — approved and completed 2026-07-22

Scope：

- 五个活跃 Coho 文件只保存当前产品、架构、执行、守则和操作事实。
- 原始全文移入 `coho_museum/archive/`，不删除历史。
- manifest 成为唯一当前版本和 release 指针。
- README、TechDesign、校验脚本和 fixture 不再写死当前版本。
- release 由最小脚本根据 manifest 与实际哈希生成。
- 内容母指令不拆分；只移出历史版本记录和重复流程说明。
- 不生成或修改任何博物馆正文。

Test plan：

- 归档文件存在且活跃 Coho 文件显著缩小。
- manifest、release 和 JSON 可解析。
- release 冻结脚本幂等。
- authority、causality 和 runner self-test 通过。
- 15 个正式内容文件仍与前端一一对应。
- 当前 M26/M27/M28 状态不漂移。

Result：

- 五个活跃 Coho 文件从 186,077 bytes 降至 17,194 bytes，减少 90.76%；原文全部保存在 archive。
- 活跃文件中的当前版本引用只剩 manifest；release 是自动生成的不可变快照。
- release 冻结连续运行哈希相同。
- JSON、内容脚本边界、authority、causality、runner self-test 全部通过。
- 15 个正式内容文件与前端引用仍一一对应。
- 未生成或修改博物馆正文；M26、M27、M28 原状态不变。

## M28.2：三作品隔离重生与作品级补丁验证

Status: Implemented — awaiting owner content acceptance

Scope：

- 从零研究《雪中猎人》《纳尔迈调色板》《秋韵：第 30 号》，不读取聊天、memory、旧研究卡或旧正文。
- 三件可共用一个最多十件的研究上下文；author bundle 逐件独立生成。
- reviewer 停用；每件必须通过确定性的 `mechanical_processed`。
- owner 明确批准本次采用作品级内容补丁：卡片与详情同时更新，作品 ID、图片、评分和路线保持不变。
- 分别验证 Vienna、Egyptian Museum 与 The Met 的数据、图片、URL 和真实深链页面。

完成门：

- 最新 pipeline 与 mechanical processor 的权威、因果和最小测试通过。
- 三份 fresh research card、三个 author bundle 和三个 mechanical result 可追溯。
- 三件作品的卡片和详情进入正式网页，三个深链与所属馆回归通过。

Result：

- Pipeline 2.2.3 包含确定性的 `mechanical_processed`、owner 批准的作品级补丁边界，并将作品元数据固定在 `displayMetadata`；正文标题后直接进入“30 秒先懂”。
- 元数据分层 self-test、manifest JSON、权威门、因果夹具、runner self-test 与内容管线门通过；本次未批量迁移其他现有作品。
- 一个 fresh research 批次生成三张独立研究卡；三次 author bundle 彼此隔离，reviewer 与 retry 均未运行。
- 研究阶段使用 104,599 tokens；三个作者包分别使用 45,672、34,590、47,615 tokens；隔离生成合计 232,476 tokens。
- 三件均通过机械处理；《雪中猎人》和《纳尔迈调色板》保留“稀世珍品”，《秋韵》因存在同年同方法的最近比较组降为“重要藏品”。
- 卡片、详情、作者 / 文化、重要性和最近更新时间已进入正式页面；三个深链的双层正文、趣闻、最后一眼、图片解码和控制台检查通过。
- 纳尔迈通俗解释测试复用原研究材料，先后运行三个隔离作者包：v2.2.4 暴露抽象模型仍可复制研究语言；v2.2.5 暴露旧研究卡混入写作方案；v2.2.6 将证据与写作决定分开后通过机械门。第三稿未进入正式网页，等待 owner 判断顾爷式解释力是否达标。
- v2.3.0 对作者阶段做整体瘦身：`30 秒先懂` 只讲一个核心认识，视觉证据自然进入解释，不再强制独立观看动作、字数下限、三段论表格或 `plainLanguageProof`。复用同一份事实材料、移除研究卡内遗留的“最后一眼动作”后，纳尔迈隔离作者包使用 44,314 tokens，机械门通过；正文结构、开头与主线明显改善，但卡片仍残留“不只是……而是……”且深层个别段落仍偏研究摘要，因此记为结构通过、语言待 owner 验收，未发布。
- v2.3.1 要求最高层级历史价值优先于视觉机制；纳尔迈隔离作者包使用 43,659 tokens，但仍把“统一”降为王权图像机制的限定背景，并漏交 `workId`，语义与机械门均失败。
- v2.3.2 把主流历史 / 艺术地位加入研究卡必填范围；一次 86,035-token fresh research 仍只记录“统一是主流解释”，没有捕捉纳尔迈、第一王朝与埃及首次统一王国之间的上层历史定位，因此停止在研究阶段，没有继续消耗 author tokens，也没有发布。
- v2.4.0 不按媒介建立正文模板，而让研究收集适用价值候选、作者只选一个 `narrativeMainline.valueType`。纳尔迈定向补齐 `historical_transition` 后，隔离作者正确选择该类型，快层以“多个区域中心走向统一领土国家”为主线，再用双冠、王名与胜利图像说明作品怎样见证转型；作者使用 50,616 tokens，机械处理通过，未发布。定向研究仍使用 80,691 tokens，未实现效率目标，不能作为 M22 优化成功依据。
- Pipeline 2.4.1 将 run header 已锁定的 `workId` 归为可确定恢复字段；同一作者包无需模型重试即由机械层修复并通过，权威、因果、runner、内容管线与 JSON 检查通过。
- Pipeline 2.4.2 / 内容标准 2.0.1 增加快层首句结论门与深入层相关性门；调色板和秋韵分别隔离选择 `historical_transition` 与 `artistic_breakthrough`，作者使用 47,157 与 41,735 tokens，均无 reviewer、无 retry、机械门通过。调色板正文从 2,825 降至 1,857 个可见字符，秋韵从 2,654 降至 1,518；深入层明显收紧。内容仍未签核：调色板首句仍没有直接说出 owner 要求的“上下埃及第一次统一的最早证据之一”，秋韵卡片与两稿少数段落仍残留否定—转折骨架。两稿均未发布。
- 同版《雪中猎人》隔离作者包选择 `artistic_breakthrough`，以“冬季第一次成为统摄整幅画面的主角”直入核心；作者使用 44,145 tokens，机械门通过，正文从 2,501 降至 1,707 个可见字符，未运行 reviewer/retry、未发布。主线和深入层简洁度达到本轮测试目标；卡片与少数段落仍有否定—转折骨架，等待 owner 内容判断。
- Remaining：owner 内容验收。

## M28.3：地中美术馆整馆隔离重生

Status: Complete — owner accepted and published 2026-07-23

Scope：

- 按 manifest 当前 pipeline 与内容指令，从馆级范围和新研究开始重生成地中美术馆全部 20 个现有条目。
- 旧正文只允许在新稿封存后用于事实、来源和边界回归，不进入研究或作者输入。
- 每个研究上下文最多 10 件；author bundle 逐件独立生成；reviewer 与自动 retry 停用。
- 候选整馆在独立 run 目录完成；20/20 机械处理、数据、图片、URL、路线与真实页面检查共同通过后才原子替换正式馆。
- 不改变“仅地中美术馆、不含直岛其他 Benesse 场馆”的范围。

Result：

- 两个 fresh research 批次分别生成 10 张研究卡，使用 110,152 与 152,647 tokens。
- 20 个独立 author bundle 共使用 792,408 tokens；20/20 通过 mechanical processor，均为 0 blocker、0 advisory，未运行 reviewer。
- 馆级首稿错误保留旧式 92 分，但新作者包中没有“稀世珍品”，与 90+ 硬门冲突，因此原样封存为失败稿。
- 第二次馆级隔离生成只新增 20 个作者包重要性标签的机械汇总；没有注入聊天反馈或目标分数。结果按“0 个稀世珍品”落到 79 分：直岛行程中优先安排，但不能仅凭珍品密度支持专程前往。
- 候选包含 5 章、三档路线、20 张独立卡片和 20 篇正文；重复的“再看这些容易错过的细节”结构标题在集成层确定性移除，没有改写正文。
- 8095 独立预览通过：20 张卡片、20 个唯一深链、20/20 图片解码、20/20 正文从“30 秒先懂”开始，0 控制台错误。
- Owner 要求主卡保持干净；候选共享页面已移除左侧结论句及右侧旅行行动 / 限制段，只保留评分档位与必要入口。
- 总模型 tokens 为 1,202,086，其中两次馆级结构生成 146,879；第二次为修复首稿评分硬门失败。
- Owner 接受 79 分与候选内容后，正式 `ratings.js`、`chichu.js`、`routes.js` 与 `research/content/chichu.md` 已原子更新；共享馆页保持干净主卡并更新脚本缓存版本。
- 首次删除主卡节点时未更新脚本缓存版本，浏览器继续运行旧 JavaScript 后中断页面；已修复缓存版本，并在真实 8095 页面刷新确认 79 分、路线、正文和 20 张卡恢复。

Completion gate：

- [x] 20/20 新研究卡、author bundle 与 mechanical_processed 无 blocker。
- [x] 馆介、章节、三档路线、卡片与详情均来自本次整馆候选，结构一致且无旧正文拼接。
- [x] 20 个唯一深链、全部图片、卡片与详情、馆页首屏及控制台通过真实浏览器检查。
- [x] Owner 接受 79 分与候选内容后，原子更新正式文件、manifest 与全站评分校准日期。

## M28.4：地中发布与木心整馆隔离重生

Status: Complete — owner accepted and published 2026-07-23

Scope：

- Owner 接受地中美术馆 79 分与候选内容；先原子更新正式内容、评分、路线、manifest 与 8094 页面。
- 随后按当前 pipeline 从零研究并重生成木心美术馆；不读取聊天、memory、旧研究卡或旧正文。
- 木心先完成 `museum_selection -> rating_verified`，通过后才生成馆介、路线和逐件 author bundle；研究每批最多 10 件，reviewer 与自动 retry 停用。
- 木心候选在独立 run 与预览中完成；owner 复核《渔村》差异后要求保持 pipeline 不变，并再次授权直接更新 8094。
- 8094 发布验证通过后关闭 8095 / 8096 预览服务。
- 其余十三馆继续暂停。

Result：

- 地中美术馆候选已正式发布到 8094：79 分、20 个唯一深链、首页排名、路线和主卡均通过真实页面检查。
- 木心完成独立馆址范围、20 个候选、两批 fresh research、馆级选品与机械评分门；结果为 77 分、0 件稀世珍品，旧站 81 分未作为输入。
- Pipeline 2.4.7 明确将“对象身份稳定”与“当前是否展出 / 是否有对象图”拆开：后两项允许带标签进入，缺少对象图时使用明确标注的馆舍封面占位图。
- 木心 20/20 author bundle 与机械处理通过；页面包含 1 件确认在展、5 件馆藏轮换、14 件当前待核验，以及 10 张对象图、10 张馆舍占位图。
- 8096 候选通过 20 张卡片、20 个唯一深链、图片、标签、详情与路线真实页面检查；随后同一候选原子发布到 8094。
- 木心正式站已更新为 77 分、20 件内容、三档路线、10 张对象图与 10 张明确标注的馆舍占位图；缓存版本同步更新。
- 8094 正式页面通过后，8095 / 8096 预览服务已关闭。
- 正式根目录发布门发现并修复两项预览未覆盖的装配回归：新作品内联重要性被旧集中映射拒绝，以及木心评分块替换错误吞并相邻卢浮宫评分；修复后木心保持 77 分、卢浮宫恢复并保持 98 分。
- 本轮累计使用 2,458,375 tokens；详细证据见 `research/evidence/audits/muxin-m28-4-v2.4.7-candidate.md`。

Completion gate：

- [x] 地中正式 79 分、内容、路线、20 个深链、图片与真实页面通过。
- [x] 木心 fresh research、馆级证据、评分门、全部 author bundle 与机械处理通过。
- [x] 木心候选的数据、图片、URL、路线、主卡和真实页面通过。
- [x] manifest、审计和本里程碑记录实际 tokens、版本、失败边界与发布状态。
- [x] Owner 接受后原子更新 8094，并关闭 8095 / 8096。

## M28.5：作者输入成本与 Pipeline 变更控制

Status: Complete — owner-authorized fix 2026-07-23

Scope：

- 撤销木心阶段未经授权的作者输入扩张，不重新生成或发布任何博物馆内容。
- 作者阶段只保留当前作品需要的内容指令、研究卡、作品上下文和可选补充研究。
- Pipeline canonical 文件没有 owner 明确授权的版本化 change record 时，不得修改或冻结 release。

Result：

- Runner 对作者输入执行角色白名单、每类一份和总字节上限；整馆计划、pipeline 全文、审计记录与其他作品输入会直接失败。
- 木心 c01 真实输入夹具从 96,266 bytes 降到 57,951 bytes，减少 39.8%，未调用模型。
- Release 冻结器锁定 owner 原话、基础 release、目标版本、授权 canonical 文件和 change record 哈希；越界 canonical 变化与同版本覆盖负向夹具通过。
- Runner self-test、输入预算夹具、release 幂等、权威门、因果门与内容管线门通过。
- 木心 8096 候选与 8094 正式站均未改变；M28.4 仍等待 owner 内容与评分验收。

## M28.6：维也纳艺术史博物馆整馆隔离重生与直接发布

Status: Complete — generated, verified, and published to 8094 on 2026-07-24

Scope：

- 只覆盖 Maria-Theresien-Platz 的 Kunsthistorisches Museum Wien 主楼；保持 40 项容量，从 fresh museum scope、候选与研究重新开始。
- 不把聊天、memory、旧研究卡或旧正文作为生成输入；旧内容只在新候选封存后用于事实、来源、URL 与边界回归。
- 使用当前冻结 pipeline 2.4.8、内容指令 2.0.2、`gpt-5.6-sol` medium；研究每个上下文最多 10 项，逐件 author bundle，reviewer 与自动 retry 停用。
- 先通过馆级评分门，再生成馆介、章节、路线与逐件正文；候选必须通过 40/40 机械门、图片、唯一深链、路线、缓存与真实页面检查。
- Owner 已授权候选通过后直接原子更新 8094；不得建立新的长期预览端口，不得顺带修改 pipeline 或其他馆正文。

Completion gate：

- [x] Fresh scope、40 项候选、四个研究批次、馆级证据与 96 分评分通过。
- [x] 40/40 author bundle 与 mechanical result 无 blocker，且没有 reviewer / retry。
- [x] 候选馆介、六章、三档路线、卡片、详情、图片和 40 个唯一深链通过。
- [x] 正式根目录装配不引入其他馆回归；9 件珍品、8 条独立珍品线与馆级证据一致。
- [x] 8094 直接更新并在真实浏览器验证；manifest、审计与本里程碑记录最终状态。

## M28.7：生成启动安全与整馆成本报告

Status: Complete — released as pipeline 2.4.9 on 2026-07-24

Scope：

- 隔离 runner 自动推导项目根目录，缺少 run 目录时立即失败，不再进入 PowerShell 交互等待。
- Canonical 调用使用非交互 PowerShell；runner 记录真实 runner / model 起止时间和本次模型 token。
- 每座博物馆完成验证与发布边界后，必须生成一份按阶段拆分的用时与 token 报告；缺少任何模型 run 的时间或 token 时报告直接失败。
- 只升级机械执行与观测，不重跑或改写任何博物馆正文。

Completion gate：

- [x] 自动项目根目录、缺参立即失败和非交互调用测试通过。
- [x] Runner result 记录真实时间与 token，不再使用预填 `startedAt` 计算耗时。
- [x] 整馆报告器正确处理并行阶段，输出阶段墙钟时间、总用时、token 和缺失记录。
- [x] Pipeline change record、2.4.9 release、权威门、因果门和内容门通过。

## M28.8：整馆机械收尾性能

Status: Complete — released as pipeline 2.5.0 on 2026-07-24

Scope：

- 只优化整馆正文完成后的组装、补图、验证与发布，不调用模型、不改写正文。
- 全站确定性结构门继续全量执行；图片、来源和珍贵度等易变联网门只检查本次发布馆。
- 候选补图使用有上限的并发；发布由标准脚本搬运候选文件并统一更新缓存键。
- 使用已封存并已发布的维也纳40件产物做前后计时、内容哈希和正式页面回归。

Completion gate：

- [x] 维也纳候选组装从18.71秒降至2.37秒；除3个已迁移的馆方来源URL外，候选内容与正式内容等价。
- [x] 单馆 live 门只覆盖维也纳41张图片与43个来源，并保留15馆、500项、608个URL的全站本地结构检查。
- [x] 标准发布脚本通过临时夹具、维也纳 dry-run、正式发布和相同候选0改动重跑。
- [x] Pipeline 2.5.0、权威门、因果门、内容门、真实浏览器和 release 幂等通过。

## M28.9：通用零模型整馆收尾

Status: Complete — released as pipeline 2.6.0 on 2026-07-24

Scope：

- 用一份结构化 `assembly-input.json` 作为内容生成与网站装配的边界；装配器只搬运已完成正文、馆级判断、路线与资源记录，不生成或改写内容。
- 以一个通用装配器取代馆专用 `build-candidate.mjs`，并用一个入口串联装配、全站本地结构门、当前馆联网资源门、发布 dry-run / 正式发布和零模型成本报告。
- 使用维也纳艺术史博物馆 40 项与地中美术馆 20 项真实封存产物测试，不调用模型。

Completion gate：

- [x] 同一个装配器从两馆 `assembly-input.json` 和 author bundles 产出完整候选。
- [x] 两馆候选与正式内容语义等价，且全站确定性结构门、当前馆资源门与发布 dry-run 通过。
- [x] 两馆报告显示模型调用 0、模型 token 0，并记录真实分阶段耗时。
- [x] Pipeline 2.6.0、权限门、因果门、内容门与 release 幂等通过。

## M28.10：未来新馆唯一接入合同

Status: Complete — released as pipeline 2.6.1 on 2026-07-24

Scope：

- 当前 15 馆全部视为 legacy baseline，不迁移木心或改写任何正式内容。
- 今后新增馆只允许 `museumData.<id> = {...}`，数据脚本必须在 `museums.js` 之后加载；通用装配器机械登记候选页面、地图坐标和排名集合。
- 发布前门禁同时检查 assembly schema、唯一绑定、真实页面脚本顺序、地图注册和馆专用 builder；任一不一致立即阻断。

Completion gate：

- [x] 正向 future-museum fixture 通过。
- [x] 错误绑定、错误顺序、缺少地图注册和馆专用 builder 四类负向 fixture 均被拒绝。
- [x] 维也纳与地中通用装配回归通过，当前 15 馆和 8094 不变。
- [x] Pipeline 2.6.1、权限门、因果门、内容门与 release 幂等通过；模型调用和 token 均为 0。

## M28.11：模型分流与生成输入减重

Status: Passed — 2026-07-24

Scope：

- 从唯一内容母指令机械生成阶段视图，Scope、候选、研究、评分、结构和作者不再重复读取无关规则；不得维护第二份手写 prompt。
- 完整研究卡继续保留；研究卡增加可机械提取的下游证据，评分与结构默认读取紧凑索引，只有被明确标记的复杂对象补入完整卡。
- Scope 使用 `gpt-5.6-terra` medium；标准研究满足硬条件时使用 Terra medium，复杂研究以及候选、评分、结构和作者继续使用 `gpt-5.6-sol` medium。
- 研究批次和作者任务使用有界并发；每件作者输入、输出和因果哈希继续隔离。
- 只用封存资料和小样本测试；不重生整馆、不改8094。

Completion gate：

- [x] 六阶段输入视图、模型路由和错误路由拦截通过。
- [x] 研究/作者有界并发与失败传播测试通过。
- [x] 下游证据索引与紧凑 claim 引用测试通过。
- [x] 六件不同类型作品的作者输入回归通过，一件标准研究完整走通作者与机械处理。
- [x] Pipeline 2.7.1、权限门、因果门、runner、内容门和 release 幂等通过；正式内容与8094不变。

## M28.12：西雅图艺术博物馆整馆重生

Status: Complete — 2026-07-24

Scope：

- 使用冻结的 Pipeline 2.7.2 从零研究、选择并生成 downtown Seattle Art Museum 的 20 件内容；Scope、候选与研究沿用本次 2.7.1 隔离运行的已锁定产物，评分及正文使用 2.7.2；运行中发现的非文案枚举回填缺口由 Pipeline 2.7.3 的通用机械处理器修复，零模型资产与组装输入由 Pipeline 2.7.4 补齐，Pipeline 2.7.5 只补充其非文案写入白名单，Pipeline 2.7.6 补齐旧馆在两种页面脚本结构中的通用绑定，Pipeline 2.7.7 修正旧馆候选文件的库存计数，Pipeline 2.7.8 去除直接发布页与缓存页的重复暂存，Pipeline 2.7.9 以锁定研究日期避免 UTC 跨日，Pipeline 2.7.10 在真实页面验收后将宿主阻挡图片自动降级为馆封面占位。
- 明确排除 Seattle Asian Art Museum 与 Olympic Sculpture Park；旧正文不得进入模型输入。
- 通过评分、机械处理、图片、URL、整馆结构与真实页面门后，原子更新 8094。
- 生成整馆真实分阶段用时与 token 报告。

Completion gate：

- [x] 20 件研究卡、选择结果、馆级结构与 20 份独立 author bundle 完整。
- [x] 评分门、20 件机械门、图片与深链、三档路线、真实页面检查通过。
- [x] 候选原子发布到 8094，manifest 与正式内容同步更新。
- [x] 完成用时与 token 报告。

## M28.13：零模型藏品图片解析

Status: Passed — completed and published, 2026-07-25

Scope：

- 将博物馆封面从提前返回改为最终兜底；依次解析已验证缓存、官方对象页元数据 / JSON-LD / IIIF、直接 Commons API、Wikidata 和严格身份匹配的外部图片结果。
- 图片查找与验证不调用模型；成功结果写入资产缓存，无法确定身份或无法取得图片字节时继续使用封面并记录原因。
- 用西雅图20件重跑资产、候选、发布门和真实页面，不重跑研究卡或正文。
- 搜索服务不可用、没有结果、身份歧义、图片损坏和访问阻挡必须分别记录；一个 provider 失败不得跳过其他 provider。

Completion gate：

- [x] 官方元数据 / API / IIIF、Wikidata、直接 Commons API 和 provider 故障隔离夹具通过。
- [x] 正确图片匹配通过，页面标题正确但图片属于另一作品的负例被拒绝。
- [x] 西雅图20件均有图片，所有剩余占位都有准确原因，模型调用和 Token 为0。
- [x] 候选、图片门、发布门、8094真实页面和深链通过。
- [x] Pipeline 2.7.12、权威门、因果门、内容门与release幂等通过。

## Completed history index

- M1–M20：首批馆、统一页面、评分、扩馆和十三馆建设历史见 archive。
- M21–M25：模板修复、M22 管线、SMK、重要性门和双题材压力测试历史见 archive。
- 所有单馆验收与迁移状态以 manifest 为准；历史 milestone 文案不覆盖当前状态。
