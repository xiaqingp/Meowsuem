# Meowseum 生成流程

> Current version: read `research/content-standard-manifest.json`  
> Runtime status: read `research/content-standard-manifest.json`  
> Updated: 2026-07-24

本文件规定“工作怎样发生”。内容质量由 `meowseum-content-instruction.md` 定义。对话、旧正文和自动化 prompt 都不能补充另一套隐含步骤。

## 1. 固定输入与上下文层级

执行任何新指令前先做一次歧义门检查。若用户措辞存在两种以上合理解释，并且不同解释会显著改变既有 pipeline、执行范围、token / 时间成本、是否使用旧成果或最终交付形态，必须在执行前把分歧说清并向用户确认；不得自行选择更彻底、更昂贵或偏离既有流程的解释。只有不会实质改变结果的局部实现细节才可按最小合理假设继续。新要求没有明确取消既有规则时，默认与既有规则叠加执行，不能把两者误当成互相替代。

本项目中所有“生成作品”或“生成博物馆”默认执行聊天隔离。对话中的意见只能先修改本文件或 `meowseum-content-instruction.md` 并升级版本；生成进程不得读取对话、conversation memory、会话摘要或根任务临时整理的对象事实。作品名称、馆名、阶段、版本、允许输入及输出文件名只能通过结构化 run header 传入。

Pipeline 外不得创建 `research-task.md`、`author-task.md`、临时 `test-spec` 或其他内容 prompt 来补充写法、对象重点、应找到的事实、趣闻答案或验收标准。若某个阶段离开额外说明便无法执行，先停止并补全 canonical pipeline。

标准入口为 `scripts/run-isolated-generation.ps1`。Runner 在模型外解析 `run-header.json`、校验允许输入的路径与 SHA-256，并把 run header 与锁定文件的原文各装载一次，通过 stdin 交给模型；固定启动说明不得追加作品知识、候选趣闻、用户反馈或质量答案。模型不得再次读取、搜索或枚举本地文件。`museum_scope`、`museum_candidate_pool` 与 `research` 允许按 canonical 停止条件批量查询网络；`museum_selection`、`museum_structure` 与 `author` 只读锁定证据，不得联网。

`generation-pipeline.md`、manifest、PRD 和项目管理文件是 orchestrator 与校验器的执行合同，不进入生成模型。各阶段只读取下列语义材料；内容母指令由 runner 从唯一 canonical 文件机械截取 manifest 声明的章节：

| 阶段 | 模型输入 |
|---|---|
| `museum_scope` | run header + Scope 指令视图 |
| `museum_candidate_pool` | run header + 候选指令视图 + 已锁定 scope |
| `research` | run header + 研究指令视图 + 最多 10 件同复杂度 candidate packet |
| `museum_selection` | run header + 评分／选品指令视图 + `museum-work-index.json` + 仅被标记的完整卡 |
| `museum_structure` | run header + 馆介／路线指令视图 + 紧凑索引 + 已冻结评分／选择结果 + 仅被标记的完整卡 |
| `author` | run header + 作者指令视图 + 一件研究卡 + 一件 work context + 可选一件研究补充 |

路径解析、哈希校验、输出存在性、输出哈希和 token 记录都属于 runner / orchestrator 的机械职责。模型不得为了这些工作分段读取后再全文重读、在写入后打印完整 diff、重新读取成稿或自行运行 reviewer。模型只负责需要语义判断的研究、计划与写作；尽量在一次写入中交付本 stage 声明的输出。Runner 在阶段完成后生成 `<stage>-result.json`，统一记录本次输入和全部输出的 SHA-256；哈希不写入游客正文。

馆级 orchestrator 在一次 run 开始时完整读取权威入口列出的五个文件，并锁定版本与哈希；不让每件作品重复吞入 PRD、TechDesign 和全量 manifest。它再为本馆建立一个不可发布的 run header，写明范围、内容版本、pipeline 版本、全局文件哈希和允许来源。

同一 run 中的作者任务只允许四种输入角色：一份 `content_instruction`、一份 `research_card`、一份不超过本作品范围的 `work_context`，以及可选的一份 `research_supplement`。`work_context` 只保存当前作品的 `workId`、身份边界、展出状态、图片策略、重要性与评分角色；不得包含整馆计划、其他作品、路线或馆级全文。Pipeline 全文、manifest、PRD、TechDesign、预处理记录、哈希记录、review 记录和其他作品材料一律不得进入作者 prompt。Runner 按 manifest 中的角色白名单、每类数量和总字节上限机械拒绝额外输入。

Runner 对内容母指令先验证完整文件哈希，再按 manifest 的 `stageInstructionViews` 机械截取当前阶段所需的编号章节。阶段视图不是第二份 prompt，不得手写摘要或加入对象答案；母指令仍是唯一真源。result 必须记录实际装载的章节号。

“一件作品一个任务”是独立 author bundle 单位，不等于必须启动一个全新模型会话。最多十件研究卡可以在同一上下文准备，随后作品仍逐件计划、写作和封存；上一件正文不得成为下一件输入。

旧研究卡可能保存生成当时的流程结论，例如“缺少对象图，因此作者阶段阻塞”。这类句子不是作品事实，也不能凌驾于当前 pipeline。进入作者阶段前必须机械生成一份 author-input 副本：保留身份、来源、未知边界和所有事实；仅移除或改写已经被当前 `museum_selection` 明确取代的旧流程控制语句。若当前选择结果为 `identityStable: true` 且 `imagePolicy: museum_hero_placeholder`，旧卡中仅由缺少对象图、四项视觉观察不足或当前展出未知造成的“阻塞”必须改成“不得伪造视觉观察，按占位图与可见性标签继续”。原研究卡不可改写，author-input 副本必须记录原文件和哈希。对象身份不稳定、来源为空或组界冲突不能通过这条规则绕过。

最小输入包只能删除与该件无关的全局数据，不能摘要掉会改变成稿的禁止项或通过门槛。项目规则改变时先补入 canonical 内容指令，旧稿封存，再按新版本生成。

旧正文不能进入作者的写作上下文；只有在新稿封存后进行明确的回归诊断时，才可作为遗漏事实与质量对照。

每次运行必须记录：`pipelineVersion`、`instructionVersion`、`museumId`、`runId`、输入文件及 SHA-256、开始时间和执行者。缺少这些记录的产物可以作为草稿，不能作为 pipeline 通过证据。

生成必须在 run header 中显式锁定 manifest `executionProfile` 声明的模型和推理强度，不得依赖用户配置或 CLI 默认值。启动日志若缺失或与 run header 不符，该次产物只能作为失败样本。

研究卡字段、证据强度和停止条件只由内容指令第 1、5 节定义。Pipeline 只增加执行边界：一次研究上下文不超过 manifest 声明的数量；`researchMode: fresh` 不读取该对象的旧研究、正文、计划、测试或 review；研究卡只保留预计进入成稿的原子材料，通常超过 4,000 个可见字符时先删无关材料而不是继续扩张。

run header 只能包含结构化执行数据：`runId`、`stage`、`researchMode`、版本、对象身份、manifest 执行档、允许输入及哈希、输出文件名、reviewer 状态、retry 开关和发布边界。不得包含正文要求、作品重点、候选趣闻、用户反馈或该对象的验收答案。

## 2. 馆级状态机

```text
scoped -> image_evidence -> researched -> museum_selection -> rating_verified -> structured -> writing -> integrated -> verified -> accepted
```

- `scoped`：锁定馆址边界、容量候选和易变信息日期。
- `image_evidence`：候选身份锁定后，从当前官方对象页生成 `verified-image-evidence.json`。先使用普通 HTTP 与确定性元数据解析；遇到 403、动态页面或脚本无法取得图片时，使用真实浏览器。官方对象身份、主图信号和图片字节一致时直接下载；多个候选仍冲突时，最多五张一组交给隔离的 `gpt-5.6-luna` medium，仅输出选择、拒绝或歧义。结果保存来源、尺寸、文件类型、哈希和失败状态，后续研究与发布共同消费，不读取旧网页图片映射。
- `researched`：完成馆级资料；研究可以每批最多 10 件准备。
- `museum_selection`：在写馆介、路线或逐件正文前，用全部候选研究卡一次生成 `museum-evidence.json` 与 `museum-rating.json`。证据表逐项记录 `workId`、`identityStable`、`availability`、`imagePolicy`、四级重要性、稀世珍品硬门、最近比较对象、独立收藏线、父项 / 整体项关系、评分角色和来源指针；评分只记录分数、档位、档内锚点、理由、稀世珍品清单、独立珍品线和专程旅行判断。`identityStable` 必须为真才能通过；展出不确定与馆封面占位图可以通过，但必须使用规定枚举。若候选因题名、作者或组界冲突导致 `identityStable` 不能为真，只对缺口数量运行一次定向 `museum_candidate_replacement`，研究新的替代对象，不重跑已经有效的研究卡，也不为凑数把旧对象强行改名。替代对象完成 fresh research 后重新运行完整 `museum_selection`。不得在这一步生成馆介或路线文案。
- `rating_verified`：`scripts/process-museum-rating.mjs` 机械汇总并阻断跨档错误。0 件稀世珍品最高 79；有已通过硬门的稀世珍品不得落在 80 以下；90+ 必须通过专程旅行检验，并拥有至少三条独立稀世珍品线，或在单一领域形成有充分证据的世界压倒性收藏且至少有三件稀世珍品。`rareAssets` 必须与证据表中的稀世珍品完全一致；父项与子项不得拆成不同珍品线重复计数；档位和档内锚点必须与数字一致。机械门同时验证每件作品身份已稳定、展出状态枚举合法、图片策略合法；它允许 `display_status_unknown` 和 `museum_hero_placeholder`，不允许用它们掩盖身份冲突。失败结果封存并停止，不能继续写馆介、路线或正文。
- `structured`：馆级主线、章节与三档路线成立。
- `writing`：作品逐件通过下述状态机。
- `integrated`：只搬运已通过作品，原子替换整馆数据与正文。
- `verified`：完成结构、内容、重要性、图片、URL 与真实页面检查。
- `accepted`：owner 接受；此前不得写成已完成。

状态只能前进。若上游输入哈希变化，所有依赖它的下游状态失效并回到最早受影响阶段。

## 3. 单件状态机

```text
verified_image_evidence -> research_card -> author_bundle(writing_plan + card + draft) -> mechanical_processed
                                                                                     \-> blocked
```

1. `verified_image_evidence`：每件作品先由确定性解析器尝试官方元数据、官方 API、IIIF 与开放数据；普通请求失败时改用真实浏览器加载当前官方对象页。题名、馆藏号、最终页面和主图信号一致后下载图片并记录远程 URL、本地路径、像素、文件类型、SHA-256、摄影／许可与证据 ID。只有多个候选仍无法机械区分时才生成最多五张候选的隔离包，由 `gpt-5.6-luna` medium 查看候选并输出固定 JSON；模型不得搜索旧数据、读取聊天或写正文。没有合格图片时记录失败原因并允许馆舍占位图。
2. `research_card`：事实、局部因果、比较、观察、来源与不确定性；按内容母指令的价值类型分别收集适用的候选证据，并准确区分“首次 / 最早 / 统一 / 奠基 / 转折”究竟指事件、图像表达还是现存证据。它不得含可发布正文，也不得预写 `primaryValue`、`coreQuestion`、叙事主线、整篇逻辑链、开场或结尾。作者必须从候选价值证据中自行完成写作选择。复用旧卡时只机械删除混入的写作方案，不改事实；若最高层级价值缺少证据，不得让作者自行补齐。馆藏或长期保管关系已有可靠证据、但当天是否展出无法确认时，可以继续进入作者阶段，必须把展示状态标为不确定；“曾在本馆临展出现”不能据此升级为馆藏。缺少单件图片时允许声明使用馆封面占位图，不因此阻塞研究。任何“直接观察”必须引用当前 `verified-image-evidence.json` 的证据 ID；只有对象页文字或搜索摘要时只能记为来源事实。
   每个 candidate packet 必须先锁定 `identityAnchor` 与官方 `identitySourceUrl`，并显式给出 `riskFlags`。Runner 在模型启动前拒绝缺少身份锚点、非法风险、standard／complex 混批或 run header 与风险不一致的批次。研究中新发现风险时保留研究卡并退回正确档位，不能删风险换取低档模型。
   每张新研究卡必须用 `[Rnn]` 标记下游原子证据，并内嵌 `meowseum-downstream-evidence/1.0`。`scripts/prepare-museum-stage-inputs.mjs` 只解析和校验该块，生成 `museum-work-index.json`；它不得摘要或创作事实。评分与结构默认只读取该索引；`requiresFullCard: true` 的对象才把对应完整卡作为定向补充。
3. `research_gap`：研究卡其余部分仍有效、只缺一个明确价值类型或断言边界时，可以用原研究卡、当前权威文件和 run header 中的结构化 `missingDimensions` 做一次定向补证据，输出独立 `research-supplement.md`。它只能补事实、来源、置信度与边界，不能写主线或正文；不得为了一个缺口重跑整张研究卡。作者随后同时读取原研究卡与 supplement。
4. `author_bundle`：一件作品一个任务、一次作者调用，同时交付 `writing-plan.json`、`card.txt` 与 `draft.md`。写作计划只保留读者起点、`narrativeMainline.valueType`、`narrativeMainline.mainline`、二至四项真正改变理解的 `storyBeats`、必要的断言边界、`displayMetadata` 与精简 `claimLedger`；不生成 `primaryValue / whyItMatters / visualAnchor` 的重复承诺、`plainLanguageProof`、复述报告或逐段三联表。`valueType` 只能从内容母指令规定类型中选一个。有来源支持的决定性历史或艺术转折，优先于更容易描述的构图机制、材料技巧和趣闻；形式证据用于说明首要价值怎样成立。快层第一句必须直接给出与 `valueType` 对应的最大价值结论，不得先铺背景或抽象机制。深入层不覆盖研究卡栏目；每个 beat 必须让核心答案发生变化，同一事实不得在主体、细节、结尾和事实边界中重复。最小解释模型必须用普通中文说明一个能同时解释至少三个重要细节的关系，不能只是主题或栏目。Ledger 中每项必须指向研究卡、supplement 或已记录图像观察。`displayMetadata` 保存页面标题区与侧栏需要的结构化字段，并必须包含 `availability` 与 `imagePolicy`；`availability` 只能是 `confirmed_on_view`、`collection_rotation`、`previously_exhibited_current_unknown` 或 `display_status_unknown`，`imagePolicy` 只能是 `object_image` 或 `museum_hero_placeholder`。`draft.md` 的作品标题后必须直接进入 `### 30 秒先懂`，不得重复元数据。卡片和正文彼此独立，只能使用 Ledger 已登记内容；具体事实先于专业名称，任何新概念只能依赖零背景常识或前文已经解释的概念。作者允许改变顺序、解释术语和改写成自然中文，不允许补充或强化断言。
   - 作者输入若经过旧流程语句清理，必须读取清理后的 author-input 副本，不再同时读取原卡；清理记录只证明哪些流程词被替换，留在机械审计层，不得作为模型输入。当前作品的 `work_context` 必须来自已通过评分门的冻结选择结果；已通过身份门且采用馆舍占位图的作品必须交付作者包，不能因原卡缺少视觉观察再次自行阻塞。
5. `mechanical_processed`：程序只做确定性处理，并把结果分为三类：
   - **提示，不阻塞也不修复**：可选段落缺失、轻微字数偏差、语气或节奏警告、重复句式提示、卡片与详情的普通词汇重合、标点风格差异。它们写入报告供查看，不触发模型，也不阻止进入下一步。
   - **程序直接修复**：行尾、空白、末尾换行、作品标题与 `### 30 秒先懂` 之间完全匹配已知字段名的重复元数据、可从已锁定 run header 无歧义恢复的 `workId`、确定性的 slug / URL 编码、编号、派生计数和结果哈希。修复后重新运行同一检查，不调用模型。
   - **阻塞**：只有影响事实可追溯、产物完整性或页面基本可用性，而且程序无法安全修复的问题才阻塞。包括输入或输出哈希不符、必需文件缺失 / 为空 / 无法解析、必需 `displayMetadata`、叙事主线、`storyBeats` 或 `claimLedger` 结构缺失、正文在作品标题后没有直接进入 `### 30 秒先懂`、正文混入内部生产语言、卡片与详情完全相同、作品身份无法无歧义成立，以及无法无歧义解决的 URL 冲突。单件图片不可用不再阻塞：集成层必须改用该馆封面图，并在卡片与详情明确标注“馆舍占位图 · 非作品图”。当天展出状态无法确认也不阻塞，但必须显示不确定性标签。阻塞时保留原 author bundle；pipeline 不自动启动模型返工。

研究阶段和作者阶段分别由 runner 生成阶段结果文件。`author-result.json` 记录研究卡输入哈希以及写作计划、卡片和正文三个输出哈希；机械处理只处理与该记录相符的文件。正文和卡片不承担 provenance 元数据。哈希证明“用的是哪份输入、处理的是哪份输出、后来是否被修改”，不证明内容质量，也不证明模型内部先想了哪一句。

馆级评分不是作者包的事后汇总。`museum_selection` 必须发生在 `structured` 和 `writing` 之前；它只读取已锁定研究卡、全站校准集合和权威规则，不读取旧馆稿或对话。`museum-evidence.json` 与 `museum-rating.json` 通过机械评分门后冻结；后续馆介、章节、路线和单件正文只能解释该结果，不能悄悄改分、改档或改珍品集合。

## 4. 批量边界

- 可以一起做：最多 10 件研究卡、自动机械检查和重复扫描。
- 必须逐件做：作者包和失败返工。
- 不同研究批次可由 `scripts/run-generation-batch.mjs --stage=research` 按 manifest 上限有界并行；作者目录可用同一入口按作者并发上限调度。并发只改变墙钟时间，不共享作品正文或放宽输入哈希。
- 不要求十件全部研究完才开始第一件写作；研究批次只是减少资料切换，不是正文批次。
- 不在每件作品后运行全站检查。单件通过后冻结；全馆集成完成再运行馆级与发布级门禁。

## 5. 测试阶梯

规则或流程变更后按成本从低到高测试：

任何更新都必须在同一任务中完成对应回归；“文件已修改，等待以后测试”不构成完成。汇报完成前必须保存实际命令、结果与失败边界。若测试失败，继续修复并重测；只有缺少新授权或外部条件时才能停下并明确报告阻塞。

按影响选择最小但充分的回归，不机械重跑整馆：

- 权威文档、manifest 或历史文件边界变化：权威门、JSON / 引用一致性门。
- Pipeline 状态、输入、顺序或 reviewer 策略变化：权威门、因果正反夹具，以及受影响的最小流程切片。
- 馆级评分规则变化：馆级评分正反夹具；至少覆盖 0 珍品的 79 / 80 边界、80 档珍品门、90 档独立珍品线、父子重复计数、珍品清单一致性和档内锚点。除非评分内容本身变化，不重跑整馆。
- 内容母指令、声音、事实或重要性规则变化：两件隔离内容回归；涉及特定题材时增加对应题材样本。
- 前端数据或渲染变化：结构门、相关馆深链与真实浏览器回归。
- 全馆内容或评分变化：该馆全部内容门、评分校准、图片 / URL 和浏览器门。

上一级测试通过不代替受影响的下一级测试；没有受影响的层级不为形式主义浪费 token。

1. **权威检查**：文档、版本、正式内容引用和退休脚本一致。
2. **因果夹具**：一个合规的微型 run 必须通过；一个先写正文、后补研究卡的 backfill run 必须被拒绝。
3. **两件隔离盲测**：一件叙事型绘画 + 一件历史/跨媒介对象；只给当前权威文件和资料包，不给对话或旧正文。首稿封存后再与已接受样本比较。
4. **单馆试点**：只有前三层通过后，才选一座小馆；不得直接拿 40/60 件馆调 pipeline。
5. **批次生产**：试点由 owner 接受后才恢复整馆队列。

两件测试不要求文字复现，只比较：事实覆盖、首要价值是否选择了资料支持的最高层级历史或艺术意义、快层首句是否直接给出该结论、形式机制是否服务而非取代该意义、最小解释模型是否覆盖至少三个重要细节、概念是否按前置知识顺序出现、是否先用具体事实讲懂再给专业名称、深层每段是否改变核心答案、同一事实是否避免跨栏目重复、认知推进、自然中文、对象专属性、历史主次、第二眼和固定句式。若两件暴露同一系统缺陷，先改权威规则再重跑；单件执行偏差只退回该件，不升级全局规则。

## 6. 发布边界

只有整馆全部作品完成 `mechanical_processed` 且没有 blocker，评分、卡片、图片、路线、正文和页面门全部通过，并由 owner 明确接受该馆，才能原子替换正式馆。集成只把 `displayMetadata` 写入统一作品数据，把处理后的 `draft.md` 写入正文；不得把两者串成可见段落。`availability` 必须映射为卡片和详情可见标签；`museum_hero_placeholder` 必须映射为馆封面图、馆方链接和“馆舍占位图 · 非作品图”说明。占位图只解决图像缺失，不能作为作品的视觉证据。部分新稿不得混入生产。

馆页主卡是固定产品结构，不由每馆自由生成：只显示封面、馆名、城市、评分数字与档位、路线入口、官方链接和更新时间。共享渲染器不得在主卡显示 `verdict`、`travelAction` 或 `limitations`，也不得为删掉的段落生成替代文案；评分理由、边界和馆级主线进入下方对应正文。缓存版本必须随共享 HTML / JavaScript 同步更新，并在真实浏览器刷新后检查首屏、控制台和主要内容，静态字符串检查不能代替页面回归。

当 owner 在执行前明确批准一组既有正式作品作为**作品级内容补丁**时，可以不触发整馆重生，但必须同时满足：

- 每件作品从研究卡开始完整走过当前 pipeline，不读取旧研究或旧正文；
- 卡片简介与详情正文作为同一个补丁一起替换，不只改其中一层；
- 不改变馆级评分、选品、路线、图片或作品 ID；若新研究证明这些字段有误，停止补丁并重新确认范围；
- 每件完成 `mechanical_processed` 且无 blocker；
- 对每个受影响馆分别运行数据、图片、URL 和真实深链页面检查；
- run header 与 manifest 明确记录 owner 批准的补丁边界。

这是一条显式批准的维护通道，不允许自动任务把零散新稿逐步混入正式馆。manifest 继续记录当前正式版本、待迁移版本和项目验收状态，不增加“观察期”状态。

自动化只负责选择 manifest 中的下一个馆并执行本文件；自动化 prompt 应引用本文件，不得复制一份会漂移的长规则。暂停的批次在重新通过测试阶梯前不得恢复。

## 7. Pipeline 变更控制

Pipeline、内容指令、runner、机械处理器、评分处理器、作者输入预处理器或 release 冻结器发生任何变化前，必须有一份 owner 明确授权的版本化 change record。记录必须包含 owner 原话、基础 release、目标版本、允许变更的 canonical 文件和必跑测试；没有记录不得修改，也不得冻结新 release。

`scripts/freeze-pipeline-release.mjs` 必须比较基础 release 与当前 canonical 文件：发现记录范围之外的变化时直接失败。Release 保存 change record 的路径与哈希；权威门校验该记录、目标版本和所有 canonical 哈希。对话中的局部内容反馈不自动授权修改 pipeline；只有 owner 明确要求更新、修复或改变 pipeline 时才可创建新的 change record。任何会改变模型输入角色、文件数量或字节上限的改动，都必须在执行前说明成本影响并获得授权。

## 8. 历史

版本演进已原样归档到 `research/archive/generation-pipeline-history-through-M28.1.md`。当前执行合同以上文为准；历史 pipeline 不得作为运行输入。

## 9. 生成入口与整馆成本报告

- 唯一允许的模型启动方式是 `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-isolated-generation.ps1 -RunDirectory <run-dir>`。Runner 从自身位置推导项目根目录；不得手写底层 `codex exec` 命令，也不得依赖 PowerShell 的交互式必填参数提示。缺少 `RunDirectory` 必须立即失败。
- 模型路由由 manifest 与 runner 强制执行：`museum_scope` 使用 `gpt-5.6-terra` medium；`research` 仅在风险字段为空的 standard 批次使用 Terra medium，complex 批次使用 `gpt-5.6-sol` medium；候选、评分、结构和作者全部保持 Sol medium。一个研究批次不得混合两种复杂度。
- 每次真实模型运行由 runner 自动写入 `runnerStartedAt`、`modelStartedAt`、`modelCompletedAt`、`completedAt`、runner / model 用时、CLI 日志和 `tokenUsage.total`。预填的 `run-header.startedAt` 不是计时依据。
- 一座博物馆完成生成、校验和获准发布后，最后执行 `node scripts/report-museum-generation.mjs --museum <museum-id> --run-root <run-root>`。输出 `generation-report.json` 与 `generation-report.md`，列出整馆实际用时、模型调用数、总 token，以及各阶段的墙钟用时、模型累计用时和 token。
- 并行任务按最早开始至最晚结束计算阶段墙钟时间，不把并行时段重复相加。任何真实模型 result 缺少时间或 token，报告器必须阻断，整馆不能标记完成。

## 10. 整馆机械收尾

- 内容阶段结束时必须交付一份 `assembly-input.json`：只保存馆身份、馆介、章节、三档路线、评分结果、作品顺序、重要性、展出标签、已核验图片与来源以及发布目标。缺少这些语义输入时停止并退回上游，不允许装配器搜索、猜测或补写。
- 候选组装统一执行 `node scripts/assemble-museum-candidate.mjs --run-root=<run-root> --candidate=<candidate-dir>`。它一次读取每件已经通过的 author bundle 和 `assembly-input.json`，只搬运正文与结构化数据；不得使用馆专用 builder、不得联网找图、不得重新调用模型。
- `verified-image-evidence.json` 由 `node scripts/resolve-museum-image-evidence.mjs --run-root=<run-root> --fresh [--allow-model]` 在研究前生成；它只读取当前 scope、候选池和官方对象页，不读取旧网页、旧图片映射或旧资产缓存。普通请求失败时使用真实浏览器；机械信号冲突时才由标准 isolated runner 调用 Luna medium。`assembly-input.json` 与兼容层 `verified-assets.json` 随后由 `prepare-museum-assembly.mjs` 读取已经锁定的图片证据，不再重复联网搜图。历史 run 缺少前置图片证据时保留旧解析器作为 legacy fallback，不得成为未来新馆的正常路径。
- 当前 manifest 登记的 15 馆是 legacy baseline，不因本合同迁移。未来新馆必须在 `assembly-input.json` 提供 `integration.coordinates`，馆 ID 必须可直接作为小写 JavaScript 标识符，且只能生成 `museumData.<id> = {...}`。通用装配器自动把新馆脚本登记到候选 `index.html` 与 `museum.html` 的 `museums.js` 之后（馆页同时在 `routes.js` 之前），并自动加入首页地图坐标和排名集合；禁止任何 `binding` 配置或馆专用 builder。
- `node scripts/verify-future-museum-contract.mjs --run-root=<run-root> --candidate=<candidate-dir>` 是组装后的强制门。它检查 schema、唯一运行时绑定、两页真实脚本顺序、地图与排名注册、发布文件清单以及馆专用 builder；失败时不得进入发布验证。`finalize-museum.mjs` 固定在 assembly 与 release verification 之间执行该门。
- 全站馆数、作品数、唯一ID、路由、内容合同和本地文件继续每次全量检查。联网图片、来源页面、当前馆珍贵度审计和馆状态只检查本次发布馆：`node scripts/verify-release-candidate.mjs --museum=<museum-id> --candidate=<candidate-dir> --live`。其他馆的易变网络状态或待迁移状态不能阻挡本馆，但本馆任何真实损坏仍阻断。
- 候选必须写 `publication.json`，明确 museumId、候选到正式目录的文件映射、缓存键和缓存页面。发布只允许执行 `node scripts/publish-museum-candidate.mjs --candidate=<candidate-dir> --publish`；脚本先暂存全部文件，失败时恢复旧文件，相同候选再次发布必须为零改动。
- 标准收尾入口是 `node scripts/finalize-museum.mjs --run-root=<run-root> --candidate=<candidate-dir> --live [--publish]`，固定串联通用组装、当前馆发布门和发布器，并写入 `finalization-report.json`。该入口只启动本地 Node 脚本，报告中的模型调用与模型 token 必须均为 0。
- 全部作品URL由机械门全量证明可寻址；因为所有作品共用同一渲染器，真实浏览器检查馆首屏、三条路线和至少三件代表作品（首件、末件及一件长标题/特殊状态），不再人工逐页打开全部作品。共享渲染器、URL结构或数据合同变化时，扩大浏览器样本。
