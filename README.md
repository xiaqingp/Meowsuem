# Meowseum

Meowseum 是一个中文博物馆旅行内容产品：先判断一座馆是否值得进入行程，再按馆藏密度用 20、30、40 或 60 件精选内容和三档路线帮助现场观看。

## 正式版本

- 范围：卢浮宫、大都会艺术博物馆、大英博物馆、埃及博物馆（解放广场）、阿尔罕布拉宫、新嘉士伯美术馆、木心美术馆、西雅图艺术博物馆、维也纳艺术史博物馆、江之浦测候所、Anchorage Museum、Getty Center、地中美术馆、丹麦国立美术馆、Frye Art Museum
- 内容：15 馆、500 个作品或现场节点、93 个章节（卢浮宫、大都会与大英各 60 件；维也纳艺术史博物馆与埃及博物馆各 40 件；阿尔罕布拉、新嘉士伯、丹麦国立美术馆与 Getty Center 各 30 项；西雅图、Frye、木心、江之浦、安克雷奇与地中美术馆各 20 项）
- 正式入口：`http://127.0.0.1:8094/`
- 状态：正式版本持续迭代；十五馆评分由 `ratings.js` 统一维护，内容标准迁移状态以 manifest 为准；西雅图范围仅含 downtown Seattle Art Museum，Getty 条目仅含 Getty Center，地中条目不并入直岛其他场馆

## 启动

在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1
```

默认监听 `0.0.0.0:8094`。如需换端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1 -Port 8095
```

## 发布候选验收

```powershell
node .\scripts\verify-project-authority.mjs
node .\scripts\verify-pipeline-causality.mjs
node .\scripts\verify-three-museums.mjs
node .\scripts\verify-content-quality.mjs --strict
node .\scripts\verify-significance-evidence.mjs
node .\scripts\verify-release-candidate.mjs
```

外部资源检查可另运行：

```powershell
node .\scripts\verify-release-candidate.mjs --live --quiet
```

馆方或 Wikimedia 对自动请求返回 403/429 时，脚本会标记为站点限制而不是错误；这些链接仍须在桌面浏览器验收。404、非图片响应等真实故障会阻止通过。

## 内容维护

- 唯一内容母指令：`research/meowseum-content-instruction.md`
- 唯一生成流程：`research/generation-pipeline.md`
- 内容项目入口与历史文件边界：`research/README.md`
- 内容版本和逐馆审核状态：`research/content-standard-manifest.json`
- 作品重要性迁移与硬门证据：`research/significance-evidence-v1.6.0.json`
- 评分唯一数据源：`ratings.js`
- 十五馆评分校准数据源：`ratings.js`（九馆基线审计只保留为历史证据）
- 十五馆共用渲染器：`museum.html` + `museum-app.js`
- 既有四馆逐件审计：`research/audits/legacy-four-content-audit-v1.0.1.md`
- 卢浮宫 60 件扩容审计：`research/audits/louvre-expansion-audit-v1.3.0.md`

新增博物馆时，从 `research/README.md` 进入，按 canonical pipeline 生成和独立人工审计，再加入评分校准集合、统一数据层与首页地图，最后执行全部门禁。不能只让结构脚本通过就宣称内容合格。

## 发布结构

正式前端直接位于仓库根目录，只维护这一套实现；不保留独立 prototype renderer。后续发布仍须先通过内容、结构、外链和桌面浏览器门禁。
