# Current project knowledge

历史事实与逐馆建设记录保存在 `coho_museum/archive/knowledge-through-M28.1-full.md`。本文件只保存执行下一项任务需要的当前事实。

## Authority routing

- 产品：`coho_museum/PRD.md`
- 技术：`coho_museum/TechDesign.md`
- 当前执行：`coho_museum/Milestones.md`
- 内容：`research/meowseum-content-instruction.md`
- 生成：`research/generation-pipeline.md`
- 当前版本、release、迁移与馆状态：`research/content-standard-manifest.json`
- 当前版本号只从 manifest 读取，不在本文件复制。

## Product inventory

- 当前产品有 15 个场馆、500 个作品或现场节点。
- 前端使用统一 `museum-app.js`。
- 首页评分运行时真源是 `ratings.js`。
- 正式内容文件是 manifest 的 `museums.*.contentFile`，并必须与前端 `contentFile` 引用一致。

## Local runtime

- Workspace: `C:\Users\surreal\Documents\Museum`
- Server: `node scripts/serve.mjs`
- Default URL: `http://127.0.0.1:8094/`
- Listener: `0.0.0.0:8094`

## Generation

- 唯一入口：`scripts/run-isolated-generation.ps1`
- 新 run 只能由 `node scripts/create-generation-run.mjs --kind=production --museum=<museum-id> --milestone=<milestone>` 创建；Milestone 只是 metadata。
- 标准启动：先按 run identity 找到合法 stage directory，再由 `scripts/run-isolated-generation.ps1 -RunDirectory <stage-dir>` 执行；Node validator 是路径 contract 唯一真源。
- 每馆完成报告：`node scripts/report-museum-generation.mjs --kind=production --museum=<museum-id> --run-id=<run-id>`；报告固定写入该 run 的 `reports/`。
- 候选正式门与发布都使用 `kind + museum + run-id`；candidate 固定为该 run 的 `candidate/`，调用者不得另选目录。相同候选重跑必须为零改动。
- 模型和 reasoning effort 读取当前 release / run header，不靠 CLI 默认值。
- 研究最多 10 件一批；每件作品独立生成 `writing-plan.json`、`card.txt`、`draft.md`。
- 作者输入合同：`content_instruction + research_card + work_context + optional research_supplement`；每类最多一份，总计不得超过 manifest 字节预算。
- `work_context` 只包含当前作品选择字段；整馆计划、pipeline 全文、预处理 / 哈希记录和其他作品不得进入作者 prompt。
- Pipeline release 只能由 manifest 指向的 owner-approved change record 冻结；越过授权 canonical 文件范围会失败；已冻结版本不可覆盖。
- reviewer 默认状态读取 manifest。
- 机械层输出提示、确定性修复和 blocker；不自动调用模型返工。
- 阶段模型路由：Scope 与无风险 standard research 使用 Terra medium；候选、复杂 research、评分、结构和作者使用 Sol medium。
- 内容母指令按 manifest 机械生成阶段视图；pipeline、manifest、PRD 和管理文件不进入模型。研究 candidate packet 必须先锁定官方身份锚点与风险，不能混合 standard / complex。
- 研究卡保留完整证据并输出 `[Rnn]` 与下游 evidence block；评分、结构默认只读紧凑索引。研究并发上限 4，作者并发上限 10，作者任务仍逐件隔离。

## Current execution state

- M26：暂停，保留真实进度。
- M27：Frye 已实现，等待 owner 内容验收。
- M28：进行中，剩余 Frye 整馆因果试点、去模板和真实页面验证。
- M28.1：已完成；五个活跃 Coho 文件减少 90.76%，release / verifier 已动态读取 manifest。
- M28.11：已通过；Pipeline 2.7.1 封存阶段视图、模型路由、身份／风险预检、紧凑索引与有界并发，未修改正式内容或 8094。
- M28.12：已完成；Seattle downtown-only 20 件以隔离 pipeline 生成并发布到 8094，评分 75，20/20 机械门通过。有效产物 1,223,634 token；被替代的研究与首次评分另耗 229,044 token；整轮墙钟 71 分 54 秒。
- 当前冻结版本只从 manifest 读取。旧馆重生也使用通用资产准备、assembly、release gate 与 atomic publisher；宿主阻挡的工作图自动降级为博物馆封面，不再发布可见破图。

## Core verification commands

```powershell
node scripts/verify-project-authority.mjs
node scripts/verify-pipeline-causality.mjs
powershell -File scripts/test-run-isolated-generation.ps1
node scripts/test-museum-generation-report.mjs
node scripts/verify-content-pipeline.mjs
node scripts/test-prepare-museum-stage-inputs.mjs
node scripts/test-run-generation-batch.mjs
node scripts/test-author-input-regression.mjs
```

## Archive rule

- `coho_museum/archive/`、`research/pipeline-releases/`、`research/pipeline-tests/` 和历史正文只作追溯证据。
- 默认任务不读取 archive；只有当前文件无法回答具体历史问题时才定向打开一份相关档案。
## 2026-07-24 - 零模型整馆收尾

- Fact: `scripts/finalize-museum.mjs` 串联通用组装、全站本地结构门、当前馆联网门和发布器；正常报告固定为 0 模型调用、0 模型 token。
- Scope: 已用维也纳 40 项和地中 20 项真实产物证明；内容研究、评分、写作和资源身份判断仍属于上游。
- Source: `research/audits/m28-9-generic-finalization.md`
- Usage: 新馆内容完成后先交付 `assembly-input.json`，再运行统一 finalizer；不得新增馆专用 builder。

## 2026-07-25 - 零模型藏品图片解析

- Fact: `scripts/prepare-museum-assembly.mjs` 依次使用已验证缓存、官方对象页元数据、严格身份匹配搜索和馆封面兜底；图片 URL 必须真实返回图片字节。
- Boundary: 搜索 provider 不可用不等于没有作品图；结果会记录为 provider unavailable，未来可重新运行资产阶段，不影响已经通过的正文。
- Seattle test: 20 件全部有可显示图片，其中 13 件为经身份确认的作品图、7 件为明确兜底图；装配、联网验证和原子发布共 1.984 秒，模型调用 0、模型 token 0。

## 2026-07-25 - 多来源图片解析 v3

- Fact: 身份包固定为题名、作者／文化、年代、机构、馆藏号与官方对象页；解析顺序为缓存、官方 Open Graph / JSON-LD / API / IIIF、直接 Commons API、Wikidata、DuckDuckGo、Bing、封面。
- Boundary: 搜索结果只是候选；必须由官方对象、馆藏号，或题名、作者、年代与机构组合确认。`not_found`、`ambiguous_identity`、`rights_or_access_blocked`、`provider_unavailable`、`broken_image` 分开记录。
- Seattle test: 7 个占位对象的官方页面与 JSON API 均返回 403；Commons 七次均成功，其中五次零候选，《巴塞罗那》10个和圣物匣3个候选均身份不符；Wikidata、DuckDuckGo、Bing均无合格匹配。最终保留13张作品图和7张带可见说明的馆封面。
- Cost: 最终资产运行29.867秒，组装、联网验证与原子发布1.829秒；模型调用0，模型token 0。

## 2026-07-25 - 上游图片证据 v4

- Fact: 作品身份锁定后先运行 `scripts/resolve-museum-image-evidence.mjs`；输出 `verified-image-evidence.json`、本地图片、来源 URL、官方页身份、尺寸和 SHA-256。研究观察与最终网页使用同一证据，组装阶段不再找图。
- Boundary: 不读取旧 `asset-cache.json` 或旧网页图片映射。浏览器与确定性身份信号可以无歧义确认时为 0 模型；只有最多 5 个候选互相冲突时才用隔离的 `gpt-5.6-luna` medium，输出一件作品一项决定。
- Seattle test: 当前官方对象页 20/20 自动确认，20 个 URL、20 个哈希均唯一，0 占位；主站 8094 的 20 张图片逐一用浏览器打开成功，4 个代表性深链通过。
- Cost: Seattle 图片解析 40.696 秒、0 模型、0 token；通用组装、验证与发布 2.741 秒。Luna 备用合同测试单独为 1 次、17,381 token、21.494 秒，不计入 Seattle 生成成本。
