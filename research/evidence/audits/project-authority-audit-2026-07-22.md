# Meowseum 项目权威与 pipeline 审计

> Date: 2026-07-22  
> Scope: 项目文件、需求一致性、内容权威、构建边界、manifest、测试与自动批次  
> Product content changed: No

## 结论

项目的前端产品数据确实是 15 馆、500 项，但项目说明层长期同时存在九馆、十一馆和十五馆口径；内容层虽然有唯一母指令，执行过程仍依赖对话和长自动化 prompt。M22 只验证最终 artifact 字段，无法证明先研究再写作。旧内容版本和最后一个可写正文的构建脚本仍处于容易被误用的位置。

本轮已把产品、内容、流程、状态和技术拆成五个唯一真源；没有重写任何正式馆内容，也没有恢复 M26。

## 文件分级

| 类别 | 文件 | 处理后状态 |
| --- | --- | --- |
| 项目入口 | `research/README.md` | 新增；未来任务必须从这里开始 |
| 产品范围 | `coho_museum/PRD.md` | 修正九馆摘要与验收，当前为 15 馆 / 500 项 |
| 内容质量 | `research/meowseum-content-instruction.md` | 保持 v1.6.7；顾爷研究成果与用户迭代仍在，流程细节指向独立 pipeline |
| 生成执行 | `research/generation-pipeline.md` | v2.0.3；状态机、上游哈希、批量边界、最小上下文、独立 reviewer、共享事前门槛与更新后强制回归 |
| 当前状态 | `research/content-standard-manifest.json` | 加入 canonical pipeline；旧测试降为历史；M26 标记暂停；Frye 不再冒充因果验证 |
| 技术实现 | `coho_museum/TechDesign.md` | 修正十一馆残留和卢浮宫 build 特例，当前为十五馆单渲染器 |
| 使用说明 | `README.md` | 补齐 SMK 与 Frye，修正十五馆口径并增加权威 / 因果门 |
| 历史方法 | `research/content-method-v2.md`、`research/m22-pipeline-contract.md` | 明确为历史证据，不再是执行入口 |
| 历史正文 | Louvre prototype/test/v3/扩容片段、Vienna v1、Egyptian v1 | 顶部标记 RETIRED；正式引用只认 manifest |
| 构建脚本 | `scripts/build-*.mjs` | 全部只报错退出；无脚本获准写内容 Markdown |

## 发现并修正的不一致

1. PRD 顶部写九馆，后部验收写十五馆；已统一。
2. TechDesign 总述写十五馆，但架构、URL、评分与浏览器门仍写十一馆；已统一。
3. README 范围清单只有十三馆，却宣称十五馆；已补 SMK 与 Frye。
4. M26 手写队列漏 Frye，而 manifest 有十五馆；里程碑改为只认 manifest 队列。
5. manifest 把 Las Meninas v1.0.1 与木心全馆 v1.0.1 写成当前“passed”；已降为历史通过，不能证明 v1.6.7 / pipeline v2。
6. Frye 的 artifact 是正文完成后回填，却写成 M22 因果生成；已改为真实来源说明。
7. `build-louvre-v4.mjs` 是唯一仍能覆盖正文的脚本；已退休，管线门批准清单为空。
8. 内容母指令写“批量写其余作品”，容易被解释为多件正文同 prompt；现明确为研究可批量、作品 artifact 逐件，且逐件不等于每件新模型会话。

## 当前已知但未在本轮修复的产品债务

- `verify-three-museums.mjs` 当前仍报告 Glyptotek、Seattle、The Met 的 legacy work contract 缺字段。
- release candidate 当前被 168 个 `significance audit pending` 阻断。
- Manifest 仍正确显示多馆 `in_audit` 或 `pending_full_audit`；本轮没有把历史产品内容虚假升级为当前合规。
- M26 的 Louvre 只完成 10/60 研究卡与 1 件通过稿，正式 Louvre 页面没有被替换。

## 验证

- `verify-project-authority.mjs`：15 个 manifest 正式正文与前端引用一致；8 个高风险历史入口有退休标记。
- `verify-content-pipeline.mjs`：无脚本可以生成或覆盖正式正文。
- `verify-pipeline-causality.mjs`：合法链通过；正文早于计划且 review 回填错误哈希的 backfill 链被拒绝。
- 两件隔离内容诊断：v2.0.0 与 v2.0.1 失败，v2.0.2 两个定向快层经独立 reviewer 通过；详见 `research/pipeline-tests/pipeline-v2-validation.md`。M26 在 owner 明确批准前继续暂停。
