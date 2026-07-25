# M28.11 模型分流与生成输入减重审计

日期：2026-07-24  
目标版本：Pipeline 2.7.1 / 内容指令 2.1.0  
授权：`research/pipeline-changes/PCR-2026-07-24-05.json`

## 结果

- Scope 与无风险 standard research 使用 `gpt-5.6-terra` medium；候选、复杂 research、评分、结构和作者保持 `gpt-5.6-sol` medium。
- 模型只读取 run header、阶段母指令视图和当前阶段的语义材料；pipeline、manifest、PRD、TechDesign 和聊天记录不进入 prompt。
- 研究最多 10 件同复杂度一批，并发上限 4；作者并发上限 10，但每件输入、输出与哈希继续隔离。
- 评分与结构默认读取 `museum-work-index.json`；只有 `requiresFullCard: true` 的对象补完整研究卡。
- candidate packet 在模型调用前必须有官方身份锚点、官方对象 URL 和风险字段；缺失、非法或 standard / complex 混批由 runner 拒绝。
- 正式内容、前端文件和 8094 均未改动。
- `v2.7.1` release 独立封存 `modelRouting` 与 `stageInstructionViews`；`v2.7.0` 作为未包含这两项 release 元数据的不可覆盖前置版本保留。

## 指令输入减重

完整母指令为 57,610 bytes。阶段视图为：

| 阶段 | bytes | 比完整指令减少 |
|---|---:|---:|
| Scope | 17,199 | 70.1% |
| 候选 | 20,685 | 64.1% |
| Research | 22,462 | 61.0% |
| Selection | 23,046 | 60.0% |
| Structure | 10,348 | 82.0% |
| Author | 29,142 | 49.4% |

阶段视图是按章节号从同一母指令机械提取，不是第二份 prompt。

## 真实小样本

| 样本 | 模型 | 模型用时 | Token | 结果 |
|---|---|---:|---:|---|
| Vienna Scope 初测 | Terra medium | 17.5s | 9,933 | 失败：只复述容量规则；暴露 Scope 联网与交付合同缺口 |
| Vienna Scope 重测 | Terra medium | 49.9s | 22,271 | 通过：馆址边界、排除项、五个收藏群、容量、来源与不确定性齐全 |
| Met standard research 初测 | Terra medium | 72.8s | 22,954 | 失败：evidence 字段可自行改名，风险边界不清 |
| Met standard research 重测 1 | Terra medium | 90.8s | 46,514 | 失败：同名对象无藏品号，研究到另一件作品 |
| Met standard research 重测 2 | Terra medium | 76.0s | 21,936 | 通过：锁定 64.228.21；完整研究卡、空风险、固定 evidence schema 与全部 `[Rnn]` 引用通过 |
| Author 初测 | Sol medium | 92.6s | 58,261 | 失败：作者合同分散，旧结构与中文枚举被机械门拦截 |
| Author 重测 | Sol medium | 90.8s | 35,872 | 通过：正文结构、单段卡片、英文 valueType、紧凑引用正确；四个无歧义旧元数据别名由程序修复 |

真实模型测试共 7 次、217,741 token。失败样本全部保留；没有 reviewer、自动 retry、旧正文输入或 ad hoc 内容 prompt。

## 无模型回归

- 六阶段模型路由与错误 Scope 路由拦截通过。
- standard / complex research 预检、最大 10 件与同复杂度批次合同通过。
- 研究并发与作者并发上限、失败传播通过。
- 紧凑 evidence schema、风险一致性和未解析 `[Rnn]` 拒绝通过。
- 历史对象、现代绘画、古典绘画、工艺、建筑和钱币六类作者输入合同通过；每件保持单件隔离。
- 一件 standard research 已完整走通 `research_card -> author_bundle -> mechanical_processed`。

## 失败带来的 pipeline 修复

1. Scope 明确允许联网，并在母指令中集中定义馆址、收藏群、容量、来源和未知项。
2. 下游 evidence block 使用唯一 JSON schema；普通比较对象不自动等于 `rare_candidate`。
3. candidate packet 必须锁定 `identityAnchor` 与 `identitySourceUrl`，避免同名对象漂移。
4. 作者第 8 节集中定义三文件结构、英文 valueType、九个元数据字段和紧凑 claim 引用。
5. 只对语义完全确定的旧元数据别名和锁定 `imagePolicy` 做程序修复；其他缺失继续阻塞。
