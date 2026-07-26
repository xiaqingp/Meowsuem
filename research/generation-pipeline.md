# Meowseum 生成流程

> Current version: read `research/content-standard-manifest.json`  
> Runtime status: read `research/content-standard-manifest.json`  
> Updated: 2026-07-25

本文件规定“工作怎样发生”。内容质量由 `meowseum-content-instruction.md` 定义。对话、旧正文和自动化 prompt 都不能补充另一套隐含步骤。

## 0. 文件系统契约与 run 生命周期

`research/content-standard-manifest.json.filesystemContract` 是路径的唯一真源。所有新 run 只能由 `scripts/create-generation-run.mjs` 创建；production、regression、experiment 分别写入：

```text
research/runs/production/<museumId>/<runId>/
research/runs/regression/<caseId>/<runId>/
research/runs/experiment/<museumId-or-caseId>/<runId>/
```

Run ID 固定为 UTC `YYYYMMDDTHHMMSSZ-p<major>.<minor>.<patch>`。Milestone 只存在于 `run.json.milestone`，不得创建 `research/m29/` 一类目录。Pipeline 2.9.0 新建 run 使用 `layoutVersion: 1`；迁移进来的旧 run 可以标记 `layoutVersion: 0, legacyLayout: true`，但该标记不得用于新建 run。

`run.json` 的状态按 `created → running → verified → accepted/published` 前进；`blocked`、`failed` 与 `superseded` 只能按 contract 声明的转换处理。`accepted`、`published`、`superseded` 以及 `immutable: true` 的 run 对所有 pipeline writer 只读。需要修改时必须创建新 run，不能向旧 run 补文件。

调用者只提供 `kind + museum/case + runId`。Batch runner、reporter、assembler、finalizer 和 publisher 全部通过 `scripts/lib/filesystem-contract.mjs` 计算同一个 run root；任意 `--run-root`、`--out-dir` 或 `--candidate` 不能改变路径。兼容参数若保留，只在它精确等于 contract 计算结果时接受，并输出 deprecation warning。

每个 stage 只能写自己的目录：馆级研究批次写入 `research/batches/`；新单件写作固定写入 `works/<workId>/one-shot/{input,output,integration}`；历史 author bundle 只在旧 run 中保留。组装输入写入 `structure/`，图片证据写入 `image-evidence/`，候选固定在 `candidate/`，报告固定在 `reports/`。Node validator 是路径与 filesystem contract 的唯一实现。

正式正文固定为 `research/content/<museumId>.md`，不使用文件名版本号。失败 run 保留证据，但不得作为新稿输入；archive 和 evidence 均不构成生成指令或 fallback。发布仍使用临时文件与 rename 原子替换，发布失败不得把 run 写成 `published`。

## 1. 固定输入与上下文层级

执行任何新指令前先做一次歧义门检查。若用户措辞存在两种以上合理解释，并且不同解释会显著改变既有 pipeline、执行范围、token / 时间成本、是否使用旧成果或最终交付形态，必须在执行前把分歧说清并向用户确认；不得自行选择更彻底、更昂贵或偏离既有流程的解释。只有不会实质改变结果的局部实现细节才可按最小合理假设继续。新要求没有明确取消既有规则时，默认与既有规则叠加执行，不能把两者误当成互相替代。

本项目中所有“生成作品”或“生成博物馆”默认执行聊天隔离。对话中的意见只能先修改本文件或 `meowseum-content-instruction.md` 并升级版本；生成进程不得读取对话、conversation memory、会话摘要或根任务临时整理的对象事实。作品名称、馆名、阶段、版本、允许输入及输出文件名只能通过结构化 run header 传入。

Pipeline 外不得创建 `research-task.md`、`author-task.md`、临时 `test-spec` 或其他内容 prompt 来补充写法、对象重点、应找到的事实、趣闻答案或验收标准。若某个阶段离开额外说明便无法执行，先停止并补全 canonical pipeline。

馆级阶段入口仍为 `scripts/run-isolated-generation.ps1`；新单件写作入口为 `scripts/run-one-shot-work.mjs`。两者都在模型外解析身份、校验路径与 SHA-256。单件 runner 只装载 canonical one-shot prompt、`locked-metadata.json` 和已验证图片，允许 Luna 自主联网搜索；不得追加作品答案、用户反馈、旧研究卡、旧文章或 reviewer 记录。`museum_scope`、`museum_candidate_pool` 与馆级 `research` 继续按原规则联网；`museum_selection` 与 `museum_structure` 只读锁定证据。

`generation-pipeline.md`、manifest、PRD 和项目管理文件是 orchestrator 与校验器的执行合同，不进入生成模型。各阶段只读取下列语义材料；内容母指令由 runner 从唯一 canonical 文件机械截取 manifest 声明的章节：

| 阶段 | 模型输入 |
|---|---|
| `museum_scope` | run header + Scope 指令视图 |
| `museum_candidate_pool` | run header + 候选指令视图 + 已锁定 scope |
| `research` | run header + 研究指令视图 + 最多 10 件同复杂度 candidate packet |
| `museum_selection` | run header + 评分／选品指令视图 + `museum-work-index.json` + 仅被标记的完整卡 |
| `museum_structure` | run header + 馆介／路线指令视图 + 紧凑索引 + 已冻结评分／选择结果 + 仅被标记的完整卡 |
| `single_work` | canonical one-shot prompt + 一件 `locked-metadata.json` + 一张已验证图片；Luna 自主搜索 |

路径解析、哈希校验、输出存在性、输出哈希和 token 记录都属于 runner / orchestrator 的机械职责。模型不得为了这些工作分段读取后再全文重读、在写入后打印完整 diff、重新读取成稿或自行运行 reviewer。模型只负责需要语义判断的研究、计划与写作；尽量在一次写入中交付本 stage 声明的输出。Runner 在阶段完成后生成 `<stage>-result.json`，统一记录本次输入和全部输出的 SHA-256；哈希不写入游客正文。

馆级 orchestrator 在一次 run 开始时完整读取权威入口列出的五个文件，并锁定版本与哈希；不让每件作品重复吞入 PRD、TechDesign 和全量 manifest。它再为本馆建立一个不可发布的 run header，写明范围、内容版本、pipeline 版本、全局文件哈希和允许来源。

新单件写作只允许 `locked_metadata` 与 `verified_image` 两类对象输入。`locked-metadata.json` 由程序从 candidate identity、museum selection、museum structure、verified image evidence 与当前 work context 合并；模型不得生成或修改其中字段。旧 Research Card、Writing Plan、card、draft、article、claim ledger 与 reviewer output 一律不得进入 prompt。Pipeline 全文、manifest、PRD、TechDesign、其他作品和馆级全文同样不得进入模型。

Runner 对内容母指令先验证完整文件哈希，再按 manifest 的 `stageInstructionViews` 机械截取当前阶段所需的编号章节。阶段视图不是第二份 prompt，不得手写摘要或加入对象答案；母指令仍是唯一真源。result 必须记录实际装载的章节号。

“一件作品一个任务”是独立 one-shot 单位。馆级研究仍可最多十件一批准备供 selection、rating 与 structure 使用，但单件 Luna 不读取这些 Research Card；上一件正文不得成为下一件输入。

旧研究卡与旧 author-input 清理逻辑只为历史 run 保留，不得成为新单件 Luna 的输入或 fallback。对象身份不稳定、官方对象页缺失或图片身份冲突必须在生成前阻塞。

最小输入包只能删除与该件无关的全局数据，不能摘要掉会改变成稿的禁止项或通过门槛。项目规则改变时先补入 canonical 内容指令，旧稿封存，再按新版本生成。

旧正文不能进入作者的写作上下文；只有在新稿封存后进行明确的回归诊断时，才可作为遗漏事实与质量对照。

每次运行必须记录：`filesystemContractVersion`、`layoutVersion`、`pipelineVersion`、`instructionVersion`、`museumId` 或 `caseId`、`runId`、输入文件及 SHA-256、开始时间和执行者。缺少这些记录的产物可以作为草稿，不能作为 pipeline 通过证据。

生成必须在 run header 中显式锁定 manifest `executionProfile` 声明的模型和推理强度，不得依赖用户配置或 CLI 默认值。启动日志若缺失或与 run header 不符，该次产物只能作为失败样本。

馆级 Research Card 的字段、证据强度和停止条件仍由内容指令第 1、5 节定义，用于 selection、rating 与 structure；它不再进入单件写作。单件 `researchMode: fresh` 只使用锁定 metadata、图片和本次 web search。

run header 只能包含结构化执行数据：`runId`、`stage`、`researchMode`、版本、对象身份、manifest 执行档、允许输入及哈希、输出文件名、reviewer 状态、retry 开关和发布边界。不得包含正文要求、作品重点、候选趣闻、用户反馈或该对象的验收答案。

## 2. 馆级状态机

```text
scoped -> image_evidence -> researched -> museum_selection -> rating_verified -> structured -> writing -> integrated -> verified -> accepted
```

- `scoped`：锁定馆址边界、容量候选和易变信息日期。
- `image_evidence`：候选身份锁定后，从当前官方对象页生成 `image-evidence/verified-image-evidence.json`。先使用普通 HTTP 与确定性元数据解析；遇到 403、动态页面或脚本无法取得图片时，使用真实浏览器。官方对象身份、主图信号和图片字节一致时直接下载；多个候选仍冲突时，最多五张一组交给隔离的 `gpt-5.6-luna` medium，仅输出选择、拒绝或歧义。结果保存来源、尺寸、文件类型、哈希和失败状态，后续研究与发布共同消费，不读取旧网页图片映射。
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
locked_identity_and_metadata
  -> Luna_High_one_shot_search_and_write(article + sources)
  -> risk_verification
  -> deterministic_integration(card + draft + display_metadata + sources)
  -> integration_ready
  \-> blocked
```

1. `locked_identity_and_metadata`：上游确定性合并 candidate identity、museum selection、museum structure、verified image evidence 与 work context，生成 `locked-metadata.json`。它至少锁定馆／作品 ID、中英文题名、作者或文化、年代、材质、馆藏号、官方对象页、已验证图片、重要性、优先级、章节、停留时间、可见状态和图片策略。模型不得生成、修改或覆盖这些字段。
2. `one_shot_search_and_write`：唯一模型为 `gpt-5.6-luna`，reasoning effort `high`，无 Sol／Terra fallback、无第二模型、无默认 reviewer。Luna 先核对官方对象页，再按文章需要自主搜索，直接只输出 `article.md` 与 `sources.json`。失败即记录并阻塞；只有基础设施错误可按明确规则重试，不得靠换模型或降低 gate 继续。
3. `risk_verification`：`scripts/verify-one-shot-work.mjs` 只检查身份、结构、来源记录、高风险断言、展出状态边界与 production 保护。结果固定为 `{status, errors, warnings, checks}`；只有 `errors` 阻塞。普通引号、否定式“第一／唯一”、字数、趣闻、幽默、段落数量与写作品味不得成为 hard gate。
4. `deterministic_integration`：`scripts/adapt-one-shot-work.mjs` 从“一分钟看懂”第一段机械抽取 `card.txt`，把 article 原样复制为 `draft.md`，只从 locked metadata 生成 `display-metadata.json`，验证并复制 `sources.json`。该阶段零模型调用，不允许文章反向修改 metadata。
5. `integration_ready`：assembler 优先读取 `works/<workId>/one-shot/integration/`；历史 run 仍可读取旧 author bundle，但不得把旧路径作为新 run fallback。

单件 result 记录输入、article、sources、integration 的哈希与真实 token 使用。哈希只证明产物身份和是否被修改，不宣称正文事实已被机械验证。

馆级评分不是作者包的事后汇总。`museum_selection` 必须发生在 `structured` 和 `writing` 之前；它只读取已锁定研究卡、全站校准集合和权威规则，不读取旧馆稿或对话。`museum-evidence.json` 与 `museum-rating.json` 通过机械评分门后冻结；后续馆介、章节、路线和单件正文只能解释该结果，不能悄悄改分、改档或改珍品集合。

## 4. 批量边界

- 可以一起做：馆级最多 10 件 Research Card、自动机械检查和重复扫描。
- 必须逐件做：Luna one-shot 与失败处理。
- 馆级研究批次仍由 `scripts/run-generation-batch.mjs --stage=research` 有界并行；新单件任务由 `scripts/run-one-shot-work.mjs` 逐件隔离执行。并发只改变墙钟时间，不共享作品正文或放宽输入哈希。
- 不要求十件馆级研究全部完成才开始已锁定作品的写作；研究批次只是馆级证据准备，不是正文批次。
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
2. **因果夹具**：一个合规的 one-shot 微型 run 必须通过；旧文章、旧 Research Card、旧 Writing Plan 或漂移 metadata 进入输入必须被拒绝。
3. **两件隔离盲测**：一件叙事型绘画 + 一件历史/跨媒介对象；只给当前权威文件和资料包，不给对话或旧正文。首稿封存后再与已接受样本比较。
4. **单馆试点**：只有前三层通过后，才选一座小馆；不得直接拿 40/60 件馆调 pipeline。
5. **批次生产**：试点由 owner 接受后才恢复整馆队列。

两件测试不要求文字复现，只比较：事实覆盖、首要价值是否选择了资料支持的最高层级历史或艺术意义、快层首句是否直接给出该结论、形式机制是否服务而非取代该意义、最小解释模型是否覆盖至少三个重要细节、概念是否按前置知识顺序出现、是否先用具体事实讲懂再给专业名称、深层每段是否改变核心答案、同一事实是否避免跨栏目重复、认知推进、自然中文、对象专属性、历史主次、第二眼和固定句式。若两件暴露同一系统缺陷，先改权威规则再重跑；单件执行偏差只退回该件，不升级全局规则。

## 6. 发布边界

只有整馆全部作品达到 `integration_ready` 且没有 verifier errors，评分、卡片、图片、路线、正文和页面门全部通过，并由 owner 明确接受该馆，才能原子替换正式馆。集成只把确定性 `display-metadata.json` 写入统一作品数据，把 `draft.md` 写入正文；不得把两者串成可见段落。历史已通过的 author bundle 可继续组装旧 run，但不是新单件生成合同。`availability` 必须映射为卡片和详情可见标签；`museum_hero_placeholder` 必须映射为馆封面图、馆方链接和“馆舍占位图 · 非作品图”说明。占位图只解决图像缺失，不能作为作品的视觉证据。部分新稿不得混入生产。

馆页主卡是固定产品结构，不由每馆自由生成：只显示封面、馆名、城市、评分数字与档位、路线入口、官方链接和更新时间。共享渲染器不得在主卡显示 `verdict`、`travelAction` 或 `limitations`，也不得为删掉的段落生成替代文案；评分理由、边界和馆级主线进入下方对应正文。缓存版本必须随共享 HTML / JavaScript 同步更新，并在真实浏览器刷新后检查首屏、控制台和主要内容，静态字符串检查不能代替页面回归。

当 owner 在执行前明确批准一组既有正式作品作为**作品级内容补丁**时，可以不触发整馆重生，但必须同时满足：

- 每件作品从 locked metadata 开始完整走过当前 one-shot pipeline，不读取旧研究、旧计划或旧正文；
- 卡片简介与详情正文作为同一个补丁一起替换，不只改其中一层；
- 不改变馆级评分、选品、路线、图片或作品 ID；若新研究证明这些字段有误，停止补丁并重新确认范围；
- 每件 verifier 无 errors 且 deterministic integration 完成；
- 对每个受影响馆分别运行数据、图片、URL 和真实深链页面检查；
- run header 与 manifest 明确记录 owner 批准的补丁边界。

这是一条显式批准的维护通道，不允许自动任务把零散新稿逐步混入正式馆。manifest 继续记录当前正式版本、待迁移版本和项目验收状态，不增加“观察期”状态。

自动化只负责选择 manifest 中的下一个馆并执行本文件；自动化 prompt 应引用本文件，不得复制一份会漂移的长规则。暂停的批次在重新通过测试阶梯前不得恢复。

## 7. Pipeline 变更控制

Pipeline、内容指令、runner、机械处理器、评分处理器、作者输入预处理器或 release 冻结器发生任何变化前，必须有一份 owner 明确授权的版本化 change record。记录必须包含 owner 原话、基础 release、目标版本、允许变更的 canonical 文件和必跑测试；没有记录不得修改，也不得冻结新 release。

`scripts/freeze-pipeline-release.mjs` 必须比较基础 release 与当前 canonical 文件：发现记录范围之外的变化时直接失败。Release 保存 change record 的路径与哈希；权威门校验该记录、目标版本和所有 canonical 哈希。对话中的局部内容反馈不自动授权修改 pipeline；只有 owner 明确要求更新、修复或改变 pipeline 时才可创建新的 change record。任何会改变模型输入角色、文件数量或字节上限的改动，都必须在执行前说明成本影响并获得授权。

## 8. 历史

版本演进已原样归档到 `research/archive/contracts/generation-pipeline-history-through-M28.1.md`。当前执行合同以上文为准；历史 pipeline 不得作为运行输入。

## 9. 生成入口与整馆成本报告

- 唯一允许的模型启动方式是 `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-isolated-generation.ps1 -RunDirectory <run-dir>`。Runner 从自身位置推导项目根目录；不得手写底层 `codex exec` 命令，也不得依赖 PowerShell 的交互式必填参数提示。缺少 `RunDirectory` 必须立即失败。
- 模型路由由 manifest 与 runner 强制执行：`museum_scope` 使用 `gpt-5.6-terra` medium；馆级 `research` 仅在风险字段为空的 standard 批次使用 Terra medium，complex 批次使用 `gpt-5.6-sol` medium；候选、评分和结构保持 Sol medium。新单件正文固定使用 `gpt-5.6-luna` high，无 fallback。一个馆级研究批次不得混合两种复杂度。
- 每次真实模型运行由 runner 自动写入 `runnerStartedAt`、`modelStartedAt`、`modelCompletedAt`、`completedAt`、runner / model 用时、CLI 日志和 `tokenUsage.total`。预填的 `run-header.startedAt` 不是计时依据。
- 一座博物馆完成生成、校验和获准发布后，最后执行 `node scripts/report-museum-generation.mjs --kind=production --museum=<museumId> --run-id=<runId>`。报告固定写入 `<runRoot>/reports/generation-report.json` 与 `<runRoot>/reports/generation-report.md`，列出整馆实际用时、模型调用数、总 token，以及各阶段的墙钟用时、模型累计用时和 token。
- 并行任务按最早开始至最晚结束计算阶段墙钟时间，不把并行时段重复相加。任何真实模型 result 缺少时间或 token，报告器必须阻断，整馆不能标记完成。

## 10. 整馆机械收尾

- 内容阶段结束时必须在 `<runRoot>/structure/assembly-input.json` 交付馆身份、馆介、章节、三档路线、评分结果、作品顺序、重要性、展出标签、已核验图片与来源以及发布目标。缺少这些语义输入时停止并退回上游，不允许装配器搜索、猜测或补写。
- 候选组装统一执行 `node scripts/assemble-museum-candidate.mjs --kind=production --museum=<museumId> --run-id=<runId>`。候选固定写入 `<runRoot>/candidate/`。它优先读取每件已经通过的 one-shot integration bundle；历史 run 可读取旧 author bundle。它与 `structure/assembly-input.json` 只搬运正文与结构化数据，不得使用馆专用 builder、不得联网找图、不得重新调用模型。
- `image-evidence/verified-image-evidence.json` 由 `node scripts/resolve-museum-image-evidence.mjs --kind=production --museum=<museumId> --run-id=<runId> --fresh [--allow-model]` 在研究前生成；它只读取当前 scope、候选池和官方对象页，不读取旧网页、旧图片映射或旧资产缓存。普通请求失败时使用真实浏览器；机械信号冲突时才由标准 isolated runner 调用 Luna medium。`structure/assembly-input.json` 与兼容层 `image-evidence/verified-assets.json` 随后由 `prepare-museum-assembly.mjs` 读取已经锁定的图片证据，不再重复联网搜图。历史 run 缺少前置图片证据时只作为 `legacyLayout` 证据保留，不得成为未来新馆的正常路径。
- 当前 manifest 登记的 15 馆是 legacy baseline，不因本合同迁移。未来新馆必须在 `assembly-input.json` 提供 `integration.coordinates`，馆 ID 必须可直接作为小写 JavaScript 标识符，且只能生成 `museumData.<id> = {...}`。通用装配器自动把新馆脚本登记到候选 `index.html` 与 `museum.html` 的 `museums.js` 之后（馆页同时在 `routes.js` 之前），并自动加入首页地图坐标和排名集合；禁止任何 `binding` 配置或馆专用 builder。
- `node scripts/verify-future-museum-contract.mjs --kind=production --museum=<museumId> --run-id=<runId>` 是组装后的强制门。它检查 schema、唯一运行时绑定、两页真实脚本顺序、地图与排名注册、发布文件清单以及馆专用 builder；失败时不得进入发布验证。`finalize-museum.mjs` 固定在 assembly 与 release verification 之间执行该门。
- 全站馆数、作品数、唯一ID、路由、内容合同和本地文件继续每次全量检查。联网图片、来源页面、当前馆珍贵度审计和馆状态只检查本次发布馆：`node scripts/verify-release-candidate.mjs --kind=production --museum=<museumId> --run-id=<runId> --live`。其他馆的易变网络状态或待迁移状态不能阻挡本馆，但本馆任何真实损坏仍阻断。
- 候选必须写 `publication.json`，明确 museumId、候选到正式目录的文件映射、缓存键和缓存页面。发布只允许执行 `node scripts/publish-museum-candidate.mjs --kind=production --museum=<museumId> --run-id=<runId> --publish`；active content destination 固定为 `research/content/<museumId>.md`。脚本先暂存全部文件，失败时恢复旧文件，相同候选再次发布必须为零改动。
- 标准收尾入口是 `node scripts/finalize-museum.mjs --kind=production --museum=<museumId> --run-id=<runId> --live [--publish]`，固定串联通用组装、当前馆发布门和发布器，并把报告写入 `<runRoot>/reports/finalization-report.json`。Dry run 成功后状态可到 `verified`；真正发布成功后原子更新为 `published, immutable: true`。该入口只启动本地 Node 脚本，报告中的模型调用与模型 token 必须均为 0。
- 全部作品URL由机械门全量证明可寻址；因为所有作品共用同一渲染器，真实浏览器检查馆首屏、三条路线和至少三件代表作品（首件、末件及一件长标题/特殊状态），不再人工逐页打开全部作品。共享渲染器、URL结构或数据合同变化时，扩大浏览器样本。
