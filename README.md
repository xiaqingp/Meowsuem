# Meowseum

Meowseum 是一个中文博物馆旅行内容产品：先判断一座馆是否值得进入行程，再按馆藏密度用 20、30、40 或 60 件精选内容和三档路线帮助现场观看。

这份 README 是仓库的执行说明书。新增或修复博物馆时，从这里开始；具体内容标准、字段合同和冻结版本仍以“权威文件”一节列出的文件为准。

## 当前正式版本

- 范围：卢浮宫、大都会艺术博物馆、大英博物馆、埃及博物馆（解放广场）、阿尔罕布拉宫、新嘉士伯美术馆、木心美术馆、西雅图艺术博物馆、维也纳艺术史博物馆、江之浦测候所、Anchorage Museum、Getty Center、地中美术馆、丹麦国立美术馆、Frye Art Museum、丹麦设计博物馆（Designmuseum Danmark）、瑞典国家博物馆（Nationalmuseum）
- 内容：17 馆、540 个作品或现场节点、105 个章节
- 当前 pipeline release：`2.13.39`
- 正式入口：`http://127.0.0.1:8094/`
- 丹麦设计博物馆：`http://127.0.0.1:8094/museum.html?id=designmuseum-danmark`

作品数量：卢浮宫、大都会与大英各 60 件；维也纳艺术史博物馆与埃及博物馆各 40 件；阿尔罕布拉、新嘉士伯、丹麦国立美术馆与 Getty Center 各 30 项；西雅图、Frye、木心、江之浦、安克雷奇、地中美术馆与丹麦设计博物馆各 20 项。

## 1. 启动与浏览

在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1
```

默认监听 `0.0.0.0:8094`。如需换端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1 -Port 8095
```

不要双击或提交个人机器上的临时启动脚本；仓库统一入口是 `scripts/serve.ps1`。

## 2. 权威文件

- 内容母指令：`research/meowseum-content-instruction.md`
- 生成流程与阶段合同：`research/generation-pipeline.md`
- 内容项目入口与历史文件边界：`research/README.md`
- 当前版本、逐馆审核状态和 active PCR：`research/content-standard-manifest.json`
- 冻结 pipeline release：`research/pipeline/releases/v<version>.json`
- Pipeline 变更请求：`research/pipeline/changes/PCR-*.json`
- 作品重要性证据：`research/significance-evidence-v1.6.0.json`
- 评分唯一数据源：`ratings.js`
- 统一渲染器：`museum.html` + `museum-app.js`

不要直接修改已冻结 release 或它引用的历史 PCR。任何 pipeline 行为变化都必须新建 PCR、提升版本并冻结新 release。

## 3. 新馆标准生成

以下命令均在仓库根目录执行。先执行无写入的环境检查；它会验证 Node.js 20+、PowerShell、Codex、Playwright、浏览器、canonical 文件与冻结版本：

```powershell
node .\scripts\check-pipeline-readiness.mjs --mode=live
```

然后设置博物馆 ID，并在创建不可复用的 production run 时一次写入最小 museum request：

```powershell
$museumId = "<museum-id>"
$run = node .\scripts\create-generation-run.mjs `
  --kind=production `
  --museum=$museumId `
  --museum-name="<museum name>" `
  --city="<city>" `
  --country="<country>" `
  --milestone=<milestone> | ConvertFrom-Json

$run.runId
```

执行完整 canonical pipeline：

```powershell
node .\scripts\run-museum-pipeline.mjs `
  --kind=production `
  --museum=$museumId `
  --run-id=$run.runId
```

Pipeline 按以下顺序运行：

1. `museum_scope`
2. `museum_discovery`
3. `planning_research`
4. `museum_selection`
5. `rating`
6. `museum_structure`
7. `image_evidence`
8. `locked_metadata`
9. `single_work`
10. `publication_plan`
11. `assembly_publish_dry_run`
12. `generation_report`

常用控制参数：

- `--until=<stage>`：只运行到指定阶段。
- `--only-work=<work-id>`：只重跑一个作品。
- `--retry-failed`：只重试失败项。
- `--dry-run`：只报告哪些阶段将会运行，不改变 run 状态、不写 orchestrator result。
- `--continue-from=<stage>`：只用于已获批准的下游补丁续跑；缺少任一上游产物时立即停止，不会自动全量重跑。

CLI 会拒绝未知参数。不要在参数拼写错误后尝试绕过门禁。

单件重试从所有锁定作品的当前结果重建全馆报告，不会用最后一次局部重试覆盖其余作品。默认每件作品最多 4 次、累计 400,000 tokens；同一验证失败指纹连续出现 2 次时暂停，不再调用模型。报告会列出 `failureCodes` 和 `retryGuardBlocked`，修复上游原因后再启动新的获批续跑。

一次 run 是不可变证据。失败后不要覆盖原目录；创建新的 experiment run，并通过 parent 参数保留因果链。

## 4. 图片解析与修复

Pipeline 2.13 的图片顺序固定为：

1. 优先调用官方 API / IIIF。
2. Luna 读取官方 URL，按页面结构生成本页专用抓取计划；解析 `src/currentSrc`、lazy-load 属性、JSON-LD、IIIF、作品标题和作者关系。
3. Wikidata + Wikimedia Commons fallback。
4. 仍未解决时，Luna 执行开放网络 AI 搜索。

候选图片只有在身份、来源、文件格式与内容哈希门禁通过后才可写入作品。共享页面会先绑定作品卡片；通用 logo、hero/banner、重复图片和无法证明作品身份的候选不会被误当作作品图。

### 分批修复失败图片

每次最多 10 件，且每次都创建新的 experiment run：

```powershell
$museumId = "<museum-id>"
$caseId = "<repair-case-id>"
$repair = node .\scripts\create-generation-run.mjs `
  --kind=experiment `
  --museum=$museumId `
  --case=$caseId `
  --milestone=<milestone> | ConvertFrom-Json

$env:MEOWSEUM_CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"

node .\scripts\retry-failed-image-evidence.mjs `
  --parent-kind=production `
  --parent-museum=$museumId `
  --parent-run-id=<production-run-id> `
  --case=$caseId `
  --run-id=$repair.runId `
  --only-works=<work-id-1,work-id-2> `
  --allow-model=true
```

如果上一批也是 experiment，把 parent 改为：

```text
--parent-kind=experiment --parent-case=<previous-case> --parent-run-id=<previous-run-id>
```

只在一个最终 repair run 已覆盖全部目标作品、每项均为可靠作品图且哈希互不重复时执行 promotion：

```powershell
node .\scripts\promote-image-repair.mjs `
  --run-root=<research/runs/experiment/...> `
  --museum=$museumId
```

Promotion 只更新 `image`、`imageSource`、`imageKind`，并复制已验证图片；不会改写正文和锁定元数据。无法可靠解析时保留“暂无可靠作品图”，不要用相似作品或网页装饰图代替。

## 5. 验证

全部无模型测试（包括三作品 mock E2E 到 publish dry-run）：

```powershell
node .\scripts\check-pipeline-readiness.mjs --mode=mock
node .\scripts\run-pipeline-tests.mjs
```

### Pipeline 2.13 图片模块

```powershell
node .\scripts\test-image-resolution-v2.mjs
node .\scripts\test-image-providers.mjs
node .\scripts\test-two-level-image-resolution.mjs
node .\scripts\test-promote-image-repair.mjs
node .\scripts\verify-project-authority.mjs
node .\scripts\freeze-pipeline-release.mjs
```

### 正式发布候选

真实发布前先在 `research/content-standard-manifest.json` 登记 `museums.<museum-id>.contentFile`。发布器会在写入任何生产文件前检查该路径；未登记或正文路径不一致时直接停止，避免页面与权威 manifest 形成半发布状态。

```powershell
node .\scripts\verify-project-authority.mjs
node .\scripts\verify-pipeline-causality.mjs
node .\scripts\verify-significance-evidence.mjs --museum=$museumId
node .\scripts\verify-release-candidate.mjs --museum=$museumId
```

外部资源检查另运行：

```powershell
node .\scripts\verify-release-candidate.mjs --live --quiet
```

馆方或 Wikimedia 对自动请求返回 403/429 时，脚本标记为站点限制，不等于资源损坏；这些链接必须在桌面浏览器验收。404、非图片响应、身份不匹配或哈希冲突是真实故障。

网页验收至少检查首页入口、馆页中英文名、路线与章节、20 件作品、作品详情标题、正文 warning 图标，以及图片和来源链接。发布不能因为小 warning 被阻止；小 warning 只显示为可点击感叹号。高风险正文陈述应在对应字段旁显示 warning，大范围阻断只留给结构缺失、身份错误、无法发布或严重证据问题。

## 6. 修改 Pipeline

1. 新建 owner-approved PCR：`research/pipeline/changes/PCR-<date>-<slug>.json`。
2. 修改实现和测试。
3. 更新 `research/content-standard-manifest.json` 中的 `pipelineVersion`、`currentRelease` 和 `activePipelineChange`。
4. 跑完相关单测与发布候选门禁。
5. 冻结 release：

```powershell
node .\scripts\freeze-pipeline-release.mjs
```

若输出 `already frozen`，必须确认当前文件哈希与 release 一致；不能回写旧 release。测试失败时保留 run 证据，创建下一次 run 或新的 PCR，不要覆盖历史。

## 7. Git 发布

先确认变更范围，不要把本地临时脚本、缓存或无关文件一起提交：

```powershell
git status --short
git diff --stat
```

然后显式暂存本次文件，提交并推送：

```powershell
git add <本次文件和目录>
git diff --cached --check
git commit -m "<清楚描述本次发布>"
git push origin main
git status -sb
git rev-parse HEAD
git rev-parse origin/main
```

最后两个 commit hash 必须一致，才表示本地与远端已同步。

## Pipeline 2.13.39 改动摘要

- One-shot prompt 明确 `upstreamConflicts` 的完整字段；已接受的建筑空间上下文图在单件输入层映射为合法 `object_image`，原图片证据仍保留 context 状态。

## Pipeline 2.13.38 改动摘要

- Image retry promotion 接受 verified-image v2 的对象图与上下文图通过状态；unresolved 仍阻断。

## Pipeline 2.13.37 改动摘要

- Failed-image retry 与主 resolver 共用精确官方对象页 OG 身份信号，避免匿名作品主图被相关文章卡片挤出候选前五。

## Pipeline 2.13.36 改动摘要

- 精确官方对象页标题与锁定作品题名匹配时，可把该页 OG 主图作为高置信对象图；匿名器物不再因缺少作者字段误失主图，通用 museum hero 仍拒绝。

## Pipeline 2.13.35 改动摘要

- 共享模型 JSON 恢复器可保守清理完整值与容器闭合符之间的尾随噪声，复用已完成图片结果而不重复调用模型。

## Pipeline 2.13.34 改动摘要

- Discovery 明确要求候选池使用数字 `schemaVersion: 1`，禁止把 pipeline release 版本写入 schema 字段。

## Pipeline 2.13.33 改动摘要

- 新 agent 冷启动增加 live/mock readiness 检查与单命令全测试入口。
- CLI 拒绝未知参数，`--dry-run` 不再改变 run；creator 可原子写入最小 museum request。
- release verifier 从 `museum.html` 自动读取真实数据脚本，不再维护会漏馆的手工名单。
- orchestrator、retry promotion 与 image report 全部在边界校验 verified-image schema v2。

## Pipeline 2.13.32 改动摘要

- verified image evidence schema 统一到 v2；resolver、retry、repair 写前校验，locked metadata、publication plan、image promotion 读时校验。
- 对齐 `identityEvidence`、source URL、capture geometry 以及 status/policy/selected 条件关系。

## Pipeline 2.13.31 改动摘要

- 共享 page capture helper 在截图前强制移除明确的 fixed cookie/consent dialog，调用方无法绕过 overlay 清理。

## Pipeline 2.13.30 改动摘要

- thumbnail fallback 只用于定位对象页，最终截取官方图库当前主图；抓图前统一关闭 cookie overlay。

## Pipeline 2.13.29 改动摘要

- 同媒体 ID 的图片绑定先按显示面积选择主图，再以 URL 精确匹配作次级判断；补齐 Nationalmuseum active content 注册。

## Pipeline 2.13.28 改动摘要

- 图库 thumbnail fallback 会绑定同一媒体 ID 的最大主图；包含多张图片或明显大于目标元素的容器截图禁止验收。
- 新增 deterministic invalid-capture repair，只修复错误图片资产，不重跑作品内容或上游阶段。

## Pipeline 2.13.27 改动摘要

- future museum 地图契约接受 JavaScript 对象中等价的带引号 museum slug，覆盖含连字符的合法 museum ID。

## Pipeline 2.13.26 改动摘要

- publication plan 合并哈希锁定的 identity localization overlay，并把 overlay 纳入 input hashes。
- publication plan 接受当前 verified-image 状态，并为 capture 图使用 verified source page URL。

## Pipeline 2.13.25 改动摘要

- single-work runner 复用 canonical run descriptor 的续跑版本校验，不再额外要求 run 原始版本等于当前 manifest。
- 未授权旧版本仍由文件系统契约拒绝，已授权补丁续跑可进入正文阶段。

## Pipeline 2.13.24 改动摘要

- locked metadata 对直接下载图使用图片 URL，对 clipped-container capture 使用已验证的 source page URL。
- capture 的 `url: null` 继续符合图片 schema，不再被下游误判为缺少来源。

## Pipeline 2.13.23 改动摘要

- Discovery 明确要求 `title.zh/title.en` 和双语 artist/culture 字段，并在生成后立即校验；`title.sv + artist` 不再进入研究阶段。
- 新增哈希锁定的 metadata-only localization overlay，用于修复旧 run，不修改 candidate pool，也不重跑研究、选品、评分、结构或图片。
- locked metadata 只在 candidate pool 与 selection 哈希未变化时合并 overlay，并逐件要求完整本地化。

## Pipeline 2.13.22 改动摘要

- locked-metadata preparer 接受 verified-image schema 的 `object_image_accepted` 与 `context_image_accepted` 状态。
- 保留旧 fixture 的 `accepted` 兼容，但继续拒绝 unresolved/provider unavailable。

## Pipeline 2.13.21 改动摘要

- 新增 image-retry 到原 production run 的机械 promotion，验证完整父证据链、图片哈希和重复图片 gate。
- promotion 复制已验证 assets、保留旧 evidence，再原子替换 production evidence；不调用模型、不重跑上游。

## Pipeline 2.13.20 改动摘要

- failed-image retry 只在官方/已知来源页完全没有图片候选时使用 Commons fallback。
- 官方页已有候选时保留官方页给模型绑定，低分但相关的官方候选不再被零分无关 fallback 覆盖。

## Pipeline 2.13.19 改动摘要

- 模型 JSON 恢复改为从根闭合符向前调用原生 `JSON.parse`，避免自定义括号扫描误判字符串内容。
- 已登记补丁续跑的可写 run 若在修复点失败，可由同一显式续跑授权恢复为 `running`，复用已有阶段产物。

## Pipeline 2.13.18 改动摘要

- 图片模型输出统一提取首个完整 JSON 值，再执行原有 schema、数量和候选 ID 校验；尾随非 JSON 字符不再令有效结果整批丢失。
- failed-image retry 在模型输出和 stage result 已存在时复用结果，避免解析阶段失败后重复调用模型。

## Pipeline 2.13.17 改动摘要

- 版本续跑判断集中到文件系统契约；validator、batch runner 与隔离 runner 不再各自维护冲突的相等检查。
- PowerShell runner 信任 canonical validator 的版本授权结果，同时继续独立核对 runId 和 museum/case identity。

## Pipeline 2.13.16 改动摘要

- 隔离 runner 允许新阶段 header 使用已登记的续跑目标版本，但仍拒绝任意未授权版本。
- 同一续跑边界可跨连续补丁更新目标版本，并在 `run.json` 保留先前目标版本记录。

## Pipeline 2.13.15 改动摘要

- 新增显式 `--continue-from=<stage>` 补丁续跑模式；旧 run 可在内容规范未变化时使用新 pipeline 修复继续执行。
- 续跑边界之前的阶段只允许复用已有产物；任一上游产物缺失就停止并要求 owner 批准，不会自动全量重跑。
- `run.json` 记录来源版本、目标版本、续跑阶段和授权时间，保留跨补丁版本的执行来源。

## Pipeline 2.13.14 改动摘要

- 把图片解析改为四级顺序：官方 API/IIIF → Luna 官方页解析 → Wikidata/Commons → Luna 开放网络搜索。
- 加入 manifest-selected resolver、单作品 `--only-work`、最多 10 件的显式分批和不可变 parent run 因果链。
- 支持 `src/currentSrc`、lazy-load 属性、JSON-LD、IIIF、WebP VP8/VP8L 与 PNG 完整 magic；清理 URL 控制字符。
- 官方共享页面先做作品卡片绑定和身份评分，再去重图片；降低 logo、hero、banner 与通用图标权重。
- Commons fallback 支持精确文件和搜索 API；同一 URL 每批只抓取一次。
- 新增哈希门禁 promotion，只把完整、可靠、互不重复的作品图提升到正式数据。
- 将图片 promotion 登记为获批的非正文写入工具，使 authority gate 与冻结 release 的权限合同一致。
- Playwright 浏览器缺失时自动回退到已安装的 Chrome/Edge；显式 `MEOWSEUM_CHROME` 仍具有最高优先级。
- 身份已锁定的官方页图片若直链返回 403/429，自动按 clipped-container 合同抓取同一页面元素并保留完整 capture 证据。
- 页面重新导航后优先按已验证图片 URL 重新绑定元素，避免 cookie 或动态 DOM 令旧 selector 指向错误区域。
- 页面截图前关闭可识别的 cookie consent 层，防止固定遮罩覆盖已绑定作品图。
- 修复丹麦设计博物馆中英文馆名、作品标题标点合同、介绍结构和 warning 分级展示；小 warning 改为作品页可点击感叹号。
- 丹麦设计博物馆现有 20 件作品均已发布本地验证图片；正文、锁定元数据和图片来源保持分离。

## 发布结构

正式前端直接位于仓库根目录，只维护这一套实现，不保留独立 prototype renderer。新增博物馆必须走 canonical pipeline、独立人工审计、评分校准、统一数据层、首页入口和全部门禁；不能只让结构脚本通过就宣称内容合格。
