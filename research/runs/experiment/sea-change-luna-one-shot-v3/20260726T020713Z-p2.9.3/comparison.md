# 《海变》One-shot v3 三组成本对照

| 指标 | 旧 production 流程 | Sol Medium One-shot v2 | Luna High One-shot v3 |
| --- | ---: | ---: | ---: |
| 模型 | gpt-5.6-sol | gpt-5.6-sol | gpt-5.6-luna |
| reasoning effort | medium | medium | high |
| 调用次数 | 2（Research 与 10 件共享） | 1 | 1 |
| input tokens | unavailable | 149,435 | 60,774 |
| cached input tokens | unavailable | 93,440 | 31,232 |
| reasoning tokens | unavailable | 460 | 1,250 |
| output tokens | unavailable | 2,648 | 3,095 |
| total tokens | 53,170（单件均摊） | 152,083 | 63,869 |
| 搜索次数 | unavailable | 4 | 2 |
| 来源数量 | unavailable | 4 | 2 |
| 运行时间 | 142.1 秒（单件均摊） | 84.8 秒 | 63.4 秒 |
| article bytes | 4,461 | 4,278 | 5,156 |
| 机械验证 | production accepted | passed | failed |

口径说明：

- 旧 Research 是覆盖 10 件作品的共享调用；旧流程 total tokens 使用 Research 均摊加本件 Author，无法还原 input / cached / reasoning / output 明细。
- One-shot 的 input tokens 是一次 Codex turn 内全部工具循环的累计输入，不是首次静态 prompt 的大小。
- cached input tokens 是 input tokens 的子集，没有再次加进 total tokens。
- 表中只记录内容实验自身的 Codex exec usage，不包含外层 Codex 编写、运行或检查实验代码的成本。
