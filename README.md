# Meowseum

Meowseum 是一个中文博物馆旅行内容产品：先判断一座馆是否值得进入行程，再按馆藏密度用 20、30、40 或 60 件精选内容和三档路线帮助现场观看。

这份 README 是仓库的执行说明书。新增或修复博物馆时，从这里开始；具体内容标准、字段合同和冻结版本仍以“权威文件”一节列出的文件为准。

## 当前正式版本

- 范围：卢浮宫、大都会艺术博物馆、大英博物馆、埃及博物馆（解放广场）、阿尔罕布拉宫、新嘉士伯美术馆、木心美术馆、西雅图艺术博物馆、维也纳艺术史博物馆、江之浦测候所、Anchorage Museum、Getty Center、地中美术馆、丹麦国立美术馆、Frye Art Museum、丹麦设计博物馆（Designmuseum Danmark）
- 内容：16 馆、520 个作品或现场节点、99 个章节
- 当前 pipeline release：`2.13.12`
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

以下命令均在仓库根目录执行。先设置博物馆 ID，并创建不可复用的 production run：

```powershell
$museumId = "<museum-id>"
$run = node .\scripts\create-generation-run.mjs `
  --kind=production `
  --museum=$museumId `
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
- `--dry-run`：不执行各阶段，只报告哪些阶段将会运行。

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

```powershell
node .\scripts\verify-project-authority.mjs
node .\scripts\verify-pipeline-causality.mjs
node .\scripts\verify-three-museums.mjs
node .\scripts\verify-content-quality.mjs --strict
node .\scripts\verify-significance-evidence.mjs
node .\scripts\verify-release-candidate.mjs
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

## Pipeline 2.13.12 改动摘要

- 把图片解析改为四级顺序：官方 API/IIIF → Luna 官方页解析 → Wikidata/Commons → Luna 开放网络搜索。
- 加入 manifest-selected resolver、单作品 `--only-work`、最多 10 件的显式分批和不可变 parent run 因果链。
- 支持 `src/currentSrc`、lazy-load 属性、JSON-LD、IIIF、WebP VP8/VP8L 与 PNG 完整 magic；清理 URL 控制字符。
- 官方共享页面先做作品卡片绑定和身份评分，再去重图片；降低 logo、hero、banner 与通用图标权重。
- Commons fallback 支持精确文件和搜索 API；同一 URL 每批只抓取一次。
- 新增哈希门禁 promotion，只把完整、可靠、互不重复的作品图提升到正式数据。
- 将图片 promotion 登记为获批的非正文写入工具，使 authority gate 与冻结 release 的权限合同一致。
- 修复丹麦设计博物馆中英文馆名、作品标题标点合同、介绍结构和 warning 分级展示；小 warning 改为作品页可点击感叹号。
- 丹麦设计博物馆现有 20 件作品均已发布本地验证图片；正文、锁定元数据和图片来源保持分离。

## 发布结构

正式前端直接位于仓库根目录，只维护这一套实现，不保留独立 prototype renderer。新增博物馆必须走 canonical pipeline、独立人工审计、评分校准、统一数据层、首页入口和全部门禁；不能只让结构脚本通过就宣称内容合格。
