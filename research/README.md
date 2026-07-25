# Meowseum 内容与生成权威入口

> Status: Canonical project entrypoint  
> Updated: 2026-07-23

任何新增、重写、审核或自动化任务都从本文件开始。对话记录只解释决策来历，不是运行时输入。

## 必须读取

| 顺序 | 文件 | 唯一职责 |
| --- | --- | --- |
| 1 | `coho_museum/PRD.md` | 产品范围、馆数、容量、用户可见要求 |
| 2 | `research/meowseum-content-instruction.md` | 内容声音、选品、评分与作品质量标准 |
| 3 | `research/generation-pipeline.md` | 从研究到发布的唯一生成流程与状态机 |
| 4 | `research/content-standard-manifest.json` | 当前版本、逐馆状态、迁移与批次状态 |
| 5 | `coho_museum/TechDesign.md` | 页面、数据、渲染和发布门禁 |

冲突时先停下，不自行挑选较新的说法：产品范围以 PRD 为准，写作质量以内容母指令为准，执行顺序以生成流程为准，实际馆状态以 manifest 为准，前端字段与发布方式以 TechDesign 为准。修正冲突后才能生成。

当前 pipeline、内容指令、reviewer 状态和 release 路径只从 `research/content-standard-manifest.json` 读取。release 文件只冻结实际 canonical 文件哈希，不增加写作规则；旧 release 保留为历史证据。

## 只作证据，不作指令

- `research/style-study/`：顾爷样本观察与形成方法的证据。
- `research/generation-tests/`：历次校准、失败稿和评估记录。
- `research/audits/`：特定版本、特定场馆的审计证据。
- `coho_museum/archive/`：完整项目历史与决策过程；默认任务不读取。
- `research/content-method-v2.md`：历史研究记录；不得覆盖当前母指令。

## 历史内容文件

页面与 manifest 都没有引用的旧版本、prototype、test、draft、failed 文件只用于比较或追溯。它们不得作为新稿底稿，也不得被构建脚本读取。当前正式正文只认 manifest 的 `museums.*.contentFile`，且必须与前端 `contentFile` 一致。

## 禁止的捷径

- 不从对话记忆补齐未写入仓库的规则。
- 不从旧正文、卡片字段或研究卡拼接新正文。
- 不因最终文件齐全就倒推生成顺序正确。
- 不把旧版通过记录当成当前版本的黑盒验证。
- 不在整个博物馆上试错；先通过流程夹具，再做两件作品的隔离测试。

运行 `node scripts/verify-project-authority.mjs` 可检查当前权威入口、正式内容引用和退休脚本边界。

馆级评分在写馆介和逐件正文前由 `scripts/process-museum-rating.mjs` 检查证据表、档位、档内锚点、独立珍品线和重复计数；失败时不得继续下游。
