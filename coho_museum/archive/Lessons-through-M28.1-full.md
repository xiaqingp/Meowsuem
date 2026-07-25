# Lessons

## 2026-07-22 - reviewer 和 owner 反馈都不是默认生成状态

- Issue: 作者 pipeline 已经能够在隔离输入下产出 owner 接受的内容，继续默认调用 reviewer 会重复检查、增加 token 与等待时间，却不能证明每次都带来等量收益。
- Decision: Pipeline 2.2.1 停用默认 reviewer。每件作品仍必须从研究卡生成一次 author bundle；机械层只做提示、确定性程序修复或重要 blocker，不创建 owner 观察状态。
- Boundary: 小型风格与长度问题只报告；格式、编码、派生字段与哈希由程序修复；只有证据追溯、产物完整性或页面基本可用性受损且程序不能安全修复时才阻塞。owner 的阅读与反馈属于正常项目协作，不写成生成步骤。
- Prevention: reviewer 的启停写进 pipeline、manifest 与 release，不允许由临时 prompt 或对话记忆暗中改变。
- Affected docs: `research/generation-pipeline.md`, `research/meowseum-content-instruction.md`, `research/content-standard-manifest.json`, `research/pipeline-releases/v2.2.1.json`

## 2026-07-22 - M28 哈希锁文件，不锁模型内部思考顺序

- Issue: 旧合同要求正文嵌入同一次作者调用中写作计划的最终哈希，既无法预先知道，也迫使一个自然的作者任务拆成额外 prompt。
- Cause: 把“证明审读的是哪些确切文件”与“证明模型内部先计划后写作”混成同一个 provenance 要求。
- Fix: Pipeline 2.1.0 将计划、卡片和正文定义为一次 `author_bundle`；runner 事后生成 `author-result.json`，记录研究卡输入及三个输出的哈希，正文不带内部元数据。
- Prevention: 哈希只承担文件身份与完整性锁定；内容质量由 claim ledger、当前启用的质量门与 owner 判断，模型内部认知顺序不做虚假的密码学证明。
- Affected docs: `research/generation-pipeline.md`, `research/pipeline-releases/v2.1.0.json`, `scripts/run-isolated-generation.ps1`, `research/content-standard-manifest.json`, `coho_museum/TechDesign.md`

## 2026-07-22 - M28 紧凑研究卡不等于低 token

- Issue: 1.7.4《秋韵》的研究卡比上一轮小约 72%，研究 token 却从 167,245 增至 216,390。
- Cause: 把研究深度误判为 token 主因；实际进程把完整规范和累计上下文带过更多工具轮次，并重复分段 / 全文读取。CLI 总数包含这些重复和 cached input。
- Fix: Pipeline 2.0.9 使用标准 runner 在模型外一次校验并装载允许输入，模型不再承担本地读取、哈希、diff 和输出机械复核；研究请求尽量批量完成。
- Prevention: token 回归同时记录研究 / 作者分项、有效总量、实际总量与工具轮次；研究卡长度只能评价产物紧凑度，不能代替运行 token。
- Affected docs: `research/generation-pipeline.md`, `scripts/run-isolated-generation.ps1`, `scripts/test-run-isolated-generation.ps1`, `research/content-standard-manifest.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 单次装载必须同时守住空输出与 provenance

- Issue: token 优化把研究降至 78,149、作者降至 50,259，但前两次基础设施错误仍留下研究卡；同时一次 author call 无法让正文预先记录同次生成写作计划的最终 SHA-256。
- Cause: Runner 只在结束后检查输出存在，没有在启动前拒绝残留输出；又把“计划与正文一次写入”误当成与 `writing_plan -> draft` 的直接上游哈希合同天然兼容。
- Fix: Runner 启动前强制声明输出全部不存在，失败目录明确封存为 INVALID；当前 clean3 稿件标记为未审且 provenance gate 失败，不因 token 显著下降而宣称 pipeline 通过。
- Prevention: 每次真实生成前先跑无内容的 CLI / runner 预检；token、内容质量和因果 provenance 分别验收，任何一项通过都不能代替另外两项。
- Affected docs: `scripts/run-isolated-generation.ps1`, `scripts/test-run-isolated-generation.ps1`, `research/content-standard-manifest.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 内容生成不得使用 pipeline 外临时 prompt

- Issue: 《秋韵》隔离测试通过临时 `research-task.md` 改变研究范围；随后又准备复用旧研究资产，均没有忠实执行用户要求的“由同一 pipeline 隔离重生”。
- Cause: 把 canonical pipeline 当作原则说明，再由根任务临时补执行细节，导致聊天判断通过 ad hoc prompt 重新进入单件流程。
- Fix: Pipeline 2.0.8 规定所有作品和博物馆生成默认聊天隔离；反馈先改 canonical 版本，run header 只传结构化数据，固定启动语不得追加内容要求。Fresh research 继续执行 M22 的批次与最低充分停止条件。
- Prevention: 任何需要额外 task spec 才能执行的要求都先写回 pipeline；旧正文永不进入生成输入，旧研究资产是否复用必须由 owner 或 run header 的明确模式决定，不能临场猜测。
- Affected docs: `research/generation-pipeline.md`, `research/meowseum-content-instruction.md`, `research/content-standard-manifest.json`, `scripts/verify-project-authority.mjs`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 隔离进程读取未列本地文件即作废

- Issue: 第一轮作者进程在读取 run header 前自行打开了本地 `ponytail` skill，违反“不得读取未列输入”；另一次启动使用本机不支持的 `skill_search` feature 名称而直接退出。
- Cause: 只在内容规范中约束允许输入，没有同时用本机实际支持的 CLI feature 集收窄运行环境，也没有把首段访问日志作为有效性门。
- Fix: 违规作者进程立即中断并记录为 `invalid_interrupted_before_outputs`；有效作者进程关闭本机支持的 apps、memories、plugins、plugin sharing 与 remote plugin，只读取 run header 和其中三项允许输入。
- Prevention: 每次隔离运行先观察首段访问记录；任何未列输入都会使整次运行作废。CLI feature 开关先以当前二进制的 `features list` 为准，启动前失败不计生成尝试。
- Affected docs: `research/pipeline-tests/v1.7.4-autumn-rhythm-fresh-isolated/run-header.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 对实质性歧义先确认再执行

- Issue: 用户要求“隔离聊天纪律”，执行时却被自行扩大为从零开始的无限制单件研究，既覆盖了 M22 的批量紧凑边界，也显著增加时间与 token；用户并未要求取消 M22。
- Cause: 遇到新要求与既有流程的组合方式不明确时，没有先确认“叠加还是替代”，而是自行选择了更彻底、更昂贵的解释。
- Fix: Pipeline 2.0.7 增加执行前歧义门；凡不同解释会改变流程、范围、成本、旧成果使用或交付形态，必须先说明分歧并向 owner 问清。
- Prevention: 新要求默认叠加到未被明确取消的既有规则；只有不影响结果的局部实现细节可以按最小合理假设继续，不能用“更彻底”代替确认。
- Affected docs: `research/generation-pipeline.md`, `research/content-standard-manifest.json`, `scripts/verify-project-authority.mjs`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 隔离测试从研究阶段开始

- Issue: 1.7.3《秋韵》的第一次所谓隔离生成，虽然作者进程没有聊天记忆，根任务却把聊天里讨论的趣闻写进研究卡，并在测试合同中强制使用，无法证明 pipeline 能独立发现并选用材料。
- Cause: 把“作者隔离”误当成“整条生成链隔离”，忽略了根任务制作资料包时同样可能把对话反馈变成对象专属暗示。
- Fix: 该运行完整封存为无效证据；新运行拆成独立研究者与独立写作者，额外任务只给作品身份和允许输入，不重复内容规则，也不提示应发现或写入什么材料。
- Prevention: 黑盒回归中，聊天反馈只能先进入 canonical 规则；研究卡必须由只读 canonical 文件的干净研究进程独立形成。任何预填对象事实、指定趣闻或隐藏验收答案都会使整次运行作废。
- Affected docs: `research/pipeline-tests/v1.7.3-autumn-rhythm-isolated-generation/INVALID.md`, `research/pipeline-tests/v1.7.3-autumn-rhythm-clean-isolated/`, `research/content-standard-manifest.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 抽象艺术评论词冒充解释

- Issue: 《秋韵》快层写“保留波洛克对整体的控制”，结论看似准确，却没有让普通读者理解控制了什么、在哪里看得出来。
- Cause: 规范要求结论有证据，但没有要求把艺术评论词继续拆成可见机制和观看效果。
- Fix: 内容规范 1.7.2 要求“控制、张力、表现力、空间感、节奏、平衡、成熟”等词逐次具体化，能直接改写成可见事实时优先删除术语。
- Prevention: 作者与 reviewer 均检查“对象是什么 / 哪里可见 / 产生什么效果”三问，任何一问缺失都不能把抽象词当作已完成讲解。
- Affected docs: `research/meowseum-content-instruction.md`, `research/content-standard-manifest.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 快层把修辞钩子当成内容重点

- Issue: “30 秒先懂”用“机关不在蛇”“别急着找名牌”等句子虚构读者的注意点和动作，次要钩子反而挤掉作品最值得理解的内容。
- Cause: 规范把具体入口、可见矛盾和认知转折设成近似必填项，又默认要求观看路线，生成者为了满足结构而制造观众状态。
- Fix: 内容规范 1.7.1 改为先选首要艺术 / 历史价值，再用一个视觉线索确认；矛盾、转折和观看动作全部改为有依据时选用。
- Prevention: 写作计划必须声明 `primaryValue` 与选择理由；无依据的“你以为 / 别急 / 先别 / 机关不在”直接退回，不以语言活泼抵偿主次错误。
- Affected docs: `research/meowseum-content-instruction.md`, `research/content-standard-manifest.json`, `coho_museum/Milestones.md`

## 2026-07-22 - M28 访客正文混入生产待办

- Issue: 《雪中猎人》封存稿在事实边界写入“图片许可信息尚未提供，发布前仍需补核”，且自动门没有拦住。
- Cause: 共用门槛没有明确区分读者需要的事实不确定性与内部制作待办；验证器又从不存在的 `## 1.` 后开始扫描，实际跳过当前稿件。
- Fix: 内容规范 1.6.8 / pipeline 2.0.4 增加访客正文生产语言硬门；自动门改为整稿扫描；失败稿封存后从相同研究卡与计划重生并由新 reviewer 通过。
- Prevention: 许可、发布、测试、prompt、生成器、reviewer 与迁移状态只进入不可发布 artifact；作者和独立 reviewer 都必须检查。
- Affected docs: `research/meowseum-content-instruction.md`, `research/generation-pipeline.md`, `scripts/verify-generation-sample.mjs`, `research/pipeline-tests/v2.0.3-full/test-spec.md`.

## 2026-07-22 - 输出字段齐全不等于 pipeline 可复现

- Issue: Frye 的研究卡、写作任务和 review 在正文完成后补齐，M22 校验仍能通过；M26 又把“一件作品一个任务”理解成必须完全串行，产生大量上下文切换。两者说明现有合同只检查最后有哪些文件，没有证明文件怎样产生。
- Cause: 内容标准、artifact schema、执行顺序和自动化 prompt 混在不同文件与对话记忆里；manifest 还把旧版测试通过写成当前 pipeline 证据。
- Fix: 新建唯一项目入口和 pipeline v2.0.3 状态机；每个产物记录直接上游哈希，研究可十件一批，计划、卡片、正文和 review 逐件独立；作者与 reviewer 使用同一份事前门槛，任何更新在同一任务完成影响回归。
- Prevention: 文件存在、mtime 和最终文字不同都不能证明因果顺序；旧测试必须明确标为历史，自动化只引用仓库内的短入口，不复制长规则。流程变更先跑低成本测试阶梯，不直接重生整馆。
- Affected docs: research/README.md, research/generation-pipeline.md, research/content-standard-manifest.json, scripts/verify-project-authority.mjs, scripts/verify-pipeline-causality.mjs, coho_museum/PRD.md, coho_museum/TechDesign.md, coho_museum/Milestones.md

## 2026-07-21 - 事实边界必须在写前锁定，不能靠成稿末尾补一句

- Issue: v1.6.1 双题材测试把猎人姿态写成人物“失望”，又把纳尔迈调色板的双面观看顺序和王权宣称写成历史动作；v1.6.2 修复事实后又密集使用否定—转折句法，正文像审核报告。
- Cause: `falsePremisesToAvoid` 只列禁止结论，没有逐条规定允许措辞；事实限制进入成稿时也没有篇内句法密度门。
- Fix: v1.6.2 增加 `claimBoundaryPlan`，v1.6.3 增加访客正文最多一处完整否定—转折骨架；两件作品使用同一资料包重跑至自动与人工门同时通过。
- Prevention: 人物心理、画面时序、图像宣称、历史重建和不可替代性必须在写前写明允许措辞与禁止升级；事实边界优先正面陈述，不能靠反复“不是……而是……”维持严谨。
- Affected docs: research/meowseum-content-instruction.md, research/m22-pipeline-contract.md, scripts/verify-generation-sample.mjs, scripts/verify-m22-pipeline.mjs, research/generation-tests/, coho_museum/TechDesign.md, coho_museum/Milestones.md

## 2026-07-21 - 研究栏目替代叙事主线会让正文失去逻辑和层次

- Issue: SMK《忧郁》快层已经说明翼人在削木棍，深层却突然以“先把她什么也没做纠正过来”开场；随后作者风格、丢勒比较、重要性与细节各自成段，信息完整但缺少推进。
- Cause: 写作阶段按研究清单逐项交付，质量门又要求“风格”出现在显式标题，促使正文服务字段而不是服务读者问题。
- Fix: 以“为什么人人都在忙，画却叫《忧郁》”重组全文；v1.6.1 要求写前保存真实读者起点、唯一核心问题和三至六步逻辑链，程序不再强制栏目标题。
- Prevention: 反驳必须能在前文或可见画面找到起点；连续两个审核栏目标题触发风险；人工签核必须能用一句话复述全文问题，并说明每段为何接在上一段之后。
- Affected docs: research/smk-content-v1.md, research/meowseum-content-instruction.md, research/m22-pipeline-contract.md, scripts/verify-content-quality.mjs, scripts/verify-m22-pipeline.mjs

## 2026-07-21 - 完成珍贵性比较不等于通过稀世珍品门槛

- Issue: SMK《忧郁》的研究卡已经说明其价值来自构图与质量而非唯一性，最终标签却仍写成“稀世珍品”。
- Cause: 旧规则要求寻找比较对象，却没有规定比较结果不支持不可替代性时必须降级；自动门又只检查 `preciousWhy` 是否存在和 `rareAssets` 是否与标签一致，形成循环自证。
- Fix: 母指令 v1.6.0 增加五维重要性判断和稀世珍品硬门；新证据清单把旧标签全部置为逐馆待审，按 M21 每日修复迁移。
- Prevention: “馆方精选、名家原作、来源完整、数量少”不得机械相加；最近比较对象仍能替代核心价值、决定性差异未知，或证据只存在于通用字段时必须降为重要藏品。发布候选必须通过全库重要性门。
- Affected docs: research/meowseum-content-instruction.md, research/significance-evidence-v1.6.0.json, scripts/verify-significance-evidence.mjs, scripts/verify-release-candidate.mjs, coho_museum/Milestones.md

## 2026-07-19 - 内容文件更新后页面仍显示缓存旧稿

- Issue: 工作区中的《胜利女神》已经加入艺术价值和稀有度比较，但用户打开的 8094 页面仍显示更新前的 Markdown。
- Cause: 页面通过普通 `fetch` 加载研究 Markdown，浏览器可以复用缓存响应；内容更新没有稳定地反映到已打开页面。
- Fix: Markdown 请求改为 `cache: "no-store"`，刷新时强制读取当前服务器内容。
- Prevention: 本地内容型原型的可编辑正文不得依赖浏览器默认缓存；每次正文验收同时检查源文件和实际页面文本。
- Affected docs: prototype/index.html, coho_museum/Lessons.md

## 2026-07-19 - 把研究结论直接做成前台“珍贵性证明框”

- Issue: 卢浮宫等作品页把 `preciousWhy` 单独显示为“它珍贵在哪里？”，与正文重复，也让解说像评分答卷；大都会原有的观看叙事反而更自然。
- Cause: 混淆了后台审核字段和前台阅读结构，以为每项研究要求都必须对应一个可见模块。
- Fix: 保留 `preciousWhy` 供研究、评分和校验使用，前台不直接渲染；将艺术价值、历史价值、稀有度和不可替代性放回最相关的正文位置。
- Prevention: 数据完整性不等于界面逐字段展示。内容验收同时检查研究证据是否完备、前台叙事是否自然；禁止用无边界的“极为罕见”替代比较。
- Affected docs: coho_museum/PRD.md, coho_museum/TechDesign.md, coho_museum/Milestones.md, research/content-method-v2.md, prototype pages

## 2026-07-19 - 只验证 90+ 资格却把旧精确分数当成重新校准结果

- Issue: 新评分规则落地后只把西雅图从 91 调整到 75；卢浮宫 97 和大都会 98 被原样保留，却把 M6 标记为完成。
- Cause: 把“通过档位硬门槛”误当成“完成三馆统一重评”，没有从零比较档内珍品密度、不可替代性、参观回报与限制，也没有证明一分差异。
- Fix: 重开 M6；三馆使用同一份结构化评分数据和同一套档内锚点重新生成分数与行动结论。
- Prevention: 评分规则变更后，所有已发布场馆必须一起重评；验证脚本要求 `calibratedAgainst` 包含当前全部场馆，并保存校准日期与档内理由。
- Affected docs: coho_museum/Milestones.md, coho_museum/Lessons.md, prototype rating data

## 2026-07-19 - 加权评分把缺少稀世珍品的场馆推入专程档

- Issue: 西雅图艺术博物馆被写成 91 分，页面含义变成值得专程来到西雅图，但现有藏品证据不能支持该结论。
- Cause: 先把馆藏、体验、建筑、地域特色和影响力加总，再解释旅行意义；没有让稀世珍品与不可替代性成为跨入 80/90 分档的硬门槛。
- Fix: 改为先定档、再档内微调；无稀世珍品或不可替代整体时最高 79，只有通过专程旅行检验才可进入 90 以上。重要作品必须独立解释珍贵性。
- Prevention: 评分数据必须引用具体珍品标识；自动校验分数、档位、专程声明和 `preciousWhy`，禁止只保存裸分。
- Affected docs: coho_museum/PRD.md, coho_museum/TechDesign.md, coho_museum/Milestones.md, research/content-method-v2.md

## 2026-07-19 - 卢浮宫内容测试：通俗化导致因果链断裂

- Issue: 为了快速讲出“米洛的维纳斯在卢浮宫成为新明星”这一有趣结论，文本写成“在法国归还拿破仑时期掠夺品后进入卢浮宫”，使读者可能误以为被归还的是维纳斯，或无法理解归还藏品与维纳斯入藏之间的关系。
- Cause: 把“通俗”误当成“尽量短”，删掉了事件主体、宾语、时间顺序和中间后果；同时把已核实事实与编辑性因果判断压进同一句话。
- Fix: 先恢复完整链条：拿破仑军队取得艺术品、法国战败后归还、卢浮宫失去古典藏品、六年后维纳斯入藏、特殊时机帮助其获得明星地位。再用短句降低语言难度，而不删除逻辑节点。
- Prevention: 所有内容必须通过“零背景读者测试”和“因果完整性检查”；快看层字数是目标而非硬限制。复杂事实宁可多写两句，也不得要求读者猜主体、对象、先后关系或事实与推断的边界。
- Affected docs: research/content-method-v2.md, research/louvre-content-v3.md

## 2026-07-19 - UI 原型错误删减核心内容

- Issue: 卢浮宫 UI 原型只保留了博物馆介绍摘要、20 件作品卡片和两件作品的部分正文；`louvre-content-v3.md` 中“这家博物馆到底特别在哪里”、完整参观方案、18 件作品正文、运营提醒与来源没有被完整接入。
- Cause: 把“先做原型验证 UI”错误理解为“可以用占位内容代替已完成正文”，又把最小实现原则用在了产品的核心价值上。虽然页面验证了布局，却没有验证内容产品本身。
- Fix: 将 `research/louvre-content-v3.md` 设为原型的唯一正文来源；界面可以分层、折叠和重新组织，但所有原文必须存在明确入口，20 件作品不得使用泛化占位文案。
- Prevention: 任何内容型界面在验收前都要做“源内容覆盖检查”：核对源文档一级章节、作品数量、每件正文、首尾运营信息和来源是否全部可访问。最小实现只能减少技术复杂度，不能减少用户明确要求的核心内容。
- Affected docs: prototype/index.html, research/louvre-content-v3.md

## 2026-07-19 - 完整内容原型遗漏了作品图片

- Issue: 卢浮宫原型虽然已经接入 20 件作品的完整正文，但只给两件作品配置了图片，其余 18 件仍显示占位符，作品卡片也没有图像，无法承担博物馆内容产品最基本的视觉识别任务。
- Cause: 验收时只统计了文字章节和正文覆盖率，把图片版权与身份核验的不确定性错误地变成了“暂时不做图片”，而没有把逐件查找、核对、记录来源作为内容制作本身的一部分。
- Fix: 为 20 件作品建立独立图片来源清单；每张图必须核对作品名、作者或馆藏编号与卢浮宫归属；卡片使用缩略图，详情页使用大图并链接到包含作者和许可的来源页。
- Prevention: 以后“完整作品页”的覆盖检查必须同时统计正文、主图、图片来源与加载状态。不得用相似作品、局部细节、展厅全景、复制品或其他馆藏的同名版本代替目标作品。
- Affected docs: prototype/index.html, research/louvre-image-sources.md

## 2026-07-19 - 详情页统一画幅裁掉作品

- Issue: 首页卡片图片完整，但进入作品详情后，横幅画、竖幅画和雕塑照片都被统一塞进 620px 高的画框，图片边缘遭到裁剪。
- Cause: 详情图使用固定高度和 `object-fit: cover`，优先填满容器而不是保留作品的原始长宽比；同时还应用了降低饱和度的滤镜，削弱了图片作为作品资料的准确性。
- Fix: 详情图改为按原始比例显示，使用 `width/height: auto`、最大宽高约束与 `object-fit: contain`；画框留出深色边距，不再裁图或修改色彩。
- Prevention: 内容型作品主图默认必须完整呈现并保留原图色彩。只有明确标注为装饰性封面或缩略图时，才允许使用 `cover` 裁切。
- Affected docs: prototype/index.html

## 2026-07-19 - 确认页面缺陷后只解释、没有立即修复

- Issue: 用户指出《加纳的婚宴》详情中混入下一章标题后，我确认这是解析错误，却只解释原因，没有修复正在运行的原型。
- Cause: 机械套用了“诊断请求不自动实施”的边界，忽略了当前对话正在共同验收已实现页面；用户指出具体异常就是对现有实现的缺陷反馈。
- Fix: 在共享 Markdown 切分逻辑中同时识别下一件作品和下一章标题，以先出现者作为正文边界；增加运行时检查，禁止任何作品正文继续包含一级章节标题。
- Prevention: 在正在验收或迭代的产品中，用户指出具体错误时默认按 bug 处理：复现、修复、验证并记录；只有用户明确要求“只分析、不要改”时才停在解释。
- Affected docs: prototype/index.html, coho_museum/Lessons.md

## 2026-07-19 - 内容质量不能用统一字数或固定标题替代

- Issue: 将一件获批样板推广到 60 件时，若只复制段落名称、满足字数或插入“它珍贵在哪里”，会得到结构整齐但判断重复的模板文。
- Cause: 把可自动检测的表面特征误当成作品解说质量本身，没有区分统一的内容职责与每件作品不同的核心矛盾。
- Fix: 固定双层阅读职责和最低证据门槛，但允许深层标题随作品变化；珍贵性分别用数量比较、作者位置、原境、技术、历史见证或传播史说明。自动脚本只拦缺段、过薄、缺来源和无边界最高级，人工负责判断因果、比较与可看性。
- Prevention: 每馆完成后执行“自动全检 + 首件/末件/跨章节浏览器抽检 + 稀世珍品人工比较审计”；不得把脚本 0 错误单独等同于内容验收。
- Affected docs: research/work-content-template.md, scripts/verify-content-quality.mjs, coho_museum/Milestones.md

## 2026-07-19 - 评分档位必须反向约束逐件正文

- Issue: 即使评分数据把西雅图放在 75 分，若逐件正文不断使用“不可替代”“必须专程”等语言，内容仍会在阅读层面把博物馆偷偷推回 80+。
- Cause: 把博物馆评分与藏品写作当成两套独立工作，只检查分数结构，没有检查正文是否制造与档位冲突的旅行理由。
- Fix: 西雅图 20 件逐篇区分地域价值、场地体验和世界级稀缺性；说明重要作品为什么值得看，也明确它们不能单独支撑专程旅行。四馆完成后同时复核评分证据与正文语义。
- Prevention: 后续新增博物馆时，质量审核必须双向进行：珍品证据能否支撑档位，以及全部单件正文合起来是否越过或削弱该档位；不得靠夸张单件文案补偿较低馆评分。
- Affected docs: prototype/ratings.js, research/seattle-content-v2.md, coho_museum/Milestones.md

## 2026-07-19 - 独立渲染器造成卡片字段与导航能力漂移

- Issue: 通用馆卡片已有作者和年代，卢浮宫卡片却没有；重要性只在详情显示；80 件作品都依赖弹层状态而没有可分享、可刷新的独立 URL。
- Cause: 卢浮宫与通用馆使用两套渲染器，验收主要检查正文和图片，没有把卡片字段、品牌与浏览器导航定义为跨页面产品契约。
- Fix: 两类卡片统一展示重要性、参观优先级、作者或文化和年代；稳定作品 ID 写入查询参数，并用原生 History API 恢复详情；静态校验同时检查两份页面。
- Prevention: 任何跨馆 UI 要求都必须在卢浮宫和通用馆两个入口分别验收；作品 ID 不只是数据键，也是分享、刷新、历史导航和未来打卡的稳定产品标识。
- Affected docs: prototype/index.html, prototype/museum.html, scripts/verify-three-museums.mjs, coho_museum/PRD.md, coho_museum/TechDesign.md

## 2026-07-19 - 深链验收必须覆盖规范地址与直达落点

- Issue: 第一轮只给作品加了查询参数，遗漏了卢浮宫馆级 URL 和所有章节 URL；随后章节虽有片段地址，首次直达又被页面切换重置到页首，作品地址还会继承章节片段而产生多个 URL。
- Cause: 把“链接上有参数”当成深链完成，没有逐层定义地图、馆、章节、作品的地址归属，也没有验证复制地址、刷新、前进/后退后的实际落点。
- Fix: 明确四级 URL 契约；馆页与章节恢复逻辑读取查询参数和片段，作品打开时清除片段并保持单一规范地址；无效通用馆 ID 规范化到默认馆地址。
- Prevention: 每次新增可分享实体，都要同时验收唯一性、直达、刷新、前进、后退与关闭返回；路由测试必须从有片段的上级页面进入下级，防止继承状态污染规范 URL。
- Affected docs: prototype/index.html, prototype/museum.html, scripts/verify-three-museums.mjs, coho_museum/TechDesign.md, coho_museum/Milestones.md

## 2026-07-19 - 样板功能必须升级为产品能力

- Issue: 卢浮宫已有 90 分钟、半天和完整路线，后来新增的三馆却只有章节和作品清单。
- Cause: 路线被留在卢浮宫专用页面中，扩馆时只复用了卡片和详情，没有先判断样板中的哪些能力属于所有博物馆。
- Fix: 将三档攻略定义为统一数据契约和共享组件；四馆人工配置作品顺序，并显式说明大都会 Cloisters、西雅图三馆址、轮换与不可见状态。
- Prevention: 从单馆样板扩展到多馆时，先做能力清单；每项能力只能被明确归类为“全局必备、数据可选或确实专属”，不得因为实现文件不同而自然消失。
- Affected docs: prototype/routes.js, prototype/museum-app.js, prototype/museum.html, coho_museum/PRD.md, coho_museum/TechDesign.md

## 2026-07-19 - 内容规则分散不能保证下一馆一致

- Issue: 顾爷样本方法、作品结构、评分、珍贵性和作者风格分别保存在多份文件里，无法证明未来生成任务会完整读取同一套标准。
- Cause: 先后修补局部问题时增加了指南和模板，却没有建立一个有版本和审核状态的唯一规范入口。
- Fix: 合并为 `research/meowseum-content-instruction.md` v1.0.0，删除平行的声音指南与作品模板，并用 `research/content-standard-manifest.json` 追踪逐馆合规状态。
- Prevention: 任何内容规则变化先升级母指令并使受影响场馆退回待审；校验器只验证这一个入口，不允许新增第二份规范文件。
- Affected docs: research/meowseum-content-instruction.md, research/content-standard-manifest.json, scripts/verify-content-quality.mjs, coho_museum/TechDesign.md, coho_museum/Milestones.md, coho_museum/knowledge.md

## 2026-07-19 - 结构合规不证明生成质量

- Issue: 母指令 v1.0.0 的隔离首稿通过结构检查，却把画布尺寸推成资料未支持的“真人尺度”。
- Cause: 原规则要求来源和事实边界，但没有强制成稿逐句区分来源事实、直接观察和编辑推断。
- Fix: v1.0.1 增加逐句证据类型检查和明确反例；同一资料包在全新隔离会话重跑，通过自动、事实/编辑和独立声音三道门。
- Prevention: 新版本必须用未写过的对象做黑盒生成；首稿封存后再评分，失败只修改母指令并在新会话重跑，不能反向修改资料或门槛。
- Affected docs: research/meowseum-content-instruction.md, research/generation-tests/, research/content-standard-manifest.json, scripts/verify-generation-sample.mjs

## 2026-07-19 - 首页首先要完成旅行决策，不是充当宣传封面

- Issue: 旧首页用超大标题占据首屏，抽象地图信息密度低，右侧列表和馆预览重复选择结果；用户无法在一个画面里比较四馆并理解分数如何影响行程。
- Cause: 把“内容优先”误解成用编辑式大标题表达理念，却没有把首页的核心任务拆成评分解释、跨馆比较、空间定位、理由和下一步入口。
- Fix: 将首屏改为旅行决策台：评分档位直接可见，地图与排序列表共享选择状态，当前馆理由和 CTA 固定在比较区内；地图诚实标注为位置示意。
- Prevention: 扩馆或改首页时，桌面验收必须确认用户无需滚动即可回答“有哪些馆、各自多少分、分数是什么意思、当前馆为什么是这个分数、如何进入馆页”；品牌叙事不得挤占这五项信息。
- Affected docs: prototype/index.html, coho_museum/Milestones.md, coho_museum/Lessons.md

## 2026-07-19 - 首页体验变更必须先讨论并获得明确确认

- Issue: 用户只要求重新设计首页时，直接实现了一套包含评分教学、地图侧栏和使用方法的复杂方案，之后才发现产品层级与用户预期相反。
- Cause: 把“可以自主完成 UI 细节”错误扩展成了“可以自行决定首页信息架构”，没有先用低成本文字方案确认主要区域和内容取舍。
- Fix: 停止继续修改，逐项确认固定数量、产品说明、地图、侧栏、排名、推荐理由和评分规则；收到“开始做吧”后才按确认结构执行。
- Prevention: 首页、馆页或藏品页的信息架构变化必须先给出文字结构并等待明确执行指令；讨论阶段不改代码或项目基线，确认后才实现和记录。
- Affected docs: prototype/index.html, coho_museum/PRD.md, coho_museum/TechDesign.md, coho_museum/Milestones.md

## 2026-07-20 - 内容容量必须由馆藏结构决定，场址边界必须进入数据门禁

- Issue: 用统一 20 件套在超大型综合馆会漏掉馆藏结构；把 Seattle Art Museum 的三个场址合并又会夸大 downtown 主馆的内容密度。
- Cause: 把“统一内容标准”误当成“统一作品数量”，并且没有把场址作为选品、路线和深链的共同约束。
- Fix: 五馆按 60/60/30/20/20 校准；Seattle 20 件全部限定 downtown 主馆；大都会的同件作品局部条目改为两件独立藏品。
- Prevention: 新馆先声明容量与场址范围，再生成清单；结构门同时检查数量、唯一作品 ID、章节、路线和场址边界，内容门仍统一执行 v1.3.1。
- Affected docs: research/meowseum-content-instruction.md, research/content-standard-manifest.json, museum-expansions.js, routes.js, scripts/build-m11-content.mjs

## 2026-07-20 - SAM 馆方媒体端点通过自动门但浏览器热链失败

- Issue: 西雅图《画室》和《弗雷兴制陶师》的卡片使用 SAM `internal/media/dispatcher` 地址，真实浏览器中图片损坏。
- Cause: 发布核验把来源站的 403 归为 host-blocked；这能避免误报 404，却不能证明图片允许第三方页面热链。
- Fix: 两件作品分别改用可直连、内容核对正确的华盛顿大学与 MoMA 图像，并单独记录图片来源页；作品资料仍指向 SAM 馆藏页。
- Prevention: 被自动检查归为 host-blocked 的图片不能视为已验收；新增图片至少在实际卡片和深链各检查一次 `naturalWidth > 0`。
- Affected docs: museum-expansions.js, coho_museum/Lessons.md

## 2026-07-20 - 固定内容职责被误做成固定句法

- Issue: 维也纳作品虽然都具备“快层、深层、最后一眼”，但批量数据把快层写成大量“先看……再看……”，结尾又由同一字符串公式生成，读起来像换名填空。

## 2026-07-22｜研究可以批量，正文不能批量化

- Lesson: 十件一包只用于复用事实、比较对象和来源；发布正文仍保持一个任务一个作品，批次编号不得进入写作结构。
- Guardrail: `verify-m22-pipeline.mjs` 强制研究包不超过十件、写作任务只有一个 `workId`、任务覆盖与事实卡一一对应；`verify-content-pipeline.mjs` 继续禁止脚本写正文。
- Verification: 维也纳 v2 的 40 件正文在定向质量门首次检查为 0 个失败作品，浏览器逐页检查 40/40 通过；这是可审计的返工下降证据。
- Boundary: prompt 数增加不等于 token 一定增加或减少；没有运行时 token 计数时，只报告可观测的研究复用、失败作品数和返工数。
- Cause: 把获批样稿拆成字段后，用程序拼接正文；自动门只检查段落、长度与来源，没有连续比较同馆文章的开头和收束。
- Fix: 生成脚本只能序列化已完成正文，不能承担写作；每篇先由对象证据确定独有问题，再手写快层和结尾。新增全馆去标题连读与五篇窗口重复开头警戒。
- Prevention: 新馆交付前必须证明“遮住标题仍能辨认对象”；结构一致只保证信息职责，不允许复用命令词、动作顺序或万能第二眼。
- Affected docs: research/meowseum-content-instruction.md, scripts/verify-content-quality.mjs, coho_museum/Milestones.md

## 2026-07-21 - 构建脚本越权生成正文

- Issue: 六馆共 180 件内容由资料字段、轮换句库和取模规则拼成，表面满足双层结构，实际产生大量可互换的开头、过渡、事实边界和结尾。
- Cause: 执行时把统一内容职责误成统一句法，并让自动门只检查首句、字数和结构；母指令已有禁令，但构建层没有强制阻止写作脚本。
- Fix: 退役四个正文生成脚本，新增管线硬门；只有批准的组装脚本可以写入内容 Markdown，网页正文失败时不再用摘要拼成三段伪正文。
- Prevention: 正文必须在构建前逐件完整写好；六馆审核状态退回，180 件重写并完成人工声音与事实审核后才能恢复合规。
- Affected docs: scripts/verify-content-pipeline.mjs, scripts/verify-content-quality.mjs, scripts/verify-release-candidate.mjs, museum-app.js, museum.html, research/content-standard-manifest.json, coho_museum/Milestones.md

## 2026-07-20 - 地方解释力和名家名单造成档内评分漂移

- Issue: Anchorage 因地方性和跨学科解释被推到 79，西雅图旧评分理由又继续引用已排除的另外两个 SAM 场馆；档内数字没有使用同一锚点。
- Cause: 把地方解释力、馆藏数量、长期借展和名家名字当成相互独立的加分项，且未区分“名家作品”与“重要代表作”。
- Fix: 内容指令升级为 v1.5.0，补全 70 / 80 / 90 档内部锚点和防重复规则；九馆重新校准并修正西雅图场址边界。
- Prevention: 新增或改分必须记录珍品线、专程旅行检验、档内锚点和扣分理由；同一优势只能计算一次，所有已发布馆必须同时回归比较。
- Affected docs: ratings.js, research/meowseum-content-instruction.md, research/content-standard-manifest.json, research/audits/nine-museum-rating-calibration-v1.5.0.md, coho_museum/PRD.md

## 2026-07-21 - 只审核正文文件会漏掉首屏与卡片文案

- Issue: 阿尔罕布拉 30 篇 Markdown 已重写，但馆页首屏结论、评分理由和多张卡片仍连续使用“不是……而是……”及“先别……”等固定句法；用户打开页面立即看到问题。
- Cause: 验收范围被错误限定为内容 Markdown，没有按真实渲染链检查 `ratings.js`、博物馆数据、卡片与阅读页共同构成的用户可见文案。
- Fix: 重写首屏、评分、馆介、章节标题和 30 张卡片摘要，并在浏览器中对完整馆页统计可见固定句式。
- Prevention: 内容验收的单位是用户可见页面，不是某个源文件；以后每馆必须分别检查首屏、评分区、馆介、章节、全部卡片和代表性深链后才能宣布完成。
- Affected docs: ratings.js, alhambra.js, museum.html, research/audits/alhambra-m21-rewrite-v1.5.0.md

## 2026-07-22 - 深链验收必须等待完整页面初始化

- Issue: 浏览器批量改变查询参数时，旧文档仍短暂保留馆页 DOM，第一次检查误把 40 个作品深链判断为未打开。
- Cause: 验收只等待 `domcontentloaded`，没有确认作品阅读层已经根据新查询参数完成初始化。
- Fix: 每个深链刷新后检查阅读层打开、作品标题、快速层、事实边界、四个观察点和图片；开罗 40/40、地中 20/20 通过。
- Prevention: 深链门以后以阅读层状态和作品标题为完成信号，不以地址栏变化或通用页面载入事件代替。
- Affected docs: research/audits/egyptian-m21-rewrite-v1.5.0.md, research/audits/chichu-m21-rewrite-v1.5.0.md
## 2026-07-21 - 卡片简介与详情快层必须独立写作

- Issue: 埃及博物馆把同一个 `w[9]` 同时作为详情观看入口和卡片简介，导致“先看”等现场导览口令出现在扫读卡片中。
- Cause: 数据映射复用了已写好的详情字段，页面虽然没有现场生成文字，内容职责仍被合并。
- Fix: 为 40 件作品建立独立 `cardSummary`，删除缺失时从 `look` 自动摘句的运行时兜底，并增加复用与命令式开头检查。
- Prevention: 新馆卡片回答“为什么值得点开”，详情快层回答“为什么值得看 + 怎么看”；两个字段必须分别写作、分别审查。
- Guardrail: M22 合同要求每个单件任务交付 `cardSummary` 与 `detailMarkdown`；单件样本门检查长度、命令式开头和快层复用，结构门对埃及馆及所有未来新增馆默认启用分离检查。旧馆只保留在显式迁移名单中，完成 M21 后移出。
- Audit note: 判断复用必须比较页面实际读取的详情 Markdown，不得拿未参与渲染的兼容字段 `look` 代替；否则会把已经独立写作的馆误报为待修复。

## 2026-07-21 - 校准样稿的进步必须编码为认知依赖和断言闭环

- Issue: 《忧郁》经过多轮迭代形成了“读者疑问 → 发现 → 改变理解 → 下一问”的叙事推进，但双题材测试最初只把这些成果抄成主题清单和评分项；《雪中猎人》和《纳尔迈调色板》表面覆盖了相同内容，段落仍可互换，且重写时会新长出资料未支持的历史与仪式结论。
- Cause: `logicSequence` 只记录“这一段谈什么”，没有记录“它改变了什么理解、为何必须接在这里”；事实审查又只覆盖写前计划中的断言，没有检查成稿临时新增的高风险句子。
- Fix: v1.6.4 将逻辑序列改成 `discovery / changesUnderstanding / thereforeNext`，并要求逐段依赖审读；v1.6.5 再对成稿的心理、先后、寓意、用途、意图、最高级和不可替代性做逐句证据闭环，任何计划外高风险断言都会使该轮失败。
- Prevention: 新作品不得把 owner 当作逐轮审稿人。内部流程固定为“生成 → 对照校准样稿审读 → 修改唯一母指令和共享门禁 → 用原始资料包重生”；只有叙事依赖、事实闭环和声音三者同时通过的版本才作为首个可见稿交付。
- Affected docs: research/meowseum-content-instruction.md, research/m22-pipeline-contract.md, scripts/verify-m22-pipeline.mjs, scripts/verify-generation-sample.mjs, research/generation-tests/, research/content-standard-manifest.json, coho_museum/Milestones.md

## 2026-07-22 - 证据边界不能退化成馆方网页边界

- Issue: 双题材测试把“初始资料包没有授权”直接当作删句理由，实际上混淆了资料收集范围与事实置信度，容易把解释写成馆方展签的保守复述。
- Cause: 高风险断言表只记录来源是否存在，没有同时判断来源质量、独立性、学术共识程度和断言本身的强弱。
- Fix: v1.6.6 使用“置信度与断言强度匹配”：官方资料不再是唯一入口；学术目录、论文、专著、权威研究者和多源共识均可支撑正文。审读发现有价值的新判断时先扩充研究卡，再决定保留、限定或删除。
- Prevention: 易变运营事实仍优先使用馆方；“第一、唯一、作者明确意图”等强断言仍需覆盖相应比较范围。普通历史背景与主流解释达到高置信度即可自然讲述，不因最初资料包篇幅有限而机械删除。
- Affected docs: research/meowseum-content-instruction.md, research/m22-pipeline-contract.md, scripts/verify-m22-pipeline.mjs, research/content-standard-manifest.json, coho_museum/TechDesign.md, coho_museum/Milestones.md

## 2026-07-22 - 抽象规划不是中文正文，提到事件名也不是讲清历史

- Issue: 正式埃及馆把研究层的“发明法老视觉形象”直接写成“两面石板怎样发明法老的样子”，读起来像生硬翻译；同一篇虽然数次写到“上下埃及统一”，却没有说明南北两地、渐进统一、纳尔迈所处节点和解释争议。
- Cause: pipeline 只审逻辑依赖和事实边界，没有要求把抽象规划重新写成母语中文；历史门只检索事件词是否出现，错误地把“提到统一”当成“解释统一”。测试稿与正式内容迁移又分离，导致研究目录进步没有进入网站。
- Fix: v1.6.7 增加 `historicalContextPlan`、一句话口语复述、翻译腔发现表和连续朗读；价值依赖历史变化时必须交代变化前、冲突或转型、作品角色、后果与争议。manifest 另记全馆迁移状态，测试通过不得替正式页面合规。
- Prevention: 规划字段可以抽象，发布标题和正文必须落回具体人、动作、物件与历史变化；每次规则升级都扫描全部已发布馆，并把受影响馆放入逐馆修复队列。
- Affected docs: research/meowseum-content-instruction.md, research/m22-pipeline-contract.md, scripts/verify-m22-pipeline.mjs, scripts/verify-content-quality.mjs, research/content-standard-manifest.json, research/generation-tests/, coho_museum/Milestones.md
