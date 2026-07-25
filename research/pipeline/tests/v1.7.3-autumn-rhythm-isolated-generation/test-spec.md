# 《秋韵：第 30 号》1.7.3 隔离生成测试

## 目的

测试当前内容规范能否在一次隔离作者生成中同时做到：首要价值优先、所有论点有研究卡依据、抽象艺术评论词被拆成可见机制、对象专属 `fun fact` 自然进入讲解而不成为固定栏目。

## 固定边界

- 只读取 run header、当前 canonical 内容指令、当前 canonical pipeline 和本目录的 `research-card.md`。
- 禁止读取对话、memory、skills、网络、生产页面、旧《秋韵》研究卡、旧 source pack、旧写作计划、旧卡片、旧草稿、旧 review、其他作品目录或任何未列路径。
- 模型固定为 `gpt-5.6-sol`，`reasoning effort: medium`。
- 只执行一次 author pass；不传反馈，不 retry，不启动 author review 或 independent reviewer。
- 只生成 `writing-plan.json`、`card.txt`、`draft.md`；产物是未审首稿，不得发布或标为 PASS。

## 首稿合同

- `writing-plan.json` 必须有 `primaryValueSelection`、`quickLayerPromise`、单一核心问题、逐步认知链和覆盖全部正文断言的 `claimLedger`。
- `30 秒先懂` 先解释本作最值得理解的艺术机制与意义，再用具体可见证据确认；不虚构观众动作、看法或误解。
- “控制、节奏、成熟、表现力”等词若出现，必须立即拆成控制了什么、哪里看得见、产生什么效果；优先使用可见事实。
- 至少选择一条研究卡中明确标为可用于本作的 `fun fact`，自然放入最相关的因果段落；不得单设机械趣闻栏目，也不得使用研究卡明确禁止移植的轶事。
- `card.txt` 为独立点击理由，不复写快层，不用观看命令开头。
- 完整处理地面作画、材料流动、身体移动、画面疏密与覆盖、1950 年创作位置、真实比较对象和“重要藏品”边界。
- 使用自然、简明、有层次的中文；顾爷式方法体现为重点选择、因果解释、具体细节和恰当的真实反差。
