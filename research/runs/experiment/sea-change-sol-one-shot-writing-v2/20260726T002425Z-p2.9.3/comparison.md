# 《海变》One-shot Search & Write v2 成本对照

| 指标 | 旧流程 | One-shot v2 |
| --- | ---: | ---: |
| 模型 | Sol Medium | Sol Medium |
| 触及本作的调用 | 2（Research 与 9 件共享） | 1 |
| Research token | 190,910 / 10 件；均摊 19,091 | 不适用 |
| Author token | 34,079 | 不适用 |
| 可比总 token | 53,170 | 152,083 |
| Research Card bytes | 6656 | 0 |
| Writing Plan bytes | 9026 | 0 |
| Card bytes | 469 | 605（adapter） |
| Article / Draft bytes | 4461 | 4278 |
| Sources bytes | unavailable | 2084 |
| 搜索次数 | unavailable | 4 |
| 来源数量 | unavailable | 4 |
| 可比模型耗时 | 142.1 秒 | 84.8 秒 |
| 机械验证 | production accepted | passed |

旧 Research 是覆盖 10 件作品的共享调用；公平单件口径采用 Research token 和时间的十分之一，再加本件独立 Author。完整共享 Research 调用仍保留在 comparison.json，不把它全部算给《海变》。

本实验只比较流程差异，没有更换模型、reasoning effort 或作品。新稿质量留给人工对照，不由 Codex 自动宣布优劣。
