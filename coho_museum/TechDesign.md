# Meowseum 技术设计

## Authority

- 产品范围：`coho_museum/PRD.md`
- 内容标准：`research/meowseum-content-instruction.md`
- 生成流程：`research/generation-pipeline.md`
- 当前版本、release、馆状态：`research/content-standard-manifest.json`
- 评分运行时真源：`ratings.js`
- 历史设计：`coho_museum/archive/TechDesign-through-M28.1.md`

当前版本号不得复制到本文件；所有工具动态读取 manifest。

## Runtime architecture

- 静态前端：`index.html`、`museum.html`、`museum-app.js`、`museums.js`、`routes.js` 和各馆数据 JS。
- `museum-app.js` 是唯一馆页与作品详情渲染器；不建立馆专用渲染器。
- 本地服务使用 `scripts/serve.mjs`，默认监听 `0.0.0.0:8094`。
- 首页排名读取 `ratings.js`；地图和馆页读取同一馆身份与评分数据。

## Data contract

- Museum：稳定 `id`、中英名、城市/国家、坐标、封面、评分、理由、容量、章节、路线、更新时间、正式内容文件；行动文案和限制可以保留为内部数据，但馆页主卡不渲染。
- Work：馆内唯一 `id`、稳定 URL、双语名、作者/文化、国家/地区、年代、图片、优先级、重要性、独立卡片简介和详情锚点。
- `research/content-standard-manifest.json` 注册每馆正式 `contentFile`；前端引用必须一一对应。
- 历史稿、测试稿、失败稿和 pipeline artifact 不得成为前端正式内容源。

## Content flow

```text
museum scope and selection
  -> verified image evidence (browser; Luna medium only for ambiguity)
  -> research cards (up to 10 per research context)
  -> museum evidence and rating
  -> deterministic rating gate
  -> one author bundle per work
  -> mechanical processing
  -> museum integration
  -> data/image/URL/browser verification
  -> atomic publication
```

- 唯一模型入口：`scripts/run-isolated-generation.ps1`。
- 标准调用固定为非交互 PowerShell，runner 自动推导项目根目录；整馆结束后由 `scripts/report-museum-generation.mjs` 汇总真实用时与 token，缺少模型计量即阻断完成。
- 整馆本地结构门始终全站执行；联网图片、来源、珍贵度与发布状态按当前馆执行。候选由 `scripts/publish-museum-candidate.mjs` 根据 `publication.json` 暂存、发布、更新缓存键并在失败时回滚。
- 内容生成与网站装配以 `assembly-input.json` 为边界。`scripts/assemble-museum-candidate.mjs` 是唯一候选装配器；馆专用 builder 不再属于正式 pipeline。`scripts/finalize-museum.mjs` 依次执行装配、验证和 dry-run / 发布并记录零模型成本。
- Manifest 中现有 15 馆保留为 legacy baseline。未来新馆只采用 `museumData.<id>` 运行时赋值，并在 assembly 输入中提供地图坐标；装配器自动生成包含新馆脚本、地图坐标与排名注册的候选 `index.html` / `museum.html`。`scripts/verify-future-museum-contract.mjs` 在发布门之前机械检查绑定、加载顺序、页面注册与禁用馆专用 builder，避免依赖人工记忆或逐馆代码。
- `scripts/freeze-pipeline-release.mjs` 只根据 manifest 写入 release 哈希锁，不接触博物馆正文。
- author bundle 一次生成 `writing-plan.json`、`card.txt` 和 `draft.md`。
- author prompt 只允许一份内容指令、一份本件研究卡、一份本件 `work_context` 和可选的一份研究补充；runner 按角色、数量和总字节上限拒绝整馆计划、pipeline 全文、审计记录及其他作品材料。
- 所有生成阶段只读取 manifest 声明的母指令章节视图，不读取 pipeline、manifest 或项目管理全文。Scope 与 standard research 使用 Terra medium；候选、复杂研究、评分、结构和作者保持 Sol medium。
- candidate packet 在模型启动前必须锁定官方身份锚点和风险字段；研究最多 10 件同复杂度一批，研究并发 4、作者并发 10。评分与结构默认读取 `museum-work-index.json`，仅按 `requiresFullCard` 定向补完整卡。
- 新生成馆可在作品对象内直接携带 `significance` 与 `preciousWhy`；`museums.js` 的集中映射只为旧馆提供覆盖和兼容，不再是唯一数据源。
- `scripts/process-museum-rating.mjs` 在馆介、路线和逐件正文之前校验珍品证据、档位、档内锚点、独立珍品线与父子重复计数；失败时停止下游。
- `writing-plan.json.displayMetadata` 映射统一作品数据与标题区 / 侧栏；`draft.md` 只承载作品标题后的讲解正文，并直接从“30 秒先懂”开始。集成不得把两层重新拼成正文段落。
- reviewer 默认停用；启停状态读取 manifest。
- 机械处理只分提示、确定性程序修复和 blocker；不因小型风格警告调用模型。
- 运行时和构建脚本只搬运已批准正文，不创作或改写正文。
- 图片证据在研究前生成：以题名、作者／文化、年代、馆藏机构、馆藏号和官方对象页组成身份包，普通 HTTP 与开放接口失败时使用真实浏览器解析动态对象页并下载主图。机械信号冲突时才把最多五张候选交给隔离的 Luna medium；模型只选择、拒绝或标记歧义。成功结果保存直接 URL、本地文件、尺寸、类型、哈希、摄影／许可和证据 ID，供研究与组装共同读取。组装不再重新联网找图；旧 run 可保留 legacy fallback。
- Pipeline canonical 文件只能通过 owner 明确授权的版本化 change record 修改；release 冻结器比较基础 release、授权文件范围与当前哈希，越界变更直接失败；同一版本首次冻结后不可覆盖。

## Verification

- `node scripts/verify-project-authority.mjs`
- `node scripts/verify-pipeline-causality.mjs`
- `powershell -File scripts/test-run-isolated-generation.ps1`
- `node scripts/test-museum-generation-report.mjs`
- `node scripts/test-publish-museum-candidate.mjs`
- `node scripts/test-future-museum-contract.mjs`
- `node scripts/freeze-pipeline-release.mjs --self-test`
- `node scripts/verify-content-pipeline.mjs`
- `node scripts/test-museum-rating-gate.mjs`
- `node scripts/test-prepare-museum-stage-inputs.mjs`
- `node scripts/test-run-generation-batch.mjs`
- `node scripts/test-author-input-regression.mjs`
- 受影响馆的数据、图片、URL、结构和浏览器深链检查

测试按影响范围选择；pipeline 管理变更不重跑整馆内容，整馆内容变更不省略该馆真实页面检查。

## Publication safety

- 旧正式馆保持可用，候选馆在独立 artifact 中完成。
- 只有整馆数据、正文、图片、路线和页面共同通过后才原子替换。
- Owner 明确批准的既有作品补丁可以按作品发布，但卡片与详情必须同批替换，作品须完整通过当前单件状态机，并对每个受影响馆运行数据、图片、URL 与真实页面回归；未获批准时仍按整馆原子边界处理。
- 外部图片主机的 403/429 与资源本身损坏分开判断。
- M26 自动重生状态以 manifest 和自动任务配置为准；暂停时保留真实进度，不回滚、不伪装完成。
