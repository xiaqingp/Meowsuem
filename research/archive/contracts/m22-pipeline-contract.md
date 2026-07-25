# M22 内容管线合同（历史版本）

> Superseded by `research/generation-pipeline.md` v2.0.0 on 2026-07-22.  
> 本文件只保留 M22 当时的批量研究 / 单件写作合同，不再作为未来生成入口。

目标：批量准备事实，逐件独立写作，批量执行机械检查。

1. 研究包每批最多 10 件，只包含身份、事实、比较对象、观察线索、来源与不确定性，不得包含可直接发布的正文。
2. 一个写作任务只能引用一件作品。它读取 manifest 指向的当前母指令，并为该作品分别交付 `cardSummary` 与一节完整的详情 Markdown；两者必须独立写作，卡片回答“为什么值得点开”，详情回答“为什么值得看 + 怎么看”，不得互相摘句或复用字段。
3. v1.6.1 起，单件任务写正文前必须提交 `readerStartingPoint`、唯一 `narrativeQuestion`、三至六步 `logicSequence`、可为空的 `humorBasis` 和 `falsePremisesToAvoid`。v1.6.2 起还必须提交三至六条 `claimBoundaryPlan`。v1.6.3 起，访客正文在事实边界段之外最多保留一处完整的否定—转折骨架。v1.6.4 起，任务还必须提交 `quickLayerPlan.visibleTension / provisionalAnswer / viewingRoute`，`logicSequence` 的每一步改为 `discovery / changesUnderstanding / thereforeNext`；成稿后另交 `narrativeReview`，逐段记录依赖、认知变化和提前移动会破坏的前提。v1.6.5 起，同一 review 必须包含 `highRiskClaimReview` 与空的 `unplannedHighRiskClaims`，逐句关闭人物心理、历史先后、图像寓意、仪式用途、作者意图、最高级和不可替代性。v1.6.6 起，每条高风险 review 还必须记录 `confidence`；初始资料包不是封闭书目，计划外判断应先补研究卡，再按断言强度决定保留、限定或删除。v1.6.7 起，价值依赖历史变化的作品必须提交 `historicalContextPlan`；每份 review 必须提交中文母语审读 `oneBreathParaphrase / translationeseFindings / readAloudVerdict`。这些是写作计划和审读记录，不是可发布句子；作者风格、历史、比较与重要性必须进入同一逻辑链。
4. 作品之间不得共享开头、段落、事实边界或结尾；研究包的批次不能成为写作章节或句式模板。
5. 图片、URL、结构、卡片/详情分离、重复句法、假纠错风险与页面渲染由程序批量检查；只有失败作品返回写作阶段。程序不能替代人工判断逻辑是否真正连贯。
6. 试点必须记录研究批次、独立写作任务数、失败返工数、逐篇 `narrativeReview` 与浏览器结果。没有实际指标，不得声称节省 token。
7. 完成整馆集成后，博物馆数据必须声明 `cardCopyContract: "independent-v1"`；只有卡片与详情两个交付物分别通过内容审查后才能声明，不能因最终文字不完全相同而倒推“独立写作”。
8. 每座馆必须维护 `contentUpdatedAt`（`YYYY-MM-DD`），表示访客可见内容最后一次完成编辑或事实核验的日期；样式、缓存版本和纯代码调整不得刷新该日期。
